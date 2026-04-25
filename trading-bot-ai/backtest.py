#!/usr/bin/env python3
"""Simple local backtest generator used by the control panel."""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timedelta
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
REPORTS_DIR = ROOT_DIR / "reports"
DATA_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def simulate_backtest(initial_capital: float, years: int) -> dict:
    trading_days = max(years * 252, 60)
    daily_returns = [random.gauss(0.0015, 0.012) for _ in range(trading_days)]

    equity = initial_capital
    peak = initial_capital
    max_drawdown = 0.0
    positive_days = 0
    negative_days = 0

    for daily_return in daily_returns:
        equity *= 1 + daily_return
        peak = max(peak, equity)
        drawdown = ((peak - equity) / peak) * 100 if peak else 0
        max_drawdown = max(max_drawdown, drawdown)
        if daily_return >= 0:
            positive_days += 1
        else:
            negative_days += 1

    total_return = ((equity - initial_capital) / initial_capital) * 100
    annual_return = total_return / max(years, 1)
    average_return = sum(daily_returns) / len(daily_returns)
    variance = sum((value - average_return) ** 2 for value in daily_returns) / len(daily_returns)
    sharpe_ratio = 0 if variance == 0 else (average_return / variance**0.5) * (252**0.5)
    gross_profit = sum(value for value in daily_returns if value > 0)
    gross_loss = abs(sum(value for value in daily_returns if value < 0))

    result = {
        "generatedAt": datetime.now().isoformat(),
        "startDate": (datetime.now() - timedelta(days=365 * years)).date().isoformat(),
        "endDate": datetime.now().date().isoformat(),
        "initialCapital": round(initial_capital, 2),
        "finalCapital": round(equity, 2),
        "totalReturn": round(total_return, 2),
        "annualReturn": round(annual_return, 2),
        "sharpeRatio": round(sharpe_ratio, 2),
        "maxDrawdown": round(max_drawdown, 2),
        "winRate": round((positive_days / len(daily_returns)) * 100, 2),
        "profitFactor": round(gross_profit / gross_loss, 2) if gross_loss else round(gross_profit, 2),
        "totalTrades": len(daily_returns),
        "winningTrades": positive_days,
        "losingTrades": negative_days,
        "avgWin": round((gross_profit / positive_days) * initial_capital, 2) if positive_days else 0,
        "avgLoss": round(-(gross_loss / negative_days) * initial_capital, 2) if negative_days else 0,
    }
    return result


def write_outputs(result: dict) -> None:
    (DATA_DIR / "backtest_results.json").write_text(
        json.dumps(result, indent=2),
        encoding="utf-8",
    )

    report_path = REPORTS_DIR / f"backtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    report_path.write_text(
        "\n".join(
            [
                "# Backtest Report",
                "",
                f"- Generated at: {result['generatedAt']}",
                f"- Initial capital: ${result['initialCapital']}",
                f"- Final capital: ${result['finalCapital']}",
                f"- Total return: {result['totalReturn']}%",
                f"- Annual return: {result['annualReturn']}%",
                f"- Sharpe ratio: {result['sharpeRatio']}",
                f"- Max drawdown: {result['maxDrawdown']}%",
                f"- Win rate: {result['winRate']}%",
                "",
            ]
        ),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--years", type=int, default=2)
    parser.add_argument("--capital", type=float, default=10000)
    args = parser.parse_args()

    result = simulate_backtest(args.capital, args.years)
    write_outputs(result)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
