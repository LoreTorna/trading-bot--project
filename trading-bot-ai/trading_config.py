from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Sequence, Tuple


@dataclass(frozen=True)
class SymbolProfile:
    symbol: str
    label: str
    market: str
    description: str
    weekend_trading: bool
    trading_hours_label: str
    default_lot_size: float
    stop_loss_percent: float
    take_profit_percent: float
    price_precision: int
    simulation_start_price: float
    simulation_tick_volatility: float
    simulation_trade_move_percent: Tuple[float, float]
    simulated_win_rate: float
    capital_exposure: float
    daily_return_mean: float
    daily_return_std: float
    min_price: float
    max_price: float
    cooldown_seconds: int
    trade_probability: float
    max_spread_points: float
    min_atr_points: float
    atr_stop_multiplier: float
    atr_target_multiplier: float
    trailing_atr_multiplier: float
    breakeven_atr_multiplier: float
    risk_percent: float


SUPPORTED_SYMBOLS = ("XAUUSD.r", "BTCUSD.r")
DEFAULT_LIVE_SYMBOLS = ("XAUUSD.r",)
DEFAULT_BACKTEST_SYMBOLS = ("XAUUSD.r", "BTCUSD.r")

SCALPING_TIMEFRAMES = {
    "entry": "M1",
    "trend": "M5",
    "structure": "M15",
}

SCALPING_INDICATORS = {
    # EMA
    "ema_fast": 9,
    "ema_slow": 21,
    "trend_ema_fast": 20,
    "trend_ema_slow": 50,
    # RSI
    "rsi_period": 14,
    # Bollinger
    "bollinger_period": 20,
    "bollinger_deviation": 2.0,
    # ATR
    "atr_period": 14,
    # Stochastic
    "stoch_k_period": 14,
    "stoch_d_period": 3,
    "stoch_slowing": 3,
    # VWAP
    "vwap_period": 20,
    # Candle patterns
    "pattern_lookback": 3,
    # Bars to fetch
    "history_bars": 250,
    # AI filter
    "ai_confidence_min": 0.40,
    "signal_threshold": 2,
}

SYMBOL_PROFILES = {
    "XAUUSD.r": SymbolProfile(
        symbol="XAUUSD.r",
        label="Gold",
        market="metal",
        description="Metallo spot con operativita feriale H23.",
        weekend_trading=False,
        trading_hours_label="H23 / 5 giorni",
        default_lot_size=0.50,
        stop_loss_percent=0.35,
        take_profit_percent=0.85,
        price_precision=2,
        simulation_start_price=2330.5,
        simulation_tick_volatility=1.2,
        simulation_trade_move_percent=(0.12, 0.55),
        simulated_win_rate=0.63,
        capital_exposure=0.25,
        daily_return_mean=0.0035,
        daily_return_std=0.025,
        min_price=1800,
        max_price=3200,
        cooldown_seconds=2,
        trade_probability=0.85,
        max_spread_points=120,
        min_atr_points=5,
        atr_stop_multiplier=0.6,
        atr_target_multiplier=3.0,
        trailing_atr_multiplier=0.4,
        breakeven_atr_multiplier=0.3,
        risk_percent=3.5,
    ),
    "BTCUSD.r": SymbolProfile(
        symbol="BTCUSD.r",
        label="Bitcoin",
        market="crypto",
        description="Asset crypto sempre attivo, incluso il weekend.",
        weekend_trading=True,
        trading_hours_label="H24 / 7 giorni",
        default_lot_size=0.15,
        stop_loss_percent=0.85,
        take_profit_percent=1.80,
        price_precision=2,
        simulation_start_price=65000.0,
        simulation_tick_volatility=350.0,
        simulation_trade_move_percent=(0.20, 0.85),
        simulated_win_rate=0.62,
        capital_exposure=0.20,
        daily_return_mean=0.0035,
        daily_return_std=0.040,
        min_price=15000,
        max_price=140000,
        cooldown_seconds=2,
        trade_probability=0.85,
        max_spread_points=3500,
        min_atr_points=150,
        atr_stop_multiplier=0.6,
        atr_target_multiplier=3.0,
        trailing_atr_multiplier=0.5,
        breakeven_atr_multiplier=0.4,
        risk_percent=2.5,
    ),
}  # type: Dict[str, SymbolProfile]


def parse_symbol_csv(raw_value: str) -> List[str]:
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def normalize_symbols(
    raw_symbols: Optional[Sequence[str]],
    fallback: Sequence[str],
) -> List[str]:
    normalized: List[str] = []
    seen = set()

    for symbol in list(raw_symbols or []):
        if symbol not in SYMBOL_PROFILES or symbol in seen:
            continue
        seen.add(symbol)
        normalized.append(symbol)

    return normalized or list(fallback)


def resolve_live_symbols(raw_symbols: Optional[Sequence[str]]) -> List[str]:
    return normalize_symbols(raw_symbols, DEFAULT_LIVE_SYMBOLS)


def resolve_backtest_symbols(raw_symbols: Optional[Sequence[str]]) -> List[str]:
    return normalize_symbols(raw_symbols, DEFAULT_BACKTEST_SYMBOLS)


def get_symbol_profile(symbol: str) -> SymbolProfile:
    if symbol in SYMBOL_PROFILES:
        return SYMBOL_PROFILES[symbol]
    return SYMBOL_PROFILES[DEFAULT_LIVE_SYMBOLS[0]]


def is_symbol_tradable(symbol: str, reference_date: Optional[datetime] = None) -> bool:
    profile = get_symbol_profile(symbol)
    if profile.weekend_trading:
        return True

    current_date = reference_date or datetime.now()
    return current_date.weekday() < 5


def market_state(symbol: str, reference_date: Optional[datetime] = None) -> str:
    return "open" if is_symbol_tradable(symbol, reference_date) else "weekend"
