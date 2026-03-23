const express = require("express");
const protect = require("../middleware/authMiddleware.js");

const router = express.Router();

// Protected route
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed",
    user: req.user
  });
});

module.exports = router;
