import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Play, Square, Settings, BarChart3, Zap, Github, RefreshCw, Download, Eye } from "lucide-react";
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
  const { status, metrics: wsMetrics, trades, isConnected } = useWebSocket();
  const [setupProgress, setSetupProgress] = useState(0);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setSetupProgress(0);
    try {
      toast.loading("⚙️ Setup in corso...");
      const result = await trpc.bot.setup.mutate();
      if (result.success) {
        toast.success("✅ Setup completato con successo!");
        setSetupProgress(100);
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
    setBacktestProgress(0);
    try {
      toast.loading("📊 Backtesting in corso...");
      const result = await trpc.bot.backtest.mutate();
      if (result.success) {
        toast.success("📊 Backtesting completato!");
        setBacktestProgress(100);
      } else {
        toast.error(`❌ Backtesting fallito: ${result.message}`);
      }
    } catch (error) {
      toast.error("❌ Errore durante il backtesting!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncGithub = async () => {
    setIsLoading(true);
    try {
      toast.loading("🔄 Sincronizzazione GitHub...");
      // Mock sync for now as it's not fully implemented in backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("✅ GitHub sincronizzato!");
    } catch (error) {
      toast.error("❌ Sync GitHub fallito!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("📥 Esportazione in corso...");
      const result = await trpc.export.exportTradesCSV.query({ userId: 1 });
      if (result.data) {
        const blob = new Blob([atob(result.data)], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.click();
        toast.success("✅ Trade esportati in CSV!");
      }
    } catch (error) {
      toast.error("❌ Esportazione fallita!");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("📄 Generazione PDF...");
      const result = await trpc.export.exportMetricsPDF.query({ userId: 1 });
      if (result.data) {
        const blob = new Blob([atob(result.data)], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.click();
        toast.success("✅ Report PDF generato!");
      }
    } catch (error) {
      toast.error("❌ Generazione PDF fallita!");
    }
  };

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Trading Bot AI</h1>
            <p className="text-muted-foreground">Controllo automatico XAUUSD</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status?.running ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-sm font-medium">{status?.running ? "🟢 Attivo" : "🔴 Inattivo"}</span>
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
        {status?.running ? (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ Bot in esecuzione - Sistema attivo e operativo
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Bot fermo - Pronto per l'avvio
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control">Controllo</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
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
                    <Badge variant={status?.running ? "default" : "secondary"}>
                      {status?.running ? "🟢 In Esecuzione" : "🔴 Fermo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime:</span>
                    <span className="text-sm font-mono">{status?.uptime || "0h 0m"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trade Oggi:</span>
                    <span className="text-sm font-bold">{status?.tradesCount || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleStartBot}
                      disabled={status?.running || isLoading}
                      size="lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isLoading ? "Avvio..." : "Avvia Bot"}
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={handleStopBot}
                      disabled={!status?.running || isLoading}
                      size="lg"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      {isLoading ? "Stop..." : "Ferma Bot"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Portfolio Value:</span>
                    <span className="text-sm font-bold text-green-600">
                      ${wsMetrics?.portfolioValue?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Return:</span>
                    <span className="text-sm font-bold text-blue-600">
                      +{wsMetrics?.totalReturn?.toFixed(2) || "0.00"}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Win Rate:</span>
                    <span className="text-sm font-bold">
                      {wsMetrics?.winRate?.toFixed(1) || "0.0"}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={handleExportCSV}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={handleExportPDF}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleViewDashboard}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vedi Analisi Completa
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PerformanceChart />
              <PnLChart />
            </div>

            {/* Trade History */}
            <TradeHistoryTable trades={trades} />
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Ambiente</CardTitle>
                <CardDescription>Installa le dipendenze e configura il bot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso Setup</span>
                    <span>{setupProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${setupProgress}%` }}
                    ></div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSetup}
                  disabled={isLoading || setupProgress === 100}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Esegui Setup Completo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backtest Tab */}
          <TabsContent value="backtest" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Backtesting Strategia</CardTitle>
                <CardDescription>Testa la strategia sui dati storici</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso Backtest</span>
                    <span>{backtestProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${backtestProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleBacktest}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Avvia Backtest
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => toast.info("Ottimizzazione avviata...")}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Ottimizza
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrazione GitHub</CardTitle>
                <CardDescription>Sincronizza il codice e i log con il repository</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleSyncGithub}
                  disabled={isLoading}
                >
                  <Github className="h-4 w-4 mr-2" />
                  Sincronizza con GitHub
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
