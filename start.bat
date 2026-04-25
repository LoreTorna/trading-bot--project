@echo off
title Trading Bot Project
color 0A
echo.
echo  ==========================================
echo   Trading Bot Project - Avvio Unificato
echo  ==========================================
echo.

:: Vai nella cartella del progetto (dove si trova questo bat)
cd /d "%~dp0"

:: Controlla se node e' disponibile
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato! Installa da https://nodejs.org
    pause
    exit /b 1
)

:: Controlla se python e' disponibile
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVVISO] Python non trovato - il bot girera' in modalita' simulazione
)

:: Scegli package manager
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    set PKG=pnpm
) else (
    set PKG=npm
)
echo [INFO] Package manager: %PKG%

:: Installa dipendenze se node_modules non esiste
if not exist "node_modules" (
    echo.
    echo [1/3] Installazione dipendenze...
    %PKG% install
    if %errorlevel% neq 0 (
        echo [ERRORE] Installazione dipendenze fallita
        pause
        exit /b 1
    )
)

:: Build
echo.
echo [2/3] Compilazione...
%PKG% run build
if %errorlevel% neq 0 (
    echo [ERRORE] Build fallita
    pause
    exit /b 1
)

:: Avvia server
echo.
echo [3/3] Avvio server...
echo.
echo  Il sito e' disponibile su: http://localhost:3000
echo  Premi Ctrl+C per fermare il server
echo.
set NODE_ENV=production
node dist\index.cjs

pause
