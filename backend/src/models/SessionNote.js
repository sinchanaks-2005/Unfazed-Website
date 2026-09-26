const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: false,
    },

    type: {
      type: String,
      enum: ["private", "shared"],
      required: true,
      default: "private",
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "Session Note",
    },

    template: {
      type: String,
      enum: ["freeform", "SOAP", "DAP"],
      default: "freeform",
    },

    content: {
      type: String, // Rich-text HTML or markdown from TipTap
      default: "",
    },

    soapData: {
      subjective: { type: String, default: "" },
      objective: { type: String, default: "" },
      assessment: { type: String, default: "" },
      plan: { type: String, default: "" },
    },

    dapData: {
      data: { type: String, default: "" },
      assessment: { type: String, default: "" },
      plan: { type: String, default: "" },
    },

    sharedWithClientAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper serializer to guarantee private notes are never sent to clients
sessionNoteSchema.methods.toClientJSON = function () {
  if (this.type === "private") {
    return null;
  }
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    sharedWithClientAt: this.sharedWithClientAt || this.createdAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("SessionNote", sessionNoteSchema);

