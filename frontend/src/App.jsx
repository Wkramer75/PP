import React, { useState } from "react";
import ScrapingPage from "./components/ScrapingPage";
import CRMPage from "./components/CRMPage";
import EmailPage from "./components/EmailPage";
import DashboardPage from "./components/DashboardPage";

const NAV_MAIN = [
  { key: "dashboard", label: "Dashboard", icon: "\u25A3" },
  { key: "scraping", label: "Scraping", icon: "\u29BE" },
  { key: "crm", label: "CRM", icon: "\u2B21" },
  { key: "email", label: "Email", icon: "\u2709" },
];

const NAV_TOOLS = [
  { key: "automation", label: "Automation", icon: "\u2699", url: "http://localhost:5678" },
  { key: "espocrm", label: "EspoCRM", icon: "\u2606", url: "http://localhost/crm" },
  { key: "mautic", label: "Mautic", icon: "\u2740", url: "http://localhost:8001" },
  { key: "monitoring", label: "Monitoring", icon: "\u2261", url: "http://localhost:3001" },
];

function ExternalPage({ url, title }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "0.78rem", color: "#666", textDecoration: "none", border: "1px solid #333", padding: "0.3rem 0.7rem", borderRadius: 6 }}>
          Ouvrir dans un nouvel onglet
        </a>
      </div>
      <iframe
        src={url}
        title={title}
        style={{
          flex: 1,
          width: "100%",
          minHeight: "calc(100vh - 100px)",
          border: "1px solid #2a2a2a",
          borderRadius: 10,
          background: "#fff",
        }}
      />
    </div>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");

  const activeToolUrl = NAV_TOOLS.find((t) => t.key === page);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#e5e5e5", background: "#0f0f0f" }}>
      {/* Sidebar */}
      <aside style={{ width: 200, background: "#111", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "1.5rem 1.25rem 1.25rem", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Prospect</div>
          <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sales Tool</div>
        </div>

        <nav style={{ marginTop: "0.5rem", flex: 1 }}>
          {/* Main pages */}
          {NAV_MAIN.map((item) => {
            const active = page === item.key;
            return (
              <div
                key={item.key}
                onClick={() => setPage(item.key)}
                style={{
                  padding: "0.65rem 1.25rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: active ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  color: active ? "#fff" : "#666",
                  background: active ? "rgba(255,255,255,0.05)" : "transparent",
                  borderLeft: active ? "2px solid #fff" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; } }}
              >
                <span style={{ fontSize: "1rem", opacity: 0.7 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}

          {/* Separator */}
          <div style={{ height: 1, background: "#1e1e1e", margin: "0.75rem 1.25rem" }} />
          <div style={{ padding: "0.3rem 1.25rem", fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em" }}>Outils</div>

          {/* External tools */}
          {NAV_TOOLS.map((item) => {
            const active = page === item.key;
            return (
              <div
                key={item.key}
                onClick={() => setPage(item.key)}
                style={{
                  padding: "0.55rem 1.25rem",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  color: active ? "#fff" : "#555",
                  background: active ? "rgba(255,255,255,0.05)" : "transparent",
                  borderLeft: active ? "2px solid #fff" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "#555"; e.currentTarget.style.background = "transparent"; } }}
              >
                <span style={{ fontSize: "0.9rem", opacity: 0.6 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #1e1e1e", fontSize: "0.7rem", color: "#444" }}>
          v3.0 — Full Stack
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "1.5rem 2rem", overflowY: "auto", background: "#0f0f0f" }}>
        {page === "dashboard" && <DashboardPage />}
        {page === "scraping" && <ScrapingPage />}
        {page === "crm" && <CRMPage />}
        {page === "email" && <EmailPage />}
        {activeToolUrl && <ExternalPage url={activeToolUrl.url} title={activeToolUrl.label} />}
      </main>
    </div>
  );
}

export default App;
