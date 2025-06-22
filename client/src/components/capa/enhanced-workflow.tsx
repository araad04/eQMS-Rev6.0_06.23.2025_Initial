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
import WorkflowControlForms from './workflow-control-forms';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  TrendingUp,
  Search,
  Target,
  Shield,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedCapaWorkflowProps {
  capaId: number;
  onStateChange?: (newState: string) => void;
}

// Define the 5-phase CAPA workflow states
const CAPA_PHASES = [
  {
    id: 'CORRECTION',
    name: 'Phase 1: Immediate Correction',
    description: 'Address immediate issue and contain risk',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    id: 'ROOT_CAUSE_ANALYSIS', 
    name: 'Phase 2: Root Cause Analysis',
    description: 'Investigate and identify true root cause',
    icon: Search,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    id: 'CORRECTIVE_ACTION',
    name: 'Phase 3: Corrective Action',
    description: 'Implement systematic corrective measures',
    icon: Target,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'PREVENTIVE_ACTION',
    name: 'Phase 4: Preventive Action', 
    description: 'Prevent recurrence across similar processes',
    icon: Shield,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'EFFECTIVENESS_VERIFICATION',
    name: 'Phase 5: Effectiveness Verification',
    description: 'Verify actions are effective and sustainable',
    icon: Award,
    color: 'bg-green-100 text-green-800 border-green-200'
  }
];

export const EnhancedCapaWorkflow: React.FC<EnhancedCapaWorkflowProps> = ({ 
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
      if (!response.ok) {
        throw new Error('Failed to fetch workflow data');
      }
      return response.json();
    }
  });

  // Get users for assignment
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Phase transition mutation
  const transitionMutation = useMutation({
    mutationFn: async ({ nextPhase, comments }: { nextPhase: string, comments?: string }) => {
      const response = await fetch(`/api/capas/${capaId}/workflow/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextPhase, comments })
      });
      if (!response.ok) throw new Error('Failed to transition phase');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Phase Transition Successful",
        description: `CAPA moved to ${data.currentState} phase`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/capas', capaId, 'workflow'] });
      onStateChange?.(data.currentState);
    },
    onError: () => {
      toast({
        title: "Transition Failed",
        description: "Unable to move to next phase",
        variant: "destructive",
      });
    }
  });

  const currentPhaseIndex = CAPA_PHASES.findIndex(p => p.id === (workflow?.currentState || 'CORRECTION'));
  const progressPercentage = ((currentPhaseIndex + 1) / CAPA_PHASES.length) * 100;

  const canTransitionToNext = () => {
    return currentPhaseIndex < CAPA_PHASES.length - 1;
  };

  const handlePhaseTransition = () => {
    if (canTransitionToNext()) {
      const nextPhase = CAPA_PHASES[currentPhaseIndex + 1].id;
      transitionMutation.mutate({ 
        nextPhase,
        comments: `Transitioned from ${workflow?.currentState} to ${nextPhase}` 
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPhase = CAPA_PHASES[currentPhaseIndex];

  return (
    <div className="space-y-6">
      {/* Header Card with Progress */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TrendingUp className="h-6 w-6" />
            5-Phase CAPA Workflow - ISO 13485 Compliant
          </CardTitle>
          <CardDescription className="text-blue-700">
            Systematic approach to corrective and preventive action implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Overall Progress</span>
              <span className="text-sm text-blue-600">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Current Phase Status */}
      <Card className={`border-2 ${currentPhase?.color}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {currentPhase?.icon && <currentPhase.icon className="h-6 w-6" />}
            Current Phase: {currentPhase?.name}
          </CardTitle>
          <CardDescription>
            {currentPhase?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Assigned To:</strong> {workflow?.assignedTo ? `User ${workflow.assignedTo}` : 'Unassigned'}
              </p>
              <p className="text-sm">
                <strong>Phase Started:</strong> {workflow?.updatedAt ? format(new Date(workflow.updatedAt), 'MMM d, yyyy') : 'Not started'}
              </p>
            </div>
            {canTransitionToNext() && (
              <Button 
                onClick={handlePhaseTransition}
                disabled={transitionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {transitionMutation.isPending ? 'Transitioning...' : `Advance to ${CAPA_PHASES[currentPhaseIndex + 1]?.name.split(':')[1]}`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Overview */}
      <Card>
        <CardHeader>
          <CardTitle>CAPA Workflow Phases</CardTitle>
          <CardDescription>Track progress through each phase of the corrective and preventive action process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPA_PHASES.map((phase, index) => {
              const Icon = phase.icon;
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              
              return (
                <div
                  key={phase.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCompleted 
                      ? 'bg-green-50 border-green-200' 
                      : isCurrent
                      ? phase.color
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      isCompleted 
                        ? 'bg-green-100' 
                        : isCurrent
                        ? 'bg-current bg-opacity-20'
                        : 'bg-gray-100'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className={`h-5 w-5 ${
                          isCurrent ? 'text-current' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">
                        Phase {index + 1}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {phase.name.split(':')[1]?.trim()}
                      </p>
                      <Badge 
                        variant={isCompleted ? "default" : isCurrent ? "secondary" : "outline"}
                        className="mt-2 text-xs"
                      >
                        {isCompleted ? 'Complete' : isCurrent ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase-Specific Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Requirements & Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="grid w-full grid-cols-5">
              {CAPA_PHASES.map((phase, index) => (
                <TabsTrigger key={phase.id} value={phase.id} className="text-xs">
                  Phase {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="CORRECTION" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-red-800">Immediate Correction Requirements:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    Implement immediate containment actions to prevent further impact
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    Document the immediate corrective measures taken
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    Assess and document any customer or regulatory notification requirements
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    Verify correction effectiveness before advancing to RCA
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="ROOT_CAUSE_ANALYSIS" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-yellow-800">Root Cause Analysis Requirements:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    Use systematic RCA methodology (5-Why, Fishbone, Fault Tree Analysis)
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    Involve cross-functional team in root cause investigation
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    Document evidence and rationale for identified root cause
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    Validate root cause through data analysis and testing
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="CORRECTIVE_ACTION" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-blue-800">Corrective Action Requirements:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Develop specific actions to eliminate identified root cause
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Assign responsible parties and target completion dates
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Update relevant procedures, work instructions, or controls
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    Provide training if process or procedure changes are required
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="PREVENTIVE_ACTION" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800">Preventive Action Requirements:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    Identify similar processes/products that could be affected
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    Implement preventive controls across similar areas
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    Update risk management documentation as appropriate
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    Establish monitoring mechanisms to detect early warning signs
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="EFFECTIVENESS_VERIFICATION" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-green-800">Effectiveness Verification Requirements:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    Define measurable criteria for effectiveness verification
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    Collect objective evidence over sufficient time period
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    Review data trends and statistical analysis where applicable
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    Document conclusion and close CAPA with appropriate approvals
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};