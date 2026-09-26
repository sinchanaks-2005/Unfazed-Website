/**
 * Socket.IO Real-time Chat Configuration
 * Therapist <-> Client chat channels
 */
const initChatSocket = (io) => {
  io.on("connection", (socket) => {
    // Client or Therapist joins room
    socket.on("join_room", ({ roomId, userId, role }) => {
      socket.join(roomId);
      socket.to(roomId).emit("user_joined", { userId, role, timestamp: new Date() });
    });

    // Handle incoming chat message
    socket.on("send_message", ({ roomId, senderId, senderName, senderRole, text }) => {
      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        roomId,
        senderId,
        senderName,
        senderRole, // "therapist" | "client"
        text,
        timestamp: new Date().toISOString(),
      };

      // Broadcast message to everyone in the room (including sender or use io.to)
      io.to(roomId).emit("receive_message", messagePayload);
    });

    // Typing indicators
    socket.on("typing", ({ roomId, senderName }) => {
      socket.to(roomId).emit("user_typing", { senderName });
    });

    socket.on("stop_typing", ({ roomId }) => {
      socket.to(roomId).emit("user_stop_typing");
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });
};

module.exports = initChatSocket;

