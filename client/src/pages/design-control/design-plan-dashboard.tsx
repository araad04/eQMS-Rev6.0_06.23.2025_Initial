/**
 * Design Plan Dashboard - Phase-Gated Design Control
 * DCM-001 Implementation - ISO 13485:7.3 + 21 CFR 820.30 Compliance
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Lock, 
  Unlock,
  PlayCircle,
  PauseCircle,
  ArrowRight,
  FileCheck,
  Settings,
  Users,
  Calendar,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DesignPhaseInstance {
  id: number;
  projectId: number;
  phaseId: number;
  status: 'not_started' | 'active' | 'under_review' | 'approved' | 'locked';
  startDate?: string;
  completionDate?: string;
  reviewDueDate?: string;
  assignedTo?: number;
  phaseOrder: number;
  isActive: boolean;
  phase?: {
    id: number;
    name: string;
    description: string;
    entryCriteria: string;
    exitCriteria: string;
    deliverables: string[];
  };
}

interface DesignPlan {
  id: number;
  planId: string;
  projectId: number;
  currentPhaseId?: number;
  planStatus: string;
  overallProgress: number;
  planApprovedBy?: number;
  planApprovedDate?: string;
  nextReviewDate?: string;
  riskAssessment: any;
  milestones: any[];
}

interface PhaseGatingStatus {
  currentPhase: DesignPhaseInstance | null;
  nextPhase: DesignPhaseInstance | null;
  canAdvance: boolean;
  blockers: string[];
}

export default function DesignPlanDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPhase, setSelectedPhase] = useState<DesignPhaseInstance | null>(null);

  // Fetch design plan for project
  const { data: designPlan, isLoading: planLoading } = useQuery<DesignPlan>({
    queryKey: [`/api/design-plan/projects/${projectId}/plan`],
  });

  // Fetch phase instances for project
  const { data: phaseInstances = [], isLoading: phasesLoading } = useQuery<DesignPhaseInstance[]>({
    queryKey: [`/api/design-plan/projects/${projectId}/phase-instances`],
  });

  // Fetch phase gating status
  const { data: gatingStatus, isLoading: gatingLoading } = useQuery<PhaseGatingStatus>({
    queryKey: [`/api/design-plan/projects/${projectId}/gating-status`],
  });

  // Phase activation mutation
  const activatePhaseMutation = useMutation({
    mutationFn: (phaseInstanceId: number) => 
      apiRequest(`/api/design-plan/phase-instances/${phaseInstanceId}/activate`, {
        method: "POST"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-plan/projects/${projectId}/phase-instances`] });
      queryClient.invalidateQueries({ queryKey: [`/api/design-plan/projects/${projectId}/gating-status`] });
      toast({
        title: "Phase Activated",
        description: "The phase has been successfully activated."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate phase.",
        variant: "destructive"
      });
    }
  });

  // Phase transition mutation
  const transitionPhaseMutation = useMutation({
    mutationFn: ({ phaseInstanceId, newStatus, reasonCode, comments }: {
      phaseInstanceId: number;
      newStatus: string;
      reasonCode?: string;
      comments?: string;
    }) => 
      apiRequest(`/api/design-plan/phase-instances/${phaseInstanceId}/transition`, {
        method: "POST",
        body: JSON.stringify({ newStatus, reasonCode, comments })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-plan/projects/${projectId}/phase-instances`] });
      queryClient.invalidateQueries({ queryKey: [`/api/design-plan/projects/${projectId}/gating-status`] });
      toast({
        title: "Phase Updated",
        description: "The phase status has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update phase status.",
        variant: "destructive"
      });
    }
  });

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'active':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'under_review':
        return <FileCheck className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'locked':
        return <Lock className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'locked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleActivatePhase = (phaseInstanceId: number) => {
    activatePhaseMutation.mutate(phaseInstanceId);
  };

  const handleTransitionPhase = (phaseInstanceId: number, newStatus: string) => {
    transitionPhaseMutation.mutate({
      phaseInstanceId,
      newStatus,
      reasonCode: 'user_initiated',
      comments: `Phase transitioned to ${newStatus} via dashboard`
    });
  };

  if (planLoading || phasesLoading || gatingLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading design plan...</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedPhases = phaseInstances.sort((a, b) => a.phaseOrder - b.phaseOrder);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Design Plan Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Phase-gated design control management for Project {projectId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/design-control/projects/${projectId}/reviews`)}
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Phase Reviews
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/design-control/projects/${projectId}/traceability`)}
          >
            <Target className="h-4 w-4 mr-2" />
            Traceability Matrix
          </Button>
        </div>
      </div>

      {/* Plan Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {designPlan?.planStatus || 'Active'}
            </div>
            <p className="text-xs text-muted-foreground">
              Plan ID: {designPlan?.planId || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designPlan?.overallProgress || 0}%
            </div>
            <Progress value={designPlan?.overallProgress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gatingStatus?.currentPhase?.phase?.name || 'Not Started'}
            </div>
            <p className="text-xs text-muted-foreground">
              Phase {gatingStatus?.currentPhase?.phaseOrder || 0} of {sortedPhases.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Review</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designPlan?.nextReviewDate 
                ? new Date(designPlan.nextReviewDate).toLocaleDateString()
                : 'TBD'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled review date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Phase Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Phase Flow & Gating Status
          </CardTitle>
          <CardDescription>
            Sequential phase progression with gate approvals required for advancement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {sortedPhases.map((phase, index) => (
              <div key={phase.id} className="flex items-center">
                <Card 
                  className={`relative cursor-pointer transition-all hover:shadow-md ${
                    phase.isActive ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedPhase(phase)}
                >
                  <CardContent className="p-4 min-w-48">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant="secondary" 
                        className={getPhaseStatusColor(phase.status)}
                      >
                        {getPhaseStatusIcon(phase.status)}
                        <span className="ml-1 capitalize">
                          {phase.status.replace('_', ' ')}
                        </span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Phase {phase.phaseOrder}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm">
                      {phase.phase?.name || `Phase ${phase.phaseOrder}`}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {phase.phase?.description || 'No description available'}
                    </p>
                    
                    {/* Phase Actions */}
                    <div className="mt-3 flex gap-2">
                      {phase.status === 'not_started' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivatePhase(phase.id);
                          }}
                          disabled={activatePhaseMutation.isPending}
                        >
                          <PlayCircle className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {phase.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransitionPhase(phase.id, 'under_review');
                          }}
                          disabled={transitionPhaseMutation.isPending}
                        >
                          <FileCheck className="h-3 w-3 mr-1" />
                          Submit for Review
                        </Button>
                      )}
                      
                      {phase.status === 'under_review' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/design-control/projects/${projectId}/reviews`);
                          }}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Arrow between phases */}
                {index < sortedPhases.length - 1 && (
                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gating Status */}
      {gatingStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {gatingStatus.canAdvance ? (
                <Unlock className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-red-600" />
              )}
              Phase Gating Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Can Advance to Next Phase:</span>
                <Badge variant={gatingStatus.canAdvance ? "default" : "destructive"}>
                  {gatingStatus.canAdvance ? "Yes" : "No"}
                </Badge>
              </div>
              
              {gatingStatus.blockers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Blockers:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {gatingStatus.blockers.map((blocker, index) => (
                      <li key={index}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Detail Dialog */}
      {selectedPhase && (
        <Dialog open={!!selectedPhase} onOpenChange={() => setSelectedPhase(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getPhaseStatusIcon(selectedPhase.status)}
                {selectedPhase.phase?.name || `Phase ${selectedPhase.phaseOrder}`}
              </DialogTitle>
              <DialogDescription>
                {selectedPhase.phase?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Entry Criteria:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPhase.phase?.entryCriteria || 'No entry criteria defined'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Exit Criteria:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPhase.phase?.exitCriteria || 'No exit criteria defined'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Deliverables:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {selectedPhase.phase?.deliverables?.map((deliverable, index) => (
                    <li key={index}>{deliverable}</li>
                  )) || <li>No deliverables defined</li>}
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <h4 className="font-medium text-sm">Start Date:</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPhase.startDate 
                      ? new Date(selectedPhase.startDate).toLocaleDateString()
                      : 'Not started'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Review Due:</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPhase.reviewDueDate 
                      ? new Date(selectedPhase.reviewDueDate).toLocaleDateString()
                      : 'Not scheduled'
                    }
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}