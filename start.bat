@echo off
title Trading Bot Project - Setup & Avvio
color 0A

:: Entra nella directory del file bat
cd /d "%~dp0"

echo ==========================================
echo  Trading Bot Project - Inizializzazione
echo ==========================================

:: Controlla Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato!
    echo Per favore installa Node.js da: https://nodejs.org
    pause
    exit /b 1
)

:: Controlla Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    where python3 >nul 2>&1
    if %errorlevel% neq 0 (
        echo [AVVISO] Python non trovato! 
        echo Il bot di trading richiede Python per funzionare.
        echo Installalo da: https://www.python.org
    )
)

:: Avvia lo script di automazione universale
node start.js

if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] Il processo e terminato con un errore.
    pause
)
