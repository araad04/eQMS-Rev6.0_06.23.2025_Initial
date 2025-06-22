import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Circle, AlertTriangle, Clock, ArrowRight, FileText, Settings, Award } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface EnhancedProject {
  id: string;
  title: string;
  projectType: 'advanced_component' | 'regulated_device';
  regulatoryPathway: 'as9100d' | 'iso13485' | 'dual_compliance';
  currentPhase: string;
  status: string;
  riskClassification: string;
  progress: number;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

interface PhaseGate {
  id: string;
  phase: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'review_pending' | 'approved' | 'rejected';
  requiredDeliverables: string[];
  complianceRequirements: string[];
  reviewers: string[];
  completionDate?: string;
}

export default function EnhancedFlow() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activePhase, setActivePhase] = useState<string>('planning');
  const queryClient = useQueryClient();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/enhanced-design-control/projects'],
    enabled: true
  });

  const { data: phaseGates, isLoading: phasesLoading } = useQuery({
    queryKey: ['/api/enhanced-design-control/phase-gates', selectedProject],
    enabled: !!selectedProject
  });

  const { data: complianceMapping } = useQuery({
    queryKey: ['/api/enhanced-design-control/compliance-mapping', selectedProject],
    enabled: !!selectedProject
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ projectId, phaseId, updates }: { projectId: string; phaseId: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/enhanced-design-control/projects/${projectId}/phases/${phaseId}`, updates);
      if (!response.ok) throw new Error('Failed to update phase');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-design-control/phase-gates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-design-control/projects'] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'review_pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <Circle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getComplianceBadge = (pathway: string) => {
    switch (pathway) {
      case 'as9100d':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">AS9100D</Badge>;
      case 'iso13485':
        return <Badge variant="outline" className="bg-green-50 text-green-700">ISO 13485</Badge>;
      case 'dual_compliance':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Dual Compliance</Badge>;
      default:
        return <Badge variant="outline">Standard</Badge>;
    }
  };

  const calculateOverallProgress = (phases: PhaseGate[]) => {
    if (!phases || phases.length === 0) return 0;
    const completedPhases = phases.filter(p => p.status === 'approved').length;
    return (completedPhases / phases.length) * 100;
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading enhanced design control flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Design Control Flow</h1>
          <p className="text-gray-600">AS9100D + ISO 13485 + NADCAP dual-compliant project management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-gold-600" />
          <span className="text-sm font-medium text-gray-700">Dual-Compliant System</span>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Project Selection
          </CardTitle>
          <CardDescription>
            Select an enhanced design control project to view its phase-gated workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.data?.map((project: EnhancedProject) => (
              <Card 
                key={project.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProject === project.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedProject(project.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{project.title}</h3>
                      {getComplianceBadge(project.regulatoryPathway)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                      <span className="text-gray-500">{project.currentPhase}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase Gate Flow */}
      {selectedProject && (
        <div className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>
                Current project status and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects?.data?.find((p: EnhancedProject) => p.id === selectedProject) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {calculateOverallProgress(phaseGates?.data || []).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {phaseGates?.data?.filter((p: PhaseGate) => p.status === 'approved').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Completed Phases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {phaseGates?.data?.filter((p: PhaseGate) => p.status === 'review_pending').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Pending Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {phaseGates?.data?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Phases</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase Gates */}
          <Card>
            <CardHeader>
              <CardTitle>Phase Gate Workflow</CardTitle>
              <CardDescription>
                Track progress through each design control phase with integrated compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phasesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading phase gates...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {phaseGates?.data?.map((phase: PhaseGate, index: number) => (
                    <div key={phase.id} className="relative">
                      {/* Connection Line */}
                      {index < phaseGates.data.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(phase.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <Card className={`${phase.status === 'approved' ? 'bg-green-50 border-green-200' : 
                                          phase.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                                          phase.status === 'review_pending' ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">{phase.title}</h3>
                                <Badge variant={
                                  phase.status === 'approved' ? 'default' :
                                  phase.status === 'in_progress' ? 'secondary' :
                                  phase.status === 'review_pending' ? 'outline' : 'secondary'
                                }>
                                  {phase.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              <Tabs defaultValue="deliverables" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
                                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                                  <TabsTrigger value="review">Review</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="deliverables" className="mt-4">
                                  <div className="space-y-2">
                                    {phase.requiredDeliverables?.map((deliverable: string, idx: number) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">{deliverable}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="compliance" className="mt-4">
                                  <div className="space-y-2">
                                    {phase.complianceRequirements?.map((requirement: string, idx: number) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm">{requirement}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="review" className="mt-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">Reviewers:</span>
                                      <div className="flex space-x-1">
                                        {phase.reviewers?.map((reviewer: string, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {reviewer}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    {phase.completionDate && (
                                      <div className="text-xs text-gray-600">
                                        Completed: {new Date(phase.completionDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>

                              {phase.status === 'in_progress' && (
                                <div className="mt-4 flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => updatePhaseMutation.mutate({
                                      projectId: selectedProject,
                                      phaseId: phase.id,
                                      updates: { status: 'review_pending' }
                                    })}
                                    disabled={updatePhaseMutation.isPending}
                                  >
                                    Submit for Review
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Mapping */}
          {complianceMapping?.data && (
            <Card>
              <CardHeader>
                <CardTitle>Compliance Mapping</CardTitle>
                <CardDescription>
                  Regulatory requirements mapped to project phases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">AS9100D Requirements</h4>
                    <div className="space-y-2">
                      {complianceMapping.data.as9100d?.map((req: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">ISO 13485 Requirements</h4>
                    <div className="space-y-2">
                      {complianceMapping.data.iso13485?.map((req: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedProject && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Select a project above to view its enhanced design control flow with phase gates and compliance requirements.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}