#!/usr/bin/env python3
"""
Setup Script — Installazione dipendenze e configurazione iniziale
"""

import sys
import subprocess
import os
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)

REQUIRED_PACKAGES = [
    "MetaTrader5",    # Connessione reale a MT5 (solo Windows)
    "numpy",
    "pandas",
    "requests",
    "python-dotenv",
]

def check_python_version():
    if sys.version_info < (3, 8):
        logger.error("❌ Python 3.8+ richiesto")
        return False
    logger.info(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} rilevato")
    return True

def install_dependencies():
    logger.info("Installazione dipendenze Python...")
    for package in REQUIRED_PACKAGES:
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", package, "-q"],
                timeout=120
            )
            logger.info(f"  ✅ {package}")
        except Exception as e:
            logger.warning(f"  ⚠️ {package} — {e}")

def create_directories():
    logger.info("Creazione cartelle...")
    base = Path(__file__).parent.parent
    for d in ["logs", "data", "reports", "config", "strategies"]:
        p = base / d
        p.mkdir(exist_ok=True)
        logger.info(f"  ✅ {p}")

def create_env_file():
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        env_path.write_text(
            "HEROFX_LOGIN=923721\n"
            "HEROFX_PASSWORD=Lt020507!\n"
            "HEROFX_SERVER=HeroFx-Trade\n"
            "HEROFX_SYMBOL=XAUUSD.r\n"
            "DEFAULT_LOT=0.1\n"
            "STOP_LOSS_POINTS=20\n"
            "TAKE_PROFIT_POINTS=40\n"
        )
        logger.info("  ✅ .env creato")
    else:
        logger.info("  ℹ️ .env già esiste")

def main():
    logger.info("=" * 60)
    logger.info("Trading Bot — Setup Iniziale")
    logger.info("=" * 60)

    if not check_python_version():
        return False

    install_dependencies()
    create_directories()
    create_env_file()

    logger.info("=" * 60)
    logger.info("✅ Setup completato!")
    logger.info("Prossimo passo: avvia il bot dalla dashboard")
    logger.info("=" * 60)
    return True

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
