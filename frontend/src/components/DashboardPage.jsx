import React, { useState, useEffect } from "react";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const s = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  card: { background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  stat: { fontSize: "2rem", fontWeight: 700, color: "#4361ee" },
  label: { fontSize: "0.85rem", color: "#888", marginTop: "0.25rem" },
  sectionTitle: { fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" },
  badge: (color) => ({ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, background: color + "20", color }),
  row: { display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f0f0" },
  barContainer: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" },
  bar: (pct, color) => ({ height: 20, width: `${Math.max(pct, 2)}%`, background: color, borderRadius: 4 }),
  barLabel: { fontSize: "0.8rem", minWidth: 90 },
  barCount: { fontSize: "0.8rem", color: "#888" },
  meta: { fontSize: "0.8rem", color: "#888" },
  error: { background: "#fef2f2", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.9rem" },
  guide: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" },
  guideTitle: { fontSize: "1rem", fontWeight: 700, color: "#1e40af", marginBottom: "0.75rem" },
  guideStep: { display: "flex", gap: "0.75rem", marginBottom: "0.6rem", fontSize: "0.9rem", color: "#1e3a5f" },
  guideNumber: { background: "#4361ee", color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 },
  guideToggle: { background: "none", border: "none", color: "#4361ee", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, padding: 0 },
};

const STAGE_COLORS = {
  lead: "#94a3b8", contacted: "#60a5fa", qualified: "#a78bfa",
  proposal: "#fbbf24", negotiation: "#fb923c", won: "#34d399", lost: "#f87171",
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
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/reporting/dashboard`)
      .then((r) => { if (!r.ok) throw new Error("Erreur serveur"); return r.json(); })
      .then(setData)
      .catch(() => setError("Impossible de charger le dashboard. Verifiez que le backend tourne sur http://localhost:8000"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement du dashboard...</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Dashboard</h1>

      <Guide
        title="Bienvenue dans Sales Prospecting Tool !"
        defaultOpen={!data || (data.scraping.total === 0 && data.crm.total_prospects === 0)}
        steps={[
          "Scraping : Allez dans l'onglet Scraping, collez l'URL d'un site web, et cliquez \"Scraper\" pour extraire emails, telephones et liens",
          "CRM : Allez dans CRM pour ajouter vos prospects manuellement ou les importer depuis les resultats de scraping",
          "Email : Creez des templates d'email, puis lancez des campagnes pour contacter vos prospects",
          "Dashboard : Cette page resume toutes vos statistiques en temps reel",
          "Astuce : Commencez par scraper quelques sites pour remplir votre base de donnees",
        ]}
      />

      {error && <div style={s.error}>{error}</div>}

      {data && (
        <>
          {/* KPIs */}
          <div style={s.grid}>
            <StatCard value={data.scraping.total} label="Scrapes total" />
            <StatCard value={data.scraping.total_emails_found} label="Emails trouves" />
            <StatCard value={data.scraping.unique_domains} label="Domaines uniques" />
            <StatCard value={data.crm.total_prospects} label="Prospects" />
            <StatCard value={`${data.crm.conversion_rate}%`} label="Taux conversion" />
            <StatCard value={data.email.total_sent} label="Emails envoyes" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Pipeline */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Pipeline CRM</div>
              {Object.entries(data.crm.by_stage || {}).map(([stage, count]) => {
                const max = Math.max(...Object.values(data.crm.by_stage || { x: 1 }), 1);
                return (
                  <div key={stage} style={s.barContainer}>
                    <div style={s.barLabel}>{stage}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.bar((count / max) * 100, STAGE_COLORS[stage] || "#4361ee")} />
                    </div>
                    <div style={s.barCount}>{count}</div>
                  </div>
                );
              })}
              {Object.keys(data.crm.by_stage || {}).length === 0 && <p style={s.meta}>Aucun prospect. Ajoutez-en dans le CRM.</p>}
            </div>

            {/* Technologies */}
            <div style={s.card}>
              <div style={s.sectionTitle}>Top Technologies detectees</div>
              {(data.scraping.top_technologies || []).map((t) => (
                <div key={t.name} style={s.row}>
                  <span>{t.name}</span>
                  <span style={s.badge("#4361ee")}>{t.count}</span>
                </div>
              ))}
              {(data.scraping.top_technologies || []).length === 0 && <p style={s.meta}>Scrapez des sites pour voir les technologies.</p>}
            </div>
          </div>

          {/* Activity Timeline */}
          <div style={{ ...s.card, marginTop: "1.5rem" }}>
            <div style={s.sectionTitle}>Activite recente</div>
            {(data.activity_timeline || []).length === 0 && <p style={s.meta}>Aucune activite. Ajoutez des prospects et des notes dans le CRM.</p>}
            {(data.activity_timeline || []).map((a) => (
              <div key={a.id} style={s.row}>
                <div>
                  <span style={s.badge(a.type === "stage_change" ? "#f59e0b" : a.type === "email" ? "#4361ee" : "#64748b")}>
                    {a.type}
                  </span>{" "}
                  <strong>{a.prospect_name}</strong> — {a.description}
                </div>
                <span style={s.meta}>
                  {a.date ? new Date(a.date).toLocaleDateString("fr-FR") : ""}
                </span>
              </div>
            ))}
          </div>

          {/* Email stats */}
          <div style={{ ...s.card, marginTop: "1.5rem" }}>
            <div style={s.sectionTitle}>Email Marketing</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div><strong>{data.email.total_campaigns}</strong><div style={s.meta}>Campagnes</div></div>
              <div><strong>{data.email.total_sent}</strong><div style={s.meta}>Emails envoyes</div></div>
              <div><strong>{data.email.delivery_rate}%</strong><div style={s.meta}>Taux de delivrabilite</div></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
