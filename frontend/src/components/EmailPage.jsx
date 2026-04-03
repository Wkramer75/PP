import React, { useState, useEffect } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const s = {
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "1.5rem", marginBottom: "1.5rem" },
  btn: (color = "#4361ee") => ({ padding: "0.6rem 1.2rem", fontSize: "0.9rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 8, cursor: "pointer" }),
  btnSm: (color = "#4361ee") => ({ padding: "0.3rem 0.7rem", fontSize: "0.8rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 6, cursor: "pointer" }),
  input: { padding: "0.5rem 0.75rem", fontSize: "0.9rem", border: "1px solid #ddd", borderRadius: 6, outline: "none", width: "100%" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem" },
  tab: (active) => ({ padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", background: active ? "#4361ee" : "#e8e8e8", color: active ? "#fff" : "#333", border: "none" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" },
  badge: (color) => ({ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: color + "20", color }),
  meta: { fontSize: "0.8rem", color: "#888" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#fff", borderRadius: 12, padding: "2rem", maxWidth: 700, width: "90%", maxHeight: "85vh", overflowY: "auto" },
};

const STATUS_COLORS = { draft: "#94a3b8", sending: "#fbbf24", sent: "#34d399", paused: "#fb923c" };

// ── Templates Section ────────────────────────────────────────────────────────
function TemplatesSection() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", body_html: "", body_text: "", variables: [], category: "" });

  useEffect(() => { fetch(`${API}/api/email/templates`).then((r) => r.json()).then(setTemplates).catch(() => {}); }, []);

  const save = async () => {
    const vars = typeof form.variables === "string" ? form.variables.split(",").map((v) => v.trim()).filter(Boolean) : form.variables;
    await fetch(`${API}/api/email/templates`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, variables: vars }),
    });
    setShowForm(false);
    setForm({ name: "", subject: "", body_html: "", body_text: "", variables: [], category: "" });
    const updated = await fetch(`${API}/api/email/templates`).then((r) => r.json());
    setTemplates(updated);
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Supprimer ce template ?")) return;
    await fetch(`${API}/api/email/templates/${id}`, { method: "DELETE" });
    setTemplates((p) => p.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>Templates Email</h3>
        <button style={s.btn()} onClick={() => setShowForm(true)}>+ Nouveau template</button>
      </div>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nouveau template</h3>
            <div style={{ marginBottom: "0.75rem" }}><label>Nom</label><input style={s.input} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div style={{ marginBottom: "0.75rem" }}><label>Sujet</label><input style={s.input} value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Bonjour {{first_name}}" /></div>
            <div style={{ marginBottom: "0.75rem" }}><label>Categorie</label><input style={s.input} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="intro, follow_up, proposal" /></div>
            <div style={{ marginBottom: "0.75rem" }}><label>Variables (separees par des virgules)</label><input style={s.input} value={typeof form.variables === "string" ? form.variables : form.variables.join(", ")} onChange={(e) => setForm((p) => ({ ...p, variables: e.target.value }))} placeholder="first_name, company, job_title" /></div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label>Corps HTML</label>
              <textarea style={{ ...s.input, minHeight: 150, fontFamily: "monospace", fontSize: "0.85rem" }} value={form.body_html}
                onChange={(e) => setForm((p) => ({ ...p, body_html: e.target.value }))}
                placeholder={"<h1>Bonjour {{first_name}}</h1>\n<p>Je me permets de vous contacter...</p>"} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button style={s.btn()} onClick={save}>Sauvegarder</button>
              <button style={s.btn("#94a3b8")} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {templates.length === 0 && <p style={s.meta}>Aucun template. Creez-en un pour commencer.</p>}
      {templates.map((t) => (
        <div key={t.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{t.name}</strong> {t.category && <span style={s.badge("#4361ee")}>{t.category}</span>}
            <div style={s.meta}>Sujet: {t.subject}</div>
            <div style={s.meta}>Variables: {(t.variables || []).join(", ") || "aucune"}</div>
          </div>
          <button style={s.btnSm("#f87171")} onClick={() => deleteTemplate(t.id)}>Supprimer</button>
        </div>
      ))}
    </div>
  );
}

// ── Campaigns Section ────────────────────────────────────────────────────────
function CampaignsSection() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [form, setForm] = useState({
    name: "", template_id: "", smtp_host: "smtp.gmail.com", smtp_port: 587,
    smtp_user: "", smtp_password: "", from_name: "", from_email: "",
  });

  useEffect(() => {
    fetch(`${API}/api/email/campaigns`).then((r) => r.json()).then(setCampaigns).catch(() => {});
    fetch(`${API}/api/email/templates`).then((r) => r.json()).then(setTemplates).catch(() => {});
    fetch(`${API}/api/crm/prospects?limit=200`).then((r) => r.json()).then(setProspects).catch(() => {});
  }, []);

  const createCampaign = async () => {
    await fetch(`${API}/api/email/campaigns`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, template_id: parseInt(form.template_id) }),
    });
    setShowForm(false);
    const updated = await fetch(`${API}/api/email/campaigns`).then((r) => r.json());
    setCampaigns(updated);
  };

  const viewCampaign = async (id) => {
    const camp = await fetch(`${API}/api/email/campaigns/${id}`).then((r) => r.json());
    setSelectedCampaign(camp);
    const recs = await fetch(`${API}/api/email/campaigns/${id}/recipients`).then((r) => r.json());
    setRecipients(recs);
  };

  const addProspects = async () => {
    const ids = prospects.filter((p) => p.email).map((p) => p.id);
    if (!ids.length) return;
    await fetch(`${API}/api/email/campaigns/${selectedCampaign.id}/recipients`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospect_ids: ids }),
    });
    viewCampaign(selectedCampaign.id);
  };

  const sendCampaign = async () => {
    if (!window.confirm("Envoyer cette campagne maintenant ?")) return;
    try {
      await fetch(`${API}/api/email/campaigns/${selectedCampaign.id}/send`, { method: "POST" });
      viewCampaign(selectedCampaign.id);
      const updated = await fetch(`${API}/api/email/campaigns`).then((r) => r.json());
      setCampaigns(updated);
    } catch (err) { alert("Erreur: " + err.message); }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm("Supprimer cette campagne ?")) return;
    await fetch(`${API}/api/email/campaigns/${id}`, { method: "DELETE" });
    setSelectedCampaign(null);
    const updated = await fetch(`${API}/api/email/campaigns`).then((r) => r.json());
    setCampaigns(updated);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>Campagnes</h3>
        <button style={s.btn()} onClick={() => setShowForm(true)}>+ Nouvelle campagne</button>
      </div>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nouvelle campagne</h3>
            <div style={s.grid2}>
              <div><label>Nom</label><input style={s.input} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div>
                <label>Template</label>
                <select style={{ ...s.input }} value={form.template_id} onChange={(e) => setForm((p) => ({ ...p, template_id: e.target.value }))}>
                  <option value="">Choisir...</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div style={s.grid2}>
              <div><label>SMTP Host</label><input style={s.input} value={form.smtp_host} onChange={(e) => setForm((p) => ({ ...p, smtp_host: e.target.value }))} /></div>
              <div><label>SMTP Port</label><input type="number" style={s.input} value={form.smtp_port} onChange={(e) => setForm((p) => ({ ...p, smtp_port: parseInt(e.target.value) }))} /></div>
            </div>
            <div style={s.grid2}>
              <div><label>SMTP User</label><input style={s.input} value={form.smtp_user} onChange={(e) => setForm((p) => ({ ...p, smtp_user: e.target.value }))} /></div>
              <div><label>SMTP Password</label><input type="password" style={s.input} value={form.smtp_password} onChange={(e) => setForm((p) => ({ ...p, smtp_password: e.target.value }))} /></div>
            </div>
            <div style={s.grid2}>
              <div><label>Nom expediteur</label><input style={s.input} value={form.from_name} onChange={(e) => setForm((p) => ({ ...p, from_name: e.target.value }))} /></div>
              <div><label>Email expediteur</label><input style={s.input} value={form.from_email} onChange={(e) => setForm((p) => ({ ...p, from_email: e.target.value }))} /></div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button style={s.btn()} onClick={createCampaign}>Creer</button>
              <button style={s.btn("#94a3b8")} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selectedCampaign ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
        {/* List */}
        <div>
          {campaigns.length === 0 && <p style={s.meta}>Aucune campagne</p>}
          {campaigns.map((c) => (
            <div key={c.id} style={{ ...s.card, cursor: "pointer", border: selectedCampaign?.id === c.id ? "2px solid #4361ee" : "2px solid transparent" }}
              onClick={() => viewCampaign(c.id)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{c.name}</strong>
                <span style={s.badge(STATUS_COLORS[c.status] || "#94a3b8")}>{c.status}</span>
              </div>
              <div style={s.meta}>{c.total_recipients} destinataires | {c.sent_count} envoyes | {c.failed_count} echecs</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selectedCampaign && (
          <div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <h3 style={{ margin: 0 }}>{selectedCampaign.name}</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {selectedCampaign.status === "draft" && (
                    <button style={s.btnSm("#10b981")} onClick={sendCampaign}>Envoyer</button>
                  )}
                  <button style={s.btnSm("#f87171")} onClick={() => deleteCampaign(selectedCampaign.id)}>Supprimer</button>
                </div>
              </div>
              <div style={{ ...s.grid2, marginTop: "1rem" }}>
                <div><strong>Status:</strong> <span style={s.badge(STATUS_COLORS[selectedCampaign.status])}>{selectedCampaign.status}</span></div>
                <div><strong>Destinataires:</strong> {selectedCampaign.total_recipients}</div>
                <div><strong>Envoyes:</strong> {selectedCampaign.sent_count}</div>
                <div><strong>Echecs:</strong> {selectedCampaign.failed_count}</div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button style={s.btnSm()} onClick={addProspects}>Ajouter tous les prospects</button>
              </div>
            </div>

            <div style={s.card}>
              <h4 style={{ marginTop: 0 }}>Destinataires ({recipients.length})</h4>
              {recipients.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "0.4rem 0", display: "flex", justifyContent: "space-between" }}>
                  <span>{r.name ? `${r.name} (${r.email})` : r.email}</span>
                  <span style={s.badge(r.status === "sent" ? "#34d399" : r.status === "failed" ? "#f87171" : "#94a3b8")}>{r.status}</span>
                </div>
              ))}
              {recipients.length === 0 && <p style={s.meta}>Aucun destinataire</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Email Page ──────────────────────────────────────────────────────────
export default function EmailPage() {
  const [tab, setTab] = useState("templates");

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Email Marketing</h1>
      <div style={s.tabs}>
        <button style={s.tab(tab === "templates")} onClick={() => setTab("templates")}>Templates</button>
        <button style={s.tab(tab === "campaigns")} onClick={() => setTab("campaigns")}>Campagnes</button>
      </div>
      {tab === "templates" && <TemplatesSection />}
      {tab === "campaigns" && <CampaignsSection />}
    </div>
  );
}
