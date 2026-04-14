import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Play, Square, Settings, BarChart3, Zap, Github, RefreshCw, Download, Eye, FileCode, Server, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PnLChart } from "@/components/PnLChart";
import { TradeHistoryTable } from "@/components/TradeHistoryTable";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Home() {
  const [, navigate] = useLocation();
  const { status: wsStatus, metrics: wsMetrics, trades, isConnected } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch real repository status and files
  const { data: botStatus, refetch: refetchStatus } = trpc.bot.status.useQuery();

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      toast.loading("⚙️ Setup in corso...");
      const result = await trpc.bot.setup.mutate();
      if (result.success) {
        toast.success("✅ Setup completato con successo!");
        refetchStatus();
      } else {
        toast.error(`❌ Setup fallito: ${result.message}`);
      }
    } catch (error) {
      toast.error("❌ Errore durante il setup!");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBot = async () => {
    setIsLoading(true);
    try {
      toast.loading("🚀 Avvio bot...");
      const result = await trpc.bot.start.mutate();
      if (result.success) {
        toast.success("🚀 Bot avviato con successo!");
        refetchStatus();
      } else {
        toast.error(`❌ Errore avvio bot: ${result.message}`);
      }
    } catch (error) {
      toast.error("❌ Errore durante l'avvio del bot!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    try {
      toast.loading("⏹️ Arresto bot...");
      const result = await trpc.bot.stop.mutate();
      if (result.success) {
        toast.success("⏹️ Bot fermato!");
        refetchStatus();
      } else {
        toast.error(`❌ Errore stop bot: ${result.message}`);
      }
    } catch (error) {
      toast.error("❌ Errore durante l'arresto del bot!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBacktest = async () => {
    setIsLoading(true);
    try {
      toast.loading("📊 Backtesting in corso...");
      const result = await trpc.bot.backtest.mutate();
      if (result.success) {
        toast.success("📊 Backtesting completato!");
      } else {
        toast.error(`❌ Backtesting fallito: ${result.message}`);
      }
    } catch (error) {
      toast.error("❌ Errore durante il backtesting!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  const isRunning = wsStatus?.running || botStatus?.running;
  const uptime = wsStatus?.uptime || botStatus?.uptime || "0h 0m";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Trading Bot AI</h1>
            <p className="text-muted-foreground">Controllo automatico XAUUSD.r (Gold)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-sm font-medium">{isRunning ? "🟢 Attivo" : "🔴 Inattivo"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDashboard}
            >
              <Eye className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {isRunning ? (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ Bot in esecuzione - Operatività H23 su XAUUSD.r attiva
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Bot fermo - Pronto per l'avvio su account HeroFx (923721)
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control">Controllo</TabsTrigger>
            <TabsTrigger value="repository">Repository</TabsTrigger>
            <TabsTrigger value="account">Account MT5</TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>

          {/* Control Tab */}
          <TabsContent value="control" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bot Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Stato Bot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={isRunning ? "default" : "secondary"}>
                      {isRunning ? "🟢 In Esecuzione" : "🔴 Fermo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime:</span>
                    <span className="text-sm font-mono">{uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Simbolo:</span>
                    <span className="text-sm font-bold">XAUUSD.r</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleStartBot}
                      disabled={isRunning || isLoading}
                      size="lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isLoading ? "Avvio..." : "Avvia Bot"}
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={handleStopBot}
                      disabled={!isRunning || isLoading}
                      size="lg"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      {isLoading ? "Stop..." : "Ferma Bot"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Azioni Rapide
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleSetup} disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Esegui Setup
                  </Button>
                  <Button variant="outline" onClick={handleBacktest} disabled={isLoading}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Backtest
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    <Eye className="h-4 w-4 mr-2" />
                    Analisi
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/herofx")}>
                    <Server className="h-4 w-4 mr-2" />
                    Config MT5
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">${wsMetrics?.portfolioValue?.toFixed(2) || "10,000.00"}</div>
                  <p className="text-xs text-muted-foreground">Bilancio Account</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">+{wsMetrics?.totalReturn?.toFixed(2) || "0.00"}%</div>
                  <p className="text-xs text-muted-foreground">Ritorno Totale</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{wsMetrics?.winRate?.toFixed(1) || "0.0"}%</div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Repository Tab */}
          <TabsContent value="repository" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  File del Repository
                </CardTitle>
                <CardDescription>
                  File reali rilevati in {botStatus?.repositoryPath}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {botStatus?.files?.map((file: string) => (
                    <div key={file} className="flex items-center p-2 border rounded bg-white dark:bg-slate-950">
                      <FileCode className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm font-mono">{file}</span>
                    </div>
                  ))}
                  {(!botStatus?.files || botStatus.files.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">Nessun file rilevato o repository non trovato.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Dettagli Account Demo MT5
                </CardTitle>
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
                    <p className="text-sm font-medium text-muted-foreground">Operatività</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <p className="text-lg font-bold">H23 (5/7)</p>
                    </div>
                  </div>
                </div>
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Il bot è configurato per girare 23 ore al giorno, 5 giorni su 7, seguendo l'apertura del mercato dell'oro.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lotto Default</label>
                    <div className="p-2 border rounded bg-slate-50 dark:bg-slate-900">0.10</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stop Loss (Points)</label>
                    <div className="p-2 border rounded bg-slate-50 dark:bg-slate-900">20</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Take Profit (Points)</label>
                    <div className="p-2 border rounded bg-slate-50 dark:bg-slate-900">40</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Daily Loss ($)</label>
                    <div className="p-2 border rounded bg-slate-50 dark:bg-slate-900">100</div>
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => navigate("/herofx")}>
                  Modifica Impostazioni Avanzate
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Storica</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PerformanceChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss (Giornaliero)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PnLChart />
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle>Ultimi Trade Eseguiti</CardTitle>
          </CardHeader>
          <CardContent>
            <TradeHistoryTable trades={trades} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
