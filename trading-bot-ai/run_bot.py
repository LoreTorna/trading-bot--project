#!/usr/bin/env python3
"""Live or simulated full-scalping runtime for HeroFx / MetaTrader 5."""

import argparse
import json
import logging
import math
import os
import random
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from trading_config import (
    SCALPING_INDICATORS,
    get_symbol_profile,
    is_symbol_tradable,
    market_state,
    parse_symbol_csv,
    resolve_live_symbols,
)
from strategy_m15_advanced import SessionFilter, StructureAnalyzer


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


@dataclass
class RuntimeConfig:
    max_open_positions: int
    max_daily_loss: float
    max_trades_per_day: int
    poll_seconds: int
    deviation_points: int
    magic_base: int
    use_risk_lot: bool


@dataclass
class TradeSignal:
    symbol: str
    direction: str
    price: float
    stop_loss: float
    take_profit: float
    atr: float
    rsi: float
    strength: int
    reason: str


ACCOUNT = AccountConfig(
    login=env_int("HEROFX_LOGIN", 923721),
    password=os.environ.get("HEROFX_PASSWORD", ""),
    server=os.environ.get("HEROFX_SERVER", "HeroFx-Trade"),
)

RUNTIME = RuntimeConfig(
    max_open_positions=env_int("MAX_OPEN_POSITIONS", 3),
    max_daily_loss=env_float("MAX_DAILY_LOSS", 100.0),
    max_trades_per_day=env_int("MAX_TRADES_PER_DAY", 30),
    poll_seconds=max(env_int("BOT_POLL_SECONDS", 3), 1),
    deviation_points=env_int("ORDER_DEVIATION_POINTS", 30),
    magic_base=env_int("BOT_MAGIC_BASE", 552600),
    use_risk_lot=env_bool("USE_RISK_LOT", True),
)


def write_json(path: Path, payload: Any) -> None:
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp_path.replace(path)


def load_trades() -> List[Dict[str, Any]]:
    try:
        if TRADES_FILE.exists():
            payload = json.loads(TRADES_FILE.read_text(encoding="utf-8"))
            if isinstance(payload, list):
                return payload
    except Exception:
        logger.warning("Unable to parse trades file, recreating it.")
    return []


def save_trade(trade: Dict[str, Any]) -> None:
    trades = load_trades()
    trades.append(trade)
    write_json(TRADES_FILE, trades[-700:])


def save_metrics(metrics: Dict[str, Any]) -> None:
    write_json(METRICS_FILE, metrics)


def should_use_real_mt5() -> bool:
    if env_bool("MT5_FORCE_SIMULATION", False):
        logger.warning("MT5_FORCE_SIMULATION=true; simulation mode forced.")
        return False

    if not ACCOUNT.password.strip():
        logger.warning("HEROFX_PASSWORD is empty; attempting to attach to an existing live MT5 session.")

    return True


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        parsed = float(value)
        if math.isfinite(parsed):
            return parsed
    except (TypeError, ValueError):
        pass
    return default


def lot_size_for_symbol(symbol: str) -> float:
    override = env_float("DEFAULT_LOT", -1)
    if override > 0:
        return override
    return get_symbol_profile(symbol).default_lot_size


def round_price(symbol: str, value: float) -> float:
    return round(value, get_symbol_profile(symbol).price_precision)


