import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HeroFxSetup() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      toast.loading("🔗 Connessione a HeroFx in corso...");

      // Simula la connessione (in produzione userebbe tRPC)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Dati simulati dell'account
      const mockAccountInfo = {
        login: 923721,
        balance: 10000,
        equity: 10250.5,
        margin: 500,
        freeMargin: 9750.5,
        marginLevel: 2050,
        openPositions: 0,
        totalProfit: 250.5,
      };

      setAccountInfo(mockAccountInfo);
      setIsConnected(true);
      toast.success("✅ Connesso a HeroFx con successo!");
    } catch (error) {
      toast.error("❌ Errore di connessione a HeroFx");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      toast.loading("🔌 Disconnessione...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsConnected(false);
      setAccountInfo(null);
      toast.success("✅ Disconnesso da HeroFx");
    } catch (error) {
      toast.error("❌ Errore di disconnessione");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Configurazione HeroFx</h1>
          <p className="text-muted-foreground">Collegati al tuo account demo HeroFx per il trading automatico</p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Stato Connessione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    🟢 Connesso
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    🔴 Disconnesso
                  </span>
                )}
              </Badge>
            </div>

            {isConnected && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ✅ Connessione attiva a HeroFx-Trade (Login: 923721)
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleConnect}
                disabled={isConnecting || isConnected}
                size="lg"
              >
                {isConnecting ? "Connessione..." : "Connetti a HeroFx"}
              </Button>

              {isConnected && (
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                  size="lg"
                >
                  {isConnecting ? "Disconnessione..." : "Disconnetti"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        {isConnected && accountInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Account</CardTitle>
              <CardDescription>Dati in tempo reale dal tuo account demo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Login</p>
                  <p className="text-lg font-bold">{accountInfo.login}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold text-green-600">${accountInfo.balance.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Equity</p>
                  <p className="text-lg font-bold text-blue-600">${accountInfo.equity.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Free Margin</p>
                  <p className="text-lg font-bold">${accountInfo.freeMargin.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Margin Level</p>
                  <p className="text-lg font-bold">{accountInfo.marginLevel}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Profit</p>
                  <p className="text-lg font-bold text-green-600">+${accountInfo.totalProfit.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trading Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni Trading</CardTitle>
            <CardDescription>Configura i parametri per il trading automatico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Simbolo</Label>
                <Input value="XAUUSD.r" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Leva Finanziaria</Label>
                <Input value="100" type="number" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Lot Size Minimo</Label>
                <Input value="0.01" type="number" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Lot Size Massimo</Label>
                <Input value="100" type="number" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Stop Loss (punti)</Label>
                <Input value="20" type="number" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Take Profit (punti)</Label>
                <Input value="40" type="number" disabled className="bg-slate-100" />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ℹ️ Questi parametri sono preconfigurati per il trading su XAUUSD.r. Puoi modificarli dalle impostazioni avanzate.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Backtesting Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni Backtesting</CardTitle>
            <CardDescription>Configura i parametri per il backtesting della strategia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inizio</Label>
                <Input type="date" defaultValue="2024-01-15" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Data Fine</Label>
                <Input type="date" defaultValue="2024-04-15" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Input value="H1 (1 ora)" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Balance Iniziale</Label>
                <Input value="$10,000" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Commissione</Label>
                <Input value="0.01%" disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Giorni di Test</Label>
                <Input value="90 giorni" disabled className="bg-slate-100" />
              </div>
            </div>

            <Button className="w-full" size="lg" disabled={!isConnected}>
              Esegui Backtesting
            </Button>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            💡 Connettiti a HeroFx per visualizzare i dati reali del tuo account e iniziare il trading automatico su XAUUSD.r
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
