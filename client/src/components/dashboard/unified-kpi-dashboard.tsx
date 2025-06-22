import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Factory, 
  FileText, 
  Gauge, 
  Settings, 
  Shield, 
  TrendingUp,
  Wrench
} from 'lucide-react';

// Unified KPI data structure
interface UnifiedKPIData {
  capa: {
    onTimeCompletionRate: number;
    totalCapas: number;
    backlogCount: number;
    averageClosureTime: number;
    reopeningRate: number;
  };
  supplier: {
    onTimeEvaluationRate: number;
    totalSuppliers: number;
    criticalSuppliers: number;
    supplierNCRate: number;
    supplierCAPAClosureRate: number;
  };
  complaint: {
    resolutionTimeliness: number;
    totalComplaints: number;
    resolvedComplaints: number;
    recurringComplaintRate: number;
    capaLinkedRate: number;
  };
  calibration: {
    onTimeCalibrationRate: number;
    totalAssets: number;
    overdueAssetCount: number;
    outOfToleranceRate: number;
    calibratedThisMonth: number;
  };
  maintenance: {
    onTimeCompletionRate: number;
    equipmentUptime: number;
    overdueMaintenanceCount: number;
    totalEquipment: number;
    meanTimeBetweenFailures: number;
  };
  document: {
    targetCompliance: number;
    totalDocuments: number;
    pendingApproval: number;
    averageApprovalTime: number;
  };
}

// Single unified API call
function useUnifiedKPIData() {
  return useQuery<UnifiedKPIData>({
    queryKey: ['/api/kpi-analytics/unified-dashboard'],
    refetchInterval: 30000,
    retry: 1,
    staleTime: 15000,
  });
}

// Performance status calculator
function getPerformanceStatus(value: number, target: number): 'excellent' | 'good' | 'warning' | 'critical' {
  const percentage = (value / target) * 100;
  if (percentage >= 95) return 'excellent';
  if (percentage >= 85) return 'good';
  if (percentage >= 70) return 'warning';
  return 'critical';
}

