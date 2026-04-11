const Complaint = require("../models/complaint");

// ================= SUBMIT COMPLAINT =================
const submitComplaint = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      category,
      subCategory,
      description,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      exactLocation,
      priority
    } = req.body;

    // Validation
    if (
      !category ||
      !subCategory ||
      !description ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    if (images.length === 0 && videos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Upload at least one image or video"
      });
    }
    // Files
    const images = req.files?.images?.map(f => f.path) || [];
    const videos = req.files?.videos?.map(f => f.path) || [];

    const complaint = await Complaint.create({
      user: userId,
      category,
      subCategory,
      description,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      exactLocation,
      priority,
      images,
      videos
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaintId: complaint.complaintId 
    });

  } catch (error) {
    console.error("COMPLAINT ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= GET MY COMPLAINTS =================
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      complaints
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints
};