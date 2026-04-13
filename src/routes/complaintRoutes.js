const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  submitComplaint,
  getMyComplaints,
  deleteComplaint
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

module.exports = router;