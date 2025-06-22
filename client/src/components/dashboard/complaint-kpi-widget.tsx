import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, Link, TrendingUp } from "lucide-react";

interface ComplaintKPIData {
  resolutionTimeliness: number;
  recurringComplaintRate: number;
  capaLinkedRate: number;
  totalComplaints: number;
  resolvedComplaints: number;
  categoryDistribution: {
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

export function ComplaintKPIWidget() {
  const { data: complaintKPIs, isLoading, error } = useQuery<ComplaintKPIData>({
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
          <MessageSquare className="h-4 w-4" />
          Complaint Management KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resolution Timeliness */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">30-Day Resolution</span>
            <span className={`text-sm font-semibold ${getStatusColor(complaintKPIs?.resolutionTimeliness || 0, 85)}`}>
              {complaintKPIs?.resolutionTimeliness?.toFixed(1) || 0}%
            </span>
          </div>
          <Progress value={complaintKPIs?.resolutionTimeliness || 0} className="h-2" />
          <div className="text-xs text-gray-500">Target: 85%</div>
        </div>

        {/* Recurring Complaint Rate */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-gray-600">Recurring Rate</span>
          </div>
          <Badge variant={(complaintKPIs?.recurringComplaintRate || 0) <= 5 ? "default" : "destructive"}>
            {complaintKPIs?.recurringComplaintRate?.toFixed(1) || "0.0"}%
          </Badge>
        </div>

        {/* CAPA-Linked Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">CAPA-Linked</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {complaintKPIs?.capaLinkedRate?.toFixed(1) || 0}%
            </span>
          </div>
          <Progress value={complaintKPIs?.capaLinkedRate || 0} className="h-2" />
        </div>

        {/* Category Distribution */}
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Top Categories</span>
          <div className="space-y-1">
            {complaintKPIs?.categoryDistribution && Object.entries(complaintKPIs.categoryDistribution)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between text-xs">
                  <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
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