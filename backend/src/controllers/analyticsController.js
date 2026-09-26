const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Session = require("../models/Session");
const Client = require("../models/Client");
const { getTherapistEntitlements } = require("../services/entitlementService");

// ==========================================
// PRACTICE ANALYTICS DASHBOARD (MongoDB Aggregations)
// ==========================================
const getPracticeAnalytics = async (req, res) => {
  try {
    const therapistId = new mongoose.Types.ObjectId(req.therapist._id);

    // 1. REVENUE TREND AGGREGATION PIPELINE
    const revenueTrend = await Payment.aggregate([
      {
        $match: {
          therapist: therapistId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$amount" },
          netIncome: { $sum: "$net_amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          period: {
            $concat: [
              { $toString: "$_id.month" },
              "/",
              { $toString: "$_id.year" },
            ],
          },
          totalRevenue: 1,
          netIncome: 1,
          transactionCount: 1,
        },
      },
    ]);

    // 2. SESSION STATUS & NO-SHOW RATE AGGREGATION PIPELINE
    const sessionStats = await Session.aggregate([
      {
        $match: {
          therapist: therapistId,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    let totalSessions = 0;
    let completedSessions = 0;
    let cancelledSessions = 0;
    let bookedSessions = 0;

    sessionStats.forEach((stat) => {
      totalSessions += stat.count;
      if (stat._id === "completed") completedSessions = stat.count;
      if (stat._id === "cancelled") cancelledSessions = stat.count;
      if (stat._id === "booked") bookedSessions = stat.count;
    });

    const noShowRate =
      totalSessions > 0
        ? Math.round((cancelledSessions / totalSessions) * 100)
        : 0;

    // 3. CLIENT ACQUISITION TREND AGGREGATION PIPELINE
    const clientTrend = await Client.aggregate([
      {
        $match: {
          therapist: therapistId,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newClients: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          period: {
            $concat: [
              { $toString: "$_id.month" },
              "/",
              { $toString: "$_id.year" },
            ],
          },
          newClients: 1,
        },
      },
    ]);

    const activeClientsCount = await Client.countDocuments({
      therapist: therapistId,
      status: "Active",
    });

    const totalRevenueSum = revenueTrend.reduce(
      (sum, item) => sum + item.totalRevenue,
      0
    );

    res.status(200).json({
      summary: {
        totalRevenue: totalRevenueSum,
        activeClients: activeClientsCount,
        totalSessions,
        completedSessions,
        bookedSessions,
        cancelledSessions,
        noShowRate, // in percentage
      },
      revenueTrend,
      clientTrend,
      sessionStatusDistribution: sessionStats.map((s) => ({
        name: s._id,
        count: s.count,
      })),
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);
    res.status(500).json({ message: "Server error aggregating practice analytics." });
  }
};

// ==========================================
// GET THERAPIST ENTITLEMENTS PROFILE
// ==========================================
const getEntitlements = async (req, res) => {
  try {
    const entitlements = await getTherapistEntitlements(req.therapist._id);
    res.status(200).json({ entitlements });
  } catch (error) {
    console.error("Get entitlements error:", error.message);
    res.status(500).json({ message: "Server error fetching entitlements." });
  }
};

module.exports = {
  getPracticeAnalytics,
  getEntitlements,
};

