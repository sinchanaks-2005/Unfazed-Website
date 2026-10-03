import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API = "http://localhost:5000/api";

function Dashboard() {
  const navigate = useNavigate();

  const therapist =
    JSON.parse(localStorage.getItem("therapist")) || {
      name: "Therapist",
      slug: "",
    };

  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    totalClients: null,
    upcomingSessions: null,
    completedSessions: null,
  });

  const [recentSessions, setRecentSessions] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);

      if (!token) {
        return;
      }

      const sessionsRes = await axios.get(
        `${API}/scheduling/sessions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const allSessions = sessionsRes.data.sessions || [];

      const now = new Date();

      const upcoming = allSessions.filter(
        (session) =>
          new Date(session.endTime) > now &&
          session.status !== "cancelled"
      );

      const completed = allSessions.filter(
        (session) =>
          new Date(session.endTime) <= now ||
          session.status === "completed"
      );

      const uniqueEmails = new Set(
        allSessions
          .map((session) => session.clientEmail)
          .filter(Boolean)
      );

      setStats({
        totalClients: uniqueEmails.size,
        upcomingSessions: upcoming.length,
        completedSessions: completed.length,
      });

      setRecentSessions(upcoming.slice(0, 3));
    } catch (error) {
      console.error(
        "Dashboard stats error:",
        error.response?.data?.message || error.message
      );

      setStats({
        totalClients: null,
        upcomingSessions: null,
        completedSessions: null,
      });

      setRecentSessions([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("therapist");

    navigate("/therapist/login");
  };

  const handleViewPublicProfile = () => {
    if (therapist.slug) {
      navigate(`/therapist/${therapist.slug}`);
    } else {
      alert("Please complete your profile first.");
      navigate("/therapist/profile");
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "—";

    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatRelativeDate = (iso) => {
    if (!iso) return "—";

    const date = new Date(iso);

    const today = new Date();
    const tomorrow = new Date();

    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const statVal = (value) =>
    statsLoading ? "—" : value ?? "0";

  return (
    <div className="dashboard-page">

      {/* Sidebar */}
      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          <span>U</span>

          <div>
            <h2>Unfazed</h2>
            <p>Therapist Portal</p>
          </div>
        </div>

        <nav className="dashboard-nav">

          <button
            className="nav-item active"
            onClick={() =>
              navigate("/therapist/dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/profile")
            }
          >
            <span>◉</span>
            My Profile
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/sessions")
            }
          >
            <span>▣</span>
            Sessions
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/clients")
            }
          >
            <span>♙</span>
            Clients
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/availability")
            }
          >
            <span>◷</span>
            Availability
          </button>

          {/* Module 4 - Packages */}
          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/packages")
            }
          >
            <span>▤</span>
            Packages
          </button>

          {/* Module 5 - Clinical Notes */}
          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/notes")
            }
          >
            <span>✎</span>
            Clinical Notes
          </button>

          {/* Module 7 - Analytics */}
          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/analytics")
            }
          >
            <span>◈</span>
            Analytics
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/therapist/settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">

          <div>
            <p className="welcome-small">
              THERAPIST DASHBOARD
            </p>

            <h1>
              Good morning,{" "}
              {therapist.name?.split(" ")[0] ||
                "Therapist"}{" "}
              👋
            </h1>

            <p className="header-subtitle">
              Here's a quick overview of your practice
              today.
            </p>
          </div>

          <div className="profile-mini">

            <div className="profile-avatar">
              {therapist.name
                ?.charAt(0)
                .toUpperCase() || "T"}
            </div>

            <div>
              <strong>
                {therapist.name || "Therapist"}
              </strong>

              <span>Therapist</span>
            </div>

          </div>

        </header>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">♙</div>

            <div>
              <p>Total Clients</p>

              <h2>
                {statVal(stats.totalClients)}
              </h2>

              <span className="stat-positive">
                Unique bookers
              </span>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">▣</div>

            <div>
              <p>Upcoming Sessions</p>

              <h2>
                {statVal(stats.upcomingSessions)}
              </h2>

              <span>
                Scheduled ahead
              </span>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">◷</div>

            <div>
              <p>Completed Sessions</p>

              <h2>
                {statVal(stats.completedSessions)}
              </h2>

              <span>
                Sessions done
              </span>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">★</div>

            <div>
              <p>Total Sessions</p>

              <h2>
                {statsLoading
                  ? "—"
                  : (stats.upcomingSessions ?? 0) +
                    (stats.completedSessions ?? 0)}
              </h2>

              <span>All time</span>
            </div>

          </div>

        </section>

        {/* Dashboard Content */}
        <section className="dashboard-content">

          {/* Upcoming Sessions */}
          <div className="dashboard-card sessions-card">

            <div className="card-heading">

              <div>
                <h2>Upcoming Sessions</h2>

                <p>
                  Your next scheduled appointments
                </p>
              </div>

              <button
                className="view-button"
                onClick={() =>
                  navigate("/therapist/sessions")
                }
              >
                View all
              </button>

            </div>

            <div className="session-list">

              {statsLoading ? (

                <div
                  style={{
                    padding: "20px",
                    color: "#888",
                    textAlign: "center",
                  }}
                >
                  Loading sessions...
                </div>

              ) : recentSessions.length === 0 ? (

                <div
                  style={{
                    padding: "20px",
                    color: "#888",
                    textAlign: "center",
                  }}
                >

                  <div
                    style={{
                      fontSize: "24px",
                      marginBottom: "8px",
                    }}
                  >
                    📅
                  </div>

                  <p>
                    No upcoming sessions yet.
                  </p>

                  <small>
                    Sessions will appear here once
                    clients book appointments.
                  </small>

                </div>

              ) : (

                recentSessions.map((session) => (

                  <div
                    className="session-item"
                    key={session._id}
                  >

                    <div className="client-avatar">
                      {(session.clientName || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="session-info">

                      <strong>
                        {session.clientName ||
                          "Unknown"}
                      </strong>

                      <span>
                        {session.clientEmail || "—"}
                      </span>

                    </div>

                    <div className="session-time">

                      <strong>
                        {formatTime(
                          session.startTime
                        )}
                      </strong>

                      <span>
                        {formatRelativeDate(
                          session.startTime
                        )}
                      </span>

                    </div>

                    <span className="session-status">
                      Upcoming
                    </span>

                  </div>

                ))
              )}

            </div>

          </div>

          {/* Profile Card */}
          <div className="dashboard-card profile-card">

            <div className="profile-card-top">

              <div className="large-avatar">
                {therapist.name
                  ?.charAt(0)
                  .toUpperCase() || "T"}
              </div>

              <div>
                <h2>
                  {therapist.name || "Therapist"}
                </h2>

                <p>Therapist</p>
              </div>

            </div>

            <div className="profile-divider"></div>

            <div className="profile-detail">

              <span>Public Profile</span>

              <strong>
                unfazed.com/therapist/
                {therapist.slug || "your-profile"}
              </strong>

            </div>

            <div className="profile-actions">

              <button
                className="profile-button"
                onClick={() =>
                  navigate("/therapist/profile")
                }
              >
                Manage Profile
              </button>

              <button
                className="profile-button public-profile-button"
                onClick={handleViewPublicProfile}
              >
                View Public Profile
              </button>

            </div>

          </div>

        </section>

        {/* Banner */}
        <section className="dashboard-banner">

          <div>

            <p>YOUR PRACTICE, YOUR SPACE</p>

            <h2>
              Make every client interaction
              meaningful.
            </h2>

            <span>
              Manage your profile, sessions and
              clients from one place.
            </span>

          </div>

          <div className="banner-symbol">
            ✦
          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;