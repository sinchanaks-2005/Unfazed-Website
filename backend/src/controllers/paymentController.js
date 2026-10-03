const crypto = require("crypto");

const Payment = require("../models/Payment");

const Package = require("../models/Package");

const ClientPackage = require("../models/ClientPackage");

const Client = require("../models/Client");

const Therapist = require("../models/Therapist");

const Session = require("../models/Session");

const razorpay = require("../config/razorpay");

const { generateInvoice } = require("../services/invoiceService");

// ==========================================
// CREATE PAYMENT ORDER
// Therapist-protected existing route
// ==========================================

const createOrder = async (req, res) => {
  try {
    const therapistId = req.therapist?._id;

    const {
      clientId,
      sessionId,
      packageId,
      amount,
    } = req.body;

    if (!therapistId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      Number.isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        message: "A valid payment amount is required.",
      });
    }

    const therapist = await Therapist.findById(therapistId);

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found.",
      });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount.",
      });
    }

    const receiptId = `rcpt_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        therapistId: therapistId.toString(),
        clientId: clientId ? clientId.toString() : "",
        sessionId: sessionId ? sessionId.toString() : "",
        packageId: packageId ? packageId.toString() : "",
      },
    });

    const grossAmount = Number(amount);

    const platformFee =
      Math.round(grossAmount * 0.05 * 100) / 100;

    const netAmount = grossAmount - platformFee;

    const payment = await Payment.create({
      therapist: therapistId,
      client: clientId || null,
      session: sessionId || null,
      package: packageId || null,
      amount: grossAmount,
      currency: "INR",
      platform_fee: platformFee,
      net_amount: netAmount,
      gateway: "razorpay",
      gateway_order_id: order.id,
      status: "pending",
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(500).json({
      message: "Server error creating payment order.",
    });
  }
};

// ==========================================
// CREATE PUBLIC CLIENT PAYMENT ORDER
// Module 4
// ==========================================

const createPublicOrder = async (req, res) => {
  try {
    const {
      therapistId,
      clientId,
      sessionId,
      packageId,
    } = req.body;

    if (!therapistId) {
      return res.status(400).json({
        message: "Therapist ID is required.",
      });
    }

    if (!clientId) {
      return res.status(400).json({
        message: "Client ID is required.",
      });
    }

    const therapist = await Therapist.findById(therapistId);

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found.",
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      therapist: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client does not belong to this therapist.",
      });
    }

    let amount;
    let selectedPackage = null;

    // ========================================
    // PACKAGE PAYMENT
    // ========================================

    if (packageId) {
      selectedPackage = await Package.findOne({
        _id: packageId,
        therapist: therapistId,
        isActive: true,
      });

      if (!selectedPackage) {
        return res.status(404).json({
          message: "Package not found.",
        });
      }

      amount = Number(selectedPackage.totalPrice);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          message: "Selected package does not have a valid price.",
        });
      }
    }

    // ========================================
    // SINGLE SESSION PAYMENT
    // ========================================

    if (!packageId) {
      if (!sessionId) {
        return res.status(400).json({
          message:
            "Session ID is required for single-session payment.",
        });
      }

      const session = await Session.findOne({
        _id: sessionId,
        therapist: therapistId,
      });

      if (!session) {
        return res.status(404).json({
          message: "Session not found.",
        });
      }

      if (
        session.client &&
        session.client.toString() !== client._id.toString()
      ) {
        return res.status(400).json({
          message: "Session does not belong to this client.",
        });
      }

      // Fixed single-session price for UNFAZED.
      // Never trust amount sent by the client.
      amount = 900;

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          message: "Invalid single-session price.",
        });
      }
    }

    // ========================================
    // CREATE RAZORPAY ORDER
    // ========================================

    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount.",
      });
    }

    const receiptId = `client_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        therapistId: therapistId.toString(),
        clientId: clientId.toString(),
        sessionId: sessionId ? sessionId.toString() : "",
        packageId: packageId ? packageId.toString() : "",
      },
    });

    // ========================================
    // PLATFORM FEE
    // ========================================

    const grossAmount = Number(amount);

    const platformFee =
      Math.round(grossAmount * 0.05 * 100) / 100;

    const netAmount = grossAmount - platformFee;

    // ========================================
    // SAVE PAYMENT
    // ========================================

    const payment = await Payment.create({
      therapist: therapistId,
      client: clientId,
      session: sessionId || null,
      package: packageId || null,
      amount: grossAmount,
      currency: "INR",
      platform_fee: platformFee,
      net_amount: netAmount,
      gateway: "razorpay",
      gateway_order_id: order.id,
      status: "pending",
    });

    return res.status(200).json({
      message: "Payment order created successfully.",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID,

      paymentType: packageId
        ? "package"
        : "single_session",

      package: selectedPackage
        ? {
            id: selectedPackage._id,
            name: selectedPackage.name,
            sessionCount: selectedPackage.sessionCount,
            totalPrice: selectedPackage.totalPrice,
            perSessionRate: selectedPackage.perSessionRate,
            validityDays: selectedPackage.validityDays,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Create public payment order error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error creating payment order.",
    });
  }
};

