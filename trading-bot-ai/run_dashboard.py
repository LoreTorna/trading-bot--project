#!/usr/bin/env python3
"""Small helper script that prints the latest dashboard summary."""

from __future__ import annotations

import json
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"


def read_json(path: Path, default):
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default
    return default


def main() -> None:
    metrics = read_json(DATA_DIR / "metrics.json", {})
    trades = read_json(DATA_DIR / "trades.json", [])
    backtest = read_json(DATA_DIR / "backtest_results.json", {})

    payload = {
        "metrics": metrics,
        "tradeCount": len(trades) if isinstance(trades, list) else 0,
        "latestTrade": trades[-1] if isinstance(trades, list) and trades else None,
        "backtest": backtest,
    }

    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
