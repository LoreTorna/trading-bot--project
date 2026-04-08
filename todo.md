# Trading Bot AI - Web GUI Project TODO

## Frontend UI Components
- [x] Dashboard principale con stato bot
- [x] Sezione Setup e Configurazione
- [x] Sezione Backtesting
- [x] Sezione Bot Control (Start/Stop)
- [x] Sezione Dashboard Metriche
- [x] Sezione Performance Charts
- [x] Sezione Trade History
- [x] Sezione Settings e API Keys
- [x] Sezione GitHub Integration
- [x] Notification System

## Backend API Endpoints
- [x] tRPC /trpc/bot.setup - Esegui setup
- [x] tRPC /trpc/bot.start - Avvia bot
- [x] tRPC /trpc/bot.stop - Ferma bot
- [x] tRPC /trpc/bot.status - Status bot
- [x] tRPC /trpc/backtest.runBacktest - Esegui backtesting
- [x] tRPC /trpc/database.getBacktestResults - Risultati backtesting
- [x] tRPC /trpc/database.getMetrics - Metriche real-time
- [x] tRPC /trpc/database.getTrades - Storico trade
- [x] tRPC /trpc/database.saveBotConfig - Salva configurazione
- [x] tRPC /trpc/database.getBotConfig - Leggi configurazione
- [x] tRPC /trpc/bot.syncGithub - Sincronizza GitHub

## Process Management
- [x] Implementare process spawning cross-platform (sh/bat)
- [x] Implementare process monitoring (pgrep/tasklist)
- [x] Implementare process termination (pkill/taskkill)
- [x] Gestione directory bot mancante con mock automatico

## Database
- [x] Schema per configurazione bot
- [x] Schema per storico trade
- [x] Schema per metriche performance
- [x] Schema per GitHub sync log
- [x] Fallback a Mock DB se DATABASE_URL manca

## GitHub Integration
- [ ] Configurare GitHub OAuth
- [x] Implementare auto-commit (via Manus)
- [x] Implementare auto-push (via Manus)
- [ ] Implementare pull latest changes
- [ ] Implementare branch management

## Security & Validation
- [x] Validazione input con Zod (tRPC)
- [ ] Encryption per credenziali
- [ ] Rate limiting API
- [x] CORS configuration (Socket.IO)
- [ ] Session management

## Testing
- [x] Test integrazione tRPC
- [x] Test integrazione WebSocket
- [x] Test cross-platform bot executor

## Documentation
- [ ] README.md aggiornato
- [ ] API documentation
- [ ] Setup guide

## Deployment
- [x] Build production (Vite + esbuild)
- [ ] Deploy su cloud

## Backend tRPC Integration (NEW)
- [x] Creare router tRPC per bot control
- [x] Implementare procedure: setup, start, stop, backtest
- [x] Implementare procedure: getStatus, getMetrics, getTrades
- [x] Implementare procedure: saveConfig, getConfig
- [x] Implementare procedure: syncGithub
- [x] Collegare procedure ai comandi Python (via BotExecutor)

## Grafici Real-time (NEW)
- [x] Installare Recharts
- [x] Creare componente PerformanceChart
- [x] Creare componente PnLChart
- [x] Creare componente TradeHistoryTable
- [x] Implementare data fetching per grafici
- [x] Aggiornamento dati real-time con WebSocket

## WebSocket Integration (NEW)
- [x] Configurare Socket.IO server
- [x] Implementare event: bot-status
- [x] Implementare event: metrics-update
- [x] Implementare event: trade-executed
- [x] Implementare event: backtest-progress
- [x] Creare hook useWebSocket per client

## Frontend Integration (NEW)
- [x] Collegare bottoni Setup a tRPC.bot.setup
- [x] Collegare bottoni Start/Stop a tRPC.bot.start/stop
- [x] Collegare bottone Backtest a tRPC.bot.runBacktest
- [x] Collegare bottone GitHub Sync a tRPC.bot.syncGithub
- [x] Integrare grafici nella Home page
- [x] Implementare auto-refresh con WebSocket

## Database tRPC Procedures (NEW)
- [x] Creare procedure tRPC: getMetrics
- [x] Creare procedure tRPC: saveTrade
- [x] Creare procedure tRPC: getTrades
- [x] Creare procedure tRPC: getNotifications
- [x] Creare procedure tRPC: getBotConfig
- [x] Creare procedure tRPC: saveBotConfig
- [x] Creare procedure tRPC: getBacktestResults
- [x] Collegare procedure ai query helper del database

## Export PDF/CSV (NEW)
- [x] Installare librerie: pdfkit, csv-writer
- [x] Creare servizio export PDF
- [x] Creare servizio export CSV
- [x] Implementare procedure tRPC: exportTradesCSV
- [x] Implementare procedure tRPC: exportMetricsPDF
- [x] Aggiungere bottoni export nel frontend

## Backtesting Avanzato (NEW)
- [x] Creare servizio backtesting con Optuna
- [x] Implementare ottimizzazione parametri
- [x] Creare procedure tRPC: runBacktest
- [x] Creare procedure tRPC: optimizeStrategy
- [x] Aggiungere visualizzazione risultati nel frontend
- [x] Implementare progress tracking real-time
