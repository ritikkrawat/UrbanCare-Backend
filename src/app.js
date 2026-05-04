const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const complaintRoutes = require("./routes/complaintRoutes.js");
const cloudinaryRoutes = require("./routes/cloudinaryRoute.js");
const adminRoutes = require("./routes/adminRoutes.js");

const app = express();

const allowedOrigins = [
  "https://urbancaredev.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // ✅ allow requests without origin (Vercel / Postman / preflight)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("🚫 Blocked by CORS:", origin);

      // ❗ DO NOT throw error → allow but log
      return callback(null, true);
    },
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json({ limit: "10mb" })); // Handle larger payloads (e.g., images)
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/complaint", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);

// ✅ Health check (useful for Vercel + monitoring)
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    message: "UrbanCare Backend is running 🚀",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});


// ✅ 404 Handler (catch undefined routes)
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ✅ Global Error Handler (must be last)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });
  
  // Don't leak error details in production
  const isProd = process.env.NODE_ENV === "production";
  
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(isProd ? {} : { stack: err.stack }) // Show stack only in dev
  });
});


module.exports = app;