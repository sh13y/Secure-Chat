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

    // Use minimal connection options
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Shorter timeout for testing
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
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
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout Error detected. Check:');
      console.log('1. Network connectivity');
      console.log('2. Firewall settings');
      console.log('3. MongoDB Atlas cluster status');
    }
    
    process.exit(1);
  }
};

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('❌ Connection test timed out after 10 seconds');
  process.exit(1);
}, 10000);

testConnection().finally(() => {
  clearTimeout(timeout);
}); 