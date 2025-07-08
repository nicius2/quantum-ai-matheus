import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  trend?: number;
  variant?: "primary" | "success" | "warning" | "accent";
  subtitle?: string;
}

export function MetricCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  variant = "primary",
  subtitle 
}: MetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-gradient-success text-success-foreground shadow-glow";
      case "warning":
        return "bg-gradient-warning text-warning-foreground shadow-glow";
      case "accent":
        return "bg-gradient-accent text-accent-foreground shadow-glow";
      default:
        return "bg-gradient-primary text-primary-foreground shadow-glow";
    }
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-medium hover:shadow-glow transition-all duration-300">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full ${getVariantClasses()}`}>
        <Icon className="absolute top-4 right-4 h-6 w-6" />
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-1">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-foreground">
              {value.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          </div>
          
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          
          {trend !== undefined && (
            <div className="flex items-center space-x-1 text-xs">
              <span className={trend >= 0 ? "text-success" : "text-destructive"}>
                {trend >= 0 ? "↗" : "↘"} {Math.abs(trend)}%
              </span>
              <span className="text-muted-foreground">vs ontem</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}