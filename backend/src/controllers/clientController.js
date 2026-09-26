const Client = require("../models/Client");
const Session = require("../models/Session");
const SessionNote = require("../models/SessionNote");
const Payment = require("../models/Payment");

// ==========================================
// SYNC CLIENTS WITH REAL SESSION DATA
// ==========================================

const syncClientWithSessions = async (client) => {
  const now = new Date();

  const sessions = await Session.find({
    therapist: client.therapist,
    $or: [
      { client: client._id },
      {
        client: { $exists: false },
        clientEmail: client.email,
      },
      {
        client: null,
        clientEmail: client.email,
      },
    ],
    status: { $ne: "cancelled" },
  }).sort({ startTime: -1 });

  if (sessions.length === 0) {
    return client;
  }

  const futureOrCurrentSession = sessions.some(
    (session) => new Date(session.endTime) > now
  );

  const latestSession = sessions[0];

  client.totalSessions = sessions.length;
  client.lastSession = latestSession.startTime;

  /*
   * Client status is driven by the real session date/time.
   *
   * Future/current session  -> Active
   * All sessions completed  -> Inactive
   */
  client.status = futureOrCurrentSession
    ? "Active"
    : "Inactive";

  await client.save();

  return client;
};

// ==========================================
// CREATE MISSING CLIENTS FROM EXISTING SESSIONS
// ==========================================

const syncMissingClientsFromSessions = async (
  therapistId
) => {
  const sessions = await Session.find({
    therapist: therapistId,
    status: { $ne: "cancelled" },
  }).sort({ startTime: -1 });

  const clientMap = new Map();

  for (const session of sessions) {
    if (!session.clientEmail) {
      continue;
    }

    const email = session.clientEmail
      .trim()
      .toLowerCase();

    if (!clientMap.has(email)) {
      clientMap.set(email, {
        name: session.clientName || "Client",
        email,
        phone: session.clientPhone || "",
      });
    }
  }

  for (const data of clientMap.values()) {
    let client = await Client.findOne({
      therapist: therapistId,
      email: data.email,
    });

    if (!client) {
      client = await Client.create({
        therapist: therapistId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: "Active",
        tags: ["New Client"],
        totalSessions: 0,
      });
    }
  }
};

// ==========================================
// GET CLIENTS FOR LOGGED IN THERAPIST
// ==========================================

const getClients = async (req, res) => {
  try {
    const therapistId = req.therapist._id;

    const {
      search,
      status,
      tag,
      sort = "-updatedAt",
    } = req.query;

    /*
     * First make sure every real booking/session
     * has a corresponding CRM client.
     */
    await syncMissingClientsFromSessions(therapistId);

    const query = {
      therapist: therapistId,
    };

    if (status && status !== "All") {
      query.status = status;
    }

    if (tag) {
      query.tags = {
        $in: [tag],
      };
    }

    if (search && search.trim()) {
      query.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const allowedSortFields = [
      "name",
      "-name",
      "email",
      "-email",
      "createdAt",
      "-createdAt",
      "updatedAt",
      "-updatedAt",
      "lastSession",
      "-lastSession",
    ];

    const safeSort = allowedSortFields.includes(sort)
      ? sort
      : "-updatedAt";

    let clients = await Client.find(query).sort(
      safeSort
    );

    /*
     * Synchronize every client with their real
     * session history and real current date/time.
     */
    for (const client of clients) {
      await syncClientWithSessions(client);
    }

    /*
     * Re-fetch after synchronization so the response
     * contains the updated Active/Inactive status.
     */
    clients = await Client.find(query).sort(
      safeSort
    );

    return res.status(200).json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (error) {
    console.error(
      "Get clients error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error fetching clients.",
    });
  }
};

// ==========================================
// GET SINGLE CLIENT DETAILS
// ==========================================

const getClientById = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const { clientId } = req.params;

    const client = await Client.findOne({
      _id: clientId,
      therapist: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    await syncClientWithSessions(client);

    const [
      sessions,
      notes,
      payments,
    ] = await Promise.all([
      Session.find({
        therapist: therapistId,
        client: clientId,
      }).sort("-startTime"),

      SessionNote.find({
        therapist: therapistId,
        client: clientId,
      }).sort("-createdAt"),

      Payment.find({
        therapist: therapistId,
        client: clientId,
      }).sort("-createdAt"),
    ]);

    return res.status(200).json({
      success: true,
      client,
      sessions,
      notes,
      payments,
    });
  } catch (error) {
    console.error(
      "Get client by ID error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error fetching client profile.",
    });
  }
};

// ==========================================
// CREATE NEW CLIENT
// Entitlement is already enforced by the route
// ==========================================

