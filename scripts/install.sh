#!/bin/bash
# ══════════════════════════════════════════════════════════════════════
# Sales Prospecting Platform - Installation automatique
# ══════════════════════════════════════════════════════════════════════

set -e

echo "========================================="
echo "  Sales Prospecting Platform - Install"
echo "========================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERREUR: Docker n'est pas installe."
    echo "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "ERREUR: Docker Compose n'est pas installe."
    exit 1
fi

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Creation du fichier .env a partir de .env.example..."
    cp .env.example .env
    echo "IMPORTANT: Editez .env avec vos mots de passe avant de lancer en production!"
fi

echo ""
echo "Demarrage de tous les services..."
echo ""

# Build and start
docker compose up -d --build

echo ""
echo "========================================="
echo "  Installation terminee !"
echo "========================================="
echo ""
echo "Services disponibles :"
echo "  - Application:    http://localhost"
echo "  - Backend API:    http://localhost:8000"
echo "  - Frontend:       http://localhost:3000"
echo "  - EspoCRM:        http://localhost/crm"
echo "  - Mautic:         http://localhost/mautic"
echo "  - n8n:            http://localhost:5678"
echo "  - Grafana:        http://localhost:3001"
echo "  - Prometheus:     http://localhost:9090"
echo ""
echo "Identifiants par defaut :"
echo "  - EspoCRM:  admin / admin123"
echo "  - Mautic:   admin / admin123"
echo "  - n8n:      admin / admin123"
echo "  - Grafana:  admin / admin123"
echo ""
echo "Pour arreter: docker compose down"
echo "Pour les logs: docker compose logs -f"
