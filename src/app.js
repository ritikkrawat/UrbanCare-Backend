const express = require("express");
const cors = require("cors");
const helmet = require("helmet");           // ← ADD
const rateLimit = require("express-rate-limit"); // ← ADD

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const complaintRoutes = require("./routes/complaintRoutes.js");
const cloudinaryRoutes = require("./routes/cloudinaryRoute.js");
const adminRoutes = require("./routes/adminRoutes.js");

const app = express();

// ✅ Security headers (must be first)
app.use(helmet());                          // ← ADD

// ✅ Rate limiters
const globalLimiter = rateLimit({          // ← ADD
  windowMs: 15 * 60 * 1000,               // 15 minutes
  max: 100,                                // 100 req per IP
  message: { success: false, message: "Too many requests, please try again later." }
});

const authLimiter = rateLimit({            // ← ADD
  windowMs: 15 * 60 * 1000,
  max: 10,                                 // strict: 10 req per IP (login/OTP spam)
  message: { success: false, message: "Too many auth attempts, please try again later." }
});

const complaintLimiter = rateLimit({       // ← ADD
  windowMs: 15 * 60 * 1000,
  max: 20,                                 // moderate: 20 submissions per IP
  message: { success: false, message: "Too many complaint requests, slow down." }
});

app.use(globalLimiter);                    // ← ADD (applies to ALL routes)

const allowedOrigins = [
  "https://urbancaredev.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Routes (specific limiters applied here)
app.use("/api/auth", authLimiter, authRoutes);           // ← CHANGED
app.use("/api/user", userRoutes);
app.use("/api/complaint", complaintLimiter, complaintRoutes); // ← CHANGED
app.use("/api/admin", adminRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "UrbanCare Backend is running 🚀",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(isProd ? {} : { stack: err.stack })
  });
});

module.exports = app;