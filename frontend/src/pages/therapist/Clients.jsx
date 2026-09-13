import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Clients.css";

function Clients() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const clients = [
    {
      id: 1,
      name: "Client A",
      email: "clienta@example.com",
      sessions: 6,
      lastSession: "05 Sep 2026",
      status: "Active",
    },
    {
      id: 2,
      name: "Client B",
      email: "clientb@example.com",
      sessions: 4,
      lastSession: "03 Sep 2026",
      status: "Active",
    },
    {
      id: 3,
      name: "Client C",
      email: "clientc@example.com",
      sessions: 8,
      lastSession: "28 Aug 2026",
      status: "Active",
    },
    {
      id: 4,
      name: "Client D",
      email: "clientd@example.com",
      sessions: 3,
      lastSession: "20 Aug 2026",
      status: "Inactive",
    },
  ];

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalSessions = clients.reduce(
    (total, client) => total + client.sessions,
    0
  );

  const activeClients = clients.filter(
    (client) => client.status === "Active"
  ).length;

  return (
    <div className="clients-page">

      {/* Back to Dashboard */}
      <button
        className="back-dashboard-button"
        onClick={() => navigate("/therapist/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <div className="clients-header">
        <div>
          <p className="clients-label">THERAPIST PORTAL</p>

          <h1>Clients</h1>

          <p>
            Manage your clients and keep track of their therapy journey.
          </p>
        </div>

        <button className="add-client-btn">
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
            <h3>{activeClients}</h3>
            <p>Active Clients</p>
          </div>
        </div>

        <div className="client-stat-card">
          <div className="stat-icon">▣</div>

          <div>
            <h3>{totalSessions}</h3>
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

          <div className="client-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

        </div>

        <div className="clients-table-wrapper">

          <table className="clients-table">

            <thead>
              <tr>
                <th>CLIENT</th>
                <th>EMAIL</th>
                <th>SESSIONS</th>
                <th>LAST SESSION</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>

              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (

                  <tr key={client.id}>

                    <td>
                      <div className="client-name">

                        <div className="client-avatar">
                          {client.name.charAt(0)}
                        </div>

                        <strong>
                          {client.name}
                        </strong>

                      </div>
                    </td>

                    <td className="client-email">
                      {client.email}
                    </td>

                    <td>
                      {client.sessions}
                    </td>

                    <td>
                      {client.lastSession}
                    </td>

                    <td>
                      <span
                        className={`client-status ${client.status.toLowerCase()}`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td>
                      <button className="view-client-btn">
                        View
                      </button>
                    </td>

                  </tr>

                ))
              ) : (

                <tr>
                  <td colSpan="6">
                    <div className="no-clients">

                      <div>🔍</div>

                      <h3>No clients found</h3>

                      <p>
                        Try searching with a different name or email.
                      </p>

                    </div>
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Clients;