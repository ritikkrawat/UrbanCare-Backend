const dotenv = require("dotenv");
dotenv.config();

const app = require("../src/app.js");
const connectDB = require("../src/config/db.js");


// ✅ Connect only once (Mongoose handles re-use)
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