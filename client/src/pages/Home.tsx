import { useEffect, useState } from "react";
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
import {
  DEFAULT_BACKTEST_SYMBOLS,
  DEFAULT_LIVE_SYMBOLS,
  SYMBOL_PROFILES,
  normalizeSymbolList,
  type TradingSymbol,
} from "@shared/trading";
import { trpc } from "@/lib/trpc";
import {
  isBacktestBatchResult,
  summarizeTrades,
  type BacktestBatchResult,
} from "@/lib/bot-data";
import { useWebSocket } from "@/hooks/useWebSocket";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PnLChart } from "@/components/PnLChart";
import { TradeHistoryTable } from "@/components/TradeHistoryTable";
import { SymbolSelector } from "@/components/SymbolSelector";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LIVE_SYMBOLS_KEY = "trading-bot-live-symbols";
const BACKTEST_SYMBOLS_KEY = "trading-bot-backtest-symbols";
const BACKTEST_YEARS_KEY = "trading-bot-backtest-years";
const BACKTEST_CAPITAL_KEY = "trading-bot-backtest-capital";

function readStoredSymbols(
  storageKey: string,
  fallback: TradingSymbol[]
): TradingSymbol[] {
  if (typeof window === "undefined") {
    return [...fallback];
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return [...fallback];
  }

  return normalizeSymbolList(rawValue.split(","), fallback);
}

