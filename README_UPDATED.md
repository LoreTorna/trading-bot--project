# HeroFx Trading Bot - XAUUSD M15 Advanced Strategy

## 🎯 Obiettivo

Sviluppare un bot di trading automatico avanzato per operare su **XAUUSD (Gold)** timeframe **M15** con:
- **Risk/Reward** minimo: 1:2.5
- **Win Rate** target: 55–70%
- **Equity Curve** stabile (no drawdown distruttivi)
- **Adattamento dinamico** alle condizioni di mercato

## 🧠 Filosofia del Sistema

Il bot **NON** è basato su:
- ❌ Solo indicatori
- ❌ Solo segnali tecnici
- ❌ Logica statica

Il bot **È** basato su:
- ✅ **Struttura del mercato** (Price Action)
- ✅ **Conferma da volumi e momentum**
- ✅ **Filtro da contesto** (trend, sessioni, volatilità)
- ✅ **Ottimizzazione continua** via backtest + forward test

## ⚙️ Architettura del Bot

### 1. 📡 Data Layer
- Gestione dati di mercato: Prezzo OHLC (M15)
- Volumi (tick volume)
- Spread e slippage
- Sessioni (Asia, London, NY)

### 2. 🧩 Modulo ANALISI MERCATO

#### A. Struttura (CORE)
- **Break of Structure (BOS)**: Rottura di supporti/resistenze
- **Change of Character (CHOCH)**: Cambio nella struttura del mercato
- **Supporti/Resistenze dinamici**: Aggiornati in tempo reale

#### B. Trend Filter
- EMA 50 / EMA 200 (solo filtro, non segnale)
- Direzione dominante

#### C. Volumi
- Spike di volume = conferma istituzionale
- Divergenze volume/prezzo

#### D. Volatilità
- ATR per SL dinamico
- Filtro mercati piatti

#### E. Session Filter
- Opera solo durante: **London open** e **New York open**
- ❌ Evita Asia → mercato lento

## 🎯 Logica di Entrata

Un trade viene aperto **SOLO** se tutte le condizioni sono rispettate:

### Setup BUY Esempio:
1. Trend bullish (EMA filter)
2. Break of Structure rialzista
3. Pullback su zona chiave
4. Volume in aumento
5. Conferma candlestick (engulfing / rejection)

**Entry** = dopo conferma, **NON** durante il breakout

## 🛑 Gestione Rischio (CRUCIALE)

### Stop Loss (SL)
- Basato su: swing low/high + ATR multiplier
- Dinamico in base alla volatilità

### Take Profit (TP)
- **RR minimo**: 1:2.5
- Possibile scaling: TP1 (parziale) + TP2 (runner)

### Risk Management
- Max 1–2% per trade
- Max 3 trade contemporanei
- Stop giornaliero (es: -3%)

## 🔄 Modulo di Gestione Trade

- **Break-even automatico**: Sposta SL a breakeven dopo profitto iniziale
- **Trailing stop intelligente**: Basato su struttura, non fisso
- **Chiusura anticipata** se:
  - Perdita di momentum
  - Struttura invalidata

## 🧪 Backtest & Ottimizzazione

### Fase 1: Backtest
- Dati storici M15
- Metriche: Profit factor, Drawdown, Winrate, RR medio

### Fase 2: Forward Test (DEMO)
- Simulazione live
- Verifica: slippage reale, comportamento bot

### Fase 3: Ottimizzazione
- Parametri adattivi: ATR multiplier, EMA period, filtri volume

## 🤖 Modulo AI (OPZIONALE MA POTENTE)

Non AI "finta", ma utile:
- **Classificazione** condizioni mercato: trend, range, alta volatilità
- **Adattamento parametri**: RR dinamico, aggressività trade

## 📊 KPI DA MONITORARE

| Metrica | Target |
|---------|--------|
| **Win Rate %** | 55-70% |
| **RR medio** | ≥ 2.5 |
| **Max Drawdown** | < 20% |
| **Profit Factor** | > 1.5 |
| **Sharpe Ratio** | > 1.0 |

## 🚨 ERRORI DA EVITARE (REAL TALK)

- ❌ Overfitting nei backtest
- ❌ Troppi indicatori (confusione = perdita)
- ❌ Trading in sessioni morte
- ❌ Ignorare spread/slippage
- ❌ Strategia troppo rigida

## 🧱 Stack Tecnologico

