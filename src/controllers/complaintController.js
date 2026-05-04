const Complaint = require("../models/complaint.js");
const { sendComplaintConfirmationEmail } = require("../utils/sendEmail.js");

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
      priority,
      images,
      videos
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

    const safeImages = Array.isArray(images) ? images : [];
    const safeVideos = Array.isArray(videos) ? videos : [];

    if (safeImages.length === 0 && safeVideos.length === 0) {
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
      images:safeImages,
      videos: safeVideos
    });

    sendComplaintConfirmationEmail({
      to:          req.user.email,
      name:        req.user.name,
      complaintId: complaint.complaintId,
      category:    complaint.category,
      description: complaint.description,
      date:        complaint.createdAt,
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaintId: complaint.complaintId
    });

  } catch (error) {
    console.error("COMPLAINT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
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

// ================= TRACK STATUS =================
const trackComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { email } = req.query;

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: "Complaint ID is required"
      });
    }

    const complaint = await Complaint.findOne({
      complaintId: complaintId.toUpperCase()
    }).populate("user", "name email");;

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "No complaint found with this ID"
      });
    }

    const isOwner = req.user && req.user._id.toString() === complaint.user._id.toString();
    if (!isOwner) {
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required to track this complaint" });
      }
      if (complaint.user.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ success: false, message: "Email does not match this complaint" });
      }
    }

    // Convert status → timeline (since you don’t store timeline yet)
    const timeline = [
      {
        label: "Submitted",
        date: complaint.createdAt,
        done: true
      },
      {
        label: "In Progress",
        date: complaint.status !== "Pending" ? complaint.updatedAt : null,
        done: complaint.status !== "Pending"
      },
      {
        label: "Resolved",
        date: complaint.status === "Closed" ? complaint.updatedAt : null,
        done: complaint.status === "Closed"
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        name: complaint.user.name,
        complaintId: complaint.complaintId,
        category: complaint.category,
        subCategory: complaint.subCategory,
        description: complaint.description,
        status: complaint.status.toLowerCase().replace(" ", "-"),
        priority: complaint.priority,
        address: `${complaint.addressLine1}, ${complaint.city}`,
        date: complaint.createdAt,
        timeline
      }
    });

  } catch (error) {
    console.error("TRACK STATUS ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  deleteComplaint,
  trackComplaintStatus
};