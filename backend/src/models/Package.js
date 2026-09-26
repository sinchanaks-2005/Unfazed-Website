const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    sessionCount: {
      type: Number,
      enum: [3, 6, 12],
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    perSessionRate: {
      type: Number,
      required: true,
      min: 0,
    },

    validityDays: {
      type: Number,
      default: 90,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Package", packageSchema);

