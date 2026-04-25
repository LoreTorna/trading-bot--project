#!/usr/bin/env python3
"""
Trading bot for XAUUSD.r on HeroFx.

If MetaTrader5 is available and the MT5 credentials are configured, the script
publishes live account metrics. Otherwise it falls back to a simulation mode
that keeps the dashboard and the control panel usable.
"""

from __future__ import annotations

import json
import logging
import os
import random
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = ROOT_DIR / "logs"
DATA_DIR = Path(os.environ.get("DATA_DIR", str(ROOT_DIR / "data")))
ENV_FILE = ROOT_DIR / ".env"
METRICS_FILE = DATA_DIR / "metrics.json"
TRADES_FILE = DATA_DIR / "trades.json"

LOG_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_env_file() -> None:
    if not ENV_FILE.exists():
        return

    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def env_int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, default))
    except (TypeError, ValueError):
        return default


def env_float(key: str, default: float) -> float:
    try:
        return float(os.environ.get(key, default))
    except (TypeError, ValueError):
        return default


def env_bool(key: str, default: bool = False) -> bool:
    raw_value = os.environ.get(key)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


load_env_file()


logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "bot.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


@dataclass
class AccountConfig:
    login: int
    password: str
    server: str
    symbol: str


@dataclass
class TradingConfig:
    lot: float
    sl_points: int
    tp_points: int
    max_pos: int
    max_loss_day: float


ACCOUNT = AccountConfig(
    login=env_int("HEROFX_LOGIN", 923721),
    password=os.environ.get("HEROFX_PASSWORD", ""),
    server=os.environ.get("HEROFX_SERVER", "HeroFx-Trade"),
    symbol=os.environ.get("HEROFX_SYMBOL", "XAUUSD.r"),
)

TRADING = TradingConfig(
    lot=env_float("DEFAULT_LOT", 0.1),
    sl_points=env_int("STOP_LOSS_POINTS", 20),
    tp_points=env_int("TAKE_PROFIT_POINTS", 40),
    max_pos=env_int("MAX_OPEN_POSITIONS", 5),
    max_loss_day=env_float("MAX_DAILY_LOSS", 100.0),
)


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def load_trades() -> list[dict[str, Any]]:
    try:
        if TRADES_FILE.exists():
            return json.loads(TRADES_FILE.read_text(encoding="utf-8"))
    except Exception:
        logger.warning("Unable to parse trades file, recreating it.")
    return []


def save_trade(trade: dict[str, Any]) -> None:
    trades = load_trades()
    trades.append(trade)
    write_json(TRADES_FILE, trades[-500:])


def save_metrics(metrics: dict[str, Any]) -> None:
    write_json(METRICS_FILE, metrics)


def should_use_real_mt5() -> bool:
    if env_bool("MT5_FORCE_SIMULATION", False):
        return False

    if not ACCOUNT.password.strip():
        return False

    return True


try:
    import MetaTrader5 as mt5  # type: ignore

    MT5_IMPORTED = True
except ImportError:
    mt5 = None
    MT5_IMPORTED = False


class RealMT5Bot:
    def __init__(self) -> None:
        self.running = False
        self.connected = False
        self.initial_balance = 0.0
        self.trades_count = 0

    def connect(self) -> bool:
        if not MT5_IMPORTED or mt5 is None:
            logger.error("MetaTrader5 package is not available.")
            return False

        logger.info("Connecting to MT5 server %s with login %s", ACCOUNT.server, ACCOUNT.login)

        if not mt5.initialize():
            logger.error("mt5.initialize failed: %s", mt5.last_error())
            return False

        if not mt5.login(login=ACCOUNT.login, password=ACCOUNT.password, server=ACCOUNT.server):
            logger.error("mt5.login failed: %s", mt5.last_error())
            mt5.shutdown()
            return False

        info = mt5.account_info()
        if info is None:
            logger.error("Unable to load MT5 account information.")
            mt5.shutdown()
            return False

        self.connected = True
        self.initial_balance = float(info.balance)
        logger.info("Connected to MT5. Balance: %.2f %s", info.balance, info.currency)
        return True

    def get_account_metrics(self) -> dict[str, Any]:
        if mt5 is None:
            return {}

        info = mt5.account_info()
        if info is None:
            return {}

        trades = load_trades()
        wins = sum(1 for trade in trades if float(trade.get("profit", 0)) > 0)
        win_rate = round((wins / len(trades)) * 100, 2) if trades else 0.0

        return {
          "portfolioValue": round(float(info.equity), 2),
          "balance": round(float(info.balance), 2),
          "equity": round(float(info.equity), 2),
          "margin": round(float(info.margin), 2),
          "freeMargin": round(float(info.margin_free), 2),
          "totalReturn": round(((float(info.equity) - self.initial_balance) / max(self.initial_balance, 1)) * 100, 2),
          "winRate": win_rate,
          "sharpeRatio": 0,
          "maxDrawdown": 0,
          "trades": len(trades),
          "timestamp": datetime.now().isoformat(),
        }

    def is_trading_hours(self) -> bool:
        return datetime.now().weekday() < 5

    def run(self) -> None:
        if not self.connect():
            raise RuntimeError("Unable to connect to MetaTrader 5.")

        self.running = True
        logger.info("Bot started in MT5 live mode.")

        try:
            while self.running:
                metrics = self.get_account_metrics()
                save_metrics(metrics)

                if not self.is_trading_hours():
                    logger.info("Market closed, waiting for next trading window.")
                    time.sleep(60)
                    continue

                time.sleep(30)
        except KeyboardInterrupt:
            logger.info("Bot stopped by user.")
        finally:
            if MT5_IMPORTED and mt5 is not None:
                mt5.shutdown()
            logger.info("MT5 session closed.")


