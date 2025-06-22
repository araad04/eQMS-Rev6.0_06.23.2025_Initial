import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, CheckCircle, AlertCircle } from "lucide-react";

interface SupplierKPIData {
  onTimeEvaluationRate: number;
  supplierNCRate: number;
  supplierCAPAClosureRate: number;
  totalSuppliers: number;
  approvedSuppliers: number;
  criticalSuppliers: number;
  supplierPerformanceDistribution: {
    Excellent: number;
    Good: number;
    Fair: number;
    Poor: number;
  };
  trends: {
    monthly: Array<{
      month: string;
      value: number;
      target: number;
    }>;
  };
}

export function SupplierKPIWidget() {
  const { data: supplierKPIs, isLoading, error } = useQuery<SupplierKPIData>({
    queryKey: ['/api/kpi-analytics/supplier-kpis'],
    refetchInterval: 30000,
    retry: 1,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Supplier Management KPIs</CardTitle>
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
          <CardTitle className="text-sm font-medium">Supplier Management KPIs</CardTitle>
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
          <Building2 className="h-4 w-4" />
          Supplier Management KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* On-Time Evaluation Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">On-Time Evaluation</span>
            <span className={`text-sm font-semibold ${getStatusColor(supplierKPIs?.onTimeEvaluationRate || 0, 95)}`}>
              {supplierKPIs?.onTimeEvaluationRate?.toFixed(1) || 0}%
            </span>
          </div>
          <Progress value={supplierKPIs?.onTimeEvaluationRate || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: 95%</div>
        </div>

        {/* NC Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">NC Rate</span>
            <Badge variant={(supplierKPIs?.supplierNCRate || 0) <= 5 ? "default" : "destructive"}>
              {supplierKPIs?.supplierNCRate?.toFixed(1) || "0.0"}%
            </Badge>
          </div>
          <Progress value={supplierKPIs?.supplierNCRate || 0} max={10} className="h-2" />
          <div className="text-xs text-gray-500">Target: ≤5%</div>
        </div>

        {/* CAPA Closure Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">CAPA Closure Rate</span>
            <span className={`text-sm font-semibold ${getStatusColor(supplierKPIs?.supplierCAPAClosureRate || 0, 90)}`}>
              {supplierKPIs?.supplierCAPAClosureRate?.toFixed(1) || 0}%
            </span>
          </div>
          <Progress value={supplierKPIs?.supplierCAPAClosureRate || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: 90%</div>
        </div>

        {/* Performance Distribution */}
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Performance Distribution</span>
          <div className="grid grid-cols-2 gap-1">
            {supplierKPIs?.supplierPerformanceDistribution && 
              Object.entries(supplierKPIs.supplierPerformanceDistribution).map(([level, count]) => (
                <div key={level} className="flex justify-between text-xs">
                  <span className={`text-gray-600 ${
                    level === 'Excellent' ? 'text-green-600' :
                    level === 'Good' ? 'text-blue-600' :
                    level === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{level}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{supplierKPIs?.totalSuppliers || 0}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{supplierKPIs?.approvedSuppliers || 0}</div>
            <div className="text-xs text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{supplierKPIs?.criticalSuppliers || 0}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}