const express = require("express");

const protect = require("../middleware/authMiddleware");
const requireEntitlement = require("../middleware/entitlementMiddleware");

const {
  createOrder,
  createPublicOrder,
  verifyPayment,
  verifyPublicPayment,
  handleRazorpayWebhook,
  getPackages,
  getPublicPackages,
  createPackage,
  getPayments,
} = require("../controllers/paymentController");

const router = express.Router();

// ==========================================
// RAZORPAY WEBHOOK
// Public endpoint
// ==========================================

router.post(
  "/webhook",
  handleRazorpayWebhook
);

// ==========================================
// THERAPIST PAYMENT ROUTES
// ==========================================

router.post(
  "/order",
  protect,
  createOrder
);

router.post(
  "/verify",
  protect,
  verifyPayment
);

// ==========================================
// PUBLIC CLIENT PAYMENT ROUTES
// MODULE 4
// ==========================================

router.post(
  "/public/order",
  createPublicOrder
);

router.post(
  "/public/verify",
  verifyPublicPayment
);

router.get(
  "/public/packages",
  getPublicPackages
);

// ==========================================
// THERAPIST PACKAGE ROUTES
// ==========================================

router.get(
  "/packages",
  protect,
  getPackages
);

router.post(
  "/packages",
  protect,
  requireEntitlement("packageManagement"),
  createPackage
);

// ==========================================
// THERAPIST PAYMENT HISTORY
// ==========================================

router.get(
  "/history",
  protect,
  getPayments
);

module.exports = router;