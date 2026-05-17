const Complaint = require("../models/Complaint");
const Officer   = require("../models/Officer");

exports.getAnalytics = async (req, res) => {
  try {
    const { range = "30D" } = req.query;

    // ── Date range ──────────────────────────────────────────
    const days = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 }[range] || 30;
    const now      = new Date();
    const from     = new Date(now - days * 864e5);
    const prevFrom = new Date(from - days * 864e5);

    // ── KPIs ────────────────────────────────────────────────
    const [total, prevTotal] = await Promise.all([
      Complaint.countDocuments({ createdAt: { $gte: from } }),
      Complaint.countDocuments({ createdAt: { $gte: prevFrom, $lt: from } }),
    ]);

    const [resolved, prevResolved] = await Promise.all([
      Complaint.countDocuments({ status: "Resolved", createdAt: { $gte: from } }),
      Complaint.countDocuments({ status: "Resolved", createdAt: { $gte: prevFrom, $lt: from } }),
    ]);

    const inProgress = await Complaint.countDocuments({ status: "In Progress", createdAt: { $gte: from } });
    const pending    = await Complaint.countDocuments({ status: "Pending",     createdAt: { $gte: from } });
    const closed     = await Complaint.countDocuments({ status: "Closed",      createdAt: { $gte: from } });

    // Growth % helpers
    const growth = (curr, prev) =>
      prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

    // ── Avg resolution time ─────────────────────────────────
    const resolvedComplaints = await Complaint.find({
      status: "Resolved",
      createdAt: { $gte: from },
      resolvedAt: { $exists: true },
    }).select("createdAt resolvedAt");

    const avgResolutionDays = resolvedComplaints.length
      ? Math.round(
          resolvedComplaints.reduce((sum, c) =>
            sum + (new Date(c.resolvedAt) - new Date(c.createdAt)) / 864e5, 0
          ) / resolvedComplaints.length
        )
      : 0;

    // ── Status breakdown ────────────────────────────────────
    const statusAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusBreakdown = Object.fromEntries(
      statusAgg.map(({ _id, count }) => [_id, count])
    );

    // ── Department breakdown ────────────────────────────────
    const deptAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const departmentBreakdown = Object.fromEntries(
      deptAgg.map(({ _id, count }) => [_id, count])
    );

    // ── Trend (filed vs resolved per interval) ──────────────
    const intervalDays = days <= 7 ? 1 : days <= 30 ? 3 : days <= 90 ? 7 : 30;
    const trend = [];
    for (let d = 0; d < days; d += intervalDays) {
      const start = new Date(from.getTime() + d * 864e5);
      const end   = new Date(start.getTime() + intervalDays * 864e5);
      const [filed, res_] = await Promise.all([
        Complaint.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Complaint.countDocuments({ status: "Resolved", createdAt: { $gte: start, $lt: end } }),
      ]);
      trend.push({
        label: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        filed,
        resolved: res_,
      });
    }

    // ── Top officers ────────────────────────────────────────
    const officerAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: from }, assignedOfficer: { $exists: true } } },
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
          from:         "officers",  // your Officer collection name
          localField:   "_id",
          foreignField: "_id",
          as:           "officer",
        },
      },
      { $unwind: "$officer" },
      {
        $project: {
          name:          "$officer.name",
          department:    "$officer.department",
          assignedCount: 1,
          resolvedCount: 1,
        },
      },
    ]);

    // ── Recent activity ─────────────────────────────────────
    const recentActivity = await Complaint.find({ createdAt: { $gte: from } })
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate("assignedOfficer", "name")
      .select("registrationNumber category status updatedAt assignedOfficer");

    const activity = recentActivity.map((c) => ({
      registrationNumber: c.registrationNumber,
      category:           c.category,
      status:             c.status,
      updatedAt:          c.updatedAt,
      officer:            c.assignedOfficer?.name || null,
    }));

    // ── Response ────────────────────────────────────────────
    res.json({
      totalComplaints:   total,
      complaintsGrowth:  growth(total, prevTotal),
      resolved,
      resolvedGrowth:    growth(resolved, prevResolved),
      inProgress,
      pending,
      pendingGrowth:     0,   // add prev-period pending if needed
      closed,
      avgResolutionDays,
      resolutionDelta:   0,   // add prev-period avg if needed
      statusBreakdown,
      departmentBreakdown,
      trend,
      topOfficers:       officerAgg,
      recentActivity:    activity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};