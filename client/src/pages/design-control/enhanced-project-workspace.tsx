import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Users, 
  Target,
  TrendingUp,
  Download,
  Plus,
  Edit,
  Play,
  Settings,
  CheckSquare,
  GitBranch,
  Shield,
  BarChart3,
  Workflow,
  X
} from 'lucide-react';

interface EnhancedProjectWorkspaceProps {}

const EnhancedProjectWorkspace: React.FC<EnhancedProjectWorkspaceProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  const [activeTab, setActiveTab] = useState<string>('phases-overview');
  const [showURSDialog, setShowURSDialog] = useState(false);
  const [showPhaseReviewDialog, setShowPhaseReviewDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [addItemType, setAddItemType] = useState<string>('');
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);

  // Form states
  const [ursForm, setUrsForm] = useState({
    identifier: '',
    title: '',
    description: '',
    priority: 'medium',
    riskLevel: 'medium'
  });

  const [phaseReviewForm, setPhaseReviewForm] = useState({
    phaseId: '',
    reviewDecision: 'pending',
    reviewComments: '',
    reviewerName: ''
  });

  const [addItemForm, setAddItemForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });

  const { data: projectDetails, isLoading: projectDetailsLoading } = useQuery({
    queryKey: ['/api/design-projects', projectId],
    queryFn: async () => {
      const response = await fetch('/api/design-projects', {
        headers: { 'X-Auth-Local': 'true' }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projects = await response.json();
      return projects.find((p: any) => p.id === parseInt(projectId || '0'));
    },
    enabled: !!projectId
  });

  const { data: projectPhases, refetch: refetchPhases } = useQuery({
    queryKey: ['/api/design-control-enhanced/project', projectId, 'phases'],
    queryFn: async () => {
      const response = await fetch(`/api/design-control-enhanced/project/${projectId}/phases`, {
        headers: { 'X-Auth-Local': 'true' }
      });
      if (!response.ok) throw new Error('Failed to fetch project phases');
      return response.json();
    },
    enabled: !!projectId
  });

  const { data: projectArtifacts } = useQuery({
    queryKey: ['/api/design-control-enhanced/project', projectId, 'design-artifacts'],
    queryFn: async () => {
      const response = await fetch(`/api/design-control-enhanced/project/${projectId}/design-artifacts`, {
        headers: { 'X-Auth-Local': 'true' }
      });
      if (!response.ok) throw new Error('Failed to fetch project artifacts');
      return response.json();
    },
    enabled: !!projectId
  });

  // Phase gating logic
  const phaseGatingRules: Record<string, { canProceed: boolean; nextPhase: string | null; prerequisite?: string }> = {
    'Planning & URS': { canProceed: true, nextPhase: 'Design Inputs' },
    'Design Inputs': { canProceed: false, nextPhase: 'Design Outputs', prerequisite: 'Planning & URS' },
    'Design Outputs': { canProceed: false, nextPhase: 'Verification', prerequisite: 'Design Inputs' },
    'Verification': { canProceed: false, nextPhase: 'Validation', prerequisite: 'Design Outputs' },
    'Validation': { canProceed: false, nextPhase: 'Transfer', prerequisite: 'Verification' },
    'Transfer': { canProceed: false, nextPhase: null, prerequisite: 'Validation' }
  };

  const checkPhaseGateStatus = (phaseName: string, phases: any[]) => {
    const gatingRule = phaseGatingRules[phaseName];
    
    if (!gatingRule) return { status: 'blocked', reason: 'Unknown phase' };
    
    if (phaseName === 'Planning & URS') {
      return { status: 'active', reason: 'Entry phase - always accessible' };
    }
    
    if (gatingRule.prerequisite) {
      const prerequisitePhase = phases.find(p => p.name === gatingRule.prerequisite);
      if (!prerequisitePhase || prerequisitePhase.gateReview?.decision !== 'approved') {
        return { 
          status: 'blocked', 
          reason: `Requires ${gatingRule.prerequisite} gate review approval` 
        };
      }
    }
    
    return { status: 'active', reason: 'Prerequisites met' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'not_started':
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      not_started: 'bg-gray-100 text-gray-800',
      pending: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleAddURS = async () => {
    try {
      const response = await fetch('/api/design-control/urs-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify({
          ...ursForm,
          projectId: parseInt(projectId || '0')
        })
      });
      
      if (response.ok) {
        setShowURSDialog(false);
        setUrsForm({ identifier: '', title: '', description: '', priority: 'medium', riskLevel: 'medium' });
        refetchPhases();
      }
    } catch (error) {
      console.error('Failed to add URS:', error);
    }
  };

  const handlePhaseReview = async () => {
    try {
      const response = await fetch('/api/design-control/phase-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify({
          ...phaseReviewForm,
          projectId: parseInt(projectId || '0'),
          reviewDate: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setShowPhaseReviewDialog(false);
        setPhaseReviewForm({ phaseId: '', reviewDecision: 'pending', reviewComments: '', reviewerName: '' });
        refetchPhases();
      }
    } catch (error) {
      console.error('Failed to submit phase review:', error);
    }
  };

  const handleAddItem = async () => {
    try {
      const endpoint = `/api/design-control/${addItemType}s`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify({
          ...addItemForm,
          projectId: parseInt(projectId || '0')
        })
      });
      
      if (response.ok) {
        setShowAddItemDialog(false);
        setAddItemForm({ title: '', description: '', category: '', priority: 'medium' });
        refetchPhases();
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  if (projectDetailsLoading) {
    return <div className="flex items-center justify-center h-64">Loading project details...</div>;
  }

  if (!projectDetails) {
    return <div className="flex items-center justify-center h-64">Project not found</div>;
  }

  const phaseDefinitions = [
    { 
      id: 1,
      name: 'Planning & URS', 
      status: 'in_progress',
      progress: 85,
      gateReview: { decision: 'pending', completedDate: null },
      artifacts: ['Project Plan', 'URS Document', 'Risk Assessment'],
      designElements: ['URS-001: Temperature Control', 'URS-002: Humidity Control', 'URS-003: Recovery Time']
    },
    { 
      id: 2,
      name: 'Design Inputs', 
      status: 'blocked',
      progress: 0,
      gateReview: { decision: 'not_started', completedDate: null },
      artifacts: ['Functional Requirements', 'Performance Specifications', 'Interface Requirements'],
      designElements: ['DI-001: System Requirements', 'DI-002: Safety Requirements', 'DI-003: Performance Criteria']
    },
    { 
      id: 3,
      name: 'Design Outputs', 
      status: 'blocked',
      progress: 0,
      gateReview: { decision: 'not_started', completedDate: null },
      artifacts: ['Design Drawings', 'Component Specifications', 'Software Requirements'],
      designElements: ['DO-001: System Architecture', 'DO-002: Control Algorithms', 'DO-003: User Interface']
    },
    { 
      id: 4,
      name: 'Verification', 
      status: 'blocked',
      progress: 0,
      gateReview: { decision: 'not_started', completedDate: null },
      artifacts: ['Verification Protocols', 'Test Plans', 'Inspection Procedures'],
      designElements: ['VER-001: Performance Testing', 'VER-002: Safety Verification', 'VER-003: Standards Compliance']
    },
    { 
      id: 5,
      name: 'Validation', 
      status: 'blocked',
      progress: 0,
      gateReview: { decision: 'not_started', completedDate: null },
      artifacts: ['Validation Protocols', 'User Acceptance Testing', 'Clinical Evidence'],
      designElements: ['VAL-001: User Validation', 'VAL-002: Performance Validation', 'VAL-003: Safety Validation']
    },
    { 
      id: 6,
      name: 'Transfer', 
      status: 'blocked',
      progress: 0,
      gateReview: { decision: 'not_started', completedDate: null },
      artifacts: ['Transfer Documents', 'Manufacturing Procedures', 'Quality Plans'],
      designElements: ['TR-001: Manufacturing Transfer', 'TR-002: Quality Systems', 'TR-003: Post-Market Surveillance']
    }
  ];

  const phases = projectPhases?.phases || phaseDefinitions;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Project Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {projectDetails.projectCode || 'Project'} - {projectDetails.title || 'Loading...'}
        </h1>
        <p className="text-gray-600 mt-2">
          {projectDetails.description || 'Comprehensive phase-gated design control management'}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <Badge variant="outline" className="text-sm">
            {projectDetails.status || 'Status Unknown'}
          </Badge>
          <span className="text-sm text-gray-500">
            Risk Level: {projectDetails.riskLevel || 'Not Specified'}
          </span>
          <span className="text-sm text-gray-500">
            Created: {projectDetails.createdAt ? new Date(projectDetails.createdAt).toLocaleDateString() : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="phases-overview">Phases Overview</TabsTrigger>
          <TabsTrigger value="overview">Project Overview</TabsTrigger>
          <TabsTrigger value="inputs">Design Inputs</TabsTrigger>
          <TabsTrigger value="outputs">Design Outputs</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="traceability">Traceability</TabsTrigger>
        </TabsList>

        {/* Phases Overview Tab */}
        <TabsContent value="phases-overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Interactive Phase Management Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Interactive Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Dialog open={showURSDialog} onOpenChange={setShowURSDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add URS
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add User Requirement Specification</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="urs-identifier">Identifier</Label>
                          <Input
                            id="urs-identifier"
                            value={ursForm.identifier}
                            onChange={(e) => setUrsForm({ ...ursForm, identifier: e.target.value })}
                            placeholder="URS-001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="urs-title">Title</Label>
                          <Input
                            id="urs-title"
                            value={ursForm.title}
                            onChange={(e) => setUrsForm({ ...ursForm, title: e.target.value })}
                            placeholder="Requirement title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="urs-description">Description</Label>
                          <Textarea
                            id="urs-description"
                            value={ursForm.description}
                            onChange={(e) => setUrsForm({ ...ursForm, description: e.target.value })}
                            placeholder="Detailed requirement description"
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button onClick={handleAddURS}>Add URS</Button>
                          <Button variant="outline" onClick={() => setShowURSDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showPhaseReviewDialog} onOpenChange={setShowPhaseReviewDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Phase Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Phase Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="review-phase">Phase</Label>
                          <select
                            id="review-phase"
                            className="w-full p-2 border rounded"
                            value={phaseReviewForm.phaseId}
                            onChange={(e) => setPhaseReviewForm({ ...phaseReviewForm, phaseId: e.target.value })}
                          >
                            <option value="">Select Phase</option>
                            {phases.map((phase: any) => (
                              <option key={phase.id} value={phase.id}>{phase.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="review-decision">Decision</Label>
                          <select
                            id="review-decision"
                            className="w-full p-2 border rounded"
                            value={phaseReviewForm.reviewDecision}
                            onChange={(e) => setPhaseReviewForm({ ...phaseReviewForm, reviewDecision: e.target.value })}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="review-comments">Comments</Label>
                          <Textarea
                            id="review-comments"
                            value={phaseReviewForm.reviewComments}
                            onChange={(e) => setPhaseReviewForm({ ...phaseReviewForm, reviewComments: e.target.value })}
                            placeholder="Review comments and feedback"
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button onClick={handlePhaseReview}>Submit Review</Button>
                          <Button variant="outline" onClick={() => setShowPhaseReviewDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => {setAddItemType('design-input'); setShowAddItemDialog(true);}}
                      >
                        <Plus className="h-4 w-4" />
                        Add Input
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add {addItemType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="item-title">Title</Label>
                          <Input
                            id="item-title"
                            value={addItemForm.title}
                            onChange={(e) => setAddItemForm({ ...addItemForm, title: e.target.value })}
                            placeholder="Item title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="item-description">Description</Label>
                          <Textarea
                            id="item-description"
                            value={addItemForm.description}
                            onChange={(e) => setAddItemForm({ ...addItemForm, description: e.target.value })}
                            placeholder="Detailed description"
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button onClick={handleAddItem}>Add Item</Button>
                          <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => {setAddItemType('design-output'); setShowAddItemDialog(true);}}
                  >
                    <Plus className="h-4 w-4" />
                    Add Output
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => {setAddItemType('verification'); setShowAddItemDialog(true);}}
                  >
                    <Shield className="h-4 w-4" />
                    Add Verification
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => {setAddItemType('validation'); setShowAddItemDialog(true);}}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Add Validation
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-900 mb-2">Current Phase Status</h4>
                  <p className="text-sm text-blue-700">
                    Active Phase: <strong>Planning & URS</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    Next Phase: Design Inputs (Blocked - requires Planning & URS approval)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Phase Progress Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phase Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={phase.status === 'in_progress' ? 'font-medium text-green-700' : 'text-gray-600'}>
                          {phase.name}
                        </span>
                        <span className={phase.status === 'in_progress' ? 'text-green-700' : 'text-gray-500'}>
                          {phase.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            phase.status === 'in_progress' ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${phase.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phase Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase: any, index: number) => {
              const gateStatus = checkPhaseGateStatus(phase.name, phases);
              
              return (
                <Card key={phase.id || index} className={`transition-all duration-300 ${
                  gateStatus.status === 'blocked' ? 'border-red-200 bg-red-50' : 
                  gateStatus.status === 'active' ? 'border-green-200 bg-green-50 shadow-md' :
                  'border-gray-200 bg-white hover:shadow-md'
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {phase.name}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(phase.status)}
                        {gateStatus.status === 'blocked' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Badge className={getStatusBadge(phase.status)} variant="secondary">
                        {(phase.status || 'pending').replace('_', ' ')}
                      </Badge>
                      <Badge variant={gateStatus.status === 'blocked' ? 'destructive' : 'outline'}>
                        {gateStatus.status === 'blocked' ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>

                    {gateStatus.status === 'blocked' && (
                      <div className="p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                        <strong>Bottleneck:</strong> {gateStatus.reason}
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Artifacts:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {phase.artifacts?.map((artifact: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {artifact}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Design Elements:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {phase.designElements?.map((element: string, idx: number) => (
                          <li key={idx} className="truncate">{element}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        disabled={gateStatus.status === 'blocked'}
                        onClick={() => setSelectedPhaseId(phase.id || index)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        disabled={gateStatus.status === 'blocked'}
                        onClick={() => setShowPhaseReviewDialog(true)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>

                    {phase.gateReview && (
                      <div className={`mt-3 p-2 text-xs rounded ${
                        phase.gateReview.decision === 'approved' ? 'bg-green-100 border border-green-200' :
                        phase.gateReview.decision === 'pending' ? 'bg-yellow-100 border border-yellow-200' :
                        'bg-gray-100 border border-gray-200'
                      }`}>
                        <p className="font-medium text-gray-700">Gate Review Status</p>
                        <p className={`${
                          phase.gateReview.decision === 'approved' ? 'text-green-700' :
                          phase.gateReview.decision === 'pending' ? 'text-yellow-700' :
                          'text-gray-600'
                        }`}>
                          {phase.gateReview.decision === 'approved' ? '✅ Approved' :
                           phase.gateReview.decision === 'pending' ? '⏳ Under Review' :
                           '❌ Not Started'}
                          {phase.gateReview.completedDate && ` (${phase.gateReview.completedDate})`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Other tabs would follow similar pattern... */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Comprehensive project overview content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inputs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Design inputs management interface would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outputs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Design outputs management interface would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Verification activities management interface would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Validation activities management interface would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traceability" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Traceability Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Traceability matrix interface would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedProjectWorkspace;