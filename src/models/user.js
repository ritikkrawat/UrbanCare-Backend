const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    gender: {
      type: String,
      enum: ["Male", "Female", "Transgender"]
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
      select: false
    },

    otp: {
      type: String,
      default: null
    },
    
    otpExpiry: {
      type: Date,
      default: null
    },

    address1: String,
    address2: String,
    state: String,
    district: String,
    pincode: String,

    isDeleted: { type: Boolean, default: false },
    deleteAt: { type: Date, default: null },

    city: {
      type: String,
      trim: true,
    },
    
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);