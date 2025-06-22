import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gauge, AlertTriangle, Calendar, Settings } from "lucide-react";

interface CalibrationKPIData {
  onTimeCalibrationRate: number;
  outOfToleranceRate: number;
  overdueAssetCount: number;
  totalAssets: number;
  calibratedThisMonth: number;
  upcomingCalibrations: Array<{
    id: number;
    assetName: string;
    dueDate: string;
  }>;
  assetTypeDistribution: {
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

export function CalibrationKPIWidget() {
  const { data: calibrationKPIs, isLoading, error } = useQuery<CalibrationKPIData>({
    queryKey: ['/api/kpi-analytics/calibration-kpis'],
    refetchInterval: 30000,
    retry: 1,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Calibration Asset KPIs</CardTitle>
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
          <CardTitle className="text-sm font-medium">Calibration Asset KPIs</CardTitle>
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
          <Gauge className="h-4 w-4" />
          Calibration Asset KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* On-Time Calibration Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">On-Time Calibration</span>
            <span className={`text-sm font-semibold ${getStatusColor(calibrationKPIs?.onTimeCalibrationRate || 0, 95)}`}>
              {calibrationKPIs?.onTimeCalibrationRate?.toFixed(1) || 0}%
            </span>
          </div>
          <Progress value={calibrationKPIs?.onTimeCalibrationRate || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: 95%</div>
        </div>

        {/* Out-of-Tolerance Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Out-of-Tolerance</span>
            <Badge variant={(calibrationKPIs?.outOfToleranceRate || 0) <= 5 ? "default" : "destructive"}>
              {calibrationKPIs?.outOfToleranceRate?.toFixed(1) || "0.0"}%
            </Badge>
          </div>
          <Progress value={calibrationKPIs?.outOfToleranceRate || 0} max={10} className="h-2" />
          <div className="text-xs text-gray-500">Target: ≤5%</div>
        </div>

        {/* Overdue Assets */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-600">Overdue Assets</span>
          </div>
          <Badge variant={calibrationKPIs?.overdueAssetCount === 0 ? "default" : "destructive"}>
            {calibrationKPIs?.overdueAssetCount || 0}
          </Badge>
        </div>

        {/* Upcoming Calibrations */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">Due This Month</span>
          </div>
          <Badge variant="outline">
            {Array.isArray(calibrationKPIs?.upcomingCalibrations) 
              ? calibrationKPIs.upcomingCalibrations.length 
              : calibrationKPIs?.upcomingCalibrations || 0}
          </Badge>
        </div>

        {/* Asset Type Distribution */}
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Asset Types</span>
          <div className="grid grid-cols-1 gap-1">
            {calibrationKPIs?.assetTypeDistribution && Object.entries(calibrationKPIs.assetTypeDistribution)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 4)
              .map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="text-gray-600">{type}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{calibrationKPIs?.totalAssets || 0}</div>
            <div className="text-xs text-gray-500">Total Assets</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{calibrationKPIs?.calibratedThisMonth || 0}</div>
            <div className="text-xs text-gray-500">This Month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}