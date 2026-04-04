import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Calendar, Clock, Target, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data - in production, connect to real API
const performanceData = [
  { date: "01 Apr", value: 12000, return: 0 },
  { date: "02 Apr", value: 12150, return: 1.25 },
  { date: "03 Apr", value: 12300, return: 2.5 },
  { date: "04 Apr", value: 12250, return: 2.08 },
];

const profitByDayData = [
  { day: "Lun", profit: 250 },
  { day: "Mar", profit: 320 },
  { day: "Mer", profit: 280 },
  { day: "Gio", profit: 450 },
  { day: "Ven", profit: 380 },
  { day: "Sab", profit: 0 },
  { day: "Dom", profit: 0 },
];

const profitByHourData = [
  { hour: "00:00", profit: 0 },
  { hour: "04:00", profit: 50 },
  { hour: "08:00", profit: 150 },
  { hour: "12:00", profit: 320 },
  { hour: "16:00", profit: 280 },
  { hour: "20:00", profit: 100 },
];

const tradeDistribution = [
  { name: "Winning", value: 65, color: "#10b981" },
  { name: "Losing", value: 35, color: "#ef4444" },
];

const monthlyStats = [
  { month: "Gen", trades: 45, profit: 2500 },
  { month: "Feb", trades: 52, profit: 3200 },
  { month: "Mar", trades: 48, profit: 2800 },
  { month: "Apr", trades: 38, profit: 2100 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Dashboard Professionale</h1>
          <p className="text-muted-foreground">Statistiche avanzate e metriche di trading</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">2.45</div>
              <p className="text-xs text-muted-foreground mt-1">Rapporto Profitti/Perdite</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk/Reward Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">1:2.8</div>
              <p className="text-xs text-muted-foreground mt-1">Rapporto Rischio/Rendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">-12.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Massima perdita dal picco</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">1.85</div>
              <p className="text-xs text-muted-foreground mt-1">Rendimento aggiustato al rischio</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="analysis">Analisi</TabsTrigger>
            <TabsTrigger value="statistics">Statistiche</TabsTrigger>
            <TabsTrigger value="trades">Trade</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Curva di Equity</CardTitle>
                <CardDescription>Evoluzione del portafoglio nel tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Portfolio Value" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profit per Giorno della Settimana</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={profitByDayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="profit" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit per Ora del Giorno</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={profitByHourData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="profit" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuzione Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={tradeDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {tradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistiche Mensili</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="trades" fill="#3b82f6" />
                      <Bar dataKey="profit" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">65%</div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "65%" }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">65 vincenti su 100 trade</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Win</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">$245.50</div>
                  <p className="text-xs text-muted-foreground mt-2">Guadagno medio per trade vincente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">-$98.30</div>
                  <p className="text-xs text-muted-foreground mt-2">Perdita media per trade perdente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Consecutive Wins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">8</div>
                  <p className="text-xs text-muted-foreground mt-2">Massima serie vincente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Consecutive Losses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">3</div>
                  <p className="text-xs text-muted-foreground mt-2">Massima serie perdente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recovery Factor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">3.2</div>
                  <p className="text-xs text-muted-foreground mt-2">Profitto totale / Max Drawdown</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Metriche Avanzate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Trades:</span>
                  <span className="font-bold">248</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Winning Trades:</span>
                  <span className="font-bold text-green-600">161</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Losing Trades:</span>
                  <span className="font-bold text-red-600">87</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Profit:</span>
                  <span className="font-bold text-green-600">$12,450.50</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Loss:</span>
                  <span className="font-bold text-red-600">-$5,080.20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Profit:</span>
                  <span className="font-bold text-green-600">$7,370.30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ROI:</span>
                  <span className="font-bold text-blue-600">58.96%</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ultimi Trade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { symbol: "XAUUSD", type: "BUY", entry: 2450.50, exit: 2465.20, profit: 14.70, date: "04 Apr 14:30" },
                    { symbol: "XAUUSD", type: "SELL", entry: 2460.00, exit: 2455.80, profit: 4.20, date: "04 Apr 12:15" },
                    { symbol: "XAUUSD", type: "BUY", entry: 2445.00, exit: 2442.50, profit: -2.50, date: "04 Apr 10:45" },
                  ].map((trade, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{trade.symbol}</div>
                        <div className="text-xs text-muted-foreground">{trade.date}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>{trade.type}</Badge>
                        <div className={`text-sm font-bold mt-1 ${trade.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                          {trade.profit > 0 ? "+" : ""}{trade.profit.toFixed(2)} pips
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
