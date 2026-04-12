const app = require("../src/app");
const dotenv = require("dotenv");
const connectDB = require("../src/config/db");

dotenv.config();

let isConnected = false;

async function connect() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

module.exports = async (req, res) => {
  try {
    await connect(); // DB connect
    return app(req, res);
  } catch (error) {
    console.error("FINAL ERROR:", error);
    res.status(500).json({
      message: "Server crashed",
      error: error.message,
    });
  }
};