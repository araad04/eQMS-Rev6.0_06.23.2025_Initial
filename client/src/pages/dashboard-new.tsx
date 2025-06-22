import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { DraggableDashboard } from "@/components/dashboard/draggable-dashboard";
import { 
  DocumentControlWidget,
  CapaWidget,
  TrainingWidget,
  AuditWidget,
  ProductionWidget,
  QualityPulseWidget,
  MeasurementWidget,
  DesignControlWidget
} from "@/components/dashboard/widget-components";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DocumentTable } from "@/components/dashboard/document-table";
import { 
  Plus, 
  Filter
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

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: 1,
  });

  // Define dashboard widgets with proper configuration
  const dashboardWidgets = [
    {
      id: "document-control",
      type: "metric",
      title: "Document Control",
      component: DocumentControlWidget,
      visible: true,
      position: 0
    },
    {
      id: "capa-management",
      type: "metric", 
      title: "CAPA Management",
      component: CapaWidget,
      visible: true,
      position: 1
    },
    {
      id: "training-compliance",
      type: "metric",
      title: "Training Compliance", 
      component: TrainingWidget,
      visible: true,
      position: 2
    },
    {
      id: "audit-management",
      type: "metric",
      title: "Audit Management",
      component: AuditWidget,
      visible: true,
      position: 3
    },
    {
      id: "production-metrics",
      type: "metric",
      title: "Production Metrics",
      component: ProductionWidget,
      visible: true,
      position: 4
    },
    {
      id: "quality-pulse",
      type: "visualization",
      title: "Quality Metrics Pulse",
      component: QualityPulseWidget,
      visible: true,
      position: 5
    },
    {
      id: "measurement-analysis",
      type: "metric",
      title: "Measurement & Analysis",
      component: MeasurementWidget,
      visible: true,
      position: 6
    },
    {
      id: "design-control",
      type: "metric",
      title: "Design Control",
      component: DesignControlWidget,
      visible: true,
      position: 7
    }
  ];

  return (
    <>
      <PageHeader 
        title="Quality & Production Dashboard"
        description="Intelligent dashboard with drag-and-drop widget management"
        actions={[
          {
            label: "New Document",
            href: "/document-control/create",
            icon: <Plus className="h-5 w-5" />,
          },
          {
            label: "Filter",
            icon: <Filter className="h-5 w-5 text-neutral-500" />,
            variant: "outline",
          },
        ]}
      />
      
      <div className="px-6 py-8">
        {/* Draggable Dashboard with Widget Management */}
        <DraggableDashboard 
          widgets={dashboardWidgets}
          onLayoutChange={(updatedWidgets) => {
            console.log("Dashboard layout changed:", updatedWidgets);
          }}
        />
        
        {/* Static sections that remain below the widgets */}
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Document Approvals */}
            <PendingApprovals />
            
            {/* Recent Quality Activities */}
            <ActivityFeed />
          </div>
          
          {/* Document Tracking */}
          <DocumentTable />
        </div>
      </div>
    </>
  );
}