// ==========================================
// VERIFY PAYMENT
// Therapist-protected existing route
// ==========================================

const verifyPayment = async (req, res) => {
  try {
    const therapistId = req.therapist?._id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentDbId,
    } = req.body;

    if (!therapistId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !paymentDbId
    ) {
      return res.status(400).json({
        message: "Payment verification details are required.",
      });
    }

    const payment = await Payment.findOne({
      _id: paymentDbId,
      therapist: therapistId,
    })
      .populate("therapist", "name email")
      .populate("client", "name email");

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found.",
      });
    }

    if (payment.gateway_order_id !== razorpay_order_id) {
      return res.status(400).json({
        message: "Payment order does not match.",
      });
    }

    return completePaymentVerification(
      req,
      res,
      payment,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
  } catch (error) {
    console.error(
      "Verify payment error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error verifying payment.",
    });
  }
};

// ==========================================
// VERIFY PUBLIC CLIENT PAYMENT
// Module 4
// ==========================================

const verifyPublicPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentDbId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !paymentDbId
    ) {
      return res.status(400).json({
        message: "Payment verification details are required.",
      });
    }

    const payment = await Payment.findById(paymentDbId)
      .populate("therapist", "name email")
      .populate("client", "name email");

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found.",
      });
    }

    if (payment.gateway_order_id !== razorpay_order_id) {
      return res.status(400).json({
        message: "Payment order does not match.",
      });
    }

    return completePaymentVerification(
      req,
      res,
      payment,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
  } catch (error) {
    console.error(
      "Public payment verification error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error verifying payment.",
    });
  }
};

// ==========================================
// COMMON PAYMENT VERIFICATION
// ==========================================

