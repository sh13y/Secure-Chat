import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('Please create a .env file with your MongoDB connection string');
      process.exit(1);
    }

    console.log('🔗 Testing MongoDB connection...');
    console.log('Connection string:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 1,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('SSL')) {
      console.log('\n💡 SSL/TLS Error detected. Common solutions:');
      console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('2. Verify your connection string format');
      console.log('3. Ensure username and password are correct');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication Error detected. Check:');
      console.log('1. Username and password in connection string');
      console.log('2. Database user permissions in MongoDB Atlas');
    }
    
    process.exit(1);
  }
};

testConnection(); 