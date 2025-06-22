import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface CapaKPIData {
  onTimeCompletionRate: number;
  averageClosureTime: number;
  backlogCount: number;
  reopeningRate: number;
  sourceDistribution: Record<string, number>;
  totalCapas: number;
  closedCapas: number;
  trends: {
    monthly: Array<{
      month: string;
      value: number;
      target: number;
    }>;
  };
}

interface SupplierKPIData {
  onTimeEvaluationRate: number;
  averageRiskScore: number;
  criticalSuppliersCount: number;
  totalSuppliers: number;
  evaluationsCompleted: number;
  upcomingEvaluations: number;
  categoryDistribution: Record<string, number>;
  trends: {
    monthly: Array<{
      month: string;
      value: number;
      target: number;
    }>;
  };
}

interface ComplaintKPIData {
  responseTimeCompliance: number;
  averageResolutionTime: number;
  openComplaints: number;
  totalComplaints: number;
  escalatedComplaints: number;
  categoryDistribution: Record<string, number>;
  trends: {
    monthly: Array<{
      month: string;
      value: number;
      target: number;
    }>;
  };
}

interface CalibrationKPIData {
  onTimeCalibrationRate: number;
  averageCycleDays: number;
  overdueAssets: number;
  totalAssets: number;
  upcomingCalibrations: number;
  categoryDistribution: Record<string, number>;
  trends: {
    monthly: Array<{
      month: string;
      value: number;
      target: number;
    }>;
  };
}

export function CapaKPIWidget() {
  const { data: capaKPIs, isLoading } = useQuery<CapaKPIData>({
    queryKey: ["/api/kpi-analytics/capa-kpis"]
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">CAPA Management KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = capaKPIs?.onTimeCompletionRate || 0;
  const isGoodPerformance = completionRate >= 80;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          CAPA Management KPIs
          {isGoodPerformance ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold mb-2 ${isGoodPerformance ? 'text-green-600' : 'text-orange-600'}`}>
          {completionRate.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500 mb-4">On-Time Completion Rate</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">{capaKPIs?.totalCapas || 0}</div>
            <div className="text-gray-500">Total CAPAs</div>
          </div>
          <div>
            <div className="font-medium">{capaKPIs?.backlogCount || 0}</div>
            <div className="text-gray-500">Backlog</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SupplierKPIWidget() {
  const { data: supplierKPIs, isLoading } = useQuery<SupplierKPIData>({
    queryKey: ["/api/kpi-analytics/supplier-kpis"]
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Supplier Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const evaluationRate = supplierKPIs?.onTimeEvaluationRate || 0;
  const isGoodPerformance = evaluationRate >= 85;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Supplier Performance
          {isGoodPerformance ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold mb-2 ${isGoodPerformance ? 'text-green-600' : 'text-red-600'}`}>
          {evaluationRate.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500 mb-4">Evaluation Compliance</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">{supplierKPIs?.totalSuppliers || 0}</div>
            <div className="text-gray-500">Total Suppliers</div>
          </div>
          <div>
            <div className="font-medium">{supplierKPIs?.criticalSuppliersCount || 0}</div>
            <div className="text-gray-500">Critical</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplaintKPIWidget() {
  const { data: complaintKPIs, isLoading } = useQuery<ComplaintKPIData>({
    queryKey: ["/api/kpi-analytics/complaint-kpis"]
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Complaint Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const responseCompliance = complaintKPIs?.responseTimeCompliance || 0;
  const isGoodPerformance = responseCompliance >= 90;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Complaint Management
          {isGoodPerformance ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold mb-2 ${isGoodPerformance ? 'text-green-600' : 'text-orange-600'}`}>
          {responseCompliance.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500 mb-4">Response Compliance</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">{complaintKPIs?.openComplaints || 0}</div>
            <div className="text-gray-500">Open</div>
          </div>
          <div>
            <div className="font-medium">{complaintKPIs?.escalatedComplaints || 0}</div>
            <div className="text-gray-500">Escalated</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CalibrationKPIWidget() {
  const { data: calibrationKPIs, isLoading } = useQuery<CalibrationKPIData>({
    queryKey: ["/api/kpi-analytics/calibration-kpis"]
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Calibration Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onTimeRate = calibrationKPIs?.onTimeCalibrationRate || 0;
  const isGoodPerformance = onTimeRate >= 95;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Calibration Assets
          {isGoodPerformance ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold mb-2 ${isGoodPerformance ? 'text-green-600' : 'text-orange-600'}`}>
          {onTimeRate.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500 mb-4">On-Time Calibrations</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">{calibrationKPIs?.totalAssets || 0}</div>
            <div className="text-gray-500">Total Assets</div>
          </div>
          <div>
            <div className="font-medium">{calibrationKPIs?.overdueAssets || 0}</div>
            <div className="text-gray-500">Overdue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}