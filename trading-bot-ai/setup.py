#!/usr/bin/env python3
"""
Setup Script - Installazione dipendenze e configurazione iniziale
"""

import sys
import subprocess
import os
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Dipendenze Python richieste
REQUIRED_PACKAGES = [
    'MetaTrader5',      # Connessione a MT5
    'numpy',            # Calcoli numerici
    'pandas',           # Analisi dati
    'requests',         # HTTP requests
    'pyyaml',           # Configurazione YAML
    'python-dotenv',    # Variabili d'ambiente
]

def check_python_version():
    """Verifica versione Python"""
    if sys.version_info < (3, 8):
        logger.error("❌ Python 3.8+ richiesto")
        return False
    
    logger.info(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} rilevato")
    return True

def install_dependencies():
    """Installa le dipendenze Python"""
    logger.info("Installazione dipendenze Python...")
    
    for package in REQUIRED_PACKAGES:
        try:
            logger.info(f"  Installando {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])
            logger.info(f"  ✅ {package} installato")
        except subprocess.CalledProcessError:
            logger.warning(f"  ⚠️ Errore durante l'installazione di {package}")
            # Continua comunque con gli altri pacchetti
    
    logger.info("✅ Installazione dipendenze completata")

def create_directories():
    """Crea le cartelle necessarie"""
    logger.info("Creazione cartelle...")
    
    directories = [
        'logs',
        'data',
        'reports',
        'config',
        'strategies',
        'backtester'
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        logger.info(f"  ✅ Cartella '{directory}' creata")

def create_config_files():
    """Crea i file di configurazione"""
    logger.info("Creazione file di configurazione...")
    
    # File .env
    env_file = Path(".env")
    if not env_file.exists():
        env_content = """# HeroFx Account Configuration
HEROFX_LOGIN=923721
HEROFX_PASSWORD=Lt020507!
HEROFX_SERVER=HeroFx-Trade
HEROFX_SYMBOL=XAUUSD.r

# Trading Parameters
DEFAULT_LOT=0.1
MAX_LOT=100
STOP_LOSS_POINTS=20
TAKE_PROFIT_POINTS=40

# Logging
LOG_LEVEL=INFO
"""
        with open(env_file, 'w') as f:
            f.write(env_content)
        logger.info("  ✅ File .env creato")
    else:
        logger.info("  ℹ️ File .env già esiste")

def main():
    """Esecuzione setup"""
    logger.info("=" * 60)
    logger.info("Trading Bot - Setup Iniziale")
    logger.info("=" * 60)
    
    try:
        # Verifica Python
        if not check_python_version():
            return False
        
        # Installa dipendenze
        install_dependencies()
        
        # Crea cartelle
        create_directories()
        
        # Crea file di configurazione
        create_config_files()
        
        logger.info("=" * 60)
        logger.info("✅ Setup completato con successo!")
        logger.info("=" * 60)
        logger.info("\nProssimi passi:")
        logger.info("1. Modifica il file .env con le tue credenziali")
        logger.info("2. Esegui: python3 run_bot.py")
        logger.info("=" * 60)
        
        return True
    
    except Exception as e:
        logger.error(f"❌ Errore durante il setup: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
