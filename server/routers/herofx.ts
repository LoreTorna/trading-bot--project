import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getHeroFxConnector } from "../services/herofx-connector";

export const herofxRouter = router({
  /**
   * Connetti all'account demo HeroFx
   */
  connect: publicProcedure.mutation(async () => {
    const connector = getHeroFxConnector();
    const connected = await connector.connect();

    if (connected) {
      const accountInfo = connector.getAccountInfo();
      return {
        success: true,
        message: "✅ Connesso a HeroFx",
        accountInfo,
      };
    } else {
      return {
        success: false,
        message: "❌ Errore di connessione",
      };
    }
  }),

  /**
   * Ottieni le informazioni dell'account
   */
  getAccountInfo: publicProcedure.query(async () => {
    const connector = getHeroFxConnector();

    if (!connector.isConnectedStatus()) {
      throw new Error("Non connesso a HeroFx");
    }

    return connector.getAccountInfo();
  }),

  /**
   * Ottieni il prezzo corrente di XAUUSD.r
   */
  getQuote: publicProcedure
    .input(
      z.object({
        symbol: z.string().default("XAUUSD.r"),
      })
    )
    .query(async ({ input }) => {
      const connector = getHeroFxConnector();

      if (!connector.isConnectedStatus()) {
        throw new Error("Non connesso a HeroFx");
      }

      return await connector.getQuote(input.symbol);
    }),

  /**
   * Ottieni tutte le posizioni aperte
   */
  getPositions: publicProcedure.query(async () => {
    const connector = getHeroFxConnector();

    if (!connector.isConnectedStatus()) {
      throw new Error("Non connesso a HeroFx");
    }

    return await connector.getPositions();
  }),

  /**
   * Apri una nuova posizione
   */
  openPosition: publicProcedure
    .input(
      z.object({
        symbol: z.string().default("XAUUSD.r"),
        type: z.enum(["BUY", "SELL"]),
        volume: z.number().positive(),
        stopLoss: z.number().optional(),
        takeProfit: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const connector = getHeroFxConnector();

      if (!connector.isConnectedStatus()) {
        throw new Error("Non connesso a HeroFx");
      }

      const ticket = await connector.openPosition(
        input.symbol,
        input.type,
        input.volume,
        input.stopLoss,
        input.takeProfit
      );

      return {
        success: true,
        ticket,
        message: `✅ Posizione aperta: ${ticket}`,
      };
    }),

  /**
   * Chiudi una posizione
   */
  closePosition: publicProcedure
    .input(
      z.object({
        ticket: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const connector = getHeroFxConnector();

      if (!connector.isConnectedStatus()) {
        throw new Error("Non connesso a HeroFx");
      }

      await connector.closePosition(input.ticket);

      return {
        success: true,
        message: `✅ Posizione chiusa: ${input.ticket}`,
      };
    }),

  /**
   * Disconnetti da HeroFx
   */
  disconnect: publicProcedure.mutation(async () => {
    const connector = getHeroFxConnector();
    await connector.disconnect();

    return {
      success: true,
      message: "✅ Disconnesso da HeroFx",
    };
  }),

  /**
   * Verifica lo stato della connessione
   */
  status: publicProcedure.query(async () => {
    const connector = getHeroFxConnector();
    const isConnected = connector.isConnectedStatus();

    return {
      isConnected,
      status: isConnected ? "🟢 Connesso" : "🔴 Disconnesso",
    };
  }),
});

export type HeroFxRouter = typeof herofxRouter;