class SimulationBot:
    def __init__(self) -> None:
        self.running = False
        self.balance = 10000.0
        self.equity = 10000.0
        self.initial_balance = 10000.0
        self.trades_done = 0
        self.wins = 0
        self.price = 2330.50

    def next_price(self) -> float:
        self.price += random.gauss(0, 0.5)
        self.price = max(1800, min(3000, self.price))
        return round(self.price, 2)

    def is_trading_hours(self) -> bool:
        return datetime.now().weekday() < 5

    def make_trade(self) -> None:
        direction = random.choice(["BUY", "SELL"])
        entry = self.next_price()
        exit_price = (
            entry + random.uniform(-8, 12)
            if direction == "BUY"
            else entry + random.uniform(-12, 8)
        )
        profit = round(
            (exit_price - entry) * TRADING.lot * 100 * (1 if direction == "BUY" else -1),
            2,
        )

        self.balance += profit
        self.equity = self.balance + random.uniform(-5, 5)
        self.trades_done += 1
        if profit > 0:
            self.wins += 1

        trade = {
            "id": self.trades_done,
            "symbol": ACCOUNT.symbol,
            "type": direction,
            "price": entry,
            "quantity": TRADING.lot,
            "profit": profit,
            "time": datetime.now().isoformat(),
            "status": "closed",
        }
        save_trade(trade)
        logger.info(
            "[SIM] %s %s %s @ %.2f -> %.2f | P&L: %+0.2f",
            direction,
            TRADING.lot,
            ACCOUNT.symbol,
            entry,
            exit_price,
            profit,
        )

    def get_metrics(self) -> dict[str, Any]:
        win_rate = round((self.wins / max(self.trades_done, 1)) * 100, 2)
        total_return = round(
            ((self.balance - self.initial_balance) / self.initial_balance) * 100,
            2,
        )

        return {
            "portfolioValue": round(self.equity, 2),
            "balance": round(self.balance, 2),
            "equity": round(self.equity, 2),
            "margin": 0,
            "freeMargin": round(self.balance, 2),
            "totalReturn": total_return,
            "winRate": win_rate,
            "sharpeRatio": round(random.uniform(1.0, 2.4), 2),
            "maxDrawdown": round(random.uniform(-5, -1), 2),
            "trades": self.trades_done,
            "timestamp": datetime.now().isoformat(),
        }

    def run(self) -> None:
        self.running = True
        logger.info("Bot started in simulation mode.")

        try:
            while self.running:
                if not self.is_trading_hours():
                    save_metrics(self.get_metrics())
                    logger.info("Weekend detected, waiting for market open.")
                    time.sleep(60)
                    continue

                self.next_price()

                if random.random() < 0.30:
                    self.make_trade()

                save_metrics(self.get_metrics())
                time.sleep(5)
        except KeyboardInterrupt:
            logger.info("Bot stopped by user.")
        finally:
            logger.info("Simulation stopped.")


def main() -> None:
    logger.info("=" * 60)
    logger.info("Trading Bot - XAUUSD.r @ HeroFx")
    logger.info("=" * 60)

    if not TRADES_FILE.exists():
        write_json(TRADES_FILE, [])

    if MT5_IMPORTED and should_use_real_mt5():
        bot = RealMT5Bot()
        logger.info("MetaTrader5 available. Live mode requested.")
    else:
        if MT5_IMPORTED:
            logger.warning("MT5 available but credentials are incomplete. Switching to simulation mode.")
        else:
            logger.warning("MetaTrader5 not installed. Simulation mode enabled.")
        bot = SimulationBot()

    save_metrics(
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
            "trades": len(load_trades()),
            "timestamp": datetime.now().isoformat(),
        }
    )

    try:
        bot.run()
    except Exception as error:
        logger.error("Fatal bot error: %s", error, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
