import { useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Server,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { SYMBOL_PROFILES } from "@shared/trading";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HeroFxSetup() {
  const [isBusy, setIsBusy] = useState(false);
  const statusQuery = trpc.herofx.status.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const accountInfoQuery = trpc.herofx.getAccountInfo.useQuery(undefined, {
    enabled: statusQuery.data?.isConnected === true,
    retry: false,
  });

  const connectMutation = trpc.herofx.connect.useMutation();
  const disconnectMutation = trpc.herofx.disconnect.useMutation();

  const isConnected = statusQuery.data?.isConnected ?? false;
  const accountInfo = accountInfoQuery.data;

  async function handleConnect() {
    setIsBusy(true);
    const notificationId = toast.loading("Connessione a HeroFx in corso...");

    try {
      const result = await connectMutation.mutateAsync();
      if (result.success) {
        toast.success(result.message, { id: notificationId });
        await Promise.all([statusQuery.refetch(), accountInfoQuery.refetch()]);
      } else {
        toast.error(result.message, { id: notificationId });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore di connessione";
      toast.error(message, { id: notificationId });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisconnect() {
    setIsBusy(true);
    const notificationId = toast.loading("Disconnessione in corso...");

    try {
      const result = await disconnectMutation.mutateAsync();
      toast.success(result.message, { id: notificationId });
      await statusQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore di disconnessione";
      toast.error(message, { id: notificationId });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurazione HeroFx</h1>
            <p className="text-muted-foreground">
              Gestione account MT5 e profili di trading del bot multi-asset.
            </p>
          </div>

          <Badge className="px-3 py-1 text-sm" variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connesso" : "Disconnesso"}
          </Badge>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Le credenziali reali non devono stare nel codice. Configurale tramite file <code className="rounded bg-muted px-2 py-1 text-xs">.env</code> o variabili ambiente: <code className="rounded bg-muted px-2 py-1 text-xs">HEROFX_LOGIN</code>, <code className="rounded bg-muted px-2 py-1 text-xs">HEROFX_PASSWORD</code>, <code className="rounded bg-muted px-2 py-1 text-xs">HEROFX_SERVER</code>.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Stato connessione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed py-6 text-center">
                {isConnected ? (
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-yellow-500" />
                )}

                <div>
                  <p className="font-bold">{isConnected ? "Connesso" : "Non connesso"}</p>
                  <p className="text-xs text-muted-foreground">
                    {statusQuery.data?.status ?? "Verifica stato in corso"}
                  </p>
                </div>

                {isConnected ? (
                  <Button className="w-full" disabled={isBusy} onClick={handleDisconnect} variant="outline">
                    Disconnetti
                  </Button>
                ) : (
                  <Button className="w-full" disabled={isBusy} onClick={handleConnect}>
                    Connetti ora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5" />
                Dettagli account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Login ID</Label>
                  <p className="text-xl font-mono font-bold">
                    {accountInfo?.login ?? 923721}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Server broker</Label>
                  <p className="text-xl font-bold">HeroFx-Trade</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Balance</Label>
                  <p className="text-xl font-bold">
                    ${Number(accountInfo?.balance ?? 10000).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Equity</Label>
                  <p className="text-xl font-bold">
                    ${Number(accountInfo?.equity ?? 10000).toFixed(2)}
                  </p>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-muted-foreground">Asset supportati</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SYMBOL_PROFILES).map(([symbol, profile]) => (
                      <Badge key={symbol} variant="outline">
                        {symbol} · {profile.tradingHoursLabel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-muted-foreground">Operativita bot</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <p className="text-lg font-bold">
                      XAUUSD.r feriale, BTCUSD.r attivo anche nel weekend
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs className="w-full" defaultValue="trading">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trading">Profili trading</TabsTrigger>
            <TabsTrigger value="risk">Gestione rischio</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4 space-y-4" value="trading">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(SYMBOL_PROFILES).map(([symbol, profile]) => (
                <Card key={symbol}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{symbol}</span>
                      <Badge variant="secondary">{profile.label}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Lotto default</Label>
                      <Input defaultValue={String(profile.defaultLotSize)} disabled type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label>Stop loss (%)</Label>
                      <Input defaultValue={String(profile.stopLossPercent)} disabled type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label>Take profit (%)</Label>
                      <Input defaultValue={String(profile.takeProfitPercent)} disabled type="number" />
                    </div>
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        {profile.description} Regola di calendario: {profile.tradingHoursLabel}.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent className="mt-4 space-y-4" value="risk">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Max daily loss ($)</Label>
                    <Input defaultValue="100" disabled type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max open positions</Label>
                    <Input defaultValue="5" disabled type="number" />
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-200">
                    <Activity className="h-4 w-4" />
                    Strategia di protezione
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Quando la perdita giornaliera supera il limite, il bot smette di aprire nuove posizioni. Per Bitcoin il controllo resta attivo anche il weekend, per l'oro rientra automaticamente alla riapertura del mercato.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
