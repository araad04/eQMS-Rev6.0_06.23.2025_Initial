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
  FolderOpen,
  Workflow
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

const AllProjectsPage = () => {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/design-projects'],
  });

  const filteredProjects = (projects as DesignProject[] || [])?.filter((project: DesignProject) => {
    const matchesSearch = (project.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || (project.status || '').toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      'active': { label: 'Active', color: 'bg-green-100 text-green-700' },
      'planning': { label: 'Planning', color: 'bg-blue-100 text-blue-700' },
      'in_progress': { label: 'In Progress', color: 'bg-green-100 text-green-700' },
      'review': { label: 'Review', color: 'bg-yellow-100 text-yellow-700' },
      'completed': { label: 'Completed', color: 'bg-gray-100 text-gray-700' },
      'on_hold': { label: 'On Hold', color: 'bg-red-100 text-red-700' }
    };
    return configs[status?.toLowerCase() || 'planning'] || configs['planning'];
  };

  const getRiskConfig = (risk: string) => {
    const configs: Record<string, { color: string }> = {
      'low': { color: 'bg-green-50 text-green-600 border-green-200' },
      'medium': { color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
      'high': { color: 'bg-orange-50 text-orange-600 border-orange-200' },
      'critical': { color: 'bg-red-50 text-red-600 border-red-200' }
    };
    return configs[risk?.toLowerCase() || 'medium'] || configs['medium'];
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

  const activeProjects = filteredProjects.filter((p: DesignProject) => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'in_progress');
  const completedProjects = filteredProjects.filter((p: DesignProject) => (p.status || '').toLowerCase() === 'completed');
  const reviewProjects = filteredProjects.filter((p: DesignProject) => (p.status || '').toLowerCase() === 'review');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary rounded-xl">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">All Design Projects</h1>
                <p className="text-slate-600 mt-1">
                  Comprehensive project management with ISO 13485:7.3 design control compliance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setLocation('/design-control/templates')} 
                variant="outline"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Templates
              </Button>
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
                <span className="text-green-600">Sequential phase-gated workflow</span>
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
                <span className="text-green-600">100% compliance rate</span>
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
                <span className="text-yellow-600">Phase gate reviews</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Projects</p>
                  <p className="text-3xl font-bold text-slate-900">{filteredProjects.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <Workflow className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-purple-600">Design control lifecycle</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search projects by code, title, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                
                <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-auto">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="planning" className="text-xs">Planning</TabsTrigger>
                    <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
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

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>Project Progress</span>
                        <span>{project.overallProgress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.overallProgress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-xs text-slate-500">
                        <User className="h-3 w-3 mr-1" />
                        <span>Engineering Team</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3 text-slate-400" />
                        <Eye className="h-3 w-3 text-slate-400" />
                        <Settings className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Projects Found</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'No projects match your current search or filter criteria.'
                  : 'Start by creating your first design control project.'}
              </p>
              <Button onClick={() => setLocation('/design-control/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
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
                  path: '/design-control/enhanced',
                  color: 'bg-blue-500'
                },
                {
                  icon: FileText,
                  title: 'Global Traceability',
                  description: 'Requirements traceability matrix',
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
                  title: 'Project Templates',
                  description: 'ISO 13485 compliant templates',
                  path: '/design-control/templates',
                  color: 'bg-orange-500'
                }
              ].map((tool, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-slate-50"
                  onClick={() => setLocation(tool.path)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 ${tool.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">{tool.title}</h4>
                    <p className="text-xs text-slate-600">{tool.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllProjectsPage;