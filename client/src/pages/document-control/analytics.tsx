import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface DocumentAnalytics {
  totalDocuments: number;
  pendingApproval: number;
  averageApprovalTime: number;
  documentsWithinTarget: number;
  documentsOverTarget: number;
  targetCompliance: number;
  approvalTrends: Array<{
    month: string;
    averageDays: number;
    target: number;
    volume: number;
  }>;
  departmentPerformance: Array<{
    department: string;
    avgApprovalTime: number;
    compliance: number;
    volume: number;
  }>;
  documentTypeAnalysis: Array<{
    type: string;
    avgApprovalTime: number;
    count: number;
    compliance: number;
  }>;
  criticalDocuments: Array<{
    id: number;
    documentNumber: string;
    title: string;
    daysPending: number;
    riskLevel: string;
  }>;
}

export default function DocumentControlAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  // Fetch document analytics
  const { data: analytics, isLoading } = useQuery<DocumentAnalytics>({
    queryKey: ["/api/iso13485-documents/analytics", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/iso13485-documents/analytics?period=${selectedPeriod}`, {
        headers: {
          'X-Auth-Local': 'true',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Calculate KPI status
  const getComplianceStatus = (compliance: number) => {
    if (compliance >= 90) return { status: "excellent", color: "bg-green-500", label: "Excellent" };
    if (compliance >= 75) return { status: "good", color: "bg-blue-500", label: "Good" };
    if (compliance >= 60) return { status: "warning", color: "bg-yellow-500", label: "Needs Attention" };
    return { status: "critical", color: "bg-red-500", label: "Critical" };
  };

  const getRiskLevel = (days: number) => {
    if (days <= 5) return { level: "Low", color: "text-green-600", bg: "bg-green-100" };
    if (days <= 8) return { level: "Medium", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "High", color: "text-red-600", bg: "bg-red-100" };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return <div>No analytics data available</div>;

  const complianceStatus = getComplianceStatus(analytics.targetCompliance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Control KPIs</h1>
          <p className="text-muted-foreground">Tracking approval times against 10-day target</p>
        </div>
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg Approval Time</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{analytics.averageApprovalTime.toFixed(1)} days</p>
                  <Badge variant={analytics.averageApprovalTime <= 10 ? "default" : "destructive"}>
                    {analytics.averageApprovalTime <= 10 ? "Within Target" : "Over Target"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Target Compliance</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{analytics.targetCompliance.toFixed(1)}%</p>
                  <Badge className={complianceStatus.color}>
                    {complianceStatus.label}
                  </Badge>
                </div>
                <Progress value={analytics.targetCompliance} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{analytics.pendingApproval}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.documentsOverTarget} over target
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{analytics.totalDocuments}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.documentsWithinTarget} within target
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Approval Trends</TabsTrigger>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
          <TabsTrigger value="types">Document Types</TabsTrigger>
          <TabsTrigger value="critical">Critical Items</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Time Trends</CardTitle>
              <CardDescription>Monthly average approval times vs 10-day target</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.approvalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="averageDays" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Avg Approval Time"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#ff7300" 
                    strokeDasharray="5 5"
                    name="Target (10 days)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Document Volume</CardTitle>
              <CardDescription>Number of documents processed each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.approvalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#82ca9d" name="Documents Processed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Average approval times and compliance by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.departmentPerformance.map((dept) => {
                  const deptStatus = getComplianceStatus(dept.compliance);
                  return (
                    <div key={dept.department} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{dept.department}</h4>
                        <p className="text-sm text-muted-foreground">{dept.volume} documents</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">{dept.avgApprovalTime.toFixed(1)} days</p>
                          <p className="text-xs text-muted-foreground">Avg Time</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{dept.compliance.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Compliance</p>
                        </div>
                        <Badge className={deptStatus.color}>{deptStatus.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Type Analysis</CardTitle>
              <CardDescription>Performance metrics by document type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.documentTypeAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="avgApprovalTime" fill="#8884d8" name="Avg Approval Time" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.documentTypeAnalysis.map((type) => {
              const typeStatus = getComplianceStatus(type.compliance);
              return (
                <Card key={type.type}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{type.type}</h4>
                      <Badge className={typeStatus.color}>{typeStatus.label}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="font-medium">{type.avgApprovalTime.toFixed(1)} days</p>
                        <p className="text-muted-foreground">Avg Time</p>
                      </div>
                      <div>
                        <p className="font-medium">{type.count}</p>
                        <p className="text-muted-foreground">Count</p>
                      </div>
                      <div>
                        <p className="font-medium">{type.compliance.toFixed(1)}%</p>
                        <p className="text-muted-foreground">Compliance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Documents</CardTitle>
              <CardDescription>Documents requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.criticalDocuments.map((doc) => {
                  const risk = getRiskLevel(doc.daysPending);
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">{doc.documentNumber}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">{doc.daysPending} days</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <Badge className={`${risk.bg} ${risk.color} border-0`}>
                          {risk.level} Risk
                        </Badge>
                        {doc.daysPending > 10 && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {analytics.criticalDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">No Critical Documents</p>
                    <p className="text-muted-foreground">All documents are within acceptable timeframes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}