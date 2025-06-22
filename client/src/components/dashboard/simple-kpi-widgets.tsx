import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, Users, Calendar, Link } from "lucide-react";

// Type definitions for KPI data
interface CapaKPIs {
  onTimeCompletionRate: number;
  totalCapas: number;
  closedCapas: number;
  averageClosureTime: number;
  backlogCount: number;
  sourceDistribution: Array<{ source: string; count: number }>;
}

interface SupplierKPIs {
  onTimeEvaluationRate: number;
  totalSuppliers: number;
  approvedSuppliers: number;
  criticalSuppliers: number;
}

interface ComplaintKPIs {
  capaLinkedRate: number;
  totalComplaints: number;
  resolvedComplaints: number;
}

interface CalibrationKPIs {
  onTimeCalibrationRate: number;
  totalAssets: number;
  overdueAssetCount: number;
}

// Simple CAPA KPI Widget
export function SimpleCapaKPIWidget() {
  const { data: capaKPIs, isLoading, error } = useQuery<CapaKPIs>({
    queryKey: ['/api/kpi-analytics/capa-kpis'],
    refetchInterval: 30000,
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
          <p className="text-red-500 text-sm">Error loading CAPA KPIs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          CAPA Management KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">On-Time Completion</span>
            <Badge variant={capaKPIs?.onTimeCompletionRate >= 90 ? "default" : "destructive"}>
              {capaKPIs?.onTimeCompletionRate?.toFixed(1) || "0.0"}%
            </Badge>
          </div>
          <Progress value={capaKPIs?.onTimeCompletionRate || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: ≥90%</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

// Simple Supplier KPI Widget
export function SimpleSupplierKPIWidget() {
  const { data: supplierKPIs, isLoading, error } = useQuery<SupplierKPIs>({
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
          <p className="text-red-500 text-sm">Error loading Supplier KPIs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-green-500" />
          Supplier Management KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">On-Time Evaluation</span>
            <Badge variant={supplierKPIs?.onTimeEvaluationRate >= 95 ? "default" : "destructive"}>
              {supplierKPIs?.onTimeEvaluationRate?.toFixed(1) || "0.0"}%
            </Badge>
          </div>
          <Progress value={supplierKPIs?.onTimeEvaluationRate || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: ≥95%</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{supplierKPIs?.totalSuppliers || 0}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{supplierKPIs?.approvedSuppliers || 0}</div>
            <div className="text-xs text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{supplierKPIs?.criticalSuppliers || 0}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Complaint KPI Widget
export function SimpleComplaintKPIWidget() {
  const { data: complaintKPIs, isLoading, error } = useQuery<ComplaintKPIs>({
    queryKey: ['/api/kpi-analytics/complaint-kpis'],
    refetchInterval: 30000,
    retry: 1,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Complaint Management KPIs</CardTitle>
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
          <CardTitle className="text-sm font-medium">Complaint Management KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">Error loading Complaint KPIs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Complaint Management KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">CAPA-Linked Rate</span>
            <Badge variant="default">
              {complaintKPIs?.capaLinkedRate?.toFixed(1) || "0.0"}%
            </Badge>
          </div>
          <Progress value={complaintKPIs?.capaLinkedRate || 0} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{complaintKPIs?.totalComplaints || 0}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{complaintKPIs?.resolvedComplaints || 0}</div>
            <div className="text-xs text-gray-500">Resolved</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Calibration KPI Widget
export function SimpleCalibrationKPIWidget() {
  const { data: calibrationKPIs, isLoading, error } = useQuery<CalibrationKPIs>({
    queryKey: ['/api/kpi-analytics/calibration-kpis'],
    refetchInterval: 30000,
    retry: 1,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Calibration Management KPIs</CardTitle>
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
          <CardTitle className="text-sm font-medium">Calibration Management KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">Error loading Calibration KPIs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-purple-500" />
          Calibration Management KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">On-Time Calibration</span>
            <Badge variant={calibrationKPIs?.onTimeCalibrationRate >= 95 ? "default" : "destructive"}>
              {calibrationKPIs?.onTimeCalibrationRate?.toFixed(1) || "0.0"}%
            </Badge>
          </div>
          <Progress value={calibrationKPIs?.onTimeCalibrationRate || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: ≥95%</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{calibrationKPIs?.totalAssets || 0}</div>
            <div className="text-xs text-gray-500">Total Assets</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{calibrationKPIs?.overdueAssetCount || 0}</div>
            <div className="text-xs text-gray-500">Overdue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}