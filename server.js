const app = require("./src/app.js");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db.js");

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server running locally on http://localhost:${PORT}`);
  });
}