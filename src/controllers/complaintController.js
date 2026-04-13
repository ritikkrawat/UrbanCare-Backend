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

    // Files
    const videos = req.files?.videos?.map((f) => f.path) || [];
    const images = req.files?.images?.map((f) => f.path) || [];

    if (images.length === 0 && videos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Upload at least one image or video"
      });
    }

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

    // ✅ Use .toObject() instead of ._doc spread for reliable mapping
    const formatted = complaints.map((c) => {
      const obj = c.toObject();
      return {
        _id:                obj._id,
        registrationNumber: obj.complaintId,   // ✅ maps complaintId → registrationNumber
        category:           obj.category,
        subCategory:        obj.subCategory,
        description:        obj.description,
        addressLine1:       obj.addressLine1,
        addressLine2:       obj.addressLine2,
        city:               obj.city,
        state:              obj.state,
        pincode:            obj.pincode,
        exactLocation:      obj.exactLocation,
        priority:           obj.priority,
        status:             obj.status,
        images:             obj.images,
        videos:             obj.videos,
        createdAt:          obj.createdAt,
        updatedAt:          obj.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      complaints: formatted
    });

  } catch (error) {
    console.error("GET COMPLAINTS ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= DELETE COMPLAINT =================
const deleteComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;

    // Find complaint
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    // Check ownership (VERY IMPORTANT 🔐)
    if (complaint.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this complaint"
      });
    }

    // Optional: restrict deletion if already processed
    if (complaint.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending complaints can be deleted"
      });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully"
    });

  } catch (error) {
    console.error("DELETE COMPLAINT ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  deleteComplaint
};