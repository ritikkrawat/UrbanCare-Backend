const User = require("../models/user.js");
const bcrypt = require("bcryptjs");

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      gender,
      district,
      pincode,
      address1,
      address2,
      mobile,
      email
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    if (mobile && mobile !== user.mobile) {
      const existingMobile = await User.findOne({ mobile });

      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile already in use"
        });
      }
    }

    user.name = name || user.name;
    user.gender = gender || user.gender;
    user.district = district || user.district;
    user.pincode = pincode || user.pincode;
    user.mobile = mobile || user.mobile;
    user.email = email || user.email;

    user.address1 = address1 || user.address1;
    user.address2 = address2 || user.address2;

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
        name: user.name,
        gender: user.gender,
        district: user.district,
        pincode: user.pincode,
        mobile: user.mobile,
        email: user.email,
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
const deleteInstant = async (req, res) => {
  try {
    const userId = req.user._id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Account permanently deleted"
    });

  } catch (error) {
    console.error("INSTANT DELETE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
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