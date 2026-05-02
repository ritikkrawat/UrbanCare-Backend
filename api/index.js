const dotenv = require("dotenv");
const app = require("../src/app.js");
const connectDB = require("../src/config/db.js");

dotenv.config();

let isConnected = false;
const connectIfNeeded = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};
connectIfNeeded();

module.exports = async (req, res) => {
  return app(req, res);
};