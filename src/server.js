const app = require("./app.js");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");

dotenv.config();

// CONNECT DATABASE
connectDB();

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`UrbanCare Backend running on port ${PORT}`);
  });
}

module.exports = app;
