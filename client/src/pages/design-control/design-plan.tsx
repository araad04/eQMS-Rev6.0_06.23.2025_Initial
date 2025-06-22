import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Target,
  Settings
} from "lucide-react";

export default function DesignPlanPage() {
  const designPlan = {
    projectId: "DP-2025-001",
    title: "Cleanroom Environmental Control System",
    status: "In Progress",
    phases: [
      {
        id: 1,
        name: "Design Input Collection",
        status: "Completed",
        progress: 100,
        startDate: "2025-01-15",
        endDate: "2025-02-15"
      },
      {
        id: 2,
        name: "Design Development",
        status: "In Progress",
        progress: 65,
        startDate: "2025-02-01",
        endDate: "2025-04-01"
      },
      {
        id: 3,
        name: "Design Verification",
        status: "Pending",
        progress: 0,
        startDate: "2025-03-15",
        endDate: "2025-05-15"
      },
      {
        id: 4,
        name: "Design Validation",
        status: "Pending",
        progress: 0,
        startDate: "2025-05-01",
        endDate: "2025-06-30"
      }
    ],
    deliverables: [
      { name: "Design Requirements Document", status: "Completed" },
      { name: "Design Specifications", status: "In Progress" },
      { name: "Risk Analysis (DFMEA)", status: "In Progress" },
      { name: "Verification Plan", status: "Draft" },
      { name: "Validation Plan", status: "Not Started" }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "Completed": "default",
      "In Progress": "secondary",
      "Pending": "outline",
      "Not Started": "outline",
      "Draft": "secondary"
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design Plan</h1>
          <p className="text-muted-foreground">
            ISO 13485:7.3.2 Design and Development Planning
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Phase</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Phase 2</div>
            <p className="text-xs text-muted-foreground">Design Development</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Assigned Personnel</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="phases" className="w-full">
        <TabsList>
          <TabsTrigger value="phases">Design Phases</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Design Development Phases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {designPlan.phases.map((phase) => (
                  <div key={phase.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    {getStatusIcon(phase.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{phase.name}</h3>
                        {getStatusBadge(phase.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {phase.startDate} - {phase.endDate}
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${phase.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {phase.progress}% Complete
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Design Deliverables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {designPlan.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{deliverable.name}</span>
                    </div>
                    {getStatusBadge(deliverable.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2" />
                  <p>Interactive timeline view coming soon</p>
                  <p className="text-sm">This will show Gantt chart visualization of project phases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}