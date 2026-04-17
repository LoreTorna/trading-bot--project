import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Calendar, Clock, Target, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Dashboard Page
 * Statistiche avanzate e metriche di trading
 * 
 * NOTA: Questa pagina è pronta per essere collegata al backend tramite tRPC
 * I dati reali verranno recuperati da:
 * - server/routers/bot.ts per le statistiche del bot
 * - server/db.ts per i dati storici dei trade
 * 
 * DATI FALSI RIMOSSI: Tutti i mock data sono stati rimossi.
 * Quando il bot è in esecuzione, i dati reali verranno visualizzati qui.
 */

export default function Dashboard() {
  // Query per i dati reali (quando disponibili)
  // const { data: stats } = trpc.bot.getStats.useQuery();
  // const { data: trades } = trpc.bot.getTrades.useQuery();
  // const { data: performance } = trpc.bot.getPerformance.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Statistiche e metriche di trading in tempo reale</p>
        </div>

        {/* Alert - Dati Non Disponibili */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Dati non disponibili:</strong> Avvia il bot per visualizzare le statistiche di trading in tempo reale. I dati falsi sono stati rimossi per garantire accuratezza.
          </AlertDescription>
        </Alert>

        {/* Key Metrics - Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">-</div>
              <p className="text-xs text-muted-foreground mt-1">Rapporto Profitti/Perdite</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk/Reward Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">-</div>
              <p className="text-xs text-muted-foreground mt-1">Rapporto Rischio/Rendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">-</div>
              <p className="text-xs text-muted-foreground mt-1">Massima perdita dal picco</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">-</div>
              <p className="text-xs text-muted-foreground mt-1">Percentuale trade vincenti</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trade Recenti</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiche Generali</CardTitle>
                <CardDescription>Metriche complessive del trading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Trade</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Performance</CardTitle>
                <CardDescription>Dettagli di performance nel tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-muted-foreground">
                  <p>Nessun dato disponibile. Avvia il bot per visualizzare i grafici di performance.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Trades Tab */}
          <TabsContent value="trades" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade Recenti</CardTitle>
                <CardDescription>Ultimi trade eseguiti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-muted-foreground">
                  <p>Nessun trade disponibile. Avvia il bot per visualizzare i trade eseguiti.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base">Come visualizzare i dati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Avvia il bot dal sito web o dalla riga di comando</p>
            <p>2. Il bot inizierà a eseguire trade su XAUUSD.r</p>
            <p>3. I dati verranno visualizzati in tempo reale in questa dashboard</p>
            <p>4. I report giornalieri verranno generati automaticamente alle 23:00</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
