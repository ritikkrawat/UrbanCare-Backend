const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const complaintRoutes = require("./routes/complaintRoutes.js");

const app = express();

const allowedOrigins = [
  "https://urbancaredev.vercel.app"
];

// ✅ Single CORS config
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/complaint", complaintRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("UrbanCare Backend is running");
});

module.exports = app;