import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DocumentControlKPI {
  totalDocuments: number;
  pendingApproval: number;
  averageApprovalTime: number;
  targetCompliance: number;
  documentsOverTarget: number;
  criticalDocuments: Array<{
    id: number;
    documentNumber: string;
    title: string;
    daysPending: number;
    riskLevel: string;
  }>;
}

export function DocumentControlKPIWidget() {
  const { data: kpiData, isLoading } = useQuery<DocumentControlKPI>({
    queryKey: ['/api/iso13485-documents/analytics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Control KPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpiData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Control KPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return "text-green-600";
    if (compliance >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceVariant = (compliance: number) => {
    if (compliance >= 90) return "default";
    if (compliance >= 80) return "secondary";
    return "destructive";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Control KPI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main KPI Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Avg Approval Time</span>
            </div>
            <div className="text-2xl font-bold">
              {kpiData.averageApprovalTime} days
            </div>
            <div className="text-xs text-gray-500">Target: ≤10 days</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Target Compliance</span>
            </div>
            <div className={`text-2xl font-bold ${getComplianceColor(kpiData.targetCompliance)}`}>
              {kpiData.targetCompliance}%
            </div>
            <Progress 
              value={kpiData.targetCompliance} 
              className="h-2"
            />
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-semibold">{kpiData.totalDocuments}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{kpiData.pendingApproval}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{kpiData.documentsOverTarget}</div>
            <div className="text-xs text-gray-500">Over Target</div>
          </div>
        </div>

        {/* Critical Documents Alert */}
        {kpiData.criticalDocuments && kpiData.criticalDocuments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">
                {kpiData.criticalDocuments.length} Critical Document{kpiData.criticalDocuments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1">
              {kpiData.criticalDocuments.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex justify-between items-center text-xs bg-red-50 p-2 rounded">
                  <span className="font-medium">{doc.documentNumber}</span>
                  <Badge variant="destructive" className="text-xs">
                    {doc.daysPending} days
                  </Badge>
                </div>
              ))}
              {kpiData.criticalDocuments.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{kpiData.criticalDocuments.length - 3} more critical documents
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Status */}
        <div className="pt-2 border-t">
          <Badge 
            variant={getComplianceVariant(kpiData.targetCompliance)}
            className="w-full justify-center"
          >
            {kpiData.targetCompliance >= 90 ? "Excellent Performance" :
             kpiData.targetCompliance >= 80 ? "Good Performance" :
             "Needs Improvement"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}