import React, { useState, useEffect } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const s = {
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "1.5rem", marginBottom: "1.5rem" },
  form: { display: "flex", gap: "0.75rem" },
  input: { flex: 1, padding: "0.75rem 1rem", fontSize: "1rem", border: "1px solid #ddd", borderRadius: 8, outline: "none" },
  btn: (color = "#4361ee") => ({ padding: "0.75rem 1.5rem", fontSize: "0.95rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 8, cursor: "pointer" }),
  btnSm: (color = "#4361ee") => ({ padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 600, color: "#fff", background: color, border: "none", borderRadius: 6, cursor: "pointer" }),
  tag: (color = "#4361ee") => ({ display: "inline-block", background: color + "15", color, padding: "0.2rem 0.5rem", borderRadius: 6, margin: "0.15rem", fontSize: "0.8rem", wordBreak: "break-all" }),
  section: { marginTop: "1rem" },
  sectionTitle: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "#4361ee" },
  error: { color: "#e63946", marginTop: "0.75rem" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  tab: (active) => ({ padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", background: active ? "#4361ee" : "#e8e8e8", color: active ? "#fff" : "#333", border: "none" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  link: { display: "block", color: "#4361ee", fontSize: "0.8rem", wordBreak: "break-all", marginBottom: "0.2rem" },
  meta: { fontSize: "0.8rem", color: "#888" },
};

function ResultDetail({ result }) {
  const [tab, setTab] = useState("overview");
  if (!result) return null;

  return (
    <div style={s.card}>
      <h3 style={{ margin: 0 }}>{result.title || "Sans titre"}</h3>
      <p style={{ ...s.meta, margin: "0.25rem 0" }}>{result.url}</p>
      <div style={{ ...s.meta, marginBottom: "0.75rem" }}>
        Status: {result.status_code} | {result.response_time}s | {result.word_count} mots | {result.language || "?"}
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
          {result.extracted_emails.length === 0 && <p style={s.meta}>Aucun email trouve</p>}
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
          </div>
          <div>
            <div style={s.sectionTitle}>Externes ({result.external_links.length})</div>
            {result.external_links.slice(0, 15).map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={s.link}>{l}</a>
            ))}
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
  const [mode, setMode] = useState("single"); // single, batch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/scraping/`).then((r) => r.json()).then(setHistory).catch(() => {});
  }, []);

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}/api/scraping/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      const data = await res.json();
      setResult(data); setHistory((p) => [data, ...p]); setUrl("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleBatch = async (e) => {
    e.preventDefault();
    const urls = batchUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}/api/scraping/batch`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, name: `Batch ${urls.length} URLs` }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      await res.json();
      const updated = await fetch(`${API}/api/scraping/`).then((r) => r.json());
      setHistory(updated); setBatchUrls("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    window.open(`${API}/api/scraping/export`, "_blank");
  };

  const viewDetail = async (id) => {
    try {
      const res = await fetch(`${API}/api/scraping/${id}`);
      const data = await res.json();
      setResult(data); setSelectedId(id);
    } catch (err) { /* ignore */ }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Scraping</h1>
        <button style={s.btnSm("#10b981")} onClick={handleExport}>Exporter CSV</button>
      </div>

      <div style={s.card}>
        <div style={s.tabs}>
          <button style={s.tab(mode === "single")} onClick={() => setMode("single")}>URL unique</button>
          <button style={s.tab(mode === "batch")} onClick={() => setMode("batch")}>Batch</button>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleScrape} style={s.form}>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemple.com" required style={s.input} />
            <button type="submit" disabled={loading} style={s.btn()}>{loading ? "Scraping..." : "Scraper"}</button>
          </form>
        ) : (
          <form onSubmit={handleBatch}>
            <textarea
              value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)}
              placeholder={"https://site1.com\nhttps://site2.com\nhttps://site3.com"}
              rows={5} style={{ ...s.input, width: "100%", resize: "vertical", marginBottom: "0.75rem" }}
            />
            <button type="submit" disabled={loading} style={s.btn()}>{loading ? "Scraping..." : "Scraper tout"}</button>
          </form>
        )}
        {error && <p style={s.error}>{error}</p>}
      </div>

      {result && <ResultDetail result={result} />}

      {history.length > 0 && (
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>Historique ({history.length})</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "0.5rem" }}>Titre</th>
                <th>Domaine</th>
                <th>Emails</th>
                <th>Tech</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer", background: selectedId === item.id ? "#f0f4ff" : "transparent" }} onClick={() => viewDetail(item.id)}>
                  <td style={{ padding: "0.5rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || item.url}</td>
                  <td>{item.domain}</td>
                  <td>{(item.extracted_emails || []).length}</td>
                  <td>{(item.technologies || []).slice(0, 2).join(", ")}</td>
                  <td style={s.meta}>{new Date(item.created_at).toLocaleDateString("fr-FR")}</td>
                  <td><button style={s.btnSm("#4361ee")} onClick={(e) => { e.stopPropagation(); viewDetail(item.id); }}>Voir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
