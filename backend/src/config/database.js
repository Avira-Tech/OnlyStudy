// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//     return conn;
//   } catch (error) {
//     console.error(`MongoDB Connection Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

// backend/src/config/database.js

require('dotenv').config(); // ensure env vars are loaded
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI; // Make sure your .env has MONGO_URI

  if (!mongoURI) {
    console.error(
      '\x1b[31m%s\x1b[0m', // red text
      'Error: MONGO_URI is not defined in your environment variables!'
    );
    console.error(
      'Please add the following line to your .env file:\n\nMONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/onlystudy?retryWrites=true&w=majority\n'
    );
    process.exit(1); // stop server, cannot proceed without DB
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(
      '\x1b[32m%s\x1b[0m', // green text
      `✅ MongoDB Connected: ${conn.connection.host}`
    );
    return conn;
  } catch (error) {
    console.error(
      '\x1b[31m%s\x1b[0m',
      `❌ MongoDB Connection Error: ${error.message}`
    );
    process.exit(1);
  }
};

// Optional: handle mongoose connection errors globally
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting reconnect...');
});

module.exports = connectDB;
