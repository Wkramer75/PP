import React, { useState, useEffect } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const s = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  card: { background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  stat: { fontSize: "2rem", fontWeight: 700, color: "#4361ee" },
  label: { fontSize: "0.85rem", color: "#888", marginTop: "0.25rem" },
  section: { marginBottom: "2rem" },
  sectionTitle: { fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" },
  badge: (color) => ({ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: color + "20", color }),
  row: { display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f0f0" },
  barContainer: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" },
  bar: (pct, color) => ({ height: 20, width: `${Math.max(pct, 2)}%`, background: color, borderRadius: 4 }),
  barLabel: { fontSize: "0.8rem", minWidth: 80 },
  barCount: { fontSize: "0.8rem", color: "#888" },
};

const STAGE_COLORS = {
  lead: "#94a3b8", contacted: "#60a5fa", qualified: "#a78bfa",
  proposal: "#fbbf24", negotiation: "#fb923c", won: "#34d399", lost: "#f87171",
};

function StatCard({ value, label }) {
  return (
    <div style={s.card}>
      <div style={s.stat}>{value}</div>
      <div style={s.label}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/reporting/dashboard`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Erreur de chargement du dashboard</p>;

  const { scraping: sc, crm, email: em } = data;
  const maxStage = Math.max(...Object.values(crm.by_stage || { x: 1 }), 1);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Dashboard</h1>

      {/* KPIs */}
      <div style={s.grid}>
        <StatCard value={sc.total} label="Scrapes total" />
        <StatCard value={sc.total_emails_found} label="Emails trouves" />
        <StatCard value={sc.unique_domains} label="Domaines uniques" />
        <StatCard value={crm.total_prospects} label="Prospects" />
        <StatCard value={`${crm.conversion_rate}%`} label="Taux conversion" />
        <StatCard value={em.total_sent} label="Emails envoyes" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Pipeline */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Pipeline CRM</div>
          {Object.entries(crm.by_stage || {}).map(([stage, count]) => (
            <div key={stage} style={s.barContainer}>
              <div style={s.barLabel}>{stage}</div>
              <div style={{ flex: 1 }}>
                <div style={s.bar((count / maxStage) * 100, STAGE_COLORS[stage] || "#4361ee")} />
              </div>
              <div style={s.barCount}>{count}</div>
            </div>
          ))}
          {Object.keys(crm.by_stage || {}).length === 0 && <p style={{ color: "#888" }}>Aucun prospect</p>}
        </div>

        {/* Technologies */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Top Technologies</div>
          {(sc.top_technologies || []).map((t) => (
            <div key={t.name} style={s.row}>
              <span>{t.name}</span>
              <span style={s.badge("#4361ee")}>{t.count}</span>
            </div>
          ))}
          {(sc.top_technologies || []).length === 0 && <p style={{ color: "#888" }}>Aucune donnee</p>}
        </div>
      </div>

      {/* Activity Timeline */}
      <div style={{ ...s.card, marginTop: "1.5rem" }}>
        <div style={s.sectionTitle}>Activite recente</div>
        {(data.activity_timeline || []).length === 0 && <p style={{ color: "#888" }}>Aucune activite</p>}
        {(data.activity_timeline || []).map((a) => (
          <div key={a.id} style={s.row}>
            <div>
              <span style={s.badge(a.type === "stage_change" ? "#f59e0b" : a.type === "email" ? "#4361ee" : "#64748b")}>
                {a.type}
              </span>{" "}
              <strong>{a.prospect_name}</strong> — {a.description}
            </div>
            <span style={{ fontSize: "0.8rem", color: "#888" }}>
              {a.date ? new Date(a.date).toLocaleDateString("fr-FR") : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
