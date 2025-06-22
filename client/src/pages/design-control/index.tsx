
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Building2,
  Plus, 
  Search,
  Filter,
  Grid3X3, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowRight,
  User,
  FileText,
  Target,
  Layers,
  Activity,
  Settings,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface DesignProject {
  id: number;
  projectCode: string;
  title: string;
  description: string;
  status: string;
  riskLevel: string;
  responsiblePerson: string;
  createdAt: string;
  targetDate: string;
  currentPhase: string;
  overallProgress: number;
  phaseStatus: {
    planning: string;
    inputs: string;
    outputs: string;
    verification: string;
    validation: string;
    transfer: string;
  };
}

export default function DesignControlIndex() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/design-projects'],
  });

  const filteredProjects = projects?.filter((project: DesignProject) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusConfig = (status: string) => {
    const configs = {
      'planning': { label: 'Planning', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-700' },
      'in_progress': { label: 'In Progress', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
      'review': { label: 'Review', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-700' },
      'completed': { label: 'Completed', variant: 'default' as const, color: 'bg-gray-100 text-gray-700' },
      'on_hold': { label: 'On Hold', variant: 'destructive' as const, color: 'bg-red-100 text-red-700' }
    };
    return configs[status] || configs['planning'];
  };

  const getRiskConfig = (risk: string) => {
    const configs = {
      'low': { color: 'bg-green-50 text-green-600 border-green-200' },
      'medium': { color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
      'high': { color: 'bg-orange-50 text-orange-600 border-orange-200' },
      'critical': { color: 'bg-red-50 text-red-600 border-red-200' }
    };
    return configs[risk] || configs['medium'];
  };

  const getPhaseProgress = (phaseStatus: any) => {
    const phases = ['planning', 'inputs', 'outputs', 'verification', 'validation', 'transfer'];
    const completed = phases.filter(phase => 
      phaseStatus?.[phase] === 'completed' || phaseStatus?.[phase] === 'approved'
    ).length;
    return Math.round((completed / phases.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading design control projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeProjects = filteredProjects.filter(p => p.status === 'in_progress' || p.status === 'planning');
  const completedProjects = filteredProjects.filter(p => p.status === 'completed');
  const reviewProjects = filteredProjects.filter(p => p.status === 'review');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Design Control Center</h1>
                <p className="text-slate-600 mt-1">
                  Enterprise design project management with ISO 13485:7.3 compliance
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation('/design-control/create')} 
              className="bg-primary hover:bg-primary/90 shadow-lg"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Projects</p>
                  <p className="text-3xl font-bold text-slate-900">{activeProjects.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-3xl font-bold text-slate-900">{completedProjects.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">98% success rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">In Review</p>
                  <p className="text-3xl font-bold text-slate-900">{reviewProjects.length}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-yellow-600">Avg 3.2 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Progress</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {Math.round(filteredProjects.reduce((acc, p) => acc + (p.overallProgress || 0), 0) / filteredProjects.length || 0)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowRight className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-purple-600">On track</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1 min-w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search projects, codes, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200"
                  />
                </div>
                
                <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-auto">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="planning" className="text-xs">Planning</TabsTrigger>
                    <TabsTrigger value="in_progress" className="text-xs">Active</TabsTrigger>
                    <TabsTrigger value="review" className="text-xs">Review</TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Display */}
        {filteredProjects.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredProjects.map((project: DesignProject) => {
              const statusConfig = getStatusConfig(project.status);
              const riskConfig = getRiskConfig(project.riskLevel);
              const phaseProgress = getPhaseProgress(project.phaseStatus);

              return (
                <Card 
                  key={project.id} 
                  className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={() => setLocation(`/design-control/project/${project.id}`)}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60"></div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {project.projectCode}
                          </Badge>
                          <Badge className={`text-xs ${riskConfig.color} border`}>
                            {project.riskLevel?.toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                          {project.title}
                        </CardTitle>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <div className="flex items-center text-xs text-slate-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Phase Progress</span>
                        <span className="text-sm text-slate-600">{phaseProgress}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${phaseProgress}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-6 gap-1">
                        {[
                          { name: 'Plan', key: 'planning' },
                          { name: 'Input', key: 'inputs' },
                          { name: 'Output', key: 'outputs' },
                          { name: 'V&V', key: 'verification' },
                          { name: 'Valid', key: 'validation' },
                          { name: 'Transfer', key: 'transfer' }
                        ].map((phase, index) => {
                          const status = project.phaseStatus?.[phase.key] || 'not_started';
                          return (
                            <div key={index} className="text-center">
                              <div className={`w-full h-1.5 rounded-full mb-1 ${
                                status === 'completed' || status === 'approved' 
                                  ? 'bg-green-500' 
                                  : status === 'in_progress'
                                  ? 'bg-blue-500'
                                  : status === 'review_pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-slate-200'
                              }`} />
                              <span className="text-xs text-slate-500">{phase.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center text-xs text-slate-500">
                        <User className="h-3 w-3 mr-1" />
                        {project.responsiblePerson}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/design-control/project/${project.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/design-control/dynamic-traceability?project=${project.id}`);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white shadow-lg border-0 text-center py-16">
            <CardContent>
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || selectedStatus !== 'all' ? 'No matching projects' : 'No design projects'}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Try adjusting your search criteria or filters'
                  : 'Create your first design control project to get started with phase-gated development'
                }
              </p>
              {!searchTerm && selectedStatus === 'all' && (
                <Button onClick={() => setLocation('/design-control/create')} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Project
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Tools */}
        <Card className="bg-white shadow-lg border-0 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Settings className="h-5 w-5" />
              Design Control Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Target,
                  title: 'Enhanced Controls',
                  description: 'Advanced design control features',
                  path: '/design-control/enhanced-design-control',
                  color: 'bg-blue-500'
                },
                {
                  icon: FileText,
                  title: 'Traceability Matrix',
                  description: 'Requirements traceability',
                  path: '/design-control/dynamic-traceability',
                  color: 'bg-green-500'
                },
                {
                  icon: FileText,
                  title: 'Design History File',
                  description: 'Compile design documentation',
                  path: '/design-control/history-file',
                  color: 'bg-purple-500'
                },
                {
                  icon: CheckCircle,
                  title: 'Phase Gate Reviews',
                  description: 'Review and approval workflow',
                  path: '/design-control/phase-gate-reviews',
                  color: 'bg-orange-500'
                }
              ].map((tool, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex-col justify-center bg-slate-50 hover:bg-slate-100 border-slate-200"
                  onClick={() => setLocation(tool.path)}
                >
                  <div className={`p-2 ${tool.color} rounded-lg mb-2`}>
                    <tool.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-sm">{tool.title}</span>
                  <span className="text-xs text-slate-500 text-center">{tool.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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