import React, { useState } from "react";
import T from "../theme";
import Guide from "./Guide";

const TOOLS = {
  automation: {
    title: "n8n — Automation",
    subtitle: "Workflow automation visuel",
    url: "http://localhost:5678",
    login: { user: "admin", pass: "admin123" },
    description: "n8n est un outil d'automatisation visuel. Vous creez des workflows en connectant des blocs entre eux (comme un organigramme). Chaque bloc fait une action : appeler une API, envoyer un email, filtrer des donnees, etc.",
    guide: [
      "Cliquez sur \"Ouvrir n8n\" ci-dessous pour acceder a l'interface",
      "Connectez-vous avec admin / admin123",
      "Cliquez sur \"Add workflow\" pour creer un nouveau flux",
      "Ajoutez un trigger (ex: Schedule Trigger pour lancer toutes les X heures)",
      "Ajoutez un noeud HTTP Request pour appeler votre API : POST http://backend:8000/api/scraping/",
      "Chainee avec un autre HTTP Request vers POST http://backend:8000/api/crm/import-scrape",
      "Activez le workflow en cliquant sur le toggle en haut a droite",
      "Exemple : Scraper un site toutes les 6h → Importer dans le CRM → Scorer les prospects",
    ],
    useCases: [
      { title: "Scraping automatique", desc: "Scraper une liste de sites toutes les 6h et importer les contacts dans le CRM" },
      { title: "Enrichissement de leads", desc: "Quand un prospect est ajoute au CRM, scraper son site web automatiquement" },
      { title: "Alerte email", desc: "Recevoir un email quand un prospect passe au stage 'qualified'" },
      { title: "Sync EspoCRM", desc: "Synchroniser les prospects entre votre app et EspoCRM automatiquement" },
    ],
  },
  espocrm: {
    title: "EspoCRM",
    subtitle: "CRM professionnel complet",
    url: "http://localhost/crm",
    login: { user: "admin", pass: "admin123" },
    description: "EspoCRM est un CRM open source professionnel avec gestion des contacts, des affaires, du calendrier, des emails et bien plus. Il complete le CRM integre de l'application avec des fonctionnalites avancees.",
    guide: [
      "Cliquez sur \"Ouvrir EspoCRM\" ci-dessous",
      "Connectez-vous avec admin / admin123",
      "Allez dans Leads pour voir/ajouter des prospects",
      "Creez des Opportunities pour suivre vos affaires",
      "Configurez les Workflows dans Administration > Workflows pour automatiser des actions",
      "Activez l'API REST dans Administration > Integrations pour connecter avec votre app",
      "Les prospects de votre app peuvent etre pushes vers EspoCRM via l'API",
    ],
    useCases: [
      { title: "Pipeline avance", desc: "Gerer des affaires complexes avec montants, probabilites et dates de cloture" },
      { title: "Calendrier", desc: "Planifier des rendez-vous et des appels avec vos prospects" },
      { title: "Documents", desc: "Stocker des devis et propositions commerciales" },
      { title: "Rapports", desc: "Generer des rapports detailles sur votre activite commerciale" },
    ],
  },
  mautic: {
    title: "Mautic",
    subtitle: "Email marketing et automation",
    url: "http://localhost:8001",
    login: { user: "admin", pass: "admin123" },
    description: "Mautic est une plateforme d'email marketing et d'automatisation marketing open source. Il permet de creer des campagnes email avancees avec segmentation, scoring, tracking d'ouvertures et de clics, et scenarios automatises.",
    guide: [
      "Cliquez sur \"Ouvrir Mautic\" ci-dessous",
      "Connectez-vous avec admin / admin123 (email: admin@prospect.local)",
      "Allez dans Contacts > New pour ajouter un contact manuellement",
      "Allez dans Channels > Emails > New pour creer un email (choisir Template Email)",
      "Creez un Segment dans Contacts > Segments (ex: 'Leads qualifies' = contacts avec score > 50)",
      "Creez une Campagne dans Campaigns > New : choisir un segment source, ajouter des actions (envoyer email, attendre X jours, condition)",
      "Configurez l'envoi SMTP dans Settings (roue dentee) > Configuration > Email Settings",
      "Activez le tracking : chaque email envoye trackera les ouvertures et les clics",
    ],
    useCases: [
      { title: "Sequence d'emails", desc: "Email J+0 intro → J+3 relance → J+7 proposition → J+14 dernier rappel" },
      { title: "Scoring automatique", desc: "+10 points a l'ouverture, +20 au clic, -5 apres 30j sans interaction" },
      { title: "Segmentation dynamique", desc: "Segment 'Chauds' = score > 60, Segment 'Froids' = pas d'ouverture depuis 30j" },
      { title: "A/B Testing", desc: "Tester 2 sujets d'email differents et garder le meilleur" },
    ],
    smtpGuide: [
      "Dans Mautic, allez dans Settings (roue dentee en haut a droite) > Configuration",
      "Onglet Email Settings",
      "Mail Transport: smtp",
      "Host: smtp.gmail.com",
      "Port: 587",
      "Encryption: TLS",
      "Username: votre.email@gmail.com",
      "Password: votre mot de passe d'application (pas le mot de passe Gmail normal !)",
      "Pour obtenir un mot de passe d'application Gmail :",
      "→ Google Account > Securite > Verification en 2 etapes (activer si pas fait)",
      "→ Puis chercher 'Mots de passe des applications' > Generer pour 'Mail'",
      "→ Copier le mot de passe de 16 caracteres dans Mautic",
    ],
  },
  monitoring: {
    title: "Grafana — Monitoring",
    subtitle: "Tableaux de bord et metriques",
    url: "http://localhost:3001",
    login: { user: "admin", pass: "admin123" },
    description: "Grafana affiche des tableaux de bord visuels bases sur les metriques collectees par Prometheus. Vous pouvez voir en temps reel le nombre de scrapes, de prospects, et la sante de l'application.",
    guide: [
      "Cliquez sur \"Ouvrir Grafana\" ci-dessous",
      "Connectez-vous avec admin / admin123",
      "Cliquez sur + > New Dashboard pour creer un tableau de bord",
      "Ajoutez un Panel > choisir Prometheus comme source de donnees",
      "Tapez une metrique, ex: prospecting_scrapes_total",
      "Autres metriques disponibles : prospecting_prospects_total",
      "Choisissez le type de visualisation : Gauge, Graph, Stat, etc.",
      "Sauvegardez le dashboard pour le retrouver plus tard",
    ],
    useCases: [
      { title: "Compteur de scrapes", desc: "Afficher le nombre total de sites scrapes en temps reel" },
      { title: "Evolution prospects", desc: "Graphique de l'evolution du nombre de prospects dans le temps" },
      { title: "Alertes", desc: "Recevoir une notification si le backend tombe" },
    ],
  },
};

