import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          name="Portfolio Value ($)"
          strokeWidth={2}
          dot={data.length < 2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="return"
          stroke="#10b981"
          name="Return (%)"
          strokeWidth={2}
          dot={data.length < 2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
