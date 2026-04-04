import React, { useState, useEffect } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const s = {
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "1.5rem", marginBottom: "1.5rem" },
  form: { display: "flex", gap: "0.75rem" },
  input: { flex: 1, padding: "0.75rem 1rem", fontSize: "1rem", border: "1px solid #ddd", borderRadius: 8, outline: "none" },
  btn: (color = "#4361ee") => ({ padding: "0.75rem 1.5rem", fontSize: "0.95rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 8, cursor: "pointer" }),
  btnSm: (color = "#4361ee") => ({ padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 6, cursor: "pointer" }),
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  tag: (color = "#4361ee") => ({ display: "inline-block", background: color + "15", color, padding: "0.2rem 0.5rem", borderRadius: 6, margin: "0.15rem", fontSize: "0.8rem", wordBreak: "break-all" }),
  section: { marginTop: "1rem" },
  sectionTitle: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "#4361ee" },
  error: { background: "#fef2f2", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: 8, marginTop: "0.75rem", fontSize: "0.9rem" },
  success: { background: "#f0fdf4", color: "#16a34a", padding: "0.75rem 1rem", borderRadius: 8, marginTop: "0.75rem", fontSize: "0.9rem" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  tab: (active) => ({ padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", background: active ? "#4361ee" : "#e8e8e8", color: active ? "#fff" : "#333", border: "none" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  link: { display: "block", color: "#4361ee", fontSize: "0.8rem", wordBreak: "break-all", marginBottom: "0.2rem", textDecoration: "none" },
  meta: { fontSize: "0.8rem", color: "#888" },
  guide: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" },
  guideTitle: { fontSize: "1rem", fontWeight: 700, color: "#1e40af", marginBottom: "0.75rem" },
  guideStep: { display: "flex", gap: "0.75rem", marginBottom: "0.6rem", fontSize: "0.9rem", color: "#1e3a5f" },
  guideNumber: { background: "#4361ee", color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 },
  guideToggle: { background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, padding: 0 },
};

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

function ResultDetail({ result, onImportCRM }) {
  const [tab, setTab] = useState("overview");
  const [importMsg, setImportMsg] = useState(null);
  if (!result) return null;

  const handleImport = async () => {
    try {
      const res = await fetch(`${API}/api/crm/import-scrape`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrape_id: result.id, default_stage: "lead", default_source: "scraping", tags: ["scraping"] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur");
      setImportMsg(`${Array.isArray(data) ? data.length : 1} prospect(s) importe(s) dans le CRM !`);
      if (onImportCRM) onImportCRM();
    } catch (e) { setImportMsg("Erreur: " + e.message); }
  };

  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h3 style={{ margin: 0 }}>{result.title || "Sans titre"}</h3>
          <p style={{ ...s.meta, margin: "0.25rem 0" }}>{result.url}</p>
        </div>
        <button style={s.btnSm("#10b981")} onClick={handleImport}>Importer dans CRM</button>
      </div>
      {importMsg && <div style={{ ...s.success, marginTop: "0.5rem", marginBottom: "0.5rem" }}>{importMsg}</div>}
      <div style={{ ...s.meta, marginBottom: "0.75rem" }}>
        Status: {result.status_code} | {result.response_time}s | {result.word_count} mots | Langue: {result.language || "?"}
      </div>

      <div style={s.tabs}>
        {["overview", "emails", "social", "tech", "links", "meta"].map((t) => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={s.grid2}>
          <div><strong>Domaine:</strong> {result.domain}</div>
          <div><strong>Emails:</strong> {result.extracted_emails.length}</div>
          <div><strong>Telephones:</strong> {result.extracted_phones.length}</div>
          <div><strong>Liens internes:</strong> {result.internal_links.length}</div>
          <div><strong>Liens externes:</strong> {result.external_links.length}</div>
          <div><strong>Images:</strong> {(result.images || []).length}</div>
          <div><strong>Technologies:</strong> {result.technologies.length}</div>
          <div><strong>Reseaux sociaux:</strong> {Object.keys(result.social_media || {}).length}</div>
          {result.meta_description && (
            <div style={{ gridColumn: "1/3" }}><strong>Description:</strong> {result.meta_description}</div>
          )}
        </div>
      )}

      {tab === "emails" && (
        <div>
          {result.extracted_emails.length === 0 && <p style={s.meta}>Aucun email trouve sur cette page</p>}
          {result.extracted_emails.map((e, i) => <span key={i} style={s.tag("#4361ee")}>{e}</span>)}
          {result.extracted_phones.length > 0 && (
            <div style={s.section}>
              <div style={s.sectionTitle}>Telephones</div>
              {result.extracted_phones.map((p, i) => <span key={i} style={s.tag("#10b981")}>{p}</span>)}
            </div>
          )}
        </div>
      )}

      {tab === "social" && (
        <div>
          {Object.keys(result.social_media || {}).length === 0 && <p style={s.meta}>Aucun reseau social detecte</p>}
          {Object.entries(result.social_media || {}).map(([platform, url]) => (
            <div key={platform} style={{ marginBottom: "0.5rem" }}>
              <strong style={{ textTransform: "capitalize" }}>{platform}:</strong>{" "}
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#4361ee" }}>{url}</a>
            </div>
          ))}
        </div>
      )}

      {tab === "tech" && (
        <div>
          {result.technologies.length === 0 && <p style={s.meta}>Aucune technologie detectee</p>}
          {result.technologies.map((t, i) => <span key={i} style={s.tag("#8b5cf6")}>{t}</span>)}
        </div>
      )}

      {tab === "links" && (
        <div style={s.grid2}>
          <div>
            <div style={s.sectionTitle}>Internes ({result.internal_links.length})</div>
            {result.internal_links.slice(0, 15).map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={s.link}>{l}</a>
            ))}
            {result.internal_links.length > 15 && <p style={s.meta}>... et {result.internal_links.length - 15} autres</p>}
          </div>
          <div>
            <div style={s.sectionTitle}>Externes ({result.external_links.length})</div>
            {result.external_links.slice(0, 15).map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={s.link}>{l}</a>
            ))}
            {result.external_links.length > 15 && <p style={s.meta}>... et {result.external_links.length - 15} autres</p>}
          </div>
        </div>
      )}

      {tab === "meta" && (
        <div>
          {result.meta_description && <div style={{ marginBottom: "0.5rem" }}><strong>Description:</strong> {result.meta_description}</div>}
          {(result.meta_keywords || []).length > 0 && (
            <div style={s.section}>
              <strong>Keywords:</strong>{" "}
              {result.meta_keywords.map((k, i) => <span key={i} style={s.tag("#f59e0b")}>{k}</span>)}
            </div>
          )}
          {Object.keys(result.og_data || {}).length > 0 && (
            <div style={s.section}>
              <div style={s.sectionTitle}>OpenGraph</div>
              {Object.entries(result.og_data).map(([k, v]) => (
                <div key={k}><strong>{k}:</strong> {v}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScrapingPage() {
  const [url, setUrl] = useState("");
  const [batchUrls, setBatchUrls] = useState("");
  const [mode, setMode] = useState("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/scraping/`)
      .then((r) => { if (!r.ok) throw new Error("Erreur serveur"); return r.json(); })
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError(null); setResult(null); setSuccess(null);
    try {
      const res = await fetch(`${API}/api/scraping/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur lors du scraping");
      setResult(data);
      setHistory((p) => [data, ...p]);
      setSelectedId(data.id);
      setUrl("");
      setSuccess(`Scraping termine ! ${data.extracted_emails.length} emails, ${data.extracted_phones.length} telephones, ${(data.extracted_links || []).length} liens trouves.`);
    } catch (err) {
      setError(err.message || "Impossible de contacter le serveur. Verifiez que le backend tourne.");
    }
    finally { setLoading(false); }
  };

  const handleBatch = async (e) => {
    e.preventDefault();
    const urls = batchUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setLoading(true); setError(null); setResult(null); setSuccess(null);
    try {
      const res = await fetch(`${API}/api/scraping/batch`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, name: `Batch ${urls.length} URLs` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur batch");
      setSuccess(`Batch termine ! ${data.completed_urls} reussis, ${data.failed_urls} echecs sur ${data.total_urls} URLs.`);
      setBatchUrls("");
      const updated = await fetch(`${API}/api/scraping/`).then((r) => r.json());
      setHistory(updated);
    } catch (err) {
      setError(err.message || "Erreur lors du batch scraping.");
    }
    finally { setLoading(false); }
  };

  const handleExport = () => { window.open(`${API}/api/scraping/export`, "_blank"); };

  const viewDetail = async (id) => {
    try {
      const res = await fetch(`${API}/api/scraping/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data); setSelectedId(id);
    } catch { setError("Impossible de charger ce resultat."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce resultat ?")) return;
    try {
      await fetch(`${API}/api/scraping/${id}`, { method: "DELETE" });
      setHistory((p) => p.filter((h) => h.id !== id));
      if (selectedId === id) { setResult(null); setSelectedId(null); }
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Scraping</h1>
        <button style={s.btnSm("#10b981")} onClick={handleExport}>Exporter CSV</button>
      </div>

      <Guide
        title="Comment utiliser le Scraping ?"
        defaultOpen={history.length === 0}
        steps={[
          "Collez l'URL d'un site web dans le champ ci-dessous (ex: https://www.entreprise.fr)",
          "Cliquez sur \"Scraper\" et attendez quelques secondes",
          "Les resultats s'affichent : emails, telephones, liens, reseaux sociaux et technologies detectees",
          "Utilisez les onglets (overview, emails, social, tech, links, meta) pour explorer les donnees",
          "Mode Batch : collez plusieurs URLs (une par ligne) pour scraper plusieurs sites d'un coup",
          "Cliquez sur \"Exporter CSV\" pour telecharger tous vos resultats",
          "Note : certains sites (Doctolib, etc.) bloquent le scraping automatique. Essayez avec des sites publics d'entreprises.",
        ]}
      />

      <div style={s.card}>
        <div style={s.tabs}>
          <button style={s.tab(mode === "single")} onClick={() => setMode("single")}>URL unique</button>
          <button style={s.tab(mode === "batch")} onClick={() => setMode("batch")}>Batch (plusieurs URLs)</button>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleScrape} style={s.form}>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.entreprise.fr" required style={s.input} />
            <button type="submit" disabled={loading} style={{ ...s.btn(), ...(loading ? s.btnDisabled : {}) }}>
              {loading ? "Scraping en cours..." : "Scraper"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBatch}>
            <textarea
              value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)}
              placeholder={"https://www.site1.fr\nhttps://www.site2.com\nhttps://www.site3.fr"}
              rows={5} style={{ ...s.input, width: "100%", resize: "vertical", marginBottom: "0.75rem", flex: "none" }}
            />
            <button type="submit" disabled={loading} style={{ ...s.btn(), ...(loading ? s.btnDisabled : {}) }}>
              {loading ? "Scraping en cours..." : "Scraper tout"}
            </button>
          </form>
        )}
        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}
      </div>

      {result && <ResultDetail result={result} />}

      <div style={s.card}>
        <h3 style={{ marginTop: 0 }}>Historique ({history.length})</h3>
        {historyLoading && <p style={s.meta}>Chargement...</p>}
        {!historyLoading && history.length === 0 && <p style={s.meta}>Aucun scraping effectue. Essayez avec une URL ci-dessus !</p>}
        {history.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "0.5rem" }}>Titre</th>
                <th>Domaine</th>
                <th>Emails</th>
                <th>Tel.</th>
                <th>Tech</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer", background: selectedId === item.id ? "#f0f4ff" : "transparent" }}
                  onClick={() => viewDetail(item.id)}>
                  <td style={{ padding: "0.5rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || "Sans titre"}</td>
                  <td>{item.domain}</td>
                  <td><strong>{(item.extracted_emails || []).length}</strong></td>
                  <td>{(item.extracted_phones || []).length}</td>
                  <td style={s.meta}>{(item.technologies || []).slice(0, 2).join(", ") || "-"}</td>
                  <td style={s.meta}>{new Date(item.created_at).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <button style={s.btnSm("#f87171")} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>X</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
