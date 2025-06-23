
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Download, FileText, Users, Target, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlanningAndURSRequirement {
  id: number;
  ursId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  source: string;
  acceptanceCriteria: string;
  stakeholder: string;
  linkedInputs: string[];
  status: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface PhaseGateReview {
  id: number;
  reviewId: string;
  phaseId: number;
  phaseName: string;
  reviewType: string;
  status: string;
  decision: string;
  exitCriteria: string[];
  reviewers: string[];
  reviewDate: string;
  approvalDate?: string;
  findings: string[];
  actionItems: Array<{
    id: number;
    description: string;
    assignee: string;
    dueDate: string;
    status: string;
  }>;
  bottleneckResolved: boolean;
  nextPhaseApproved: boolean;
  documentationComplete: boolean;
}

interface SteeringDashboard {
  projectId: number;
  currentPhase: string;
  phaseProgress: number;
  bottlenecks: Array<{
    phaseId: number;
    phaseName: string;
    issue: string;
    severity: string;
    blocking: boolean;
    actionRequired: string;
  }>;
  phaseGateStatus: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
  };
  traceabilityStatus: {
    ursToInputs: number;
    inputsToOutputs: number;
    outputsToVerification: number;
    verificationToValidation: number;
    overallCompleteness: number;
  };
  auditReadiness: {
    documentationComplete: number;
    signOffsComplete: number;
    traceabilityComplete: number;
    overallReadiness: number;
  };
  nextMilestones: Array<{
    milestone: string;
    dueDate: string;
    status: string;
    dependencies: string[];
  }>;
}

