const app = require("./app.jsx");
const dotenv = require("dotenv");
const connectDB = require("./config/db.jsx");

dotenv.config();

// CONNECT DATABASE
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`UrbanCare Backend running on port ${PORT}`);
});
