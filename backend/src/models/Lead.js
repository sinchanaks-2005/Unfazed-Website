const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    concern: {
      type: String,
      trim: true,
      default: "",
    },

    preferredLanguage: {
      type: String,
      default: "English",
    },

    assignedTherapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: false,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "converted", "closed"],
      default: "new",
      index: true,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Lead", leadSchema);

