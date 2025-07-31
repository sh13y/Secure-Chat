import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, User, AuthResponse } from '../shared/types';
import { EncryptionService } from '../shared/encryption';
import './App.css';

interface ContextMenu {
  x: number;
  y: number;
  messageId?: string;
  chatUsername?: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const App: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('username'));
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection and message handling
  useEffect(() => {
    if (currentUser) {
      const socket = new WebSocket('ws://localhost:3001');
      setWs(socket);

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({ type: 'register', username: currentUser }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'users') {
            setUsers(data.users.filter((user: string) => user !== currentUser));
          } else if (data.type === 'messageDeleted') {
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== data.messageId));
          } else if (data.type === 'chatDeleted') {
            if (data.users.includes(currentUser)) {
              const otherUser = data.users.find((u: string) => u !== currentUser);
              if (selectedUser === otherUser) {
                setMessages([]);
                setSelectedUser(null);
              }
              setUsers(prevUsers => prevUsers.filter(u => u !== otherUser));
            }
          } else if (data.type === 'unreadCounts') {
            setUnreadCounts(data.counts);
          } else if (data.type === 'messagesRead') {
            if (data.reader === selectedUser) {
              setMessages(prevMessages => 
                prevMessages.map(msg => ({
                  ...msg,
                  read: true
                }))
              );
            }
          } else if (data.senderId && data.receiverId) {
            // Handle incoming messages
            console.log('Processing message:', { 
              senderId: data.senderId, 
              receiverId: data.receiverId, 
              currentUser, 
              selectedUser,
              messageId: data.id 
            });
            
            const decryptedMessage = {
              ...data,
              content: EncryptionService.decryptMessage(
                data.content,
                data.senderId,
                data.receiverId
              )
            };
            
            // Only add message if it's for the current chat or if we're the receiver
            if (data.senderId === selectedUser || data.receiverId === selectedUser || data.receiverId === currentUser || data.senderId === currentUser) {
              console.log('Adding message to chat:', decryptedMessage);
              setMessages(prev => {
                // Check if message already exists to prevent duplicates
                const messageExists = prev.some(msg => msg.id === data.id);
                if (messageExists) {
                  console.log('Message already exists, skipping');
                  return prev;
                }
                console.log('Adding new message to chat');
                return [...prev, decryptedMessage];
              });
            } else {
              console.log('Message not for current chat, skipping');
            }
            
            // If we're the receiver and viewing the chat, mark as read
            if (data.receiverId === currentUser && selectedUser === data.senderId) {
              markMessagesAsRead(data.senderId);
            } else if (data.receiverId === currentUser) {
              // Update unread count for this sender
              setUnreadCounts(prev => ({
                ...prev,
                [data.senderId]: (prev[data.senderId] || 0) + 1
              }));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        socket.close();
      };
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data: AuthResponse = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        setToken(data.token);
        setCurrentUser(username);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Connection error. Please try again.');
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear search results when input is empty
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    // Only search when the value exactly matches a username
    try {
      const response = await fetch(`http://localhost:3001/users/search?username=${value}&exact=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUser || !token) return;
    
    try {
      const response = await fetch('http://localhost:3001/messages/unread/counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const counts = await response.json();
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const markMessagesAsRead = async (userId: string) => {
    try {
      await fetch(`http://localhost:3001/messages/read/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update unread counts locally
      setUnreadCounts(prev => ({ ...prev, [userId]: 0 }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };



  // Modify selectUser to mark messages as read when selecting a chat
  const selectUser = async (username: string) => {
    setSelectedUser(username);
    setSearchTerm('');
    setSearchResults([]);

    try {
      const response = await fetch(`http://localhost:3001/messages/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const messages = await response.json();
      setMessages(messages.map((msg: Message) => ({
        ...msg,
        content: EncryptionService.decryptMessage(msg.content, msg.senderId, msg.receiverId)
      })));
      
      // Mark messages from this user as read
      await markMessagesAsRead(username);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !ws || !newMessage.trim()) {
      console.log('Cannot send message:', { selectedUser, ws: !!ws, message: newMessage.trim() });
      return;
    }

    const messageData = {
      type: 'message',
      content: newMessage,
      receiverId: selectedUser
    };

    console.log('Sending message:', messageData);
    
    try {
      ws.send(JSON.stringify(messageData));
      console.log('Message sent successfully');
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setCurrentUser(null);
    setSelectedUser(null);
    setMessages([]);
    if (ws) {
      ws.close();
    }
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.context-menu')) {
        closeContextMenu();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [closeContextMenu]);

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const deleteMessage = async (messageId: string) => {
    showConfirmDialog(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`http://localhost:3001/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.ok) {
            setMessages(messages.filter(msg => msg.id !== messageId));
          }
        } catch (error) {
          console.error('Error deleting message:', error);
        }
        closeConfirmDialog();
        closeContextMenu();
      }
    );
  };

  const deleteChat = async (chatUsername: string) => {
    showConfirmDialog(
      'Delete Chat',
      `Are you sure you want to delete all messages with ${chatUsername}? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`http://localhost:3001/chats/${chatUsername}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.ok) {
            if (selectedUser === chatUsername) {
              setMessages([]);
              setSelectedUser(null);
            }
            // Remove deleted user from users list if they're not online
            setUsers(prevUsers => prevUsers.filter(u => u !== chatUsername));
          }
        } catch (error) {
          console.error('Error deleting chat:', error);
        } finally {
          closeConfirmDialog();
          closeContextMenu();
        }
      }
    );
  };

  const handleContextMenu = (e: React.MouseEvent, messageId?: string, chatUsername?: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId,
      chatUsername
    });
  };

  const renderConfirmDialog = () => {
    if (!confirmDialog.isOpen) return null;

    return (
      <div className="confirm-dialog-overlay">
        <div className="confirm-dialog">
          <h3>{confirmDialog.title}</h3>
          <p>{confirmDialog.message}</p>
          <div className="confirm-dialog-buttons">
            <button className="cancel-btn" onClick={closeConfirmDialog}>
              Cancel
            </button>
            <button 
              className="confirm-btn" 
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirmDialog();
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUsersList = () => (
    <div className="users-container">
      {users.map(user => (
        <div
          key={user}
          className={`user-item ${selectedUser === user ? 'selected' : ''}`}
          onClick={() => selectUser(user)}
          onContextMenu={(e) => handleContextMenu(e, undefined, user)}
        >
          <span className="user-name">{user}</span>
          {unreadCounts[user] > 0 && (
            <span className="unread-count">{unreadCounts[user]}</span>
          )}
        </div>
      ))}
    </div>
  );

  const renderContextMenu = () => {
    if (!contextMenu) return null;

    return (
      <div
        className={`context-menu ${contextMenu.chatUsername ? 'right-menu' : ''}`}
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        {contextMenu.messageId && (
          <div
            className="context-menu-item dangerous"
            onClick={() => deleteMessage(contextMenu.messageId!)}
          >
            Delete Message
          </div>
        )}
        {contextMenu.chatUsername && (
          <div
            className="context-menu-item dangerous"
            onClick={() => deleteChat(contextMenu.chatUsername!)}
          >
            Delete Chat History
          </div>
        )}
      </div>
    );
  };

  // Add this effect after the existing WebSocket effect
  useEffect(() => {
    if (currentUser && token) {
      // Fetch initial unread counts
      fetchUnreadCounts();

      // Set up polling for unread counts every 30 seconds
      const interval = setInterval(fetchUnreadCounts, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser, token]);

  if (!token || !currentUser) {
    return (
      <div className="auth-container">
        <form className="auth-form" onSubmit={handleAuth}>
          <div className="secure-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>{isLogin ? 'SECURE ACCESS' : 'CREATE ACCOUNT'}</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
          <button type="submit">{isLogin ? 'ACCESS SYSTEM' : 'INITIALIZE'}</button>
          <div className="switch-form">
            {isLogin ? (
              <p>New user? <a onClick={() => setIsLogin(false)}>Create account</a></p>
            ) : (
              <p>Existing user? <a onClick={() => setIsLogin(true)}>Access system</a></p>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="users-list">
        <div className="chat-header">
          <div className="user-info">
            <h3>{currentUser}</h3>
            <span className="connection-status">CONNECTED</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">TERMINATE</button>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search users..."
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((user) => (
                <div
                  key={user.username}
                  className="search-result-item"
                  onClick={() => selectUser(user.username)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </div>

        {renderUsersList()}
      </div>

      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <h3>SECURE CHANNEL: {selectedUser}</h3>
            </div>
            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`message ${msg.senderId === currentUser ? 'sent' : 'received'}`}
                  onContextMenu={(e) => msg.senderId === currentUser ? handleContextMenu(e, msg.id) : undefined}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your secure message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="terminal-text">
              <span className="prompt">$</span> SELECT TARGET FOR SECURE COMMUNICATION
            </div>
          </div>
        )}
      </div>
      {renderContextMenu()}
      {renderConfirmDialog()}
    </div>
  );
};

export default App;