const createClient = async (req, res) => {
  try {
    const therapistId = req.therapist._id;

    const {
      name,
      email,
      phone,
      tags,
      demographics,
      presentingConcern,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message:
          "Name and email are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingClient =
      await Client.findOne({
        therapist: therapistId,
        email: normalizedEmail,
      });

    if (existingClient) {
      return res.status(409).json({
        message:
          "A client with this email already exists.",
      });
    }

    const client = await Client.create({
      therapist: therapistId,
      name: name.trim(),
      email: normalizedEmail,
      phone: (phone || "").trim(),

      tags:
        Array.isArray(tags) && tags.length > 0
          ? tags
          : ["New Client"],

      demographics:
        demographics || {},

      presentingConcern:
        presentingConcern || "",

      status: "Active",
      totalSessions: 0,
    });

    return res.status(201).json({
      message: "Client created successfully.",
      client,
    });
  } catch (error) {
    console.error(
      "Create client error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error creating client.",
    });
  }
};

// ==========================================
// UPDATE CLIENT
// ==========================================

const updateClient = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const { clientId } = req.params;

    const {
      name,
      email,
      phone,
      demographics,
      presentingConcern,
      history,
      status,
      tags,
    } = req.body;

    const client = await Client.findOne({
      _id: clientId,
      therapist: therapistId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message:
            "Client name cannot be empty.",
        });
      }

      client.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          message:
            "Client email cannot be empty.",
        });
      }

      const duplicateClient =
        await Client.findOne({
          therapist: therapistId,
          email: normalizedEmail,
          _id: {
            $ne: clientId,
          },
        });

      if (duplicateClient) {
        return res.status(409).json({
          message:
            "Another client already uses this email.",
        });
      }

      client.email = normalizedEmail;
    }

    if (phone !== undefined) {
      client.phone = phone.trim();
    }

    if (demographics !== undefined) {
      client.demographics = {
        ...(client.demographics?.toObject
          ? client.demographics.toObject()
          : client.demographics || {}),
        ...(demographics || {}),
      };
    }

    if (presentingConcern !== undefined) {
      client.presentingConcern =
        presentingConcern;
    }

    if (history !== undefined) {
      client.history = history;
    }

    if (status !== undefined) {
      const validStatuses = [
        "Active",
        "Inactive",
        "Archived",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid client status.",
        });
      }

      client.status = status;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({
          message: "Tags must be an array.",
        });
      }

      client.tags = tags;
    }

    await client.save();

    return res.status(200).json({
      message: "Client updated successfully.",
      client,
    });
  } catch (error) {
    console.error(
      "Update client error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error updating client.",
    });
  }
};

// ==========================================
// SUBMIT CLIENT INTAKE & DIGITAL CONSENT
// ==========================================

const submitIntake = async (req, res) => {
  try {
    const {
      therapistId,
      name,
      email,
      phone,
      demographics,
      presentingConcern,
      history,
      consentAgreed,
    } = req.body;

    if (!therapistId || !name || !email) {
      return res.status(400).json({
        message:
          "Therapist ID, client name, and email are required.",
      });
    }

    if (!consentAgreed) {
      return res.status(400).json({
        message:
          "You must review and agree to the consent terms to proceed.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    let client = await Client.findOne({
      therapist: therapistId,
      email: normalizedEmail,
    });

    if (client) {
      client.name = name.trim();

      if (phone !== undefined) {
        client.phone = phone.trim();
      }

      if (demographics !== undefined) {
        client.demographics = {
          ...(client.demographics?.toObject
            ? client.demographics.toObject()
            : client.demographics || {}),
          ...(demographics || {}),
        };
      }

      if (presentingConcern !== undefined) {
        client.presentingConcern =
          presentingConcern;
      }

      if (history !== undefined) {
        client.history = history;
      }

      client.intakeCompleted = true;

      client.consent = {
        agreed: true,
        timestamp: new Date(),
        ipAddress: clientIp,
      };

      await client.save();
    } else {
      client = await Client.create({
        therapist: therapistId,
        name: name.trim(),
        email: normalizedEmail,
        phone: (phone || "").trim(),

        demographics:
          demographics || {},

        presentingConcern:
          presentingConcern || "",

        history: history || "",

        intakeCompleted: true,

        consent: {
          agreed: true,
          timestamp: new Date(),
          ipAddress: clientIp,
        },

        status: "Active",
        tags: ["New Client"],
      });
    }

    return res.status(200).json({
      message:
        "Intake form and consent submitted successfully.",

      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        intakeCompleted:
          client.intakeCompleted,
        consentTimestamp:
          client.consent.timestamp,
      },
    });
  } catch (error) {
    console.error(
      "Submit intake error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error submitting intake form.",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  submitIntake,
};