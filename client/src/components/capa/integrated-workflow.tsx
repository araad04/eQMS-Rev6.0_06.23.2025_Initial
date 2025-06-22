import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Target, Zap, TrendingUp, Clock, ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import WorkflowControlForms from './workflow-control-forms';

interface IntegratedWorkflowProps {
  capaId: number;
  onStateChange?: () => void;
}

const WORKFLOW_PHASES = [
  {
    id: 'CORRECTION',
    name: 'Immediate Correction',
    description: 'Document immediate actions taken to contain the problem',
    icon: AlertTriangle,
    color: 'border-red-300 bg-red-50 text-red-800',
    activeColor: 'border-red-500 bg-red-100'
  },
  {
    id: 'ROOT_CAUSE_ANALYSIS',
    name: 'Root Cause Analysis',
    description: 'Systematically identify root causes using fishbone analysis',
    icon: Target,
    color: 'border-blue-300 bg-blue-50 text-blue-800',
    activeColor: 'border-blue-500 bg-blue-100'
  },
  {
    id: 'CORRECTIVE_ACTION',
    name: 'Corrective Action',
    description: 'Implement actions to eliminate identified root causes',
    icon: CheckCircle2,
    color: 'border-green-300 bg-green-50 text-green-800',
    activeColor: 'border-green-500 bg-green-100'
  },
  {
    id: 'PREVENTIVE_ACTION',
    name: 'Preventive Action',
    description: 'Implement systematic changes to prevent similar issues',
    icon: TrendingUp,
    color: 'border-purple-300 bg-purple-50 text-purple-800',
    activeColor: 'border-purple-500 bg-purple-100'
  },
  {
    id: 'EFFECTIVENESS_VERIFICATION',
    name: 'Effectiveness Verification',
    description: 'Verify that implemented actions are effective',
    icon: Zap,
    color: 'border-orange-300 bg-orange-50 text-orange-800',
    activeColor: 'border-orange-500 bg-orange-100'
  }
];

export const IntegratedCapaWorkflow: React.FC<IntegratedWorkflowProps> = ({
  capaId,
  onStateChange
}) => {
  const [activePhase, setActivePhase] = useState('CORRECTION');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch CAPA workflow data
  const { data: workflow, isLoading } = useQuery({ 
    queryKey: ['/api/capas', capaId, 'workflow'],
    queryFn: async () => {
      const response = await fetch(`/api/capas/${capaId}/workflow`);
      if (!response.ok) throw new Error('Failed to fetch workflow');
      return response.json();
    }
  });

  // Phase transition mutation
  const transitionMutation = useMutation({
    mutationFn: async (data: { fromPhase: string; toPhase: string }) => {
      return apiRequest(`/api/capas/${capaId}/workflow/transition`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Phase transition completed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/capas', capaId, 'workflow'] });
      onStateChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to transition phase",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Loading workflow...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPhaseIndex = workflow?.currentState ? 
    WORKFLOW_PHASES.findIndex(p => p.id === workflow.currentState) : 0;
  
  const progressPercentage = ((currentPhaseIndex + 1) / WORKFLOW_PHASES.length) * 100;

  const canAdvanceToNext = (phaseId: string) => {
    const phaseIndex = WORKFLOW_PHASES.findIndex(p => p.id === phaseId);
    return phaseIndex <= currentPhaseIndex + 1;
  };

  const handlePhaseAdvance = () => {
    const currentIndex = WORKFLOW_PHASES.findIndex(p => p.id === activePhase);
    const nextPhase = WORKFLOW_PHASES[currentIndex + 1];
    
    if (nextPhase) {
      transitionMutation.mutate({
        fromPhase: activePhase,
        toPhase: nextPhase.id
      });
      setActivePhase(nextPhase.id);
    }
  };

  const isPhaseCompleted = (phaseId: string) => {
    const phaseIndex = WORKFLOW_PHASES.findIndex(p => p.id === phaseId);
    return phaseIndex < currentPhaseIndex;
  };

  const isPhaseActive = (phaseId: string) => {
    return workflow?.currentState === phaseId;
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-900">
            <TrendingUp className="h-6 w-6" />
            Integrated CAPA Workflow - Complete All Phases Here
          </CardTitle>
          <CardDescription className="text-blue-700">
            Complete your entire CAPA process within this integrated workflow interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Overall Progress</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* Phase Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {WORKFLOW_PHASES.map((phase, index) => {
                const Icon = phase.icon;
                const completed = isPhaseCompleted(phase.id);
                const active = isPhaseActive(phase.id);
                const available = canAdvanceToNext(phase.id);
                
                return (
                  <div
                    key={phase.id}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      completed ? 'border-green-500 bg-green-50' :
                      active ? phase.activeColor :
                      available ? 'border-gray-300 bg-gray-50 hover:border-gray-400' :
                      'border-gray-200 bg-gray-25 opacity-60'
                    }`}
                    onClick={() => available && setActivePhase(phase.id)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`p-2 rounded-full ${
                        completed ? 'bg-green-100' :
                        active ? 'bg-current bg-opacity-20' :
                        'bg-gray-100'
                      }`}>
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Icon className={`h-5 w-5 ${
                            active ? 'text-current' : 
                            available ? 'text-gray-600' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{phase.name}</p>
                        <Badge 
                          variant={completed ? "default" : active ? "secondary" : "outline"}
                          className="text-xs mt-1"
                        >
                          {completed ? 'Complete' : active ? 'Active' : available ? 'Available' : 'Locked'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrated Phase Completion Interface */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {WORKFLOW_PHASES.find(p => p.id === activePhase)?.icon && 
                  React.createElement(WORKFLOW_PHASES.find(p => p.id === activePhase)!.icon, { className: "h-5 w-5" })
                }
                {WORKFLOW_PHASES.find(p => p.id === activePhase)?.name}
              </CardTitle>
              <CardDescription>
                {WORKFLOW_PHASES.find(p => p.id === activePhase)?.description}
              </CardDescription>
            </div>
            
            {/* Phase Navigation Controls */}
            <div className="flex items-center gap-2">
              {activePhase !== 'EFFECTIVENESS_VERIFICATION' && (
                <Button
                  onClick={handlePhaseAdvance}
                  disabled={transitionMutation.isPending || !isPhaseActive(activePhase)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {transitionMutation.isPending ? 'Advancing...' : (
                    <>
                      Complete & Advance
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
              
              {activePhase === 'EFFECTIVENESS_VERIFICATION' && isPhaseActive(activePhase) && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Complete CAPA
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Integrated Phase Completion Forms */}
          <WorkflowControlForms
            capaId={capaId}
            currentPhase={activePhase}
            workflow={workflow}
            onPhaseUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/capas', capaId, 'workflow'] });
              queryClient.invalidateQueries({ queryKey: ['/api/capas', capaId] });
              onStateChange?.();
            }}
          />
        </CardContent>
      </Card>

      {/* Workflow Status Summary */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Workflow Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{currentPhaseIndex + 1}</p>
              <p className="text-sm text-blue-700">Current Phase</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{currentPhaseIndex}</p>
              <p className="text-sm text-green-700">Phases Completed</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{WORKFLOW_PHASES.length - currentPhaseIndex - 1}</p>
              <p className="text-sm text-orange-700">Phases Remaining</p>
            </div>
          </div>
          
          {workflow?.assignedTo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <strong>Assigned To:</strong> User {workflow.assignedTo}
              </p>
              <p className="text-sm">
                <strong>Last Updated:</strong> {workflow.updatedAt ? format(new Date(workflow.updatedAt), 'MMM d, yyyy h:mm a') : 'Not available'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegratedCapaWorkflow;