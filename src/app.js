const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const complaintRoutes = require("./routes/complaintRoutes.js");

const app = express();

// ✅ HANDLE CORS + PREFLIGHT
app.use(cors({
  origin: "https://urbancaredev.vercel.app",
  credentials: true,
}));

// ✅ IMPORTANT: handle preflight requests
app.options("*", cors());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/complaint", complaintRoutes);

app.get("/", (req, res) => {
  res.send("UrbanCare Backend is running");
});

module.exports = app;