
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  FolderOpen, 
  Plus, 
  Settings, 
  FileText, 
  CheckCircle, 
  Clock,
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react';

export default function DesignControlIndex() {
  const [, setLocation] = useLocation();

  // Fetch all design projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/design-projects'],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'planning': { label: 'Planning', variant: 'secondary' as const },
      'in_progress': { label: 'In Progress', variant: 'default' as const },
      'completed': { label: 'Completed', variant: 'default' as const },
      'on_hold': { label: 'On Hold', variant: 'secondary' as const }
    };
    
    const config = statusConfig[status] || statusConfig['planning'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading design projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Design Control Projects</h1>
          <p className="text-muted-foreground">
            Unified project-based design control with all phases accessible from within each project
          </p>
        </div>
        <Button onClick={() => setLocation('/design-control/create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setLocation(`/design-control/project/${project.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {project.projectCode}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center justify-between">
                  {getStatusBadge(project.status)}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Phase Progress Indicators */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Design Phases</span>
                    <span className="text-xs text-muted-foreground">
                      {project.overallProgress || 0}% complete
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-1">
                    {[
                      { name: 'Plan', status: project.phaseStatus?.planning || 'not_started' },
                      { name: 'Input', status: project.phaseStatus?.inputs || 'not_started' },
                      { name: 'Output', status: project.phaseStatus?.outputs || 'not_started' },
                      { name: 'V&V', status: project.phaseStatus?.verification || 'not_started' },
                      { name: 'Valid', status: project.phaseStatus?.validation || 'not_started' },
                      { name: 'Transfer', status: project.phaseStatus?.transfer || 'not_started' }
                    ].map((phase, index) => (
                      <div key={index} className="text-center">
                        <div className={`w-full h-2 rounded-full mb-1 ${
                          phase.status === 'completed' || phase.status === 'approved' 
                            ? 'bg-green-500' 
                            : phase.status === 'in_progress'
                            ? 'bg-blue-500'
                            : phase.status === 'review_pending'
                            ? 'bg-yellow-500'
                            : 'bg-gray-200'
                        }`} />
                        <span className="text-xs text-muted-foreground">{phase.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/design-control/project/${project.id}`);
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Phases
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/design-control/dynamic-traceability?project=${project.id}`);
                    }}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Design Projects</h3>
            <p className="text-muted-foreground mb-6">
              Create your first design control project to get started with phase-gated development
            </p>
            <Button onClick={() => setLocation('/design-control/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Panel */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Design Control Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => setLocation('/design-control/enhanced-design-control')}
            >
              <Settings className="h-6 w-6 mb-2" />
              Enhanced Controls
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => setLocation('/design-control/dynamic-traceability')}
            >
              <CheckCircle className="h-6 w-6 mb-2" />
              Traceability Matrix
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => setLocation('/design-control/history-file')}
            >
              <FileText className="h-6 w-6 mb-2" />
              Design History File
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => setLocation('/design-control/phase-gate-reviews')}
            >
              <Users className="h-6 w-6 mb-2" />
              Phase Gate Reviews
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={() => navigate(module.path)}
                  className="w-full"
                  variant={module.title === "Enhanced Steering Module" ? "default" : "outline"}
                >
                  {module.title === "Enhanced Steering Module" ? "Launch Steering Module" : `Open ${module.title}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Enhanced Steering Module</h3>
        <p className="text-blue-800 mb-4">
          The new Enhanced Steering Module provides comprehensive control over the design process with:
        </p>
        <ul className="text-blue-800 space-y-2">
          <li>• <strong>URS Integration:</strong> Sub-module for User Requirements Specification management</li>
          <li>• <strong>Phase Gate Controls:</strong> Bottleneck management and approval workflows</li>
          <li>• <strong>Complete Traceability:</strong> URS → Inputs → Outputs → Verification → Validation chain</li>
          <li>• <strong>PDF Generation:</strong> Automated documentation for audit purposes</li>
          <li>• <strong>Real-time Steering:</strong> Dashboard with bottleneck alerts and resolution tools</li>
        </ul>
        <Button 
          onClick={() => navigate("/design-control/enhanced-steering")}
          className="mt-4"
          size="lg"
        >
          <Target className="mr-2 h-5 w-5" />
          Launch Enhanced Steering Module
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  ArrowUpRight, 
  PlusCircle, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  BarChart, 
  Info,
  Users,
  Calendar,
  Folder,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'wouter';

type DesignProject = {
  id: string;
  projectCode: string;
  title: string;
  description: string;
  projectType: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Review' | 'Completed' | 'Cancelled';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  responsiblePerson: string;
  projectManager?: string;
  qualityLead?: string;
  startDate: string;
  targetCompletionDate: string;
  currentPhase: string;
  overallProgress: number;
  phaseStatus: {
    inputs: 'Not Started' | 'In Progress' | 'Review' | 'Completed';
    outputs: 'Not Started' | 'In Progress' | 'Review' | 'Completed';
    verification: 'Not Started' | 'In Progress' | 'Review' | 'Completed';
    validation: 'Not Started' | 'In Progress' | 'Review' | 'Completed';
    transfer: 'Not Started' | 'In Progress' | 'Review' | 'Completed';
  };
  lastActivity: string;
  createdDate: string;
};

const DesignControlPage = () => {
  const [, navigateTo] = useLocation();
  const [activeTab, setActiveTab] = useState('active');

  const { data: projects = [], isLoading, error } = useQuery<DesignProject[]>({
    queryKey: ['/api/design-projects-flow'],
    staleTime: 30000
  });

  const handleProjectSelect = (project: DesignProject) => {
    navigateTo(`/design-control/project/${project.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Clock className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading design control projects...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Projects</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            There was an error loading the design control projects. Please try again.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'Planning');
  const completedProjects = projects.filter(p => p.status === 'Completed');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Design Control</h1>
          <p className="text-muted-foreground mt-2">
            ISO 13485:2016 compliant design control workflow management
          </p>
        </div>
        <Button onClick={() => navigateTo('/design-control/project/create')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
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
              {projects.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="software">Software Lifecycle</TabsTrigger>
          <TabsTrigger value="matrix">Design Matrix</TabsTrigger>
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Folder className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Create your first design control project to begin the ISO 13485:2016 compliant development workflow.
                </p>
                <Button onClick={() => navigateTo('/design-control/project/create')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {project.projectCode}
                      </Badge>
                      <Badge 
                        className={
                          project.status === 'Active' ? 'bg-green-100 text-green-800' :
                          project.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Phase:</span>
                        <span className="font-medium">{project.currentPhase}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">{project.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${project.overallProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <Badge 
                          variant="outline"
                          className={
                            project.riskLevel === 'Critical' ? 'border-red-500 text-red-700' :
                            project.riskLevel === 'High' ? 'border-orange-500 text-orange-700' :
                            project.riskLevel === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-green-500 text-green-700'
                          }
                        >
                          {project.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => handleProjectSelect(project)}
                    >
                      View Project
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <FileCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Completed Projects</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                View and manage completed design control projects and their final documentation.
              </p>
              <Button variant="outline">
                View Completed Projects
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="software" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                IEC 62304 Software Lifecycle Management
              </CardTitle>
              <CardDescription>
                Comprehensive software safety classification, risk analysis, and lifecycle management for medical device software
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Software Projects</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first IEC 62304 compliant software project with automatic project code generation.
                </p>
                <Button onClick={() => navigateTo('/design-control/software-project-create')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Software Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Design Matrix
              </CardTitle>
              <CardDescription>
                View design input-output traceability matrix and requirement relationships across all projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Design Matrix</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Track traceability between design inputs, outputs, verification, and validation activities.
                </p>
                <Button variant="outline">
                  View Design Matrix
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Risk Management
              </CardTitle>
              <CardDescription>
                Monitor and manage design control risks across all active projects and phases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Comprehensive risk analysis and mitigation tracking for all design projects.
                </p>
                <Button variant="outline">
                  View Risk Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignControlPage;