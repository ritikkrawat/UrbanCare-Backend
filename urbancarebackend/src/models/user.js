const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false // 🔥 hidden by default
    },

    address1: String,
    address2: String,
    
    district: String,
    pincode: String,

    // 🔥 NEW FIELDS (IMPORTANT)
    isDeleted: {
      type: Boolean,
      default: false
    },

    deleteAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// 🔥 Indexing (performance)
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });

module.exports = mongoose.model("User", userSchema);