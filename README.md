# Sales Prospecting Platform

Plateforme complete de prospection commerciale automatisee. 100% open source.

## Architecture

```
                    NGINX Gateway (:80)
                         |
         +-------+-------+-------+-------+
         |       |       |       |       |
      Frontend Backend  n8n   EspoCRM  Mautic
      (React)  (FastAPI)       (CRM)   (Email)
         |       |
         |   +---+---+
         |   |       |
         | Celery  Redis
         |   |
         PostgreSQL
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Application | http://localhost | Frontend React (dark UI) |
| API Backend | http://localhost:8000/docs | FastAPI + Swagger docs |
| EspoCRM | http://localhost/crm | CRM externe complet |
| Mautic | http://localhost/mautic | Email marketing avance |
| n8n | http://localhost:5678 | Workflow automation |
| Grafana | http://localhost:3001 | Monitoring dashboards |
| Prometheus | http://localhost:9090 | Metriques |

## Installation rapide

### Prerequis
- Docker + Docker Compose
- 4 Go RAM minimum

### Demarrage

```bash
# Cloner le projet
git clone <repo-url> && cd PP

# Copier la config
cp .env.example .env

# Lancer tout
docker compose up -d --build

# Ou sur Windows :
scripts\install.bat
```

### Sans Docker (dev local)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install && npm start

# Celery worker (optionnel, necessite Redis)
celery -A app.celery_app worker --loglevel=info
```

## Modules

### 1. Scraping (Selenium)
- Navigateur headless Chrome pour sites JavaScript
- Extraction : emails, telephones, liens, reseaux sociaux
- Detection de 40+ technologies
- User-agents rotatifs (fake-useragent)
- Parsing rapide (lxml)
- Mode batch + deep scrape

**Endpoints :**
- `POST /api/scraping/` — Scraper une URL
- `POST /api/scraping/batch` — Batch scraping
- `POST /api/scraping/deep` — Deep scrape (suit les liens)
- `GET /api/scraping/export` — Export CSV

### 2. CRM
- Gestion des prospects (CRUD)
- Pipeline : lead > contacted > qualified > proposal > negotiation > won/lost
- Scoring automatique
- Import depuis scraping
- Historique d'activites

**Endpoints :**
- `POST /api/crm/prospects` — Creer un prospect
- `POST /api/crm/import-scrape` — Importer depuis scraping
- `GET /api/crm/prospects/export` — Export CSV

### 3. Email Marketing
- Templates avec variables ({{first_name}}, {{company}}, etc.)
- Campagnes SMTP
- Gestion des destinataires
- Suivi envois/echecs

**Endpoints :**
- `POST /api/email/templates` — Creer un template
- `POST /api/email/campaigns` — Creer une campagne
- `POST /api/email/campaigns/{id}/send` — Envoyer

### 4. AI / Intelligence
- Generation d'emails par IA (Ollama/Mistral ou templates)
- Scoring automatique des prospects
- Classification (hot/warm/cold)
- Fonctionne sans IA externe (fallback templates)

**Endpoints :**
- `POST /api/ai/generate-email` — Generer un email personnalise
- `POST /api/ai/score` — Scorer un prospect
- `POST /api/ai/classify` — Classifier un prospect
- `POST /api/ai/auto-score` — Scorer tous les prospects
- `GET /api/ai/status` — Verifier si Ollama est disponible

### 5. Taches async (Celery)
- Scraping en arriere-plan
- Enrichissement automatique des leads
- Nettoyage periodique
- Push vers EspoCRM / Mautic

**Endpoints :**
- `POST /api/tasks/scrape` — Scraping async
- `POST /api/tasks/batch` — Batch async
- `GET /api/tasks/{task_id}` — Statut d'une tache

### 6. Automation (n8n)
Workflows pre-configures :
- Scrape > Enrich > CRM Pipeline
- Import dans n8n depuis `/automation/workflows/`

## Integrations

```
Scraper ──────> CRM (import leads)
   |              |
   v              v
   AI ──────> Email Marketing
   |              |
   v              v
EspoCRM <───> Mautic
   |              |
   +──── n8n ─────+
         (orchestration)
```

## Monitoring

- **Prometheus** : collecte les metriques (`/metrics`)
- **Grafana** : dashboards visuels
- Metriques : nombre de scrapes, prospects, sante de l'app

## Stack technique

| Composant | Technologie |
|-----------|------------|
| Backend | FastAPI (Python) |
| Frontend | React |
| Database | PostgreSQL |
| Cache/Queue | Redis |
| Task Queue | Celery |
| Scraping | Selenium + BeautifulSoup + lxml |
| CRM externe | EspoCRM |
| Email Marketing | Mautic |
| Automation | n8n |
| AI | Ollama (Mistral) / Templates |
| Reverse Proxy | NGINX |
| Monitoring | Prometheus + Grafana |
| Containerisation | Docker + Docker Compose |

## Identifiants par defaut

| Service | User | Password |
|---------|------|----------|
| EspoCRM | admin | admin123 |
| Mautic | admin | admin123 |
| n8n | admin | admin123 |
| Grafana | admin | admin123 |
| PostgreSQL | prospect | prospect123 |

> Changez ces mots de passe dans `.env` avant la mise en production.

## Commandes utiles

```bash
# Tout demarrer
docker compose up -d

# Voir les logs
docker compose logs -f backend

# Rebuild un service
docker compose up -d --build backend

# Arreter tout
docker compose down

# Arreter et supprimer les donnees
docker compose down -v
```