def build_symbol_snapshot(
    active_symbols: List[str],
    trades: List[Dict[str, Any]],
    prices: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    snapshot = {}
    now = datetime.now()

    for symbol in active_symbols:
        profile = get_symbol_profile(symbol)
        symbol_trades = [trade for trade in trades if trade.get("symbol") == symbol]
        symbol_profit = sum(
            safe_float(trade.get("profit", trade.get("pnl", 0)))
            for trade in symbol_trades
            if str(trade.get("status", "")).lower() == "closed"
        )
        snapshot[symbol] = {
            "label": profile.label,
            "marketState": market_state(symbol, now),
            "weekendTrading": profile.weekend_trading,
            "trades": len(symbol_trades),
            "pnl": round(symbol_profit, 2),
            "price": round_price(
                symbol,
                safe_float((prices or {}).get(symbol), profile.simulation_start_price),
            ),
            "strategy": "M1/M5 EMA RSI Bollinger ATR scalping",
        }

    return snapshot


def today_realized_pnl(trades: List[Dict[str, Any]]) -> float:
    today = datetime.now().date().isoformat()
    realized = 0.0
    for trade in trades:
        trade_time = str(trade.get("time", ""))
        if not trade_time.startswith(today):
            continue
        if str(trade.get("status", "")).lower() != "closed":
            continue
        realized += safe_float(trade.get("profit", trade.get("pnl", 0)))
    return realized


def today_trade_count(trades: List[Dict[str, Any]], symbol: Optional[str] = None) -> int:
    today = datetime.now().date().isoformat()
    return sum(
        1
        for trade in trades
        if str(trade.get("time", "")).startswith(today)
        and (symbol is None or trade.get("symbol") == symbol)
    )


def ema_series(values: Sequence[float], period: int) -> List[float]:
    if len(values) < period:
        return []

    multiplier = 2.0 / (period + 1)
    ema_values = [sum(values[:period]) / period]
    for value in values[period:]:
        ema_values.append((value - ema_values[-1]) * multiplier + ema_values[-1])
    return ema_values


def rsi_value(values: Sequence[float], period: int = 14) -> float:
    if len(values) <= period:
        return 50.0

    gains: List[float] = []
    losses: List[float] = []
    deltas = [values[index] - values[index - 1] for index in range(1, len(values))]

    for delta in deltas[:period]:
        gains.append(max(delta, 0.0))
        losses.append(abs(min(delta, 0.0)))

    average_gain = sum(gains) / period
    average_loss = sum(losses) / period

    for delta in deltas[period:]:
        gain = max(delta, 0.0)
        loss = abs(min(delta, 0.0))
        average_gain = ((average_gain * (period - 1)) + gain) / period
        average_loss = ((average_loss * (period - 1)) + loss) / period

    if average_loss == 0:
        return 100.0

    relative_strength = average_gain / average_loss
    return 100.0 - (100.0 / (1.0 + relative_strength))


def bollinger_bands(
    values: Sequence[float],
    period: int,
    deviation: float,
) -> Tuple[float, float, float]:
    if len(values) < period:
        latest = values[-1] if values else 0.0
        return latest, latest, latest

    window = values[-period:]
    middle = sum(window) / period
    variance = sum((value - middle) ** 2 for value in window) / period
    width = math.sqrt(variance) * deviation
    return middle - width, middle, middle + width


def atr_value(
    highs: Sequence[float],
    lows: Sequence[float],
    closes: Sequence[float],
    period: int,
) -> float:
    if len(closes) <= period or len(highs) != len(lows) or len(lows) != len(closes):
        return 0.0

    true_ranges: List[float] = []
    for index in range(1, len(closes)):
        true_ranges.append(
            max(
                highs[index] - lows[index],
                abs(highs[index] - closes[index - 1]),
                abs(lows[index] - closes[index - 1]),
            )
        )

    if len(true_ranges) < period:
        return 0.0

    return sum(true_ranges[-period:]) / period


def vwap_deviation(closes: Sequence[float], highs: Sequence[float], lows: Sequence[float], volumes: Sequence[float], period: int = 20) -> float:
    if len(closes) < period:
        return 0.0
    
    typical_prices = [(highs[i] + lows[i] + closes[i]) / 3 for i in range(len(closes))]
    cum_vol = sum(volumes[-period:])
    if cum_vol == 0:
        return 0.0
    
    vwap = sum(typical_prices[-period:][i] * volumes[-period:][i] for i in range(period)) / cum_vol
    current_price = closes[-1]
    return (current_price - vwap) / vwap * 100

def stochastic_oscillator(closes: Sequence[float], highs: Sequence[float], lows: Sequence[float], k_period: int = 14, d_period: int = 3, slowing: int = 3) -> Tuple[float, float]:
    if len(closes) < k_period + d_period + slowing:
        return 50.0, 50.0

    fast_k = []
    for i in range(len(closes) - d_period - slowing, len(closes)):
        window_high = max(highs[i - k_period + 1:i + 1])
        window_low = min(lows[i - k_period + 1:i + 1])
        if window_high == window_low:
            fast_k.append(50.0)
        else:
            fast_k.append(100 * ((closes[i] - window_low) / (window_high - window_low)))
            
    slow_k_val = sum(fast_k[-slowing:]) / slowing
    
    fast_k_history = [sum(fast_k[i-slowing:i])/slowing for i in range(slowing, len(fast_k)+1)]
    if len(fast_k_history) >= d_period:
        slow_d_val = sum(fast_k_history[-d_period:]) / d_period
    else:
        slow_d_val = slow_k_val

    return slow_k_val, slow_d_val

def detect_candle_patterns(opens: Sequence[float], highs: Sequence[float], lows: Sequence[float], closes: Sequence[float]) -> str:
    if len(closes) < 3:
        return "none"
        
    c_open, c_high, c_low, c_close = opens[-1], highs[-1], lows[-1], closes[-1]
    p_open, p_high, p_low, p_close = opens[-2], highs[-2], lows[-2], closes[-2]
    
    body = abs(c_close - c_open)
    upper_wick = c_high - max(c_open, c_close)
    lower_wick = min(c_open, c_close) - c_low
    total_len = c_high - c_low
    
    if total_len == 0:
        return "none"
        
    if p_close < p_open and c_close > c_open and c_close > p_open and c_open < p_close:
        return "bullish_engulfing"
        
    if p_close > p_open and c_close < c_open and c_close < p_open and c_open > p_close:
        return "bearish_engulfing"
        
    if lower_wick > body * 2 and upper_wick < body * 0.5:
        return "bullish_pinbar"
        
    if upper_wick > body * 2 and lower_wick < body * 0.5:
        return "bearish_pinbar"
        
    return "none"

def calculate_ai_confidence(score_percent: float, rsi: float, volume_spike: bool, pattern: str, session_multiplier: float, trend_alignment: bool) -> float:
    confidence = score_percent * 0.4
    
    if rsi < 30 or rsi > 70:
        confidence += 0.15
        
    if volume_spike:
        confidence += 0.15
        
    if pattern in ["bullish_engulfing", "bearish_engulfing", "bullish_pinbar", "bearish_pinbar"]:
        confidence += 0.15
        
    if trend_alignment:
        confidence += 0.10
        
    confidence *= session_multiplier
    return min(1.0, confidence)


def extract_ohlc(rates: Iterable[Any]) -> Tuple[List[float], List[float], List[float], List[float]]:
    opens: List[float] = []
    highs: List[float] = []
    lows: List[float] = []
    closes: List[float] = []

    for rate in rates:
        opens.append(safe_float(rate["open"]))
        highs.append(safe_float(rate["high"]))
        lows.append(safe_float(rate["low"]))
        closes.append(safe_float(rate["close"]))

    return opens, highs, lows, closes


try:
    import MetaTrader5 as mt5  # type: ignore

    MT5_IMPORTED = True
except ImportError:
    mt5 = None
    MT5_IMPORTED = False


class RealMT5Bot:
    def __init__(self, active_symbols: List[str]) -> None:
        self.active_symbols = active_symbols
        self.running = False
        self.connected = False
        self.initial_balance = 0.0
        self.last_trade_attempt: Dict[str, float] = {}
        self.last_signal_reason: Dict[str, str] = {}
        self.magic_by_symbol = {
            symbol: RUNTIME.magic_base + index for index, symbol in enumerate(active_symbols)
        }
        self.structure_analyzer = StructureAnalyzer(lookback_bars=100)

    def resolve_terminal_path(self) -> Optional[str]:
        explicit_path = os.environ.get("MT5_TERMINAL_PATH", "").strip().strip("\"'")
        if explicit_path and Path(explicit_path).exists():
            return explicit_path

        candidates = [
            r"C:\Program Files\MetaTrader 5\terminal64.exe",
            r"C:\Program Files\MetaTrader 5\terminal.exe",
            r"C:\Program Files (x86)\MetaTrader 5\terminal64.exe",
            r"C:\Program Files (x86)\MetaTrader 5\terminal.exe",
            r"C:\Program Files\HeroFX MetaTrader 5\terminal64.exe",
            r"C:\Program Files\HeroFx MetaTrader 5\terminal64.exe",
            r"C:\Program Files\HeroFX MetaTrader 5 Terminal\terminal64.exe",
            r"C:\Program Files\HeroFx MetaTrader 5 Terminal\terminal64.exe",
        ]

        for candidate in candidates:
            if Path(candidate).exists():
                return candidate

        if os.name == "nt":
            program_dirs = [
                os.environ.get("ProgramFiles", ""),
                os.environ.get("ProgramFiles(x86)", ""),
                os.environ.get("LOCALAPPDATA", ""),
            ]
            for base_dir in program_dirs:
                if not base_dir:
                    continue
                base_path = Path(base_dir)
                try:
                    for terminal in base_path.glob("**/terminal64.exe"):
                        lowered = str(terminal).lower()
                        if "metatrader" in lowered or "herofx" in lowered or "hero" in lowered:
                            return str(terminal)
                except OSError:
                    continue

        return None

    def launch_terminal(self) -> Optional[str]:
        terminal_path = self.resolve_terminal_path()
        if not terminal_path:
            logger.warning(
                "MT5 terminal path not found. Set MT5_TERMINAL_PATH in .env if initialize fails."
            )
            return None

        try:
            logger.info("Opening MetaTrader 5 terminal: %s", terminal_path)
            subprocess.Popen(
                [terminal_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                close_fds=True,
            )
            time.sleep(env_int("MT5_BOOT_SECONDS", 4))
        except Exception as error:
            logger.warning("Unable to pre-launch MT5 terminal: %s", error)

        return terminal_path

    def initialize_mt5(self, terminal_path: Optional[str]) -> bool:
        if mt5 is None:
            return False

        if terminal_path:
            if mt5.initialize(path=terminal_path):
                return True
            logger.warning("mt5.initialize(path=...) failed: %s", mt5.last_error())

        if mt5.initialize():
            return True

        logger.error("mt5.initialize failed: %s", mt5.last_error())
        return False

    def connect(self) -> bool:
        if not MT5_IMPORTED or mt5 is None:
            logger.error("MetaTrader5 package is not available.")
            return False

        logger.info("Connecting to MT5 server %s with login %s", ACCOUNT.server, ACCOUNT.login)
        terminal_path = self.launch_terminal()

        if not self.initialize_mt5(terminal_path):
            return False

        account_info = mt5.account_info()
        if account_info is not None and account_info.login == ACCOUNT.login:
            logger.info("Already logged into the correct MT5 account (%s).", ACCOUNT.login)
        else:
            if ACCOUNT.password:
                if not mt5.login(login=ACCOUNT.login, password=ACCOUNT.password, server=ACCOUNT.server):
                    logger.error("mt5.login failed: %s", mt5.last_error())
                    mt5.shutdown()
                    return False
            else:
                logger.warning("HEROFX_PASSWORD is empty. Attempting to use existing MT5 session.")
                if account_info is None:
                    logger.error("Not logged into MT5 and no password provided in .env.")
                    mt5.shutdown()
                    return False
                elif account_info.login != ACCOUNT.login:
                    logger.error("Logged into wrong MT5 account (%s instead of %s) and no password provided.", account_info.login, ACCOUNT.login)
                    mt5.shutdown()
                    return False

        # Fetch account info again to be sure
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("Unable to load MT5 account information.")
            mt5.shutdown()
            return False

        self.initial_balance = safe_float(account_info.balance, 0.0)
        self.connected = True

        for symbol in self.active_symbols:
            if not mt5.symbol_select(symbol, True):
                logger.warning("Unable to select symbol %s: %s", symbol, mt5.last_error())

        logger.info("Connected to MT5. Active symbols: %s", ", ".join(self.active_symbols))
        return True

    def timeframe(self, name: str) -> int:
        if mt5 is None:
            return 0
        mapping = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
        }
        return mapping.get(name.upper(), mt5.TIMEFRAME_M1)

    def get_rates(self, symbol: str, timeframe_name: str, bars: int) -> Optional[Any]:
        if mt5 is None:
            return None
        return mt5.copy_rates_from_pos(symbol, self.timeframe(timeframe_name), 0, bars)

    def get_price_map(self) -> Dict[str, float]:
        price_map = {}
        if mt5 is None:
            return price_map

        for symbol in self.active_symbols:
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                continue
            price_map[symbol] = (safe_float(tick.bid) + safe_float(tick.ask)) / 2
        return price_map

    def get_account_metrics(self) -> Dict[str, Any]:
        if mt5 is None:
            return {}

        account_info = mt5.account_info()
        if account_info is None:
            return {}

        trades = load_trades()
        closed_trades = [
            trade
            for trade in trades
            if str(trade.get("status", "")).lower() == "closed"
        ]
        wins = sum(1 for trade in closed_trades if safe_float(trade.get("profit", 0)) > 0)
        tradable_symbols = [symbol for symbol in self.active_symbols if is_symbol_tradable(symbol)]
        price_map = self.get_price_map()
        open_positions = sum(len(self.bot_positions(symbol)) for symbol in self.active_symbols)

        return {
            "portfolioValue": round(safe_float(account_info.equity), 2),
            "balance": round(safe_float(account_info.balance), 2),
            "equity": round(safe_float(account_info.equity), 2),
            "margin": round(safe_float(account_info.margin), 2),
            "freeMargin": round(safe_float(account_info.margin_free), 2),
            "totalReturn": round(
                ((safe_float(account_info.equity) - self.initial_balance) / max(self.initial_balance, 1)) * 100,
                2,
            ),
            "winRate": round((wins / max(len(closed_trades), 1)) * 100, 2) if closed_trades else 0.0,
            "sharpeRatio": 0.0,
            "maxDrawdown": 0.0,
            "trades": len(trades),
            "openPositions": open_positions,
            "timestamp": datetime.now().isoformat(),
            "activeSymbols": list(self.active_symbols),
            "tradableSymbols": tradable_symbols,
            "marketStates": {symbol: market_state(symbol) for symbol in self.active_symbols},
            "perSymbol": build_symbol_snapshot(self.active_symbols, trades, price_map),
            "mode": "live",
            "strategy": "full_scalping_m1_m5_ema_rsi_bollinger_atr",
            "lastSignalReason": dict(self.last_signal_reason),
        }

    def current_spread_points(self, symbol: str) -> float:
        if mt5 is None:
            return 0.0

        tick = mt5.symbol_info_tick(symbol)
        symbol_info = mt5.symbol_info(symbol)
        if tick is None or symbol_info is None:
            return 0.0

        point = safe_float(getattr(symbol_info, "point", 0.0), 0.0)
        if point <= 0:
            return 0.0
        return abs(safe_float(tick.ask) - safe_float(tick.bid)) / point

    def min_stop_distance(self, symbol: str) -> float:
        if mt5 is None:
            return 0.0

        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return 0.0

        point = safe_float(getattr(symbol_info, "point", 0.0), 0.0)
        stops_level = safe_float(getattr(symbol_info, "trade_stops_level", 0.0), 0.0)
        return max(point * stops_level, point * 5)

    def calculate_latest_atr(self, symbol: str) -> float:
        rates = self.get_rates(
            symbol,
            "M1",
            max(SCALPING_INDICATORS["history_bars"], 80),
        )
        if rates is None or len(rates) < 30:
            return 0.0
        _opens, highs, lows, closes = extract_ohlc(rates)
        return atr_value(
            highs,
            lows,
            closes,
            int(SCALPING_INDICATORS["atr_period"]),
        )

    def generate_signal(self, symbol: str) -> Optional[TradeSignal]:
        if mt5 is None:
            return None

        profile = get_symbol_profile(symbol)
        history_bars = int(SCALPING_INDICATORS.get("history_bars", 250))
        entry_rates = self.get_rates(symbol, "M1", history_bars)
        trend_rates = self.get_rates(symbol, "M5", history_bars)
        struct_rates = self.get_rates(symbol, "M15", history_bars)

        if entry_rates is None or trend_rates is None or struct_rates is None:
            self.last_signal_reason[symbol] = "missing_rates"
            return None

        if len(entry_rates) < 80 or len(trend_rates) < 80:
            self.last_signal_reason[symbol] = "not_enough_history"
            return None

        opens, highs, lows, closes = extract_ohlc(entry_rates)
        _trend_opens, _trend_highs, _trend_lows, trend_closes = extract_ohlc(trend_rates)
        struct_opens, struct_highs, struct_lows, struct_closes = extract_ohlc(struct_rates)
        
        volumes = [float(getattr(r, "tick_volume", 1)) for r in entry_rates]

        if not closes or not trend_closes:
            return None

        fast_series = ema_series(closes, int(SCALPING_INDICATORS["ema_fast"]))
        slow_series = ema_series(closes, int(SCALPING_INDICATORS["ema_slow"]))
        trend_fast_series = ema_series(trend_closes, int(SCALPING_INDICATORS["trend_ema_fast"]))
        trend_slow_series = ema_series(trend_closes, int(SCALPING_INDICATORS["trend_ema_slow"]))

        if (
            len(fast_series) < 2
            or len(slow_series) < 2
            or len(trend_fast_series) < 2
            or len(trend_slow_series) < 2
        ):
            self.last_signal_reason[symbol] = "indicator_warmup"
            return None

        lower_band, middle_band, upper_band = bollinger_bands(
            closes,
            int(SCALPING_INDICATORS["bollinger_period"]),
            float(SCALPING_INDICATORS["bollinger_deviation"]),
        )
        current_atr = atr_value(highs, lows, closes, int(SCALPING_INDICATORS["atr_period"]))
        tick = mt5.symbol_info_tick(symbol)
        symbol_info = mt5.symbol_info(symbol)
        if tick is None or symbol_info is None:
            self.last_signal_reason[symbol] = "missing_tick_or_symbol_info"
            return None

        point = safe_float(getattr(symbol_info, "point", 0.0), 0.0)
        if point <= 0:
            self.last_signal_reason[symbol] = "invalid_point"
            return None

        spread_points = self.current_spread_points(symbol)
        atr_points = current_atr / point if point > 0 else 0.0
        if spread_points > profile.max_spread_points:
            self.last_signal_reason[symbol] = "spread_filter_%.1f" % spread_points
            return None
        if atr_points < profile.min_atr_points:
            self.last_signal_reason[symbol] = "atr_filter_%.1f" % atr_points
            return None

        close = closes[-1]
        previous_close = closes[-2]
        open_price = opens[-1]
        fast = fast_series[-1]
        previous_fast = fast_series[-2]
        slow = slow_series[-1]
        previous_slow = slow_series[-2]
        trend_fast = trend_fast_series[-1]
        trend_slow = trend_slow_series[-1]
        rsi = rsi_value(closes, int(SCALPING_INDICATORS["rsi_period"]))
        micro_momentum = close - closes[-4] if len(closes) >= 4 else close - previous_close

        stoch_k, stoch_d = stochastic_oscillator(closes, highs, lows, int(SCALPING_INDICATORS.get("stoch_k_period", 14)))
        vwap_dev = vwap_deviation(closes, highs, lows, volumes, int(SCALPING_INDICATORS.get("vwap_period", 20)))
        pattern = detect_candle_patterns(opens, highs, lows, closes)
        
        bos_type, _ = self.structure_analyzer.detect_bos_choch(struct_closes, struct_highs, struct_lows)
        
        current_time = datetime.now()
        session = SessionFilter.get_current_session(current_time)
        session_multiplier = session.volatility_factor

        avg_vol = sum(volumes[-20:-1])/19 if len(volumes) >= 20 else 1.0
        volume_spike = volumes[-1] > avg_vol * 1.5 if avg_vol > 0 else False

        buy_score = 0
        sell_score = 0
        buy_reasons: List[str] = []
        sell_reasons: List[str] = []
        
        max_score = 7

        if previous_fast <= previous_slow and fast > slow:
            buy_score += 1
            buy_reasons.append("ema_cross_up")
        if previous_fast >= previous_slow and fast < slow:
            sell_score += 1
            sell_reasons.append("ema_cross_down")

        trend_up = trend_fast > trend_slow
        trend_down = trend_fast < trend_slow
        if trend_up:
            buy_score += 1
            buy_reasons.append("m5_trend_up")
        if trend_down:
            sell_score += 1
            sell_reasons.append("m5_trend_down")

        if rsi < 45:
            buy_score += 1
            buy_reasons.append("rsi_buy")
        if rsi > 55:
            sell_score += 1
            sell_reasons.append("rsi_sell")

        if close <= lower_band or previous_close <= lower_band:
            buy_score += 1
            buy_reasons.append("bb_buy")
        if close >= upper_band or previous_close >= upper_band:
            sell_score += 1
            sell_reasons.append("bb_sell")

        if stoch_k < 20 and stoch_k > stoch_d:
            buy_score += 1
            buy_reasons.append("stoch_buy")
        if stoch_k > 80 and stoch_k < stoch_d:
            sell_score += 1
            sell_reasons.append("stoch_sell")

        if vwap_dev < -0.1:
            buy_score += 1
            buy_reasons.append("vwap_buy")
        if vwap_dev > 0.1:
            sell_score += 1
            sell_reasons.append("vwap_sell")
            
        if bos_type in ["BOS_UP", "CHOCH_UP"]:
            buy_score += 1
            buy_reasons.append(bos_type.lower())
        if bos_type in ["BOS_DOWN", "CHOCH_DOWN"]:
            sell_score += 1
            sell_reasons.append(bos_type.lower())

        threshold = env_int("SCALPING_SIGNAL_THRESHOLD", int(SCALPING_INDICATORS.get("signal_threshold", 3)))
        direction: Optional[str] = None
        reason = ""
        strength = 0
        current_price = 0.0
        ai_conf = 0.0

        if buy_score >= threshold and buy_score > sell_score:
            ai_conf = calculate_ai_confidence(buy_score / max_score, rsi, volume_spike, pattern, session_multiplier, trend_up)
            if ai_conf >= float(SCALPING_INDICATORS.get("ai_confidence_min", 0.55)):
                direction = "BUY"
                reason = ",".join(buy_reasons) + f",ai={ai_conf:.2f}"
                strength = buy_score
                current_price = safe_float(tick.ask)
        elif sell_score >= threshold and sell_score > buy_score:
            ai_conf = calculate_ai_confidence(sell_score / max_score, rsi, volume_spike, pattern, session_multiplier, trend_down)
            if ai_conf >= float(SCALPING_INDICATORS.get("ai_confidence_min", 0.55)):
                direction = "SELL"
                reason = ",".join(sell_reasons) + f",ai={ai_conf:.2f}"
                strength = sell_score
                current_price = safe_float(tick.bid)

        if direction is None or current_price <= 0:
            self.last_signal_reason[symbol] = "no_signal b%s/s%s ai=%.2f" % (
                buy_score,
                sell_score,
                ai_conf,
            )
            return None

        min_stop = self.min_stop_distance(symbol)
        percent_floor = current_price * (profile.stop_loss_percent / 100.0) * 0.35
        stop_distance = max(current_atr * profile.atr_stop_multiplier, percent_floor, min_stop)
        target_distance = max(
            current_atr * profile.atr_target_multiplier,
            stop_distance * 1.5,
            current_price * (profile.take_profit_percent / 100.0) * 0.35,
        )

        if direction == "BUY":
            stop_loss = current_price - stop_distance
            take_profit = current_price + target_distance
        else:
            stop_loss = current_price + stop_distance
            take_profit = current_price - target_distance

        self.last_signal_reason[symbol] = "%s strength=%s ai=%.2f atr_pts=%.1f" % (
            direction,
            strength,
            ai_conf,
            atr_points,
        )

        return TradeSignal(
            symbol=symbol,
            direction=direction,
            price=round_price(symbol, current_price),
            stop_loss=round_price(symbol, stop_loss),
            take_profit=round_price(symbol, take_profit),
            atr=current_atr,
            rsi=rsi,
            strength=strength,
            reason=reason,
        )

    def magic_for_symbol(self, symbol: str) -> int:
        return self.magic_by_symbol.get(symbol, RUNTIME.magic_base)

    def bot_positions(self, symbol: str) -> List[Any]:
        if mt5 is None:
            return []

        positions = mt5.positions_get(symbol=symbol)
        if positions is None:
            return []

        magic = self.magic_for_symbol(symbol)
        return [
            position
            for position in positions
            if int(getattr(position, "magic", 0)) == magic
        ]

    def current_symbol_positions(self, symbol: str) -> int:
        return len(self.bot_positions(symbol))

    def round_volume(self, symbol: str, proposed_volume: float) -> float:
        if mt5 is None:
            return proposed_volume

        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return proposed_volume

        step = safe_float(getattr(symbol_info, "volume_step", 0.01), 0.01)
        minimum = safe_float(getattr(symbol_info, "volume_min", 0.01), 0.01)
        maximum = min(
            safe_float(getattr(symbol_info, "volume_max", 100.0), 100.0),
            env_float("MAX_LOT", 100.0),
        )

        if step <= 0:
            step = 0.01

        value = min(max(proposed_volume, minimum), maximum)
        decimals = max(0, int(round(-math.log10(step)))) if step < 1 else 0
        return round(round(value / step) * step, decimals)

    def calculate_volume(self, symbol: str, signal: TradeSignal) -> float:
        fixed_lot = env_float("DEFAULT_LOT", -1)
        if fixed_lot > 0 or not RUNTIME.use_risk_lot or mt5 is None:
            return self.round_volume(symbol, lot_size_for_symbol(symbol))

        account_info = mt5.account_info()
        symbol_info = mt5.symbol_info(symbol)
        if account_info is None or symbol_info is None:
            return self.round_volume(symbol, lot_size_for_symbol(symbol))

        profile = get_symbol_profile(symbol)
        risk_percent = env_float("RISK_PERCENT_PER_TRADE", profile.risk_percent)
        risk_cash = safe_float(account_info.balance, 0.0) * (risk_percent / 100.0)
        stop_distance = abs(signal.price - signal.stop_loss)
        tick_size = safe_float(getattr(symbol_info, "trade_tick_size", 0.0), 0.0)
        tick_value = safe_float(getattr(symbol_info, "trade_tick_value", 0.0), 0.0)

        if risk_cash <= 0 or stop_distance <= 0 or tick_size <= 0 or tick_value <= 0:
            return self.round_volume(symbol, lot_size_for_symbol(symbol))

        loss_per_lot = (stop_distance / tick_size) * tick_value
        if loss_per_lot <= 0:
            return self.round_volume(symbol, lot_size_for_symbol(symbol))

        return self.round_volume(symbol, risk_cash / loss_per_lot)

    def order_send_with_fillings(self, request: Dict[str, Any]) -> Optional[Any]:
        if mt5 is None:
            return None

        filling_values = [
            getattr(mt5, "ORDER_FILLING_IOC", None),
            getattr(mt5, "ORDER_FILLING_FOK", None),
            getattr(mt5, "ORDER_FILLING_RETURN", None),
        ]
        last_result = None
        seen = set()

        for filling in filling_values:
            if filling is None or filling in seen:
                continue
            seen.add(filling)
            request["type_filling"] = filling
            result = mt5.order_send(request)
            last_result = result
            if result is not None and result.retcode == mt5.TRADE_RETCODE_DONE:
                return result

        return last_result

    def close_position(self, symbol: str, position: Any, reason: str) -> bool:
        if mt5 is None:
            return False

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return False

        is_buy = int(getattr(position, "type", -1)) == mt5.POSITION_TYPE_BUY
        close_type = mt5.ORDER_TYPE_SELL if is_buy else mt5.ORDER_TYPE_BUY
        price = safe_float(tick.bid if is_buy else tick.ask)
        volume = safe_float(getattr(position, "volume", 0.0), 0.0)

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": int(getattr(position, "ticket", 0)),
            "symbol": symbol,
            "volume": volume,
            "type": close_type,
            "price": price,
            "deviation": RUNTIME.deviation_points,
            "magic": self.magic_for_symbol(symbol),
            "comment": "FullScalping close %s" % reason,
            "type_time": mt5.ORDER_TIME_GTC,
        }

        result = self.order_send_with_fillings(request)
        if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error(
                "Close failed for %s position %s: %s",
                symbol,
                getattr(position, "ticket", 0),
                getattr(result, "comment", "unknown"),
            )
            return False

        direction = "BUY" if is_buy else "SELL"
        profile = get_symbol_profile(symbol)
        entry_price = safe_float(getattr(position, "price_open", price), price)
        profit = safe_float(getattr(position, "profit", 0.0), 0.0)

        save_trade(
            {
                "id": int(getattr(result, "order", 0) or getattr(position, "ticket", 0)),
                "positionId": int(getattr(position, "ticket", 0)),
                "symbol": symbol,
                "type": direction,
                "price": round_price(symbol, entry_price),
                "entryPrice": round_price(symbol, entry_price),
                "exitPrice": round_price(symbol, price),
                "quantity": round(volume, 4),
                "profit": round(profit, 2),
                "pnl": round(profit, 2),
                "time": datetime.now().isoformat(),
                "status": "closed",
                "mode": "live",
                "strategy": "full_scalping",
                "reason": reason,
                "precision": profile.price_precision,
            }
        )
        logger.info("[LIVE] Closed %s %s %s | P&L: %+0.2f", direction, volume, symbol, profit)
        return True

    def modify_position_stops(self, symbol: str, position: Any, new_sl: float, current_tp: float) -> bool:
        if mt5 is None:
            return False

        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": int(getattr(position, "ticket", 0)),
            "symbol": symbol,
            "sl": round_price(symbol, new_sl),
            "tp": round_price(symbol, current_tp),
            "magic": self.magic_for_symbol(symbol),
            "comment": "FullScalping trail",
        }

        result = mt5.order_send(request)
        return bool(result is not None and result.retcode == mt5.TRADE_RETCODE_DONE)

    def manage_open_positions(self, symbol: str, signal: Optional[TradeSignal]) -> None:
        if mt5 is None:
            return

        positions = self.bot_positions(symbol)
        if not positions:
            return

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return

        atr = signal.atr if signal else self.calculate_latest_atr(symbol)
        if atr <= 0:
            return

        profile = get_symbol_profile(symbol)
        min_stop = self.min_stop_distance(symbol)

        for position in positions:
            is_buy = int(getattr(position, "type", -1)) == mt5.POSITION_TYPE_BUY
            direction = "BUY" if is_buy else "SELL"
            opposite_signal = (
                signal is not None
                and ((direction == "BUY" and signal.direction == "SELL") or (direction == "SELL" and signal.direction == "BUY"))
            )

            if opposite_signal:
                self.close_position(symbol, position, "opposite_signal")
                continue

            open_price = safe_float(getattr(position, "price_open", 0.0), 0.0)
            current_price = safe_float(tick.bid if is_buy else tick.ask)
            current_sl = safe_float(getattr(position, "sl", 0.0), 0.0)
            current_tp = safe_float(getattr(position, "tp", 0.0), 0.0)
            if open_price <= 0 or current_price <= 0:
                continue

            profit_distance = current_price - open_price if is_buy else open_price - current_price
            if profit_distance <= atr * profile.breakeven_atr_multiplier:
                continue

            if is_buy:
                breakeven_sl = open_price + min_stop
                trailing_sl = current_price - (atr * profile.trailing_atr_multiplier)
                candidate_sl = max(breakeven_sl, trailing_sl)
                should_update = current_sl <= 0 or candidate_sl > current_sl + min_stop
            else:
                breakeven_sl = open_price - min_stop
                trailing_sl = current_price + (atr * profile.trailing_atr_multiplier)
                candidate_sl = min(breakeven_sl, trailing_sl)
                should_update = current_sl <= 0 or candidate_sl < current_sl - min_stop

            if should_update:
                if self.modify_position_stops(symbol, position, candidate_sl, current_tp):
                    logger.info(
                        "[LIVE] Trailing stop updated for %s position %s -> %s",
                        symbol,
                        getattr(position, "ticket", 0),
                        round_price(symbol, candidate_sl),
                    )

    def open_position(self, signal: TradeSignal) -> bool:
        if mt5 is None:
            return False

        symbol = signal.symbol
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return False

        order_type = mt5.ORDER_TYPE_BUY if signal.direction == "BUY" else mt5.ORDER_TYPE_SELL
        price = safe_float(tick.ask if signal.direction == "BUY" else tick.bid)
        if price <= 0:
            return False

        price_delta = price - signal.price
        stop_loss = signal.stop_loss + price_delta
        take_profit = signal.take_profit + price_delta
        volume = self.calculate_volume(symbol, signal)
        profile = get_symbol_profile(symbol)

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": order_type,
            "price": price,
            "sl": round_price(symbol, stop_loss),
            "tp": round_price(symbol, take_profit),
            "deviation": RUNTIME.deviation_points,
            "magic": self.magic_for_symbol(symbol),
            "comment": "FullScalping %s" % signal.reason[:18],
            "type_time": mt5.ORDER_TIME_GTC,
        }

        result = self.order_send_with_fillings(request)
        if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error(
                "Order failed for %s: %s retcode=%s",
                symbol,
                getattr(result, "comment", "unknown"),
                getattr(result, "retcode", "n/a"),
            )
            return False

        trade = {
            "id": int(getattr(result, "order", 0)),
            "symbol": symbol,
            "type": signal.direction,
            "price": round_price(symbol, price),
            "entryPrice": round_price(symbol, price),
            "stopLoss": round_price(symbol, stop_loss),
            "takeProfit": round_price(symbol, take_profit),
            "quantity": volume,
            "profit": 0.0,
            "pnl": 0.0,
            "time": datetime.now().isoformat(),
            "status": "open",
            "mode": "live",
            "strategy": "full_scalping",
            "reason": signal.reason,
            "rsi": round(signal.rsi, 2),
            "atr": round(signal.atr, profile.price_precision),
            "strength": signal.strength,
        }
        save_trade(trade)
        logger.info(
            "[LIVE] %s %s %s @ %s | SL %s | TP %s | %s",
            signal.direction,
            volume,
            symbol,
            round_price(symbol, price),
            round_price(symbol, stop_loss),
            round_price(symbol, take_profit),
            signal.reason,
        )
        return True

    def run(self) -> None:
        if not self.connect():
            raise RuntimeError("Unable to connect to MetaTrader 5.")

        self.running = True
        logger.info("Live MT5 full-scalping mode enabled for %s", ", ".join(self.active_symbols))
        logger.info("Strategy: M1 entries, M5 trend, EMA/RSI/Bollinger/ATR, trailing stop.")

        try:
            while self.running:
                trades = load_trades()
                save_metrics(self.get_account_metrics())

                if today_realized_pnl(trades) <= -abs(RUNTIME.max_daily_loss):
                    logger.warning("Daily loss limit reached. No new positions will be opened.")
                    time.sleep(max(RUNTIME.poll_seconds, 10))
                    continue

                if today_trade_count(trades) >= RUNTIME.max_trades_per_day:
                    logger.warning("Max trades per day reached. Waiting for next session.")
                    time.sleep(max(RUNTIME.poll_seconds, 10))
                    continue

                for symbol in self.active_symbols:
                    if not is_symbol_tradable(symbol):
                        self.last_signal_reason[symbol] = "market_closed"
                        continue

                    signal = self.generate_signal(symbol)
                    self.manage_open_positions(symbol, signal)

                    if signal is None:
                        continue

                    if self.current_symbol_positions(symbol) >= RUNTIME.max_open_positions:
                        continue

                    last_attempt = self.last_trade_attempt.get(symbol, 0.0)
                    if time.time() - last_attempt < get_symbol_profile(symbol).cooldown_seconds:
                        continue

                    self.last_trade_attempt[symbol] = time.time()
                    self.open_position(signal)

                time.sleep(RUNTIME.poll_seconds)
        except KeyboardInterrupt:
            logger.info("Bot stopped by user.")
        finally:
            if MT5_IMPORTED and mt5 is not None:
                mt5.shutdown()
            logger.info("MT5 session closed.")


