const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('\nPlease check:');
    console.log('1. Is your MongoDB Atlas cluster running?');
    console.log('2. Is your IP whitelisted in Atlas Network Access?');
    console.log('3. Is the password correct?');
    // Don't exit - let the server run anyway for static file serving
  }
};

module.exports = connectDB;