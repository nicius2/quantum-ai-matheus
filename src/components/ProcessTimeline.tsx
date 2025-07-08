import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Truck, Snowflake, Package } from "lucide-react";

interface ProcessTimelineProps {
  currentDay: number;
  stages: {
    day: number;
    stage: string;
    amount: number;
    status: "completed" | "current" | "pending";
  }[];
}

export function ProcessTimeline({ currentDay, stages }: ProcessTimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "current":
        return "bg-primary text-primary-foreground animate-pulse-soft";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "retirada":
        return Truck;
      case "descongelamento":
        return Snowflake;
      case "disponível":
        return Package;
      default:
        return Clock;
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Cronograma de Processo (2 dias por etapa)</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border"></div>
          
          <div className="space-y-6">
            {stages.map((stage, index) => {
              const StageIcon = getStageIcon(stage.stage);
              
              return (
                <div key={index} className="relative flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className={`
                    relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background
                    ${getStatusColor(stage.status)}
                  `}>
                    <StageIcon className="h-5 w-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Dia {stage.day} - {stage.stage}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stage.amount} kg
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`
                          inline-flex px-2 py-1 text-xs font-medium rounded-full
                          ${stage.status === "completed" ? "bg-success/10 text-success" :
                            stage.status === "current" ? "bg-primary/10 text-primary" :
                            "bg-muted/10 text-muted-foreground"}
                        `}>
                          {stage.status === "completed" ? "Concluído" :
                           stage.status === "current" ? "Em andamento" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}