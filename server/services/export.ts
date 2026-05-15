import PDFDocument from "pdfkit";
import { createObjectCsvWriter } from "csv-writer";
import * as db from "../db";
import { Readable } from "stream";

export async function exportTradesCSV(userId: number): Promise<Buffer> {
  const trades = await db.getTrades(userId, 10000);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const csvData = trades.map((trade: any) => ({
      Date: new Date(trade.entryTime).toISOString(),
      Symbol: trade.symbol,
      Type: trade.type,
      Quantity: trade.quantity,
      EntryPrice: trade.entryPrice,
      ExitPrice: trade.exitPrice || "N/A",
      PnL: trade.pnl || "N/A",
      PnL_Percent: trade.pnlPercent || "N/A",
      Status: trade.status,
      StopLoss: trade.stopLoss || "N/A",
      TakeProfit: trade.takeProfit || "N/A",
    }));

    // Create CSV string
    const headers = Object.keys(csvData[0] || {});
    let csv = headers.join(",") + "\n";

    csvData.forEach((row: any) => {
      csv += headers.map((h) => `"${row[h]}"`).join(",") + "\n";
    });

    resolve(Buffer.from(csv, "utf-8"));
  });
}

export async function exportMetricsPDF(userId: number): Promise<Buffer> {
  const metrics = await db.getDailyMetrics(userId, 90);
  const stats: any = await db.getTradeStats(userId, 90);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc.fontSize(24).font("Helvetica-Bold").text("Trading Bot Performance Report", { align: "center" });
    doc.moveDown();

    // Summary stats
    doc.fontSize(14).font("Helvetica-Bold").text("Summary Statistics", { underline: true });
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Trades: ${stats.totalTrades}`);
    doc.text(`Winning Trades: ${stats.winningTrades}`);
    doc.text(`Losing Trades: ${stats.losingTrades}`);
    doc.text(`Win Rate: ${stats.winRate.toFixed(2)}%`);
    doc.text(`Total P&L: $${stats.totalPnL.toFixed(2)}`);
    doc.text(`Average Win: $${stats.avgWin.toFixed(2)}`);
    doc.text(`Average Loss: $${stats.avgLoss.toFixed(2)}`);
    doc.moveDown();

    // Daily metrics table
    doc.fontSize(14).font("Helvetica-Bold").text("Daily Metrics (Last 90 Days)", { underline: true });
    doc.fontSize(9).font("Helvetica");

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;

    doc.text("Date", col1, tableTop);
    doc.text("Portfolio Value", col2, tableTop);
    doc.text("Daily P&L", col3, tableTop);
    doc.text("Win Rate", col4, tableTop);
    doc.text("Sharpe Ratio", col5, tableTop);

    let y = tableTop + 15;
    metrics.slice(0, 30).forEach((metric: any) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      doc.text(new Date(metric.date).toLocaleDateString(), col1, y);
      doc.text(`$${metric.portfolioValue}`, col2, y);
      doc.text(`$${metric.dailyPnL}`, col3, y);
      doc.text(`${metric.winRate.toFixed(2)}%`, col4, y);
      doc.text(`${metric.sharpeRatio?.toFixed(2) || "N/A"}`, col5, y);
      y += 15;
    });

    doc.end();
  });
}

export async function exportBacktestReportPDF(userId: number, backtestId: number): Promise<Buffer> {
  const results = await db.getBacktestResults(userId);
  const result = results.find((r: any) => r.id === backtestId);

  if (!result) throw new Error("Backtest result not found");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title
    doc.fontSize(24).font("Helvetica-Bold").text(`Backtest Report: ${result.strategyName}`, { align: "center" });
    doc.moveDown();

    // Backtest details
    doc.fontSize(12).font("Helvetica-Bold").text("Backtest Details");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Period: ${new Date(result.startDate).toLocaleDateString()} - ${new Date(result.endDate).toLocaleDateString()}`);
    doc.text(`Initial Capital: $${result.initialCapital}`);
    doc.text(`Final Capital: $${result.finalCapital}`);
    doc.moveDown();

    // Performance metrics
    doc.fontSize(12).font("Helvetica-Bold").text("Performance Metrics");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Return: ${result.totalReturn.toFixed(2)}%`);
    doc.text(`Annual Return: ${result.annualReturn?.toFixed(2) || "N/A"}%`);
    doc.text(`Sharpe Ratio: ${result.sharpeRatio?.toFixed(2) || "N/A"}`);
    doc.text(`Max Drawdown: ${result.maxDrawdown?.toFixed(2) || "N/A"}%`);
    doc.text(`Win Rate: ${result.winRate?.toFixed(2) || "N/A"}%`);
    doc.text(`Profit Factor: ${result.profitFactor?.toFixed(2) || "N/A"}`);
    doc.moveDown();

    // Trade statistics
    doc.fontSize(12).font("Helvetica-Bold").text("Trade Statistics");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Trades: ${result.totalTrades}`);
    doc.text(`Winning Trades: ${result.winningTrades}`);
    doc.text(`Losing Trades: ${result.losingTrades}`);
    doc.text(`Average Win: $${result.avgWin?.toFixed(2) || "N/A"}`);
    doc.text(`Average Loss: $${result.avgLoss?.toFixed(2) || "N/A"}`);

    if (result.report) {
      doc.moveDown();
      doc.fontSize(12).font("Helvetica-Bold").text("Detailed Report");
      doc.fontSize(10).font("Helvetica");
      doc.text(result.report, { align: "left", width: 500 });
    }

    doc.end();
  });
}
