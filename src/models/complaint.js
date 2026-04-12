const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    description: { type: String, required: true },

    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    exactLocation: String,

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    images: [String],
    videos: [String],

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending"
    },

    complaintId: {
      type: String,
      unique: true
    }
  },
  { timestamps: true }
);

complaintSchema.pre("save", async function () {
  if (!this.complaintId) {
    let unique = false;

    while (!unique) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const id = "CMP" + randomNum;

      const existing = await mongoose.models.Complaint.findOne({
        complaintId: id
      });

      if (!existing) {
        this.complaintId = id;
        unique = true;
      }
    }
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);