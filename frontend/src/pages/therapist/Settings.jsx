import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);

  const handleSave = () => {
    localStorage.setItem(
      "therapistSettings",
      JSON.stringify({
        notifications,
        emailUpdates,
        sessionReminders,
      })
    );

    alert("Settings saved successfully!");
  };

  return (
    <div className="settings-page">

      {/* Back to Dashboard */}

      <button
        className="back-dashboard-button"
        onClick={() => navigate("/therapist/dashboard")}
      >
        ← Back to Dashboard
      </button>

      {/* Header */}

      <div className="settings-header">

        <div>
          <p className="settings-label">
            THERAPIST PORTAL
          </p>

          <h1>Settings</h1>

          <p>
            Manage your account preferences and notifications.
          </p>
        </div>

        <button
          className="save-settings-btn"
          onClick={handleSave}
        >
          Save Changes
        </button>

      </div>

      <div className="settings-content">

        {/* =====================================
            ACCOUNT SETTINGS
        ====================================== */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              👤
            </div>

            <div>
              <h2>Account</h2>

              <p>
                Manage your therapist account information.
              </p>
            </div>

          </div>

          <div className="settings-item">

            <div>
              <h3>Profile Information</h3>

              <p>
                Update your name, bio, specializations and languages.
              </p>
            </div>

            <button
              className="settings-action"
              onClick={() =>
                navigate("/therapist/profile")
              }
            >
              Edit Profile
            </button>

          </div>

        </div>

        {/* =====================================
            NOTIFICATIONS
        ====================================== */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              🔔
            </div>

            <div>
              <h2>Notifications</h2>

              <p>
                Choose which notifications you want to receive.
              </p>
            </div>

          </div>

          {/* Push Notifications */}

          <div className="settings-item">

            <div>
              <h3>Push Notifications</h3>

              <p>
                Receive important updates about your account.
              </p>
            </div>

            <label className="settings-switch">

              <input
                type="checkbox"
                checked={notifications}
                onChange={() =>
                  setNotifications(!notifications)
                }
              />

              <span></span>

            </label>

          </div>

          {/* Email Updates */}

          <div className="settings-item">

            <div>
              <h3>Email Updates</h3>

              <p>
                Receive updates and important information by email.
              </p>
            </div>

            <label className="settings-switch">

              <input
                type="checkbox"
                checked={emailUpdates}
                onChange={() =>
                  setEmailUpdates(!emailUpdates)
                }
              />

              <span></span>

            </label>

          </div>

          {/* Session Reminders */}

          <div className="settings-item">

            <div>
              <h3>Session Reminders</h3>

              <p>
                Get reminders about your upcoming sessions.
              </p>
            </div>

            <label className="settings-switch">

              <input
                type="checkbox"
                checked={sessionReminders}
                onChange={() =>
                  setSessionReminders(!sessionReminders)
                }
              />

              <span></span>

            </label>

          </div>

        </div>

        {/* =====================================
            PRIVACY & SECURITY
        ====================================== */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-icon">
              🔒
            </div>

            <div>
              <h2>Privacy & Security</h2>

              <p>
                Manage your account security preferences.
              </p>
            </div>

          </div>

          {/* Change Password */}

          <div className="settings-item">

            <div>
              <h3>Password</h3>

              <p>
                Keep your account secure with a strong password.
              </p>
            </div>

            <button
              className="settings-action"
              onClick={() =>
                alert("Change Password feature will be available soon.")
              }
            >
              Change Password
            </button>

          </div>

          {/* Account Security */}

          <div className="settings-item">

            <div>
              <h3>Account Security</h3>

              <p>
                Your account is protected using secure authentication.
              </p>
            </div>

            <span className="security-status">
              Protected
            </span>

          </div>

        </div>

        {/* =====================================
            DANGER ZONE
        ====================================== */}

        <div className="settings-card danger-card">

          <div className="settings-card-header">

            <div className="settings-icon danger-icon">
              ⚠
            </div>

            <div>
              <h2>Danger Zone</h2>

              <p>
                Actions in this section require extra attention.
              </p>
            </div>

          </div>

          {/* Delete Account */}

          <div className="settings-item">

            <div>
              <h3>Delete Account</h3>

              <p>
                Permanently delete your therapist account and
                associated information.
              </p>
            </div>

            <button
              className="delete-account-btn"
              onClick={() =>
                alert(
                  "Delete Account feature will be available soon."
                )
              }
            >
              Delete Account
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Settings;