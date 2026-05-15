import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BotTrade } from "@/lib/bot-data";
import { buildDailyPnlSeries } from "@/lib/bot-data";

interface PnLChartProps {
  trades?: BotTrade[];
}

export function PnLChart({ trades = [] }: PnLChartProps) {
  const data = buildDailyPnlSeries(trades);

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Nessun dato P&amp;L disponibile finche il bot non registra almeno un trade.
      </div>
    );
  }

  return (
    <ResponsiveContainer height={300} width="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis yAxisId="left" />
        <YAxis orientation="right" yAxisId="right" />
        <Tooltip />
        <Legend />
        <Bar dataKey="pnl" fill="#8884d8" name="P&L ($)" yAxisId="left" />
        <Bar dataKey="trades" fill="#82ca9d" name="Trades" yAxisId="right" />
      </BarChart>
    </ResponsiveContainer>
  );
}
