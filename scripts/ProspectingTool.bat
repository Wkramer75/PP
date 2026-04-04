@echo off
title Sales Prospecting Platform
color 0A

echo =========================================
echo   Sales Prospecting Platform
echo =========================================
echo.
echo Demarrage de Docker...
echo.

REM Start Docker Desktop if not running
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I "Docker Desktop.exe" >NUL
if errorlevel 1 (
    echo Lancement de Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Attente du demarrage de Docker (30s)...
    timeout /t 30 /nobreak >NUL
)

REM Wait for Docker to be ready
echo Verification de Docker...
:wait_docker
docker info >NUL 2>&1
if errorlevel 1 (
    echo Docker pas encore pret, attente...
    timeout /t 5 /nobreak >NUL
    goto wait_docker
)
echo Docker OK !

echo.
echo Demarrage des services...
cd /d C:\Users\chris\PP
docker compose up -d --build

echo.
echo Attente du demarrage des services (15s)...
timeout /t 15 /nobreak >NUL

echo.
echo =========================================
echo   Tout est pret !
echo =========================================
echo.
echo Ouverture dans Chrome...

start "" "http://localhost"

echo.
echo Services actifs :
echo   App:       http://localhost
echo   API:       http://localhost:8000/docs
echo   EspoCRM:   http://localhost/crm
echo   Mautic:    http://localhost/mautic
echo   n8n:       http://localhost:5678
echo   Grafana:   http://localhost:3001
echo.
echo Pour arreter : docker compose down
echo Fermer cette fenetre n'arrete PAS les services.
echo.
pause
