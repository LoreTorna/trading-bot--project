#!/usr/bin/env python3
"""Multi-symbol local backtest generator for XAUUSD.r and BTCUSD.r."""

import argparse
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Sequence

from trading_config import (
    get_symbol_profile,
    resolve_backtest_symbols,
)


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
REPORTS_DIR = ROOT_DIR / "reports"
DATA_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def round_price(symbol: str, value: float) -> float:
    return round(value, get_symbol_profile(symbol).price_precision)


def build_trade(
    symbol: str,
    trade_id: str,
    timestamp: datetime,
    direction: str,
    entry_price: float,
    exit_price: float,
    quantity: float,
    profit: float,
) -> Dict[str, Any]:
    return {
        "id": trade_id,
        "symbol": symbol,
        "type": direction,
        "price": round_price(symbol, entry_price),
        "entryPrice": round_price(symbol, entry_price),
        "exitPrice": round_price(symbol, exit_price),
        "quantity": round(quantity, 4),
        "profit": round(profit, 2),
        "pnl": round(profit, 2),
        "time": timestamp.isoformat(),
        "status": "closed",
        "mode": "backtest",
    }


def calculate_result(
    symbol: str,
    label: str,
    initial_capital: float,
    final_capital: float,
    years: int,
    returns: Sequence[float],
    trades: Sequence[Dict[str, Any]],
) -> Dict[str, Any]:
    total_trades = len(trades)
    profits = [float(trade.get("profit", 0)) for trade in trades]
    winning = [value for value in profits if value > 0]
    losing = [value for value in profits if value < 0]
    gross_profit = sum(winning)
    gross_loss = abs(sum(losing))
    total_return = ((final_capital - initial_capital) / max(initial_capital, 1)) * 100
    average_return = sum(returns) / len(returns) if returns else 0.0
    variance = (
        sum((value - average_return) ** 2 for value in returns) / len(returns)
        if returns
        else 0.0
    )
    sharpe_ratio = 0.0
    if variance > 0:
        sharpe_ratio = (average_return / variance ** 0.5) * (252 ** 0.5)

    equity = initial_capital
    peak = initial_capital
    max_drawdown = 0.0
    for profit in profits:
        equity += profit
        peak = max(peak, equity)
        if peak > 0:
            max_drawdown = max(max_drawdown, ((peak - equity) / peak) * 100)

    return {
        "symbol": symbol,
        "label": label,
        "initialCapital": round(initial_capital, 2),
        "finalCapital": round(final_capital, 2),
        "totalReturn": round(total_return, 2),
        "annualReturn": round(total_return / max(years, 1), 2),
        "sharpeRatio": round(sharpe_ratio, 2),
        "maxDrawdown": round(max_drawdown, 2),
        "winRate": round((len(winning) / max(total_trades, 1)) * 100, 2),
        "profitFactor": round(gross_profit / gross_loss, 2) if gross_loss else round(gross_profit, 2),
        "totalTrades": total_trades,
        "winningTrades": len(winning),
        "losingTrades": len(losing),
        "avgWin": round(gross_profit / len(winning), 2) if winning else 0.0,
        "avgLoss": round(sum(losing) / len(losing), 2) if losing else 0.0,
    }


