const crypto = require("crypto");
const Payment = require("../models/Payment");
const Package = require("../models/Package");
const ClientPackage = require("../models/ClientPackage");
const Therapist = require("../models/Therapist");
const razorpay = require("../config/razorpay");
const { generateInvoice } = require("../services/invoiceService");

// ==========================================
// CREATE PAYMENT ORDER
// Session or Package
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

    const therapist =
      await Therapist.findById(therapistId);

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found.",
      });
    }

    const amountInPaise = Math.round(
      Number(amount) * 100
    );

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
        clientId: clientId
          ? clientId.toString()
          : "",
        sessionId: sessionId
          ? sessionId.toString()
          : "",
        packageId: packageId
          ? packageId.toString()
          : "",
      },
    });

    const grossAmount = Number(amount);
    const platformFee = Math.round(
      grossAmount * 0.05
    );
    const netAmount =
      grossAmount - platformFee;

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
    console.error(
      "Create order error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error creating payment order.",
    });
  }
};

// ==========================================
// VERIFY PAYMENT & GENERATE INVOICE
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
        message:
          "Payment verification details are required.",
      });
    }

    const payment =
      await Payment.findOne({
        _id: paymentDbId,
        therapist: therapistId,
      })
        .populate(
          "therapist",
          "name email"
        )
        .populate(
          "client",
          "name email"
        );

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found.",
      });
    }

    if (
      payment.gateway_order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        message:
          "Payment order does not match.",
      });
    }

    if (payment.status === "completed") {
      return res.status(200).json({
        message: "Payment already verified.",
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
    }

    const secret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        message:
          "Razorpay secret is not configured.",
      });
    }

    const generatedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    if (
      generatedSignature !==
      razorpay_signature
    ) {
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        message:
          "Payment signature verification failed.",
      });
    }

    payment.gateway_transaction_id =
      razorpay_payment_id;

    payment.gateway_signature =
      razorpay_signature;

    payment.status = "completed";

    // ==========================================
    // GENERATE INVOICE
    // ==========================================

    const invoiceNum =
      `INV-${Date.now()
        .toString()
        .slice(-6)}`;

    payment.invoice_number = invoiceNum;

    try {
      const invoiceResult =
        await generateInvoice({
          invoiceNumber: invoiceNum,
          therapistName:
            payment.therapist?.name ||
            "Therapist",
          therapistEmail:
            payment.therapist?.email ||
            "",
          clientName:
            payment.client?.name ||
            "Client",
          clientEmail:
            payment.client?.email ||
            "",
          amount: payment.amount,
          transactionId:
            payment.gateway_transaction_id,
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

    // ==========================================
    // INITIALIZE CLIENT PACKAGE
    // ==========================================

    if (
      payment.package &&
      payment.client
    ) {
      const pkg =
        await Package.findById(
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
            client:
              payment.client._id,
            therapist:
              payment.therapist._id,
            package: pkg._id,
            payment: payment._id,
            totalSessions:
              pkg.sessionCount,
            sessionsUsed: 0,
            sessionsRemaining:
              pkg.sessionCount,
            expiresAt,
            status: "active",
          });
        }
      }
    }

    return res.status(200).json({
      message:
        "Payment verified successfully!",

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
      "Verify payment error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error verifying payment.",
    });
  }
};

// ==========================================
// RAZORPAY WEBHOOK HANDLER
// ==========================================

const handleRazorpayWebhook = async (
  req,
  res
) => {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    const webhookSignature =
      req.headers[
        "x-razorpay-signature"
      ];

    if (!webhookSecret) {
      return res.status(500).json({
        message:
          "Razorpay webhook secret is not configured.",
      });
    }

    if (!webhookSignature) {
      return res.status(400).json({
        message:
          "Webhook signature is missing.",
      });
    }

    const body = JSON.stringify(
      req.body
    );

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(body)
        .digest("hex");

    if (
      expectedSignature !==
      webhookSignature
    ) {
      return res.status(400).json({
        message:
          "Invalid webhook signature.",
      });
    }

    const event = req.body.event;

    const paymentEntity =
      req.body.payload?.payment?.entity;

    if (
      event === "payment.captured" &&
      paymentEntity
    ) {
      const orderId =
        paymentEntity.order_id;

      const payment =
        await Payment.findOne({
          gateway_order_id: orderId,
        });

      if (
        payment &&
        payment.status !== "completed"
      ) {
        payment.status = "completed";

        payment.gateway_transaction_id =
          paymentEntity.id;

        await payment.save();
      }
    }

    return res.status(200).json({
      status: "ok",
    });
  } catch (error) {
    console.error(
      "Webhook processing error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Webhook processing error.",
    });
  }
};

// ==========================================
// GET THERAPIST PACKAGES
// ==========================================

const getPackages = async (req, res) => {
  try {
    const therapistId =
      req.therapist?._id;

    if (!therapistId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const packages =
      await Package.find({
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
      message:
        "Server error fetching packages.",
    });
  }
};

// ==========================================
// CREATE THERAPIST PACKAGE
// ==========================================

const createPackage = async (
  req,
  res
) => {
  try {
    const therapistId =
      req.therapist?._id;

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
        message:
          "Package name is required.",
      });
    }

    const count = Number(sessionCount);
    const price = Number(totalPrice);
    const validity = Number(
      validityDays
    );

    if (![3, 6, 12].includes(count)) {
      return res.status(400).json({
        message:
          "Package session count must be 3, 6, or 12 sessions.",
      });
    }

    if (
      Number.isNaN(price) ||
      price <= 0
    ) {
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
      Number.isNaN(validity) ||
      validity === 0
        ? 90
        : validity;

    const perSessionRate =
      Math.round(
        (price / count) * 100
      ) / 100;

    const newPackage =
      await Package.create({
        therapist: therapistId,
        name: name.trim(),
        description:
          description || "",
        sessionCount: count,
        totalPrice: price,
        perSessionRate,
        validityDays:
          finalValidity,
        isActive: true,
      });

    return res.status(201).json({
      message:
        "Package created successfully.",
      package: newPackage,
    });
  } catch (error) {
    console.error(
      "Create package error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error creating package.",
    });
  }
};

// ==========================================
// GET PAYMENTS FOR LOGGED IN THERAPIST
// ==========================================

const getPayments = async (
  req,
  res
) => {
  try {
    const therapistId =
      req.therapist?._id;

    if (!therapistId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const payments =
      await Payment.find({
        therapist: therapistId,
      })
        .populate(
          "client",
          "name email"
        )
        .populate(
          "session",
          "startTime endTime"
        )
        .populate(
          "package",
          "name sessionCount"
        )
        .sort("-createdAt");

    const totalRevenue =
      payments
        .filter(
          (payment) =>
            payment.status ===
            "completed"
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
  verifyPayment,
  handleRazorpayWebhook,
  getPackages,
  createPackage,
  getPayments,
};