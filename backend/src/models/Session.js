const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },

    clientName: {
      type: String,
      trim: true,
      default: "",
    },

    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    clientPhone: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      enum: [30, 45, 60, 90],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "booked",
        "completed",
        "cancelled",
      ],
      default: "booked",
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Session",
  sessionSchema
);