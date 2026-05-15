# Miglioramento Strategia e Deploy in Cloud 24/7

L'obiettivo è aumentare i profitti della strategia corrente e fare in modo che il bot operi in autonomia su un server cloud 24 ore su 24, 7 giorni su 7, permettendoti di gestirlo senza tenere il PC acceso.

## User Review Required

> [!WARNING]  
> Modificare la strategia per "rendere molto di più" implica **aumentare il rischio**. Le configurazioni aggressive possono portare a guadagni più elevati ma anche a drawdown (perdite) più marcati. Sei d'accordo ad aumentare il rischio o preferisci mantenere un profilo conservativo?

> [!IMPORTANT]  
> Riguardo al Cloud, il pacchetto Python ufficiale `MetaTrader5` funziona **solo su sistemi Windows** perché si aggancia al terminale MT5 aperto. Abbiamo due opzioni per il Cloud:
>
> **Opzione 1 (Consigliata per stabilità e costi): Windows VPS**
> Noleggi un server cloud Windows economico (es. Contabo a ~6€/mese o AWS EC2), ci installiamo MT5 e il bot, e lo facciamo girare 24/7. Il bot ha già un server e un'interfaccia web integrata: potrai collegarti al tuo server cloud dal browser del tuo telefono o PC per vedere i profitti e spegnere/accendere il bot.
> 
> **Opzione 2 (MetaApi Cloud):**
> Usare un servizio di terze parti come **MetaApi.cloud**, che fa da "ponte" API tra il bot (che a quel punto potrebbe girare su Vercel, Heroku o Linux) e il tuo conto HeroFx. Questo richiede una **riscrittura totale** di tutto il codice di connessione a MT5 e ha dei costi mensili per MetaApi (circa $20-25/mese per latenza accettabile).
>
> **Quale opzione preferisci per il Cloud? (Rispondi nel prossimo messaggio)**

## Proposed Changes

### 1. Miglioramento della Strategia (Aggressività e Profitti)

Modificherò la strategia per renderla molto più profittevole e reattiva:

- **Ottimizzazione Filtri AI e Score:** Abbasserò la soglia minima di "confidence" dell'AI per catturare più trade (frequenza maggiore). Attualmente l'AI scarta troppi segnali buoni.
- **Risk Management Dinamico:** Aumenterò il rischio dal 1.5% al 3% (o 2.5%) per trade, permettendo al bot di usare lotti più grandi basati sull'ATR e sui tuoi capitali (effetto compounding).
- **Trailing Stop Aggressivo:** Implementerò un trailing stop più stretto per i trade in profitto, così da "mettere in cassaforte" i guadagni veloci dello scalping senza farli tornare a breakeven.
- **Volumi e Momentum:** Darò molto più peso agli "spike" di volume e all'accelerazione dei prezzi nelle candele da 1 minuto, che sono il vero motore dello scalping.

#### [MODIFY] `trading-bot-ai/trading_config.py`
- Aggiornamento dei parametri `SYMBOL_PROFILES` per Gold e BTC (lot size, risk percent).
- Modifica dei pesi in `SCALPING_INDICATORS` per favorire segnali veloci.

#### [MODIFY] `trading-bot-ai/run_bot.py`
- Riscrittura della gestione del `buy_score`/`sell_score` per lanciare i trade più in fretta senza aspettare allineamenti troppo perfetti che fanno perdere il treno.
- Implementazione di logica avanzata per il `Trailing Stop` a runtime, che sposta lo Stop Loss man mano che il trade va in profitto.

### 2. Configurazione per Cloud API

Se scegli l'Opzione 1 (VPS):
- Preparerò uno script `install_vps.bat` e le istruzioni esatte per farti installare tutto sul server cloud in 5 minuti.
- Mi assicurerò che il pannello web del bot (il "cruscotto" React/Node.js) esponga le **API** in modo che tu possa raggiungere l'indirizzo IP del cloud (es. `http://tuo-ip-cloud:3000`) dal tuo telefono e vedere cosa fa il bot 24/7.

Se scegli l'Opzione 2 (MetaApi):
- Dovrò sostituire interamente la libreria `MetaTrader5` locale con `metaapi-cloud-sdk` e adattare tutta la logica `async/await` per recuperare i prezzi in tempo reale.

## Verification Plan

1. Eseguirò un **backtest** (se possibile localmente) o un test a mercato aperto sui nuovi parametri per assicurarmi che il bot non apra ordini impazziti.
2. Ti aiuterò a fare il **deploy in Cloud** passo dopo passo appena avrai scelto l'infrastruttura.
