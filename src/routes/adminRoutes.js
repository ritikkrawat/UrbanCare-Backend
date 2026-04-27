const express = require("express");
const router = express.Router();

const { adminLogin } = require("../controllers/adminController.js");
const protect = require("../middleware/authMiddleware.js");

// Admin login
router.post("/login", adminLogin);

// Example protected route
router.get("/dashboard", protect, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  res.json({
    success: true,
    message: "Welcome Admin",
  });
});

module.exports = router;