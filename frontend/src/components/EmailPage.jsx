import React, { useState, useEffect } from "react";
import T from "../theme";
import Guide from "./Guide";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const STATUS_COLORS = {
  draft: { bg: "rgba(148,163,184,0.15)", fg: "#94a3b8" },
  sending: { bg: T.yellowSoft, fg: T.yellow },
  sent: { bg: T.greenSoft, fg: T.green },
  paused: { bg: T.orangeSoft, fg: T.orange },
};

// ── Templates ───────────────────────────────────────────────────────────────
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
    if (!form.name || !form.subject || !form.body_html) { setError("Remplissez le nom, le sujet et le corps HTML."); return; }
    try {
      const vars = form.variables.split(",").map((v) => v.trim()).filter(Boolean);
      const res = await fetch(`${API}/api/email/templates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, variables: vars }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur"); }
      setShowForm(false);
      setForm({ name: "", subject: "", body_html: "", body_text: "", variables: "", category: "" });
      setSuccess("Template cree !");
      loadTemplates();
    } catch (e) { setError(e.message); }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Supprimer ce template ?")) return;
    await fetch(`${API}/api/email/templates/${id}`, { method: "DELETE" });
    loadTemplates();
  };

  const labelStyle = { fontSize: "0.72rem", color: "#666", marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" };

  return (
    <div>
      <Guide
        title="Comment creer un template"
        defaultOpen={templates.length === 0}
        steps={[
          "Cliquez sur \"+ Nouveau\" pour creer un modele d'email",
          "Ecrivez le sujet. Utilisez {{first_name}} pour personnaliser",
          "Corps HTML : {{first_name}}, {{last_name}}, {{company}}, {{job_title}}, {{email}}",
          "Listez les variables separees par des virgules",
          "Le template sera utilise dans vos campagnes",
        ]}
      />

      {error && <div style={T.error}>{error}</div>}
      {success && <div style={T.success}>{success}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={T.sectionTitle}>Templates ({templates.length})</div>
        <button style={T.btn()} onClick={() => { setShowForm(true); setError(null); setSuccess(null); }}>+ Nouveau</button>
      </div>

      {showForm && (
        <div style={T.modal} onClick={() => setShowForm(false)}>
          <div style={T.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#fff" }}>Nouveau template</h3>
            <div style={{ marginBottom: "0.75rem" }}><label style={labelStyle}>Nom *</label><input style={T.input} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Email de presentation" /></div>
            <div style={{ marginBottom: "0.75rem" }}><label style={labelStyle}>Sujet *</label><input style={T.input} value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Bonjour {{first_name}}, je me permets..." /></div>
            <div style={{ marginBottom: "0.75rem" }}><label style={labelStyle}>Categorie</label><input style={T.input} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="intro, follow_up, proposal" /></div>
            <div style={{ marginBottom: "0.75rem" }}><label style={labelStyle}>Variables (virgules)</label><input style={T.input} value={form.variables} onChange={(e) => setForm((p) => ({ ...p, variables: e.target.value }))} placeholder="first_name, company" /></div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={labelStyle}>Corps HTML *</label>
              <textarea style={{ ...T.input, minHeight: 140, fontFamily: "monospace", fontSize: "0.82rem" }} value={form.body_html}
                onChange={(e) => setForm((p) => ({ ...p, body_html: e.target.value }))}
                placeholder={"<h2>Bonjour {{first_name}},</h2>\n<p>Je me permets de vous contacter car...</p>"} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button style={T.btn()} onClick={save}>Sauvegarder</button>
              <button style={T.btn("#333", "#aaa")} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {templates.length === 0 && <p style={T.meta}>Aucun template.</p>}
      {templates.map((t) => (
        <div key={t.id} style={{ ...T.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ color: "#ccc" }}>{t.name}</strong>{" "}
            {t.category && <span style={T.badge(T.accentSoft, "#888")}>{t.category}</span>}
            <div style={T.meta}>Sujet: {t.subject}</div>
            <div style={T.meta}>Variables: {(t.variables || []).join(", ") || "aucune"}</div>
          </div>
          <button style={T.btnSm("transparent", T.red)} onClick={() => deleteTemplate(t.id)}>&#x2715;</button>
        </div>
      ))}
    </div>
  );
}

// ── Campaigns ───────────────────────────────────────────────────────────────
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
    if (!ids.length) { setError("Aucun prospect avec email."); return; }
    try {
      await fetch(`${API}/api/email/campaigns/${selectedCampaign.id}/recipients`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect_ids: ids }),
      });
      setSuccess(`${ids.length} destinataire(s) ajoute(s)`);
      viewCampaign(selectedCampaign.id);
    } catch { setError("Erreur lors de l'ajout."); }
  };

  const sendCampaign = async () => {
    if (!window.confirm("Envoyer cette campagne ?")) return;
    setError(null); setSuccess(null);
    try {
      const res = await fetch(`${API}/api/email/campaigns/${selectedCampaign.id}/send`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur"); }
      setSuccess("Campagne envoyee !");
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

  const labelStyle = { fontSize: "0.72rem", color: "#666", marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" };

  return (
    <div>
      <Guide
        title="Comment lancer une campagne"
        defaultOpen={campaigns.length === 0}
        steps={[
          "Creez d'abord un template dans l'onglet Templates",
          "Ajoutez des prospects avec emails dans le CRM",
          "Cliquez \"+ Nouvelle\" et selectionnez un template",
          "Renseignez vos identifiants SMTP (Gmail : smtp.gmail.com, port 587)",
          "Gmail : activez 2FA puis creez un mot de passe d'application",
          "Ajoutez les destinataires puis cliquez \"Envoyer\"",
        ]}
      />

      {error && <div style={T.error}>{error}</div>}
      {success && <div style={T.success}>{success}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={T.sectionTitle}>Campagnes ({campaigns.length})</div>
        <button style={T.btn()} onClick={() => { setShowForm(true); setError(null); setSuccess(null); }}>+ Nouvelle</button>
      </div>

      {showForm && (
        <div style={T.modal} onClick={() => setShowForm(false)}>
          <div style={T.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: "#fff" }}>Nouvelle campagne</h3>
            <div style={T.grid2}>
              <div><label style={labelStyle}>Nom *</label><input style={T.input} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Campagne Janvier" /></div>
              <div>
                <label style={labelStyle}>Template *</label>
                <select style={{ ...T.select, width: "100%" }} value={form.template_id} onChange={(e) => setForm((p) => ({ ...p, template_id: e.target.value }))}>
                  <option value="">Choisir...</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div style={T.grid2}>
              <div><label style={labelStyle}>SMTP Host</label><input style={T.input} value={form.smtp_host} onChange={(e) => setForm((p) => ({ ...p, smtp_host: e.target.value }))} /></div>
              <div><label style={labelStyle}>SMTP Port</label><input type="number" style={T.input} value={form.smtp_port} onChange={(e) => setForm((p) => ({ ...p, smtp_port: parseInt(e.target.value) || 587 }))} /></div>
            </div>
            <div style={T.grid2}>
              <div><label style={labelStyle}>Email SMTP</label><input style={T.input} value={form.smtp_user} onChange={(e) => setForm((p) => ({ ...p, smtp_user: e.target.value }))} placeholder="votre.email@gmail.com" /></div>
              <div><label style={labelStyle}>Mot de passe app</label><input type="password" style={T.input} value={form.smtp_password} onChange={(e) => setForm((p) => ({ ...p, smtp_password: e.target.value }))} /></div>
            </div>
            <div style={T.grid2}>
              <div><label style={labelStyle}>Nom expediteur</label><input style={T.input} value={form.from_name} onChange={(e) => setForm((p) => ({ ...p, from_name: e.target.value }))} placeholder="Jean Dupont" /></div>
              <div><label style={labelStyle}>Email expediteur</label><input style={T.input} value={form.from_email} onChange={(e) => setForm((p) => ({ ...p, from_email: e.target.value }))} placeholder="jean@entreprise.fr" /></div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button style={T.btn()} onClick={createCampaign}>Creer</button>
              <button style={T.btn("#333", "#aaa")} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selectedCampaign ? "1fr 1fr" : "1fr", gap: "1rem" }}>
        <div>
          {campaigns.length === 0 && <p style={T.meta}>Aucune campagne.</p>}
          {campaigns.map((c) => {
            const sc = STATUS_COLORS[c.status] || STATUS_COLORS.draft;
            return (
              <div key={c.id}
                style={{ ...T.card, cursor: "pointer", borderColor: selectedCampaign?.id === c.id ? "#444" : "#2a2a2a" }}
                onClick={() => { viewCampaign(c.id); setError(null); setSuccess(null); }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "#ccc" }}>{c.name}</strong>
                  <span style={T.badge(sc.bg, sc.fg)}>{c.status}</span>
                </div>
                <div style={T.meta}>{c.total_recipients} destinataire(s) | {c.sent_count} envoye(s) | {c.failed_count} echec(s)</div>
              </div>
            );
          })}
        </div>

        {selectedCampaign && (
          <div>
            <div style={T.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1rem" }}>{selectedCampaign.name}</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {selectedCampaign.status === "draft" && recipients.length > 0 && (
                    <button style={T.btnSm(T.green, "#fff")} onClick={sendCampaign}>Envoyer</button>
                  )}
                  <button style={T.btnSm("transparent", T.red)} onClick={() => deleteCampaign(selectedCampaign.id)}>&#x2715;</button>
                </div>
              </div>
              <div style={{ ...T.grid2, marginTop: "1rem" }}>
                <div><span style={{ color: "#555" }}>Status:</span> <span style={T.badge(STATUS_COLORS[selectedCampaign.status]?.bg, STATUS_COLORS[selectedCampaign.status]?.fg)}>{selectedCampaign.status}</span></div>
                <div><span style={{ color: "#555" }}>Destinataires:</span> {selectedCampaign.total_recipients}</div>
                <div><span style={{ color: "#555" }}>Envoyes:</span> {selectedCampaign.sent_count}</div>
                <div><span style={{ color: "#555" }}>Echecs:</span> {selectedCampaign.failed_count}</div>
              </div>
              {selectedCampaign.status === "draft" && (
                <div style={{ marginTop: "0.75rem" }}>
                  <button style={T.btnOutline("#888")} onClick={addProspects}>
                    Ajouter tous les prospects ({prospects.filter((p) => p.email).length})
                  </button>
                </div>
              )}
            </div>

            <div style={T.card}>
              <div style={T.sectionTitle}>Destinataires ({recipients.length})</div>
              {recipients.map((r) => {
                const rsc = r.status === "sent" ? { bg: T.greenSoft, fg: T.green } : r.status === "failed" ? { bg: T.redSoft, fg: T.red } : { bg: T.accentSoft, fg: "#888" };
                return (
                  <div key={r.id} style={{ borderBottom: "1px solid #1e1e1e", padding: "0.4rem 0", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aaa" }}>{r.name ? `${r.name} (${r.email})` : r.email}</span>
                    <span style={T.badge(rsc.bg, rsc.fg)}>{r.status}</span>
                  </div>
                );
              })}
              {recipients.length === 0 && <p style={T.meta}>Aucun destinataire.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function EmailPage() {
  const [tab, setTab] = useState("templates");

  return (
    <div>
      <h1 style={T.pageTitle}>Email Marketing</h1>
      <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "1.5rem" }}>Templates et campagnes</p>
      <div style={T.tabs}>
        <button style={T.tab(tab === "templates")} onClick={() => setTab("templates")}>Templates</button>
        <button style={T.tab(tab === "campaigns")} onClick={() => setTab("campaigns")}>Campagnes</button>
      </div>
      {tab === "templates" && <TemplatesSection />}
      {tab === "campaigns" && <CampaignsSection />}
    </div>
  );
}
