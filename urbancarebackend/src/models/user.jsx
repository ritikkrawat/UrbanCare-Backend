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
      unique: true
    },

    mobile: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    address: {
      type: String
    },

    state: String,
    district: String,
    pincode: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
