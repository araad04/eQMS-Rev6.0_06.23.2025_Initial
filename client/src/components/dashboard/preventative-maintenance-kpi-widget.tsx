import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Settings, AlertTriangle, Clock, Wrench } from "lucide-react";

interface MaintenanceKPIData {
  onTimeCompletionRate: number;
  equipmentUptime: number;
  overdueMaintenanceCount: number;
  meanTimeBetweenFailures: number;
  avgMaintenanceCostPerAsset: number;
  totalEquipment: number;
  maintenanceThisMonth: number;
  upcomingMaintenance: number;
  criticalEquipmentCount: number;
  maintenanceTypeDistribution: {
    [key: string]: number;
  };
  equipmentCategoryDistribution: {
    [key: string]: number;
  };
  trends: {
    monthly: Array<{
      month: string;
      value: number;
      target: number;
    }>;
  };
}

export function PreventativeMaintenanceKPIWidget() {
  const { data: maintenanceKPIs, isLoading, error } = useQuery<MaintenanceKPIData>({
    queryKey: ['/api/kpi-analytics/preventative-maintenance-kpis'],
    refetchInterval: 30000,
    retry: 1,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Preventative Maintenance KPIs</CardTitle>
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
          <CardTitle className="text-sm font-medium">Preventative Maintenance KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">
            Error loading maintenance KPI data. Please check your connection.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!maintenanceKPIs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Preventative Maintenance KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">No maintenance data available</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (value: number, target: number = 95) => {
    if (value >= target) return "text-green-600";
    if (value >= target * 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (value: number, target: number = 95) => {
    if (value >= target) return "bg-green-500";
    if (value >= target * 0.8) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-500" />
          Preventative Maintenance KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary KPIs */}
        <div className="space-y-3">
          {/* On-Time Completion Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">On-Time Completion</span>
              <Badge variant="outline" className={getStatusColor(maintenanceKPIs.onTimeCompletionRate)}>
                {maintenanceKPIs.onTimeCompletionRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress 
              value={maintenanceKPIs.onTimeCompletionRate} 
              className="h-2"
            />
          </div>

          {/* Equipment Uptime */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Equipment Uptime</span>
              <Badge variant="outline" className={getStatusColor(maintenanceKPIs.equipmentUptime, 98)}>
                {maintenanceKPIs.equipmentUptime.toFixed(1)}%
              </Badge>
            </div>
            <Progress 
              value={maintenanceKPIs.equipmentUptime} 
              className="h-2"
            />
          </div>
        </div>

        {/* Alert Section */}
        {maintenanceKPIs.overdueMaintenanceCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                {maintenanceKPIs.overdueMaintenanceCount} Overdue Maintenance
              </span>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-semibold text-blue-600">{maintenanceKPIs.totalEquipment}</div>
            <div className="text-xs text-gray-500">Total Equipment</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-semibold text-green-600">{maintenanceKPIs.maintenanceThisMonth}</div>
            <div className="text-xs text-gray-500">This Month</div>
          </div>
        </div>

        {/* MTBF and Cost */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">MTBF</span>
            </div>
            <span className="text-sm font-medium">{maintenanceKPIs.meanTimeBetweenFailures.toLocaleString()}h</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Avg Cost/Asset</span>
            </div>
            <span className="text-sm font-medium">${maintenanceKPIs.avgMaintenanceCostPerAsset.toLocaleString()}</span>
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">Upcoming Maintenance</span>
            <Badge variant="outline" className="text-blue-600">
              {maintenanceKPIs.upcomingMaintenance} scheduled
            </Badge>
          </div>
        </div>

        {/* Equipment Distribution */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Equipment Categories</div>
          <div className="space-y-1">
            {Object.entries(maintenanceKPIs.equipmentCategoryDistribution).map(([category, count]) => (
              <div key={category} className="flex justify-between text-xs">
                <span className="text-gray-600">{category}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}