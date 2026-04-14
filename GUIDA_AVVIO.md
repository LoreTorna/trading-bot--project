# 🚀 Guida di Avvio - Trading Bot Project

Questa guida ti aiuterà ad avviare il sistema completo (Sito Web + Bot di Trading) configurato per l'account HeroFx su XAUUSD.r.

## 📋 Prerequisiti
- Node.js installato sul sistema.
- Python 3.x installato (per l'esecuzione degli script del bot).
- Connessione internet attiva.

## 🛠️ Ordine di Avvio

### 1. Avvio del Sito Web (Dashboard di Controllo)
Il sito web funge da centro di comando per il bot. Per avviarlo:

1. Apri il terminale nella cartella principale del progetto.
2. Esegui il comando:
   ```bash
   npm run start:all
   ```
   *Oppure su Windows puoi semplicemente cliccare su `start.bat`.*

3. Una volta avviato, apri il browser all'indirizzo: `http://localhost:3000`

### 2. Configurazione e Avvio Bot dal Sito
Una volta dentro il sito:

1. **Setup Iniziale**: Vai nella tab "Controllo" e clicca su **"Esegui Setup"**. Questo installerà le dipendenze necessarie per il bot Python.
2. **Verifica Account**: Vai nella tab **"Account MT5"** per confermare che le credenziali (Login: 923721, Server: HeroFx-Trade) siano caricate correttamente.
3. **Avvio Bot**: Torna nella tab "Controllo" e clicca sul bottone verde **"Avvia Bot"**.
   - Il bot inizierà a girare in background.
   - Vedrai lo stato cambiare in **"🟢 Attivo"**.
   - L'uptime inizierà a contare.

## 📊 Operatività del Bot
- **Simbolo**: XAUUSD.r (Oro)
- **Orario**: H23 (23 ore al giorno, 5 giorni su 7).
- **Chiusura**: Il bot si ferma automaticamente quando il mercato dell'oro chiude nel weekend.
- **Monitoraggio**: Puoi seguire le performance in tempo reale nella sezione **"Dashboard"**.

## 📁 Struttura File
- `server/config/herofx.config.ts`: Contiene le tue credenziali MT5.
- `trading-bot-ai/`: Contiene gli script Python reali che eseguono il trading.
- `client/src/pages/Home.tsx`: La pagina principale dinamica che hai richiesto.

---
*Nota: Assicurati che il terminale rimanga aperto mentre il bot è in esecuzione.*
