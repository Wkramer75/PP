import React, { useState, useEffect } from "react";
import T from "../theme";
import Guide from "./Guide";
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const STAGE_COLORS = {
  lead: { bg: "rgba(148,163,184,0.15)", fg: "#94a3b8" },
  contacted: { bg: T.blueSoft, fg: T.blue },
  qualified: { bg: T.purpleSoft, fg: T.purple },
  proposal: { bg: T.yellowSoft, fg: T.yellow },
  negotiation: { bg: T.orangeSoft, fg: T.orange },
  won: { bg: T.greenSoft, fg: T.green },
  lost: { bg: T.redSoft, fg: T.red },
};

function StatCard({ value, label, color = "#fff" }) {
  return (
    <div style={T.card}>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color, letterSpacing: "-0.03em" }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: "#666", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
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

  if (loading) return <p style={{ color: "#666" }}>Chargement...</p>;

  return (
    <div>
      <h1 style={T.pageTitle}>Dashboard</h1>
      <p style={{ color: "#555", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Vue d'ensemble de votre activite</p>

      <Guide
        title="Premiers pas"
        defaultOpen={!data || (data.scraping.total === 0 && data.crm.total_prospects === 0)}
        steps={[
          "Scraping : Allez dans l'onglet Scraping, collez l'URL d'un site web, et cliquez \"Scraper\"",
          "CRM : Ajoutez vos prospects manuellement ou importez-les depuis les resultats de scraping",
          "Email : Creez des templates, puis lancez des campagnes pour contacter vos prospects",
          "Dashboard : Cette page resume toutes vos statistiques en temps reel",
          "Astuce : Commencez par scraper quelques sites pour remplir votre base de donnees",
        ]}
      />

      {error && <div style={T.error}>{error}</div>}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <StatCard value={data.scraping.total} label="Scrapes" />
            <StatCard value={data.scraping.total_emails_found} label="Emails trouves" color={T.green} />
            <StatCard value={data.scraping.unique_domains} label="Domaines" />
            <StatCard value={data.crm.total_prospects} label="Prospects" color={T.blue} />
            <StatCard value={`${data.crm.conversion_rate}%`} label="Conversion" color={T.green} />
            <StatCard value={data.email.total_sent} label="Emails envoyes" color={T.purple} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Pipeline */}
            <div style={T.card}>
              <div style={T.sectionTitle}>Pipeline CRM</div>
              {Object.entries(data.crm.by_stage || {}).map(([stage, count]) => {
                const max = Math.max(...Object.values(data.crm.by_stage || { x: 1 }), 1);
                const sc = STAGE_COLORS[stage] || { bg: T.accentSoft, fg: "#888" };
                return (
                  <div key={stage} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <div style={{ fontSize: "0.78rem", minWidth: 85, color: "#888" }}>{stage}</div>
                    <div style={{ flex: 1, background: "#1e1e1e", borderRadius: 4, height: 18 }}>
                      <div style={{ height: 18, width: `${Math.max((count / max) * 100, 3)}%`, background: sc.fg, borderRadius: 4, opacity: 0.7 }} />
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#666", minWidth: 25, textAlign: "right" }}>{count}</div>
                  </div>
                );
              })}
              {Object.keys(data.crm.by_stage || {}).length === 0 && <p style={T.meta}>Aucun prospect.</p>}
            </div>

            {/* Technologies */}
            <div style={T.card}>
              <div style={T.sectionTitle}>Top Technologies</div>
              {(data.scraping.top_technologies || []).map((t) => (
                <div key={t.name} style={T.row}>
                  <span style={{ fontSize: "0.85rem" }}>{t.name}</span>
                  <span style={T.badge("rgba(255,255,255,0.08)", "#aaa")}>{t.count}</span>
                </div>
              ))}
              {(data.scraping.top_technologies || []).length === 0 && <p style={T.meta}>Scrapez des sites pour voir les technologies.</p>}
            </div>
          </div>

          {/* Activity */}
          <div style={{ ...T.card, marginTop: "1rem" }}>
            <div style={T.sectionTitle}>Activite recente</div>
            {(data.activity_timeline || []).length === 0 && <p style={T.meta}>Aucune activite.</p>}
            {(data.activity_timeline || []).map((a) => (
              <div key={a.id} style={T.row}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={T.badge(
                    a.type === "stage_change" ? T.yellowSoft : a.type === "email" ? T.blueSoft : T.accentSoft,
                    a.type === "stage_change" ? T.yellow : a.type === "email" ? T.blue : "#888"
                  )}>{a.type}</span>
                  <span><strong>{a.prospect_name}</strong> — {a.description}</span>
                </div>
                <span style={T.meta}>{a.date ? new Date(a.date).toLocaleDateString("fr-FR") : ""}</span>
              </div>
            ))}
          </div>

          {/* Email stats */}
          <div style={{ ...T.card, marginTop: "1rem" }}>
            <div style={T.sectionTitle}>Email Marketing</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div><strong style={{ fontSize: "1.2rem" }}>{data.email.total_campaigns}</strong><div style={T.meta}>Campagnes</div></div>
              <div><strong style={{ fontSize: "1.2rem" }}>{data.email.total_sent}</strong><div style={T.meta}>Envoyes</div></div>
              <div><strong style={{ fontSize: "1.2rem" }}>{data.email.delivery_rate}%</strong><div style={T.meta}>Delivrabilite</div></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
