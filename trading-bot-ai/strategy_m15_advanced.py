#!/usr/bin/env python3
"""
Advanced M15 Trading Strategy for XAUUSD
Implements: Price Action (BOS/CHOCH), Session Filter, Volume Analysis, Risk Management 1:2.5
"""

import math
from dataclasses import dataclass
from datetime import datetime, time
from typing import Dict, List, Optional, Tuple


@dataclass
class StructureLevel:
    """Rappresenta un livello di supporto/resistenza dinamico"""
    price: float
    type: str  # "support" o "resistance"
    strength: int  # 1-5, basato su numero di test
    last_touch: datetime
    confirmed: bool


@dataclass
class SessionInfo:
    """Informazioni sulla sessione di trading attuale"""
    name: str  # "asia", "london", "newyork"
    is_active: bool
    volatility_factor: float  # 0.5-2.0


@dataclass
class AdvancedSignal:
    """Segnale di trading avanzato con logica di mercato"""
    symbol: str
    direction: str  # "BUY" o "SELL"
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward_ratio: float
    confidence: float  # 0.0-1.0
    reasons: List[str]
    structure_level: Optional[StructureLevel]
    session: SessionInfo
    volume_confirmation: bool


class StructureAnalyzer:
    """Analizza la struttura del mercato: BOS, CHOCH, supporti/resistenze dinamici"""

    def __init__(self, lookback_bars: int = 100):
        self.lookback_bars = lookback_bars
        self.support_levels: List[StructureLevel] = []
        self.resistance_levels: List[StructureLevel] = []

    def identify_swing_highs_lows(
        self, highs: List[float], lows: List[float], window: int = 3
    ) -> Tuple[List[Tuple[int, float]], List[Tuple[int, float]]]:
        """Identifica swing high e swing low"""
        swing_highs: List[Tuple[int, float]] = []
        swing_lows: List[Tuple[int, float]] = []

        for i in range(window, len(highs) - window):
            # Swing High: picco circondato da valori più bassi
            if all(highs[i] > highs[j] for j in range(i - window, i + window + 1) if j != i):
                swing_highs.append((i, highs[i]))

            # Swing Low: minimo circondato da valori più alti
            if all(lows[i] < lows[j] for j in range(i - window, i + window + 1) if j != i):
                swing_lows.append((i, lows[i]))

        return swing_highs, swing_lows

    def detect_bos_choch(
        self, closes: List[float], highs: List[float], lows: List[float]
    ) -> Tuple[Optional[str], float]:
        """
        Rileva Break of Structure (BOS) e Change of Character (CHOCH)
        Ritorna: (tipo_segnale, prezzo_di_rottura)
        """
        if len(closes) < 10:
            return None, 0.0

        swing_highs, swing_lows = self.identify_swing_highs_lows(highs, lows, window=2)

        if not swing_highs or not swing_lows:
            return None, 0.0

        last_high = swing_highs[-1][1]
        last_low = swing_lows[-1][1]
        current_price = closes[-1]

        # BOS al rialzo: rottura della resistenza precedente
        if current_price > last_high and closes[-2] <= last_high:
            return "BOS_UP", last_high

        # BOS al ribasso: rottura del supporto precedente
        if current_price < last_low and closes[-2] >= last_low:
            return "BOS_DOWN", last_low

        # CHOCH (Change of Character): cambio nella struttura
        # Esempio: da swing low più basso a swing low più alto (inversione)
        if len(swing_lows) >= 2:
            if swing_lows[-1][1] > swing_lows[-2][1] and current_price > swing_lows[-1][1]:
                return "CHOCH_UP", swing_lows[-1][1]

        if len(swing_highs) >= 2:
            if swing_highs[-1][1] < swing_highs[-2][1] and current_price < swing_highs[-1][1]:
                return "CHOCH_DOWN", swing_highs[-1][1]

        return None, 0.0

    def update_dynamic_levels(
        self, highs: List[float], lows: List[float], current_time: datetime
    ) -> None:
        """Aggiorna i livelli di supporto/resistenza dinamici"""
        swing_highs, swing_lows = self.identify_swing_highs_lows(highs, lows, window=2)

        # Aggiorna resistenze
        self.resistance_levels = []
        for idx, price in swing_highs[-3:]:  # Ultimi 3 swing high
            level = StructureLevel(
                price=price,
                type="resistance",
                strength=1,
                last_touch=current_time,
                confirmed=True,
            )
            self.resistance_levels.append(level)

        # Aggiorna supporti
        self.support_levels = []
        for idx, price in swing_lows[-3:]:  # Ultimi 3 swing low
            level = StructureLevel(
                price=price,
                type="support",
                strength=1,
                last_touch=current_time,
                confirmed=True,
            )
            self.support_levels.append(level)


