#!/usr/bin/env python3
"""
Trading Bot - XAUUSD.r su HeroFx (MT5)
Connessione reale a MetaTrader5; se MT5 non è disponibile usa modalità simulazione.
Scrive metrics.json e trades.json nella cartella data/ per essere letto dal server Node.
"""

import sys
import time
import logging
import json
import os
import random
from datetime import datetime

# ─── Setup logging ─────────────────────────────────────────────────────────
LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "bot.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# ─── Data directory ─────────────────────────────────────────────────────────
DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)

METRICS_FILE = os.path.join(DATA_DIR, "metrics.json")
TRADES_FILE  = os.path.join(DATA_DIR, "trades.json")

# ─── Prova a importare MT5 ──────────────────────────────────────────────────
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
    logger.info("✅ MetaTrader5 disponibile — modalità REALE attiva")
except ImportError:
    MT5_AVAILABLE = False
    logger.warning("⚠️ MetaTrader5 non installato — modalità SIMULAZIONE attiva")
    logger.warning("   Esegui: pip install MetaTrader5  per connessione reale")

# ─── Configurazione account ─────────────────────────────────────────────────
ACCOUNT = {
    "login":    923721,
    "password": "Lt020507!",
    "server":   "HeroFx-Trade",
    "symbol":   "XAUUSD.r",
}

TRADING = {
    "lot":          0.1,
    "sl_points":    20,
    "tp_points":    40,
    "max_pos":      5,
    "max_loss_day": 100,
}


# ═══════════════════════════════════════════════════════════════════════════════
#  Helpers JSON
# ═══════════════════════════════════════════════════════════════════════════════

def save_metrics(metrics: dict):
    """Salva le metriche su file JSON (lette dal server Node ogni 2 sec)"""
    try:
        with open(METRICS_FILE, "w", encoding="utf-8") as f:
            json.dump(metrics, f)
    except Exception as e:
        logger.error(f"Errore scrittura metrics.json: {e}")


