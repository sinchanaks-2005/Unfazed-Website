const SessionNote = require("../models/SessionNote");
const Client = require("../models/Client");
const Session = require("../models/Session");
const { canAccess } = require("../services/entitlementService");

// ==========================================
// CREATE NOTE (Therapist Protected)
// ==========================================
const createNote = async (req, res) => {
  try {
    const therapistId = req.therapist._id;

    const {
      clientId,
      sessionId,
      type = "private",
      template = "freeform",
      title,
      content,
      soapData,
      dapData,
    } = req.body;

    if (!clientId) {
      return res.status(400).json({
        message: "Client ID is required.",
      });
    }

    // Verify client belongs to authenticated therapist
    const client = await Client.findOne({
      _id: clientId,
      therapist: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    // If session is provided, verify that it belongs
    // to the same therapist and client
    if (sessionId) {
      const session = await Session.findOne({
        _id: sessionId,
        therapist: therapistId,
        client: clientId,
      });

      if (!session) {
        return res.status(404).json({
          message: "Session not found for this client.",
        });
      }
    }

    const normalizedType =
      type === "shared" ? "shared" : "private";

    const normalizedTemplate = ["freeform", "SOAP", "DAP"].includes(template)
      ? template
      : "freeform";

    // SOAP/DAP templates require the appropriate entitlement
    if (
      normalizedTemplate === "SOAP" ||
      normalizedTemplate === "DAP"
    ) {
      const access = await canAccess(
        therapistId,
        `noteTemplates:${normalizedTemplate}`
      );

      if (!access.allowed) {
        return res.status(403).json({
          message: access.reason,
          upgradeRequired: true,
          currentTier: access.currentTier,
          requiredTier: access.requiredTier,
        });
      }
    }

    const note = await SessionNote.create({
      therapist: therapistId,
      client: clientId,
      session: sessionId || null,
      type: normalizedType,
      template: normalizedTemplate,
      title:
        title ||
        (normalizedType === "shared"
          ? "Shared Reflection"
          : "Clinical Progress Note"),
      content: content || "",
      soapData: normalizedTemplate === "SOAP" ? soapData || {} : {},
      dapData: normalizedTemplate === "DAP" ? dapData || {} : {},
      sharedWithClientAt:
        normalizedType === "shared" ? new Date() : null,
    });

    return res.status(201).json({
      message: "Note saved successfully.",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error.message);

    return res.status(500).json({
      message: "Server error saving clinical note.",
    });
  }
};

// ==========================================
// GET ALL NOTES FOR CLIENT
// Therapist Protected
// Therapist can view private and shared notes
// ==========================================
const getTherapistClientNotes = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const { clientId } = req.params;

    // Verify client belongs to therapist
    const client = await Client.findOne({
      _id: clientId,
      therapist: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    const notes = await SessionNote.find({
      therapist: therapistId,
      client: clientId,
    }).sort("-createdAt");

    return res.status(200).json({
      notes,
    });
  } catch (error) {
    console.error("Get therapist notes error:", error.message);

    return res.status(500).json({
      message: "Server error fetching notes.",
    });
  }
};

// ==========================================
// GET CLIENT-FACING SHARED NOTES
// Only shared notes are returned
// Private clinical notes are NEVER exposed
// ==========================================
const getClientSharedNotes = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verify that the client exists
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    // STRICT FILTER:
    // Only notes explicitly marked as shared are returned.
    const notes = await SessionNote.find({
      client: clientId,
      type: "shared",
    })
      .select("title content sharedWithClientAt createdAt")
      .sort("-createdAt");

    return res.status(200).json({
      success: true,
      sharedNotes: notes,
    });
  } catch (error) {
    console.error("Get shared notes error:", error.message);

    return res.status(500).json({
      message: "Server error fetching shared notes.",
    });
  }
};

// ==========================================
// UPDATE NOTE
// Therapist Protected
// ==========================================
const updateNote = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const { noteId } = req.params;

    const existingNote = await SessionNote.findOne({
      _id: noteId,
      therapist: therapistId,
    });

    if (!existingNote) {
      return res.status(404).json({
        message: "Note not found.",
      });
    }

    // Only these fields are allowed to be edited.
    // Prevents therapist/client/session ownership
    // from being changed accidentally or maliciously.
    const allowedFields = [
      "type",
      "template",
      "title",
      "content",
      "soapData",
      "dapData",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    // Normalize note type
    if (updates.type !== undefined) {
      updates.type =
        updates.type === "shared" ? "shared" : "private";
    }

    // Normalize template
    if (updates.template !== undefined) {
      if (!["freeform", "SOAP", "DAP"].includes(updates.template)) {
        return res.status(400).json({
          message: "Invalid note template.",
        });
      }
    }

    // SOAP/DAP entitlement check when changing/using template
    const finalTemplate =
      updates.template !== undefined
        ? updates.template
        : existingNote.template;

    if (finalTemplate === "SOAP" || finalTemplate === "DAP") {
      const access = await canAccess(
        therapistId,
        `noteTemplates:${finalTemplate}`
      );

      if (!access.allowed) {
        return res.status(403).json({
          message: access.reason,
          upgradeRequired: true,
          currentTier: access.currentTier,
          requiredTier: access.requiredTier,
        });
      }
    }

    // If changing private -> shared, record the sharing time.
    if (
      updates.type === "shared" &&
      existingNote.type !== "shared"
    ) {
      updates.sharedWithClientAt = new Date();
    }

    // If changing shared -> private, remove client-visible timestamp.
    if (
      updates.type === "private" &&
      existingNote.type === "shared"
    ) {
      updates.sharedWithClientAt = null;
    }

    const note = await SessionNote.findOneAndUpdate(
      {
        _id: noteId,
        therapist: therapistId,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Note updated successfully.",
      note,
    });
  } catch (error) {
    console.error("Update note error:", error.message);

    return res.status(500).json({
      message: "Server error updating note.",
    });
  }
};

module.exports = {
  createNote,
  getTherapistClientNotes,
  getClientSharedNotes,
  updateNote,
};