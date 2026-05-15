#!/usr/bin/env python3
"""Small helper that prints the latest runtime snapshot."""

import json
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"


def read_json(path: Path):
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    payload = {
        "metrics": read_json(DATA_DIR / "metrics.json"),
        "trades": read_json(DATA_DIR / "trades.json"),
        "backtest": read_json(DATA_DIR / "backtest_results.json"),
    }
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
