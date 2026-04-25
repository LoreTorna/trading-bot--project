@echo off
title Trading Bot Project
color 0A
echo.
echo  ==========================================
echo   Trading Bot Project - Avvio Unificato
echo  ==========================================
echo.

:: Entra nella directory del file bat
cd /d "%~dp0"

:: Controlla node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato!
    echo Scarica da: https://nodejs.org
    pause & exit /b 1
)

:: Controlla python (non bloccante)
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Python trovato - connessione MT5 disponibile
) else (
    echo [AVVISO] Python non trovato - il bot usera' la modalita' simulazione
)

echo.
echo [1/3] Installazione dipendenze...
if exist node_modules (
    echo       node_modules esistente, skip install
) else (
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [ERRORE] npm install fallito
        pause & exit /b 1
    )
)

echo.
echo [2/3] Compilazione...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRORE] Build fallita
    pause & exit /b 1
)

echo.
echo [3/3] Avvio server...
echo.
echo  ==========================================
echo   Apri il browser su: http://localhost:3000
echo   Premi Ctrl+C per fermare
echo  ==========================================
echo.

set NODE_ENV=production
node dist\index.cjs

pause
