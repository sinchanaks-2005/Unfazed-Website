import { useEffect, useState } from "react";
import axios from "axios";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const API_BASE = "http://localhost:5000/api";

function Notes() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [notes, setNotes] = useState([]);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState("private");
  const [template, setTemplate] = useState("freeform");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [soapData, setSoapData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  const [dapData, setDapData] = useState({
    data: "",
    assessment: "",
    plan: "",
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (!editor) return;

    if (template === "freeform") {
      editor.commands.setContent(content || "", false);
    }
  }, [editor, template]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);

      const res = await axios.get(
        `${API_BASE}/clients`,
        getAuthConfig()
      );

      setClients(res.data.clients || []);
    } catch (error) {
      console.error("Error loading clients:", error);

      alert(
        error.response?.data?.message ||
          "Unable to load clients."
      );
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchNotes = async (clientId) => {
    try {
      setLoadingNotes(true);

      const res = await axios.get(
        `${API_BASE}/notes/client/${clientId}`,
        getAuthConfig()
      );

      setNotes(res.data.notes || []);
    } catch (error) {
      console.error("Error loading notes:", error);

      alert(
        error.response?.data?.message ||
          "Unable to load clinical notes."
      );
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    fetchNotes(client._id);
    resetForm();
  };

  const resetForm = () => {
    setType("private");
    setTemplate("freeform");
    setTitle("");
    setContent("");

    setSoapData({
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    });

    setDapData({
      data: "",
      assessment: "",
      plan: "",
    });

    if (editor) {
      editor.commands.clearContent();
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();

    if (!selectedClient) {
      alert("Please select a client first.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a note title.");
      return;
    }

    if (
      template === "freeform" &&
      (!content || content === "<p></p>" || !editor?.getText().trim())
    ) {
      alert("Please enter note content.");
      return;
    }

    if (template === "SOAP") {
      if (
        !soapData.subjective.trim() &&
        !soapData.objective.trim() &&
        !soapData.assessment.trim() &&
        !soapData.plan.trim()
      ) {
        alert("Please enter SOAP note details.");
        return;
      }
    }

    if (template === "DAP") {
      if (
        !dapData.data.trim() &&
        !dapData.assessment.trim() &&
        !dapData.plan.trim()
      ) {
        alert("Please enter DAP note details.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        clientId: selectedClient._id,
        type,
        template,
        title: title.trim(),
        content: template === "freeform" ? content : "",
        soapData: template === "SOAP" ? soapData : {},
        dapData: template === "DAP" ? dapData : {},
      };

      await axios.post(
        `${API_BASE}/notes`,
        payload,
        getAuthConfig()
      );

      alert(
        type === "shared"
          ? "Shared note saved successfully."
          : "Private clinical note saved successfully."
      );

      resetForm();
      await fetchNotes(selectedClient._id);
    } catch (error) {
      console.error("Save note error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to save clinical note."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "25px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              color: "#1f2937",
            }}
          >
            Clinical Notes
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
            }}
          >
            Create and manage private and client-shared
            clinical documentation.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "15px",
                fontSize: "19px",
                color: "#1f2937",
              }}
            >
              Clients
            </h2>

            {loadingClients ? (
              <p>Loading clients...</p>
            ) : clients.length === 0 ? (
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                No clients found.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {clients.map((client) => (
                  <button
                    key={client._id}
                    onClick={() => handleClientSelect(client)}
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderRadius: "8px",
                      border:
                        selectedClient?._id === client._id
                          ? "2px solid #4f46e5"
                          : "1px solid #e5e7eb",
                      background:
                        selectedClient?._id === client._id
                          ? "#eef2ff"
                          : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      {client.name}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginTop: "4px",
                      }}
                    >
                      {client.email}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {!selectedClient ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "50px",
                  textAlign: "center",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                <h2
                  style={{
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Select a Client
                </h2>

                <p style={{ color: "#6b7280" }}>
                  Select a client from the left to create
                  and view clinical notes.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: "#1f2937",
                    }}
                  >
                    {selectedClient.name}
                  </h2>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#6b7280",
                    }}
                  >
                    {selectedClient.email}
                  </p>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: "24px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  }}
                >
                  <h2
                    style={{
                      marginTop: 0,
                      color: "#1f2937",
                    }}
                  >
                    Create Clinical Note
                  </h2>

                  <form onSubmit={handleSaveNote}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontWeight: "600",
                            marginBottom: "7px",
                          }}
                        >
                          Note Type
                        </label>

                        <select
                          value={type}
                          onChange={(e) =>
                            setType(e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "11px",
                            borderRadius: "7px",
                            border: "1px solid #d1d5db",
                          }}
                        >
                          <option value="private">
                            Private Clinical Note
                          </option>

                          <option value="shared">
                            Shared With Client
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontWeight: "600",
                            marginBottom: "7px",
                          }}
                        >
                          Template
                        </label>

                        <select
                          value={template}
                          onChange={(e) => {
                            setTemplate(e.target.value);

                            if (e.target.value !== "freeform") {
                              setContent("");

                              if (editor) {
                                editor.commands.clearContent();
                              }
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "11px",
                            borderRadius: "7px",
                            border: "1px solid #d1d5db",
                          }}
                        >
                          <option value="freeform">
                            Freeform
                          </option>

                          <option value="SOAP">
                            SOAP
                          </option>

                          <option value="DAP">
                            DAP
                          </option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          fontWeight: "600",
                          marginBottom: "7px",
                        }}
                      >
                        Note Title
                      </label>

                      <input
                        type="text"
                        value={title}
                        onChange={(e) =>
                          setTitle(e.target.value)
                        }
                        placeholder="Example: Session Progress Note"
                        style={{
                          width: "100%",
                          padding: "11px",
                          borderRadius: "7px",
                          border: "1px solid #d1d5db",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {template === "freeform" && (
                      <div style={{ marginBottom: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            fontWeight: "600",
                            marginBottom: "7px",
                          }}
                        >
                          Clinical Note
                        </label>

                        <div
                          style={{
                            border: "1px solid #d1d5db",
                            borderRadius: "7px",
                            overflow: "hidden",
                          }}
                        >
                          {editor && (
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "6px",
                                  flexWrap: "wrap",
                                  padding: "10px",
                                  borderBottom:
                                    "1px solid #e5e7eb",
                                  background: "#f9fafb",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    editor
                                      .chain()
                                      .focus()
                                      .toggleBold()
                                      .run()
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "5px",
                                    background: editor.isActive(
                                      "bold"
                                    )
                                      ? "#e5e7eb"
                                      : "#ffffff",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                  }}
                                >
                                  B
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    editor
                                      .chain()
                                      .focus()
                                      .toggleItalic()
                                      .run()
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "5px",
                                    background: editor.isActive(
                                      "italic"
                                    )
                                      ? "#e5e7eb"
                                      : "#ffffff",
                                    cursor: "pointer",
                                    fontStyle: "italic",
                                  }}
                                >
                                  I
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    editor
                                      .chain()
                                      .focus()
                                      .toggleBulletList()
                                      .run()
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "5px",
                                    background:
                                      editor.isActive(
                                        "bulletList"
                                      )
                                        ? "#e5e7eb"
                                        : "#ffffff",
                                    cursor: "pointer",
                                  }}
                                >
                                  • List
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    editor
                                      .chain()
                                      .focus()
                                      .toggleOrderedList()
                                      .run()
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "5px",
                                    background:
                                      editor.isActive(
                                        "orderedList"
                                      )
                                        ? "#e5e7eb"
                                        : "#ffffff",
                                    cursor: "pointer",
                                  }}
                                >
                                  1. List
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    editor
                                      .chain()
                                      .focus()
                                      .toggleHeading({
                                        level: 2,
                                      })
                                      .run()
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "5px",
                                    background:
                                      editor.isActive(
                                        "heading",
                                        { level: 2 }
                                      )
                                        ? "#e5e7eb"
                                        : "#ffffff",
                                    cursor: "pointer",
                                  }}
                                >
                                  H2
                                </button>
                              </div>

                              <EditorContent
                                editor={editor}
                                style={{
                                  minHeight: "220px",
                                  padding: "14px",
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {template === "SOAP" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          marginBottom: "16px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontWeight: "600",
                              marginBottom: "6px",
                            }}
                          >
                            Subjective
                          </label>

                          <textarea
                            rows={4}
                            value={soapData.subjective}
                            onChange={(e) =>
                              setSoapData({
                                ...soapData,
                                subjective: e.target.value,
                              })
                            }
                            placeholder="Client's reported symptoms, concerns and experiences..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "7px",
                              border: "1px solid #d1d5db",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontWeight: "600",
                              marginBottom: "6px",
                            }}
                          >
                            Objective
                          </label>

                          <textarea
                            rows={4}
                            value={soapData.objective}
                            onChange={(e) =>
                              setSoapData({
                                ...soapData,
                                objective: e.target.value,
                              })
                            }
                            placeholder="Observable information and clinical observations..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "7px",
                              border: "1px solid #d1d5db",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontWeight: "600",
                              marginBottom: "6px",
                            }}
                          >
                            Assessment
                          </label>

                          <textarea
                            rows={4}
                            value={soapData.assessment}
                            onChange={(e) =>
                              setSoapData({
                                ...soapData,
                                assessment: e.target.value,
                              })
                            }
                            placeholder="Clinical assessment..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "7px",
                              border: "1px solid #d1d5db",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontWeight: "600",
                              marginBottom: "6px",
                            }}
                          >
                            Plan
                          </label>

                          <textarea
                            rows={4}
                            value={soapData.plan}
                            onChange={(e) =>
                              setSoapData({
                                ...soapData,
                                plan: e.target.value,
                              })
                            }
                            placeholder="Treatment plan and next steps..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "7px",
                              border: "1px solid #d1d5db",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {template === "DAP" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          marginBottom: "16px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontWeight: "600",
                              marginBottom: "6px",
                            }}
                          >
                            Data
                          </label>

                          <textarea
                            rows={5}
                            value={dapData.data}
                            onChange={(e) =>
                              setDapData({
                                ...dapData,
                                data: e.target.value,
                              })
                            }
                            placeholder="Session observations and relevant information..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "7px",
                              border: "1px solid #d1d5db",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontWeight: "600",
                              marginBottom: "6px",
                            }}
                          >
                            Assessment
                          </label>

                          <textarea
                            rows={5}
                            value={dapData.assessment}
                            onChange={(e) =>
                              setDapData({
                                ...dapData,
                                assessment: e.target.value,
                              })
                            }
                            placeholder="Clinical interpretation and assessment..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "7px",
                              border: "1px solid #d1d5db",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontWeight: "600",
                              marginBottom: "6px",
                            }}
                          >
                            Plan
                          </label>

                          <textarea
                            rows={5}
                            value={dapData.plan}
                            onChange={(e) =>
                              setDapData({
                                ...dapData,
                                plan: e.target.value,
                              })
                            }
                            placeholder="Treatment plan and next steps..."
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "7px",
                              border: "1px solid #d1d5db",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: "12px 22px",
                        border: "none",
                        borderRadius: "7px",
                        background: "#4f46e5",
                        color: "#ffffff",
                        fontWeight: "600",
                        cursor: saving
                          ? "not-allowed"
                          : "pointer",
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : type === "shared"
                        ? "Save & Share Note"
                        : "Save Private Note"}
                    </button>
                  </form>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  }}
                >
                  <h2
                    style={{
                      marginTop: 0,
                      color: "#1f2937",
                    }}
                  >
                    Existing Notes
                  </h2>

                  {loadingNotes ? (
                    <p>Loading notes...</p>
                  ) : notes.length === 0 ? (
                    <p
                      style={{
                        color: "#6b7280",
                      }}
                    >
                      No clinical notes have been created
                      for this client yet.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      {notes.map((note) => (
                        <div
                          key={note._id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "9px",
                            padding: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            <h3
                              style={{
                                margin: 0,
                                color: "#1f2937",
                              }}
                            >
                              {note.title}
                            </h3>

                            <span
                              style={{
                                padding: "5px 9px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background:
                                  note.type === "shared"
                                    ? "#dcfce7"
                                    : "#fee2e2",
                                color:
                                  note.type === "shared"
                                    ? "#166534"
                                    : "#991b1b",
                              }}
                            >
                              {note.type === "shared"
                                ? "Shared"
                                : "Private"}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              marginBottom: "12px",
                            }}
                          >
                            {note.template} •{" "}
                            {formatDate(note.createdAt)}
                          </div>

                          {note.template === "freeform" && (
                            <div
                              style={{
                                color: "#374151",
                                lineHeight: "1.6",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: note.content || "",
                              }}
                            />
                          )}

                          {note.template === "SOAP" && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                color: "#374151",
                              }}
                            >
                              <div>
                                <strong>Subjective:</strong>{" "}
                                {note.soapData?.subjective || "—"}
                              </div>

                              <div>
                                <strong>Objective:</strong>{" "}
                                {note.soapData?.objective || "—"}
                              </div>

                              <div>
                                <strong>Assessment:</strong>{" "}
                                {note.soapData?.assessment || "—"}
                              </div>

                              <div>
                                <strong>Plan:</strong>{" "}
                                {note.soapData?.plan || "—"}
                              </div>
                            </div>
                          )}

                          {note.template === "DAP" && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                color: "#374151",
                              }}
                            >
                              <div>
                                <strong>Data:</strong>{" "}
                                {note.dapData?.data || "—"}
                              </div>

                              <div>
                                <strong>Assessment:</strong>{" "}
                                {note.dapData?.assessment || "—"}
                              </div>

                              <div>
                                <strong>Plan:</strong>{" "}
                                {note.dapData?.plan || "—"}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notes;