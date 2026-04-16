import React, { useState, useEffect } from "react";
import T from "../theme";
import Guide from "./Guide";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const STAGES = ["lead", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const STAGE_COLORS = {
  lead: { bg: "rgba(148,163,184,0.15)", fg: "#94a3b8" },
  contacted: { bg: T.blueSoft, fg: T.blue },
  qualified: { bg: T.purpleSoft, fg: T.purple },
  proposal: { bg: T.yellowSoft, fg: T.yellow },
  negotiation: { bg: T.orangeSoft, fg: T.orange },
  won: { bg: T.greenSoft, fg: T.green },
  lost: { bg: T.redSoft, fg: T.red },
};

function ProspectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    first_name: "", last_name: "", email: "", phone: "", company: "",
    job_title: "", website: "", linkedin: "", city: "", country: "",
    stage: "lead", source: "manual", tags: [], notes: "", score: 0,
  });
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const labelStyle = { fontSize: "0.75rem", color: "#666", marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" };

  return (
    <div>
      <div style={T.grid3}>
        <div><label style={labelStyle}>Prenom</label><input style={T.input} value={form.first_name || ""} onChange={(e) => set("first_name", e.target.value)} /></div>
        <div><label style={labelStyle}>Nom</label><input style={T.input} value={form.last_name || ""} onChange={(e) => set("last_name", e.target.value)} /></div>
        <div><label style={labelStyle}>Email</label><input style={T.input} type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></div>
      </div>
      <div style={T.grid3}>
        <div><label style={labelStyle}>Telephone</label><input style={T.input} value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div>
        <div><label style={labelStyle}>Entreprise</label><input style={T.input} value={form.company || ""} onChange={(e) => set("company", e.target.value)} /></div>
        <div><label style={labelStyle}>Poste</label><input style={T.input} value={form.job_title || ""} onChange={(e) => set("job_title", e.target.value)} /></div>
      </div>
      <div style={T.grid3}>
        <div><label style={labelStyle}>Site web</label><input style={T.input} value={form.website || ""} onChange={(e) => set("website", e.target.value)} /></div>
        <div><label style={labelStyle}>LinkedIn</label><input style={T.input} value={form.linkedin || ""} onChange={(e) => set("linkedin", e.target.value)} /></div>
        <div><label style={labelStyle}>Score (0-100)</label><input type="number" min="0" max="100" style={T.input} value={form.score} onChange={(e) => set("score", parseInt(e.target.value) || 0)} /></div>
      </div>
      <div style={T.grid3}>
        <div><label style={labelStyle}>Ville</label><input style={T.input} value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></div>
        <div><label style={labelStyle}>Pays</label><input style={T.input} value={form.country || ""} onChange={(e) => set("country", e.target.value)} /></div>
        <div>
          <label style={labelStyle}>Stage</label>
          <select style={{ ...T.select, width: "100%" }} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>Notes</label>
        <textarea style={{ ...T.input, minHeight: 60 }} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button style={T.btn()} onClick={() => onSave(form)}>Sauvegarder</button>
        {onCancel && <button style={T.btn("#333", "#aaa")} onClick={onCancel}>Annuler</button>}
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
  const [error, setError] = useState(null);

  const load = () => {
    let url = `${API}/api/crm/prospects?limit=100`;
    if (filter) url += `&stage=${filter}`;
    if (search) url += `&search=${search}`;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setProspects)
      .catch(() => setError("Impossible de charger les prospects."));
  };

  useEffect(() => { load(); }, [filter, search]);

  const viewProspect = async (id) => {
    try {
      const res = await fetch(`${API}/api/crm/prospects/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelected(data);
      setActivities(data.activities || []);
      setEditMode(false);
      setError(null);
    } catch { setError("Impossible de charger ce prospect."); }
  };

  const createProspect = async (form) => {
    try {
      const res = await fetch(`${API}/api/crm/prospects`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur"); }
      setShowForm(false); setError(null); load();
    } catch (e) { setError(e.message); }
  };

  const updateProspect = async (form) => {
    try {
      const res = await fetch(`${API}/api/crm/prospects/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur"); }
      setEditMode(false); setError(null); viewProspect(selected.id); load();
    } catch (e) { setError(e.message); }
  };

  const deleteProspect = async (id) => {
    if (!window.confirm("Supprimer ce prospect ?")) return;
    await fetch(`${API}/api/crm/prospects/${id}`, { method: "DELETE" });
    setSelected(null); load();
  };

  const changeStage = async (stage) => {
    try {
      const res = await fetch(`${API}/api/crm/prospects/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error();
      viewProspect(selected.id); load();
    } catch { setError("Erreur lors du changement de stage."); }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`${API}/api/crm/prospects/${selected.id}/activities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", description: newNote }),
      });
      if (!res.ok) throw new Error();
      setNewNote(""); viewProspect(selected.id);
    } catch { setError("Erreur lors de l'ajout de la note."); }
  };

  const handleExport = () => {
    let url = `${API}/api/crm/prospects/export`;
    if (filter) url += `?stage=${filter}`;
    window.open(url, "_blank");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={T.pageTitle}>CRM</h1>
          <p style={{ color: "#555", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>Gestion des prospects</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button style={T.btnOutline("#666")} onClick={handleExport}>Exporter CSV</button>
          <button style={T.btn()} onClick={() => { setShowForm(true); setSelected(null); }}>+ Nouveau</button>
        </div>
      </div>

      <Guide
        title="Comment utiliser le CRM"
        defaultOpen={prospects.length === 0}
        steps={[
          "Cliquez sur \"+ Nouveau\" pour ajouter un prospect",
          "Remplissez les infos : nom, email, entreprise, etc.",
          "Chaque prospect a un stage : lead > contacted > qualified > proposal > negotiation > won/lost",
          "Cliquez sur un prospect pour voir ses details et changer son stage",
          "Ajoutez des notes pour suivre vos echanges",
          "Importez des prospects depuis Scraping via le bouton \"Importer CRM\"",
        ]}
      />

      {error && <div style={T.error}>{error}</div>}

      {/* Filters */}
      <div style={{ ...T.card, display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input style={{ ...T.input, maxWidth: 280 }} placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={T.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tous les stages</option>
          {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
        </select>
        <span style={{ ...T.meta, marginLeft: "auto" }}>{prospects.length} prospect{prospects.length > 1 ? "s" : ""}</span>
      </div>

      {showForm && (
        <div style={T.modal} onClick={() => setShowForm(false)}>
          <div style={T.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#fff" }}>Nouveau prospect</h3>
            <ProspectForm onSave={createProspect} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "1rem" }}>
        <div style={T.card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #2a2a2a" }}>
                {["Nom", "Email", "Entreprise", "Stage", "Score"].map((h) => (
                  <th key={h} style={{ padding: "0.5rem", color: "#555", fontWeight: 500, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => {
                const sc = STAGE_COLORS[p.stage] || { bg: T.accentSoft, fg: "#888" };
                return (
                  <tr key={p.id} onClick={() => viewProspect(p.id)}
                    style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer", background: selected?.id === p.id ? "rgba(255,255,255,0.03)" : "transparent" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = selected?.id === p.id ? "rgba(255,255,255,0.03)" : "transparent"}
                  >
                    <td style={{ padding: "0.6rem 0.5rem", color: "#ccc" }}>{p.first_name || ""} {p.last_name || ""}</td>
                    <td style={{ color: "#888" }}>{p.email || "-"}</td>
                    <td style={{ color: "#888" }}>{p.company || "-"}</td>
                    <td><span style={T.badge(sc.bg, sc.fg)}>{p.stage}</span></td>
                    <td style={{ color: "#888" }}>{p.score}</td>
                  </tr>
                );
              })}
              {prospects.length === 0 && <tr><td colSpan="5" style={{ ...T.meta, padding: "1.5rem", textAlign: "center" }}>Aucun prospect.</td></tr>}
            </tbody>
          </table>
        </div>

        {selected && (
          <div>
            <div style={T.card}>
              {editMode ? (
                <ProspectForm initial={selected} onSave={updateProspect} onCancel={() => setEditMode(false)} />
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem" }}>{selected.first_name} {selected.last_name}</h3>
                      <p style={{ ...T.meta, margin: "0.2rem 0 0" }}>{selected.job_title}{selected.job_title && selected.company ? " @ " : ""}{selected.company}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button style={T.btnSm("#333", "#ccc")} onClick={() => setEditMode(true)}>Modifier</button>
                      <button style={T.btnSm("transparent", T.red)} onClick={() => deleteProspect(selected.id)}>Supprimer</button>
                    </div>
                  </div>
                  <div style={{ ...T.grid2, marginTop: "1rem" }}>
                    {[
                      ["Email", selected.email], ["Telephone", selected.phone],
                      ["Site", selected.website], ["LinkedIn", selected.linkedin],
                      ["Ville", selected.city], ["Pays", selected.country],
                    ].map(([label, val]) => (
                      <div key={label}><span style={{ color: "#555" }}>{label}:</span> {val || "-"}</div>
                    ))}
                    <div><span style={{ color: "#555" }}>Stage:</span> <span style={T.badge(STAGE_COLORS[selected.stage]?.bg, STAGE_COLORS[selected.stage]?.fg)}>{selected.stage}</span></div>
                    <div><span style={{ color: "#555" }}>Score:</span> {selected.score}/100</div>
                    <div><span style={{ color: "#555" }}>Source:</span> {selected.source || "-"}</div>
                    <div><span style={{ color: "#555" }}>Tags:</span> {(selected.tags || []).join(", ") || "-"}</div>
                  </div>
                  {selected.notes && <div style={{ marginTop: "0.75rem", color: "#999" }}>{selected.notes}</div>}

                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ ...T.sectionTitle, marginBottom: "0.4rem" }}>Changer le stage</div>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                      {STAGES.map((st) => {
                        const sc = STAGE_COLORS[st];
                        return (
                          <button key={st}
                            style={{ ...T.btnSm(selected.stage === st ? sc.fg : "#222", selected.stage === st ? "#fff" : sc.fg), border: `1px solid ${sc.fg}40`, opacity: selected.stage === st ? 1 : 0.6 }}
                            onClick={() => changeStage(st)}
                          >{st}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={T.card}>
              <div style={T.sectionTitle}>Activites</div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input style={{ ...T.input, flex: 1 }} placeholder="Ajouter une note..." value={newNote}
                  onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <button style={T.btnSm()} onClick={addNote}>Ajouter</button>
              </div>
              {activities.map((a) => (
                <div key={a.id} style={{ borderBottom: "1px solid #1e1e1e", padding: "0.5rem 0" }}>
                  <span style={T.badge(a.type === "stage_change" ? T.yellowSoft : T.blueSoft, a.type === "stage_change" ? T.yellow : T.blue)}>{a.type}</span>{" "}
                  <span style={{ color: "#aaa" }}>{a.description}</span>
                  <span style={{ ...T.meta, marginLeft: "0.5rem" }}>{new Date(a.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
              {activities.length === 0 && <p style={T.meta}>Aucune activite.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
