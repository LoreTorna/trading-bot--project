import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { date: "1 Gen", value: 10000, return: 0 },
  { date: "8 Gen", value: 10250, return: 2.5 },
  { date: "15 Gen", value: 10800, return: 8 },
  { date: "22 Gen", value: 10500, return: 5 },
  { date: "29 Gen", value: 11200, return: 12 },
  { date: "5 Feb", value: 11800, return: 18 },
  { date: "12 Feb", value: 12100, return: 21 },
  { date: "19 Feb", value: 12500, return: 25 },
  { date: "26 Feb", value: 12300, return: 23 },
  { date: "4 Mar", value: 12750, return: 27.5 },
];

export function PerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Ultimi 30 Giorni</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
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
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="return"
              stroke="#10b981"
              name="Return (%)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
