@echo off
REM ══════════════════════════════════════════════════════════════════════
REM Sales Prospecting Platform - Installation Windows
REM ══════════════════════════════════════════════════════════════════════

echo =========================================
echo   Sales Prospecting Platform - Install
echo =========================================

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Docker n'est pas installe.
    echo Installez Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

REM Create .env if not exists
if not exist .env (
    echo Creation du fichier .env...
    copy .env.example .env
    echo IMPORTANT: Editez .env avec vos mots de passe!
)

echo.
echo Demarrage de tous les services...
echo.

docker compose up -d --build

echo.
echo =========================================
echo   Installation terminee !
echo =========================================
echo.
echo Services disponibles :
echo   - Application:    http://localhost
echo   - Backend API:    http://localhost:8000
echo   - Frontend:       http://localhost:3000
echo   - EspoCRM:        http://localhost/crm
echo   - Mautic:         http://localhost/mautic
echo   - n8n:            http://localhost:5678
echo   - Grafana:        http://localhost:3001
echo   - Prometheus:     http://localhost:9090
echo.
echo Identifiants par defaut : admin / admin123
echo.
echo Pour arreter: docker compose down
echo Pour les logs: docker compose logs -f
echo.
pause
