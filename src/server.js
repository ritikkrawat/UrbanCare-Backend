const app = require("./app.js");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");

dotenv.config();
connectDB();

module.exports = app;
