# Trading Bot AI - Web GUI Project TODO

## Frontend UI Components
- [x] Dashboard principale con stato bot
- [x] Sezione Setup e Configurazione
- [x] Sezione Backtesting
- [x] Sezione Bot Control (Start/Stop)
- [x] Sezione Dashboard Metriche
- [x] Sezione Performance Charts
- [ ] Sezione Trade History
- [x] Sezione Settings e API Keys
- [x] Sezione GitHub Integration
- [ ] Notification System

## Backend API Endpoints
- [ ] POST /api/bot/setup - Esegui setup
- [ ] POST /api/bot/start - Avvia bot
- [ ] POST /api/bot/stop - Ferma bot
- [ ] GET /api/bot/status - Status bot
- [ ] POST /api/backtest/run - Esegui backtesting
- [ ] GET /api/backtest/results - Risultati backtesting
- [ ] GET /api/metrics - Metriche real-time
- [ ] GET /api/trades - Storico trade
- [ ] POST /api/config/save - Salva configurazione
- [ ] GET /api/config - Leggi configurazione
- [ ] POST /api/github/sync - Sincronizza GitHub
- [ ] GET /api/github/status - Status GitHub

## Process Management
- [ ] Implementare process spawning per setup.bat
- [ ] Implementare process spawning per backtest.py
- [ ] Implementare process spawning per run_bot.py
- [ ] Implementare process spawning per dashboard.py
- [ ] Implementare process monitoring
- [ ] Implementare process termination

## Database
- [ ] Schema per configurazione bot
- [ ] Schema per storico trade
- [ ] Schema per metriche performance
- [ ] Schema per GitHub sync log

## GitHub Integration
- [ ] Configurare GitHub OAuth
- [ ] Implementare auto-commit
- [ ] Implementare auto-push
- [ ] Implementare pull latest changes
- [ ] Implementare branch management

## Security & Validation
- [ ] Validazione input API keys
- [ ] Encryption per credenziali
- [ ] Rate limiting API
- [ ] CORS configuration
- [ ] Session management

## Testing
- [ ] Test API endpoints
- [ ] Test process spawning
- [ ] Test GitHub sync
- [ ] Test error handling
- [ ] Test UI responsiveness

## Documentation
- [ ] README.md aggiornato
- [ ] API documentation
- [ ] Setup guide
- [ ] User guide
- [ ] Deployment guide

## Deployment
- [ ] Build production
- [ ] Deploy su cloud
- [ ] Configure environment variables
- [ ] Setup monitoring
- [ ] Setup backups


## Backend tRPC Integration (NEW)
- [x] Creare router tRPC per bot control
- [x] Implementare procedure: setup, start, stop, backtest
- [x] Implementare procedure: getStatus, getMetrics, getTrades
- [x] Implementare procedure: saveConfig, getConfig
- [x] Implementare procedure: syncGithub
- [ ] Collegare procedure ai comandi Python

## Grafici Real-time (NEW)
- [x] Installare Recharts
- [x] Creare componente PerformanceChart
- [x] Creare componente PnLChart
- [x] Creare componente TradeHistoryTable
- [x] Implementare data fetching per grafici
- [ ] Aggiornamento dati ogni 5 secondi

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
- [ ] Aggiungere bottoni export nel frontend

## Backtesting Avanzato (NEW)
- [x] Creare servizio backtesting con Optuna
- [x] Implementare ottimizzazione parametri
- [x] Creare procedure tRPC: runBacktest
- [x] Creare procedure tRPC: optimizeStrategy
- [ ] Aggiungere visualizzazione risultati nel frontend
- [ ] Implementare progress tracking real-time
