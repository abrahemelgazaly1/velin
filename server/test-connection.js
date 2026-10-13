import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔄 Testing MongoDB connection...\n');

const testConnection = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    console.log(`URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}\n`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log(`🔌 Port: ${conn.connection.port}`);
    console.log(`✨ State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\n`);
    
    // Test write operation
    console.log('📝 Testing write operation...');
    const TestModel = mongoose.model('Test', new mongoose.Schema({ message: String }));
    const doc = await TestModel.create({ message: 'Connection test successful!' });
    console.log(`✅ Write test passed! Document ID: ${doc._id}\n`);
    
    // Test read operation
    console.log('📖 Testing read operation...');
    const found = await TestModel.findById(doc._id);
    console.log(`✅ Read test passed! Message: ${found.message}\n`);
    
    // Cleanup
    await TestModel.deleteMany({});
    console.log('🧹 Cleaned up test data\n');
    
    console.log('🎉 All tests passed! Your MongoDB connection is working perfectly!\n');
    
    await mongoose.connection.close();
    console.log('👋 Connection closed.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes('authentication')) {
      console.log('💡 Tip: Check your username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.log('💡 Tip: Check your internet connection and MongoDB Atlas IP whitelist');
    }
    
    process.exit(1);
  }
};

testConnection();
