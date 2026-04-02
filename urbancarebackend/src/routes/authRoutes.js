const express = require("express");

const {
  registerUser,
  loginUser,
  deleteInstant,
  deleteRequest,
  changePassword
} = require("../controllers/authController.js");

const protect = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.delete("/delete-instant", protect, deleteInstant); 
router.post("/delete-request", protect, deleteRequest);
router.put("/change-password", protect, changePassword);

console.log("Auth Routes loaded");

module.exports = router;