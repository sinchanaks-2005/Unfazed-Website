import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Sessions.css";

const API_BASE_URL = "http://localhost:5000/api";

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/scheduling/sessions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSessions(response.data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load sessions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /*
   * REAL DATE/TIME LOGIC
   *
   * A session is considered upcoming when its END time
   * is still in the future.
   *
   * A session is considered past when its END time
   * has already passed.
   */
  const upcomingSessions = useMemo(() => {
    const now = new Date();

    return sessions
      .filter((session) => {
        if (session.status === "cancelled") {
          return false;
        }

        const endTime = new Date(session.endTime);

        return endTime > now;
      })
      .sort(
        (a, b) =>
          new Date(a.startTime) - new Date(b.startTime)
      );
  }, [sessions]);

  const pastSessions = useMemo(() => {
    const now = new Date();

    return sessions
      .filter((session) => {
        const endTime = new Date(session.endTime);

        return (
          endTime <= now ||
          session.status === "completed" ||
          session.status === "cancelled"
        );
      })
      .sort(
        (a, b) =>
          new Date(b.startTime) - new Date(a.startTime)
      );
  }, [sessions]);

  /*
   * REAL COUNTS
   */
  const upcomingCount = upcomingSessions.length;

  const completedCount = pastSessions.filter(
    (session) => session.status !== "cancelled"
  ).length;

  const totalCount = sessions.length;

  /*
   * CURRENT TAB DATA
   */
  const filteredSessions =
    activeTab === "upcoming"
      ? upcomingSessions
      : pastSessions;

  /*
   * DATE FORMAT
   */
  const formatDate = (dateString) => {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /*
   * TIME FORMAT
   */
  const formatTime = (dateString) => {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  /*
   * STATUS
   */
  const getStatusClass = (session) => {
    if (session.status === "cancelled") {
      return "status-cancelled";
    }

    if (session.status === "completed") {
      return "status-completed";
    }

    const now = new Date();
    const endTime = new Date(session.endTime);

    if (endTime <= now) {
      return "status-completed";
    }

    return "status-booked";
  };

  const getStatusLabel = (session) => {
    if (session.status === "cancelled") {
      return "Cancelled";
    }

    if (session.status === "completed") {
      return "Completed";
    }

    const now = new Date();
    const endTime = new Date(session.endTime);

    if (endTime <= now) {
      return "Completed";
    }

    return "Booked";
  };

  if (loading) {
    return (
      <div className="sessions-page">
        <div className="sessions-container">
          <div className="sessions-loading">
            Loading sessions...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-page">
      <div className="sessions-container">
        {/* HEADER */}
        <div className="sessions-header">
          <div>
            <h1>Sessions</h1>

            <p>
              Manage your upcoming and completed therapy
              sessions.
            </p>
          </div>

          <button
            type="button"
            className="refresh-sessions-btn"
            onClick={fetchSessions}
          >
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="sessions-error">
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <div className="sessions-stats">
          <div className="session-stat-card">
            <span className="session-stat-label">
              Upcoming
            </span>

            <strong>{upcomingCount}</strong>
          </div>

          <div className="session-stat-card">
            <span className="session-stat-label">
              Completed
            </span>

            <strong>{completedCount}</strong>
          </div>

          <div className="session-stat-card">
            <span className="session-stat-label">
              Total
            </span>

            <strong>{totalCount}</strong>
          </div>
        </div>

        {/* TABS */}
        <div className="sessions-tabs">
          <button
            type="button"
            className={
              activeTab === "upcoming"
                ? "session-tab active"
                : "session-tab"
            }
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>

          <button
            type="button"
            className={
              activeTab === "completed"
                ? "session-tab active"
                : "session-tab"
            }
            onClick={() => setActiveTab("completed")}
          >
            Completed / Past
          </button>
        </div>

        {/* SESSION LIST */}
        <div className="sessions-list">
          {filteredSessions.length === 0 ? (
            <div className="sessions-empty">
              <h3>
                {activeTab === "upcoming"
                  ? "No upcoming sessions"
                  : "No completed or past sessions"}
              </h3>

              <p>
                {activeTab === "upcoming"
                  ? "Booked sessions will appear here."
                  : "Past sessions will appear here automatically based on their actual date and time."}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                className="session-card"
                key={session._id}
              >
                {/* DATE/TIME */}
                <div className="session-date">
                  <strong>
                    {formatDate(session.startTime)}
                  </strong>

                  <span>
                    {formatTime(session.startTime)}
                  </span>

                  <span>
                    {session.duration
                      ? `${session.duration} min`
                      : ""}
                  </span>
                </div>

                {/* CLIENT */}
                <div className="session-details">
                  <h3>
                    {session.clientName || "Client"}
                  </h3>

                  <p>
                    {session.clientEmail ||
                      "No email provided"}
                  </p>

                  {session.clientPhone && (
                    <p>{session.clientPhone}</p>
                  )}

                  {session.notes && (
                    <p className="session-notes-preview">
                      {session.notes}
                    </p>
                  )}
                </div>

                {/* STATUS + DETAILS */}
                <div className="session-actions">
                  <span
                    className={`session-status ${getStatusClass(
                      session
                    )}`}
                  >
                    {getStatusLabel(session)}
                  </span>

                  <button
                    type="button"
                    className="view-session-btn"
                    onClick={() =>
                      setSelectedSession(session)
                    }
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selectedSession && (
        <div
          className="session-modal-overlay"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="session-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="session-modal-header">
              <div>
                <h2>Session Details</h2>

                <p>
                  {formatDate(
                    selectedSession.startTime
                  )}
                </p>
              </div>

              <button
                type="button"
                className="session-modal-close"
                onClick={() =>
                  setSelectedSession(null)
                }
              >
                ×
              </button>
            </div>

            <div className="session-modal-body">
              <div className="detail-row">
                <span>Client</span>

                <strong>
                  {selectedSession.clientName ||
                    "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Email</span>

                <strong>
                  {selectedSession.clientEmail ||
                    "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Phone</span>

                <strong>
                  {selectedSession.clientPhone ||
                    "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Start</span>

                <strong>
                  {formatDate(
                    selectedSession.startTime
                  )}{" "}
                  {formatTime(
                    selectedSession.startTime
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>End</span>

                <strong>
                  {formatDate(
                    selectedSession.endTime
                  )}{" "}
                  {formatTime(
                    selectedSession.endTime
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>Duration</span>

                <strong>
                  {selectedSession.duration
                    ? `${selectedSession.duration} minutes`
                    : "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Status</span>

                <strong>
                  {getStatusLabel(selectedSession)}
                </strong>
              </div>

              {selectedSession.notes && (
                <div className="detail-notes">
                  <span>Notes</span>

                  <p>
                    {selectedSession.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="session-modal-footer">
              <button
                type="button"
                onClick={() =>
                  setSelectedSession(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sessions;