class SessionFilter:
    """Filtra i trade in base alla sessione di trading"""

    SESSIONS = {
        "asia": {"start": time(0, 0), "end": time(9, 0), "volatility": 0.6},
        "london": {"start": time(8, 0), "end": time(17, 0), "volatility": 1.2},
        "newyork": {"start": time(13, 0), "end": time(22, 0), "volatility": 1.1},
    }

    @staticmethod
    def get_current_session(current_time: datetime) -> SessionInfo:
        """Determina la sessione di trading attuale"""
        hour = current_time.hour
        minute = current_time.minute
        current = time(hour, minute)

        # London session (più volatile, preferita)
        if time(8, 0) <= current < time(17, 0):
            return SessionInfo(
                name="london",
                is_active=True,
                volatility_factor=1.2,
            )

        # New York session
        if time(13, 0) <= current < time(22, 0):
            return SessionInfo(
                name="newyork",
                is_active=True,
                volatility_factor=1.1,
            )

        # Asia session (evitare: mercato lento)
        if time(0, 0) <= current < time(9, 0):
            return SessionInfo(
                name="asia",
                is_active=False,
                volatility_factor=0.6,
            )

        # Fuori sessione
        return SessionInfo(
            name="closed",
            is_active=False,
            volatility_factor=0.5,
        )


class VolumeAnalyzer:
    """Analizza i volumi per confermare i segnali"""

    @staticmethod
    def analyze_volume_spike(
        volumes: List[float], threshold_multiplier: float = 1.5
    ) -> bool:
        """Rileva spike di volume (conferma istituzionale)"""
        if len(volumes) < 20:
            return False

        avg_volume = sum(volumes[-20:-1]) / 19
        current_volume = volumes[-1]

        return current_volume > avg_volume * threshold_multiplier

    @staticmethod
    def volume_price_divergence(
        closes: List[float], volumes: List[float], window: int = 14
    ) -> Optional[str]:
        """
        Rileva divergenze volume/prezzo
        Ritorna: "bullish_div", "bearish_div", o None
        """
        if len(closes) < window or len(volumes) < window:
            return None

        # Ultimi window candles
        recent_closes = closes[-window:]
        recent_volumes = volumes[-window:]

        # Bullish divergence: prezzo più basso, volume più alto
        if recent_closes[-1] < recent_closes[0] and recent_volumes[-1] > recent_volumes[0]:
            return "bullish_div"

        # Bearish divergence: prezzo più alto, volume più basso
        if recent_closes[-1] > recent_closes[0] and recent_volumes[-1] < recent_volumes[0]:
            return "bearish_div"

        return None


class AdvancedM15Strategy:
    """Strategia M15 avanzata con Price Action, Session Filter e Risk Management"""

    def __init__(self):
        self.structure_analyzer = StructureAnalyzer(lookback_bars=100)
        self.volume_analyzer = VolumeAnalyzer()
        self.min_rr_ratio = 2.5  # Risk/Reward minimo

    def generate_signal(
        self,
        symbol: str,
        closes: List[float],
        highs: List[float],
        lows: List[float],
        volumes: List[float],
        ema_fast: List[float],
        ema_slow: List[float],
        atr: float,
        current_time: datetime,
    ) -> Optional[AdvancedSignal]:
        """Genera un segnale di trading avanzato"""

        if len(closes) < 20:
            return None

        # 1. Session Filter
        session = SessionFilter.get_current_session(current_time)
        if not session.is_active:
            return None

        # 2. Analisi della struttura (BOS/CHOCH)
        bos_type, bos_price = self.structure_analyzer.detect_bos_choch(closes, highs, lows)
        if bos_type is None:
            return None

        # 3. Aggiorna livelli dinamici
        self.structure_analyzer.update_dynamic_levels(highs, lows, current_time)

        # 4. Conferma volume
        volume_spike = self.volume_analyzer.analyze_volume_spike(volumes, threshold_multiplier=1.5)
        if not volume_spike:
            return None

        # 5. Trend filter (EMA)
        if len(ema_fast) < 2 or len(ema_slow) < 2:
            return None

        current_price = closes[-1]
        fast = ema_fast[-1]
        slow = ema_slow[-1]

        # Determina direzione
        if bos_type == "BOS_UP" and fast > slow:
            direction = "BUY"
        elif bos_type == "BOS_DOWN" and fast < slow:
            direction = "SELL"
        elif bos_type == "CHOCH_UP" and fast > slow:
            direction = "BUY"
        elif bos_type == "CHOCH_DOWN" and fast < slow:
            direction = "SELL"
        else:
            return None

        # 6. Calcola SL e TP con RR 1:2.5
        if direction == "BUY":
            # Stop Loss sotto il swing low recente
            stop_loss = min(lows[-5:]) - atr * 0.5
            # Take Profit con RR 1:2.5
            risk = current_price - stop_loss
            take_profit = current_price + (risk * self.min_rr_ratio)
        else:
            # Stop Loss sopra il swing high recente
            stop_loss = max(highs[-5:]) + atr * 0.5
            # Take Profit con RR 1:2.5
            risk = stop_loss - current_price
            take_profit = current_price - (risk * self.min_rr_ratio)

        # 7. Calcola confidence
        confidence = 0.7 if volume_spike else 0.5
        if bos_type.startswith("CHOCH"):
            confidence += 0.15

        # 8. Calcola RR ratio
        risk = abs(current_price - stop_loss)
        reward = abs(take_profit - current_price)
        rr_ratio = reward / risk if risk > 0 else 0

        if rr_ratio < self.min_rr_ratio:
            return None

        reasons = [bos_type, "volume_spike", f"session_{session.name}"]

        return AdvancedSignal(
            symbol=symbol,
            direction=direction,
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            risk_reward_ratio=rr_ratio,
            confidence=confidence,
            reasons=reasons,
            structure_level=self.structure_analyzer.support_levels[0]
            if direction == "BUY"
            else self.structure_analyzer.resistance_levels[0],
            session=session,
            volume_confirmation=volume_spike,
        )
