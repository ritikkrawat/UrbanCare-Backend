const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    console.log("Connecting to MongoDB...");
    console.log("URI exists:", !!process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "urbancare",       // 🔥 IMPORTANT
      serverSelectionTimeoutMS: 5000, // 🔥 prevent hanging
    });

    isConnected = true;

    console.log("MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB ERROR FULL:", error); // 🔥 log full error
    throw error; // 🔥 MUST THROW
  }
};

module.exports = connectDB;