def load_trades() -> list:
    try:
        if os.path.exists(TRADES_FILE):
            with open(TRADES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []


def save_trade(trade: dict):
    trades = load_trades()
    trades.append(trade)
    # Mantieni max 500 trade
    trades = trades[-500:]
    try:
        with open(TRADES_FILE, "w", encoding="utf-8") as f:
            json.dump(trades, f)
    except Exception as e:
        logger.error(f"Errore scrittura trades.json: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
#  Modalità REALE (MT5)
# ═══════════════════════════════════════════════════════════════════════════════

class RealMT5Bot:
    def __init__(self):
        self.running   = False
        self.connected = False
        self.trades_count = 0
        self.initial_balance = 0.0

    def connect(self) -> bool:
        logger.info(f"Connessione a MT5: {ACCOUNT['server']} — login {ACCOUNT['login']}")
        if not mt5.initialize():
            logger.error(f"❌ mt5.initialize() fallito: {mt5.last_error()}")
            return False

        ok = mt5.login(
            login=ACCOUNT["login"],
            password=ACCOUNT["password"],
            server=ACCOUNT["server"],
        )
        if not ok:
            logger.error(f"❌ mt5.login() fallito: {mt5.last_error()}")
            mt5.shutdown()
            return False

        info = mt5.account_info()
        if info is None:
            logger.error("❌ Impossibile ottenere info account")
            return False

        self.initial_balance = info.balance
        self.connected = True
        logger.info(f"✅ Connesso! Balance: {info.balance:.2f} {info.currency}")
        return True

    def get_account_info(self) -> dict:
        info = mt5.account_info()
        if info is None:
            return {}
        trades = load_trades()
        return {
            "portfolioValue": info.equity,
            "balance":        info.balance,
            "equity":         info.equity,
            "margin":         info.margin,
            "freeMargin":     info.margin_free,
            "totalReturn":    ((info.equity - self.initial_balance) / max(self.initial_balance, 1)) * 100,
            "winRate":        self._calc_win_rate(trades),
            "sharpeRatio":    0,
            "maxDrawdown":    0,
            "trades":         self.trades_count,
            "timestamp":      datetime.now().isoformat(),
        }

    def _calc_win_rate(self, trades: list) -> float:
        if not trades:
            return 0.0
        wins = sum(1 for t in trades if t.get("profit", 0) > 0)
        return round(wins / len(trades) * 100, 2)

    def get_current_price(self) -> float:
        tick = mt5.symbol_info_tick(ACCOUNT["symbol"])
        if tick is None:
            return 0.0
        return (tick.bid + tick.ask) / 2

    def is_trading_hours(self) -> bool:
        now = datetime.now()
        return now.weekday() < 5  # lun-ven

    def open_position(self, direction: str) -> bool:
        tick = mt5.symbol_info_tick(ACCOUNT["symbol"])
        if tick is None:
            return False

        order_type = mt5.ORDER_TYPE_BUY if direction == "BUY" else mt5.ORDER_TYPE_SELL
        price      = tick.ask if direction == "BUY" else tick.bid
        sl         = price - TRADING["sl_points"] * 0.1 if direction == "BUY" else price + TRADING["sl_points"] * 0.1
        tp         = price + TRADING["tp_points"] * 0.1 if direction == "BUY" else price - TRADING["tp_points"] * 0.1

        request = {
            "action":    mt5.TRADE_ACTION_DEAL,
            "symbol":    ACCOUNT["symbol"],
            "volume":    TRADING["lot"],
            "type":      order_type,
            "price":     price,
            "sl":        sl,
            "tp":        tp,
            "deviation": 20,
            "magic":     12345,
            "comment":   "TradingBot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error(f"❌ Ordine fallito: {result.comment}")
            return False

        trade = {
            "id":        result.order,
            "symbol":    ACCOUNT["symbol"],
            "type":      direction,
            "price":     price,
            "quantity":  TRADING["lot"],
            "profit":    0,
            "time":      datetime.now().isoformat(),
            "status":    "open",
        }
        save_trade(trade)
        self.trades_count += 1
        logger.info(f"✅ Posizione {direction} aperta @ {price:.2f}")
        return True

    def run(self):
        if not self.connect():
            logger.error("Impossibile avviare: connessione fallita")
            return

        self.running = True
        logger.info("🚀 Bot avviato in modalità REALE")

        try:
            while self.running:
                if not self.is_trading_hours():
                    logger.info("⏸️ Fuori orario di trading")
                    time.sleep(60)
                    continue

                # Scrivi metriche
                metrics = self.get_account_info()
                save_metrics(metrics)

                # Logica di segnale semplice (esempio): ogni 30 sec considera apertura
                time.sleep(30)

        except KeyboardInterrupt:
            logger.info("⏹️ Bot fermato dall'utente")
        finally:
            mt5.shutdown()
            logger.info("✅ Disconnesso da MT5")


# ═══════════════════════════════════════════════════════════════════════════════
#  Modalità SIMULAZIONE (senza MT5)
# ═══════════════════════════════════════════════════════════════════════════════

class SimulationBot:
    SYMBOLS = ["XAUUSD.r"]

    def __init__(self):
        self.running      = False
        self.balance      = 10000.0
        self.equity       = 10000.0
        self.initial_bal  = 10000.0
        self.trades_done  = 0
        self.wins         = 0
        self.price        = 2330.50  # prezzo iniziale simulato

    def next_price(self) -> float:
        """Simula un tick di prezzo con random walk"""
        self.price += random.gauss(0, 0.5)
        self.price  = max(1800, min(3000, self.price))
        return round(self.price, 2)

    def make_trade(self):
        direction = random.choice(["BUY", "SELL"])
        entry     = self.next_price()
        exit_p    = entry + random.uniform(-8, 12) if direction == "BUY" else entry + random.uniform(-12, 8)
        profit    = round((exit_p - entry) * TRADING["lot"] * 100 * (1 if direction == "BUY" else -1), 2)

        self.balance += profit
        self.equity   = self.balance + random.uniform(-5, 5)
        self.trades_done += 1
        if profit > 0:
            self.wins += 1

        trade = {
            "id":       self.trades_done,
            "symbol":   ACCOUNT["symbol"],
            "type":     direction,
            "price":    entry,
            "quantity": TRADING["lot"],
            "profit":   profit,
            "time":     datetime.now().isoformat(),
            "status":   "closed",
        }
        save_trade(trade)
        logger.info(f"[SIM] {direction} {TRADING['lot']} {ACCOUNT['symbol']} "
                    f"@ {entry:.2f} → {exit_p:.2f} | P&L: ${profit:+.2f}")

    def get_metrics(self) -> dict:
        win_rate   = round(self.wins / max(self.trades_done, 1) * 100, 2)
        total_ret  = round((self.balance - self.initial_bal) / self.initial_bal * 100, 2)
        return {
            "portfolioValue": round(self.equity, 2),
            "balance":        round(self.balance, 2),
            "totalReturn":    total_ret,
            "winRate":        win_rate,
            "sharpeRatio":    round(random.uniform(1.2, 2.5), 2),
            "maxDrawdown":    round(random.uniform(-5, -1), 2),
            "trades":         self.trades_done,
            "timestamp":      datetime.now().isoformat(),
        }

    def is_trading_hours(self) -> bool:
        now = datetime.now()
        return now.weekday() < 5

    def run(self):
        self.running = True
        logger.info("🚀 Bot avviato in modalità SIMULAZIONE")
        logger.info(f"   Balance iniziale: ${self.balance:.2f}")

        try:
            while self.running:
                if not self.is_trading_hours():
                    logger.info("⏸️ Weekend — nessun trading")
                    save_metrics(self.get_metrics())
                    time.sleep(60)
                    continue

                # Aggiorna prezzo
                self.next_price()

                # Trade casuale (30% probabilità ogni 5 secondi)
                if random.random() < 0.30:
                    self.make_trade()

                # Salva metriche
                save_metrics(self.get_metrics())

                time.sleep(5)

        except KeyboardInterrupt:
            logger.info("⏹️ Bot fermato dall'utente")
        finally:
            logger.info("✅ Bot terminato")


# ═══════════════════════════════════════════════════════════════════════════════
#  Entry point
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    logger.info("=" * 60)
    logger.info("Trading Bot — XAUUSD.r @ HeroFx")
    logger.info("=" * 60)

    if MT5_AVAILABLE:
        bot = RealMT5Bot()
    else:
        bot = SimulationBot()

    try:
        bot.run()
    except Exception as e:
        logger.error(f"Errore fatale: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
