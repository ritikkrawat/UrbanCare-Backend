const express = require("express");
const router  = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware.js");

const {
  adminLogin,
  getDashboardStats,
  getRecentComplaints,
  getCategoryBreakdown,
  getRecentUsers,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaintByAdmin,
  bulkUpdateStatus,
  getAllUsers,
  getUserById,
  banUser,
  deleteUserByAdmin,
  getAllOfficers,
  addOfficer,
  updateOfficer,
  deleteOfficer,
  getOfficerComplaints,
  getAnalytics,
} = require("../controllers/adminController.js");

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post("/login", adminLogin);

// All routes below require valid admin JWT
router.use(protect, isAdmin);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard/stats",      getDashboardStats);
router.get("/complaints/recent",    getRecentComplaints);
router.get("/dashboard/categories", getCategoryBreakdown);
router.get("/users/recent",         getRecentUsers);

// ── Complaints ────────────────────────────────────────────────────────────────
router.get   ("/complaints",                getAllComplaints);
router.patch ("/complaints/bulk-status",    bulkUpdateStatus);       // before /:id
router.patch ("/complaint/:id/status",      updateComplaintStatus);
router.delete("/complaint/:id",             deleteComplaintByAdmin);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get   ("/users",        getAllUsers);
router.get   ("/user/:id",     getUserById);
router.patch ("/user/:id/ban", banUser);
router.delete("/user/:id",     deleteUserByAdmin);

// ── Officers ──────────────────────────────────────────────────────────────────
router.get   ("/officers",                  getAllOfficers);
router.post  ("/officer",                   addOfficer);
router.put   ("/officer/:id",               updateOfficer);
router.delete("/officer/:id",               deleteOfficer);
router.get   ("/officer/:id/complaints",    getOfficerComplaints);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", getAnalytics);

module.exports = router;