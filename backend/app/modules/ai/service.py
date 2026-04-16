"""
AI module for intelligent automation.
Uses Ollama (local LLM) or falls back to template-based generation.
No paid API required.
"""
import os
import re
import random
import requests
from sqlalchemy.orm import Session
from app.modules.crm.models import Prospect

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")


def _ollama_available() -> bool:
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        return resp.status_code == 200
    except Exception:
        return False


def _ask_ollama(prompt: str) -> str:
    """Send a prompt to Ollama and return the response."""
    resp = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json().get("response", "")


# ── Email Generation ─────────────────────────────────────────────────────────

INTRO_TEMPLATES = [
    "Bonjour {first_name},\n\nJe me permets de vous contacter car j'ai decouvert {company} et je suis impressionne par votre activite.\n\nJe pense que notre solution pourrait vous aider a [benefice]. Seriez-vous disponible pour un echange de 15 minutes cette semaine ?\n\nCordialement,\n{sender_name}",
    "Bonjour {first_name},\n\nJe suis {sender_name}. J'ai identifie {company} comme un acteur cle dans votre secteur et j'aimerais vous proposer [solution].\n\nAvez-vous un moment pour en discuter ?\n\nBien cordialement,\n{sender_name}",
    "Bonjour {first_name},\n\nEn recherchant des entreprises innovantes, je suis tombe sur {company}. Votre approche de {job_title} m'a interpelle.\n\nJ'ai une idee qui pourrait booster votre productivite. Peut-on en parler ?\n\n{sender_name}",
]

FOLLOWUP_TEMPLATES = [
    "Bonjour {first_name},\n\nJe reviens vers vous suite a mon precedent message. Avez-vous eu le temps d'y jeter un oeil ?\n\nJe serais ravi d'echanger avec vous sur les benefices concrets pour {company}.\n\nBien a vous,\n{sender_name}",
    "Bonjour {first_name},\n\nJe me permets de vous relancer. Je comprends que vous etes occupe, mais je pense sincerement que notre solution pourrait faire la difference pour {company}.\n\nUn appel de 10 minutes suffirait. Qu'en dites-vous ?\n\n{sender_name}",
]


def generate_email(
    prospect: dict,
    email_type: str = "intro",
    sender_name: str = "Votre nom",
    custom_context: str = "",
) -> dict:
    """Generate a personalized email for a prospect."""

    first_name = prospect.get("first_name", "")
    company = prospect.get("company", "votre entreprise")
    job_title = prospect.get("job_title", "")

    # Try LLM first
    if _ollama_available():
        prompt = f"""Tu es un expert en prospection commerciale B2B en France.
Genere un email de {email_type} professionnel et personnalise.

Destinataire:
- Prenom: {first_name}
- Entreprise: {company}
- Poste: {job_title}

Expediteur: {sender_name}
{f"Contexte: {custom_context}" if custom_context else ""}

Regles:
- Ton professionnel mais chaleureux
- Court (max 150 mots)
- Inclure un call-to-action clair
- Ne pas etre trop vendeur
- En francais

Reponds UNIQUEMENT avec l'email (sujet en premiere ligne, puis le corps)."""

        try:
            response = _ask_ollama(prompt)
            lines = response.strip().split("\n", 1)
            subject = lines[0].replace("Sujet:", "").replace("Objet:", "").strip()
            body = lines[1].strip() if len(lines) > 1 else response
            return {"subject": subject, "body": body, "source": "ai"}
        except Exception:
            pass

    # Fallback: template-based
    templates = INTRO_TEMPLATES if email_type == "intro" else FOLLOWUP_TEMPLATES
    template = random.choice(templates)
    body = template.format(
        first_name=first_name or "Madame/Monsieur",
        company=company,
        job_title=job_title or "votre domaine",
        sender_name=sender_name,
    )

    subject_map = {
        "intro": f"Proposition pour {company}" if company else "Proposition de collaboration",
        "followup": f"Suite a mon message - {company}" if company else "Suite a mon precedent message",
    }

    return {
        "subject": subject_map.get(email_type, "Prise de contact"),
        "body": body,
        "source": "template",
    }


# ── Lead Scoring ─────────────────────────────────────────────────────────────

def score_prospect(prospect: dict) -> dict:
    """Calculate an automatic lead score based on available data."""
    score = 0
    reasons = []

    if prospect.get("email"):
        score += 20
        reasons.append("+20: email disponible")
    if prospect.get("phone"):
        score += 15
        reasons.append("+15: telephone disponible")
    if prospect.get("company"):
        score += 10
        reasons.append("+10: entreprise connue")
    if prospect.get("job_title"):
        score += 10
        title = prospect["job_title"].lower()
        if any(kw in title for kw in ["directeur", "ceo", "cto", "cfo", "founder", "manager", "responsable", "head"]):
            score += 15
            reasons.append("+15: poste decisionnaire")
        reasons.append("+10: poste connu")
    if prospect.get("linkedin"):
        score += 10
        reasons.append("+10: profil LinkedIn")
    if prospect.get("website"):
        score += 10
        reasons.append("+10: site web")
    if prospect.get("city"):
        score += 5
        reasons.append("+5: localisation connue")

    # Cap at 100
    score = min(score, 100)

    return {"score": score, "reasons": reasons}


# ── Lead Classification ──────────────────────────────────────────────────────

def classify_prospect(prospect: dict) -> dict:
    """Classify a prospect into categories based on their profile."""
    score_data = score_prospect(prospect)
    score = score_data["score"]

    if score >= 70:
        tier = "hot"
        recommendation = "Contacter immediatement - prospect tres qualifie"
        suggested_stage = "qualified"
    elif score >= 40:
        tier = "warm"
        recommendation = "Envoyer un email d'introduction personnalise"
        suggested_stage = "contacted"
    else:
        tier = "cold"
        recommendation = "Enrichir les donnees avant de contacter"
        suggested_stage = "lead"

    return {
        "tier": tier,
        "score": score,
        "suggested_stage": suggested_stage,
        "recommendation": recommendation,
        "scoring_details": score_data["reasons"],
    }


def auto_score_all(db: Session) -> dict:
    """Score all prospects automatically."""
    prospects = db.query(Prospect).all()
    updated = 0
    for p in prospects:
        data = {
            "email": p.email, "phone": p.phone, "company": p.company,
            "job_title": p.job_title, "linkedin": p.linkedin,
            "website": p.website, "city": p.city,
        }
        result = score_prospect(data)
        if p.score != result["score"]:
            p.score = result["score"]
            updated += 1
    db.commit()
    return {"total": len(prospects), "updated": updated}
