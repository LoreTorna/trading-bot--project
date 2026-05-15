import {
  getSymbolProfile,
  normalizeSymbolList,
} from "../../shared/trading";
import { HEROFX_CONFIG } from "../config/herofx.config";

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
  private quotes = new Map<string, HeroFxQuote>();
  private lastMidPrices = new Map<string, number>();

  async connect(): Promise<boolean> {
    try {
      console.log(`[HeroFx] Connecting to ${HEROFX_CONFIG.server}`);
      console.log(`[HeroFx] Login: ${HEROFX_CONFIG.login}`);
      this.isConnected = true;
      await this.loadAccountInfo();
      console.log("[HeroFx] Connected");
      return true;
    } catch (error) {
      console.error("[HeroFx] Connection error:", error);
      this.isConnected = false;
      return false;
    }
  }

  private async loadAccountInfo(): Promise<void> {
    const totalProfit = this.positions.reduce(
      (accumulator, position) => accumulator + position.profit,
      0
    );

    this.accountInfo = {
      login: HEROFX_CONFIG.login,
      balance: 10000,
      equity: 10000 + totalProfit,
      margin: 500,
      freeMargin: 9500 + totalProfit,
      marginLevel: 2000,
      openPositions: this.positions.length,
      totalProfit,
    };
  }

  private nextMidPrice(symbol: string): number {
    const profile = getSymbolProfile(symbol);
    const previous =
      this.lastMidPrices.get(symbol) ?? profile.simulationStartPrice;
    const absoluteMove =
      profile.market === "crypto"
        ? (Math.random() - 0.5) * 240
        : (Math.random() - 0.5) * 1.2;
    const nextValue = Math.min(
      Math.max(previous + absoluteMove, profile.simulationStartPrice * 0.35),
      profile.simulationStartPrice * 2.5
    );
    this.lastMidPrices.set(symbol, nextValue);
    return Number(nextValue.toFixed(profile.pricePrecision));
  }

  async getQuote(
    symbol: string = HEROFX_CONFIG.defaultSymbol
  ): Promise<HeroFxQuote> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    const normalizedSymbol = normalizeSymbolList(
      [symbol],
      [HEROFX_CONFIG.defaultSymbol]
    )[0];
    const profile = getSymbolProfile(normalizedSymbol);
    const midPrice = this.nextMidPrice(normalizedSymbol);
    const spread = profile.market === "crypto" ? 12 : 0.12;
    const bid = Number((midPrice - spread / 2).toFixed(profile.pricePrecision));
    const ask = Number((midPrice + spread / 2).toFixed(profile.pricePrecision));

    const quote: HeroFxQuote = {
      symbol: normalizedSymbol,
      bid,
      ask,
      time: new Date(),
      volume: Math.floor(Math.random() * 10000) + 1000,
    };

    this.quotes.set(normalizedSymbol, quote);
    return quote;
  }

  async getPositions(): Promise<HeroFxPosition[]> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    return this.positions;
  }

  async openPosition(
    symbol: string,
    type: "BUY" | "SELL",
    volume: number,
    _stopLoss?: number,
    _takeProfit?: number
  ): Promise<number> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    const normalizedSymbol = normalizeSymbolList(
      [symbol],
      [HEROFX_CONFIG.defaultSymbol]
    )[0];
    const quote = await this.getQuote(normalizedSymbol);
    const openPrice = type === "BUY" ? quote.ask : quote.bid;

    const position: HeroFxPosition = {
      ticket: Math.floor(Math.random() * 1000000),
      symbol: normalizedSymbol,
      type,
      volume,
      openPrice,
      currentPrice: openPrice,
      profit: 0,
      openTime: new Date(),
    };

    this.positions.push(position);
    await this.loadAccountInfo();
    console.log(`[HeroFx] Position opened: ${position.ticket}`);
    return position.ticket;
  }

  async closePosition(ticket: number): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error("Non connesso a HeroFx");
    }

    const index = this.positions.findIndex((position) => position.ticket === ticket);
    if (index === -1) {
      throw new Error(`Posizione ${ticket} non trovata`);
    }

    this.positions.splice(index, 1);
    await this.loadAccountInfo();
    console.log(`[HeroFx] Position closed: ${ticket}`);
    return true;
  }

  getAccountInfo(): HeroFxAccountInfo {
    if (!this.accountInfo) {
      throw new Error("Account info non disponibile");
    }

    return this.accountInfo;
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.positions = [];
    this.quotes.clear();
    this.lastMidPrices.clear();
    await this.loadAccountInfo().catch(() => undefined);
    console.log("[HeroFx] Disconnected");
  }
}

let connectorInstance: HeroFxConnector | null = null;

export function getHeroFxConnector(): HeroFxConnector {
  if (!connectorInstance) {
    connectorInstance = new HeroFxConnector();
  }

  return connectorInstance;
}

export default HeroFxConnector;
