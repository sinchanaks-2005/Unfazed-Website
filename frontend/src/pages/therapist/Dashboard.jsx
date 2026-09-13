import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const therapist =
    JSON.parse(localStorage.getItem("therapist")) || {
      name: "Therapist",
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

          {/* Dashboard */}
          <button
            className="nav-item active"
            onClick={() => navigate("/therapist/dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          {/* Profile */}
          <button
            className="nav-item"
            onClick={() => navigate("/therapist/profile")}
          >
            <span>◉</span>
            My Profile
          </button>

          {/* Sessions */}
          <button
            className="nav-item"
            onClick={() => navigate("/therapist/sessions")}
          >
            <span>▣</span>
            Sessions
          </button>

          {/* Clients */}
          <button
            className="nav-item"
            onClick={() => navigate("/therapist/clients")}
          >
            <span>♙</span>
            Clients
          </button>

          {/* Availability */}
          <button
            className="nav-item"
            onClick={() => navigate("/therapist/availability")}
          >
            <span>◷</span>
            Availability
          </button>

          {/* Settings */}
          <button
            className="nav-item"
            onClick={() => navigate("/therapist/settings")}
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>

        {/* Logout */}
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
              {therapist.name.split(" ")[0]} 👋
            </h1>

            <p className="header-subtitle">
              Here's a quick overview of your practice today.
            </p>
          </div>

          <div className="profile-mini">

            <div className="profile-avatar">
              {therapist.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{therapist.name}</strong>
              <span>Therapist</span>
            </div>

          </div>

        </header>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">
              ♙
            </div>

            <div>
              <p>Total Clients</p>
              <h2>12</h2>

              <span className="stat-positive">
                +8% this month
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ▣
            </div>

            <div>
              <p>Total Sessions</p>
              <h2>24</h2>

              <span className="stat-positive">
                +12% this month
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ◷
            </div>

            <div>
              <p>Upcoming Sessions</p>
              <h2>4</h2>

              <span>
                Next 7 days
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ★
            </div>

            <div>
              <p>Profile Rating</p>
              <h2>4.9</h2>

              <span>
                Based on client feedback
              </span>
            </div>
          </div>

        </section>

        {/* Content */}
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
                onClick={() => navigate("/therapist/sessions")}
              >
                View all
              </button>

            </div>

            <div className="session-list">

              <div className="session-item">

                <div className="client-avatar">
                  A
                </div>

                <div className="session-info">
                  <strong>Client A</strong>
                  <span>Individual Therapy</span>
                </div>

                <div className="session-time">
                  <strong>10:00 AM</strong>
                  <span>Today</span>
                </div>

                <span className="session-status">
                  Upcoming
                </span>

              </div>

              <div className="session-item">

                <div className="client-avatar">
                  R
                </div>

                <div className="session-info">
                  <strong>Client R</strong>
                  <span>Stress Management</span>
                </div>

                <div className="session-time">
                  <strong>2:30 PM</strong>
                  <span>Today</span>
                </div>

                <span className="session-status">
                  Upcoming
                </span>

              </div>

              <div className="session-item">

                <div className="client-avatar">
                  S
                </div>

                <div className="session-info">
                  <strong>Client S</strong>
                  <span>Anxiety Support</span>
                </div>

                <div className="session-time">
                  <strong>11:00 AM</strong>
                  <span>Tomorrow</span>
                </div>

                <span className="session-status">
                  Upcoming
                </span>

              </div>

            </div>

          </div>

          {/* Profile Card */}
          <div className="dashboard-card profile-card">

            <div className="profile-card-top">

              <div className="large-avatar">
                {therapist.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2>{therapist.name}</h2>
                <p>Therapist</p>
              </div>

            </div>

            <div className="profile-divider"></div>

            <div className="profile-detail">

              <span>
                Public Profile
              </span>

              <strong>
                unfazed.com/therapist/
                {therapist.slug || "your-profile"}
              </strong>

            </div>

            <div className="profile-actions">

              <button
                className="profile-button"
                onClick={() => navigate("/therapist/profile")}
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

            <p>
              YOUR PRACTICE, YOUR SPACE
            </p>

            <h2>
              Make every client interaction meaningful.
            </h2>

            <span>
              Manage your profile, sessions and clients
              from one place.
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