import React, { useState, useEffect } from "react";
import T from "../theme";
import Guide from "./Guide";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

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
    <div style={T.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h3 style={{ margin: 0, color: "#fff", fontSize: "1rem" }}>{result.title || "Sans titre"}</h3>
          <p style={{ ...T.meta, margin: "0.25rem 0" }}>{result.url}</p>
        </div>
        <button style={T.btnSm(T.green, "#fff")} onClick={handleImport}>Importer CRM</button>
      </div>
      {importMsg && <div style={{ ...T.success, marginTop: "0.5rem" }}>{importMsg}</div>}
      <div style={{ ...T.meta, marginBottom: "0.75rem", marginTop: "0.5rem" }}>
        Status: {result.status_code} | {result.response_time}s | {result.word_count} mots | Langue: {result.language || "?"}
      </div>

      <div style={T.tabs}>
        {["overview", "emails", "social", "tech", "links", "meta"].map((t) => (
          <button key={t} style={T.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={T.grid2}>
          <div><span style={{ color: "#666" }}>Domaine:</span> {result.domain}</div>
          <div><span style={{ color: "#666" }}>Emails:</span> {result.extracted_emails.length}</div>
          <div><span style={{ color: "#666" }}>Telephones:</span> {result.extracted_phones.length}</div>
          <div><span style={{ color: "#666" }}>Liens internes:</span> {result.internal_links.length}</div>
          <div><span style={{ color: "#666" }}>Liens externes:</span> {result.external_links.length}</div>
          <div><span style={{ color: "#666" }}>Images:</span> {(result.images || []).length}</div>
          <div><span style={{ color: "#666" }}>Technologies:</span> {result.technologies.length}</div>
          <div><span style={{ color: "#666" }}>Reseaux sociaux:</span> {Object.keys(result.social_media || {}).length}</div>
          {result.meta_description && (
            <div style={{ gridColumn: "1/3" }}><span style={{ color: "#666" }}>Description:</span> {result.meta_description}</div>
          )}
        </div>
      )}

      {tab === "emails" && (
        <div>
          {result.extracted_emails.length === 0 && <p style={T.meta}>Aucun email trouve</p>}
          {result.extracted_emails.map((e, i) => <span key={i} style={T.tag(T.green)}>{e}</span>)}
          {result.extracted_phones.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={T.sectionTitle}>Telephones</div>
              {result.extracted_phones.map((p, i) => <span key={i} style={T.tag(T.blue)}>{p}</span>)}
            </div>
          )}
        </div>
      )}

      {tab === "social" && (
        <div>
          {Object.keys(result.social_media || {}).length === 0 && <p style={T.meta}>Aucun reseau social detecte</p>}
          {Object.entries(result.social_media || {}).map(([platform, url]) => (
            <div key={platform} style={{ marginBottom: "0.5rem" }}>
              <strong style={{ textTransform: "capitalize", color: "#aaa" }}>{platform}:</strong>{" "}
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>{url}</a>
            </div>
          ))}
        </div>
      )}

      {tab === "tech" && (
        <div>
          {result.technologies.length === 0 && <p style={T.meta}>Aucune technologie detectee</p>}
          {result.technologies.map((t, i) => <span key={i} style={T.tag(T.purple)}>{t}</span>)}
        </div>
      )}

      {tab === "links" && (
        <div style={T.grid2}>
          <div>
            <div style={T.sectionTitle}>Internes ({result.internal_links.length})</div>
            {result.internal_links.slice(0, 15).map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={T.link}>{l}</a>
            ))}
            {result.internal_links.length > 15 && <p style={T.meta}>... et {result.internal_links.length - 15} autres</p>}
          </div>
          <div>
            <div style={T.sectionTitle}>Externes ({result.external_links.length})</div>
            {result.external_links.slice(0, 15).map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={T.link}>{l}</a>
            ))}
            {result.external_links.length > 15 && <p style={T.meta}>... et {result.external_links.length - 15} autres</p>}
          </div>
        </div>
      )}

      {tab === "meta" && (
        <div>
          {result.meta_description && <div style={{ marginBottom: "0.5rem" }}><span style={{ color: "#666" }}>Description:</span> {result.meta_description}</div>}
          {(result.meta_keywords || []).length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <span style={{ color: "#666" }}>Keywords:</span>{" "}
              {result.meta_keywords.map((k, i) => <span key={i} style={T.tag(T.yellow)}>{k}</span>)}
            </div>
          )}
          {Object.keys(result.og_data || {}).length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={T.sectionTitle}>OpenGraph</div>
              {Object.entries(result.og_data).map(([k, v]) => (
                <div key={k}><span style={{ color: "#666" }}>{k}:</span> {v}</div>
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
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
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
      setSuccess(`${data.extracted_emails.length} emails, ${data.extracted_phones.length} telephones, ${(data.extracted_links || []).length} liens`);
    } catch (err) {
      setError(err.message || "Impossible de contacter le serveur.");
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
      setSuccess(`Batch termine : ${data.completed_urls} reussis, ${data.failed_urls} echecs sur ${data.total_urls} URLs`);
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
        <div>
          <h1 style={T.pageTitle}>Scraping</h1>
          <p style={{ color: "#555", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>Selenium headless Chrome</p>
        </div>
        <button style={T.btnOutline("#666")} onClick={handleExport}>Exporter CSV</button>
      </div>

      <Guide
        title="Comment utiliser le scraping"
        defaultOpen={history.length === 0}
        steps={[
          "Collez l'URL d'un site web dans le champ ci-dessous",
          "Cliquez sur \"Scraper\" et attendez quelques secondes",
          "Explorez les resultats : emails, telephones, reseaux sociaux, technologies",
          "Mode Batch : collez plusieurs URLs (une par ligne)",
          "Le moteur Selenium charge les sites JavaScript (SPA, Doctolib, etc.)",
          "Prerequis : Google Chrome doit etre installe sur votre PC",
        ]}
      />

      <div style={T.card}>
        <div style={T.tabs}>
          <button style={T.tab(mode === "single")} onClick={() => setMode("single")}>URL unique</button>
          <button style={T.tab(mode === "batch")} onClick={() => setMode("batch")}>Batch</button>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleScrape} style={{ display: "flex", gap: "0.75rem" }}>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.entreprise.fr" required
              style={{ ...T.input, flex: 1 }} />
            <button type="submit" disabled={loading} style={{ ...T.btn(), ...(loading ? T.btnDisabled : {}) }}>
              {loading ? "Scraping..." : "Scraper"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBatch}>
            <textarea
              value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)}
              placeholder={"https://www.site1.fr\nhttps://www.site2.com\nhttps://www.site3.fr"}
              rows={4} style={{ ...T.input, resize: "vertical", marginBottom: "0.75rem", flex: "none" }}
            />
            <button type="submit" disabled={loading} style={{ ...T.btn(), ...(loading ? T.btnDisabled : {}) }}>
              {loading ? "Scraping..." : "Scraper tout"}
            </button>
          </form>
        )}
        {error && <div style={{ ...T.error, marginTop: "0.75rem" }}>{error}</div>}
        {success && <div style={{ ...T.success, marginTop: "0.75rem" }}>{success}</div>}
      </div>

      {result && <ResultDetail result={result} />}

      <div style={T.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={T.sectionTitle}>Historique ({history.length})</div>
        </div>
        {historyLoading && <p style={T.meta}>Chargement...</p>}
        {!historyLoading && history.length === 0 && <p style={T.meta}>Aucun scraping effectue. Essayez avec une URL ci-dessus.</p>}
        {history.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #2a2a2a" }}>
                <th style={{ padding: "0.5rem", color: "#666", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Titre</th>
                <th style={{ color: "#666", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Domaine</th>
                <th style={{ color: "#666", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Emails</th>
                <th style={{ color: "#666", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tel.</th>
                <th style={{ color: "#666", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tech</th>
                <th style={{ color: "#666", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}
                  style={{ borderBottom: "1px solid #1e1e1e", cursor: "pointer", background: selectedId === item.id ? "rgba(255,255,255,0.03)" : "transparent" }}
                  onClick={() => viewDetail(item.id)}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedId === item.id ? "rgba(255,255,255,0.03)" : "transparent"}
                >
                  <td style={{ padding: "0.6rem 0.5rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#ccc" }}>{item.title || "Sans titre"}</td>
                  <td style={{ color: "#888" }}>{item.domain}</td>
                  <td><span style={{ color: T.green, fontWeight: 600 }}>{(item.extracted_emails || []).length}</span></td>
                  <td style={{ color: "#888" }}>{(item.extracted_phones || []).length}</td>
                  <td style={{ color: "#555", fontSize: "0.78rem" }}>{(item.technologies || []).slice(0, 2).join(", ") || "-"}</td>
                  <td style={{ color: "#555", fontSize: "0.78rem" }}>{new Date(item.created_at).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <button style={T.btnSm("transparent", T.red)} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                      &#x2715;
                    </button>
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
