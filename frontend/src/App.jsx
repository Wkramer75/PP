import React, { useState } from "react";
import ScrapingPage from "./components/ScrapingPage";
import CRMPage from "./components/CRMPage";
import EmailPage from "./components/EmailPage";
import DashboardPage from "./components/DashboardPage";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "scraping", label: "Scraping" },
  { key: "crm", label: "CRM" },
  { key: "email", label: "Email" },
];

const styles = {
  app: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#1a1a2e", background: "#f0f2f5" },
  sidebar: { width: 220, background: "#1a1a2e", color: "#fff", padding: "1.5rem 0", display: "flex", flexDirection: "column", flexShrink: 0 },
  logo: { textAlign: "center", fontSize: "1.1rem", fontWeight: 700, padding: "0 1rem 1.5rem", borderBottom: "1px solid #2d2d4a" },
  nav: { marginTop: "1rem" },
  navItem: { padding: "0.75rem 1.5rem", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", transition: "background 0.2s" },
  navItemActive: { background: "#4361ee", borderRadius: "0 8px 8px 0", marginRight: "0.5rem" },
  main: { flex: 1, padding: "1.5rem 2rem", overflowY: "auto" },
  pageTitle: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" },
};

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Sales Prospecting</div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{ ...styles.navItem, ...(page === item.key ? styles.navItemActive : {}) }}
              onMouseEnter={(e) => { if (page !== item.key) e.target.style.background = "#2d2d4a"; }}
              onMouseLeave={(e) => { if (page !== item.key) e.target.style.background = "transparent"; }}
            >
              {item.label}
            </div>
          ))}
        </nav>
      </aside>
      <main style={styles.main}>
        {page === "dashboard" && <DashboardPage />}
        {page === "scraping" && <ScrapingPage />}
        {page === "crm" && <CRMPage />}
        {page === "email" && <EmailPage />}
      </main>
    </div>
  );
}

export default App;
