const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const complaintRoutes = require("./routes/complaintRoutes.js");
const path = require("path");

const app = express();

app.use(
  cors({
    origin: "https://urbancaredev.vercel.app",
    credentials: true
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/complaint", complaintRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Server Error"
  });
});

app.get("/", (req, res) => {
  res.send("UrbanCare Backend is running");
});

module.exports = app;