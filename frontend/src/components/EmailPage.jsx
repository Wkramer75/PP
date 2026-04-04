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
  error: { background: "#fef2f2", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  success: { background: "#f0fdf4", color: "#16a34a", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#fff", borderRadius: 12, padding: "2rem", maxWidth: 700, width: "90%", maxHeight: "85vh", overflowY: "auto" },
  guide: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" },
  guideTitle: { fontSize: "1rem", fontWeight: 700, color: "#1e40af", marginBottom: "0.75rem" },
  guideStep: { display: "flex", gap: "0.75rem", marginBottom: "0.6rem", fontSize: "0.9rem", color: "#1e3a5f" },
  guideNumber: { background: "#4361ee", color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 },
  guideToggle: { background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, padding: 0 },
};

const STATUS_COLORS = { draft: "#94a3b8", sending: "#fbbf24", sent: "#34d399", paused: "#fb923c" };

function Guide({ title, steps, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={s.guide}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={s.guideTitle}>{title}</div>
        <button style={s.guideToggle} onClick={() => setOpen(!open)}>{open ? "Masquer" : "Voir le guide"}</button>
      </div>
      {open && (
        <div style={{ marginTop: "0.5rem" }}>
          {steps.map((step, i) => (
            <div key={i} style={s.guideStep}>
              <div style={s.guideNumber}>{i + 1}</div>
              <div>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Templates Section ────────────────────────────────────────────────────────
function TemplatesSection() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({ name: "", subject: "", body_html: "", body_text: "", variables: "", category: "" });

  const loadTemplates = () => {
    fetch(`${API}/api/email/templates`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setTemplates)
      .catch(() => setError("Impossible de charger les templates."));
  };

  useEffect(() => { loadTemplates(); }, []);

  const save = async () => {
    setError(null); setSuccess(null);
    if (!form.name || !form.subject || !form.body_html) {
      setError("Remplissez au moins le nom, le sujet et le corps HTML."); return;
    }
    try {
      const vars = form.variables.split(",").map((v) => v.trim()).filter(Boolean);
      const res = await fetch(`${API}/api/email/templates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, variables: vars }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur"); }
      setShowForm(false);
      setForm({ name: "", subject: "", body_html: "", body_text: "", variables: "", category: "" });
      setSuccess("Template cree avec succes !");
      loadTemplates();
    } catch (e) { setError(e.message); }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Supprimer ce template ?")) return;
    await fetch(`${API}/api/email/templates/${id}`, { method: "DELETE" });
    loadTemplates();
  };

  return (
    <div>
      <Guide
        title="Comment creer un template email ?"
        defaultOpen={templates.length === 0}
        steps={[
          "Cliquez sur \"+ Nouveau template\" pour creer un modele d'email",
          "Donnez un nom au template (ex: \"Email de presentation\")",
          "Ecrivez le sujet de l'email. Utilisez {{first_name}} pour personnaliser",
          "Redigez le corps en HTML. Variables disponibles : {{first_name}}, {{last_name}}, {{company}}, {{job_title}}, {{email}}",
          "Listez les variables utilisees, separees par des virgules (ex: first_name, company)",
          "Choisissez une categorie : intro, follow_up, proposal, etc.",
          "Le template sera utilise ensuite dans vos campagnes email",
        ]}
      />

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>Templates Email ({templates.length})</h3>
        <button style={s.btn()} onClick={() => { setShowForm(true); setError(null); setSuccess(null); }}>+ Nouveau template</button>
      </div>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nouveau template</h3>
            <div style={{ marginBottom: "0.75rem" }}><label>Nom *</label><input style={s.input} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Email de presentation" /></div>
            <div style={{ marginBottom: "0.75rem" }}><label>Sujet *</label><input style={s.input} value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Bonjour {{first_name}}, je me permets..." /></div>
            <div style={{ marginBottom: "0.75rem" }}><label>Categorie</label><input style={s.input} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="intro, follow_up, proposal" /></div>
            <div style={{ marginBottom: "0.75rem" }}><label>Variables (separees par des virgules)</label><input style={s.input} value={form.variables} onChange={(e) => setForm((p) => ({ ...p, variables: e.target.value }))} placeholder="first_name, company, job_title" /></div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label>Corps HTML *</label>
              <textarea style={{ ...s.input, minHeight: 150, fontFamily: "monospace", fontSize: "0.85rem" }} value={form.body_html}
                onChange={(e) => setForm((p) => ({ ...p, body_html: e.target.value }))}
                placeholder={"<h2>Bonjour {{first_name}},</h2>\n<p>Je suis [votre nom] de [votre entreprise].</p>\n<p>Je me permets de vous contacter car...</p>\n<p>Cordialement</p>"} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button style={s.btn()} onClick={save}>Sauvegarder</button>
              <button style={s.btn("#94a3b8")} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {templates.length === 0 && <p style={s.meta}>Aucun template. Creez-en un pour commencer vos campagnes.</p>}
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    name: "", template_id: "", smtp_host: "smtp.gmail.com", smtp_port: 587,
    smtp_user: "", smtp_password: "", from_name: "", from_email: "",
  });

  useEffect(() => {
    fetch(`${API}/api/email/campaigns`).then((r) => r.ok ? r.json() : []).then(setCampaigns).catch(() => {});
    fetch(`${API}/api/email/templates`).then((r) => r.ok ? r.json() : []).then(setTemplates).catch(() => {});
    fetch(`${API}/api/crm/prospects?limit=200`).then((r) => r.ok ? r.json() : []).then(setProspects).catch(() => {});
  }, []);

  const createCampaign = async () => {
    setError(null); setSuccess(null);
    if (!form.name || !form.template_id) { setError("Remplissez le nom et choisissez un template."); return; }
    try {
      const res = await fetch(`${API}/api/email/campaigns`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, template_id: parseInt(form.template_id) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur"); }
      setShowForm(false); setSuccess("Campagne creee !");
      const updated = await fetch(`${API}/api/email/campaigns`).then((r) => r.json());
      setCampaigns(updated);
    } catch (e) { setError(e.message); }
  };

  const viewCampaign = async (id) => {
    try {
      const camp = await fetch(`${API}/api/email/campaigns/${id}`).then((r) => r.json());
      setSelectedCampaign(camp);
      const recs = await fetch(`${API}/api/email/campaigns/${id}/recipients`).then((r) => r.json());
      setRecipients(recs);
    } catch { setError("Impossible de charger la campagne."); }
  };

  const addProspects = async () => {
    const ids = prospects.filter((p) => p.email).map((p) => p.id);
    if (!ids.length) { setError("Aucun prospect avec email. Ajoutez d'abord des prospects dans le CRM."); return; }
    try {
      await fetch(`${API}/api/email/campaigns/${selectedCampaign.id}/recipients`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: ids }),
      });
      setSuccess(`${ids.length} prospect(s) ajoute(s) comme destinataires.`);
      viewCampaign(selectedCampaign.id);
    } catch { setError("Erreur lors de l'ajout des destinataires."); }
  };

  const sendCampaign = async () => {
    if (!window.confirm("Envoyer cette campagne maintenant ? Tous les destinataires en attente recevront l'email.")) return;
    setError(null); setSuccess(null);
    try {
      const res = await fetch(`${API}/api/email/campaigns/${selectedCampaign.id}/send`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur d'envoi"); }
      setSuccess("Campagne envoyee avec succes !");
      viewCampaign(selectedCampaign.id);
      const updated = await fetch(`${API}/api/email/campaigns`).then((r) => r.json());
      setCampaigns(updated);
    } catch (e) { setError(e.message); }
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
      <Guide
        title="Comment lancer une campagne email ?"
        defaultOpen={campaigns.length === 0}
        steps={[
          "D'abord, creez un template dans l'onglet \"Templates\" (si pas deja fait)",
          "Ensuite, ajoutez des prospects dans le CRM avec leurs emails",
          "Cliquez sur \"+ Nouvelle campagne\" et donnez-lui un nom",
          "Selectionnez le template a utiliser",
          "Renseignez vos identifiants SMTP (Gmail : smtp.gmail.com, port 587, votre email et mot de passe d'application)",
          "Pour Gmail : activez l'authentification 2 facteurs puis creez un \"mot de passe d'application\" dans les parametres Google",
          "Une fois la campagne creee, cliquez dessus puis \"Ajouter tous les prospects\"",
          "Verifiez les destinataires, puis cliquez sur \"Envoyer\"",
        ]}
      />

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>Campagnes ({campaigns.length})</h3>
        <button style={s.btn()} onClick={() => { setShowForm(true); setError(null); setSuccess(null); }}>+ Nouvelle campagne</button>
      </div>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nouvelle campagne</h3>
            <div style={s.grid2}>
              <div><label>Nom *</label><input style={s.input} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Campagne Janvier 2026" /></div>
              <div>
                <label>Template *</label>
                <select style={{ ...s.input }} value={form.template_id} onChange={(e) => setForm((p) => ({ ...p, template_id: e.target.value }))}>
                  <option value="">Choisir un template...</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div style={s.grid2}>
              <div><label>SMTP Host</label><input style={s.input} value={form.smtp_host} onChange={(e) => setForm((p) => ({ ...p, smtp_host: e.target.value }))} /></div>
              <div><label>SMTP Port</label><input type="number" style={s.input} value={form.smtp_port} onChange={(e) => setForm((p) => ({ ...p, smtp_port: parseInt(e.target.value) || 587 }))} /></div>
            </div>
            <div style={s.grid2}>
              <div><label>Email SMTP (votre email)</label><input style={s.input} value={form.smtp_user} onChange={(e) => setForm((p) => ({ ...p, smtp_user: e.target.value }))} placeholder="votre.email@gmail.com" /></div>
              <div><label>Mot de passe d'application</label><input type="password" style={s.input} value={form.smtp_password} onChange={(e) => setForm((p) => ({ ...p, smtp_password: e.target.value }))} /></div>
            </div>
            <div style={s.grid2}>
              <div><label>Nom expediteur</label><input style={s.input} value={form.from_name} onChange={(e) => setForm((p) => ({ ...p, from_name: e.target.value }))} placeholder="Jean Dupont" /></div>
              <div><label>Email expediteur</label><input style={s.input} value={form.from_email} onChange={(e) => setForm((p) => ({ ...p, from_email: e.target.value }))} placeholder="jean@entreprise.fr" /></div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button style={s.btn()} onClick={createCampaign}>Creer la campagne</button>
              <button style={s.btn("#94a3b8")} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selectedCampaign ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
        <div>
          {campaigns.length === 0 && <p style={s.meta}>Aucune campagne. Creez un template d'abord, puis une campagne.</p>}
          {campaigns.map((c) => (
            <div key={c.id} style={{ ...s.card, cursor: "pointer", border: selectedCampaign?.id === c.id ? "2px solid #4361ee" : "2px solid transparent" }}
              onClick={() => { viewCampaign(c.id); setError(null); setSuccess(null); }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{c.name}</strong>
                <span style={s.badge(STATUS_COLORS[c.status] || "#94a3b8")}>{c.status}</span>
              </div>
              <div style={s.meta}>{c.total_recipients} destinataire(s) | {c.sent_count} envoye(s) | {c.failed_count} echec(s)</div>
            </div>
          ))}
        </div>

        {selectedCampaign && (
          <div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <h3 style={{ margin: 0 }}>{selectedCampaign.name}</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {selectedCampaign.status === "draft" && recipients.length > 0 && (
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

              {selectedCampaign.status === "draft" && (
                <div style={{ marginTop: "1rem" }}>
                  <button style={s.btnSm()} onClick={addProspects}>
                    Ajouter tous les prospects ({prospects.filter((p) => p.email).length} avec email)
                  </button>
                </div>
              )}
            </div>

            <div style={s.card}>
              <h4 style={{ marginTop: 0 }}>Destinataires ({recipients.length})</h4>
              {recipients.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "0.4rem 0", display: "flex", justifyContent: "space-between" }}>
                  <span>{r.name ? `${r.name} (${r.email})` : r.email}</span>
                  <span style={s.badge(r.status === "sent" ? "#34d399" : r.status === "failed" ? "#f87171" : "#94a3b8")}>{r.status}</span>
                </div>
              ))}
              {recipients.length === 0 && <p style={s.meta}>Aucun destinataire. Cliquez sur "Ajouter tous les prospects" ci-dessus.</p>}
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
