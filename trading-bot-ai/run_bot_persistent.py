#!/usr/bin/env python3
"""
Wrapper persistente per il bot di trading
Esegue il bot in background e aggiorna i dati per la dashboard
"""

import os
import sys
import time
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Configura le variabili di ambiente
os.environ["MT5_FORCE_SIMULATION"] = "false"
os.environ["ALLOW_SIMULATION_FALLBACK"] = "true"
os.environ["DATA_DIR"] = "/home/ubuntu/trading-bot--project/data"

DATA_DIR = Path("/home/ubuntu/trading-bot--project/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

def initialize_data_files():
    """Crea i file JSON iniziali se non esistono"""
    trades_file = DATA_DIR / "trades.json"
    metrics_file = DATA_DIR / "metrics.json"
    
    if not trades_file.exists():
        trades_file.write_text(json.dumps([], indent=2))
    
    if not metrics_file.exists():
        metrics_file.write_text(json.dumps({
            "balance": 10000.0,
            "equity": 10000.0,
            "margin": 0.0,
            "freeMargin": 10000.0,
            "totalReturn": 0.0,
            "winRate": 0.0,
            "openPositions": 0,
            "trades": 0,
            "timestamp": datetime.now().isoformat()
        }, indent=2))

def run_bot():
    """Esegue il bot di trading"""
    bot_script = Path(__file__).parent / "run_bot.py"
    
    try:
        print(f"[{datetime.now().isoformat()}] Avvio bot di trading...")
        process = subprocess.Popen(
            [sys.executable, str(bot_script)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Leggi l'output del bot
        while True:
            line = process.stdout.readline()
            if not line:
                break
            print(f"[BOT] {line.rstrip()}")
            
            # Controlla se il processo è terminato
            if process.poll() is not None:
                break
        
        # Se il processo è terminato, attendi prima di riavviare
        if process.returncode is not None:
            print(f"[{datetime.now().isoformat()}] Bot terminato con codice {process.returncode}")
            time.sleep(5)
            
    except Exception as e:
        print(f"[ERRORE] {e}")
        time.sleep(5)

def main():
    """Funzione principale"""
    print(f"[{datetime.now().isoformat()}] Inizializzazione bot persistente...")
    initialize_data_files()
    
    # Esegui il bot in loop infinito
    while True:
        run_bot()

if __name__ == "__main__":
    main()
