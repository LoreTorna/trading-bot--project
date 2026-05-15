import datetime
import random
import os

def generate_daily_report():
    today = datetime.date.today()
    report_date = today.strftime("%Y-%m-%d")
    report_filename = f"daily_report_{report_date}.md"
    report_path = os.path.join(os.path.dirname(__file__), "reports", report_filename)

    # Assicurati che la directory 'reports' esista
    os.makedirs(os.path.dirname(report_path), exist_ok=True)

    # Dati di performance simulati (in un'implementazione reale, questi verrebbero da MT5)
    daily_profit = round(random.uniform(-100.0, 500.0), 2)
    total_trades = random.randint(5, 30)
    winning_trades = random.randint(0, total_trades)
    losing_trades = total_trades - winning_trades
    win_rate = round((winning_trades / total_trades) * 100, 2) if total_trades > 0 else 0
    max_drawdown = round(random.uniform(-5.0, -0.5), 2)

    report_content = f"""
# 📊 Report di Performance Giornaliero - {report_date}

Questo report riassume le performance del bot di trading per la giornata del {report_date}.

## Riepilogo Metriche Chiave

| Metrica            | Valore        |
| :----------------- | :------------ |
| Profitto Giornaliero | ${daily_profit:.2f}   |
| Numero Totale Trade | {total_trades}        |
| Trade Vincenti     | {winning_trades}      |
| Trade Perdenti     | {losing_trades}       |
| Percentuale di Vittoria | {win_rate:.2f}%      |
| Max Drawdown       | {max_drawdown:.2f}%   |

## Dettagli Operativi

- **Simbolo Monitorato**: XAUUSD.r
- **Orario di Esecuzione**: Ogni giorno alle 23:00 (ora locale del server).
- **Obiettivo**: Fornire una panoramica rapida e automatica delle performance giornaliere del bot.

## Note

I dati presentati in questo report sono simulati. In un ambiente reale, questi dati verrebbero estratti direttamente dalla piattaforma MT5 tramite l'integrazione del bot.

---
Generato automaticamente dal sistema di monitoraggio del Trading Bot.
"""

    with open(report_path, "w") as f:
        f.write(report_content)

    print(f"Report giornaliero generato: {report_path}")
    return report_path

if __name__ == "__main__":
    generate_daily_report()
