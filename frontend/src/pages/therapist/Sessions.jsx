import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sessions.css";

function Sessions() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Upcoming");

  const sessions = [
    {
      id: 1,
      client: "Client A",
      date: "12 Sep 2026",
      time: "10:00 AM",
      type: "Video Session",
      status: "Upcoming",
    },
    {
      id: 2,
      client: "Client B",
      date: "13 Sep 2026",
      time: "2:30 PM",
      type: "Video Session",
      status: "Upcoming",
    },
    {
      id: 3,
      client: "Client C",
      date: "15 Sep 2026",
      time: "11:00 AM",
      type: "In-Person",
      status: "Upcoming",
    },
    {
      id: 4,
      client: "Client D",
      date: "05 Sep 2026",
      time: "4:00 PM",
      type: "Video Session",
      status: "Completed",
    },
  ];

  const filteredSessions = sessions.filter(
    (session) => session.status === activeTab
  );

  return (
    <div className="sessions-page">

      {/* Back to Dashboard */}
      <button
        className="back-dashboard-button"
        onClick={() => navigate("/therapist/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <div className="sessions-header">
        <div>
          <p className="page-label">THERAPIST PORTAL</p>

          <h1>Sessions</h1>

          <p>
            Manage your upcoming and completed therapy sessions.
          </p>
        </div>

        <button className="new-session-btn">
          + Schedule Session
        </button>
      </div>

      <div className="session-summary">

        <div className="session-summary-card">
          <span>📅</span>

          <div>
            <h3>4</h3>
            <p>Total Sessions</p>
          </div>
        </div>

        <div className="session-summary-card">
          <span>⏰</span>

          <div>
            <h3>3</h3>
            <p>Upcoming</p>
          </div>
        </div>

        <div className="session-summary-card">
          <span>✓</span>

          <div>
            <h3>1</h3>
            <p>Completed</p>
          </div>
        </div>

      </div>

      <div className="sessions-card">

        <div className="session-tabs">

          <button
            className={activeTab === "Upcoming" ? "active" : ""}
            onClick={() => setActiveTab("Upcoming")}
          >
            Upcoming
          </button>

          <button
            className={activeTab === "Completed" ? "active" : ""}
            onClick={() => setActiveTab("Completed")}
          >
            Completed
          </button>

        </div>

        <div className="sessions-list">

          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (

              <div
                className="session-row"
                key={session.id}
              >

                <div className="session-date">
                  <strong>
                    {session.date.split(" ")[0]}
                  </strong>

                  <span>
                    {session.date
                      .split(" ")
                      .slice(1)
                      .join(" ")}
                  </span>
                </div>

                <div className="session-info">
                  <h3>{session.client}</h3>
                  <p>{session.type}</p>
                </div>

                <div className="session-time">
                  <span>🕐</span>
                  {session.time}
                </div>

                <span
                  className={`session-status ${session.status.toLowerCase()}`}
                >
                  {session.status}
                </span>

                <button className="view-session-btn">
                  View
                </button>

              </div>

            ))
          ) : (

            <div className="empty-sessions">

              <div>📅</div>

              <h3>
                No {activeTab.toLowerCase()} sessions
              </h3>

              <p>
                Your {activeTab.toLowerCase()} sessions will appear here.
              </p>

            </div>

          )}

        </div>
      </div>

    </div>
  );
}

export default Sessions;