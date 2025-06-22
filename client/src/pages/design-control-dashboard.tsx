import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  BookOpen,
  Settings,
  Upload,
  Download,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  Users,
  Trash2
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Design project interface
interface DesignProject {
  id: number;
  projectCode: string;
  title: string;
  projectTypeId: number;
  description: string;
  objective: string;
  statusId: number;
  initiatedBy: number;
  responsiblePerson: number;
  startDate: string;
  targetCompletionDate: string;
  riskLevel: string;
  regulatoryImpact: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectType {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface ProjectStatus {
  id: number;
  name: string;
  description: string;
}

export default function DesignControlDashboard() {
  const [activeTab, setActiveTab] = useState("projects");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<DesignProject | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch design projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<DesignProject[]>({
    queryKey: ["/api/design-projects"],
  });

  // Fetch project types
  const { data: projectTypes = [] } = useQuery<ProjectType[]>({
    queryKey: ["/api/design-project-types"],
  });

  // Fetch project statuses
  const { data: projectStatuses = [] } = useQuery<ProjectStatus[]>({
    queryKey: ["/api/design-project-statuses"],
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/design-projects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Local": "true",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
      // Handle 204 No Content response which doesn't have a JSON body
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-projects"] });
      toast({
        title: "Project Deleted",
        description: "Design project has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.statusId.toString() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Helper functions
  const getProjectTypeName = (typeId: number) => {
    const type = projectTypes.find(t => t.id === typeId);
    return type?.name || "Unknown";
  };

  const getStatusName = (statusId: number) => {
    const status = projectStatuses.find(s => s.id === statusId);
    return status?.name || "Unknown";
  };

  const getStatusColor = (statusId: number) => {
    const statusName = getStatusName(statusId);
    switch (statusName) {
      case "Planning": return "bg-blue-500";
      case "Active": return "bg-green-500";
      case "On Hold": return "bg-yellow-500";
      case "Review": return "bg-purple-500";
      case "Completed": return "bg-emerald-500";
      case "Cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Low": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, project: DesignProject) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  // Compliance data for ISO 13485 and IEC 62304 tabs
  const complianceData = {
    iso13485: {
      "7.3.2": { name: "Planning", progress: 85, status: "active" },
      "7.3.3": { name: "Inputs", progress: 60, status: "in-progress" },
      "7.3.4": { name: "Outputs", progress: 40, status: "in-progress" },
      "7.3.5": { name: "Reviews", progress: 75, status: "active" },
      "7.3.6": { name: "Verification", progress: 30, status: "pending" },
      "7.3.7": { name: "Validation", progress: 20, status: "pending" },
      "7.3.8": { name: "Transfer", progress: 0, status: "not-started" },
      "7.3.9": { name: "Changes", progress: 90, status: "active" },
    },
    iec62304: {
      "5.1": { name: "Software Planning", progress: 80, status: "active" },
      "5.2": { name: "Software Requirements", progress: 65, status: "active" },
      "5.3": { name: "Software Architecture", progress: 45, status: "in-progress" },
      "5.6": { name: "Software Verification", progress: 25, status: "pending" },
      "5.7": { name: "Software Validation", progress: 15, status: "pending" },
      "6.1-6.2": { name: "Maintenance", progress: 95, status: "active" },
    }
  };

  const getStatusColor2 = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "in-progress": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      case "not-started": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "in-progress": return "In Progress";
      case "pending": return "Pending";
      case "not-started": return "Not Started";
      default: return "Unknown";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Design Control</h1>
          <p className="text-muted-foreground">
            ISO 13485:2016, Clause 7.3 Design and Development | IEC 62304:2006 + AMD1:2015
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/design-control/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>

        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="iso13485">ISO 13485</TabsTrigger>
          <TabsTrigger value="iec62304">IEC 62304</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Map</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => getStatusName(p.statusId) === "Active").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => getStatusName(p.statusId) === "Review").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.riskLevel === "High" || p.riskLevel === "Critical").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {projectStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsLoading ? (
              <div className="col-span-3 flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading projects...</div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground mb-4">
                  {projects.length === 0 
                    ? "Create your first design control project to get started."
                    : "No projects match your current filters."
                  }
                </p>
                {projects.length === 0 && (
                  <Link href="/design-control/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <div onClick={() => window.location.href = `/design-control/project/${project.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{project.projectCode}</CardTitle>
                        <Badge className={`text-white ${getStatusColor(project.statusId)}`}>
                          {getStatusName(project.statusId)}
                        </Badge>
                      </div>
                      <CardDescription>{getProjectTypeName(project.projectTypeId)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{project.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getRiskColor(project.riskLevel)}>
                          {project.riskLevel} Risk
                        </Badge>
                        {project.regulatoryImpact && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Regulatory Impact
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {format(new Date(project.startDate), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Target: {format(new Date(project.targetCompletionDate), "MMM dd, yyyy")}
                      </div>
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/design-control/project/${project.id}`;
                        }}>
                          View Details
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                          onClick={(e) => handleDeleteClick(e, project)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="iso13485" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">ISO + IEC combined</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Design Control Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Design Input DI-DP-2025-001-003 approved</p>
                    <p className="text-xs text-muted-foreground">2 hours ago • Project DP-2025-001</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">DFMEA document uploaded</p>
                    <p className="text-xs text-muted-foreground">4 hours ago • Project DP-2025-002</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Design review scheduled</p>
                    <p className="text-xs text-muted-foreground">6 hours ago • Project DP-2025-003</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iso13485" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                ISO 13485:2016 - Clause 7.3 Design and Development
              </CardTitle>
              <CardDescription>
                Medical devices quality management systems requirements for regulatory purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(complianceData.iso13485).map(([clause, data]) => (
                  <div key={clause} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{clause}</Badge>
                      <div>
                        <h3 className="font-medium">{data.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {clause === "7.3.2" && "Gantt View, Design Plan Upload"}
                          {clause === "7.3.3" && "Input Builder, File Upload"}
                          {clause === "7.3.4" && "Output Composer"}
                          {clause === "7.3.5" && "Collaborative Reviews with Logs"}
                          {clause === "7.3.6" && "Linked Test Evidence Upload"}
                          {clause === "7.3.7" && "Validation Protocol Upload"}
                          {clause === "7.3.8" && "Export to Production"}
                          {clause === "7.3.9" && "Impact Assessment + Change Logs"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={data.progress} />
                        <p className="text-xs text-center mt-1">{data.progress}%</p>
                      </div>
                      <Badge className={`text-white ${getStatusColor(data.status)}`}>
                        {getStatusText(data.status)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iec62304" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                IEC 62304:2006 + AMD1:2015 - Software Lifecycle
              </CardTitle>
              <CardDescription>
                Medical device software lifecycle requirements for embedded software components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(complianceData.iec62304).map(([clause, data]) => (
                  <div key={clause} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{clause}</Badge>
                      <div>
                        <h3 className="font-medium">{data.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {clause === "5.1" && "Integrated Planning Section"}
                          {clause === "5.2" && "Structured Input Capture"}
                          {clause === "5.3" && "Embedded Output Components"}
                          {clause === "5.6" && "Test Evidence Management"}
                          {clause === "5.7" && "Validation Document Linking"}
                          {clause === "6.1-6.2" && "Design Change Workflow"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={data.progress} />
                        <p className="text-xs text-center mt-1">{data.progress}%</p>
                      </div>
                      <Badge className={`text-white ${getStatusColor(data.status)}`}>
                        {getStatusText(data.status)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ISO 13485 Compliance Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>7.3.2 – Planning</span>
                    <span>Gantt View, Design Plan Upload</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>7.3.3 – Inputs</span>
                    <span>Input Builder, File Upload</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>7.3.4 – Outputs</span>
                    <span>Output Composer</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>7.3.5 – Reviews</span>
                    <span>Collaborative Reviews with Logs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>7.3.6 – Verification</span>
                    <span>Linked Test Evidence Upload</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>7.3.7 – Validation</span>
                    <span>Validation Protocol Upload</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>7.3.8 – Transfer</span>
                    <span>Export to Production</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>7.3.9 – Changes</span>
                    <span>Impact Assessment + Change Logs</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IEC 62304 Compliance Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>5.1 – Software Planning</span>
                    <span>Integrated Planning Section</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>5.2 – Software Requirements</span>
                    <span>Structured Input Capture</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>5.3 – Software Architecture</span>
                    <span>Embedded Output Components</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>5.6 – Software Verification</span>
                    <span>Test Evidence Management</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>5.7 – Software Validation</span>
                    <span>Validation Document Linking</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>6.1–6.2 – Maintenance</span>
                    <span>Design Change Workflow</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Compliance Evidence
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Compliance Report
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.title || projectToDelete?.projectCode}" ({projectToDelete?.projectCode})? 
              This action cannot be undone and will permanently remove all project data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}