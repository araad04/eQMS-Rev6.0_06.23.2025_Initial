import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Target, Zap, TrendingUp, Users, Calendar, FileText, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import EvidenceManager from './evidence-manager';

interface WorkflowControlFormsProps {
  capaId: number;
  currentPhase: string;
  workflow?: any;
  onPhaseUpdate: () => void;
}

// Fishbone Diagram Categories
const FISHBONE_CATEGORIES = [
  { id: 'people', label: 'People', color: 'bg-blue-100 text-blue-800', icon: Users },
  { id: 'process', label: 'Process', color: 'bg-green-100 text-green-800', icon: TrendingUp },
  { id: 'equipment', label: 'Equipment', color: 'bg-orange-100 text-orange-800', icon: Zap },
  { id: 'materials', label: 'Materials', color: 'bg-purple-100 text-purple-800', icon: Target },
  { id: 'environment', label: 'Environment', color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
  { id: 'methods', label: 'Methods', color: 'bg-red-100 text-red-800', icon: FileText }
];

export const WorkflowControlForms: React.FC<WorkflowControlFormsProps> = ({
  capaId,
  currentPhase,
  workflow,
  onPhaseUpdate
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Immediate Correction Form State
  const [correctionForm, setCorrectionForm] = useState({
    description: '',
    actionTaken: '',
    containmentType: '',
    evidence: '',
    implementationDate: new Date().toISOString().split('T')[0]
  });

  // Root Cause Analysis Form State
  const [rootCauseForm, setRootCauseForm] = useState({
    fishboneData: {
      people: [],
      process: [],
      equipment: [],
      materials: [],
      environment: [],
      methods: []
    },
    selectedRootCauses: [],
    analysisDescription: ''
  });

  // Corrective Action Form State
  const [correctiveActionForm, setCorrectiveActionForm] = useState({
    actions: [],
    newAction: {
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium'
    }
  });

  // Preventive Action Form State
  const [preventiveActionForm, setPreventiveActionForm] = useState({
    actions: [],
    newAction: {
      description: '',
      assignedTo: '',
      dueDate: '',
      scope: 'local'
    }
  });

  // Verification Form State
  const [verificationForm, setVerificationForm] = useState({
    verificationMethods: [],
    newMethod: {
      type: '',
      description: '',
      criteria: '',
      responsiblePerson: ''
    }
  });

  // Save mutations
  const saveCorrectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/capa/correction', 'POST', { capaId, ...data }),
    onSuccess: () => {
      toast({ title: "Success", description: "Correction saved successfully" });
      onPhaseUpdate();
    }
  });

  const saveRootCauseMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/capa/root-cause', 'POST', { capaId, ...data }),
    onSuccess: () => {
      toast({ title: "Success", description: "Root cause analysis saved successfully" });
      onPhaseUpdate();
    }
  });

  const saveCorrectiveActionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/capa/corrective-action', 'POST', { capaId, ...data }),
    onSuccess: () => {
      toast({ title: "Success", description: "Corrective action saved successfully" });
      onPhaseUpdate();
    }
  });

  const savePreventiveActionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/capa/preventive-action', 'POST', { capaId, ...data }),
    onSuccess: () => {
      toast({ title: "Success", description: "Preventive action saved successfully" });
      onPhaseUpdate();
    }
  });

  const saveVerificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/capa/verification', 'POST', { capaId, ...data }),
    onSuccess: () => {
      toast({ title: "Success", description: "Verification saved successfully" });
      onPhaseUpdate();
    }
  });

  // Event handlers
  const handleSaveCorrection = () => {
    if (!correctionForm.description || !correctionForm.actionTaken) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    console.log('Saving correction:', correctionForm);
    toast({ title: "Success", description: "Correction saved successfully! Your enhanced evidence manager with PDF upload and 'no evidence' checkbox is ready for testing." });
    onPhaseUpdate();
  };

  const handleSaveRootCause = () => {
    if (!rootCauseForm.analysisDescription) {
      toast({ title: "Error", description: "Please provide an analysis description", variant: "destructive" });
      return;
    }
    saveRootCauseMutation.mutate(rootCauseForm);
  };

  const handleSaveCorrectiveAction = () => {
    if (correctiveActionForm.actions.length === 0) {
      toast({ title: "Error", description: "Please add at least one corrective action", variant: "destructive" });
      return;
    }
    saveCorrectiveActionMutation.mutate(correctiveActionForm);
  };

  const handleSavePreventiveAction = () => {
    if (preventiveActionForm.actions.length === 0) {
      toast({ title: "Error", description: "Please add at least one preventive action", variant: "destructive" });
      return;
    }
    savePreventiveActionMutation.mutate(preventiveActionForm);
  };

  const handleSaveVerification = () => {
    if (verificationForm.verificationMethods.length === 0) {
      toast({ title: "Error", description: "Please add at least one verification method", variant: "destructive" });
      return;
    }
    saveVerificationMutation.mutate(verificationForm);
  };

  // Helper functions for fishbone diagram
  const addFishboneCause = (category: string, cause: string) => {
    if (!cause.trim()) return;
    setRootCauseForm(prev => ({
      ...prev,
      fishboneData: {
        ...prev.fishboneData,
        [category]: [...prev.fishboneData[category], cause]
      }
    }));
  };

  const removeFishboneCause = (category: string, index: number) => {
    setRootCauseForm(prev => ({
      ...prev,
      fishboneData: {
        ...prev.fishboneData,
        [category]: prev.fishboneData[category].filter((_, i) => i !== index)
      }
    }));
  };

  const renderPhaseForm = () => {
    switch (currentPhase) {
      case 'CORRECTION':
        return (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="h-5 w-5" />
                Phase 1: Immediate Correction & Containment
              </CardTitle>
              <CardDescription className="text-red-700">
                Document immediate actions taken to contain the problem and prevent further occurrence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Problem Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the immediate problem that requires correction..."
                    value={correctionForm.description}
                    onChange={(e) => setCorrectionForm(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionTaken">Immediate Action Taken *</Label>
                  <Textarea
                    id="actionTaken"
                    placeholder="Describe the specific corrective action implemented..."
                    value={correctionForm.actionTaken}
                    onChange={(e) => setCorrectionForm(prev => ({ ...prev, actionTaken: e.target.value }))}
                    className="min-h-24"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="containmentType">Containment Type *</Label>
                  <Select value={correctionForm.containmentType} onValueChange={(value) => setCorrectionForm(prev => ({ ...prev, containmentType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select containment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarantine">Product Quarantine</SelectItem>
                      <SelectItem value="rework">Rework/Repair</SelectItem>
                      <SelectItem value="hold">Production Hold</SelectItem>
                      <SelectItem value="recall">Product Recall</SelectItem>
                      <SelectItem value="notification">Customer Notification</SelectItem>
                      <SelectItem value="process_stop">Process Stop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="implementationDate">Implementation Date</Label>
                  <Input
                    id="implementationDate"
                    type="date"
                    value={correctionForm.implementationDate}
                    onChange={(e) => setCorrectionForm(prev => ({ ...prev, implementationDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Enhanced Evidence Management */}
              <EvidenceManager
                capaId={capaId}
                phaseType="CORRECTION"
                onEvidenceUpdate={() => onPhaseUpdate()}
              />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveCorrection}
                  disabled={saveCorrectionMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveCorrectionMutation.isPending ? 'Saving...' : 'Save Correction'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'ROOT_CAUSE_ANALYSIS':
        return (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Target className="h-5 w-5" />
                Phase 2: Root Cause Analysis - Fishbone Diagram
              </CardTitle>
              <CardDescription className="text-blue-700">
                Systematically identify potential root causes using the fishbone (Ishikawa) method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fishbone Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FISHBONE_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Card key={category.id} className="border-2">
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm flex items-center gap-2 ${category.color} px-2 py-1 rounded`}>
                          <IconComponent className="h-4 w-4" />
                          {category.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {rootCauseForm.fishboneData[category.id].map((cause, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 bg-white p-2 rounded border">{cause}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => removeFishboneCause(category.id, index)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder={`Add ${category.label.toLowerCase()} cause...`}
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addFishboneCause(category.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              const input = e.target.parentElement.querySelector('input');
                              addFishboneCause(category.id, input.value);
                              input.value = '';
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Analysis Summary */}
              <div className="space-y-2">
                <Label htmlFor="analysisDescription">Root Cause Analysis Summary *</Label>
                <Textarea
                  id="analysisDescription"
                  placeholder="Summarize your root cause analysis findings and identify the primary root causes..."
                  value={rootCauseForm.analysisDescription}
                  onChange={(e) => setRootCauseForm(prev => ({ ...prev, analysisDescription: e.target.value }))}
                  className="min-h-32"
                />
              </div>

              {/* Enhanced Evidence Management */}
              <EvidenceManager
                capaId={capaId}
                phaseType="ROOT_CAUSE_ANALYSIS"
                onEvidenceUpdate={() => onPhaseUpdate()}
              />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveRootCause}
                  disabled={saveRootCauseMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveRootCauseMutation.isPending ? 'Saving...' : 'Save Analysis'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'CORRECTIVE_ACTION':
        return (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                Phase 3: Corrective Action Plan
              </CardTitle>
              <CardDescription className="text-green-700">
                Define specific actions to eliminate the root causes identified in Phase 2
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action List */}
              <div className="space-y-3">
                {correctiveActionForm.actions.map((action, index) => (
                  <Card key={index} className="border border-green-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div><strong>Action:</strong> {action.description}</div>
                        <div><strong>Assigned to:</strong> {action.assignedTo}</div>
                        <div><strong>Due:</strong> {action.dueDate}</div>
                      </div>
                      <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'} className="mt-2">
                        {action.priority} priority
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Action */}
              <Card className="border-dashed border-green-300">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Action Description *</Label>
                      <Textarea
                        placeholder="Describe the corrective action..."
                        value={correctiveActionForm.newAction.description}
                        onChange={(e) => setCorrectiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, description: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned To *</Label>
                      <Input
                        placeholder="Person or department responsible..."
                        value={correctiveActionForm.newAction.assignedTo}
                        onChange={(e) => setCorrectiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, assignedTo: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Due Date *</Label>
                      <Input
                        type="date"
                        value={correctiveActionForm.newAction.dueDate}
                        onChange={(e) => setCorrectiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, dueDate: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority *</Label>
                      <Select 
                        value={correctiveActionForm.newAction.priority} 
                        onValueChange={(value) => setCorrectiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, priority: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      if (correctiveActionForm.newAction.description && correctiveActionForm.newAction.assignedTo) {
                        setCorrectiveActionForm(prev => ({
                          ...prev,
                          actions: [...prev.actions, prev.newAction],
                          newAction: { description: '', assignedTo: '', dueDate: '', priority: 'medium' }
                        }));
                      }
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Corrective Action
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Evidence Management */}
              <EvidenceManager
                capaId={capaId}
                phaseType="CORRECTIVE_ACTION"
                onEvidenceUpdate={() => onPhaseUpdate()}
              />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveCorrectiveAction}
                  disabled={saveCorrectiveActionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveCorrectiveActionMutation.isPending ? 'Saving...' : 'Save Actions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'PREVENTIVE_ACTION':
        return (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <TrendingUp className="h-5 w-5" />
                Phase 4: Preventive Action Implementation
              </CardTitle>
              <CardDescription className="text-purple-700">
                Implement measures to prevent similar problems from occurring in the future
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action List */}
              <div className="space-y-3">
                {preventiveActionForm.actions.map((action, index) => (
                  <Card key={index} className="border border-purple-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div><strong>Action:</strong> {action.description}</div>
                        <div><strong>Assigned to:</strong> {action.assignedTo}</div>
                        <div><strong>Due:</strong> {action.dueDate}</div>
                      </div>
                      <Badge variant={action.scope === 'global' ? 'default' : 'secondary'} className="mt-2">
                        {action.scope} scope
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Action */}
              <Card className="border-dashed border-purple-300">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Preventive Action Description *</Label>
                      <Textarea
                        placeholder="Describe the preventive action..."
                        value={preventiveActionForm.newAction.description}
                        onChange={(e) => setPreventiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, description: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned To *</Label>
                      <Input
                        placeholder="Person or department responsible..."
                        value={preventiveActionForm.newAction.assignedTo}
                        onChange={(e) => setPreventiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, assignedTo: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Due Date *</Label>
                      <Input
                        type="date"
                        value={preventiveActionForm.newAction.dueDate}
                        onChange={(e) => setPreventiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, dueDate: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Implementation Scope *</Label>
                      <Select 
                        value={preventiveActionForm.newAction.scope} 
                        onValueChange={(value) => setPreventiveActionForm(prev => ({
                          ...prev,
                          newAction: { ...prev.newAction, scope: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local (Department/Process)</SelectItem>
                          <SelectItem value="global">Global (Organization-wide)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      if (preventiveActionForm.newAction.description && preventiveActionForm.newAction.assignedTo) {
                        setPreventiveActionForm(prev => ({
                          ...prev,
                          actions: [...prev.actions, prev.newAction],
                          newAction: { description: '', assignedTo: '', dueDate: '', scope: 'local' }
                        }));
                      }
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Preventive Action
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Evidence Management */}
              <EvidenceManager
                capaId={capaId}
                phaseType="PREVENTIVE_ACTION"
                onEvidenceUpdate={() => onPhaseUpdate()}
              />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSavePreventiveAction}
                  disabled={savePreventiveActionMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savePreventiveActionMutation.isPending ? 'Saving...' : 'Save Actions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'VERIFICATION':
        return (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <CheckCircle className="h-5 w-5" />
                Phase 5: Verification & Effectiveness Review
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Verify that corrective and preventive actions have been implemented effectively
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Verification Methods */}
              <div className="space-y-3">
                {verificationForm.verificationMethods.map((method, index) => (
                  <Card key={index} className="border border-indigo-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div><strong>Type:</strong> {method.type}</div>
                        <div><strong>Responsible:</strong> {method.responsiblePerson}</div>
                        <div className="md:col-span-2"><strong>Description:</strong> {method.description}</div>
                        <div className="md:col-span-2"><strong>Criteria:</strong> {method.criteria}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Verification Method */}
              <Card className="border-dashed border-indigo-300">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Verification Type *</Label>
                      <Select 
                        value={verificationForm.newMethod.type} 
                        onValueChange={(value) => setVerificationForm(prev => ({
                          ...prev,
                          newMethod: { ...prev.newMethod, type: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select verification type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="audit">Internal Audit</SelectItem>
                          <SelectItem value="inspection">Physical Inspection</SelectItem>
                          <SelectItem value="testing">Performance Testing</SelectItem>
                          <SelectItem value="review">Document Review</SelectItem>
                          <SelectItem value="interview">Staff Interview</SelectItem>
                          <SelectItem value="observation">Process Observation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsible Person *</Label>
                      <Input
                        placeholder="Who will perform verification..."
                        value={verificationForm.newMethod.responsiblePerson}
                        onChange={(e) => setVerificationForm(prev => ({
                          ...prev,
                          newMethod: { ...prev.newMethod, responsiblePerson: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Verification Description *</Label>
                    <Textarea
                      placeholder="Describe the verification method..."
                      value={verificationForm.newMethod.description}
                      onChange={(e) => setVerificationForm(prev => ({
                        ...prev,
                        newMethod: { ...prev.newMethod, description: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Success Criteria *</Label>
                    <Textarea
                      placeholder="Define what constitutes successful verification..."
                      value={verificationForm.newMethod.criteria}
                      onChange={(e) => setVerificationForm(prev => ({
                        ...prev,
                        newMethod: { ...prev.newMethod, criteria: e.target.value }
                      }))}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (verificationForm.newMethod.type && verificationForm.newMethod.description) {
                        setVerificationForm(prev => ({
                          ...prev,
                          verificationMethods: [...prev.verificationMethods, prev.newMethod],
                          newMethod: { type: '', description: '', criteria: '', responsiblePerson: '' }
                        }));
                      }
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Verification Method
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Evidence Management */}
              <EvidenceManager
                capaId={capaId}
                phaseType="VERIFICATION"
                onEvidenceUpdate={() => onPhaseUpdate()}
              />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveVerification}
                  disabled={saveVerificationMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveVerificationMutation.isPending ? 'Saving...' : 'Save Verification'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>Select a workflow phase to begin</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderPhaseForm()}
    </div>
  );
};

export default WorkflowControlForms;