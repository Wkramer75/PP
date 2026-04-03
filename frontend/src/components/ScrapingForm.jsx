import React, { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const styles = {
  card: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    gap: "0.75rem",
  },
  input: {
    flex: 1,
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "1px solid #ddd",
    borderRadius: 8,
    outline: "none",
  },
  button: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#fff",
    background: "#4361ee",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  buttonDisabled: {
    background: "#a0a0a0",
    cursor: "not-allowed",
  },
  error: {
    color: "#e63946",
    marginTop: "0.75rem",
  },
  section: {
    marginTop: "1rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#4361ee",
  },
  tag: {
    display: "inline-block",
    background: "#edf2ff",
    color: "#4361ee",
    padding: "0.25rem 0.6rem",
    borderRadius: 6,
    margin: "0.2rem",
    fontSize: "0.85rem",
    wordBreak: "break-all",
  },
  link: {
    display: "block",
    color: "#4361ee",
    fontSize: "0.85rem",
    wordBreak: "break-all",
    marginBottom: "0.25rem",
  },
  historyItem: {
    borderBottom: "1px solid #eee",
    padding: "0.75rem 0",
  },
  historyUrl: {
    fontWeight: 600,
    wordBreak: "break-all",
  },
  historyMeta: {
    fontSize: "0.8rem",
    color: "#888",
  },
};

function ResultCard({ result }) {
  return (
    <div style={styles.card}>
      <h3 style={{ margin: 0 }}>{result.title || "Sans titre"}</h3>
      <p style={{ color: "#888", fontSize: "0.85rem", margin: "0.25rem 0" }}>
        {result.url}
      </p>

      {result.extracted_emails.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Emails ({result.extracted_emails.length})</div>
          {result.extracted_emails.map((e, i) => (
            <span key={i} style={styles.tag}>{e}</span>
          ))}
        </div>
      )}

      {result.extracted_phones.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Telephones ({result.extracted_phones.length})</div>
          {result.extracted_phones.map((p, i) => (
            <span key={i} style={styles.tag}>{p}</span>
          ))}
        </div>
      )}

      {result.extracted_links.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Liens ({result.extracted_links.length})</div>
          {result.extracted_links.slice(0, 20).map((l, i) => (
            <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={styles.link}>
              {l}
            </a>
          ))}
          {result.extracted_links.length > 20 && (
            <span style={{ color: "#888", fontSize: "0.8rem" }}>
              ... et {result.extracted_links.length - 20} autres
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ScrapingForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/scraping/`)
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/scraping/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erreur lors du scraping");
      }

      const data = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev]);
      setUrl("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemple.com"
            required
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading ? "Scraping..." : "Scraper"}
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>

      {result && (
        <>
          <h2>Resultat</h2>
          <ResultCard result={result} />
        </>
      )}

      {history.length > 0 && (
        <>
          <h2>Historique</h2>
          {history.map((item) => (
            <div key={item.id} style={styles.historyItem}>
              <div style={styles.historyUrl}>{item.title || item.url}</div>
              <div style={styles.historyMeta}>
                {item.extracted_emails.length} emails ·{" "}
                {item.extracted_phones.length} telephones ·{" "}
                {item.extracted_links.length} liens ·{" "}
                {new Date(item.created_at).toLocaleString("fr-FR")}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default ScrapingForm;
