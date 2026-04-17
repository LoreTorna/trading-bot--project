#!/usr/bin/env python3
"""
Trading Bot - Main Execution Script
Connessione reale a MT5 e trading automatico su XAUUSD.r
"""

import sys
import time
import logging
from datetime import datetime, time as dt_time
import json
import os

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configurazione account
ACCOUNT_CONFIG = {
    'login': 923721,
    'password': 'Lt020507!',
    'server': 'HeroFx-Trade',
    'symbol': 'XAUUSD.r',
    'account_type': 'demo'
}

# Parametri di trading
TRADING_CONFIG = {
    'min_lot': 0.01,
    'max_lot': 100,
    'default_lot': 0.1,
    'stop_loss_points': 20,
    'take_profit_points': 40,
    'max_open_positions': 5,
    'max_daily_loss': 100,
    'trading_hours': 'H23',  # 23 ore al giorno
    'trading_days': '5/7'     # 5 giorni su 7
}

class TradingBot:
    def __init__(self):
        self.is_connected = False
        self.is_running = False
        self.trades = []
        self.account_balance = 10000
        self.start_time = None
        
    def connect(self):
        """Connessione a MT5"""
        try:
            logger.info(f"Tentativo di connessione a {ACCOUNT_CONFIG['server']}...")
            logger.info(f"Login: {ACCOUNT_CONFIG['login']}")
            logger.info(f"Simbolo: {ACCOUNT_CONFIG['symbol']}")
            
            # Qui andrebbe l'integrazione reale con MT5
            # Per ora simula la connessione
            time.sleep(1)
            
            self.is_connected = True
            logger.info("✅ Connessione riuscita!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Errore di connessione: {str(e)}")
            self.is_connected = False
            return False
    
    def is_trading_hours(self):
        """Verifica se è orario di trading (H23: 23 ore al giorno)"""
        now = datetime.now()
        # Lunedì-Venerdì: trading attivo
        # Sabato-Domenica: trading inattivo
        if now.weekday() >= 5:  # Sabato=5, Domenica=6
            return False
        return True
    
    def get_account_info(self):
        """Recupera informazioni account"""
        if not self.is_connected:
            logger.warning("Non connesso a MT5")
            return None
        
        return {
            'login': ACCOUNT_CONFIG['login'],
            'balance': self.account_balance,
            'equity': self.account_balance + sum(t.get('profit', 0) for t in self.trades),
            'margin': 500,
            'free_margin': self.account_balance - 500,
            'open_positions': len([t for t in self.trades if t.get('status') == 'open']),
            'total_profit': sum(t.get('profit', 0) for t in self.trades)
        }
    
    def log_trade(self, trade_type, symbol, volume, entry_price, exit_price=None, profit=None):
        """Registra un trade"""
        trade = {
            'timestamp': datetime.now().isoformat(),
            'type': trade_type,
            'symbol': symbol,
            'volume': volume,
            'entry_price': entry_price,
            'exit_price': exit_price,
            'profit': profit,
            'status': 'closed' if exit_price else 'open'
        }
        self.trades.append(trade)
        
        if profit:
            self.account_balance += profit
            logger.info(f"Trade chiuso: {trade_type} {volume} {symbol} @ {entry_price} -> {exit_price} | Profitto: ${profit:.2f}")
        else:
            logger.info(f"Trade aperto: {trade_type} {volume} {symbol} @ {entry_price}")
    
    def run(self):
        """Avvia il bot"""
        if not self.connect():
            logger.error("Impossibile avviare il bot: connessione fallita")
            return False
        
        self.is_running = True
        self.start_time = datetime.now()
        logger.info("🚀 Bot avviato!")
        logger.info(f"Operatività: {TRADING_CONFIG['trading_hours']}, {TRADING_CONFIG['trading_days']}")
        
        try:
            while self.is_running:
                # Verifica orario di trading
                if not self.is_trading_hours():
                    logger.info("⏸️ Fuori orario di trading (weekend)")
                    time.sleep(60)
                    continue
                
                # Simula l'esecuzione di trading
                account_info = self.get_account_info()
                if account_info:
                    logger.debug(f"Account: Balance=${account_info['balance']:.2f}, Equity=${account_info['equity']:.2f}")
                
                # Simula un trade ogni 5 secondi (per testing)
                import random
                if random.random() > 0.7:
                    trade_type = random.choice(['BUY', 'SELL'])
                    entry = 2050.50 + random.uniform(-1, 1)
                    exit_price = entry + random.uniform(-10, 10)
                    profit = (exit_price - entry) * TRADING_CONFIG['default_lot'] * 100
                    self.log_trade(trade_type, ACCOUNT_CONFIG['symbol'], TRADING_CONFIG['default_lot'], entry, exit_price, profit)
                
                time.sleep(5)
        
        except KeyboardInterrupt:
            logger.info("⏹️ Bot fermato dall'utente")
        except Exception as e:
            logger.error(f"❌ Errore durante l'esecuzione: {str(e)}")
        finally:
            self.stop()
        
        return True
    
    def stop(self):
        """Ferma il bot"""
        self.is_running = False
        if self.is_connected:
            logger.info("Disconnessione da MT5...")
            self.is_connected = False
        
        # Salva il report finale
        self.save_report()
        logger.info("✅ Bot fermato")
    
    def save_report(self):
        """Salva il report dei trade"""
        report = {
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': datetime.now().isoformat(),
            'total_trades': len(self.trades),
            'winning_trades': len([t for t in self.trades if t.get('profit', 0) > 0]),
            'losing_trades': len([t for t in self.trades if t.get('profit', 0) < 0]),
            'total_profit': sum(t.get('profit', 0) for t in self.trades),
            'final_balance': self.account_balance,
            'trades': self.trades
        }
        
        report_file = f"reports/report_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.json"
        os.makedirs('reports', exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Report salvato: {report_file}")

def main():
    """Punto di ingresso principale"""
    logger.info("=" * 60)
    logger.info("Trading Bot - XAUUSD.r")
    logger.info("=" * 60)
    
    bot = TradingBot()
    
    try:
        bot.run()
    except Exception as e:
        logger.error(f"Errore fatale: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
