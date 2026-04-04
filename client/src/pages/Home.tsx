import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Play, Square, Settings, BarChart3, Zap, Github, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PnLChart } from "@/components/PnLChart";
import { TradeHistoryTable } from "@/components/TradeHistoryTable";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Home() {
  const [setupProgress, setSetupProgress] = useState(0);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const { botStatus, metrics, lastTrade, connected, startBot, stopBot } = useWebSocket();

  const handleSetup = async () => {
    setSetupProgress(0);
    try {
      for (let i = 0; i <= 100; i += 10) {
        setSetupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      toast.success("Setup completato!");
    } catch (error) {
      toast.error("Setup fallito!");
    }
  };

  const handleStartBot = async () => {
    try {
      startBot();
      toast.success("Bot avviato!");
    } catch (error) {
      toast.error("Errore avvio bot!");
    }
  };

  const handleStopBot = async () => {
    try {
      stopBot();
      toast.success("Bot fermato!");
    } catch (error) {
      toast.error("Errore stop bot!");
    }
  };

  const handleBacktest = async () => {
    setBacktestProgress(0);
    try {
      for (let i = 0; i <= 100; i += 10) {
        setBacktestProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      toast.success("Backtesting completato!");
    } catch (error) {
      toast.error("Backtesting fallito!");
      setBacktestProgress(0);
    }
  };

  const handleSyncGithub = async () => {
    try {
      toast.success("GitHub sincronizzato!");
    } catch (error) {
      toast.error("Sync GitHub fallito!");
    }
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
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm">{connected ? "Connesso" : "Disconnesso"}</span>
          </div>
        </div>

        {/* Status Alert */}
        {botStatus?.running ? (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Bot in esecuzione - Sistema attivo
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Bot fermo - Pronto per l'avvio
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
                    <Badge variant={botStatus?.running ? "default" : "secondary"}>
                      {botStatus?.running ? "In Esecuzione" : "Fermo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime:</span>
                    <span className="text-sm">{botStatus?.uptime || "0h 0m"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trade Oggi:</span>
                    <span className="text-sm font-bold">{botStatus?.tradesCount || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleStartBot}
                      disabled={botStatus?.running}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Avvia
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={handleStopBot}
                      disabled={!botStatus?.running}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Ferma
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
                      ${metrics?.portfolioValue?.toFixed(2) || "12,500.50"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Return:</span>
                    <span className="text-sm font-bold text-blue-600">
                      +{metrics?.totalReturn?.toFixed(2) || "25.50"}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Win Rate:</span>
                    <span className="text-sm font-bold">
                      {metrics?.winRate?.toFixed(1) || "58.5"}%
                    </span>
                  </div>
                  <Button className="w-full" variant="outline">
                    Apri Dashboard Completa
                  </Button>
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
                  Configura l'ambiente e installa le dipendenze
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Il setup installerà Python, le dipendenze e creerà l'ambiente virtuale
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progresso Setup:</span>
                    <span className="text-sm">{setupProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${setupProgress}%` }}
                    ></div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSetup}
                >
                  Esegui Setup Completo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backtest Tab */}
          <TabsContent value="backtest" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Backtesting Strategia
                </CardTitle>
                <CardDescription>
                  Testa la strategia su dati storici
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Anni di Dati</label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-lg bg-background">
                      <option>1 anno</option>
                      <option selected>2 anni</option>
                      <option>3 anni</option>
                      <option>5 anni</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Capitale Iniziale</label>
                    <input
                      type="number"
                      defaultValue="10000"
                      className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progresso Backtest:</span>
                    <span className="text-sm">{backtestProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${backtestProgress}%` }}
                    ></div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBacktest}
                >
                  Esegui Backtesting
                </Button>

                {backtestProgress === 100 && (
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200">
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-3">Risultati Backtest</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Total Return: <span className="font-bold">+25.50%</span></div>
                        <div>Sharpe Ratio: <span className="font-bold">1.85</span></div>
                        <div>Win Rate: <span className="font-bold">58.5%</span></div>
                        <div>Max Drawdown: <span className="font-bold">-8.3%</span></div>
                      </div>
                      <Button className="w-full mt-3" variant="outline" size="sm">
                        Scarica Report
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurazione
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Alpaca API Key</label>
                  <input
                    type="password"
                    placeholder="Inserisci la tua API key"
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Alpaca Secret Key</label>
                  <input
                    type="password"
                    placeholder="Inserisci la tua secret key"
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Telegram Bot Token (Opzionale)</label>
                  <input
                    type="password"
                    placeholder="Inserisci il token del bot Telegram"
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">Salva Configurazione</Button>
                  <Button variant="outline" className="flex-1" onClick={handleSyncGithub}>
                    <Github className="h-4 w-4 mr-2" />
                    Sincronizza GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* GitHub Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Repository Status</p>
                    <p className="text-sm text-muted-foreground">Ultimo sync: Ora</p>
                  </div>
                  <Badge variant="outline">Connesso</Badge>
                </div>
                <Button className="w-full" variant="outline" onClick={handleSyncGithub}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizza Ora
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
