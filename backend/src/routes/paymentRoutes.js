const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireEntitlement = require("../middleware/entitlementMiddleware");

const {
  createOrder,
  verifyPayment,
  handleRazorpayWebhook,
  getPackages,
  createPackage,
  getPayments,
} = require("../controllers/paymentController");

const router = express.Router();

// ==========================================
// RAZORPAY WEBHOOK
// Public endpoint
// Razorpay calls this directly
// ==========================================
router.post("/webhook", handleRazorpayWebhook);

// ==========================================
// PROTECTED PAYMENT ROUTES
// Therapist authentication required
// ==========================================

// Create payment order
router.post("/order", protect, createOrder);

// Verify completed Razorpay payment
router.post("/verify", protect, verifyPayment);

// Get therapist's active packages
router.get("/packages", protect, getPackages);

// ==========================================
// PROTECTED PACKAGE MANAGEMENT
// ==========================================

// Create therapist package
router.post(
  "/packages",
  protect,
  requireEntitlement("packageManagement"),
  createPackage
);

// Get therapist payment history
router.get("/history", protect, getPayments);

module.exports = router;