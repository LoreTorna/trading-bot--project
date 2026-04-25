import { Badge } from "@/components/ui/badge";
import type { BotTrade } from "@/lib/bot-data";
import { getTradeProfit, normalizeTrades } from "@/lib/bot-data";

interface TradeHistoryTableProps {
  trades?: BotTrade[];
}

function formatTradeTime(value: string | Date) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function TradeHistoryTable({ trades = [] }: TradeHistoryTableProps) {
  const displayTrades = normalizeTrades(trades);

  if (displayTrades.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nessun trade disponibile al momento. Avvia il bot o esegui un backtest per popolare lo storico.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-2 text-left">ID</th>
            <th className="px-2 py-2 text-left">Simbolo</th>
            <th className="px-2 py-2 text-left">Tipo</th>
            <th className="px-2 py-2 text-left">Prezzo</th>
            <th className="px-2 py-2 text-left">Qty</th>
            <th className="px-2 py-2 text-left">P&L</th>
            <th className="px-2 py-2 text-left">Ora</th>
            <th className="px-2 py-2 text-left">Stato</th>
          </tr>
        </thead>
        <tbody>
          {displayTrades.map((trade) => {
            const pnl = getTradeProfit(trade);

            return (
              <tr
                key={trade.id}
                className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td className="px-2 py-2">{trade.id}</td>
                <td className="px-2 py-2 font-medium">{trade.symbol}</td>
                <td className="px-2 py-2">
                  <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>
                    {trade.type}
                  </Badge>
                </td>
                <td className="px-2 py-2">${Number(trade.price).toFixed(2)}</td>
                <td className="px-2 py-2">{trade.quantity}</td>
                <td
                  className={`px-2 py-2 font-medium ${
                    pnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-xs text-muted-foreground">
                  {formatTradeTime(trade.time)}
                </td>
                <td className="px-2 py-2">
                  <Badge
                    variant={
                      trade.status === "Closed" || trade.status === "closed"
                        ? "outline"
                        : "default"
                    }
                  >
                    {trade.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
