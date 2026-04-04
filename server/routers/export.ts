import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as exportService from "../services/export";

export const exportRouter = router({
  exportTradesCSV: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const buffer = await exportService.exportTradesCSV(input.userId);
      return {
        data: buffer.toString("base64"),
        filename: `trades-${new Date().toISOString().split("T")[0]}.csv`,
        mimeType: "text/csv",
      };
    }),

  exportMetricsPDF: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const buffer = await exportService.exportMetricsPDF(input.userId);
      return {
        data: buffer.toString("base64"),
        filename: `metrics-${new Date().toISOString().split("T")[0]}.pdf`,
        mimeType: "application/pdf",
      };
    }),

  exportBacktestReportPDF: publicProcedure
    .input(z.object({ userId: z.number(), backtestId: z.number() }))
    .query(async ({ input }) => {
      const buffer = await exportService.exportBacktestReportPDF(input.userId, input.backtestId);
      return {
        data: buffer.toString("base64"),
        filename: `backtest-report-${input.backtestId}.pdf`,
        mimeType: "application/pdf",
      };
    }),
});