// Status colors
function getStatusColor(status: string): string {
  switch (status) {
    case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

// Primary KPI Metrics Card
function PrimaryKPIMetrics({ data }: { data: UnifiedKPIData }) {
  const systemHealth = Math.round(
    (data.capa.onTimeCompletionRate + 
     data.supplier.onTimeEvaluationRate + 
     data.complaint.resolutionTimeliness + 
     data.calibration.onTimeCalibrationRate + 
     data.maintenance.onTimeCompletionRate + 
     data.document.targetCompliance) / 6
  );

  const totalIssues = data.capa.totalCapas + data.complaint.totalComplaints;
  const criticalItems = data.supplier.criticalSuppliers + data.calibration.overdueAssetCount + data.maintenance.overdueMaintenanceCount;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-blue-600" />
          System Performance Overview
        </CardTitle>
        <CardDescription>Consolidated quality management metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{systemHealth}%</div>
            <div className="text-sm text-gray-600 mb-2">Overall System Health</div>
            <Progress value={systemHealth} className="h-2" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 mb-1">{totalIssues}</div>
            <div className="text-sm text-gray-600 mb-2">Active Issues</div>
            <div className="text-xs text-gray-500">CAPA + Complaints</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-1">{criticalItems}</div>
            <div className="text-sm text-gray-600 mb-2">Critical Items</div>
            <div className="text-xs text-gray-500">Requiring immediate attention</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Modular KPI Cards
function ModularKPICards({ data }: { data: UnifiedKPIData }) {
  const modules = [
    {
      title: 'CAPA Management',
      icon: CheckCircle,
      color: 'blue',
      primaryMetric: data.capa.onTimeCompletionRate,
      primaryLabel: 'On-Time Completion',
      secondaryMetrics: [
        { label: 'Total CAPAs', value: data.capa.totalCapas },
        { label: 'Backlog', value: data.capa.backlogCount },
        { label: 'Avg Closure Time', value: `${data.capa.averageClosureTime}d` }
      ]
    },
    {
      title: 'Supplier Management',
      icon: Factory,
      color: 'purple',
      primaryMetric: data.supplier.onTimeEvaluationRate,
      primaryLabel: 'On-Time Evaluation',
      secondaryMetrics: [
        { label: 'Total Suppliers', value: data.supplier.totalSuppliers },
        { label: 'Critical', value: data.supplier.criticalSuppliers },
        { label: 'NC Rate', value: `${data.supplier.supplierNCRate}%` }
      ]
    },
    {
      title: 'Complaint Management',
      icon: AlertTriangle,
      color: 'red',
      primaryMetric: data.complaint.resolutionTimeliness,
      primaryLabel: 'Resolution Timeliness',
      secondaryMetrics: [
        { label: 'Total Complaints', value: data.complaint.totalComplaints },
        { label: 'Resolved', value: data.complaint.resolvedComplaints },
        { label: 'CAPA-Linked', value: `${data.complaint.capaLinkedRate}%` }
      ]
    },
    {
      title: 'Calibration Management',
      icon: Settings,
      color: 'green',
      primaryMetric: data.calibration.onTimeCalibrationRate,
      primaryLabel: 'On-Time Calibration',
      secondaryMetrics: [
        { label: 'Total Assets', value: data.calibration.totalAssets },
        { label: 'Overdue', value: data.calibration.overdueAssetCount },
        { label: 'Out of Tolerance', value: `${data.calibration.outOfToleranceRate}%` }
      ]
    },
    {
      title: 'Maintenance Management',
      icon: Wrench,
      color: 'indigo',
      primaryMetric: data.maintenance.onTimeCompletionRate,
      primaryLabel: 'On-Time Completion',
      secondaryMetrics: [
        { label: 'Equipment Uptime', value: `${data.maintenance.equipmentUptime}%` },
        { label: 'Overdue Items', value: data.maintenance.overdueMaintenanceCount },
        { label: 'MTBF', value: `${data.maintenance.meanTimeBetweenFailures}h` }
      ]
    },
    {
      title: 'Document Control',
      icon: FileText,
      color: 'teal',
      primaryMetric: data.document.targetCompliance,
      primaryLabel: 'Target Compliance',
      secondaryMetrics: [
        { label: 'Total Documents', value: data.document.totalDocuments },
        { label: 'Pending Approval', value: data.document.pendingApproval },
        { label: 'Avg Approval Time', value: `${data.document.averageApprovalTime}d` }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map((module, index) => {
        const Icon = module.icon;
        const status = getPerformanceStatus(module.primaryMetric, 90);
        
        return (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className={`h-5 w-5 text-${module.color}-600`} />
                {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{module.primaryLabel}</span>
                  <Badge className={getStatusColor(status)}>
                    {module.primaryMetric.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={module.primaryMetric} className="h-2" />
                
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {module.secondaryMetrics.map((metric, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm font-semibold text-gray-800">{metric.value}</div>
                      <div className="text-xs text-gray-500">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Critical Items Alert
function CriticalItemsAlert({ data }: { data: UnifiedKPIData }) {
  const criticalItems = [
    ...(data.capa.backlogCount > 0 ? [{ type: 'CAPA', count: data.capa.backlogCount, description: 'overdue CAPAs' }] : []),
    ...(data.supplier.criticalSuppliers > 0 ? [{ type: 'Supplier', count: data.supplier.criticalSuppliers, description: 'critical suppliers' }] : []),
    ...(data.calibration.overdueAssetCount > 0 ? [{ type: 'Calibration', count: data.calibration.overdueAssetCount, description: 'overdue calibrations' }] : []),
    ...(data.maintenance.overdueMaintenanceCount > 0 ? [{ type: 'Maintenance', count: data.maintenance.overdueMaintenanceCount, description: 'overdue maintenance' }] : []),
    ...(data.document.pendingApproval > 0 ? [{ type: 'Document', count: data.document.pendingApproval, description: 'pending approvals' }] : [])
  ];

  if (criticalItems.length === 0) {
    return (
      <Card className="border-0 shadow-md bg-green-50">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <div className="font-semibold text-green-800">All Systems Operational</div>
            <div className="text-sm text-green-600">No critical items requiring immediate attention</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Critical Items Requiring Attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {criticalItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
              <span className="text-sm font-medium text-red-800">{item.type}</span>
              <span className="text-sm text-red-600">{item.count} {item.description}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Unified Dashboard Component
export function UnifiedKPIDashboard() {
  const { data, isLoading, error } = useUnifiedKPIData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse" />
              Loading Quality Management KPIs...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            KPI Data Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Unable to load quality management KPIs. Please check system connectivity.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PrimaryKPIMetrics data={data} />
      <CriticalItemsAlert data={data} />
      <ModularKPICards data={data} />
    </div>
  );
}