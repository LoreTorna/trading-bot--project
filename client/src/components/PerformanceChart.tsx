import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BotMetrics, BotTrade } from "@/lib/bot-data";
import { buildPerformanceSeries } from "@/lib/bot-data";

interface PerformanceChartProps {
  trades?: BotTrade[];
  metrics?: BotMetrics | null;
}

export function PerformanceChart({
  trades = [],
  metrics = null,
}: PerformanceChartProps) {
  const data = buildPerformanceSeries(trades, metrics);

  return (
    <ResponsiveContainer height={300} width="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis yAxisId="left" />
        <YAxis orientation="right" yAxisId="right" />
        <Tooltip />
        <Legend />
        <Line
          dataKey="value"
          dot={data.length < 2}
          name="Portfolio Value ($)"
          stroke="#3b82f6"
          strokeWidth={2}
          type="monotone"
          yAxisId="left"
        />
        <Line
          dataKey="return"
          dot={data.length < 2}
          name="Return (%)"
          stroke="#10b981"
          strokeWidth={2}
          type="monotone"
          yAxisId="right"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
