/**
 * Socket.IO Real-time Chat Configuration
 * Therapist <-> Client chat channels
 */

const jwt = require("jsonwebtoken");
const Therapist = require("../models/Therapist");
const Message = require("../models/Message");

const initChatSocket = (io) => {
  // Authenticate Socket.IO connection using existing therapist JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const therapist = await Therapist.findById(
        decoded.therapistId
      ).select("-password_hash");

      if (!therapist) {
        return next(new Error("Therapist not found"));
      }

      socket.therapist = therapist;

      next();
    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Therapist or Client joins chat room
    socket.on(
      "join_room",
      ({ roomId, userId, role }) => {
        socket.join(roomId);

        socket.to(roomId).emit("user_joined", {
          userId,
          role,
          timestamp: new Date(),
        });
      }
    );

    // Mark client messages as read by therapist
    socket.on(
      "mark_messages_read",
      async ({
        roomId,
        clientId,
      }) => {
        try {
          if (!roomId || !clientId) {
            return;
          }

          const therapistId =
            socket.therapist?._id;

          if (!therapistId) {
            return;
          }

          const updatedAt = new Date();

          const result =
            await Message.updateMany(
              {
                therapist: therapistId,
                client: clientId,
                roomId,
                senderRole: "client",
                readAt: null,
              },
              {
                $set: {
                  readAt: updatedAt,
                },
              }
            );

          if (result.modifiedCount > 0) {
            io.to(roomId).emit(
              "messages_read",
              {
                roomId,
                clientId,
                readAt: updatedAt,
              }
            );
          }
        } catch (error) {
          console.error(
            "Mark messages read error:",
            error.message
          );
        }
      }
    );

    // Handle incoming chat message
    socket.on(
      "send_message",
      async ({
        roomId,
        therapistId,
        clientId,
        senderId,
        senderName,
        senderRole,
        text,
      }) => {
        try {
          if (
            !roomId ||
            !therapistId ||
            !clientId ||
            !senderId ||
            !senderName ||
            !senderRole ||
            !text?.trim()
          ) {
            return;
          }

          if (
            senderRole !== "therapist" &&
            senderRole !== "client"
          ) {
            return;
          }

          // Therapist socket must use the authenticated therapist
          if (
            socket.therapist &&
            socket.therapist._id.toString() !==
              therapistId.toString()
          ) {
            return socket.emit("message_error", {
              message: "Unauthorized therapist.",
            });
          }

          const message = await Message.create({
            therapist: therapistId,
            client: clientId,
            roomId,
            senderId,
            senderRole,
            senderName,
            text: text.trim(),
          });

          const messagePayload = {
            id: message._id,
            roomId: message.roomId,
            therapistId: message.therapist,
            clientId: message.client,
            senderId: message.senderId,
            senderRole: message.senderRole,
            text: message.text,
            timestamp: message.createdAt,
            readAt: message.readAt,
          };

          io.to(roomId).emit(
            "receive_message",
            messagePayload
          );
        } catch (error) {
          console.error(
            "Send message error:",
            error.message
          );

          socket.emit("message_error", {
            message: "Unable to send message.",
          });
        }
      }
    );

    // Typing indicators
    socket.on(
      "typing",
      ({ roomId, senderName }) => {
        socket.to(roomId).emit("user_typing", {
          senderName,
        });
      }
    );

    socket.on(
      "stop_typing",
      ({ roomId }) => {
        socket.to(roomId).emit(
          "user_stop_typing"
        );
      }
    );

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });
};

module.exports = initChatSocket;