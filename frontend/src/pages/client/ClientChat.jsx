import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";
const API_URL = "http://localhost:5000/api";

function ClientChat() {
  const socketRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] =
    useState("");

  const [clientId, setClientId] = useState("");
  const [therapistId, setTherapistId] = useState("");

  const [clientName, setClientName] =
    useState("Client");

  const [therapistName, setTherapistName] =
    useState("Therapist");

  /*
   * Module 6 demo client chat.
   *
   * Client ID and therapist ID can be supplied through
   * the URL:
   *
   * /client/chat?clientId=...&therapistId=...
   *
   * This allows the chat interface to be tested without
   * creating a new client authentication system.
   */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const urlClientId =
      params.get("clientId") || "";

    const urlTherapistId =
      params.get("therapistId") || "";

    const urlClientName =
      params.get("clientName") ||
      "Client";

    const urlTherapistName =
      params.get("therapistName") ||
      "Therapist";

    setClientId(urlClientId);
    setTherapistId(urlTherapistId);
    setClientName(urlClientName);
    setTherapistName(urlTherapistName);
  }, []);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    const loadChatHistory = async () => {
      try {
        const token =
          localStorage.getItem("token");

        if (!token) {
          setConnectionError(
            "Authentication token not found."
          );

          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/chat/history/${clientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success) {
          setMessages(
            response.data.messages || []
          );
        }
      } catch (error) {
        console.error(
          "Unable to load client chat history:",
          error
        );

        setConnectionError(
          error.response?.data?.message ||
            "Unable to load chat history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !therapistId) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setConnectionError(
        "Authentication token not found."
      );

      return;
    }

    const roomId =
      `${therapistId}_${clientId}`;

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionError("");

      socket.emit("join_room", {
        roomId,
        userId: clientId,
        role: "client",
      });
    });

    socket.on(
      "receive_message",
      (message) => {
        if (
          String(message.clientId) !==
          String(clientId)
        ) {
          return;
        }

        setMessages((previous) => {
          const alreadyExists =
            previous.some(
              (item) =>
                String(item.id) ===
                String(message.id)
            );

          if (alreadyExists) {
            return previous;
          }

          return [...previous, message];
        });
      }
    );

    socket.on(
      "user_typing",
      ({ senderName }) => {
        setTypingUser(senderName || "Therapist");
      }
    );

    socket.on(
      "user_stop_typing",
      () => {
        setTypingUser("");
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Client chat connection error:",
          error.message
        );

        setConnectionError(
          "Unable to connect to chat."
        );
      }
    );

    return () => {
      socket.off("connect");
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("connect_error");

      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    clientId,
    therapistId,
  ]);

  const handleTyping = (event) => {
    const value = event.target.value;

    setMessageText(value);

    if (!socketRef.current) {
      return;
    }

    const roomId =
      `${therapistId}_${clientId}`;

    if (value.trim()) {
      socketRef.current.emit("typing", {
        roomId,
        senderName: clientName,
      });
    } else {
      socketRef.current.emit(
        "stop_typing",
        {
          roomId,
        }
      );
    }
  };

  const handleSendMessage = () => {
    const text =
      messageText.trim();

    if (
      !text ||
      !socketRef.current ||
      !clientId ||
      !therapistId
    ) {
      return;
    }

    const roomId =
      `${therapistId}_${clientId}`;

    socketRef.current.emit(
      "send_message",
      {
        roomId,
        therapistId,
        clientId,
        senderId: clientId,
        senderName: clientName,
        senderRole: "client",
        text,
      }
    );

    setMessageText("");

    socketRef.current.emit(
      "stop_typing",
      {
        roomId,
      }
    );
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  if (!clientId || !therapistId) {
    return (
      <div
        style={{
          maxWidth: "900px",
          margin: "40px auto",
          padding: "24px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Client Chat</h2>

        <p>
          Client ID and therapist ID are required.
        </p>

        <p>
          Open this page with:
        </p>

        <code>
          /client/chat?clientId=CLIENT_ID&therapistId=THERAPIST_ID
        </code>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: "6px",
            }}
          >
            Chat with {therapistName}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Client Portal
          </p>
        </div>

        {connectionError && (
          <div
            style={{
              padding: "12px 20px",
              background: "#fff4f4",
              color: "#b42318",
              borderBottom:
                "1px solid #fecdca",
            }}
          >
            {connectionError}
          </div>
        )}

        <div
          style={{
            height: "450px",
            overflowY: "auto",
            padding: "20px",
            background: "#f8fafc",
          }}
        >
          {loading ? (
            <p>
              Loading chat history...
            </p>
          ) : messages.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                marginTop: "180px",
              }}
            >
              No messages yet. Start the
              conversation.
            </p>
          ) : (
            messages.map((message) => {
              const isOwnMessage =
                String(
                  message.senderId
                ) === String(clientId);

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      isOwnMessage
                        ? "flex-end"
                        : "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding:
                        "10px 14px",
                      borderRadius: "14px",
                      background:
                        isOwnMessage
                          ? "#7c6ee6"
                          : "#ffffff",
                      color:
                        isOwnMessage
                          ? "#ffffff"
                          : "#111827",
                      border:
                        isOwnMessage
                          ? "none"
                          : "1px solid #e5e7eb",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        fontSize:
                          "13px",
                      }}
                    >
                      {message.senderName}
                    </strong>

                    <div>
                      {message.text}
                    </div>

                    <small
                      style={{
                        display: "block",
                        marginTop: "5px",
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp
                        ? new Date(
                            message.timestamp
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute:
                                "2-digit",
                            }
                          )
                        : ""}
                    </small>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {typingUser && (
          <div
            style={{
              padding:
                "8px 20px",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            {typingUser} is typing...
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "15px",
            borderTop:
              "1px solid #e5e7eb",
          }}
        >
          <textarea
            value={messageText}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              padding: "10px",
              border:
                "1px solid #d1d5db",
              borderRadius: "10px",
              fontFamily:
                "inherit",
              fontSize: "14px",
            }}
          />

          <button
            type="button"
            onClick={
              handleSendMessage
            }
            style={{
              alignSelf: "stretch",
              padding:
                "0 22px",
              border: "none",
              borderRadius: "10px",
              background:
                "#7c6ee6",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientChat;