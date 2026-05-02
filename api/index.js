const app = require("../src/app.js");
const connectDB = require("../src/config/db.js");

module.exports = async (req, res) => {
  await connectDB(); // ✅ handles caching internally
  return app(req, res);
};