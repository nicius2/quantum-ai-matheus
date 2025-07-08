import { useState, useEffect } from "react";
import { Truck, Snowflake, Package, TrendingUp, Upload, PlayCircle } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ProcessTimeline } from "@/components/ProcessTimeline";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Dados iniciais para fallback
const defaultData = {
  retiradaHoje: 125.5,
  descongelamento: 87.2,
  disponivelHoje: 203.8,
  employee: "João Silva",
  currentDate: new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }),
  stages: [
    {
      day: 1,
      stage: "Retirada",
      amount: 125.5,
      status: "current" as const
    },
    {
      day: 2,
      stage: "Retirada",
      amount: 98.3,
      status: "pending" as const
    },
    {
      day: 3,
      stage: "Descongelamento",
      amount: 125.5,
      status: "pending" as const
    },
    {
      day: 4,
      stage: "Descongelamento",
      amount: 98.3,
      status: "pending" as const
    },
    {
      day: 5,
      stage: "Disponível",
      amount: 125.5,
      status: "pending" as const
    },
    {
      day: 6,
      stage: "Disponível",
      amount: 98.3,
      status: "pending" as const
    }
  ]
};

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [idProduto, setIdProduto] = useState("237497");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { toast } = useToast();

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://kxlkwyfbtjqsthybfgex.supabase.co/functions/v1/dashboard-dados?idProduto=${idProduto}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bGt3eWZidGpxc3RoeWJmZ2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMTgxMTYsImV4cCI6MjA2NzU5NDExNn0.FPyMfZV9-vFuP8_KBUMvYBjuB-q84KEKVRojoRupnPw`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        setDashboardData({
          retiradaHoje: data.metricas.retiradaHoje,
          descongelamento: data.metricas.descongelamento,
          disponivelHoje: data.metricas.disponivelHoje,
          employee: "Sistema Quantum",
          currentDate: new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          stages: data.cronograma
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadCSV = async () => {
    if (!csvFile) return;

    try {
      setLoading(true);
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const csvData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim();
          });
          return obj;
        });

      const response = await supabase.functions.invoke('upload-vendas', {
        body: { csvData }
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: "Dados CSV importados com sucesso",
      });
      
      setCsvFile(null);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar dados CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarPrevisao = async () => {
    try {
      setLoading(true);
      const response = await supabase.functions.invoke('gerar-previsao', {
        body: { 
          idProduto: parseInt(idProduto),
          diasPrevisao: 9 
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: "Previsão gerada com sucesso",
      });

      // Recarregar dados após gerar previsão
      await carregarDados();
    } catch (error) {
      console.error('Erro ao gerar previsão:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar previsão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        employeeName={dashboardData.employee}
        currentDate={dashboardData.currentDate}
        notifications={2}
      />
      
      <main className="px-6 py-8">
        {/* Controles do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload CSV</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
                <Button 
                  onClick={uploadCSV} 
                  disabled={!csvFile || loading}
                  className="w-full"
                >
                  Importar Dados
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlayCircle className="h-5 w-5" />
                <span>Gerar Previsão</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="number"
                  placeholder="ID do Produto"
                  value={idProduto}
                  onChange={(e) => setIdProduto(e.target.value)}
                />
                <Button 
                  onClick={gerarPrevisao} 
                  disabled={!idProduto || loading}
                  className="w-full"
                >
                  Executar Algoritmo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Algoritmo:</span>
                  <span className="text-sm font-medium text-success">SARIMAX Ativo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Última Atualização:</span>
                  <span className="text-sm font-medium">Agora</span>
                </div>
                <Button 
                  onClick={carregarDados} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Atualizar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Quantidade para Retirada Hoje"
            value={dashboardData.retiradaHoje}
            unit="kg"
            icon={Truck}
            variant="primary"
            trend={8.5}
            subtitle="Previsão baseada em SARIMAX"
          />
          
          <MetricCard
            title="Em Descongelamento"
            value={dashboardData.descongelamento}
            unit="kg"
            icon={Snowflake}
            variant="accent"
            trend={-2.1}
            subtitle="Processo em andamento"
          />
          
          <MetricCard
            title="Disponível Hoje"
            value={dashboardData.disponivelHoje}
            unit="kg"
            icon={Package}
            variant="success"
            trend={12.3}
            subtitle="Pronto para distribuição"
          />
        </div>

        {/* Cards informativos adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 shadow-medium border border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Resumo Semanal
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total processado esta semana:</span>
                <span className="font-medium text-foreground">1,247.5 kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média diária:</span>
                <span className="font-medium text-foreground">178.2 kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Eficiência:</span>
                <span className="font-medium text-success">96.8%</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-medium border border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-warning rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-warning-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Status do Estoque
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estoque total:</span>
                <span className="font-medium text-foreground">2,456.8 kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Em processo:</span>
                <span className="font-medium text-foreground">312.7 kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nível de alerta:</span>
                <span className="font-medium text-success">Normal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline do processo */}
        <ProcessTimeline 
          currentDay={1}
          stages={dashboardData.stages}
        />
      </main>
    </div>
  );
}