class SimulationBot:
    def __init__(self, active_symbols: List[str]) -> None:
        self.active_symbols = active_symbols
        self.running = False
        self.balance = 10000.0
        self.equity = 10000.0
        self.initial_balance = 10000.0
        self.price_map = {
            symbol: get_symbol_profile(symbol).simulation_start_price
            for symbol in active_symbols
        }
        self.symbol_trade_counts = {symbol: 0 for symbol in active_symbols}
        self.symbol_win_counts = {symbol: 0 for symbol in active_symbols}

    def next_price(self, symbol: str) -> float:
        profile = get_symbol_profile(symbol)
        current_price = self.price_map[symbol]
        current_price += random.gauss(0, profile.simulation_tick_volatility)
        current_price = min(max(current_price, profile.min_price), profile.max_price)
        self.price_map[symbol] = current_price
        return round_price(symbol, current_price)

    def make_trade(self, symbol: str) -> None:
        profile = get_symbol_profile(symbol)
        direction = random.choice(["BUY", "SELL"])
        entry_price = self.next_price(symbol)
        move_percent = random.uniform(
            profile.simulation_trade_move_percent[0],
            profile.simulation_trade_move_percent[1],
        )
        is_winner = random.random() < profile.simulated_win_rate
        signed_move = move_percent if is_winner else -move_percent * random.uniform(0.85, 1.25)
        exposure = max(self.balance, self.initial_balance * 0.7) * profile.capital_exposure
        profit = exposure * (signed_move / 100.0)
        if direction == "BUY":
            exit_price = entry_price * (1 + signed_move / 100.0)
        else:
            exit_price = entry_price * (1 - signed_move / 100.0)

        self.balance += profit
        self.equity = self.balance + random.uniform(-20, 20)
        self.symbol_trade_counts[symbol] += 1
        if profit > 0:
            self.symbol_win_counts[symbol] += 1

        ai_conf = random.uniform(0.55, 0.95)

        trade = {
            "id": "%s-%s" % (symbol.replace(".", "-"), self.symbol_trade_counts[symbol]),
            "symbol": symbol,
            "type": direction,
            "price": round_price(symbol, entry_price),
            "entryPrice": round_price(symbol, entry_price),
            "exitPrice": round_price(symbol, exit_price),
            "quantity": round(lot_size_for_symbol(symbol), 4),
            "profit": round(profit, 2),
            "pnl": round(profit, 2),
            "time": datetime.now().isoformat(),
            "status": "closed",
            "mode": "simulation",
            "strategy": "full_scalping_simulation",
            "reason": f"sim_ai={ai_conf:.2f}",
        }
        save_trade(trade)
        logger.info(
            "[SIM] %s %s %s @ %.2f -> %.2f | P&L: %+0.2f | AI: %.2f",
            direction,
            lot_size_for_symbol(symbol),
            symbol,
            entry_price,
            exit_price,
            profit,
            ai_conf
        )

    def get_metrics(self) -> Dict[str, Any]:
        trades = load_trades()
        total_trades = sum(self.symbol_trade_counts.values())
        total_wins = sum(self.symbol_win_counts.values())
        tradable_symbols = [symbol for symbol in self.active_symbols if is_symbol_tradable(symbol)]
        total_return = ((self.balance - self.initial_balance) / self.initial_balance) * 100

        return {
            "portfolioValue": round(self.equity, 2),
            "balance": round(self.balance, 2),
            "equity": round(self.equity, 2),
            "margin": 0,
            "freeMargin": round(self.balance, 2),
            "totalReturn": round(total_return, 2),
            "winRate": round((total_wins / max(total_trades, 1)) * 100, 2),
            "sharpeRatio": round(random.uniform(1.1, 2.7), 2),
            "maxDrawdown": round(random.uniform(1.5, 9.5), 2),
            "trades": total_trades,
            "openPositions": 0,
            "timestamp": datetime.now().isoformat(),
            "activeSymbols": list(self.active_symbols),
            "tradableSymbols": tradable_symbols,
            "marketStates": {symbol: market_state(symbol) for symbol in self.active_symbols},
            "perSymbol": build_symbol_snapshot(self.active_symbols, trades, self.price_map),
            "mode": "simulation",
            "strategy": "full_scalping_m1_m5_ema_rsi_bollinger_atr",
        }

    def run(self) -> None:
        self.running = True
        logger.info("Simulation scalping mode enabled for %s", ", ".join(self.active_symbols))

        try:
            while self.running:
                tradable_symbols = [symbol for symbol in self.active_symbols if is_symbol_tradable(symbol)]
                for symbol in self.active_symbols:
                    self.next_price(symbol)

                for symbol in tradable_symbols:
                    profile = get_symbol_profile(symbol)
                    if random.random() < profile.trade_probability:
                        self.make_trade(symbol)

                save_metrics(self.get_metrics())
                time.sleep(max(1, RUNTIME.poll_seconds // 2))
        except KeyboardInterrupt:
            logger.info("Bot stopped by user.")
        finally:
            logger.info("Simulation stopped.")


def determine_active_symbols(cli_symbols: List[str]) -> List[str]:
    if cli_symbols:
        return resolve_live_symbols(cli_symbols)

    env_symbols = parse_symbol_csv(os.environ.get("BOT_SYMBOLS", ""))
    if env_symbols:
        return resolve_live_symbols(env_symbols)

    return resolve_live_symbols(parse_symbol_csv(os.environ.get("HEROFX_SYMBOL", "")))


def seed_metrics(active_symbols: List[str]) -> None:
    if not TRADES_FILE.exists():
        write_json(TRADES_FILE, [])

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
            "openPositions": 0,
            "timestamp": datetime.now().isoformat(),
            "activeSymbols": active_symbols,
            "tradableSymbols": [
                symbol for symbol in active_symbols if is_symbol_tradable(symbol)
            ],
            "marketStates": {symbol: market_state(symbol) for symbol in active_symbols},
            "perSymbol": build_symbol_snapshot(active_symbols, load_trades()),
            "mode": "starting",
            "strategy": "full_scalping_m1_m5_ema_rsi_bollinger_atr",
        }
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbols", nargs="*", default=[])
    args = parser.parse_args()

    active_symbols = determine_active_symbols(args.symbols)
    logger.info("=" * 60)
    logger.info("Trading Bot - HeroFx / MT5 full scalping runtime")
    logger.info("Symbols: %s", ", ".join(active_symbols))
    logger.info(
        "Strategy: M1 entries, M5 trend, EMA(%s/%s), RSI(%s), Bollinger(%s, %.1f), ATR(%s)",
        SCALPING_INDICATORS["ema_fast"],
        SCALPING_INDICATORS["ema_slow"],
        SCALPING_INDICATORS["rsi_period"],
        SCALPING_INDICATORS["bollinger_period"],
        SCALPING_INDICATORS["bollinger_deviation"],
        SCALPING_INDICATORS["atr_period"],
    )
    logger.info("=" * 60)

    seed_metrics(active_symbols)

    try:
        use_real_mt5 = should_use_real_mt5()

        if use_real_mt5 and not MT5_IMPORTED:
            if env_bool("ALLOW_SIMULATION_FALLBACK", False):
                logger.warning("MetaTrader5 package not installed. Simulation fallback enabled.")
                use_real_mt5 = False
            else:
                raise RuntimeError(
                    "MetaTrader5 package is not installed. Run setup or set MT5_FORCE_SIMULATION=true."
                )

        if use_real_mt5:
            bot = RealMT5Bot(active_symbols)
            logger.info("MetaTrader5 package available. Live mode requested.")
        else:
            bot = SimulationBot(active_symbols)

        bot.run()
    except Exception as error:
        logger.error("Fatal bot error: %s", error, exc_info=True)
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
                "activeSymbols": active_symbols,
                "tradableSymbols": [],
                "marketStates": {symbol: market_state(symbol) for symbol in active_symbols},
                "perSymbol": build_symbol_snapshot(active_symbols, load_trades()),
                "mode": "error",
                "strategy": "full_scalping_m1_m5_ema_rsi_bollinger_atr",
                "error": str(error),
            }
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
