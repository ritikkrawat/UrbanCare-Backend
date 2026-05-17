const jwt      = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const Complaint = require("../models/complaint.js");
const User      = require("../models/user.js");
const Officer   = require("../models/officers.js");

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (
      email    !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const admin = { id: "admin-1", email, role: "admin", name: "Administrator" };

    const token = jwt.sign(admin, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin,
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      total,
      pending,
      inProgress,
      resolved,
      closed,
      todayNew,
      todayResolved,
      highPriority,
      totalUsers,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "Pending" }),
      Complaint.countDocuments({ status: "In Progress" }),
      Complaint.countDocuments({ status: "Resolved" }),
      Complaint.countDocuments({ status: "Closed" }),
      Complaint.countDocuments({ createdAt: { $gte: todayStart } }),
      Complaint.countDocuments({
        status: { $in: ["Resolved", "Closed"] },
        updatedAt: { $gte: todayStart },
      }),
      Complaint.countDocuments({
        status: { $in: ["Pending", "In Progress"] },
        priority: "High",
      }),
      User.countDocuments({ isDeleted: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total, pending, inProgress,
        resolved: resolved + closed,
        todayNew, todayResolved,
        highPriority, totalUsers,
      },
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getRecentComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name email")
      .populate("assignedOfficer", "name department");

    const normalized = complaints.map((c) => {
      const obj = c.toObject();
      return {
        ...obj,
        userId: c.user,
        registrationNumber: obj.registrationNumber || obj.complaintId || "—", // ← ADD this
      };
    });

    res.status(200).json({ success: true, complaints: normalized });
  } catch (error) {
    console.error("RECENT COMPLAINTS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCategoryBreakdown = async (req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]);

    res.status(200).json({ success: true, categories: data });
  } catch (error) {
    console.error("CATEGORY BREAKDOWN ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getRecentUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email city createdAt");

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("RECENT USERS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email mobile")
      .populate("assignedOfficer", "name department");

    const normalized = complaints.map((c) => {
      const obj = c.toObject();
      return {
        ...obj,
        userId: c.user,
        registrationNumber: c.registrationNumber || c.complaintId || "—",
      };
    });

    res.status(200).json({ success: true, complaints: normalized });
  } catch (error) {
    console.error("GET ALL COMPLAINTS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedOfficer, note } = req.body;

    const validStatuses = ["Pending", "In Progress", "Resolved", "Closed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (status)           complaint.status           = status;
    if (assignedOfficer)  complaint.assignedOfficer  = assignedOfficer;
    if (note && note.trim()) {
      complaint.adminNotes.push({ text: note.trim() });
    }


    if (req.body.status === "Resolved" && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      complaint,
    });
  } catch (error) {
    console.error("UPDATE COMPLAINT ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteComplaintByAdmin = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }
    res.status(200).json({ success: true, message: "Complaint deleted" });
  } catch (error) {
    console.error("DELETE COMPLAINT ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    const validStatuses = ["Pending", "In Progress", "Resolved", "Closed"];
    if (!ids?.length || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request — provide ids array and valid status",
      });
    }

    await Complaint.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    res.status(200).json({
      success: true,
      message: `${ids.length} complaint(s) updated to ${status}`,
    });
  } catch (error) {
    console.error("BULK STATUS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .select("-password -otp -otpExpiry");

    // attach complaint count to each user
    const userIds = users.map((u) => u._id);
    const counts  = await Complaint.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => { countMap[c._id.toString()] = c.count; });

    const result = users.map((u) => ({
      ...u.toObject(),
      complaintCount: countMap[u._id.toString()] || 0,
    }));

    res.status(200).json({ success: true, users: result });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).select("-password -otp -otpExpiry");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const complaints = await Complaint.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select("complaintId registrationNumber category status priority createdAt");

    res.status(200).json({ success: true, user, complaints });
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const banUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? "User banned" : "User unbanned",
      isBanned: user.isBanned,
    });
  } catch (error) {
    console.error("BAN USER ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // soft delete — matches your existing isDeleted pattern
    user.isDeleted = true;
    user.deleteAt  = new Date();
    await user.save();

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OFFICER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const getAllOfficers = async (req, res) => {
  try {
    const officers = await Officer.find().sort({ createdAt: -1 });

    // attach assigned complaint count
    const officerIds = officers.map((o) => o._id);
    const counts = await Complaint.aggregate([
      { $match: { assignedOfficer: { $in: officerIds } } },
      { $group: { _id: "$assignedOfficer", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => { countMap[c._id.toString()] = c.count; });

    const result = officers.map((o) => ({
      ...o.toObject(),
      assignedCount: countMap[o._id.toString()] || 0,
    }));

    res.status(200).json({ success: true, officers: result });
  } catch (error) {
    console.error("GET OFFICERS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addOfficer = async (req, res) => {
  try {
    const { name, email, mobile, password, department, zone } = req.body;

    if (!name || !email || !mobile || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, email, mobile, password and department are required",
      });
    }

    const exists = await Officer.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Officer with this email already exists",
      });
    }

    const officer = await Officer.create({
      name, email, mobile, password, department, zone,
    });

    res.status(201).json({
      success: true,
      message: "Officer added successfully",
      officer: { ...officer.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("ADD OFFICER ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateOfficer = async (req, res) => {
  try {
    const { name, email, mobile, department, zone, isActive } = req.body;

    const officer = await Officer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ success: false, message: "Officer not found" });
    }

    if (name)       officer.name       = name;
    if (email)      officer.email      = email;
    if (mobile)     officer.mobile     = mobile;
    if (department) officer.department = department;
    if (zone !== undefined) officer.zone = zone;
    if (isActive !== undefined) officer.isActive = isActive;

    await officer.save();

    res.status(200).json({
      success: true,
      message: "Officer updated successfully",
      officer,
    });
  } catch (error) {
    console.error("UPDATE OFFICER ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteOfficer = async (req, res) => {
  try {
    const officer = await Officer.findByIdAndDelete(req.params.id);
    if (!officer) {
      return res.status(404).json({ success: false, message: "Officer not found" });
    }

    // unassign from complaints
    await Complaint.updateMany(
      { assignedOfficer: req.params.id },
      { $set: { assignedOfficer: null } }
    );

    res.status(200).json({ success: true, message: "Officer deleted" });
  } catch (error) {
    console.error("DELETE OFFICER ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getOfficerComplaints = async (req, res) => {
  try {
    const officer = await Officer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ success: false, message: "Officer not found" });
    }

    const complaints = await Complaint.find({ assignedOfficer: req.params.id })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    const resolved = complaints.filter(
      (c) => c.status === "Resolved" || c.status === "Closed"
    ).length;

    res.status(200).json({
      success: true,
      officer,
      complaints,
      stats: {
        total:    complaints.length,
        resolved,
        pending:  complaints.length - resolved,
      },
    });
  } catch (error) {
    console.error("OFFICER COMPLAINTS ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

// ── Analytics ─────────────────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const { range = "30D" } = req.query;

    const days     = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 }[range] || 30;
    const now      = new Date();
    const from     = new Date(now - days * 864e5);
    const prevFrom = new Date(from - days * 864e5);

    // ── KPI counts ────────────────────────────────────────────────────────────
    const [total, prevTotal, resolved, prevResolved,
           inProgress, pending, closed] = await Promise.all([
      Complaint.countDocuments({ createdAt: { $gte: from } }),
      Complaint.countDocuments({ createdAt: { $gte: prevFrom, $lt: from } }),
      Complaint.countDocuments({ status: "Resolved",    createdAt: { $gte: from } }),
      Complaint.countDocuments({ status: "Resolved",    createdAt: { $gte: prevFrom, $lt: from } }),
      Complaint.countDocuments({ status: "In Progress", createdAt: { $gte: from } }),
      Complaint.countDocuments({ status: "Pending",     createdAt: { $gte: from } }),
      Complaint.countDocuments({ status: "Closed",      createdAt: { $gte: from } }),
    ]);

    const growth = (curr, prev) =>
      prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

    // ── Avg resolution days ───────────────────────────────────────────────────
    const resolvedDocs = await Complaint.find({
      status: "Resolved",
      createdAt:  { $gte: from },
      resolvedAt: { $exists: true },
    }).select("createdAt resolvedAt");

    const avgResolutionDays = resolvedDocs.length
      ? Math.round(
          resolvedDocs.reduce((s, c) =>
            s + (new Date(c.resolvedAt) - new Date(c.createdAt)) / 864e5, 0
          ) / resolvedDocs.length
        )
      : 0;

    // ── Status breakdown (for donut) ──────────────────────────────────────────
    const statusAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusBreakdown = Object.fromEntries(
      statusAgg.map(({ _id, count }) => [_id, count])
    );

    // ── Department breakdown (for horizontal bars) ────────────────────────────
    const deptAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const departmentBreakdown = Object.fromEntries(
      deptAgg.map(({ _id, count }) => [_id ?? "General", count])
    );

    // ── Trend (filed vs resolved per interval) ────────────────────────────────
    const intervalDays = days <= 7 ? 1 : days <= 30 ? 3 : days <= 90 ? 7 : 30;
    const trendPromises = [];
    for (let d = 0; d < days; d += intervalDays) {
      const start = new Date(from.getTime() + d * 864e5);
      const end   = new Date(start.getTime() + intervalDays * 864e5);
      trendPromises.push(
        Promise.all([
          Complaint.countDocuments({ createdAt: { $gte: start, $lt: end } }),
          Complaint.countDocuments({ status: "Resolved", createdAt: { $gte: start, $lt: end } }),
        ]).then(([filed, res_]) => ({
          label:    start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          filed,
          resolved: res_,
        }))
      );
    }
    const trend = await Promise.all(trendPromises);

    // ── Top officers ──────────────────────────────────────────────────────────
    const topOfficers = await Complaint.aggregate([
      {
        $match: {
          createdAt:       { $gte: from },
          assignedOfficer: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id:           "$assignedOfficer",
          assignedCount: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
          },
        },
      },
      { $sort: { resolvedCount: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from:         Officer.collection.name,   // ← must match your MongoDB collection name
          localField:   "_id",
          foreignField: "_id",
          as:           "officer",
        },
      },
      { $unwind: "$officer" },
      {
        $project: {
          _id:           0,
          name:          "$officer.name",
          department:    "$officer.department",
          assignedCount: 1,
          resolvedCount: 1,
        },
      },
    ]);

    // ── Recent activity ───────────────────────────────────────────────────────
    const recentDocs = await Complaint.find({ createdAt: { $gte: from } })
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate("assignedOfficer", "name")
      .select("registrationNumber category status updatedAt assignedOfficer");

    const recentActivity = recentDocs.map((c) => ({
      registrationNumber: c.registrationNumber,
      category:           c.category,
      status:             c.status,
      updatedAt:          c.updatedAt,
      officer:            c.assignedOfficer?.name || null,
    }));

    // ── Send ──────────────────────────────────────────────────────────────────
    res.json({
      totalComplaints:  total,
      complaintsGrowth: growth(total, prevTotal),
      resolved,
      resolvedGrowth:   growth(resolved, prevResolved),
      inProgress,
      pending,
      pendingGrowth:    0,
      closed,
      avgResolutionDays,
      resolutionDelta:  0,
      statusBreakdown,
      departmentBreakdown,
      trend,
      topOfficers,
      recentActivity,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  // auth
  adminLogin,
  // dashboard
  getDashboardStats,
  getRecentComplaints,
  getCategoryBreakdown,
  getRecentUsers,
  // complaints
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaintByAdmin,
  bulkUpdateStatus,
  // users
  getAllUsers,
  getUserById,
  banUser,
  deleteUserByAdmin,
  // officers
  getAllOfficers,
  addOfficer,
  updateOfficer,
  deleteOfficer,
  getOfficerComplaints,
  // analytics
  getAnalytics,
};