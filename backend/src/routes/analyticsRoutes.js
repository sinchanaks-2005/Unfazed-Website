const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireEntitlement = require("../middleware/entitlementMiddleware");

const {
  getPracticeAnalytics,
  getEntitlements,
} = require("../controllers/analyticsController");

const router = express.Router();

// Analytics dashboard
router.get(
  "/",
  protect,
  requireEntitlement("analytics:advanced"),
  getPracticeAnalytics
);

// Entitlement profile
router.get(
  "/entitlements",
  protect,
  getEntitlements
);

module.exports = router;