const completePaymentVerification = async (
  req,
  res,
  payment,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  try {
    // ========================================
    // PREVENT DOUBLE VERIFICATION
    // ========================================

    if (payment.status === "completed") {
      return res.status(200).json({
        message: "Payment already verified.",

        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          transactionId: payment.gateway_transaction_id,
          invoiceNumber: payment.invoice_number,
          invoiceUrl: payment.invoice_url,
        },
      });
    }

    // ========================================
    // RAZORPAY SECRET
    // ========================================

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        message: "Razorpay secret is not configured.",
      });
    }

    // ========================================
    // VERIFY RAZORPAY PAYMENT SIGNATURE
    // ========================================

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      payment.status = "failed";

      await payment.save();

      return res.status(400).json({
        message: "Payment signature verification failed.",
      });
    }

    // ========================================
    // MARK PAYMENT COMPLETED
    // ========================================

    payment.gateway_transaction_id =
      razorpayPaymentId;

    payment.gateway_signature =
      razorpaySignature;

    payment.status = "completed";

    // ========================================
    // GENERATE INVOICE
    // ========================================

    const invoiceNum = `INV-${Date.now()
      .toString()
      .slice(-6)}`;

    payment.invoice_number = invoiceNum;

    try {
      const invoiceResult = await generateInvoice({
        invoiceNumber: invoiceNum,
        amount: payment.amount,
        currency: payment.currency || "INR",
        payment,
        client: payment.client,
        therapist: payment.therapist,
        packageInfo: null,
      });

      if (invoiceResult?.downloadUrl) {
        payment.invoice_url =
          invoiceResult.downloadUrl;
      }
    } catch (invoiceError) {
      console.error(
        "Invoice generation error:",
        invoiceError.message
      );
    }

    await payment.save();

    // ========================================
    // INITIALIZE CLIENT PACKAGE
    // ========================================

    if (payment.package && payment.client) {
      const pkg = await Package.findById(
        payment.package
      );

      if (pkg) {
        const existingClientPackage =
          await ClientPackage.findOne({
            payment: payment._id,
          });

        if (!existingClientPackage) {
          const expiresAt = new Date();

          expiresAt.setDate(
            expiresAt.getDate() +
              (pkg.validityDays || 90)
          );

          await ClientPackage.create({
            client: payment.client._id,
            therapist: payment.therapist._id,
            package: pkg._id,
            payment: payment._id,

            totalSessions: pkg.sessionCount,
            sessionsUsed: 0,
            sessionsRemaining: pkg.sessionCount,

            expiresAt,
            status: "active",
          });
        }
      }
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({
      message: "Payment verified successfully!",

      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        transactionId:
          payment.gateway_transaction_id,
        invoiceNumber:
          payment.invoice_number,
        invoiceUrl:
          payment.invoice_url,
      },
    });
  } catch (error) {
    console.error(
      "Complete payment verification error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error completing payment.",
    });
  }
};

// ==========================================
// RAZORPAY WEBHOOK HANDLER
// ==========================================