function readStoredNumber(storageKey: string, fallback: number): number {
  if (typeof window === "undefined") {
    return fallback;
  }

  const parsed = Number(window.localStorage.getItem(storageKey));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function Home() {
  const [, navigate] = useLocation();
  const {
    status: wsStatus,
    metrics,
    trades,
    isConnected,
    backtestProgress,
    backtestResult,
  } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [liveSymbols, setLiveSymbols] = useState<TradingSymbol[]>(() =>
    readStoredSymbols(LIVE_SYMBOLS_KEY, DEFAULT_LIVE_SYMBOLS)
  );
  const [backtestSymbols, setBacktestSymbols] = useState<TradingSymbol[]>(() =>
    readStoredSymbols(BACKTEST_SYMBOLS_KEY, DEFAULT_BACKTEST_SYMBOLS)
  );
  const [backtestYears, setBacktestYears] = useState(() =>
    readStoredNumber(BACKTEST_YEARS_KEY, 2)
  );
  const [backtestCapital, setBacktestCapital] = useState(() =>
    readStoredNumber(BACKTEST_CAPITAL_KEY, 10000)
  );

  const statusQuery = trpc.bot.status.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const setupMutation = trpc.bot.setup.useMutation();
  const startMutation = trpc.bot.start.useMutation();
  const stopMutation = trpc.bot.stop.useMutation();
  const backtestMutation = trpc.bot.backtest.useMutation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIVE_SYMBOLS_KEY, liveSymbols.join(","));
    }
  }, [liveSymbols]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BACKTEST_SYMBOLS_KEY, backtestSymbols.join(","));
    }
  }, [backtestSymbols]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BACKTEST_YEARS_KEY, String(backtestYears));
      window.localStorage.setItem(BACKTEST_CAPITAL_KEY, String(backtestCapital));
    }
  }, [backtestCapital, backtestYears]);

  const botStatus = statusQuery.data;
  const isRunning = wsStatus?.running ?? botStatus?.running ?? false;
  const uptime = wsStatus?.uptime ?? botStatus?.uptime ?? "0h 0m";
  const repositoryFiles = botStatus?.files ?? [];
  const summary = summarizeTrades(trades);
  const activeSymbols = normalizeSymbolList(
    wsStatus?.activeSymbols ?? botStatus?.activeSymbols ?? liveSymbols,
    liveSymbols.length > 0 ? liveSymbols : DEFAULT_LIVE_SYMBOLS
  );
  const latestBacktest =
    (isBacktestBatchResult(backtestResult) ? backtestResult : null) ??
    (isBacktestBatchResult(backtestMutation.data?.data)
      ? (backtestMutation.data?.data as BacktestBatchResult)
      : null);

  async function runAction(
    action: () => Promise<{
      success: boolean;
      message: string;
      error?: string;
      output?: string;
    }>,
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
        toast.error(result.message, {
          id: notificationId,
          description: result.error || result.output || undefined,
        });
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

  function ensureSelectedSymbols(symbols: TradingSymbol[], context: string) {
    if (symbols.length > 0) {
      return true;
    }

    toast.error(`Seleziona almeno un simbolo per ${context}.`);
    return false;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Trading Bot AI</h1>
            <p className="text-muted-foreground">
              Controllo operativo multi-asset per XAUUSD.r e BTCUSD.r, con scalping MT5 live e backtest separati.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "WebSocket online" : "WebSocket offline"}
            </Badge>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "Bot attivo" : "Bot fermo"}
            </Badge>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        {isRunning ? (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Il bot e in esecuzione su {activeSymbols.join(", ")} con strategia scalping M1/M5. XAUUSD.r rispetta il calendario feriale, BTCUSD.r continua anche nel weekend.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Il bot non e in esecuzione. Puoi configurare i simboli live e il set di backtest direttamente da questo pannello.
            </AlertDescription>
          </Alert>
        )}

        <Tabs className="w-full" defaultValue="control">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control">Controllo</TabsTrigger>
            <TabsTrigger value="repository">Repository</TabsTrigger>
            <TabsTrigger value="account">Account MT5</TabsTrigger>
            <TabsTrigger value="settings">Profili simbolo</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="control">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Stato scalping
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

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Simboli attivi</span>
                    <div className="flex flex-wrap gap-2">
                      {activeSymbols.map((symbol) => (
                        <Badge key={symbol} variant="outline">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isRunning || isLoading}
                      onClick={() => {
                        if (!ensureSelectedSymbols(liveSymbols, "l'avvio live")) {
                          return;
                        }
                        runAction(
                          () => startMutation.mutateAsync({ symbols: liveSymbols }),
                          "Avvio del bot in corso...",
                          `Scalping MT5 avviato su ${liveSymbols.join(", ")}.`
                        );
                      }}
                      size="lg"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Avvia scalping
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
                      Ferma bot
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Selezione simboli live
                  </CardTitle>
                  <CardDescription>
                    Scegli gli asset che il bot deve tradare in automatico quando lo avvii.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SymbolSelector
                    disabled={isLoading || isRunning}
                    onSelectionChange={setLiveSymbols}
                    selectedSymbols={liveSymbols}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Azioni rapide
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

                  <Button onClick={() => navigate("/dashboard")} variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Analisi
                  </Button>

                  <Button onClick={() => navigate("/herofx")} variant="outline">
                    <Server className="mr-2 h-4 w-4" />
                    Config MT5
                  </Button>

                  <Button
                    disabled={isLoading}
                    onClick={() => {
                      if (!ensureSelectedSymbols(backtestSymbols, "il backtest")) {
                        return;
                      }
                      runAction(
                        () =>
                          backtestMutation.mutateAsync({
                            symbols: backtestSymbols,
                            years: backtestYears,
                            capital: backtestCapital,
                          }),
                        "Backtest in corso...",
                        `Backtest completato su ${backtestSymbols.join(", ")}.`
                      );
                    }}
                    variant="outline"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Backtest
                  </Button>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Configurazione backtest
                  </CardTitle>
                  <CardDescription>
                    Seleziona il portafoglio di test, il capitale iniziale e l'orizzonte temporale.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SymbolSelector
                    disabled={isLoading}
                    onSelectionChange={setBacktestSymbols}
                    selectedSymbols={backtestSymbols}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="backtest-years">Anni di test</Label>
                      <Input
                        id="backtest-years"
                        min={1}
                        onChange={(event) =>
                          setBacktestYears(Math.max(Number(event.target.value) || 1, 1))
                        }
                        type="number"
                        value={backtestYears}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backtest-capital">Capitale iniziale</Label>
                      <Input
                        id="backtest-capital"
                        min={1000}
                        onChange={(event) =>
                          setBacktestCapital(Math.max(Number(event.target.value) || 1000, 1000))
                        }
                        type="number"
                        value={backtestCapital}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Progresso ultimo backtest</Label>
                      <div className="rounded border bg-slate-50 p-2 text-sm dark:bg-slate-900">
                        {backtestProgress}% completato
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={isLoading}
                      onClick={() => {
                        if (!ensureSelectedSymbols(backtestSymbols, "il backtest")) {
                          return;
                        }
                        runAction(
                          () =>
                            backtestMutation.mutateAsync({
                              symbols: backtestSymbols,
                              years: backtestYears,
                              capital: backtestCapital,
                            }),
                          "Backtest in corso...",
                          `Backtest completato su ${backtestSymbols.join(", ")}.`
                        );
                      }}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Esegui backtest
                    </Button>

                    <Badge variant="outline">
                      {backtestSymbols.length} simboli selezionati
                    </Badge>
                  </div>
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

            {latestBacktest ? (
              <Card>
                <CardHeader>
                  <CardTitle>Ultimo backtest multi-asset</CardTitle>
                  <CardDescription>
                    Eseguito su {latestBacktest.symbols.join(", ")} con capitale iniziale ${latestBacktest.initialCapital.toFixed(2)}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Return totale</p>
                      <p className="text-2xl font-bold text-green-600">
                        {latestBacktest.summary.totalReturn.toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Win rate</p>
                      <p className="text-2xl font-bold">
                        {latestBacktest.summary.winRate.toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Max drawdown</p>
                      <p className="text-2xl font-bold text-red-600">
                        {latestBacktest.summary.maxDrawdown.toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Profit factor</p>
                      <p className="text-2xl font-bold">
                        {latestBacktest.summary.profitFactor.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {latestBacktest.results.map((result) => (
                      <div
                        key={result.symbol}
                        className="rounded-lg border p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{result.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {result.label}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {result.totalTrades} trade
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <p>Return: <strong>{result.totalReturn.toFixed(2)}%</strong></p>
                          <p>Win rate: <strong>{result.winRate.toFixed(2)}%</strong></p>
                          <p>Sharpe: <strong>{result.sharpeRatio.toFixed(2)}</strong></p>
                          <p>Drawdown: <strong>{result.maxDrawdown.toFixed(2)}%</strong></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent className="space-y-4" value="repository">
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

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase text-muted-foreground">Python</p>
                    <p className="break-all font-mono text-sm">
                      {botStatus?.runtime?.pythonCommand ?? "Rilevazione in corso..."}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase text-muted-foreground">Script live</p>
                    <p className="break-all font-mono text-sm">
                      {botStatus?.runtime?.runBotPath ?? "Rilevazione in corso..."}
                    </p>
                  </div>
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

          <TabsContent className="space-y-4" value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Account MT5 / HeroFx
                </CardTitle>
                <CardDescription>
                  Le credenziali vanno definite via file <code>.env</code> o variabili ambiente, non nel codice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Broker server</p>
                    <p className="text-lg font-bold">HeroFx-Trade</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Login ID</p>
                    <p className="text-lg font-bold">923721</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Asset supportati</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(SYMBOL_PROFILES).map((symbol) => (
                      <Badge key={symbol} variant="outline">
                        {symbol} · {SYMBOL_PROFILES[symbol as TradingSymbol].tradingHoursLabel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    XAUUSD.r si ferma nel weekend. BTCUSD.r resta operativo 7 giorni su 7, quindi il bot continua a cercare setup anche il sabato e la domenica se Bitcoin e selezionato.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-4" value="settings">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(SYMBOL_PROFILES).map(([symbol, profile]) => (
                <Card key={symbol}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{symbol}</span>
                      <Badge variant="outline">{profile.label}</Badge>
                    </CardTitle>
                    <CardDescription>{profile.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Operativita</span>
                      <strong>{profile.tradingHoursLabel}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lotto default</span>
                      <strong>{profile.defaultLotSize}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stop loss</span>
                      <strong>{profile.stopLossPercent}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Take profit</span>
                      <strong>{profile.takeProfitPercent}%</strong>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                Tabella alimentata dagli aggiornamenti WebSocket e dai file <code>data/trades.json</code>.
              </CardDescription>
            </div>

            <Button onClick={() => navigate("/dashboard")} size="sm" variant="outline">
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
