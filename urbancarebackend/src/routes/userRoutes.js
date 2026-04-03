const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware.js");

const {
  updateProfile,
  getProfile,
  deleteInstant,
  // deleteRequest,
  changePassword
} = require("../controllers/userController.js");

// 🔥 GET USER PROFILE (keep this)
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

router.put("/update-profile", protect, updateProfile); 
router.get("/profile", protect, getProfile);
router.delete("/delete-instant", protect, deleteInstant); 
// router.post("/delete-request", protect, deleteRequest);
router.put("/change-password", protect, changePassword);

module.exports = router;