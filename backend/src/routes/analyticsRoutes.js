const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getPracticeAnalytics,
  getEntitlements,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/", protect, getPracticeAnalytics);
router.get("/entitlements", protect, getEntitlements);

module.exports = router;