export default function EnhancedSteeringModule() {
  const [selectedProject] = useState(16); // Default to cleanroom project
  const [showURSDialog, setShowURSDialog] = useState(false);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [showBottleneckDialog, setShowBottleneckDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch URS Requirements
  const { data: ursRequirements } = useQuery({
    queryKey: [`/api/design-control-enhanced/urs-requirements/${selectedProject}`],
    enabled: !!selectedProject
  });

  // Fetch Phase Gate Reviews
  const { data: phaseGateReviews } = useQuery({
    queryKey: [`/api/design-control-enhanced/phase-gate-reviews/${selectedProject}`],
    enabled: !!selectedProject
  });

  // Fetch Design Inputs Chain
  const { data: designInputsChain } = useQuery({
    queryKey: [`/api/design-control-enhanced/design-inputs-chain/${selectedProject}`],
    enabled: !!selectedProject
  });

  // Fetch Verification Chain
  const { data: verificationChain } = useQuery({
    queryKey: [`/api/design-control-enhanced/verification-chain/${selectedProject}`],
    enabled: !!selectedProject
  });

  // Fetch Validation Chain
  const { data: validationChain } = useQuery({
    queryKey: [`/api/design-control-enhanced/validation-chain/${selectedProject}`],
    enabled: !!selectedProject
  });

  // Fetch Steering Dashboard
  const { data: steeringDashboard } = useQuery({
    queryKey: [`/api/design-control-enhanced/steering-dashboard/${selectedProject}`],
    enabled: !!selectedProject
  });

  // Create URS Requirement
  const createURSMutation = useMutation({
    mutationFn: async (ursData: any) => {
      const response = await fetch('/api/design-control-enhanced/urs-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify(ursData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-control-enhanced/urs-requirements/${selectedProject}`] });
      setShowURSDialog(false);
    }
  });

  // Generate Phase PDF
  const generatePDFMutation = useMutation({
    mutationFn: async (pdfConfig: any) => {
      const response = await fetch(`/api/design-control-enhanced/generate-phase-pdf/${selectedProject}/${selectedPhase}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify(pdfConfig)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.filepath) {
        window.open(data.filepath, '_blank');
      }
      setShowPDFDialog(false);
    }
  });

  // Resolve Bottleneck
  const resolveBottleneckMutation = useMutation({
    mutationFn: async (resolutionData: any) => {
      const response = await fetch(`/api/design-control-enhanced/resolve-bottleneck/${selectedProject}/${selectedPhase}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify(resolutionData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-control-enhanced/steering-dashboard/${selectedProject}`] });
      setShowBottleneckDialog(false);
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'approved': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'blocked': return 'destructive';
      case 'at_risk': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Design Control Steering Module</h1>
          <p className="text-muted-foreground">Project DP-2025-001 - Cleanroom Environmental Control System</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowURSDialog(true)}>
            <Target className="mr-2 h-4 w-4" />
            Add URS Requirement
          </Button>
        </div>
      </div>

      {/* Steering Dashboard Overview */}
      {steeringDashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{steeringDashboard.currentPhase}</div>
              <Progress value={steeringDashboard.phaseProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{steeringDashboard.phaseProgress}% Complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Phase Gates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{steeringDashboard.phaseGateStatus.completed}/{steeringDashboard.phaseGateStatus.total}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <div className="flex gap-1 mt-2">
                <Badge variant="default" className="text-xs">{steeringDashboard.phaseGateStatus.completed} Done</Badge>
                <Badge variant="destructive" className="text-xs">{steeringDashboard.phaseGateStatus.blocked} Blocked</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Traceability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{steeringDashboard.traceabilityStatus.overallCompleteness}%</div>
              <Progress value={steeringDashboard.traceabilityStatus.overallCompleteness} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Overall Completeness</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Audit Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{steeringDashboard.auditReadiness.overallReadiness}%</div>
              <Progress value={steeringDashboard.auditReadiness.overallReadiness} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Ready for Audit</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottlenecks Alert */}
      {steeringDashboard?.bottlenecks.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Active Bottlenecks:</strong> {steeringDashboard.bottlenecks.length} phase(s) blocked. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2"
              onClick={() => {
                setSelectedPhase(steeringDashboard.bottlenecks[0].phaseId);
                setShowBottleneckDialog(true);
              }}
            >
              Resolve Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="urs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="urs">URS Requirements</TabsTrigger>
          <TabsTrigger value="phase-gates">Phase Gate Reviews</TabsTrigger>
          <TabsTrigger value="traceability">Traceability Chain</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* URS Requirements Tab */}
        <TabsContent value="urs" className="space-y-4">
          <div className="grid gap-4">
            {ursRequirements?.map((urs: URSRequirement) => (
              <Card key={urs.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{urs.ursId}: {urs.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{urs.description}</p>
                    </div>
                    <Badge variant={getStatusColor(urs.status)}>{urs.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Category:</strong> {urs.category}
                    </div>
                    <div>
                      <strong>Priority:</strong> 
                      <Badge variant={getSeverityColor(urs.priority)} className="ml-2">{urs.priority}</Badge>
                    </div>
                    <div>
                      <strong>Source:</strong> {urs.source}
                    </div>
                    <div>
                      <strong>Stakeholder:</strong> {urs.stakeholder}
                    </div>
                  </div>
                  <div className="mt-4">
                    <strong>Acceptance Criteria:</strong>
                    <p className="text-sm text-muted-foreground mt-1">{urs.acceptanceCriteria}</p>
                  </div>
                  {urs.linkedInputs.length > 0 && (
                    <div className="mt-4">
                      <strong>Linked Design Inputs:</strong>
                      <div className="flex gap-2 mt-2">
                        {urs.linkedInputs.map((input, idx) => (
                          <Badge key={idx} variant="outline">{input}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Phase Gate Reviews Tab */}
        <TabsContent value="phase-gates" className="space-y-4">
          <div className="grid gap-4">
            {phaseGateReviews?.map((review: PhaseGateReview) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{review.reviewId}: {review.phaseName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{review.reviewType}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(review.status)}>{review.status}</Badge>
                      <Badge variant={getStatusColor(review.decision)}>{review.decision}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Exit Criteria */}
                  <div>
                    <strong>Exit Criteria:</strong>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                      {review.exitCriteria.map((criteria, idx) => (
                        <li key={idx}>{criteria}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Reviewers */}
                  <div>
                    <strong>Reviewers:</strong>
                    <div className="flex gap-2 mt-2">
                      {review.reviewers.map((reviewer, idx) => (
                        <Badge key={idx} variant="outline">
                          <Users className="mr-1 h-3 w-3" />
                          {reviewer}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Bottleneck Status */}
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      {review.bottleneckResolved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Bottleneck {review.bottleneckResolved ? 'Resolved' : 'Active'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.nextPhaseApproved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm">Next Phase {review.nextPhaseApproved ? 'Approved' : 'Pending'}</span>
                    </div>
                  </div>

                  {/* Action Items */}
                  {review.actionItems.length > 0 && (
                    <div>
                      <strong>Action Items:</strong>
                      <div className="space-y-2 mt-2">
                        {review.actionItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <p className="text-sm">{item.description}</p>
                              <p className="text-xs text-muted-foreground">Assigned to: {item.assignee} | Due: {item.dueDate}</p>
                            </div>
                            <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedPhase(review.phaseId);
                        setShowPDFDialog(true);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generate PDF
                    </Button>
                    {!review.bottleneckResolved && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedPhase(review.phaseId);
                          setShowBottleneckDialog(true);
                        }}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Resolve Bottleneck
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Traceability Chain Tab */}
        <TabsContent value="traceability" className="space-y-4">
          <div className="grid gap-4">
            {designInputsChain?.map((input: any) => (
              <Card key={input.inputId}>
                <CardHeader>
                  <CardTitle className="text-lg">{input.inputId}: {input.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{input.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      <strong>Traceability Chain:</strong>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">URS: {input.linkedURS.join(', ')}</Badge>
                      <span>→</span>
                      <Badge variant="outline">Input: {input.inputId}</Badge>
                      <span>→</span>
                      <Badge variant="outline">Output: {input.linkedOutputs.join(', ')}</Badge>
                      <span>→</span>
                      <Badge variant="outline">Verification: {input.verificationPlan.join(', ')}</Badge>
                      <span>→</span>
                      <Badge variant="outline">Validation: {input.validationPlan.join(', ')}</Badge>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {input.traceabilityComplete ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">Traceability {input.traceabilityComplete ? 'Complete' : 'Pending'}</span>
                      </div>
                      <Badge variant={getSeverityColor(input.riskLevel)}>Risk: {input.riskLevel}</Badge>
                      <Badge variant={getStatusColor(input.status)}>{input.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <div className="grid gap-4">
            {verificationChain?.map((verification: any) => (
              <Card key={verification.verificationId}>
                <CardHeader>
                  <CardTitle className="text-lg">{verification.verificationId}: {verification.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Method:</strong> {verification.method}
                      </div>
                      <div>
                        <strong>Protocol:</strong> {verification.protocol}
                      </div>
                      <div>
                        <strong>Status:</strong> 
                        <Badge variant={getStatusColor(verification.status)} className="ml-2">{verification.status}</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <strong>Test Cases:</strong>
                      <div className="space-y-2 mt-2">
                        {verification.testCases.map((testCase: any) => (
                          <div key={testCase.id} className="p-2 border rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{testCase.id}</p>
                                <p className="text-sm text-muted-foreground">{testCase.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">Expected: {testCase.expectedResult}</p>
                              </div>
                              <Badge variant={getStatusColor(testCase.status)}>{testCase.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid gap-4">
            {validationChain?.map((validation: any) => (
              <Card key={validation.validationId}>
                <CardHeader>
                  <CardTitle className="text-lg">{validation.validationId}: {validation.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Method:</strong> {validation.method}
                      </div>
                      <div>
                        <strong>Protocol:</strong> {validation.protocol}
                      </div>
                      <div>
                        <strong>Status:</strong> 
                        <Badge variant={getStatusColor(validation.status)} className="ml-2">{validation.status}</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <strong>User Scenarios:</strong>
                      <div className="space-y-2 mt-2">
                        {validation.userScenarios.map((scenario: any) => (
                          <div key={scenario.id} className="p-2 border rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{scenario.id}</p>
                                <p className="text-sm text-muted-foreground">{scenario.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">Expected: {scenario.expectedOutcome}</p>
                              </div>
                              <Badge variant={getStatusColor(scenario.status)}>{scenario.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* URS Requirement Dialog */}
      <Dialog open={showURSDialog} onOpenChange={setShowURSDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add URS Requirement</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createURSMutation.mutate({
                projectId: selectedProject,
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                priority: formData.get('priority'),
                source: formData.get('source'),
                acceptanceCriteria: formData.get('acceptanceCriteria'),
                stakeholder: formData.get('stakeholder')
              });
            }}
            className="space-y-4"
          >
            <Input name="title" placeholder="Requirement Title" required />
            <Textarea name="description" placeholder="Requirement Description" required />
            <div className="grid grid-cols-2 gap-4">
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              <Select name="priority" required>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input name="source" placeholder="Source (e.g., ISO 13485:7.3.3)" required />
            <Textarea name="acceptanceCriteria" placeholder="Acceptance Criteria" required />
            <Input name="stakeholder" placeholder="Stakeholder" required />
            <Button type="submit" disabled={createURSMutation.isPending}>
              {createURSMutation.isPending ? 'Creating...' : 'Create URS Requirement'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* PDF Generation Dialog */}
      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Phase Documentation PDF</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              generatePDFMutation.mutate({
                includeURS: formData.get('includeURS') === 'on',
                includeInputs: formData.get('includeInputs') === 'on',
                includeReviews: formData.get('includeReviews') === 'on',
                includeTraceability: formData.get('includeTraceability') === 'on'
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox name="includeURS" defaultChecked />
                <label className="text-sm">Include URS Requirements</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox name="includeInputs" defaultChecked />
                <label className="text-sm">Include Design Inputs</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox name="includeReviews" defaultChecked />
                <label className="text-sm">Include Phase Gate Reviews</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox name="includeTraceability" defaultChecked />
                <label className="text-sm">Include Traceability Matrix</label>
              </div>
            </div>
            <Button type="submit" disabled={generatePDFMutation.isPending}>
              <FileText className="mr-2 h-4 w-4" />
              {generatePDFMutation.isPending ? 'Generating...' : 'Generate PDF'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottleneck Resolution Dialog */}
      <Dialog open={showBottleneckDialog} onOpenChange={setShowBottleneckDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Phase Bottleneck</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              resolveBottleneckMutation.mutate({
                resolution: formData.get('resolution'),
                evidence: formData.get('evidence'),
                approver: formData.get('approver')
              });
            }}
            className="space-y-4"
          >
            <Textarea name="resolution" placeholder="Resolution Description" required />
            <Textarea name="evidence" placeholder="Supporting Evidence" required />
            <Input name="approver" placeholder="Approver Name" required />
            <Button type="submit" disabled={resolveBottleneckMutation.isPending}>
              {resolveBottleneckMutation.isPending ? 'Resolving...' : 'Resolve Bottleneck'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
