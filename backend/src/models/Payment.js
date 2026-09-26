const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: false,
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: false,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    platform_fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    net_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    gateway: {
      type: String,
      default: "razorpay",
    },

    gateway_order_id: {
      type: String,
      default: "",
    },

    gateway_transaction_id: {
      type: String,
      default: "",
      index: true,
    },

    gateway_signature: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    invoice_number: {
      type: String,
      default: "",
    },

    invoice_url: {
      type: String,
      default: "",
    },

    payment_method: {
      type: String,
      default: "card", // card, upi, netbanking
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);

