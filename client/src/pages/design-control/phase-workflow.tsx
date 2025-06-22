/**
 * Sequential Phase-Gated Design Control Workflow Interface
 * ISO 13485:7.3 Compliance with Bottleneck Enforcement
 * Ultra-Professional Software Development Team Implementation
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Lock, 
  Unlock,
  ArrowRight,
  FileText,
  Users,
  Calendar,
  Target,
  BarChart3,
  Shield
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PhaseWorkflowData {
  projectId: number;
  phases: PhaseInstance[];
  currentPhase?: PhaseInstance;
  nextPhase?: PhaseInstance;
  blockedPhases: PhaseInstance[];
}

interface PhaseInstance {
  id: number;
  phaseId: number;
  status: 'not_started' | 'active' | 'under_review' | 'approved' | 'locked';
  startedAt?: string;
  completedAt?: string;
  reviewId?: number;
  phaseName: string;
  phaseDescription: string;
  sortOrder: number;
  entryCriteria: string;
  exitCriteria: string;
  deliverables: string[];
  canStart: boolean;
  isBlocked: boolean;
  blockingPhase?: string;
  sequencePosition: number;
  totalPhases: number;
}

interface BottleneckData {
  projectId: number;
  activeBottlenecks: number;
  bottleneckPhases: BottleneckPhase[];
  blockedPhases: BlockedPhase[];
  workflowBlocked: boolean;
}

interface BottleneckPhase {
  phaseInstanceId: number;
  phaseName: string;
  status: string;
  reviewId?: number;
  reviewTitle?: string;
  scheduledDate?: string;
  reviewStatus?: string;
}

interface BlockedPhase {
  phaseInstanceId: number;
  phaseName: string;
  sortOrder: number;
  status: string;
}

export default function PhaseWorkflow({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const [selectedPhase, setSelectedPhase] = useState<PhaseInstance | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [transitionComments, setTransitionComments] = useState('');

  // Fetch phase workflow data
  const { data: workflow, isLoading } = useQuery({
    queryKey: ['/api/phase-gated-workflow/project', projectId, 'phases'],
    enabled: !!projectId,
  });

  // Fetch bottleneck status
  const { data: bottlenecks } = useQuery({
    queryKey: ['/api/phase-gated-workflow/project', projectId, 'bottlenecks'],
    enabled: !!projectId,
  });

  // Initialize phases mutation
  const initializePhases = useMutation({
    mutationFn: () => apiRequest(`/api/phase-gated-workflow/project/${projectId}/initialize`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phase-gated-workflow/project', projectId] });
    },
  });

  // Submit phase for review mutation
  const submitForReview = useMutation({
    mutationFn: (data: { phaseInstanceId: number; reviewTitle: string; reviewScope: string }) => 
      apiRequest('/api/phase-gated-workflow/submit-for-review', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phase-gated-workflow/project', projectId] });
      setReviewDialogOpen(false);
      setReviewComments('');
    },
  });

  // Request phase transition mutation
  const requestTransition = useMutation({
    mutationFn: (data: { projectId: number; currentPhaseId: number; targetPhaseId: number; comments?: string }) =>
      apiRequest('/api/phase-gated-workflow/request-transition', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phase-gated-workflow/project', projectId] });
      setTransitionDialogOpen(false);
      setTransitionComments('');
    },
  });

  // Complete review mutation
  const completeReview = useMutation({
    mutationFn: (data: { reviewId: number; outcome: string; comments: string; nextPhaseAllowed: boolean }) =>
      apiRequest('/api/phase-gated-workflow/complete-review', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phase-gated-workflow/project', projectId] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-slate-100 text-slate-600';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'under_review': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'locked': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started': return <Clock className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'under_review': return <Pause className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'locked': return <Lock className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const calculateProgress = (phases: PhaseInstance[]) => {
    const completedPhases = phases.filter(p => p.status === 'approved' || p.status === 'locked').length;
    return (completedPhases / phases.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading phase workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow?.phases?.length) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Phase Workflow Not Initialized</h3>
          <p className="text-slate-600 mb-6">
            Initialize the sequential phase-gated workflow to begin the design control process.
          </p>
          <Button 
            onClick={() => initializePhases.mutate()}
            disabled={initializePhases.isPending}
            className="bg-primary text-white"
          >
            {initializePhases.isPending ? 'Initializing...' : 'Initialize Phase Workflow'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const workflowData = workflow as PhaseWorkflowData;
  const bottleneckData = bottlenecks as BottleneckData;

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Sequential Phase-Gated Design Control Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{workflowData.phases.length}</div>
              <div className="text-sm text-slate-600">Total Phases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {workflowData.phases.filter(p => p.status === 'approved' || p.status === 'locked').length}
              </div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {bottleneckData?.activeBottlenecks || 0}
              </div>
              <div className="text-sm text-slate-600">Active Bottlenecks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {workflowData.phases.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-slate-600">Active Phases</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Overall Progress</span>
              <span className="text-sm text-slate-600">
                {Math.round(calculateProgress(workflowData.phases))}%
              </span>
            </div>
            <Progress value={calculateProgress(workflowData.phases)} className="h-2" />
          </div>

          {bottleneckData?.workflowBlocked && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Workflow is currently blocked by {bottleneckData.activeBottlenecks} active phase review(s). 
                Reviews must be completed to continue sequential progression.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Phase Sequential Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowData.phases.map((phase, index) => (
              <div key={phase.id} className="relative">
                {/* Connection Line */}
                {index < workflowData.phases.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-slate-200"></div>
                )}
                
                <div className="flex items-start gap-4">
                  {/* Phase Status Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(phase.status)}`}>
                    {getStatusIcon(phase.status)}
                  </div>

                  {/* Phase Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{phase.phaseName}</h4>
                        <p className="text-sm text-slate-600">Phase {phase.sequencePosition} of {phase.totalPhases}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(phase.status)}>
                          {phase.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {phase.isBlocked && (
                          <Badge variant="destructive">
                            BLOCKED
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{phase.phaseDescription}</p>

                    {/* Phase Actions */}
                    <div className="flex items-center gap-2 mb-3">
                      {phase.status === 'active' && (
                        <>
                          <Dialog open={reviewDialogOpen && selectedPhase?.id === phase.id} onOpenChange={setReviewDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedPhase(phase)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Submit for Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Phase for Review</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Review Title</Label>
                                  <input 
                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                    defaultValue={`${phase.phaseName} Phase Gate Review`}
                                    id="reviewTitle"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="reviewComments">Review Scope</Label>
                                  <Textarea 
                                    id="reviewComments"
                                    value={reviewComments}
                                    onChange={(e) => setReviewComments(e.target.value)}
                                    placeholder="Describe the scope and objectives of this phase review..."
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      const titleInput = document.getElementById('reviewTitle') as HTMLInputElement;
                                      submitForReview.mutate({
                                        phaseInstanceId: phase.id,
                                        reviewTitle: titleInput.value,
                                        reviewScope: reviewComments
                                      });
                                    }}
                                    disabled={submitForReview.isPending}
                                  >
                                    {submitForReview.isPending ? 'Submitting...' : 'Submit for Review'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {phase.status === 'approved' && workflowData.nextPhase?.id === phase.id + 1 && (
                        <Dialog open={transitionDialogOpen && selectedPhase?.id === phase.id} onOpenChange={setTransitionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => setSelectedPhase(phase)}
                            >
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Activate Next Phase
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Activate Next Phase</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-slate-600">
                                This will lock the current phase and activate the next phase in the sequential workflow.
                              </p>
                              <div>
                                <Label htmlFor="transitionComments">Transition Comments</Label>
                                <Textarea 
                                  id="transitionComments"
                                  value={transitionComments}
                                  onChange={(e) => setTransitionComments(e.target.value)}
                                  placeholder="Add any comments about this phase transition..."
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setTransitionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => {
                                    if (workflowData.nextPhase) {
                                      requestTransition.mutate({
                                        projectId,
                                        currentPhaseId: phase.id,
                                        targetPhaseId: workflowData.nextPhase.id,
                                        comments: transitionComments
                                      });
                                    }
                                  }}
                                  disabled={requestTransition.isPending}
                                >
                                  {requestTransition.isPending ? 'Activating...' : 'Activate Next Phase'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedPhase(selectedPhase?.id === phase.id ? null : phase)}
                      >
                        {selectedPhase?.id === phase.id ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>

                    {/* Phase Details Expansion */}
                    {selectedPhase?.id === phase.id && (
                      <Card className="mt-3 bg-slate-50">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-slate-900 mb-2">Entry Criteria</h5>
                              <p className="text-sm text-slate-600">{phase.entryCriteria}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-900 mb-2">Exit Criteria</h5>
                              <p className="text-sm text-slate-600">{phase.exitCriteria}</p>
                            </div>
                            <div className="md:col-span-2">
                              <h5 className="font-medium text-slate-900 mb-2">Required Deliverables</h5>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {phase.deliverables.map((deliverable, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                    {deliverable}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {phase.isBlocked && (
                            <Alert className="mt-4 border-red-200 bg-red-50">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800">
                                This phase is blocked by: {phase.blockingPhase}. 
                                Previous phase must be completed and approved before this phase can start.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Bottlenecks */}
      {bottleneckData?.bottleneckPhases?.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Active Bottlenecks - Review Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bottleneckData.bottleneckPhases.map((bottleneck) => (
                <div key={bottleneck.phaseInstanceId} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <h4 className="font-medium text-yellow-900">{bottleneck.phaseName}</h4>
                    <p className="text-sm text-yellow-700">{bottleneck.reviewTitle}</p>
                    {bottleneck.scheduledDate && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled: {new Date(bottleneck.scheduledDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {bottleneck.reviewStatus?.toUpperCase() || 'PENDING'}
                    </Badge>
                    {bottleneck.reviewId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          completeReview.mutate({
                            reviewId: bottleneck.reviewId!,
                            outcome: 'approved',
                            comments: 'Phase review approved - proceeding to next phase',
                            nextPhaseAllowed: true
                          });
                        }}
                        disabled={completeReview.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}