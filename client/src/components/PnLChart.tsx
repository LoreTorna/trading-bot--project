import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { date: "1 Gen", pnl: 150, trades: 5 },
  { date: "2 Gen", pnl: -75, trades: 3 },
  { date: "3 Gen", pnl: 250, trades: 7 },
  { date: "4 Gen", pnl: 100, trades: 4 },
  { date: "5 Gen", pnl: 300, trades: 8 },
  { date: "6 Gen", pnl: -50, trades: 2 },
  { date: "7 Gen", pnl: 200, trades: 6 },
  { date: "8 Gen", pnl: 125, trades: 5 },
];

export function PnLChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L Giornaliero</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="pnl"
              fill="#8884d8"
              name="P&L ($)"
            />
            <Bar
              yAxisId="right"
              dataKey="trades"
              fill="#82ca9d"
              name="Trades"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
