const Message = require("../models/Message");
const Client = require("../models/Client");

const getChatHistory = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        message: "Client ID is required",
      });
    }

    // Make sure this client belongs to the authenticated therapist
    const client = await Client.findOne({
      _id: clientId,
      therapist: req.therapist._id,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    const messages = await Message.find({
      therapist: req.therapist._id,
      client: clientId,
    })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map((message) => ({
      id: message._id,
      roomId: message.roomId,
      therapistId: message.therapist,
      clientId: message.client,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      text: message.text,
      timestamp: message.createdAt,
      readAt: message.readAt,
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error(
      "Get chat history error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to load chat history",
    });
  }
};

module.exports = {
  getChatHistory,
};