const cardStyle = {
  ...T.card,
  cursor: "default",
};

const useCaseStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid #222",
  borderRadius: 8,
  padding: "0.75rem 1rem",
};

export default function ToolPage({ toolKey }) {
  const tool = TOOLS[toolKey];
  if (!tool) return null;

  const [showSmtp, setShowSmtp] = useState(false);

  return (
    <div>
      <h1 style={T.pageTitle}>{tool.title}</h1>
      <p style={{ color: "#555", fontSize: "0.85rem", marginBottom: "1.5rem" }}>{tool.subtitle}</p>

      {/* Open button */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#aaa", fontSize: "0.9rem" }}>{tool.description}</p>
            <div style={{ marginTop: "0.75rem", color: "#666", fontSize: "0.82rem" }}>
              Identifiants : <span style={{ color: "#aaa" }}>{tool.login.user}</span> / <span style={{ color: "#aaa" }}>{tool.login.pass}</span>
            </div>
          </div>
          <a href={tool.url} target="_blank" rel="noopener noreferrer"
            style={{
              ...T.btn(),
              textDecoration: "none",
              display: "inline-block",
              whiteSpace: "nowrap",
              marginLeft: "1.5rem",
            }}>
            Ouvrir {tool.title.split(" ")[0]}
          </a>
        </div>
      </div>

      {/* Guide */}
      <Guide title="Guide d'utilisation" steps={tool.guide} defaultOpen={true} />

      {/* SMTP guide for Mautic */}
      {tool.smtpGuide && (
        <div style={T.guide}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={T.guideTitle}>Configuration SMTP (Gmail)</div>
            <button style={T.guideToggle} onClick={() => setShowSmtp(!showSmtp)}>{showSmtp ? "Masquer" : "Voir"}</button>
          </div>
          {showSmtp && (
            <div style={{ marginTop: "0.5rem" }}>
              {tool.smtpGuide.map((step, i) => (
                <div key={i} style={T.guideStep}>
                  <div style={T.guideNumber}>{i + 1}</div>
                  <div>{step}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Use cases */}
      <div style={cardStyle}>
        <div style={T.sectionTitle}>Cas d'utilisation</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
          {tool.useCases.map((uc, i) => (
            <div key={i} style={useCaseStyle}>
              <div style={{ fontWeight: 600, color: "#ccc", fontSize: "0.85rem", marginBottom: "0.3rem" }}>{uc.title}</div>
              <div style={{ color: "#777", fontSize: "0.8rem" }}>{uc.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
