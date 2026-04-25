import { AlertCircle, BarChart3, Target, TrendingDown, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { summarizeTrades } from "@/lib/bot-data";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PnLChart } from "@/components/PnLChart";
import { TradeHistoryTable } from "@/components/TradeHistoryTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { status: wsStatus, metrics, trades } = useWebSocket();
  const statusQuery = trpc.bot.status.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const isRunning = wsStatus?.running ?? statusQuery.data?.running ?? false;
  const summary = summarizeTrades(trades);
  const profitFactor = Number(summary.profitFactor || 0).toFixed(2);
  const riskReward = Number(summary.riskReward || 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Statistiche operative e performance del bot in tempo reale.
            </p>
          </div>

          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? "Bot attivo" : "Bot fermo"}
          </Badge>
        </div>

        {!isRunning && trades.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nessun dato live disponibile. Avvia il bot o esegui un backtest per riempire grafici e storico.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Portfolio value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${Number(metrics?.portfolioValue ?? 10000).toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Valore aggiornato dal bot</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {Number(metrics?.totalReturn ?? 0).toFixed(2)}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Performance cumulata</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profit factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profitFactor}</div>
              <p className="mt-1 text-xs text-muted-foreground">Rapporto tra profitti e perdite</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Number(metrics?.winRate ?? summary.winRate).toFixed(1)}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Trade vincenti sul totale</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trade recenti</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <BarChart3 className="h-4 w-4" />
                    Trade totali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalTrades}</div>
                  <p className="text-xs text-muted-foreground">Record salvati nello storico</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4" />
                    Profitto totale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${summary.totalProfit.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Somma di tutti i P&amp;L ricevuti</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingDown className="h-4 w-4" />
                    Max drawdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${summary.maxDrawdown.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drawdown stimato dalla curva profitti cumulata
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Statistiche generali</CardTitle>
                <CardDescription>
                  Riepilogo costruito dai trade reali e dalle metriche del bot.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Trade vincenti</p>
                  <p className="text-2xl font-bold">{summary.winningTrades}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Trade perdenti</p>
                  <p className="text-2xl font-bold">{summary.losingTrades}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Average trade</p>
                  <p className="text-2xl font-bold">${summary.avgTrade.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Risk / reward</p>
                  <p className="text-2xl font-bold">{riskReward}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Curva performance</CardTitle>
                <CardDescription>
                  Serie costruita dal P&amp;L cumulato e dal balance di partenza.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <PerformanceChart metrics={metrics} trades={trades} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>P&amp;L giornaliero</CardTitle>
                <CardDescription>
                  Aggregazione per giornata dei trade raccolti dal bot.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <PnLChart trades={trades} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Storico trade
                </CardTitle>
                <CardDescription>
                  Ultimi trade ricevuti dal processo Python o dal backtest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TradeHistoryTable trades={trades} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
