import { useEffect, useRef, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

function ChatWindow({
  roomId,
  therapistId,
  clientId,
  userId,
  userName,
  userRole,
}) {
  const socketRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [typingUser, setTypingUser] = useState("");

  // Load saved chat history
  useEffect(() => {
    if (!clientId) {
      return;
    }

    const loadChatHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("Authentication token not found.");
          return;
        }

        const response = await axiosInstance.get(
          `/chat/history/${clientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setMessages(response.data.messages || []);
        }
      } catch (error) {
        console.error(
          "Unable to load chat history:",
          error.response?.data?.message ||
            error.message
        );
      }
    };

    loadChatHistory();
  }, [clientId]);

  // Connect to Socket.IO
  useEffect(() => {
    if (!roomId || !therapistId || !clientId || !userId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Authentication token not found.");
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.emit("join_room", {
      roomId,
      userId,
      role: userRole,
    });

    // Mark client messages as read when therapist opens chat
    if (userRole === "therapist") {
      socket.emit("mark_messages_read", {
        roomId,
        clientId,
      });
    }

    socket.on("receive_message", (message) => {
      setMessages((previous) => {
        const alreadyExists = previous.some(
          (item) => item.id === message.id
        );

        if (alreadyExists) {
          return previous;
        }

        return [...previous, message];
      });
    });

    // Update read status on therapist's own messages
    socket.on(
      "messages_read",
      ({ roomId: readRoomId, readAt }) => {
        if (readRoomId !== roomId) {
          return;
        }

        setMessages((previous) =>
          previous.map((message) => {
            if (
              String(message.senderId) ===
              String(userId)
            ) {
              return {
                ...message,
                readAt,
              };
            }

            return message;
          })
        );
      }
    );

    socket.on("user_typing", ({ senderName }) => {
      setTypingUser(senderName);
    });

    socket.on("user_stop_typing", () => {
      setTypingUser("");
    });

    socket.on("message_error", ({ message }) => {
      console.error(message);
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Chat connection error:",
        error.message
      );
    });

    return () => {
      socket.off("receive_message");
      socket.off("messages_read");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("message_error");
      socket.off("connect_error");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    roomId,
    therapistId,
    clientId,
    userId,
    userRole,
  ]);

  const handleSendMessage = () => {
    const text = messageText.trim();

    if (!text || !socketRef.current) {
      return;
    }

    socketRef.current.emit("send_message", {
      roomId,
      therapistId,
      clientId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      text,
    });

    setMessageText("");

    socketRef.current.emit("stop_typing", {
      roomId,
    });
  };

  const handleTyping = (event) => {
    setMessageText(event.target.value);

    if (!socketRef.current) {
      return;
    }

    if (event.target.value.trim()) {
      socketRef.current.emit("typing", {
        roomId,
        senderName: userName,
      });
    } else {
      socketRef.current.emit("stop_typing", {
        roomId,
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                String(message.senderId) ===
                String(userId)
                  ? "chat-message own-message"
                  : "chat-message"
              }
            >
              <strong>{message.senderName}</strong>

              <p>{message.text}</p>

              <small>
                {new Date(
                  message.timestamp
                ).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>

              {String(message.senderId) ===
                String(userId) &&
                message.readAt && (
                  <small
                    style={{
                      marginLeft: "8px",
                    }}
                  >
                    Read
                  </small>
                )}
            </div>
          ))
        )}
      </div>

      {typingUser && (
        <div className="typing-indicator">
          {typingUser} is typing...
        </div>
      )}

      <div className="chat-input-area">
        <textarea
          value={messageText}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows="2"
        />

        <button
          type="button"
          onClick={handleSendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;