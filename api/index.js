const app = require("../src/app.js");
const connectDB = require("../src/config/db.js");
const dotenv = require("dotenv");

dotenv.config();
connectDB();

module.exports = app;