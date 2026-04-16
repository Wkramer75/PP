@echo off
title Sales Prospecting Platform

REM Check if Docker is running
docker info >NUL 2>&1
if errorlevel 1 (
    echo Lancement de Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Attente de Docker...
    :wait_docker
    timeout /t 3 /nobreak >NUL
    docker info >NUL 2>&1
    if errorlevel 1 goto wait_docker
    echo Docker OK !
)

REM Check if containers are already running
docker compose -f "C:\Users\chris\PP\docker-compose.yml" ps --status running 2>NUL | find "backend" >NUL
if errorlevel 1 (
    echo Demarrage des services...
    cd /d C:\Users\chris\PP
    docker compose up -d
    echo Attente du demarrage...
    timeout /t 10 /nobreak >NUL
)

start "" "http://localhost"
