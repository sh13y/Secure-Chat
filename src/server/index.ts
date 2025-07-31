import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Message } from '../shared/types.js';
import { EncryptionService } from '../shared/encryption.js';
import { User } from './models/User.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const users = new Map<string, WebSocket>();

// Connect to MongoDB with error handling and retry logic
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('MongoDB connection string is not defined in environment variables');
      console.error('Please create a .env file with MONGODB_URI=your_connection_string');
      // Retry connection after 10 seconds
      setTimeout(connectDB, 10000);
      return;
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Retry options
      retryWrites: true,
      retryReads: true,
      // Connection pool options
      maxPoolSize: 10,
      minPoolSize: 1,
      // TLS options for MongoDB Atlas (modern syntax)
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });
    
    console.log('Successfully connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Retry connection after 10 seconds with exponential backoff
    setTimeout(connectDB, 10000);
  }
};

// Initialize database connection
connectDB();

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected! Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
  // Don't call connectDB here as it might cause infinite loops
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established successfully');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

// Add message model interface
interface IMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
  read: boolean;  // Add read status
}

// Message Schema with proper types
const messageSchema = new mongoose.Schema<IMessage>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  encrypted: { type: Boolean, default: true },
  read: { type: Boolean, default: false }  // Add read field
});

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = new User({ username, password });
    await user.save();
    
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'Registration successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users endpoint
app.get('/users/search', async (req, res) => {
  try {
    const searchTerm = req.query.username as string;
    const isExact = req.query.exact === 'true';
    
    const query = isExact 
      ? { username: searchTerm }  // Exact match
      : { username: { $regex: searchTerm, $options: 'i' } };  // Partial match (keeping for backwards compatibility)
      
    const users = await User.find(query).select('username -_id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user messages
app.get('/messages/:userId', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    
    const messages = await MessageModel.find({
      $or: [
        { senderId: decoded.username, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: decoded.username }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const userList = await User.find().select('username -_id');
    res.json(userList);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add delete message endpoint
app.delete('/messages/:messageId', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    
    const message = await MessageModel.findById(req.params.messageId).lean();
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const { senderId, receiverId } = message;

    // Only allow deletion if user is the sender
    if (senderId !== decoded.username) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Use deleteOne for better performance
    const result = await MessageModel.deleteOne({ _id: req.params.messageId });
    
    if (result.deletedCount === 1) {
      // Notify users about deleted message through WebSocket
      const senderWs = users.get(senderId);
      const receiverWs = users.get(receiverId);
      
      const deleteNotification = JSON.stringify({
        type: 'messageDeleted',
        messageId: req.params.messageId
      });

      if (senderWs) senderWs.send(deleteNotification);
      if (receiverWs) receiverWs.send(deleteNotification);
      
      res.status(200).json({ message: 'Message deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete message' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add delete chat endpoint
app.delete('/chats/:username', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    
    // Delete all messages between these two users
    const result = await MessageModel.deleteMany({
      $or: [
        { senderId: decoded.username, receiverId: req.params.username },
        { senderId: req.params.username, receiverId: decoded.username }
      ]
    });

    // Notify both users about chat deletion through WebSocket
    const user1Ws = users.get(decoded.username);
    const user2Ws = users.get(req.params.username);
    
    const deleteNotification = JSON.stringify({
      type: 'chatDeleted',
      users: [decoded.username, req.params.username]
    });

    if (user1Ws) user1Ws.send(deleteNotification);
    if (user2Ws) user2Ws.send(deleteNotification);

    res.status(200).json({ 
      message: 'Chat deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message counts for all users
app.get('/messages/unread/counts', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    
    // Aggregate unread messages by sender
    const unreadCounts = await MessageModel.aggregate([
      {
        $match: {
          receiverId: decoded.username,
          read: false
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      }
    ]);

    const countsMap = Object.fromEntries(
      unreadCounts.map(({ _id, count }) => [_id, count])
    );
    
    res.json(countsMap);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
app.post('/messages/read/:userId', async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    
    // Update all unread messages from this sender to this receiver
    await MessageModel.updateMany(
      {
        senderId: req.params.userId,
        receiverId: decoded.username,
        read: false
      },
      { read: true }
    );

    // Notify sender that messages have been read
    const senderWs = users.get(req.params.userId);
    if (senderWs) {
      senderWs.send(JSON.stringify({
        type: 'messagesRead',
        reader: decoded.username
      }));
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function broadcastUserList() {
  const userList = Array.from(users.keys());
  const message = JSON.stringify({ type: 'users', users: userList });
  for (const client of users.values()) {
    client.send(message);
  }
}

interface WSMessage {
  type: 'register' | 'message';
  username?: string;
  content?: string;
  receiverId?: string;
}

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  let username = '';

  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString()) as WSMessage;

      if (message.type === 'register' && message.username) {
        username = message.username;
        users.set(username, ws);
        broadcastUserList();
      } else if (message.type === 'message' && message.receiverId && message.content && username) {
        const receiverId: string = message.receiverId;
        const chatMessage = {
          id: uuidv4(),
          senderId: username,
          receiverId,
          content: EncryptionService.encryptMessage(
            message.content,
            username,
            receiverId
          ),
          timestamp: Date.now(),
          encrypted: true,
          read: false  // Add read status
        };

        // Save message to MongoDB
        const savedMessage = await new MessageModel({
          senderId: chatMessage.senderId,
          receiverId: chatMessage.receiverId,
          content: chatMessage.content,
          timestamp: chatMessage.timestamp,
          encrypted: chatMessage.encrypted,
          read: chatMessage.read
        }).save();

        chatMessage.id = savedMessage.id;

        // After saving the message, get updated unread counts for the receiver
        const unreadCounts = await MessageModel.aggregate([
          {
            $match: {
              receiverId: receiverId,
              read: false
            }
          },
          {
            $group: {
              _id: '$senderId',
              count: { $sum: 1 }
            }
          }
        ]);

        const countsMap = Object.fromEntries(
          unreadCounts.map(({ _id, count }) => [_id, count])
        );

        // Send message to both sender and receiver
        const senderWs = users.get(username);
        const receiverWs = users.get(receiverId);
        
        // Send message to sender (for immediate display)
        if (senderWs) {
          senderWs.send(JSON.stringify(chatMessage));
        }
        
        // Send message to receiver
        if (receiverWs) {
          receiverWs.send(JSON.stringify(chatMessage));
          
          // Also send updated unread counts
          receiverWs.send(JSON.stringify({
            type: 'unreadCounts',
            counts: countsMap
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    if (username) {
      users.delete(username);
      broadcastUserList();
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});