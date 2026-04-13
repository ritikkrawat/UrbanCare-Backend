const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const complaintRoutes = require("./routes/complaintRoutes.js");

const app = express();

// ✅ Flexible CORS: works locally + Vercel + allows no-origin (serverless/postman)
const allowedOrigins = [
  "https://urbancaredev.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, serverless cold starts)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ✅ Middleware
app.use(express.json({ limit: "10mb" })); // Handle larger payloads (e.g., images)
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/complaint", complaintRoutes);

// ✅ Health check (useful for Vercel + monitoring)
app.get("/", (req, res) => {
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
  console.error("❌ Server Error:", err.stack);
  
  // Don't leak error details in production
  const isProd = process.env.NODE_ENV === "production";
  
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(isProd ? {} : { stack: err.stack }) // Show stack only in dev
  });
});

// ✅ Export for both local + Vercel
module.exports = app;