import React, { useState } from "react";
import ScrapingPage from "./components/ScrapingPage";
import CRMPage from "./components/CRMPage";
import EmailPage from "./components/EmailPage";
import DashboardPage from "./components/DashboardPage";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "\u25A3" },
  { key: "scraping", label: "Scraping", icon: "\u29BE" },
  { key: "crm", label: "CRM", icon: "\u2B21" },
  { key: "email", label: "Email", icon: "\u2709" },
];

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#e5e5e5", background: "#0f0f0f" }}>
      {/* Sidebar */}
      <aside style={{ width: 200, background: "#111", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "1.5rem 1.25rem 1.25rem", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Prospect</div>
          <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sales Tool</div>
        </div>
        <nav style={{ marginTop: "0.5rem", flex: 1 }}>
          {NAV.map((item) => {
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
        </nav>
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #1e1e1e", fontSize: "0.7rem", color: "#444" }}>
          v1.0 — Selenium
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "1.5rem 2rem", overflowY: "auto", background: "#0f0f0f" }}>
        {page === "dashboard" && <DashboardPage />}
        {page === "scraping" && <ScrapingPage />}
        {page === "crm" && <CRMPage />}
        {page === "email" && <EmailPage />}
      </main>
    </div>
  );
}

export default App;
