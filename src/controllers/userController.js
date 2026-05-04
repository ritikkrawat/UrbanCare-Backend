const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const Complaint = require("../models/complaint.js");
const cloudinary = require("cloudinary").v2;

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let {
      name,
      gender,
      district,
      pincode,
      address1,
      address2,
      mobile,
      email
    } = req.body;

    // ✅ Trim values
    name     = name?.trim();
    pincode  = pincode?.trim(); // ✅ added
    address1 = address1?.trim();
    address2 = address2?.trim();
    email    = email?.trim();
    mobile   = mobile?.trim();

    // ================= VALIDATION =================

    // ✅ Required fields — pincode added
    if (!name || !gender || !district || !pincode || !address1 || !mobile || !email) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    // ✅ Email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // ✅ Mobile validation (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile must be exactly 10 digits"
      });
    }

    // ✅ Pincode validation (6 digits) — added
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be exactly 6 digits"
      });
    }

    // ================= FIND USER =================
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ================= UNIQUE CHECK =================

    if (email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    if (mobile !== user.mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile already in use"
        });
      }
    }

    // ================= UPDATE =================

    user.name     = name;
    user.gender   = gender;
    user.district = district;
    user.pincode  = pincode;  // ✅ no longer fallback to "" since it's required
    user.mobile   = mobile;
    user.email    = email;
    user.address1 = address1;
    user.address2 = address2 || "";

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= GET PROFILE =================
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user: {
        name:     user.name,
        gender:   user.gender,
        district: user.district,
        pincode:  user.pincode,
        mobile:   user.mobile,
        email:    user.email,
        address1: user.address1,
        address2: user.address2,
      }
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= DELETE INSTANT =================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteInstant = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch all complaints to get media URLs
    const complaints = await Complaint.find({ user: userId });

    // 2. Extract public IDs from Cloudinary URLs
    const extractPublicId = (url) => {
      const parts = url.split("/");
      const fileWithExt = parts[parts.length - 1];
      return fileWithExt.split(".")[0]; // remove extension
    };

    const imageIds = complaints.flatMap(c => c.images.map(extractPublicId));
    const videoIds = complaints.flatMap(c => c.videos.map(extractPublicId));
    
    // 3. Delete from Cloudinary
    await Promise.all([
      ...imageIds.map(id => cloudinary.uploader.destroy(id, { resource_type: "image" })),
      ...videoIds.map(id => cloudinary.uploader.destroy(id, { resource_type: "video" })),
    ]);

    // 4. Delete complaints from DB
    await Complaint.deleteMany({ user: userId });

    // 5. Delete user last
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account permanently deleted"
    });

  } catch (error) {
    console.error("INSTANT DELETE ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= DELETE REQUEST =================
// const deleteRequest = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const deleteAfter = new Date();
//     deleteAfter.setDate(deleteAfter.getDate() + 7);

//     const user = await User.findByIdAndUpdate(
//       userId,
//       {
//         isDeleted: true,
//         deleteAt: deleteAfter
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Account scheduled for deletion in 7 days",
//       deleteAt: user.deleteAt
//     });

//   } catch (error) {
//     console.error("DELETE REQUEST ERROR:", error.message);

//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };

// ================= CHANGE PASSWORD =================
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    // 1. Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    // 2. Get user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 3. Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= EXPORT =================
module.exports = {
  updateProfile,
  getProfile,
  deleteInstant,
  // deleteRequest,
  changePassword
};