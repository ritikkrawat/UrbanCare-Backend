const app = require("../src/app");
const dotenv = require("dotenv");
const connectDB = require("../src/config/db");

dotenv.config();

// Cache DB connection (important for serverless)
let isConnected = false;

async function connect() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

module.exports = (req, res) => {
  return app(req, res);
};