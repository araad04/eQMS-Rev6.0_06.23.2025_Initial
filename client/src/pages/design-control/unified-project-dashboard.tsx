/**
 * Unified Design Project Dashboard
 * Senior Software Development Team - Enhanced Design Control Architecture
 * 
 * Provides comprehensive visibility of all design phases within a single project interface:
 * - Project Overview & Status
 * - Phase-Gated Progress Visualization
 * - Real-time Phase Status & Controls
 * - Integrated Phase Management
 * - Traceability & Documentation Access
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PlayCircle, 
  PauseCircle,
  FileText,
  Users,
  Calendar,
  Target,
  ArrowRight,
  Settings,
  Eye,
  Edit3,
  ExternalLink
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DesignProject {
  id: number;
  projectCode: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  phaseStatus: {
    planning: string;
    inputs: string;
    outputs: string;
    verification: string;
    validation: string;
    transfer: string;
  };
  currentPhase: string;
  overallProgress: number;
}

interface PhaseInstance {
  id: number;
  phaseId: string;
  projectId: number;
  status: string;
  startDate: string;
  endDate?: string;
  assignedTo: string;
  gateStatus: string;
  reviewRequired: boolean;
  documents: any[];
  activities: any[];
}

interface PhaseDefinition {
  id: string;
  name: string;
  description: string;
  sequence: number;
  requiredDeliverables: string[];
  gateReviewRequired: boolean;
}

export default function UnifiedProjectDashboard() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const projectId = params.id;
  
  const [selectedPhase, setSelectedPhase] = useState<string>('overview');
  const [activeTab, setActiveTab] = useState('phases');

  // Fetch project details with all phase information
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/design-projects', projectId],
    enabled: !!projectId
  });

  // Fetch phase definitions
  const { data: phaseDefinitions } = useQuery({
    queryKey: ['/api/design-plan/phases'],
  });

  // Fetch project phase instances
  const { data: phaseInstances } = useQuery({
    queryKey: ['/api/design-plan/project-phases', projectId],
    enabled: !!projectId
  });

  // Fetch project activities and deliverables
  const { data: projectActivities } = useQuery({
    queryKey: ['/api/design-control/activities', projectId],
    enabled: !!projectId
  });

  // Phase transition mutation
  const phaseTransitionMutation = useMutation({
    mutationFn: async (data: { phaseId: string; action: 'start' | 'complete' | 'approve' | 'reject' }) => {
      return apiRequest('POST', `/api/design-plan/project-phases/${projectId}/transition`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-plan/project-phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/design-projects', projectId] });
    }
  });

  const getPhaseStatusBadge = (status: string) => {
    const statusConfig = {
      'not_started': { label: 'Not Started', variant: 'secondary' as const, icon: Clock },
      'in_progress': { label: 'In Progress', variant: 'default' as const, icon: PlayCircle },
      'review_pending': { label: 'Review Pending', variant: 'destructive' as const, icon: AlertCircle },
      'completed': { label: 'Completed', variant: 'default' as const, icon: CheckCircle2 },
      'approved': { label: 'Approved', variant: 'default' as const, icon: CheckCircle2 },
      'on_hold': { label: 'On Hold', variant: 'secondary' as const, icon: PauseCircle }
    };

    const config = statusConfig[status] || statusConfig['not_started'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateOverallProgress = () => {
    if (!phaseInstances || !phaseDefinitions) return 0;
    
    const totalPhases = phaseDefinitions.length;
    const completedPhases = phaseInstances.filter(p => p.status === 'completed' || p.status === 'approved').length;
    
    return Math.round((completedPhases / totalPhases) * 100);
  };

  const renderPhaseFlow = () => {
    if (!phaseDefinitions || !phaseInstances) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Design Phase Flow</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Progress:</span>
            <Progress value={calculateOverallProgress()} className="w-32" />
            <span className="text-sm font-medium">{calculateOverallProgress()}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phaseDefinitions.map((phase: PhaseDefinition, index: number) => {
            const instance = phaseInstances.find(p => p.phaseId === phase.id);
            const isActive = project?.currentPhase === phase.id;
            
            return (
              <Card 
                key={phase.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary border-primary' : ''
                } ${selectedPhase === phase.id ? 'bg-muted/50' : ''}`}
                onClick={() => setSelectedPhase(phase.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        instance?.status === 'completed' || instance?.status === 'approved' 
                          ? 'bg-green-100 text-green-700' 
                          : instance?.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{phase.name}</CardTitle>
                        <CardDescription className="text-xs">{phase.description}</CardDescription>
                      </div>
                    </div>
                    {index < phaseDefinitions.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getPhaseStatusBadge(instance?.status || 'not_started')}
                      {instance?.gateStatus && (
                        <Badge variant="outline" className="text-xs">
                          Gate: {instance.gateStatus}
                        </Badge>
                      )}
                    </div>

                    {instance && (
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {instance.assignedTo && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{instance.assignedTo}</span>
                          </div>
                        )}
                        {instance.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Started: {new Date(instance.startDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{instance.documents?.length || 0} documents</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {instance?.status === 'not_started' && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            phaseTransitionMutation.mutate({ phaseId: phase.id, action: 'start' });
                          }}
                        >
                          Start Phase
                        </Button>
                      )}
                      
                      {instance?.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            phaseTransitionMutation.mutate({ phaseId: phase.id, action: 'complete' });
                          }}
                        >
                          Complete Phase
                        </Button>
                      )}

                      {instance && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('details');
                            setSelectedPhase(phase.id);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPhaseDetails = () => {
    if (!selectedPhase || selectedPhase === 'overview' || !phaseDefinitions) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>
              Comprehensive view of {project?.title} design control progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Project Status</h4>
                <Badge variant="default">{project?.status || 'Active'}</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Current Phase</h4>
                <span className="text-sm">{project?.currentPhase || 'Planning'}</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Overall Progress</h4>
                <div className="flex items-center gap-2">
                  <Progress value={calculateOverallProgress()} className="flex-1" />
                  <span className="text-sm">{calculateOverallProgress()}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    const phase = phaseDefinitions.find(p => p.id === selectedPhase);
    const instance = phaseInstances?.find(p => p.phaseId === selectedPhase);

    if (!phase) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {phase.name}
                {getPhaseStatusBadge(instance?.status || 'not_started')}
              </CardTitle>
              <CardDescription>{phase.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation(`/design-control/${phase.id.toLowerCase()}`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Phase
              </Button>
              <Button variant="outline" size="sm">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="deliverables" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="deliverables" className="space-y-4">
              <h4 className="font-medium">Required Deliverables</h4>
              <div className="space-y-2">
                {phase.requiredDeliverables?.map((deliverable, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="flex-1">{deliverable}</span>
                    <Badge variant="outline">Complete</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="activities" className="space-y-4">
              <h4 className="font-medium">Phase Activities</h4>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {instance?.activities?.map((activity, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-muted-foreground">{activity.description}</div>
                      </div>
                      <Badge variant="outline">{activity.status}</Badge>
                    </div>
                  )) || <p className="text-muted-foreground">No activities recorded</p>}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <h4 className="font-medium">Phase Documents</h4>
              <div className="space-y-2">
                {instance?.documents?.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-muted-foreground">{doc.type}</div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                )) || <p className="text-muted-foreground">No documents attached</p>}
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-4">
              <h4 className="font-medium">Phase Gate Reviews</h4>
              <div className="space-y-2">
                {phase.gateReviewRequired ? (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Phase Gate Review Required</h5>
                        <p className="text-sm text-muted-foreground">
                          This phase requires formal gate review before proceeding
                        </p>
                      </div>
                      <Button variant="outline">
                        <Target className="w-4 h-4 mr-2" />
                        Schedule Review
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No formal review required for this phase</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  if (projectLoading) {
    return <div className="flex items-center justify-center h-64">Loading project details...</div>;
  }

  if (!project) {
    return <div className="flex items-center justify-center h-64">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground">
            {project.projectCode} • {project.description}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate DHF
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phases">Design Phases</TabsTrigger>
          <TabsTrigger value="details">Phase Details</TabsTrigger>
          <TabsTrigger value="traceability">Traceability</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="phases" className="space-y-6">
          {renderPhaseFlow()}
        </TabsContent>
        
        <TabsContent value="details" className="space-y-6">
          {renderPhaseDetails()}
        </TabsContent>
        
        <TabsContent value="traceability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Traceability Matrix</CardTitle>
              <CardDescription>
                Complete traceability from user requirements through validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setLocation(`/design-control/dynamic-traceability?project=${projectId}`)}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Traceability Matrix
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
              <CardDescription>
                Generate design control and compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  Design History File
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="w-6 h-6 mb-2" />
                  Phase Gate Summary
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <CheckCircle2 className="w-6 h-6 mb-2" />
                  Compliance Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  Review Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}