| Componente | Tecnologia |
|-----------|-----------|
| **Linguaggio Bot** | Python 3.8+ |
| **Piattaforma Trading** | MetaTrader 5 (MT5) |
| **Connettore** | MetaTrader5 Python API |
| **Dashboard** | React 19 + Tailwind CSS 4 |
| **Server** | Express.js |
| **Database** | JSON (locale) |
| **Versioning** | Git + GitHub |

## 📈 Struttura del Progetto

```
trading-bot--project/
├── trading-bot-ai/                 # Bot di trading (Python)
│   ├── run_bot.py                  # Main bot runtime
│   ├── run_bot_persistent.py       # Wrapper persistente
│   ├── strategy_m15_advanced.py    # Strategia avanzata M15
│   ├── trading_config.py           # Configurazione simboli
│   ├── backtest.py                 # Backtest engine
│   └── daily_monitor.py            # Monitoraggio giornaliero
│
├── trading-dashboard/              # Dashboard Web (React)
│   ├── client/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx        # Landing page
│   │   │   │   └── Dashboard.tsx   # Trading dashboard
│   │   │   └── components/         # UI components
│   │   └── index.html
│   ├── server/
│   │   └── index.ts                # Express server
│   └── package.json
│
├── data/                           # Dati runtime
│   ├── trades.json                 # Storico operazioni
│   └── metrics.json                # Metriche performance
│
├── logs/                           # Log files
│   └── bot.log                     # Bot activity log
│
├── .env                            # Configurazione (credenziali)
├── DEPLOYMENT.md                   # Guida deployment
└── README.md                       # Questo file
```

## 🚀 Quick Start

### 1. Configurazione Locale

```bash
# Clona il repository
git clone https://github.com/LoreTorna/trading-bot--project.git
cd trading-bot--project

# Configura le credenziali
echo "HEROFX_LOGIN=923721" > .env
echo "HEROFX_PASSWORD=Lt020507!" >> .env
echo "HEROFX_SERVER=HeroFx-Trade" >> .env
echo "MT5_FORCE_SIMULATION=false" >> .env

# Installa dipendenze
cd trading-bot-ai && pip install -r requirements.txt && cd ..
cd trading-dashboard && npm install && cd ..
```

### 2. Avvio del Sistema

```bash
# Terminal 1: Bot di trading
cd trading-bot-ai
python3 run_bot_persistent.py

# Terminal 2: Dashboard
cd trading-dashboard
npm run dev
```

### 3. Accedi alla Dashboard
- **Home**: http://localhost:3000
- **Trading Dashboard**: http://localhost:3000/dashboard

## 📊 Dashboard Features

- **Metriche in Tempo Reale**
  - Saldo conto, Equity, Margin
  - Rendimento totale, Win Rate
  - Posizioni aperte

- **Grafici**
  - Equity Curve (andamento conto)
  - Distribuzione profitti per trade
  - Performance per simbolo

- **Storico Operazioni**
  - Tutte le operazioni chiuse
  - Filtri per status (aperte/chiuse)
  - Dettagli entry/exit

## 🌐 Deployment Cloud (24/7)

Vedi [DEPLOYMENT.md](DEPLOYMENT.md) per:
- Render.com
- Railway.app
- DigitalOcean App Platform
- AWS Lambda + RDS

## 🧠 Conclusione Strategica

Se vuoi un bot veramente profittevole:

> **Il vantaggio NON è nel codice**
> **È nella logica di mercato + gestione rischio**

👉 Il codice esegue.
👉 La strategia vince o perde.

## 📚 Risorse

- [MetaTrader 5 Documentation](https://www.metatrader5.com/en/docs)
- [Price Action Trading](https://www.investopedia.com/terms/p/price-action.asp)
- [Risk Management in Trading](https://www.investopedia.com/terms/r/riskmanagement.asp)

## 📝 Changelog

### v1.0.0 (2026-05-04)
- ✅ Implementazione strategia M15 avanzata (BOS/CHOCH)
- ✅ Session Filter (London, New York)
- ✅ Risk Management 1:2.5
- ✅ Dashboard React con grafici real-time
- ✅ Configurazione HeroFx MT5
- ✅ Deployment guide

## 🤝 Contributi

Contributi sono benvenuti! Per modifiche significative, apri una issue prima di fare un PR.

## 📄 Licenza

MIT License - vedi LICENSE file

---

**Sviluppato con ❤️ per il trading automatico sostenibile**
