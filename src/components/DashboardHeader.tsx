import { Bell, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  employeeName: string;
  currentDate: string;
  notifications?: number;
}

export function DashboardHeader({ 
  employeeName, 
  currentDate, 
  notifications = 0 
}: DashboardHeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-soft">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Dashboard de Controle
              </h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {employeeName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{currentDate}</span>
          </div>
          
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}