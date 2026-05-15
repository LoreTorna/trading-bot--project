import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { HEROFX_CONFIG } from "../config/herofx.config";
import { getHeroFxConnector } from "../services/herofx-connector";

export const herofxRouter = router({
  connect: publicProcedure.mutation(async () => {
    const connector = getHeroFxConnector();
    const connected = await connector.connect();

    if (connected) {
      const accountInfo = connector.getAccountInfo();
      return {
        success: true,
        message: "Connesso a HeroFx",
        accountInfo,
      };
    }

    return {
      success: false,
      message: "Errore di connessione",
    };
  }),

  getAccountInfo: publicProcedure.query(async () => {
    const connector = getHeroFxConnector();

    if (!connector.isConnectedStatus()) {
      throw new Error("Non connesso a HeroFx");
    }

    return connector.getAccountInfo();
  }),

  getQuote: publicProcedure
    .input(
      z.object({
        symbol: z.string().default(HEROFX_CONFIG.defaultSymbol),
      })
    )
    .query(async ({ input }) => {
      const connector = getHeroFxConnector();

      if (!connector.isConnectedStatus()) {
        throw new Error("Non connesso a HeroFx");
      }

      return await connector.getQuote(input.symbol);
    }),

  getPositions: publicProcedure.query(async () => {
    const connector = getHeroFxConnector();

    if (!connector.isConnectedStatus()) {
      throw new Error("Non connesso a HeroFx");
    }

    return await connector.getPositions();
  }),

  openPosition: publicProcedure
    .input(
      z.object({
        symbol: z.string().default(HEROFX_CONFIG.defaultSymbol),
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
        message: `Posizione aperta: ${ticket}`,
      };
    }),

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
        message: `Posizione chiusa: ${input.ticket}`,
      };
    }),

  disconnect: publicProcedure.mutation(async () => {
    const connector = getHeroFxConnector();
    await connector.disconnect();

    return {
      success: true,
      message: "Disconnesso da HeroFx",
    };
  }),

  status: publicProcedure.query(async () => {
    const connector = getHeroFxConnector();
    const isConnected = connector.isConnectedStatus();

    return {
      isConnected,
      status: isConnected ? "Connesso" : "Disconnesso",
    };
  }),
});

export type HeroFxRouter = typeof herofxRouter;
