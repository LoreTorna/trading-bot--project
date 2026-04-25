import { useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  BarChart3,
  Clock,
  Download,
  Eye,
  FileCode,
  Github,
  Play,
  RefreshCw,
  Server,
  Settings,
  Square,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { summarizeTrades } from "@/lib/bot-data";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PnLChart } from "@/components/PnLChart";
import { TradeHistoryTable } from "@/components/TradeHistoryTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [, navigate] = useLocation();
  const { status: wsStatus, metrics, trades, isConnected } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);

  const statusQuery = trpc.bot.status.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const setupMutation = trpc.bot.setup.useMutation();
  const startMutation = trpc.bot.start.useMutation();
  const stopMutation = trpc.bot.stop.useMutation();
  const backtestMutation = trpc.bot.backtest.useMutation();

  const botStatus = statusQuery.data;
  const isRunning = wsStatus?.running ?? botStatus?.running ?? false;
  const uptime = wsStatus?.uptime ?? botStatus?.uptime ?? "0h 0m";
  const repositoryFiles = botStatus?.files ?? [];
  const summary = summarizeTrades(trades);

  async function runAction(
    action: () => Promise<{ success: boolean; message: string }>,
    loadingMessage: string,
    successMessage: string
  ) {
    setIsLoading(true);
    const notificationId = toast.loading(loadingMessage);

    try {
      const result = await action();

      if (result.success) {
        toast.success(successMessage, { id: notificationId });
      } else {
        toast.error(result.message, { id: notificationId });
      }

      await statusQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore sconosciuto";
      toast.error(message, { id: notificationId });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Trading Bot AI</h1>
            <p className="text-muted-foreground">
              Controllo operativo del bot XAUUSD.r con monitoraggio live e backtest.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "WebSocket online" : "WebSocket offline"}
            </Badge>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "Bot attivo" : "Bot fermo"}
            </Badge>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <Eye className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        {isRunning ? (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Il bot e in esecuzione. Lo stato live arriva da WebSocket e dai file JSON del processo Python.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Il bot non e in esecuzione. Puoi fare setup, avviarlo o eseguire un backtest dal pannello di controllo.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control">Controllo</TabsTrigger>
            <TabsTrigger value="repository">Repository</TabsTrigger>
            <TabsTrigger value="account">Account MT5</TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Stato Bot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stato</span>
                    <Badge variant={isRunning ? "default" : "secondary"}>
                      {isRunning ? "In esecuzione" : "Fermo"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="font-mono text-sm">{uptime}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Simbolo</span>
                    <span className="font-bold text-sm">XAUUSD.r</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isRunning || isLoading}
                      onClick={() =>
                        runAction(
                          () => startMutation.mutateAsync(),
                          "Avvio del bot in corso...",
                          "Bot avviato con successo."
                        )
                      }
                      size="lg"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Avvia Bot
                    </Button>

                    <Button
                      className="flex-1"
                      disabled={!isRunning || isLoading}
                      onClick={() =>
                        runAction(
                          () => stopMutation.mutateAsync(),
                          "Arresto del bot in corso...",
                          "Bot fermato correttamente."
                        )
                      }
                      size="lg"
                      variant="destructive"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Ferma Bot
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Azioni Rapide
                  </CardTitle>
                  <CardDescription>
                    Le azioni chiamano i router tRPC reali del backend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={isLoading}
                    onClick={() =>
                      runAction(
                        () => setupMutation.mutateAsync(),
                        "Setup del bot in corso...",
                        "Setup completato."
                      )
                    }
                    variant="outline"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Setup
                  </Button>

                  <Button
                    disabled={isLoading}
                    onClick={() =>
                      runAction(
                        () => backtestMutation.mutateAsync(),
                        "Backtest in corso...",
                        "Backtest completato."
                      )
                    }
                    variant="outline"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Backtest
                  </Button>

                  <Button onClick={() => navigate("/dashboard")} variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Analisi
                  </Button>

                  <Button onClick={() => navigate("/herofx")} variant="outline">
                    <Server className="mr-2 h-4 w-4" />
                    Config MT5
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    ${Number(metrics?.portfolioValue ?? 10000).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Portfolio value</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {Number(metrics?.totalReturn ?? 0).toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Ritorno totale</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {Number(metrics?.winRate ?? summary.winRate).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Win rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {metrics?.trades ?? summary.totalTrades}
                  </div>
                  <p className="text-xs text-muted-foreground">Trade registrati</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="repository" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Repository locale
                </CardTitle>
                <CardDescription>
                  Il backend rileva il percorso del progetto che contiene il bot Python.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Percorso</p>
                  <p className="break-all font-mono text-sm">
                    {botStatus?.repositoryPath ?? "Rilevazione in corso..."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={botStatus?.repositoryExists ? "default" : "destructive"}>
                    {botStatus?.repositoryExists ? "Repository trovato" : "Repository non trovato"}
                  </Badge>
                  <Badge variant="outline">
                    {botStatus?.filesCount ?? 0} elementi rilevati
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {repositoryFiles.length > 0 ? (
                    repositoryFiles.map((file) => (
                      <div
                        key={file}
                        className="flex items-center rounded border bg-white p-2 dark:bg-slate-950"
                      >
                        <FileCode className="mr-2 h-4 w-4 text-blue-500" />
                        <span className="text-sm font-mono">{file}</span>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-muted-foreground">
                      Nessun file trovato dal servizio bot-control.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Account MT5
                </CardTitle>
                <CardDescription>
                  Le credenziali del broker vanno impostate tramite variabili ambiente o file .env.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Broker Server</p>
                    <p className="text-lg font-bold">HeroFx-Trade</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Login ID</p>
                    <p className="text-lg font-bold">923721</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Simbolo</p>
                    <p className="text-lg font-bold">XAUUSD.r</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Operativita</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <p className="text-lg font-bold">H23 (5/7)</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Se MetaTrader 5 non e installato, il bot passa automaticamente in modalita simulazione e continua a produrre metriche e storico trade.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurazione bot</CardTitle>
                <CardDescription>
                  Parametri di base allineati tra interfaccia, server e script Python.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lotto default</label>
                    <div className="rounded border bg-slate-50 p-2 dark:bg-slate-900">0.10</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stop loss (points)</label>
                    <div className="rounded border bg-slate-50 p-2 dark:bg-slate-900">20</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Take profit (points)</label>
                    <div className="rounded border bg-slate-50 p-2 dark:bg-slate-900">40</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max daily loss ($)</label>
                    <div className="rounded border bg-slate-50 p-2 dark:bg-slate-900">100</div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => navigate("/herofx")} variant="outline">
                  Modifica impostazioni avanzate
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance storica</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PerformanceChart metrics={metrics} trades={trades} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profit &amp; Loss giornaliero</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PnLChart trades={trades} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ultimi trade eseguiti</CardTitle>
              <CardDescription>
                Tabella alimentata dagli aggiornamenti WebSocket e dai file `data/trades.json`.
              </CardDescription>
            </div>

            <Button
              onClick={() => navigate("/dashboard")}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Vista completa
            </Button>
          </CardHeader>
          <CardContent>
            <TradeHistoryTable trades={trades} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
