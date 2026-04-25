#!/usr/bin/env python3
"""Initial setup script for the trading bot workspace."""

from __future__ import annotations

import json
import logging
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT_DIR / ".env"
LOG_DIR = ROOT_DIR / "logs"
DATA_DIR = ROOT_DIR / "data"
REPORTS_DIR = ROOT_DIR / "reports"
CONFIG_DIR = ROOT_DIR / "config"
STRATEGIES_DIR = ROOT_DIR / "strategies"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

COMMON_PACKAGES = [
    "numpy",
    "pandas",
    "requests",
]

WINDOWS_ONLY_PACKAGES = [
    "MetaTrader5",
]


def check_python_version() -> bool:
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or newer is required.")
        return False

    logger.info("Python %s.%s detected.", sys.version_info.major, sys.version_info.minor)
    return True


def install_package(package_name: str, optional: bool = False) -> None:
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", package_name, "-q"],
            timeout=180,
        )
        logger.info("Installed package: %s", package_name)
    except Exception as error:
        if optional:
            logger.warning("Optional package skipped (%s): %s", package_name, error)
        else:
            logger.warning("Package installation failed (%s): %s", package_name, error)


def install_dependencies() -> None:
    logger.info("Installing Python dependencies...")
    for package_name in COMMON_PACKAGES:
        install_package(package_name)

    if sys.platform == "win32":
        for package_name in WINDOWS_ONLY_PACKAGES:
            install_package(package_name, optional=True)


def create_directories() -> None:
    logger.info("Creating runtime directories...")
    for directory in [LOG_DIR, DATA_DIR, REPORTS_DIR, CONFIG_DIR, STRATEGIES_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
        logger.info("Ready: %s", directory)


def seed_runtime_files() -> None:
    metrics_file = DATA_DIR / "metrics.json"
    trades_file = DATA_DIR / "trades.json"
    backtest_file = DATA_DIR / "backtest_results.json"

    if not metrics_file.exists():
        metrics_file.write_text(
            json.dumps(
                {
                    "portfolioValue": 10000,
                    "balance": 10000,
                    "equity": 10000,
                    "margin": 0,
                    "freeMargin": 10000,
                    "totalReturn": 0,
                    "winRate": 0,
                    "sharpeRatio": 0,
                    "maxDrawdown": 0,
                    "trades": 0,
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    if not trades_file.exists():
        trades_file.write_text("[]", encoding="utf-8")

    if not backtest_file.exists():
        backtest_file.write_text("{}", encoding="utf-8")


def create_env_file() -> None:
    if ENV_FILE.exists():
        logger.info(".env already present, keeping the existing one.")
        return

    ENV_FILE.write_text(
        "\n".join(
            [
                "# MT5 / HeroFx credentials",
                "HEROFX_LOGIN=923721",
                "HEROFX_PASSWORD=",
                "HEROFX_SERVER=HeroFx-Trade",
                "HEROFX_SYMBOL=XAUUSD.r",
                "",
                "# Bot execution",
                "DEFAULT_LOT=0.1",
                "STOP_LOSS_POINTS=20",
                "TAKE_PROFIT_POINTS=40",
                "MAX_OPEN_POSITIONS=5",
                "MAX_DAILY_LOSS=100",
                "",
                "# Optional overrides",
                "# BOT_PYTHON_PATH=python",
                "# MT5_FORCE_SIMULATION=true",
                "",
            ]
        ),
        encoding="utf-8",
    )
    logger.info("Created .env template.")


def main() -> bool:
    logger.info("=" * 60)
    logger.info("Trading Bot setup")
    logger.info("=" * 60)

    if not check_python_version():
        return False

    install_dependencies()
    create_directories()
    seed_runtime_files()
    create_env_file()

    logger.info("=" * 60)
    logger.info("Setup completed.")
    logger.info("Next step: configure .env and start the bot.")
    logger.info("=" * 60)
    return True


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
