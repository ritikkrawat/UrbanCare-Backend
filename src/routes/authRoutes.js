const express = require("express");

const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  sendOtpForRegistration,          
  verifyRegistrationOtp            
} = require("../controllers/authController.js");

const protect = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/send-otp", sendOtpForRegistration);
router.post("/verify-registration-otp", verifyRegistrationOtp);

module.exports = router;