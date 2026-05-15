# HeroFx Trading Bot - Guida al Deployment

## Configurazione Locale

### Prerequisiti
- Python 3.8+
- Node.js 18+
- MetaTrader 5 (per trading live su Windows)
- Git

### Setup Iniziale

1. **Clona il repository**
```bash
git clone https://github.com/LoreTorna/trading-bot--project.git
cd trading-bot--project
```

2. **Configura le credenziali HeroFx**
Crea un file `.env` nella root del progetto (usa `.env.example` come base):
```env
HEROFX_LOGIN=923721
HEROFX_PASSWORD=Lt020507!
HEROFX_SERVER=HeroFx-Trade
MT5_FORCE_SIMULATION=false
ALLOW_SIMULATION_FALLBACK=true
DATA_DIR=./data
```

3. **Installa le dipendenze**
```bash
# Installa dipendenze Node.js
npm install

# Installa dipendenze Python
cd trading-bot-ai
pip install -r requirements.txt
cd ..
```

## Esecuzione Locale

### Opzione 1: Script di Avvio Unificato (Consigliato)
```bash
npm start
```
Questo script installerà le dipendenze mancanti, compilerà il progetto e avvierà il server.
La dashboard sarà accessibile su http://localhost:3000.

### Opzione 2: Esecuzione Manuale

**Terminal 1 - Bot di Trading (Background)**
```bash
cd trading-bot-ai
python run_bot_persistent.py
```

**Terminal 2 - Dashboard Web**
```bash
npm run dev
```

## Deployment Cloud (24/7)

Per far girare il bot a PC spento, hai due opzioni principali:

### Opzione A: Cloud Computer (Manus Persistent VM)
Se stai usando Manus, puoi richiedere un **Cloud Computer** persistente. 
- È un server Ubuntu sempre acceso.
- Ideale per bot che devono girare 24/7.
- **Nota**: MT5 richiede Windows per il trading live. Su Linux (Cloud Computer), il bot girerà in modalità **Simulazione** a meno che non si configuri Wine (complesso) o si usi una VPS Windows.

### Opzione B: VPS Windows (Consigliato per MT5 Live)
Per il trading live con MT5 desktop, la soluzione migliore è una VPS Windows (es. Aruba, Contabo, AWS).
1. Acquista una VPS Windows.
2. Installa MetaTrader 5 e accedi al tuo account HeroFx.
3. Clona questo repository sulla VPS.
4. Esegui `npm start`.

## Monitoraggio

### Log del Bot
I log sono disponibili in `./logs/bot.log`.

### Dati in Tempo Reale
Il sito web si aggiorna automaticamente tramite WebSocket e polling ogni 5 secondi.
I dati sono salvati in:
- `./data/trades.json` - Storico operazioni
- `./data/metrics.json` - Metriche di performance

## Troubleshooting

### Errore: "HEROFX_PASSWORD is empty"
- Verifica che il file `.env` sia presente nella root e contenga la password.
- Assicurati di non avere spazi extra intorno alla password.

### Errore: "MetaTrader5 package not available"
- Su Windows: `pip install MetaTrader5`.
- Su Linux/Mac: Il pacchetto non è disponibile nativamente. Il bot userà la simulazione.

### Dashboard non si carica
- Verifica che `npm start` sia in esecuzione senza errori.
- Controlla che la porta 3000 non sia occupata da un altro processo.
