import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Upload, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Filter,
  Download,
  BarChart3,
  Target,
  BookOpen,
  Shield,
  Eye,
  CheckSquare,
  ArrowRight,
  BarChart2,
  Settings,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DesignProject {
  id: number;
  projectCode: string;
  title: string;
  description: string;
  objective: string;
  riskLevel: string;
  riskClass?: string;
  regulatoryPathway?: string;
  hasSoftwareComponent: boolean;
  softwareClassification?: string;
  overallProgress: number;
  status: {
    id: number;
    name: string;
    description: string;
  };
  projectType: {
    id: number;
    name: string;
    code: string;
    requiresSoftwareLifecycle: boolean;
  };
  responsiblePerson: {
    id: number;
    firstName: string;
    lastName: string;
  };
  projectManager?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  createdAt: string;
}

interface ProjectPhase {
  id: number;
  name: string;
  description: string;
  orderIndex: number;
  isGate: boolean;
  isoClause?: string;
  iecClause?: string;
  status: string;
  completionPercentage: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
}

const DesignControlFlow: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState<'overview' | 'projects' | 'gantt' | 'compliance'>('overview');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Fetch design projects with flow-based structure
  const { data: projects = [], isLoading: projectsLoading } = useQuery<DesignProject[]>({
    queryKey: ['/api/design-projects-flow'],
    queryFn: async () => {
      const response = await fetch('/api/design-projects-flow', {
        headers: {
          'X-Auth-Local': 'true',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch project phases for selected project
  const { data: projectPhases = [], isLoading: phasesLoading } = useQuery<ProjectPhase[]>({
    queryKey: ['/api/design-project-phases', selectedProject],
    queryFn: async () => {
      const response = await fetch(`/api/design-project-phases/${selectedProject}`, {
        headers: {
          'X-Auth-Local': 'true',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch project phases');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedProject,
  });

  // Fetch compliance mapping
  const { data: complianceMapping = {} } = useQuery({
    queryKey: ['/api/design-compliance-mapping'],
    queryFn: async () => {
      const response = await fetch('/api/design-compliance-mapping', {
        headers: {
          'X-Auth-Local': 'true',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch compliance mapping');
      }
      const data = await response.json();
      return data || {};
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await fetch('/api/design-projects-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-projects-flow'] });
      toast({
        title: "Project Created",
        description: "Design control project created successfully with ISO 13485:7.3 compliance framework.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create design control project.",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await fetch(`/api/design-projects-flow/${projectId}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Local': 'true',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-projects-flow'] });
      toast({
        title: "Project Deleted",
        description: "Design control project has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete design control project.",
        variant: "destructive",
      });
    },
  });

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-purple-100 text-purple-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isManager = user?.role === 'admin' || user?.role === 'manager';

  if (projectsLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading design control projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Design Control</h1>
          <p className="text-muted-foreground mt-1">
            ISO 13485:7.3 & IEC 62304 Flow-Based Project Management
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              ISO 13485:7.3.2-7.3.9
            </Badge>
            <Badge variant="outline" className="text-xs">
              IEC 62304:5.1-6.2
            </Badge>
          </div>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => {
                // Navigate to create project page
                window.location.href = '/design-control-flow/create';
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gantt View
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter((p: DesignProject) => p.status.name === 'Active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{projects.filter((p: DesignProject) => p.status.name === 'Planning').length} in planning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Software Projects</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter((p: DesignProject) => p.hasSoftwareComponent).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  IEC 62304 compliance required
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter((p: DesignProject) => p.riskLevel === 'High' || p.riskLevel === 'Critical').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enhanced controls required
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.length > 0 ? Math.round(projects.reduce((acc: number, p: DesignProject) => acc + p.overallProgress, 0) / projects.length) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all active projects
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Latest design control projects with phase status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 5).map((project: DesignProject) => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.projectCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getRiskLevelColor(project.riskLevel)}>
                        {project.riskLevel}
                      </Badge>
                      <Badge className={getStatusColor(project.status.name)}>
                        {project.status.name}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">{project.overallProgress}%</p>
                        <Progress value={project.overallProgress} className="w-16 h-2" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-4">
            {projects.map((project: DesignProject) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {project.title}
                        {project.hasSoftwareComponent && (
                          <Badge variant="outline" className="text-xs">
                            <Settings className="h-3 w-3 mr-1" />
                            IEC 62304
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {project.projectCode} • {project.projectType.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(project.status.name)}>
                          {project.status.name}
                        </Badge>
                        <Badge className={getRiskLevelColor(project.riskLevel)}>
                          {project.riskLevel} Risk
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Design Project</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{project.title}"? This action cannot be undone.
                                  All project data, phases, tasks, and documentation will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProjectMutation.mutate(project.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Project
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Responsible Person</p>
                        <p className="text-muted-foreground">
                          {project.responsiblePerson.firstName} {project.responsiblePerson.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Target Completion</p>
                        <p className="text-muted-foreground">
                          {new Date(project.targetCompletionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Progress</p>
                        <div className="flex items-center gap-2">
                          <Progress value={project.overallProgress} className="flex-1" />
                          <span className="text-xs">{project.overallProgress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Design Inputs",
                              description: `Opening design inputs for ${project.title}`,
                            });
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Inputs
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Design Outputs",
                              description: `Opening design outputs for ${project.title}`,
                            });
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Outputs
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Design Reviews",
                              description: `Opening design reviews for ${project.title}`,
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Reviews
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Verification & Validation",
                              description: `Opening V&V activities for ${project.title}`,
                            });
                          }}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          V&V
                        </Button>

                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedProject(project.id);
                          toast({
                            title: "Project Opened",
                            description: `Opening detailed view for ${project.title}`,
                          });
                        }}
                        size="sm"
                      >
                        Open Project
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Gantt View Tab */}
        <TabsContent value="gantt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline & Dependencies</CardTitle>
              <CardDescription>
                Gantt chart view with ISO 13485:7.3 phase gates and IEC 62304 milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Interactive Gantt Chart</h3>
                <p className="text-muted-foreground mb-4">
                  Phase-based project management with dependency tracking
                </p>
                <Button variant="outline">
                  Load Gantt View
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  ISO 13485:7.3 Compliance
                </CardTitle>
                <CardDescription>
                  Design and development requirements mapping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { clause: '7.3.2', title: 'Design Planning', status: 'implemented' },
                    { clause: '7.3.3', title: 'Design Inputs', status: 'implemented' },
                    { clause: '7.3.4', title: 'Design Outputs', status: 'implemented' },
                    { clause: '7.3.5', title: 'Design Reviews', status: 'implemented' },
                    { clause: '7.3.6', title: 'Design Verification', status: 'implemented' },
                    { clause: '7.3.7', title: 'Design Validation', status: 'implemented' },
                    { clause: '7.3.8', title: 'Design Transfer', status: 'implemented' },
                    { clause: '7.3.9', title: 'Design Changes', status: 'implemented' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{item.clause}</p>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  IEC 62304 Compliance
                </CardTitle>
                <CardDescription>
                  Software lifecycle process requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { clause: '5.1', title: 'Software Planning', status: 'implemented' },
                    { clause: '5.2', title: 'Software Requirements', status: 'implemented' },
                    { clause: '5.3', title: 'Software Architecture', status: 'implemented' },
                    { clause: '5.6', title: 'Software Verification', status: 'implemented' },
                    { clause: '5.7', title: 'Software Validation', status: 'implemented' },
                    { clause: '6.1', title: 'Problem Resolution', status: 'implemented' },
                    { clause: '6.2', title: 'Change Control', status: 'implemented' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{item.clause}</p>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignControlFlow;