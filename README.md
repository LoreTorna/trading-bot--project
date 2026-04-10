# Trading Bot Project

Questo progetto è un sistema completo per la gestione di un trading bot, con un'interfaccia web moderna (React + Vite) e un backend robusto (Express + tRPC).

## 🚀 Avvio Rapido

Per far partire tutto il progetto (Sito + Bot + Server) con un unico comando, esegui:

```bash
node start.js
```

Oppure tramite pnpm:

```bash
pnpm run start:all
```

Questo script si occuperà di:
1. Verificare la presenza della cartella `trading-bot-ai`.
2. Installare tutte le dipendenze necessarie.
3. Compilare il frontend e il backend.
4. Avviare il server di produzione su `http://localhost:3000`.

## 📁 Struttura del Progetto

- `client/`: Codice sorgente del frontend (React).
- `server/`: Codice sorgente del backend (Express + tRPC).
- `shared/`: Codice condiviso tra frontend e backend.
- `drizzle/`: Schema del database e migrazioni.
- `trading-bot-ai/`: Cartella dove risiede il bot di trading esterno.
- `dist/`: Cartella generata dopo la build (contiene il sito compilato).

## 🛠️ Sviluppo

Per avviare il progetto in modalità sviluppo:

```bash
pnpm run dev
```

## 📝 Note

Il sistema è configurato per funzionare con un database MySQL. Se `DATABASE_URL` non è impostato, il sistema utilizzerà un database mock per scopi dimostrativi.
