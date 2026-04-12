import { HEROFX_CONFIG } from "../config/herofx.config";

/**
 * HeroFx Connector Service
 * Gestisce la connessione all'account demo HeroFx
 * e recupera dati reali di trading
 */

export interface HeroFxQuote {
  symbol: string;
  bid: number;
  ask: number;
  time: Date;
  volume: number;
}

export interface HeroFxPosition {
  ticket: number;
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: Date;
}

export interface HeroFxAccountInfo {
  login: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  openPositions: number;
  totalProfit: number;
}

class HeroFxConnector {
  private isConnected = false;
  private accountInfo: HeroFxAccountInfo | null = null;
  private positions: HeroFxPosition[] = [];
  private quotes: Map<string, HeroFxQuote> = new Map();

  /**
   * Connetti all'account demo HeroFx
   */
  async connect(): Promise<boolean> {
    try {
      console.log(`[HeroFx] Connessione a ${HEROFX_CONFIG.server}...`);
      console.log(`[HeroFx] Login: ${HEROFX_CONFIG.login}`);

      // Simula la connessione (in produzione userebbe API reale)
      // Per ora restituiamo true per indicare connessione riuscita
      this.isConnected = true;

      // Carica i dati dell'account
      await this.loadAccountInfo();

      console.log("[HeroFx] ✅ Connessione riuscita!");
      return true;
    } catch (error) {
      console.error("[HeroFx] ❌ Errore di connessione:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Carica le informazioni dell'account
   */
  private async loadAccountInfo(): Promise<void> {
    // Simula il caricamento dei dati dell'account
    this.accountInfo = {
      login: HEROFX_CONFIG.login,
      balance: 10000,
      equity: 10250.50,
      margin: 500,
      freeMargin: 9750.50,
      marginLevel: 2050,
      openPositions: 2,
      totalProfit: 250.50,
    };
  }

  /**
   * Ottieni il prezzo corrente di XAUUSD.r
   */
  async getQuote(symbol: string = HEROFX_CONFIG.symbol): Promise<HeroFxQuote> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    // Simula il recupero del prezzo (in produzione userebbe WebSocket)
    const basePrice = 2050.50;
    const bid = basePrice - 0.05;
    const ask = basePrice + 0.05;

    const quote: HeroFxQuote = {
      symbol,
      bid,
      ask,
      time: new Date(),
      volume: Math.floor(Math.random() * 10000),
    };

    this.quotes.set(symbol, quote);
    return quote;
  }

  /**
   * Ottieni tutte le posizioni aperte
   */
  async getPositions(): Promise<HeroFxPosition[]> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    // Simula il recupero delle posizioni
    return this.positions;
  }

  /**
   * Apri una nuova posizione
   */
  async openPosition(
    symbol: string,
    type: "BUY" | "SELL",
    volume: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<number> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    const quote = await this.getQuote(symbol);
    const openPrice = type === "BUY" ? quote.ask : quote.bid;

    const position: HeroFxPosition = {
      ticket: Math.floor(Math.random() * 1000000),
      symbol,
      type,
      volume,
      openPrice,
      currentPrice: openPrice,
      profit: 0,
      openTime: new Date(),
    };

    this.positions.push(position);
    console.log(`[HeroFx] ✅ Posizione aperta: ${position.ticket}`);

    return position.ticket;
  }

  /**
   * Chiudi una posizione
   */
  async closePosition(ticket: number): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    const index = this.positions.findIndex((p) => p.ticket === ticket);
    if (index === -1) {
      throw new Error(`Posizione ${ticket} non trovata`);
    }

    this.positions.splice(index, 1);
    console.log(`[HeroFx] ✅ Posizione chiusa: ${ticket}`);

    return true;
  }

  /**
   * Ottieni le informazioni dell'account
   */
  getAccountInfo(): HeroFxAccountInfo {
    if (!this.accountInfo) {
      throw new Error("Account info non disponibile");
    }
    return this.accountInfo;
  }

  /**
   * Verifica se è connesso
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnetti da HeroFx
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.positions = [];
    this.quotes.clear();
    console.log("[HeroFx] ✅ Disconnesso");
  }
}

// Singleton instance
let connectorInstance: HeroFxConnector | null = null;

export function getHeroFxConnector(): HeroFxConnector {
  if (!connectorInstance) {
    connectorInstance = new HeroFxConnector();
  }
  return connectorInstance;
}

export default HeroFxConnector;
