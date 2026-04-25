# Trading Bot Project

Questo progetto unisce:

- frontend React + Vite per controllo e dashboard;
- backend Express + tRPC per orchestrare setup, avvio, stop e backtest;
- bot Python che usa MetaTrader 5 quando configurato e passa in simulazione quando MT5 o le credenziali non sono disponibili.

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
3. avvia il server su `http://localhost:3000`.

## Setup ambiente

1. Copia `.env.example` in `.env`.
2. Inserisci le credenziali MT5 / HeroFx reali se vuoi usare la modalita live.
3. Se lasci `HEROFX_PASSWORD` vuota, il bot avvia automaticamente la modalita simulazione.

## Comandi utili

```bash
npm run check
npm run build
npm run start
npm run start:all
```

## Struttura progetto

- `client/`: interfaccia web.
- `server/`: backend Express, tRPC e WebSocket.
- `trading-bot-ai/`: script Python del bot, setup e backtest.
- `data/`: metriche, trade e output runtime generati dal bot.
- `logs/`: log applicativi.

## Note operative

- Il server legge i file JSON prodotti dal processo Python e li inoltra in tempo reale via WebSocket.
- Il backtest locale salva i risultati in `data/backtest_results.json`.
- Le credenziali sensibili non devono essere committate nel repository.
