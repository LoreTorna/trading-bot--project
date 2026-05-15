# Trading Bot Project

Questo progetto unisce:

- frontend React + Vite per controllo, dashboard e selezione asset;
- backend Express + tRPC per setup, avvio, stop e backtest;
- bot Python che usa MetaTrader 5 quando configurato, apre il terminale MT5 se trova `terminal64.exe` e passa in simulazione quando MT5 o credenziali non sono disponibili.

## Asset supportati

- `XAUUSD.r`: trading feriale H23.
- `BTCUSD.r`: trading H24, incluso il weekend.

L'interfaccia permette di scegliere separatamente:

- i simboli per il trading live;
- i simboli per il backtest;
- capitale iniziale e anni del backtest.

## Avvio rapido

### Windows

Esegui:

```powershell
start.bat
```

### macOS / Linux

Esegui:

```bash
./start.sh
```

### Node.js universale

```bash
node start.js
```

Lo script:

1. verifica le dipendenze;
2. compila frontend e backend;
3. avvia il server su `http://localhost:3000` oppure sulla porta libera successiva se `3000` e gia occupata.

## Setup ambiente

1. Copia `.env.example` in `.env`.
2. Imposta le credenziali MT5 / HeroFx se vuoi usare la modalita live.
3. Se MT5 non viene rilevato automaticamente, imposta `MT5_TERMINAL_PATH` con il percorso assoluto di `terminal64.exe`.
4. Configura `BOT_SYMBOLS` e `BACKTEST_SYMBOLS` con una combinazione di `XAUUSD.r,BTCUSD.r`.
5. Per simulare invece di fare live trading, imposta `MT5_FORCE_SIMULATION=true`.
6. Se vuoi consentire fallback automatico alla simulazione quando MT5 non e pronto, imposta `ALLOW_SIMULATION_FALLBACK=true`.

## Strategia live

Il pulsante `Avvia scalping` chiama il backend tRPC, che avvia `trading-bot-ai/run_bot.py` con i simboli scelti. In live mode il bot:

- apre MetaTrader 5 usando `MT5_TERMINAL_PATH` o i path Windows comuni;
- effettua login con `HEROFX_LOGIN`, `HEROFX_PASSWORD`, `HEROFX_SERVER`;
- lavora su entry M1 e trend M5;
- usa EMA 9/21, EMA trend 20/50, RSI 14, Bollinger 20/2 e ATR 14;
- calcola SL/TP con ATR, usa trailing stop e chiude le posizioni del bot su segnale opposto;
- rispetta `MAX_DAILY_LOSS`, `MAX_TRADES_PER_DAY`, `MAX_OPEN_POSITIONS` e il cooldown per simbolo.

## Comandi utili

```bash
npm run check
npm run build
npm run start
npm run start:all
python trading-bot-ai/setup.py
python trading-bot-ai/backtest.py --symbols XAUUSD.r BTCUSD.r --years 2 --capital 10000
```

## Struttura progetto

- `client/`: interfaccia web.
- `server/`: backend Express, tRPC e WebSocket.
- `shared/`: costanti e profili simbolo condivisi.
- `trading-bot-ai/`: script Python del bot, setup e backtest.
- `data/`: metriche, trade e output runtime generati dal bot.
- `logs/`: log applicativi.

## Note operative

- Il server legge i file JSON prodotti dal processo Python e li inoltra in tempo reale via WebSocket.
- Il bot puo girare su un solo asset o su entrambi insieme.
- Nel weekend l'oro resta fermo, mentre Bitcoin continua a cercare e aprire setup se selezionato.
- Il backtest locale salva i risultati in `data/backtest_results.json` e produce un report in `reports/`.
