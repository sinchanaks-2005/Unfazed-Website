import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Availability.css";

function Availability() {
  const navigate = useNavigate();

  // ==========================================
  // WEEKLY AVAILABILITY
  // ==========================================

  const [availability, setAvailability] = useState([
    {
      day: "Monday",
      dayOfWeek: 1,
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Tuesday",
      dayOfWeek: 2,
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Wednesday",
      dayOfWeek: 3,
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Thursday",
      dayOfWeek: 4,
      enabled: true,
      start: "09:00",
      end: "17:00",
    },
    {
      day: "Friday",
      dayOfWeek: 5,
      enabled: true,
      start: "09:00",
      end: "15:00",
    },
    {
      day: "Saturday",
      dayOfWeek: 6,
      enabled: false,
      start: "10:00",
      end: "14:00",
    },
    {
      day: "Sunday",
      dayOfWeek: 0,
      enabled: false,
      start: "10:00",
      end: "14:00",
    },
  ]);

  // ==========================================
  // SESSION SETTINGS
  // ==========================================

  const durationOptions = [30, 45, 60, 90];

  const [selectedDuration, setSelectedDuration] =
    useState(60);

  const [bufferMinutes, setBufferMinutes] =
    useState(15);

  const [timezone, setTimezone] =
    useState("Asia/Kolkata");

  // ==========================================
  // ONE-TIME OVERRIDES
  // ==========================================

  const [overrides, setOverrides] = useState([]);

  const [overrideDate, setOverrideDate] =
    useState("");

  const [overrideType, setOverrideType] =
    useState("available");

  const [overrideStartTime, setOverrideStartTime] =
    useState("09:00");

  const [overrideEndTime, setOverrideEndTime] =
    useState("17:00");

  // ==========================================
  // BLOCKED SLOTS
  // ==========================================

  const [blockedSlots, setBlockedSlots] = useState([]);

  const [blockedDate, setBlockedDate] =
    useState("");

  const [blockedStartTime, setBlockedStartTime] =
    useState("09:00");

  const [blockedEndTime, setBlockedEndTime] =
    useState("17:00");

  const [blockedReason, setBlockedReason] =
    useState("");

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // ==========================================
  // LOAD AVAILABILITY
  // ==========================================

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/therapist/login");
          return;
        }

        const response =
          await axiosInstance.get(
            "/scheduling/availability",
            {
              headers: {
                Authorization: "Bearer " + token,
              },
            }
          );

        const data = response.data.availability;

        if (data) {
          setTimezone(
            data.timezone || "Asia/Kolkata"
          );

          setBufferMinutes(
            data.bufferMinutes ?? 0
          );

          const validDurations = [
            30,
            45,
            60,
            90,
          ];

          setSelectedDuration(
            validDurations.includes(
              data.sessionDuration
            )
              ? data.sessionDuration
              : 60
          );

          // Weekly schedule
          if (data.weeklySchedule?.length) {
            setAvailability((previous) =>
              previous.map((item) => {
                const backendDay =
                  data.weeklySchedule.find(
                    (day) =>
                      day.dayOfWeek ===
                      item.dayOfWeek
                  );

                if (!backendDay) {
                  return item;
                }

                return {
                  ...item,
                  enabled: backendDay.enabled,
                  start: backendDay.startTime,
                  end: backendDay.endTime,
                };
              })
            );
          }

          // One-time overrides
          setOverrides(data.overrides || []);

          // Blocked slots
          setBlockedSlots(
            data.blockedSlots || []
          );
        }
      } catch (err) {
        console.error(
          "Failed to load availability:",
          err
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("therapist");
          navigate("/therapist/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load availability."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [navigate]);

  // ==========================================
  // WEEKLY SCHEDULE HANDLERS
  // ==========================================

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

  const handleTimeChange = (
    index,
    field,
    value
  ) => {
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

  // ==========================================
  // ADD ONE-TIME OVERRIDE
  // ==========================================

  const handleAddOverride = () => {
    setError("");

    if (!overrideDate) {
      setError(
        "Please select a date for the one-time override."
      );
      return;
    }

    if (!overrideStartTime || !overrideEndTime) {
      setError(
        "Please select both start and end time."
      );
      return;
    }

    if (overrideStartTime >= overrideEndTime) {
      setError(
        "Override end time must be after start time."
      );
      return;
    }

    const alreadyExists = overrides.some(
      (item) =>
        item.date === overrideDate &&
        item.type === overrideType &&
        item.startTime === overrideStartTime &&
        item.endTime === overrideEndTime
    );

    if (alreadyExists) {
      setError(
        "This override already exists."
      );
      return;
    }

    const newOverride = {
      date: overrideDate,
      type: overrideType,
      startTime: overrideStartTime,
      endTime: overrideEndTime,
    };

    setOverrides((previous) => [
      ...previous,
      newOverride,
    ]);

    setOverrideDate("");
    setOverrideStartTime("09:00");
    setOverrideEndTime("17:00");
  };

  // ==========================================
  // REMOVE ONE-TIME OVERRIDE
  // ==========================================

  const handleRemoveOverride = (index) => {
    setOverrides((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // ==========================================
  // ADD BLOCKED SLOT
  // ==========================================

  const handleAddBlockedSlot = () => {
    setError("");

    if (!blockedDate) {
      setError(
        "Please select a date for the blocked slot."
      );
      return;
    }

    if (!blockedStartTime || !blockedEndTime) {
      setError(
        "Please select both start and end time."
      );
      return;
    }

    if (blockedStartTime >= blockedEndTime) {
      setError(
        "Blocked slot end time must be after start time."
      );
      return;
    }

    const newBlockedSlot = {
      start: `${blockedDate}T${blockedStartTime}:00`,
      end: `${blockedDate}T${blockedEndTime}:00`,
      reason: blockedReason.trim(),
    };

    setBlockedSlots((previous) => [
      ...previous,
      newBlockedSlot,
    ]);

    setBlockedDate("");
    setBlockedStartTime("09:00");
    setBlockedEndTime("17:00");
    setBlockedReason("");
  };

  // ==========================================
  // REMOVE BLOCKED SLOT
  // ==========================================

  const handleRemoveBlockedSlot = (index) => {
    setBlockedSlots((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // ==========================================
  // FORMAT DATE FOR DISPLAY
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    try {
      return new Date(
        `${dateValue}T00:00:00`
      ).toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateValue;
    }
  };

  // ==========================================
  // SAVE AVAILABILITY
  // ==========================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/therapist/login");
        return;
      }

      const weeklySchedule = availability.map(
        (item) => ({
          dayOfWeek: item.dayOfWeek,
          enabled: item.enabled,
          startTime: item.start,
          endTime: item.end,
        })
      );

      await axiosInstance.put(
        "/scheduling/availability",
        {
          timezone,
          weeklySchedule,
          bufferMinutes,
          sessionDuration: selectedDuration,
          overrides,
          blockedSlots,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      setMessage(
        "Availability saved successfully!"
      );
    } catch (err) {
      console.error(
        "Failed to save availability:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("therapist");
        navigate("/therapist/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to save availability."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="availability-page">
        <div className="availability-loading">
          Loading availability...
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="availability-page">
      {/* Back to Dashboard */}

      <button
        className="back-dashboard-button"
        onClick={() =>
          navigate("/therapist/dashboard")
        }
      >
        ← Back to Dashboard
      </button>

      {/* Header */}

      <div className="availability-header">
        <div>
          <p className="availability-label">
            THERAPIST PORTAL
          </p>

          <h1>Availability</h1>

          <p>
            Set your working hours so clients know when
            you are available.
          </p>
        </div>

        <button
          className="save-availability-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Availability"}
        </button>
      </div>

      {/* Messages */}

      {message && (
        <div className="availability-success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="availability-error">
          {error}
        </div>
      )}

      {/* Main Layout */}

      <div className="availability-layout">
        {/* ==========================================
            LEFT SIDE
        ========================================== */}

        <div>
          {/* Weekly Schedule */}

          <div className="availability-card">
            <div className="availability-card-header">
              <h2>Weekly Schedule</h2>

              <p>
                Choose the days and time ranges when
                you accept sessions.
              </p>
            </div>

            <div className="days-list">
              {availability.map(
                (item, index) => (
                  <div
                    className="day-row"
                    key={item.day}
                  >
                    <div className="day-name">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() =>
                            handleToggle(index)
                          }
                        />

                        <span className="slider"></span>
                      </label>

                      <strong>{item.day}</strong>
                    </div>

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
                )
              )}
            </div>
          </div>

          {/* ==========================================
              ONE-TIME OVERRIDES
          ========================================== */}

          <div
            className="availability-card"
            style={{ marginTop: "22px" }}
          >
            <div className="availability-card-header">
              <h2>One-Time Overrides</h2>

              <p>
                Add a special availability period for a
                specific date without changing your weekly schedule.
              </p>
            </div>

            <div style={{ padding: "22px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                <div className="time-box">
                  <label>DATE</label>

                  <input
                    type="date"
                    value={overrideDate}
                    onChange={(e) =>
                      setOverrideDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="time-box">
                  <label>TYPE</label>

                  <select
                    className="buffer-select"
                    style={{ marginTop: 0 }}
                    value={overrideType}
                    onChange={(e) =>
                      setOverrideType(
                        e.target.value
                      )
                    }
                  >
                    <option value="available">
                      Available
                    </option>

                    <option value="blocked">
                      Blocked
                    </option>
                  </select>
                </div>

                <div className="time-box">
                  <label>START</label>

                  <input
                    type="time"
                    value={overrideStartTime}
                    onChange={(e) =>
                      setOverrideStartTime(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="time-box">
                  <label>END</label>

                  <input
                    type="time"
                    value={overrideEndTime}
                    onChange={(e) =>
                      setOverrideEndTime(
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                className="save-availability-btn"
                style={{ marginTop: "16px" }}
                onClick={handleAddOverride}
              >
                + Add Override
              </button>

              {overrides.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  {overrides.map(
                    (override, index) => (
                      <div
                        key={`${override.date}-${index}`}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          marginBottom: "10px",
                          border:
                            "1px solid #eeeef5",
                          borderRadius: "10px",
                          background: "#fafaff",
                        }}
                      >
                        <div>
                          <strong>
                            {formatDate(
                              override.date
                            )}
                          </strong>

                          <div
                            style={{
                              marginTop: "4px",
                              color: "#77788c",
                              fontSize: "13px",
                            }}
                          >
                            {override.startTime} –{" "}
                            {override.endTime}
                            {" • "}
                            {override.type ===
                            "available"
                              ? "Available"
                              : "Blocked"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveOverride(
                              index
                            )
                          }
                          style={{
                            border: "none",
                            background: "#fff0f0",
                            color: "#b42318",
                            borderRadius: "8px",
                            padding: "7px 10px",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ==========================================
              BLOCKED SLOTS
          ========================================== */}

          <div
            className="availability-card"
            style={{ marginTop: "22px" }}
          >
            <div className="availability-card-header">
              <h2>Blocked Slots</h2>

              <p>
                Block a specific time period for leave,
                personal appointments, or other commitments.
              </p>
            </div>

            <div style={{ padding: "22px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                <div className="time-box">
                  <label>DATE</label>

                  <input
                    type="date"
                    value={blockedDate}
                    onChange={(e) =>
                      setBlockedDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="time-box">
                  <label>
                    REASON (OPTIONAL)
                  </label>

                  <input
                    type="text"
                    placeholder="Personal appointment"
                    value={blockedReason}
                    onChange={(e) =>
                      setBlockedReason(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="time-box">
                  <label>START</label>

                  <input
                    type="time"
                    value={blockedStartTime}
                    onChange={(e) =>
                      setBlockedStartTime(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="time-box">
                  <label>END</label>

                  <input
                    type="time"
                    value={blockedEndTime}
                    onChange={(e) =>
                      setBlockedEndTime(
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                className="save-availability-btn"
                style={{ marginTop: "16px" }}
                onClick={handleAddBlockedSlot}
              >
                + Add Blocked Slot
              </button>

              {blockedSlots.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  {blockedSlots.map(
                    (slot, index) => (
                      <div
                        key={`${slot.start}-${index}`}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 14px",
                          marginBottom: "10px",
                          border:
                            "1px solid #eeeef5",
                          borderRadius: "10px",
                          background: "#fafaff",
                        }}
                      >
                        <div>
                          <strong>
                            {new Date(
                              slot.start
                            ).toLocaleDateString(
                              undefined,
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </strong>

                          <div
                            style={{
                              marginTop: "4px",
                              color: "#77788c",
                              fontSize: "13px",
                            }}
                          >
                            {new Date(
                              slot.start
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}

                            {" – "}

                            {new Date(
                              slot.end
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}

                            {slot.reason
                              ? ` • ${slot.reason}`
                              : ""}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveBlockedSlot(
                              index
                            )
                          }
                          style={{
                            border: "none",
                            background: "#fff0f0",
                            color: "#b42318",
                            borderRadius: "8px",
                            padding: "7px 10px",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            RIGHT SIDE
        ========================================== */}

        <div className="availability-side">
          {/* Session Duration */}

          <div className="availability-info-card">
            <div className="info-icon">
              🕐
            </div>

            <h3>Session Duration</h3>

            <p>
              Choose how long one client session
              will last.
            </p>

            <div className="duration-options">
              {durationOptions.map(
                (duration) => (
                  <button
                    key={duration}
                    type="button"
                    className={
                      selectedDuration ===
                      duration
                        ? "duration-option active"
                        : "duration-option"
                    }
                    onClick={() =>
                      setSelectedDuration(
                        duration
                      )
                    }
                  >
                    {duration} min
                  </button>
                )
              )}
            </div>

            <div className="selected-setting">
              Selected:{" "}
              <strong>
                {selectedDuration} minutes
              </strong>
            </div>
          </div>

          {/* Buffer Time */}

          <div className="availability-info-card">
            <div className="info-icon">
              ⏱
            </div>

            <h3>Buffer Time</h3>

            <p>
              Add a break between two sessions.
            </p>

            <select
              className="buffer-select"
              value={bufferMinutes}
              onChange={(e) =>
                setBufferMinutes(
                  Number(e.target.value)
                )
              }
            >
              <option value={0}>
                No buffer
              </option>

              <option value={5}>
                5 minutes
              </option>

              <option value={10}>
                10 minutes
              </option>

              <option value={15}>
                15 minutes
              </option>

              <option value={30}>
                30 minutes
              </option>
            </select>
          </div>

          {/* Timezone */}

          <div className="availability-info-card">
            <div className="info-icon">
              🌐
            </div>

            <h3>Timezone</h3>

            <p>
              Your schedule is displayed using
              your selected timezone.
            </p>

            <select
              className="buffer-select"
              value={timezone}
              onChange={(e) =>
                setTimezone(e.target.value)
              }
            >
              <option value="Asia/Kolkata">
                India — Asia/Kolkata
              </option>

              <option value="Asia/Dubai">
                Dubai — Asia/Dubai
              </option>

              <option value="Asia/Singapore">
                Singapore — Asia/Singapore
              </option>

              <option value="Europe/London">
                London — Europe/London
              </option>

              <option value="America/New_York">
                New York — America/New_York
              </option>

              <option value="America/Los_Angeles">
                Los Angeles — America/Los_Angeles
              </option>

              <option value="Australia/Sydney">
                Sydney — Australia/Sydney
              </option>
            </select>
          </div>

          {/* Helpful Tip */}

          <div className="availability-tip-card">
            <span>💡</span>

            <div>
              <h3>Helpful Tip</h3>

              <p>
                Keep your schedule updated to avoid
                overlapping appointments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Availability;