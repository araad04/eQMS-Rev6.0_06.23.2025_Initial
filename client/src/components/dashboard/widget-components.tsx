import { StatusCard } from "@/components/dashboard/status-card";
import { MetricsPulse } from "@/components/dashboard/metrics-pulse";
import { QuantumPulse } from "@/components/ui/quantum-pulse";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Calendar, 
  BarChart2,
  Factory,
  Microscope,
  Settings,
  Zap
} from "lucide-react";

interface DashboardData {
  documentCount: number;
  openCapaCount: number;
  trainingComplianceRate: number;
  upcomingAuditCount: number;
  customerFeedbackCount: number;
  complaintCount: number;
  calibrationAssetsCount: number;
  batchCount: number;
  nonconformingProductCount: number;
  designProjectCount: number;
  designChangeCount: number;
}

// Document Control Widget
export function DocumentControlWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  return (
    <StatusCard
      title="Document Control"
      value={isLoading ? "..." : `${dashboardData?.documentCount || 0}`}
      icon={<CheckCircle className="h-6 w-6 text-green-600" />}
      iconBgColor="bg-green-600 bg-opacity-10"
      link={{
        text: "View all documents",
        href: "/document-control"
      }}
    />
  );
}

// CAPA Management Widget
export function CapaWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  return (
    <StatusCard
      title="Open CAPA Items"
      value={isLoading ? "..." : `${dashboardData?.openCapaCount || 0}`}
      icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />}
      iconBgColor="bg-yellow-500 bg-opacity-10"
      link={{
        text: "View CAPA details",
        href: "/capa-management"
      }}
    />
  );
}

// Training Compliance Widget
export function TrainingWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  return (
    <StatusCard
      title="Training Compliance"
      value={isLoading ? "..." : `${dashboardData?.trainingComplianceRate || 0}%`}
      icon={<BookOpen className="h-6 w-6 text-blue-500" />}
      iconBgColor="bg-blue-500 bg-opacity-10"
      link={{
        text: "View training records",
        href: "/training-records"
      }}
    />
  );
}

// Audit Management Widget
export function AuditWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  return (
    <StatusCard
      title="Upcoming Audits"
      value={isLoading ? "..." : `${dashboardData?.upcomingAuditCount || 0}`}
      icon={<Calendar className="h-6 w-6 text-primary" />}
      iconBgColor="bg-primary bg-opacity-10"
      link={{
        text: "View audit schedule",
        href: "/audit-management"
      }}
    />
  );
}

// Production Metrics Widget
export function ProductionWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">{isLoading ? "..." : dashboardData?.batchCount || 0}</div>
        <div className="text-sm text-muted-foreground">Production Batches</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-500">{isLoading ? "..." : dashboardData?.nonconformingProductCount || 0}</div>
        <div className="text-sm text-muted-foreground">Nonconforming</div>
      </div>
    </div>
  );
}

// Quality Pulse Widget - Simplified status overview
export function QualityPulseWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            System Activity Pulse
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
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-4 w-4 text-blue-500" />
          System Activity Pulse
        </CardTitle>
        <CardDescription className="text-xs">Active system components overview</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* System Health Overview */}
          <div className="text-center">
            <QuantumPulse 
              intensity={5} 
              size="sm" 
              color="#10B981" 
              pulseColor="#A7F3D0" 
              className="mb-1 mx-auto scale-75"
            />
            <div className="text-lg font-bold mb-0.5">
              Active
            </div>
            <div className="text-xs text-muted-foreground">
              System Status
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{dashboardData?.documentCount || 0}</div>
              <div className="text-xs text-gray-600">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">{dashboardData?.batchCount || 0}</div>
              <div className="text-xs text-gray-600">Batches</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-purple-600">{dashboardData?.openCapaCount || 0}</div>
              <div className="text-xs text-gray-600">CAPAs</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">{dashboardData?.upcomingAuditCount || 0}</div>
              <div className="text-xs text-gray-600">Audits</div>
            </div>
          </div>

          {/* Live Status */}
          <div className="flex justify-center items-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Measurement & Analysis Widget
export function MeasurementWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-xl font-bold text-blue-600">{isLoading ? "..." : dashboardData?.customerFeedbackCount || 0}</div>
        <div className="text-xs text-muted-foreground">Customer Feedback</div>
      </div>
      <div>
        <div className="text-xl font-bold text-red-600">{isLoading ? "..." : dashboardData?.complaintCount || 0}</div>
        <div className="text-xs text-muted-foreground">Complaints</div>
      </div>
      <div>
        <div className="text-xl font-bold text-green-600">{isLoading ? "..." : dashboardData?.calibrationAssetsCount || 0}</div>
        <div className="text-xs text-muted-foreground">Calibration Assets</div>
      </div>
    </div>
  );
}

// Design Control Widget
export function DesignControlWidget() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold">{isLoading ? "..." : dashboardData?.designProjectCount || 0}</div>
        <div className="text-sm text-muted-foreground">Design Projects</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-500">{isLoading ? "..." : dashboardData?.designChangeCount || 0}</div>
        <div className="text-sm text-muted-foreground">Design Changes</div>
      </div>
    </div>
  );
}