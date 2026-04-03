import React, { useState, useEffect } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const STAGES = ["lead", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const STAGE_COLORS = {
  lead: "#94a3b8", contacted: "#60a5fa", qualified: "#a78bfa",
  proposal: "#fbbf24", negotiation: "#fb923c", won: "#34d399", lost: "#f87171",
};

const s = {
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "1.5rem", marginBottom: "1.5rem" },
  btn: (color = "#4361ee") => ({ padding: "0.6rem 1.2rem", fontSize: "0.9rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 8, cursor: "pointer" }),
  btnSm: (color = "#4361ee") => ({ padding: "0.3rem 0.7rem", fontSize: "0.8rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 6, cursor: "pointer" }),
  input: { padding: "0.5rem 0.75rem", fontSize: "0.9rem", border: "1px solid #ddd", borderRadius: 6, outline: "none", width: "100%" },
  select: { padding: "0.5rem", fontSize: "0.9rem", border: "1px solid #ddd", borderRadius: 6, outline: "none" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" },
  badge: (color) => ({ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: color + "20", color }),
  meta: { fontSize: "0.8rem", color: "#888" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#fff", borderRadius: 12, padding: "2rem", maxWidth: 600, width: "90%", maxHeight: "80vh", overflowY: "auto" },
};

function ProspectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    first_name: "", last_name: "", email: "", phone: "", company: "",
    job_title: "", website: "", linkedin: "", city: "", country: "",
    stage: "lead", source: "manual", tags: [], notes: "", score: 0,
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div>
      <div style={s.grid3}>
        <div><label>Prenom</label><input style={s.input} value={form.first_name || ""} onChange={(e) => set("first_name", e.target.value)} /></div>
        <div><label>Nom</label><input style={s.input} value={form.last_name || ""} onChange={(e) => set("last_name", e.target.value)} /></div>
        <div><label>Email</label><input style={s.input} value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></div>
      </div>
      <div style={s.grid3}>
        <div><label>Telephone</label><input style={s.input} value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div>
        <div><label>Entreprise</label><input style={s.input} value={form.company || ""} onChange={(e) => set("company", e.target.value)} /></div>
        <div><label>Poste</label><input style={s.input} value={form.job_title || ""} onChange={(e) => set("job_title", e.target.value)} /></div>
      </div>
      <div style={s.grid3}>
        <div><label>Site web</label><input style={s.input} value={form.website || ""} onChange={(e) => set("website", e.target.value)} /></div>
        <div><label>LinkedIn</label><input style={s.input} value={form.linkedin || ""} onChange={(e) => set("linkedin", e.target.value)} /></div>
        <div><label>Score (0-100)</label><input type="number" min="0" max="100" style={s.input} value={form.score} onChange={(e) => set("score", parseInt(e.target.value) || 0)} /></div>
      </div>
      <div style={s.grid3}>
        <div><label>Ville</label><input style={s.input} value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></div>
        <div><label>Pays</label><input style={s.input} value={form.country || ""} onChange={(e) => set("country", e.target.value)} /></div>
        <div>
          <label>Stage</label>
          <select style={{ ...s.select, width: "100%" }} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>Notes</label>
        <textarea style={{ ...s.input, minHeight: 60 }} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button style={s.btn("#4361ee")} onClick={() => onSave(form)}>Sauvegarder</button>
        {onCancel && <button style={s.btn("#94a3b8")} onClick={onCancel}>Annuler</button>}
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [activities, setActivities] = useState([]);
  const [newNote, setNewNote] = useState("");

  const load = () => {
    let url = `${API}/api/crm/prospects?limit=100`;
    if (filter) url += `&stage=${filter}`;
    if (search) url += `&search=${search}`;
    fetch(url).then((r) => r.json()).then(setProspects).catch(() => {});
  };

  useEffect(() => { load(); }, [filter, search]);

  const viewProspect = async (id) => {
    const res = await fetch(`${API}/api/crm/prospects/${id}`);
    const data = await res.json();
    setSelected(data);
    setActivities(data.activities || []);
    setEditMode(false);
  };

  const createProspect = async (form) => {
    await fetch(`${API}/api/crm/prospects`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false); load();
  };

  const updateProspect = async (form) => {
    await fetch(`${API}/api/crm/prospects/${selected.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditMode(false); viewProspect(selected.id); load();
  };

  const deleteProspect = async (id) => {
    if (!window.confirm("Supprimer ce prospect ?")) return;
    await fetch(`${API}/api/crm/prospects/${id}`, { method: "DELETE" });
    setSelected(null); load();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    await fetch(`${API}/api/crm/prospects/${selected.id}/activities`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", description: newNote }),
    });
    setNewNote(""); viewProspect(selected.id);
  };

  const handleExport = () => {
    let url = `${API}/api/crm/prospects/export`;
    if (filter) url += `?stage=${filter}`;
    window.open(url, "_blank");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>CRM - Prospects</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button style={s.btnSm("#10b981")} onClick={handleExport}>Exporter CSV</button>
          <button style={s.btn()} onClick={() => { setShowForm(true); setSelected(null); }}>+ Nouveau prospect</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...s.card, display: "flex", gap: "1rem", alignItems: "center" }}>
        <input style={{ ...s.input, maxWidth: 300 }} placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={s.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tous les stages</option>
          {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
        </select>
        <span style={s.meta}>{prospects.length} prospects</span>
      </div>

      {/* New prospect form */}
      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nouveau prospect</h3>
            <ProspectForm onSave={createProspect} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
        {/* List */}
        <div style={s.card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "0.5rem" }}>Nom</th>
                <th>Email</th>
                <th>Entreprise</th>
                <th>Stage</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} onClick={() => viewProspect(p.id)}
                  style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer", background: selected?.id === p.id ? "#f0f4ff" : "transparent" }}>
                  <td style={{ padding: "0.5rem" }}>{p.first_name || ""} {p.last_name || ""}</td>
                  <td>{p.email}</td>
                  <td>{p.company}</td>
                  <td><span style={s.badge(STAGE_COLORS[p.stage] || "#94a3b8")}>{p.stage}</span></td>
                  <td>{p.score}</td>
                </tr>
              ))}
              {prospects.length === 0 && <tr><td colSpan="5" style={{ ...s.meta, padding: "1rem", textAlign: "center" }}>Aucun prospect</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Detail */}
        {selected && (
          <div>
            <div style={s.card}>
              {editMode ? (
                <ProspectForm initial={selected} onSave={updateProspect} onCancel={() => setEditMode(false)} />
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{selected.first_name} {selected.last_name}</h3>
                      <p style={s.meta}>{selected.job_title}{selected.job_title && selected.company ? " @ " : ""}{selected.company}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button style={s.btnSm("#4361ee")} onClick={() => setEditMode(true)}>Modifier</button>
                      <button style={s.btnSm("#f87171")} onClick={() => deleteProspect(selected.id)}>Supprimer</button>
                    </div>
                  </div>
                  <div style={{ ...s.grid2, marginTop: "1rem" }}>
                    <div><strong>Email:</strong> {selected.email || "-"}</div>
                    <div><strong>Telephone:</strong> {selected.phone || "-"}</div>
                    <div><strong>Site:</strong> {selected.website || "-"}</div>
                    <div><strong>LinkedIn:</strong> {selected.linkedin || "-"}</div>
                    <div><strong>Ville:</strong> {selected.city || "-"}</div>
                    <div><strong>Pays:</strong> {selected.country || "-"}</div>
                    <div><strong>Stage:</strong> <span style={s.badge(STAGE_COLORS[selected.stage])}>{selected.stage}</span></div>
                    <div><strong>Score:</strong> {selected.score}/100</div>
                    <div><strong>Source:</strong> {selected.source || "-"}</div>
                    <div><strong>Tags:</strong> {(selected.tags || []).join(", ") || "-"}</div>
                  </div>
                  {selected.notes && <div style={{ marginTop: "0.75rem" }}><strong>Notes:</strong> {selected.notes}</div>}

                  {/* Quick stage change */}
                  <div style={{ marginTop: "1rem" }}>
                    <strong>Changer le stage:</strong>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      {STAGES.map((st) => (
                        <button key={st} style={s.btnSm(selected.stage === st ? STAGE_COLORS[st] : "#ddd")}
                          onClick={async () => {
                            await fetch(`${API}/api/crm/prospects/${selected.id}`, {
                              method: "PUT", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ stage: st }),
                            });
                            viewProspect(selected.id); load();
                          }}
                        >{st}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activities */}
            <div style={s.card}>
              <h4 style={{ marginTop: 0 }}>Activites</h4>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input style={{ ...s.input, flex: 1 }} placeholder="Ajouter une note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <button style={s.btnSm()} onClick={addNote}>Ajouter</button>
              </div>
              {activities.map((a) => (
                <div key={a.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "0.5rem 0" }}>
                  <span style={s.badge(a.type === "stage_change" ? "#f59e0b" : "#4361ee")}>{a.type}</span>{" "}
                  {a.description}
                  <span style={{ ...s.meta, marginLeft: "0.5rem" }}>{new Date(a.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
              {activities.length === 0 && <p style={s.meta}>Aucune activite</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
