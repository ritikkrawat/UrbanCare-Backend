const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes.jsx");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("UrbanCare Backend is running");
});

module.exports = app;
