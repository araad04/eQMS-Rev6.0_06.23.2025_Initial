import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";

export function CapaKPIWidget() {
  const { data: capaKPIs, isLoading, error } = useQuery({
    queryKey: ['/api/kpi-analytics/capa-kpis'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">CAPA Management KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">CAPA Management KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">
            Error loading KPI data. Please check your connection.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (value: number, target: number) => {
    if (value >= target) return "text-green-600";
    if (value >= target * 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          CAPA Management KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* On-Time Completion Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">On-Time Completion</span>
            <span className={`text-sm font-semibold ${getStatusColor(capaKPIs?.onTimeCompletionRate || 0, 90)}`}>
              {capaKPIs?.onTimeCompletionRate?.toFixed(1) || 0}%
            </span>
          </div>
          <Progress value={capaKPIs?.onTimeCompletionRate || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: 90%</div>
        </div>

        {/* Average Closure Time */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">Avg Closure Time</span>
          </div>
          <Badge variant={capaKPIs?.averageClosureTime <= 30 ? "default" : "destructive"}>
            {capaKPIs?.averageClosureTime?.toFixed(1) || 0} days
          </Badge>
        </div>

        {/* Backlog Count */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Overdue CAPAs</span>
          <Badge variant={capaKPIs?.backlogCount === 0 ? "default" : "destructive"}>
            {capaKPIs?.backlogCount || 0}
          </Badge>
        </div>

        {/* Source Distribution */}
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Top CAPA Sources</span>
          <div className="space-y-1">
            {capaKPIs?.sourceDistribution && Object.entries(capaKPIs.sourceDistribution)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([source, count]) => (
                <div key={source} className="flex justify-between text-xs">
                  <span className="text-gray-600">{source}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{capaKPIs?.totalCapas || 0}</div>
            <div className="text-xs text-gray-500">Total CAPAs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{capaKPIs?.closedCapas || 0}</div>
            <div className="text-xs text-gray-500">Closed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}