const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const optionalAuth = require("../middleware/optionalAuth");

const {
  submitComplaint,
  getMyComplaints,
  deleteComplaint,
  trackComplaintStatus
} = require("../controllers/complaintController");

// MULTIPLE FILE UPLOAD (IMPORTANT 🔥)
router.post(
  "/submit",
  protect,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 2 }
  ]),
  submitComplaint
);

router.get("/my-complaints", protect, getMyComplaints);
router.delete("/:id", protect, deleteComplaint);
router.get("/track/:complaintId", optionalAuth, trackComplaintStatus);

module.exports = router;