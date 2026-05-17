const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const officerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    department: {
      type: String,
      required: true,
      // matches your complaint categories
      enum: [
        "Roads & Infrastructure",
        "Water Supply",
        "Electricity",
        "Sanitation & Waste",
        "Public Safety",
        "Parks & Recreation",
        "Noise & Pollution",
        "Street Lighting",
        "Drainage & Sewage",
        "General",
      ],
    },

    zone: {
      type: String,
      trim: true, // e.g. "North Zone", "Ward 12"
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before save
officerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password helper
officerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Officer", officerSchema);