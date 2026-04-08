import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Trade {
  id: number | string;
  symbol: string;
  type: string;
  price: number;
  quantity: number;
  pnl: number;
  time: string | Date;
  status: string;
}

interface TradeHistoryTableProps {
  trades?: Trade[];
}

const defaultTrades: Trade[] = [
  {
    id: 1,
    symbol: "XAUUSD",
    type: "BUY",
    price: 2050.5,
    quantity: 1,
    pnl: 125.5,
    time: "14:30:45",
    status: "Closed",
  },
  {
    id: 2,
    symbol: "XAUUSD",
    type: "SELL",
    price: 2055.2,
    quantity: 1,
    pnl: 85.3,
    time: "15:15:20",
    status: "Closed",
  },
  {
    id: 3,
    symbol: "XAUUSD",
    type: "BUY",
    price: 2048.8,
    quantity: 1,
    pnl: -45.2,
    time: "16:02:10",
    status: "Closed",
  },
  {
    id: 4,
    symbol: "XAUUSD",
    type: "SELL",
    price: 2052.3,
    quantity: 1,
    pnl: 95.7,
    time: "16:45:33",
    status: "Closed",
  },
  {
    id: 5,
    symbol: "XAUUSD",
    type: "BUY",
    price: 2049.5,
    quantity: 1,
    pnl: 0,
    time: "17:20:15",
    status: "Open",
  },
];

export function TradeHistoryTable({ trades = defaultTrades }: TradeHistoryTableProps) {
  const displayTrades = trades.length > 0 ? trades : defaultTrades;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storico Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-left py-2 px-2">Symbol</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Price</th>
                <th className="text-left py-2 px-2">Qty</th>
                <th className="text-left py-2 px-2">P&L</th>
                <th className="text-left py-2 px-2">Time</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayTrades.map((trade) => (
                <tr key={trade.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-2 px-2">{trade.id}</td>
                  <td className="py-2 px-2 font-medium">{trade.symbol}</td>
                  <td className="py-2 px-2">
                    <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>
                      {trade.type}
                    </Badge>
                  </td>
                  <td className="py-2 px-2">${Number(trade.price).toFixed(2)}</td>
                  <td className="py-2 px-2">{trade.quantity}</td>
                  <td className={`py-2 px-2 font-medium ${Number(trade.pnl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Number(trade.pnl) >= 0 ? "+" : ""}{Number(trade.pnl).toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground">
                    {trade.time instanceof Date ? trade.time.toLocaleTimeString() : trade.time}
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant={trade.status === "Closed" || trade.status === "closed" ? "outline" : "default"}>
                      {trade.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
