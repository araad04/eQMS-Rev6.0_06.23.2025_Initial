import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ClipboardCheck, 
  Search, 
  Wrench, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  User 
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

// Define types for our component
type CapaWorkflow = {
  id: number;
  capaId: number;
  currentState: 'CORRECTION' | 'ROOT_CAUSE_ANALYSIS' | 'CORRECTIVE_ACTION' | 'EFFECTIVENESS_VERIFICATION';
  assignedTo: number;
  dueDate: string | null;
  transitionDate: string;
  transitionedBy: number;
  createdAt: string;
  updatedAt: string;
  history?: WorkflowHistoryItem[];
  assignedUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type WorkflowHistoryItem = {
  id: number;
  workflowId: number;
  fromState: string | null;
  toState: string;
  transitionDate: string;
  transitionedBy: number;
  comments: string | null;
  createdAt: string;
  transitionedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

interface CapaWorkflowStatusProps {
  capaId: number;
  onStateChange?: (newState: string) => void;
}

export const CapaWorkflowStatus: React.FC<CapaWorkflowStatusProps> = ({ 
  capaId,
  onStateChange
}) => {
  const [progressValue, setProgressValue] = useState(0);
  
  const { 
    data: workflow, 
    isLoading, 
    error,
    refetch 
  } = useQuery({ 
    queryKey: ['/api/capas', capaId, 'workflow'],
    queryFn: async () => {
      const response = await fetch(`/api/capas/${capaId}/workflow`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow data');
      }
      return response.json();
    }
  });

  // Get users for display purposes
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (workflow?.currentState) {
      // Calculate progress based on state
      const states = ['CORRECTION', 'ROOT_CAUSE_ANALYSIS', 'CORRECTIVE_ACTION', 'EFFECTIVENESS_VERIFICATION'];
      const currentIndex = states.indexOf(workflow.currentState);
      setProgressValue(((currentIndex + 1) / states.length) * 100);
    }
  }, [workflow]);

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'CORRECTION':
        return <ClipboardCheck className="h-5 w-5" />;
      case 'ROOT_CAUSE_ANALYSIS':
        return <Search className="h-5 w-5" />;
      case 'CORRECTIVE_ACTION':
        return <Wrench className="h-5 w-5" />;
      case 'EFFECTIVENESS_VERIFICATION':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const formatState = (state: string) => {
    return state
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'CORRECTION':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'ROOT_CAUSE_ANALYSIS':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'CORRECTIVE_ACTION':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'EFFECTIVENESS_VERIFICATION':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Find user by ID helper function
  const findUser = (userId: number) => {
    if (!users) return null;
    return users.find((user: any) => user.id === userId);
  };

  const handleStateChange = async (newState: string) => {
    try {
      const response = await fetch(`/api/capas/${capaId}/workflow/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: newState,
          comments: `Transitioned to ${formatState(newState)}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow state');
      }

      // Refetch workflow data after state change
      refetch();
      
      // Call parent callback if provided
      if (onStateChange) {
        onStateChange(newState);
      }
    } catch (error) {
      console.error('Error updating workflow state:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CAPA Workflow Status</CardTitle>
          <CardDescription>Loading workflow information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CAPA Workflow Status</CardTitle>
          <CardDescription className="text-red-500">Error loading workflow information. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CAPA Workflow Status</CardTitle>
          <CardDescription>No workflow information available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Helper function to get the next state in the workflow
  const getNextState = (currentState: string) => {
    const states = ['CORRECTION', 'ROOT_CAUSE_ANALYSIS', 'CORRECTIVE_ACTION', 'EFFECTIVENESS_VERIFICATION'];
    const currentIndex = states.indexOf(currentState);
    return currentIndex < states.length - 1 ? states[currentIndex + 1] : null;
  };

  // Get the next state
  const nextState = getNextState(workflow.currentState);

  // Get user information
  const assignedUser = workflow.assignedTo ? findUser(workflow.assignedTo) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>CAPA Workflow Status</CardTitle>
        <CardDescription>Current phase and history of this CAPA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current State */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Current Phase</h3>
            <div className="flex items-center space-x-2">
              <Badge 
                className={`${getStateColor(workflow.currentState)} text-white py-1 px-3`}
                variant="outline"
              >
                {getStateIcon(workflow.currentState)}
                <span className="ml-2">{formatState(workflow.currentState)}</span>
              </Badge>
              
              <div className="text-sm text-gray-500">
                Updated {formatDistanceToNow(new Date(workflow.transitionDate), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Progress</h3>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Correction</span>
              <span>Root Cause</span>
              <span>Action</span>
              <span>Verification</span>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Assigned To</h3>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${assignedUser?.firstName}+${assignedUser?.lastName}`} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Not assigned'}
                </p>
                {assignedUser && (
                  <p className="text-xs text-gray-500">{assignedUser.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Due Date */}
          {workflow.dueDate && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Due Date</h3>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{new Date(workflow.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Next Action (if available) */}
          {nextState && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Next Phase</h3>
              <button
                onClick={() => handleStateChange(nextState)}
                className={`inline-flex items-center text-sm px-3 py-1 rounded-md text-white ${getStateColor(nextState)}`}
              >
                Move to {formatState(nextState)} <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          )}

          {/* History */}
          {workflow.history && workflow.history.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Workflow History</h3>
                <div className="space-y-4">
                  {workflow.history.map((historyItem) => {
                    const transitionUser = historyItem.transitionedBy ? findUser(historyItem.transitionedBy) : null;
                    
                    return (
                      <div key={historyItem.id} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-0">
                        <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-primary"></div>
                        <div className="text-sm">
                          <div className="font-medium">
                            {historyItem.fromState 
                              ? `${formatState(historyItem.fromState)} → ${formatState(historyItem.toState)}` 
                              : `Initial state: ${formatState(historyItem.toState)}`}
                          </div>
                          {historyItem.comments && (
                            <p className="text-gray-600 mt-1">{historyItem.comments}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(historyItem.transitionDate), { addSuffix: true })}
                            {transitionUser && (
                              <span className="ml-2">by {transitionUser.firstName} {transitionUser.lastName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};