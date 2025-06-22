import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Metric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

interface MetricsPulseProps {
  metrics: Metric[];
  title: string;
  description: string;
}

export function MetricsPulse({ metrics }: MetricsPulseProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => {
        const percentage = (metric.value / metric.target) * 100;
        const isOnTarget = percentage >= 90;
        
        return (
          <Card key={index} className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">{metric.name}</h4>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <Badge variant={isOnTarget ? "default" : "destructive"} className="text-xs">
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={getTrendColor(metric.trend)}>
                    {metric.value}{metric.unit || ''}
                  </span>
                  <span className="text-muted-foreground">
                    Target: {metric.target}{metric.unit || ''}
                  </span>
                </div>
                
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}