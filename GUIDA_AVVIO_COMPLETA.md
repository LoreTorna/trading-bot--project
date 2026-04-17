# 🤖 Trading Bot - Guida Completa di Avvio

## 📋 Indice
1. [Requisiti](#requisiti)
2. [Struttura del Progetto](#struttura-del-progetto)
3. [Installazione e Setup](#installazione-e-setup)
4. [Avvio del Bot](#avvio-del-bot)
5. [Monitoraggio e Debugging](#monitoraggio-e-debugging)
6. [Configurazione Account MT5](#configurazione-account-mt5)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Requisiti

### Prerequisiti Obbligatori
- **Node.js** 18+ (con npm o pnpm)
- **Python** 3.8+ (per gli script di trading)
- **Git** (per clonare il repository)
- **MetaTrader 5** (installato localmente per la connessione reale)

### Credenziali Account Demo HeroFx
```
Login: 923721
Password: Lt020507!
Server: HeroFx-Trade
Simbolo: XAUUSD.r (Oro)
Tipo: DEMO
```

---

## 📁 Struttura del Progetto

```
trading-bot--project/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx        # Dashboard principale
│   │   │   ├── Dashboard.tsx   # Statistiche trading
│   │   │   └── HeroFxSetup.tsx # Configurazione account
│   │   └── index.css           # Stili globali
│   └── index.html
├── server/                      # Backend Node.js + tRPC
│   ├── config/
│   │   ├── herofx.config.ts    # Configurazione account MT5
│   │   └── paths.config.ts     # Percorsi file bot
│   ├── services/
│   │   ├── herofx-connector.ts # Connessione MT5
│   │   └── bot-executor.ts     # Esecuzione script bot
│   └── routers/
│       └── bot-control.ts      # API tRPC per controllo bot
├── trading-bot-ai/             # Script Python e Shell
│   ├── run_bot.py             # 🚀 SCRIPT PRINCIPALE BOT
│   ├── setup.py               # Setup e installazione dipendenze
│   ├── run_bot.sh             # Wrapper shell per Linux/Mac
│   ├── setup.sh               # Wrapper shell setup
│   ├── daily_monitor.py       # Monitoraggio giornaliero
│   ├── .env                   # Configurazione credenziali
│   ├── logs/                  # File di log
│   ├── reports/               # Report giornalieri
│   └── data/                  # Dati trading
├── start.js                    # 🎯 SCRIPT DI AVVIO PRINCIPALE
├── start.bat                   # Avvio su Windows
├── start.sh                    # Avvio su Linux/Mac
└── package.json               # Dipendenze Node.js

```

---

## 🚀 Installazione e Setup

### Opzione 1: Avvio Automatico (Consigliato)

#### Su Windows:
```bash
# 1. Apri il repository in Esplora File
# 2. Doppio click su "start.bat"
# Oppure da terminale:
node start.js
```

#### Su Linux/Mac:
```bash
# 1. Apri terminale nella cartella del repository
# 2. Esegui:
bash start.sh
# Oppure:
node start.js
```

**Cosa fa:**
- ✅ Installa tutte le dipendenze Node.js (npm/pnpm)
- ✅ Compila il frontend React
- ✅ Compila il backend Node.js
- ✅ Avvia il server su http://localhost:3000

### Opzione 2: Setup Manuale (Per debugging)

#### Step 1: Installa dipendenze Node.js
```bash
cd /path/to/trading-bot--project
npm install --legacy-peer-deps
# Oppure con pnpm:
pnpm install
```

#### Step 2: Setup Python e Bot
```bash
cd trading-bot-ai

# Su Linux/Mac:
bash setup.sh

# Su Windows:
python setup.py
```

Questo creerà:
- ✅ Cartelle: logs/, data/, reports/, config/, strategies/, backtester/
- ✅ File .env con le credenziali
- ✅ Installa dipendenze Python: numpy, pandas, requests, pyyaml, python-dotenv

#### Step 3: Compila il progetto
```bash
cd /path/to/trading-bot--project
npm run build
# Oppure:
pnpm build
```

#### Step 4: Avvia il server
```bash
npm start
# Oppure:
pnpm start
# Oppure in modalità produzione:
NODE_ENV=production node dist/index.js
```

---

## 🎮 Avvio del Bot

### Metodo 1: Da Sito Web (Consigliato)

1. **Avvia il server** (vedi sezione precedente)
2. **Apri il browser** a http://localhost:3000
3. **Vai a "Home" o "Dashboard"**
4. **Clicca il bottone "Avvia Bot"**
5. Il bot inizierà a operare su XAUUSD.r

### Metodo 2: Da Riga di Comando

#### Su Linux/Mac:
```bash
cd trading-bot-ai
bash run_bot.sh
```

#### Su Windows:
```bash
cd trading-bot-ai
python run_bot.py
```

#### Con Python direttamente:
```bash
cd trading-bot-ai
python3 run_bot.py
```

### Metodo 3: Esecuzione in Background

#### Su Linux/Mac:
```bash
cd trading-bot-ai
nohup bash run_bot.sh > bot.log 2>&1 &
# Per fermare:
pkill -f run_bot.py
```

#### Su Windows (PowerShell):
```powershell
cd trading-bot-ai
Start-Process python -ArgumentList "run_bot.py" -NoNewWindow
```

---

## 📊 Monitoraggio e Debugging

### Visualizzare i Log

#### Log del Bot:
```bash
cd trading-bot-ai
tail -f bot.log          # Linux/Mac
type bot.log             # Windows
```

#### Log del Server:
```bash
# Se il server è in esecuzione, i log appaiono nel terminale
# Per salvare i log:
npm start > server.log 2>&1
```

### Report Giornalieri

I report vengono generati automaticamente alle 23:00 (UTC):
```bash
ls -la trading-bot-ai/reports/
cat trading-bot-ai/reports/daily_report_2026-04-17.md
```

### Stato del Bot

**Dashboard Web:**
- Vai a http://localhost:3000/dashboard
- Visualizza statistiche in tempo reale
- Vedi trade recenti e performance

**Via API tRPC:**
```bash
# Il backend espone endpoint tRPC per:
# - trpc.botControl.status     → Stato del bot
# - trpc.botControl.start      → Avvia bot
# - trpc.botControl.stop       → Ferma bot
# - trpc.botControl.backtest   → Esegui backtest
```

---

## ⚙️ Configurazione Account MT5

### File di Configurazione Principale

**Percorso:** `server/config/herofx.config.ts`

```typescript
export const HEROFX_CONFIG = {
  login: 923721,
  password: 'Lt020507!',
  server: 'HeroFx-Trade',
  symbol: 'XAUUSD.r',
  account_type: 'demo',
  // ... altri parametri
};
```

### Parametri di Trading

**Percorso:** `trading-bot-ai/.env`

```env
# HeroFx Account Configuration
HEROFX_LOGIN=923721
HEROFX_PASSWORD=Lt020507!
HEROFX_SERVER=HeroFx-Trade
HEROFX_SYMBOL=XAUUSD.r

# Trading Parameters
DEFAULT_LOT=0.1
MAX_LOT=100
STOP_LOSS_POINTS=20
TAKE_PROFIT_POINTS=40

# Logging
LOG_LEVEL=INFO
```

### Modificare le Credenziali

1. **Apri il file** `trading-bot-ai/.env`
2. **Modifica i valori:**
   ```env
   HEROFX_LOGIN=TUO_LOGIN
   HEROFX_PASSWORD=TUA_PASSWORD
   HEROFX_SERVER=TUO_SERVER
   ```
3. **Salva il file**
4. **Riavvia il bot**

---

## 🔧 Operatività del Bot

### Orari di Trading

Il bot opera **H23** (23 ore al giorno) su **5 giorni su 7**:

- **Lunedì-Venerdì:** Trading attivo 23 ore
- **Sabato-Domenica:** Trading inattivo
- **Simbolo:** XAUUSD.r (Oro)

### Parametri Predefiniti

| Parametro | Valore | Descrizione |
|-----------|--------|-------------|
| Lotto Default | 0.1 | Volume di trading |
| Min Lot | 0.01 | Volume minimo |
| Max Lot | 100 | Volume massimo |
| Stop Loss | 20 punti | Protezione perdite |
| Take Profit | 40 punti | Realizzazione profitti |
| Max Daily Loss | $100 | Perdita massima giornaliera |
| Max Positions | 5 | Posizioni aperte massime |

### Protezione del Capitale

Se la perdita giornaliera supera $100:
1. ⛔ Tutte le posizioni vengono chiuse
2. ⛔ Il bot si ferma
3. ⏰ Riavvio automatico il giorno successivo

---

## 🐛 Troubleshooting

### Errore: "pnpm non riconosciuto"
**Soluzione:** Il sistema usa npm automaticamente. Se vuoi pnpm:
```bash
npm install -g pnpm
```

### Errore: "npm ERR! code ERESOLVE"
**Soluzione:** Usa il flag --legacy-peer-deps:
```bash
npm install --legacy-peer-deps
```

### Errore: "Python non trovato"
**Soluzione:** Installa Python 3.8+ e aggiungi al PATH:
- Windows: https://www.python.org/downloads/
- Linux: `sudo apt-get install python3`
- Mac: `brew install python3`

### Errore: "Connessione MT5 fallita"
**Soluzione:**
1. Verifica che MetaTrader 5 sia installato
2. Verifica le credenziali in `.env`
3. Controlla la connessione internet
4. Verifica che il server HeroFx-Trade sia raggiungibile

### Errore: "Porta 3000 già in uso"
**Soluzione:**
```bash
# Linux/Mac: Trova il processo
lsof -i :3000
kill -9 <PID>

# Windows: PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Il bot non avvia trade
**Soluzione:**
1. Verifica che sia orario di trading (Lun-Ven, non weekend)
2. Controlla il file `bot.log` per errori
3. Verifica che l'account abbia saldo sufficiente
4. Controlla i parametri di trading in `.env`

### Dashboard non mostra dati
**Soluzione:**
1. Assicurati che il bot sia in esecuzione
2. Apri la console browser (F12) per errori
3. Verifica che il server sia raggiungibile a http://localhost:3000
4. Ricarica la pagina (Ctrl+R)

---

## 📞 Supporto e Documentazione

### File Importanti
- **README.md** - Documentazione generale
- **GUIDA_AVVIO.md** - Guida rapida
- **GUIDA_AVVIO_COMPLETA.md** - Questa guida
- **server/config/herofx.config.ts** - Configurazione account
- **trading-bot-ai/run_bot.py** - Script principale bot

### Log e Report
- **trading-bot-ai/bot.log** - Log di esecuzione bot
- **trading-bot-ai/reports/** - Report giornalieri
- **trading-bot-ai/data/trades.json** - Dati trade

### Comandi Utili

```bash
# Verifica lo stato del bot
curl http://localhost:3000/trpc/botControl.status

# Avvia il bot via API
curl -X POST http://localhost:3000/trpc/botControl.start

# Ferma il bot via API
curl -X POST http://localhost:3000/trpc/botControl.stop

# Visualizza ultimi 50 righe del log
tail -50 trading-bot-ai/bot.log

# Conta i trade eseguiti
grep "Trade" trading-bot-ai/bot.log | wc -l
```

---

## ✨ Prossimi Passi

1. **Avvia il bot** usando uno dei metodi sopra
2. **Monitora i trade** dalla dashboard web
3. **Controlla i report** giornalieri in `trading-bot-ai/reports/`
4. **Ottimizza i parametri** in base ai risultati
5. **Configura notifiche** (opzionale) per alert trade

---

**Buon trading! 🚀**

*Ultimo aggiornamento: 17 Aprile 2026*
