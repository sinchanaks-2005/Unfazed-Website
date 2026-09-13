import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Availability.css";

function Availability() {
  const navigate = useNavigate();

  const [availability, setAvailability] = useState([
    {
      day: "Monday",
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Tuesday",
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Wednesday",
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Thursday",
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Friday",
      enabled: true,
      start: "09:00",
      end: "15:00",
    },
    {
      day: "Saturday",
      enabled: false,
      start: "10:00",
      end: "14:00",
    },
    {
      day: "Sunday",
      enabled: false,
      start: "10:00",
      end: "14:00",
    },
  ]);

  const handleToggle = (index) => {
    setAvailability((previous) =>
      previous.map((item, i) =>
        i === index
          ? {
              ...item,
              enabled: !item.enabled,
            }
          : item
      )
    );
  };

  const handleTimeChange = (index, field, value) => {
    setAvailability((previous) =>
      previous.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleSave = () => {
    localStorage.setItem(
      "therapistAvailability",
      JSON.stringify(availability)
    );

    alert("Availability saved successfully!");
  };

  return (
    <div className="availability-page">

      {/* Back to Dashboard */}
      <button
        className="back-dashboard-button"
        onClick={() => navigate("/therapist/dashboard")}
      >
        ← Back to Dashboard
      </button>

      {/* Page Header */}
      <div className="availability-header">
        <div>
          <p className="availability-label">
            THERAPIST PORTAL
          </p>

          <h1>Availability</h1>

          <p>
            Set your working hours so clients know when you are available.
          </p>
        </div>

        <button
          className="save-availability-btn"
          onClick={handleSave}
        >
          Save Availability
        </button>
      </div>

      {/* Main Layout */}
      <div className="availability-layout">

        {/* Weekly Schedule */}
        <div className="availability-card">

          <div className="availability-card-header">
            <h2>Weekly Schedule</h2>

            <p>
              Choose the days and time ranges when you accept sessions.
            </p>
          </div>

          <div className="days-list">

            {availability.map((item, index) => (
              <div
                className="day-row"
                key={item.day}
              >

                {/* Day + Switch */}
                <div className="day-name">

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => handleToggle(index)}
                    />

                    <span className="slider"></span>
                  </label>

                  <strong>{item.day}</strong>
                </div>

                {/* Time Fields */}
                {item.enabled ? (
                  <div className="time-fields">

                    <div className="time-box">
                      <label>START</label>

                      <input
                        type="time"
                        value={item.start}
                        onChange={(e) =>
                          handleTimeChange(
                            index,
                            "start",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <span className="to-text">
                      to
                    </span>

                    <div className="time-box">
                      <label>END</label>

                      <input
                        type="time"
                        value={item.end}
                        onChange={(e) =>
                          handleTimeChange(
                            index,
                            "end",
                            e.target.value
                          )
                        }
                      />
                    </div>

                  </div>
                ) : (
                  <div className="time-fields empty-time-fields"></div>
                )}

                {/* Status - Always Last */}
                <span
                  className={
                    item.enabled
                      ? "available-text"
                      : "unavailable-text"
                  }
                >
                  {item.enabled
                    ? "Available"
                    : "Unavailable"}
                </span>

              </div>
            ))}

          </div>
        </div>

        {/* Right Side Information */}
        <div className="availability-side">

          {/* Session Hours */}
          <div className="availability-info-card">

            <div className="info-icon">
              🕐
            </div>

            <h3>Session Hours</h3>

            <p>
              Your availability helps clients choose suitable
              session times.
            </p>

          </div>

          {/* Helpful Tip */}
          <div className="availability-tip-card">

            <span>💡</span>

            <div>
              <h3>Helpful Tip</h3>

              <p>
                Keep your schedule updated to avoid overlapping
                appointments.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Availability;