def simulate_symbol_backtest(
    symbol: str,
    capital: float,
    years: int,
    offset_days: int,
) -> Dict[str, Any]:
    profile = get_symbol_profile(symbol)
    trading_days = max(years * (365 if profile.weekend_trading else 252), 60)
    trades_target = max(int(trading_days * (0.42 if profile.weekend_trading else 0.3)), 28)
    current_price = profile.simulation_start_price
    final_capital = capital
    returns: List[float] = []
    trades: List[Dict[str, Any]] = []
    start_date = datetime.now() - timedelta(days=trading_days + offset_days)
    step_minutes = max(int((trading_days * 24 * 60) / max(trades_target, 1)), 60)

    for index in range(trades_target):
        direction = random.choice(["BUY", "SELL"])
        move_percent = random.uniform(
            profile.simulation_trade_move_percent[0],
            profile.simulation_trade_move_percent[1],
        )
        is_winner = random.random() < profile.simulated_win_rate
        signed_move = move_percent if is_winner else -move_percent * random.uniform(0.85, 1.25)
        exposure = max(final_capital, capital * 0.7) * profile.capital_exposure
        profit = exposure * (signed_move / 100.0)
        entry_price = current_price
        if direction == "BUY":
            exit_price = entry_price * (1 + signed_move / 100.0)
        else:
            exit_price = entry_price * (1 - signed_move / 100.0)

        timestamp = start_date + timedelta(minutes=step_minutes * index)
        trades.append(
            build_trade(
                symbol=symbol,
                trade_id="%s-%04d" % (symbol.replace(".", "-"), index + 1),
                timestamp=timestamp,
                direction=direction,
                entry_price=entry_price,
                exit_price=exit_price,
                quantity=profile.default_lot_size,
                profit=profit,
            )
        )

        final_capital += profit
        returns.append(profit / max(final_capital, 1))
        current_price = min(max(exit_price, profile.min_price), profile.max_price)

    result = calculate_result(
        symbol=symbol,
        label=profile.label,
        initial_capital=capital,
        final_capital=final_capital,
        years=years,
        returns=returns,
        trades=trades,
    )
    result["trades"] = trades
    return result


def combine_results(
    selected_symbols: Sequence[str],
    initial_capital: float,
    years: int,
    results: Sequence[Dict[str, Any]],
    trades: Sequence[Dict[str, Any]],
) -> Dict[str, Any]:
    final_capital = sum(float(result["finalCapital"]) for result in results)
    returns = [float(trade.get("profit", 0)) / max(initial_capital, 1) for trade in trades]
    return calculate_result(
        symbol="PORTFOLIO",
        label="Portfolio aggregato",
        initial_capital=initial_capital,
        final_capital=final_capital,
        years=years,
        returns=returns,
        trades=trades,
    )


def write_report(payload: Dict[str, Any]) -> None:
    report_path = REPORTS_DIR / (
        "backtest_%s.md" % datetime.now().strftime("%Y%m%d_%H%M%S")
    )
    lines = [
        "# Multi-Asset Backtest Report",
        "",
        "- Generated at: %s" % payload["generatedAt"],
        "- Symbols: %s" % ", ".join(payload["symbols"]),
        "- Initial capital: $%s" % payload["initialCapital"],
        "- Total return: %s%%" % payload["summary"]["totalReturn"],
        "- Win rate: %s%%" % payload["summary"]["winRate"],
        "- Profit factor: %s" % payload["summary"]["profitFactor"],
        "",
        "## Per Symbol",
        "",
    ]

    for result in payload["results"]:
        lines.extend(
            [
                "### %s" % result["symbol"],
                "",
                "- Return: %s%%" % result["totalReturn"],
                "- Trades: %s" % result["totalTrades"],
                "- Win rate: %s%%" % result["winRate"],
                "- Max drawdown: %s%%" % result["maxDrawdown"],
                "",
            ]
        )

    report_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbols", nargs="*", default=[])
    parser.add_argument("--years", type=int, default=2)
    parser.add_argument("--capital", type=float, default=10000)
    args = parser.parse_args()

    selected_symbols = resolve_backtest_symbols(args.symbols)
    capital_per_symbol = args.capital / max(len(selected_symbols), 1)
    symbol_results: List[Dict[str, Any]] = []
    trades: List[Dict[str, Any]] = []

    for index, symbol in enumerate(selected_symbols):
        result = simulate_symbol_backtest(
            symbol=symbol,
            capital=capital_per_symbol,
            years=args.years,
            offset_days=index * 3,
        )
        symbol_results.append({key: value for key, value in result.items() if key != "trades"})
        trades.extend(result["trades"])

    trades.sort(key=lambda item: item["time"], reverse=True)

    payload = {
        "generatedAt": datetime.now().isoformat(),
        "years": args.years,
        "initialCapital": round(args.capital, 2),
        "symbols": list(selected_symbols),
        "results": symbol_results,
        "summary": combine_results(
            selected_symbols=selected_symbols,
            initial_capital=args.capital,
            years=args.years,
            results=symbol_results,
            trades=trades,
        ),
        "trades": trades[:200],
    }

    (DATA_DIR / "backtest_results.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )
    write_report(payload)
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
