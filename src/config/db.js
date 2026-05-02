const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn; // ✅ reuse connection
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });

    cached.conn = conn; // ✅ store connection

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;