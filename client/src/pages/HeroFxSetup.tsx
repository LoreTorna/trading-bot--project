import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Shield, Activity, Clock, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HeroFxSetup() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      toast.loading("Connessione a HeroFx-Trade...");
      // Simula connessione (in produzione userebbe trpc.herofx.connect)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnected(true);
      toast.success("✅ Connesso con successo all'account 923721!");
    } catch (error) {
      toast.error("❌ Errore di connessione!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      toast.loading("Disconnessione...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(false);
      toast.success("✅ Disconnesso!");
    } catch (error) {
      toast.error("❌ Errore durante la disconnessione!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Configurazione HeroFx</h1>
            <p className="text-muted-foreground">Gestione account MT5 e parametri di trading</p>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"} className="text-sm px-3 py-1">
            {isConnected ? "🟢 Connesso" : "🔴 Disconnesso"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connection Status */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Stato Connessione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-4 border-2 border-dashed rounded-lg">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <div className="text-center">
                      <p className="font-bold">Account Attivo</p>
                      <p className="text-xs text-muted-foreground">HeroFx-Trade (923721)</p>
                    </div>
                    <Button variant="destructive" className="w-full" onClick={handleDisconnect} disabled={isLoading}>
                      Disconnetti
                    </Button>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 text-yellow-500" />
                    <div className="text-center">
                      <p className="font-bold">Non Connesso</p>
                      <p className="text-xs text-muted-foreground">Pronto per il login</p>
                    </div>
                    <Button className="w-full" onClick={handleConnect} disabled={isLoading}>
                      Connetti Ora
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5" />
                Dettagli Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Login ID</Label>
                  <p className="text-xl font-mono font-bold">923721</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Server Broker</Label>
                  <p className="text-xl font-bold">HeroFx-Trade</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Tipo Account</Label>
                  <Badge variant="outline">DEMO</Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Simbolo Trading</Label>
                  <p className="text-xl font-bold text-blue-600">XAUUSD.r</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Leva</Label>
                  <p className="text-xl font-bold">1:100</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Operatività</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <p className="text-xl font-bold">H23 (5/7)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trading" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trading">Parametri Trading</TabsTrigger>
            <TabsTrigger value="risk">Gestione Rischio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trading" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lotto Default</Label>
                    <Input type="number" defaultValue="0.10" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Lot Size</Label>
                    <Input type="number" defaultValue="0.01" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Stop Loss (Points)</Label>
                    <Input type="number" defaultValue="20" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Take Profit (Points)</Label>
                    <Input type="number" defaultValue="40" disabled />
                  </div>
                </div>
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Questi parametri sono ottimizzati per il trading sull'oro (XAUUSD.r) con operatività H23.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Daily Loss ($)</Label>
                    <Input type="number" defaultValue="100" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Open Positions</Label>
                    <Input type="number" defaultValue="5" disabled />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Strategia di Protezione
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Il bot monitora costantemente l'equity dell'account. Se la perdita giornaliera supera i $100, tutte le posizioni vengono chiuse e il bot si ferma fino al giorno successivo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>Indietro</Button>
          <Button disabled>Salva Modifiche</Button>
        </div>
      </div>
    </div>
  );
}
