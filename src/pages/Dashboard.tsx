import { Truck, Snowflake, Package, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ProcessTimeline } from "@/components/ProcessTimeline";
import { DashboardHeader } from "@/components/DashboardHeader";

// Dados mockados - aqui você conectará com seu algoritmo Python
const mockData = {
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
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        employeeName={mockData.employee}
        currentDate={mockData.currentDate}
        notifications={2}
      />
      
      <main className="px-6 py-8">
        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Quantidade para Retirada Hoje"
            value={mockData.retiradaHoje}
            unit="kg"
            icon={Truck}
            variant="primary"
            trend={8.5}
            subtitle="Meta diária de retirada"
          />
          
          <MetricCard
            title="Em Descongelamento"
            value={mockData.descongelamento}
            unit="kg"
            icon={Snowflake}
            variant="accent"
            trend={-2.1}
            subtitle="Processo em andamento"
          />
          
          <MetricCard
            title="Disponível Hoje"
            value={mockData.disponivelHoje}
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
          stages={mockData.stages}
        />
      </main>
    </div>
  );
}