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

export default function Home() {
  const [, navigate] = useLocation();
  const [setupProgress, setSetupProgress] = useState(0);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [botRunning, setBotRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated metrics
  const [metrics, setMetrics] = useState({
    portfolioValue: 12500.50,
    totalReturn: 25.50,
    winRate: 58.5,
    sharpeRatio: 1.8,
    maxDrawdown: -12.5,
  });

  const handleSetup = async () => {
    setIsLoading(true);
    setSetupProgress(0);
    try {
      toast.loading("⚙️ Setup in corso...");
      for (let i = 0; i <= 100; i += 10) {
        setSetupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      toast.success("✅ Setup completato con successo!");
      setSetupProgress(100);
    } catch (error) {
      toast.error("❌ Setup fallito!");
      setSetupProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBot = async () => {
    setIsLoading(true);
    try {
      toast.loading("🚀 Avvio bot...");
      // Simula l'avvio del bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBotRunning(true);
      toast.success("🚀 Bot avviato con successo!");
    } catch (error) {
      toast.error("❌ Errore avvio bot!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    try {
      toast.loading("⏹️ Arresto bot...");
      // Simula lo stop del bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBotRunning(false);
      toast.success("⏹️ Bot fermato!");
    } catch (error) {
      toast.error("❌ Errore stop bot!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBacktest = async () => {
    setIsLoading(true);
    setBacktestProgress(0);
    try {
      toast.loading("📊 Backtesting in corso...");
      for (let i = 0; i <= 100; i += 10) {
        setBacktestProgress(i);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      toast.success("📊 Backtesting completato!");
      setBacktestProgress(100);
    } catch (error) {
      toast.error("❌ Backtesting fallito!");
      setBacktestProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeStrategy = async () => {
    setIsLoading(true);
    try {
      toast.loading("⚙️ Ottimizzazione in corso...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success("✨ Strategia ottimizzata! Sharpe Ratio: 2.1");
    } catch (error) {
      toast.error("❌ Ottimizzazione fallita!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("📥 Esportazione in corso...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("✅ Trade esportati in CSV!");
    } catch (error) {
      toast.error("❌ Esportazione fallita!");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("📄 Generazione PDF...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("✅ Report PDF generato!");
    } catch (error) {
      toast.error("❌ Generazione PDF fallita!");
    }
  };

  const handleSyncGithub = async () => {
    setIsLoading(true);
    try {
      toast.loading("🔄 Sincronizzazione GitHub...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("✅ GitHub sincronizzato!");
    } catch (error) {
      toast.error("❌ Sync GitHub fallito!");
    } finally {
      setIsLoading(false);
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
              <div className={`w-3 h-3 rounded-full ${botRunning ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-sm font-medium">{botRunning ? "🟢 Attivo" : "🔴 Inattivo"}</span>
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
        {botRunning ? (
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
                    <Badge variant={botRunning ? "default" : "secondary"}>
                      {botRunning ? "🟢 In Esecuzione" : "🔴 Fermo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime:</span>
                    <span className="text-sm font-mono">{botRunning ? "2h 45m 30s" : "0h 0m"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trade Oggi:</span>
                    <span className="text-sm font-bold">{botRunning ? 12 : 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleStartBot}
                      disabled={botRunning || isLoading}
                      size="lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isLoading ? "Avvio..." : "Avvia Bot"}
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={handleStopBot}
                      disabled={!botRunning || isLoading}
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
                      ${metrics.portfolioValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Return:</span>
                    <span className="text-sm font-bold text-blue-600">
                      +{metrics.totalReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Win Rate:</span>
                    <span className="text-sm font-bold">
                      {metrics.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sharpe Ratio:</span>
                    <span className="text-sm font-bold">
                      {metrics.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <PerformanceChart />
            <PnLChart />
            <TradeHistoryTable />
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Setup Iniziale
                </CardTitle>
                <CardDescription>
                  Configura l'ambiente e installa tutte le dipendenze
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Il setup installerà Python, le dipendenze, il database e creerà l'ambiente virtuale
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progresso Setup:</span>
                    <span className="text-sm font-bold">{setupProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${setupProgress}%` }}
                    ></div>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={handleSetup}
                  disabled={isLoading || setupProgress === 100}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isLoading ? "Setup in corso..." : setupProgress === 100 ? "Setup Completato ✅" : "Esegui Setup Completo"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backtest Tab */}
          <TabsContent value="backtest" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Backtest Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Backtesting
                  </CardTitle>
                  <CardDescription>
                    Testa la strategia su dati storici
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Backtesting su ultimi 90 giorni di dati XAUUSD
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progresso Backtest:</span>
                      <span className="text-sm font-bold">{backtestProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${backtestProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                    onClick={handleBacktest}
                    disabled={isLoading}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {isLoading ? "Backtest in corso..." : "Esegui Backtest"}
                  </Button>
                </CardContent>
              </Card>

              {/* Optimization Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Ottimizzazione
                  </CardTitle>
                  <CardDescription>
                    Ottimizza i parametri della strategia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esegue 50 trial di ottimizzazione con Optuna
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium">Parametri Ottimali:</p>
                      <p className="text-xs text-muted-foreground mt-1">RSI Period: 14</p>
                      <p className="text-xs text-muted-foreground">MACD Fast: 12</p>
                      <p className="text-xs text-muted-foreground">Stop Loss: 2%</p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="lg"
                    onClick={handleOptimizeStrategy}
                    disabled={isLoading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isLoading ? "Ottimizzazione..." : "Ottimizza Strategia"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Esporta Dati
                  </CardTitle>
                  <CardDescription>
                    Scarica report e storico trade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Esporta Trade (CSV)
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleExportPDF}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Esporta Report (PDF)
                  </Button>
                </CardContent>
              </Card>

              {/* GitHub Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub Sync
                  </CardTitle>
                  <CardDescription>
                    Sincronizza con il repository
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <Github className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                      Repository: trading-bot-ai
                    </AlertDescription>
                  </Alert>
                  <Button
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                    size="lg"
                    onClick={handleSyncGithub}
                    disabled={isLoading}
                  >
                    <Github className="h-4 w-4 mr-2" />
                    {isLoading ? "Sincronizzazione..." : "Sincronizza GitHub"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
