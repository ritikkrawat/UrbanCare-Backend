const express = require("express");

const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOTP,
  resetPassword
} = require("../controllers/authController.js");

const protect = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;