const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    const webhookSignature =
      req.headers["x-razorpay-signature"];

    if (!webhookSecret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Razorpay webhook secret is not configured.",
      });
    }

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay webhook signature is missing.",
      });
    }

    // IMPORTANT:
    // server.js stores the original raw request body
    // in req.rawBody before express.json() parses it.

    const rawBody = req.rawBody;

    if (!rawBody) {
      return res.status(400).json({
        success: false,
        message: "Raw webhook body is missing.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const signaturesMatch =
      expectedSignature.length ===
        webhookSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(webhookSignature)
      );

    if (!signaturesMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay webhook signature.",
      });
    }

    const event = req.body;

    console.log(
      "Razorpay webhook received:",
      event.event
    );

    // ========================================
    // PAYMENT CAPTURED
    // ========================================

    if (event.event === "payment.captured") {
      const paymentEntity =
        event.payload?.payment?.entity;

      if (!paymentEntity) {
        return res.status(400).json({
          success: false,
          message:
            "Payment information missing from webhook.",
        });
      }

      const razorpayOrderId =
        paymentEntity.order_id;

      const razorpayPaymentId =
        paymentEntity.id;

      if (
        !razorpayOrderId ||
        !razorpayPaymentId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Razorpay order ID or payment ID is missing.",
        });
      }

      const payment = await Payment.findOne({
        gateway_order_id: razorpayOrderId,
      });

      if (!payment) {
        console.warn(
          `No UNFAZED payment found for Razorpay order ${razorpayOrderId}`
        );

        return res.status(200).json({
          success: true,
          message:
            "Webhook received but payment record was not found.",
        });
      }

      // Prevent duplicate webhook processing
      if (payment.status === "completed") {
        return res.status(200).json({
          success: true,
          message: "Payment was already completed.",
        });
      }

      payment.status = "completed";

      payment.gateway_transaction_id =
        razorpayPaymentId;

      await payment.save();

      console.log(
        `Payment ${payment._id} marked completed from Razorpay webhook.`
      );
    }

    // ========================================
    // PAYMENT FAILED
    // ========================================

    if (event.event === "payment.failed") {
      const paymentEntity =
        event.payload?.payment?.entity;

      if (paymentEntity) {
        const razorpayOrderId =
          paymentEntity.order_id;

        const payment = await Payment.findOne({
          gateway_order_id: razorpayOrderId,
        });

        if (
          payment &&
          payment.status !== "completed"
        ) {
          payment.status = "failed";

          await payment.save();

          console.log(
            `Payment ${payment._id} marked failed from Razorpay webhook.`
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully.",
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
};

// ==========================================
// GET THERAPIST PACKAGES
// ==========================================

const getPackages = async (req, res) => {
  try {
    const therapistId = req.therapist?._id;

    if (!therapistId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const packages = await Package.find({
      therapist: therapistId,
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      packages,
    });
  } catch (error) {
    console.error(
      "Get packages error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error fetching packages.",
    });
  }
};

// ==========================================
// GET PUBLIC CLIENT PACKAGES
// MODULE 4
// ==========================================

const getPublicPackages = async (req, res) => {
  try {
    const { therapistId } = req.query;

    if (!therapistId) {
      return res.status(400).json({
        message: "Therapist ID is required.",
      });
    }

    const packages = await Package.find({
      therapist: therapistId,
      isActive: true,
      sessionCount: {
        $in: [3, 6, 12],
      },
    }).sort({
      sessionCount: 1,
    });

    return res.status(200).json({
      packages,
    });
  } catch (error) {
    console.error(
      "Get public packages error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error fetching packages.",
    });
  }
};

// ==========================================
// CREATE THERAPIST PACKAGE
// ==========================================

const createPackage = async (req, res) => {
  try {
    const therapistId = req.therapist?._id;

    const {
      name,
      description,
      sessionCount,
      totalPrice,
      validityDays,
    } = req.body;

    if (!therapistId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Package name is required.",
      });
    }

    const count = Number(sessionCount);
    const price = Number(totalPrice);
    const validity = Number(validityDays);

    // ========================================
    // ONLY 3 / 6 / 12 SESSION PACKAGES
    // ========================================

    if (![3, 6, 12].includes(count)) {
      return res.status(400).json({
        message:
          "Package session count must be 3, 6, or 12 sessions.",
      });
    }

    if (Number.isNaN(price) || price <= 0) {
      return res.status(400).json({
        message:
          "Package price must be greater than zero.",
      });
    }

    if (
      !Number.isNaN(validity) &&
      validity <= 0
    ) {
      return res.status(400).json({
        message:
          "Package validity must be greater than zero.",
      });
    }

    const finalValidity =
      Number.isNaN(validity) || validity === 0
        ? 90
        : validity;

    const perSessionRate =
      Math.round((price / count) * 100) / 100;

    const newPackage = await Package.create({
      therapist: therapistId,
      name: name.trim(),
      description: description || "",
      sessionCount: count,
      totalPrice: price,
      perSessionRate,
      validityDays: finalValidity,
      isActive: true,
    });

    return res.status(201).json({
      message: "Package created successfully.",
      package: newPackage,
    });
  } catch (error) {
    console.error(
      "Create package error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error creating package.",
    });
  }
};

// ==========================================
// GET PAYMENTS FOR LOGGED-IN THERAPIST
// ==========================================

const getPayments = async (req, res) => {
  try {
    const therapistId = req.therapist?._id;

    if (!therapistId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const payments = await Payment.find({
      therapist: therapistId,
    })
      .populate("client", "name email")
      .populate(
        "session",
        "startTime endTime"
      )
      .populate(
        "package",
        "name sessionCount"
      )
      .sort("-createdAt");

    // ========================================
    // TOTAL COMPLETED REVENUE
    // ========================================

    const totalRevenue = payments
      .filter(
        (payment) =>
          payment.status === "completed"
      )
      .reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    return res.status(200).json({
      payments,
      totalRevenue,
    });
  } catch (error) {
    console.error(
      "Get payments error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error fetching payments.",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createOrder,
  createPublicOrder,
  verifyPayment,
  verifyPublicPayment,
  handleRazorpayWebhook,
  getPackages,
  getPublicPackages,
  createPackage,
  getPayments,
};