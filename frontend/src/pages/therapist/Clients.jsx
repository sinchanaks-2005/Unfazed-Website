import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useEntitlement } from "../../hooks/useEntitlement";
import UpgradeModal from "../../components/common/UpgradeModal";
import "./Clients.css";

function Clients() {
  const navigate = useNavigate();

  const {
    canAccess,
    upgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
  } = useEntitlement();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("createdAt:desc");

  const [selectedClient, setSelectedClient] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newConcern, setNewConcern] = useState("");
  const [newTag, setNewTag] = useState("Anxiety");

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [editConcern, setEditConcern] = useState("");
  const [editHistory, setEditHistory] = useState("");

  const [editStatus, setEditStatus] = useState("Active");
  const [editTags, setEditTags] = useState("");

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get("/clients", {
        params: {
          search: search || undefined,
          status:
            statusFilter !== "All" ? statusFilter : undefined,
          sortBy: sortOption.split(":")[0],
          order: sortOption.split(":")[1],
        },
      });

      setClients(res.data.clients || []);
    } catch (err) {
      console.error("Failed to load clients:", err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortOption]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleViewClient = async (client) => {
    try {
      setSelectedClient(client);
      setDrawerLoading(true);

      const res = await axiosInstance.get(
        `/clients/${client._id}`
      );

      setClientDetails(res.data);
    } catch (err) {
      console.error(
        "Failed to load client details:",
        err.message
      );
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenAddClient = () => {
    if (!canAccess("canAddClient")) {
      openUpgradeModal(
        "Active Client Limit",
        "pro",
        "You have reached your subscription tier's active client capacity. Upgrade to add more clients."
      );
      return;
    }

    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();

    if (!newName.trim() || !newEmail.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");

      await axiosInstance.post("/clients", {
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        presentingConcern: newConcern.trim(),
        tags: [newTag],
      });

      setIsAddModalOpen(false);

      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewConcern("");
      setNewTag("Anxiety");

      await loadClients();
    } catch (err) {
      if (
        err.response?.status === 403 &&
        err.response?.data?.upgradeRequired
      ) {
        setIsAddModalOpen(false);

        openUpgradeModal(
          "Client Limit",
          err.response.data.requiredTier || "pro",
          err.response.data.message
        );
      } else {
        setFormError(
          err.response?.data?.message ||
            "Failed to create client."
        );
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenEditClient = () => {
    const client = clientDetails?.client;

    if (!client) return;

    setEditError("");

    setEditName(client.name || "");
    setEditEmail(client.email || "");
    setEditPhone(client.phone || "");

    setEditAge(
      client.demographics?.age !== undefined &&
        client.demographics?.age !== null
        ? String(client.demographics.age)
        : ""
    );

    setEditGender(client.demographics?.gender || "");
    setEditOccupation(
      client.demographics?.occupation || ""
    );
    setEditLocation(
      client.demographics?.location || ""
    );

    setEditConcern(client.presentingConcern || "");
    setEditHistory(client.history || "");

    setEditStatus(client.status || "Active");

    setEditTags(
      Array.isArray(client.tags)
        ? client.tags.join(", ")
        : ""
    );

    setIsEditModalOpen(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();

    if (!editName.trim() || !editEmail.trim()) {
      setEditError("Name and email are required.");
      return;
    }

    if (
      editAge.trim() !== "" &&
      (Number(editAge) < 1 || Number(editAge) > 120)
    ) {
      setEditError("Please enter a valid age.");
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError("");

      const clientId = clientDetails?.client?._id;

      if (!clientId) {
        setEditError("Client record not found.");
        return;
      }

      const demographics = {};

      if (editAge.trim() !== "") {
        demographics.age = Number(editAge);
      }

      if (editGender.trim() !== "") {
        demographics.gender = editGender.trim();
      }

      if (editOccupation.trim() !== "") {
        demographics.occupation =
          editOccupation.trim();
      }

      if (editLocation.trim() !== "") {
        demographics.location =
          editLocation.trim();
      }

      const tags = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const res = await axiosInstance.put(
        `/clients/${clientId}`,
        {
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          phone: editPhone.trim(),
          demographics,
          presentingConcern: editConcern.trim(),
          history: editHistory.trim(),
          status: editStatus,
          tags,
        }
      );

      setClientDetails((previous) => ({
        ...previous,
        client: res.data.client,
      }));

      setSelectedClient(res.data.client);

      setIsEditModalOpen(false);

      await loadClients();
    } catch (err) {
      setEditError(
        err.response?.data?.message ||
          "Failed to update client."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const totalSessionsCount = clients.reduce(
    (total, client) =>
      total + (client.totalSessions || 0),
    0
  );

  const activeClientsCount = clients.filter(
    (client) => client.status === "Active"
  ).length;

  return (
    <div className="clients-page">
      <button
        className="back-dashboard-button"
        onClick={() =>
          navigate("/therapist/dashboard")
        }
      >
        ← Back to Dashboard
      </button>

      <div className="clients-header">
        <div>
          <p className="clients-label">
            THERAPIST PORTAL
          </p>

          <h1>Clients & CRM</h1>

          <p>
            Manage client records, intake submissions,
            and auditable digital consents.
          </p>
        </div>

        <button
          className="add-client-btn"
          onClick={handleOpenAddClient}
        >
          + Add Client
        </button>
      </div>

      <div className="client-stats">
        <div className="client-stat-card">
          <div className="stat-icon">♙</div>

          <div>
            <h3>{clients.length}</h3>
            <p>Total Clients</p>
          </div>
        </div>

        <div className="client-stat-card">
          <div className="stat-icon">✓</div>

          <div>
            <h3>{activeClientsCount}</h3>
            <p>Active Clients</p>
          </div>
        </div>

        <div className="client-stat-card">
          <div className="stat-icon">▣</div>

          <div>
            <h3>{totalSessionsCount}</h3>
            <p>Total Sessions</p>
          </div>
        </div>
      </div>

      <div className="clients-card">
        <div className="clients-card-header">
          <div>
            <h2>Client List</h2>

            <p>
              View and manage your registered clients.
            </p>
          </div>

          <div className="clients-controls-bar">
            <select
              className="status-filter-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="Archived">
                Archived
              </option>
            </select>

            <select
              className="status-filter-select"
              value={sortOption}
              onChange={(e) =>
                setSortOption(e.target.value)
              }
              aria-label="Sort clients"
            >
              <option value="createdAt:desc">
                Newest First
              </option>

              <option value="updatedAt:desc">
                Recently Updated
              </option>

              <option value="name:asc">
                Name A–Z
              </option>

              <option value="name:desc">
                Name Z–A
              </option>

              <option value="email:asc">
                Email A–Z
              </option>

              <option value="lastSession:desc">
                Recent Session
              </option>
            </select>

            <div className="client-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="clients-table-wrapper">
          {loading ? (
            <div className="clients-loading">
              Loading clients from practice database...
            </div>
          ) : (
            <table className="clients-table">
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>EMAIL</th>
                  <th>INTAKE & CONSENT</th>
                  <th>SESSIONS</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client._id}>
                      <td>
                        <div className="client-name">
                          <div className="client-avatar">
                            {client.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {client.name}
                            </strong>

                            <div className="client-tag-badge">
                              {client.tags?.[0] ||
                                "General"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="client-email">
                        {client.email}
                      </td>

                      <td>
                        {client.intakeCompleted ? (
                          <span className="consent-badge completed">
                            ✓ Intake & Consent
                          </span>
                        ) : (
                          <span className="consent-badge pending">
                            Pending Intake
                          </span>
                        )}
                      </td>

                      <td>
                        {client.totalSessions || 0}
                      </td>

                      <td>
                        <span
                          className={`client-status ${client.status?.toLowerCase()}`}
                        >
                          {client.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="view-client-btn"
                          onClick={() =>
                            handleViewClient(client)
                          }
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="no-clients">
                        <div>🔍</div>

                        <h3>
                          No clients found
                        </h3>

                        <p>
                          {search
                            ? "Try searching with a different name or email."
                            : "Click '+ Add Client' to add your first client."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="client-modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-label">
                  NEW PRACTICE RECORD
                </span>

                <h2>Add Client</h2>
              </div>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() =>
                  setIsAddModalOpen(false)
                }
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="modal-error-alert">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleCreateClient}
              className="modal-form"
            >
              <div className="form-group">
                <label>Full Name *</label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Iyer"
                  value={newName}
                  onChange={(e) =>
                    setNewName(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>

                <input
                  type="email"
                  required
                  placeholder="e.g. maya@example.com"
                  value={newEmail}
                  onChange={(e) =>
                    setNewEmail(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Phone Number (Optional)
                </label>

                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newPhone}
                  onChange={(e) =>
                    setNewPhone(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Focus Area / Tag</label>

                <select
                  value={newTag}
                  onChange={(e) =>
                    setNewTag(e.target.value)
                  }
                >
                  <option value="Anxiety">
                    Anxiety
                  </option>

                  <option value="Depression">
                    Depression
                  </option>

                  <option value="Relationships">
                    Relationships
                  </option>

                  <option value="Stress">
                    Work Stress
                  </option>

                  <option value="Personal Growth">
                    Personal Growth
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Initial Presenting Concern
                </label>

                <textarea
                  rows="2"
                  placeholder="Brief context or referral notes..."
                  value={newConcern}
                  onChange={(e) =>
                    setNewConcern(e.target.value)
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() =>
                    setIsAddModalOpen(false)
                  }
                  disabled={formSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? "Creating..."
                    : "Create Client Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedClient(null)
          }
        >
          <div
            className="client-drawer-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="drawer-header">
              <div className="client-drawer-avatar">
                {selectedClient.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="drawer-title">
                <h2>
                  {selectedClient.name}
                </h2>

                <p>
                  {selectedClient.email} •{" "}
                  {selectedClient.phone ||
                    "No phone"}
                </p>
              </div>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() =>
                  setSelectedClient(null)
                }
              >
                ✕
              </button>
            </div>

            {drawerLoading ? (
              <div className="drawer-loading">
                Loading clinical record...
              </div>
            ) : (
              <div className="drawer-content">
                <div className="section-header-flex">
                  <h3>Client Profile</h3>

                  <button
                    type="button"
                    className="inline-notes-btn"
                    onClick={handleOpenEditClient}
                  >
                    Edit Client
                  </button>
                </div>

                <div className="drawer-section">
                  <h3>
                    Compliance & Digital Consent
                  </h3>

                  <div className="consent-detail-box">
                    <div className="detail-row">
                      <span>
                        Informed Consent:
                      </span>

                      <strong>
                        {clientDetails?.client
                          ?.consent?.agreed
                          ? "✓ Verified Signed"
                          : "Pending Signature"}
                      </strong>
                    </div>

                    {clientDetails?.client
                      ?.consent?.timestamp && (
                      <div className="detail-row">
                        <span>
                          Signed Timestamp:
                        </span>

                        <code>
                          {new Date(
                            clientDetails.client
                              .consent.timestamp
                          ).toLocaleString()}
                        </code>
                      </div>
                    )}

                    {clientDetails?.client
                      ?.consent?.ipAddress && (
                      <div className="detail-row">
                        <span>
                          Auditable IP:
                        </span>

                        <code>
                          {
                            clientDetails.client
                              .consent.ipAddress
                          }
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                <div className="drawer-section">
                  <h3>
                    Clinical Demographics & Background
                  </h3>

                  <div className="demographics-grid">
                    <div>
                      <span>Age:</span>{" "}
                      <strong>
                        {clientDetails?.client
                          ?.demographics?.age ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>Gender:</span>{" "}
                      <strong>
                        {clientDetails?.client
                          ?.demographics?.gender ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>Occupation:</span>{" "}
                      <strong>
                        {clientDetails?.client
                          ?.demographics
                          ?.occupation ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>Location:</span>{" "}
                      <strong>
                        {clientDetails?.client
                          ?.demographics
                          ?.location ||
                          "Not specified"}
                      </strong>
                    </div>
                  </div>

                  <div className="concern-box">
                    <p>
                      <strong>
                        Presenting Concern:
                      </strong>{" "}
                      {clientDetails?.client
                        ?.presentingConcern ||
                        "None recorded"}
                    </p>
                  </div>

                  <div className="concern-box">
                    <p>
                      <strong>
                        Previous History:
                      </strong>{" "}
                      {clientDetails?.client
                        ?.history ||
                        "None recorded"}
                    </p>
                  </div>
                </div>

                <div className="drawer-section">
                  <h3>
                    Session History (
                    {clientDetails?.sessions
                      ?.length || 0}
                    )
                  </h3>

                  {clientDetails?.sessions
                    ?.length > 0 ? (
                    <div className="mini-session-list">
                      {clientDetails.sessions
                        .slice(0, 5)
                        .map((session) => (
                          <div
                            key={session._id}
                            className="mini-session-item"
                          >
                            <span>
                              {new Date(
                                session.startTime
                              ).toLocaleDateString()}
                            </span>

                            <strong>
                              {new Date(
                                session.startTime
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </strong>

                            <span
                              className={`status-pill ${session.status}`}
                            >
                              {session.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="empty-subtext">
                      No session history yet.
                    </p>
                  )}
                </div>

                <div className="drawer-section">
                  <div className="section-header-flex">
                    <h3>
                      Clinical Notes (
                      {clientDetails?.notes
                        ?.length || 0}
                      )
                    </h3>

                    <button
                      className="inline-notes-btn"
                      onClick={() =>
                        navigate(
                          "/therapist/notes"
                        )
                      }
                    >
                      Open Notes Editor →
                    </button>
                  </div>

                  {clientDetails?.notes
                    ?.length > 0 ? (
                    <div className="mini-notes-list">
                      {clientDetails.notes.map(
                        (note) => (
                          <div
                            key={note._id}
                            className="mini-note-card"
                          >
                            <div className="mini-note-header">
                              <strong>
                                {note.title}
                              </strong>

                              <span
                                className={`note-type-badge ${note.type}`}
                              >
                                {note.type ===
                                "shared"
                                  ? "Shared"
                                  : "Private"}
                              </span>
                            </div>

                            <small>
                              Template:{" "}
                              {note.template?.toUpperCase()}{" "}
                              •{" "}
                              {new Date(
                                note.createdAt
                              ).toLocaleDateString()}
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="empty-subtext">
                      No clinical notes recorded yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="client-modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-label">
                  EXISTING CLIENT RECORD
                </span>

                <h2>
                  Edit Client Information
                </h2>
              </div>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() =>
                  setIsEditModalOpen(false)
                }
                disabled={editSubmitting}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="modal-error-alert">
                {editError}
              </div>
            )}

            <form
              onSubmit={handleUpdateClient}
              className="modal-form"
            >
              <div className="form-group">
                <label>Full Name *</label>

                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>

                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) =>
                    setEditEmail(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>

                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) =>
                    setEditPhone(e.target.value)
                  }
                />
              </div>

              <div className="drawer-section">
                <h3>
                  Clinical Demographics & Background
                </h3>

                <div className="form-group">
                  <label>Age</label>

                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editAge}
                    onChange={(e) =>
                      setEditAge(e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>

                  <input
                    type="text"
                    placeholder="e.g. Female"
                    value={editGender}
                    onChange={(e) =>
                      setEditGender(e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Occupation</label>

                  <input
                    type="text"
                    value={editOccupation}
                    onChange={(e) =>
                      setEditOccupation(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>

                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) =>
                      setEditLocation(
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Presenting Concern
                </label>

                <textarea
                  rows="3"
                  value={editConcern}
                  onChange={(e) =>
                    setEditConcern(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Previous History
                </label>

                <textarea
                  rows="4"
                  placeholder="Previous therapy, relevant background, history..."
                  value={editHistory}
                  onChange={(e) =>
                    setEditHistory(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Client Status
                </label>

                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value)
                  }
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                  <option value="Archived">
                    Archived
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Tags</label>

                <input
                  type="text"
                  placeholder="Anxiety, Stress, New Client"
                  value={editTags}
                  onChange={(e) =>
                    setEditTags(e.target.value)
                  }
                />

                <small>
                  Separate multiple tags with commas.
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() =>
                    setIsEditModalOpen(false)
                  }
                  disabled={editSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={editSubmitting}
                >
                  {editSubmitting
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={closeUpgradeModal}
        featureName={upgradeModal.featureName}
        requiredTier={upgradeModal.requiredTier}
        message={upgradeModal.message}
      />
    </div>
  );
}

export default Clients;