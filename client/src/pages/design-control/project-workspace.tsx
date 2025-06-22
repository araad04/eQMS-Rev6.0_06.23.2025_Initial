
import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Users, 
  Target,
  TrendingUp,
  Download
} from 'lucide-react';

interface ProjectWorkspaceProps {}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: projectArtifacts, isLoading } = useQuery({
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

  const { data: projectPhases } = useQuery({
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

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading project workspace...</div>;
  }

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Project {projectId} Workspace
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive view of all design control artifacts for this project
        </p>
      </div>

      {/* Project Phase Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Project Phases Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projectPhases?.phases?.map((phase: any) => (
              <div key={phase.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{phase.name}</h3>
                  {getStatusIcon(phase.status)}
                </div>
                <Badge className={getStatusBadge(phase.status)} variant="secondary">
                  {phase.status.replace('_', ' ')}
                </Badge>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Artifacts:</p>
                  <ul className="text-sm list-disc list-inside mt-1">
                    {phase.artifacts?.map((artifact: string, idx: number) => (
                      <li key={idx}>{artifact}</li>
                    ))}
                  </ul>
                </div>
                {phase.gateReview && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <p className="text-sm font-medium">Gate Review</p>
                    <p className="text-xs text-gray-600">
                      Status: {phase.gateReview.decision}
                      {phase.gateReview.completedDate && ` (${phase.gateReview.completedDate})`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Artifacts Tabs */}
      <Tabs defaultValue="urs" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="urs">URS Requirements</TabsTrigger>
          <TabsTrigger value="inputs">Design Inputs</TabsTrigger>
          <TabsTrigger value="outputs">Design Outputs</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="urs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                URS Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectArtifacts?.ursRequirements?.map((req: any) => (
                  <div key={req.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{req.ursId}: {req.title}</h3>
                        <p className="text-gray-600 mt-1">{req.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">{req.category}</Badge>
                          <Badge variant={req.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {req.priority}
                          </Badge>
                          <Badge className={getStatusBadge(req.status)}>
                            {req.status}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm"><strong>Acceptance Criteria:</strong> {req.acceptanceCriteria}</p>
                      <p className="text-sm mt-1"><strong>Stakeholder:</strong> {req.stakeholder}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inputs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Design Inputs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectArtifacts?.designInputs?.map((input: any) => (
                  <div key={input.inputId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{input.inputId}: {input.title}</h3>
                        <p className="text-gray-600 mt-1">{input.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={getStatusBadge(input.status)}>
                            {input.status}
                          </Badge>
                          <Badge variant={input.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                            Risk: {input.riskLevel}
                          </Badge>
                          {input.traceabilityComplete && (
                            <Badge variant="outline" className="text-green-600">
                              Traceability Complete
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-sm font-medium">Linked URS:</p>
                        <p className="text-sm text-gray-600">{input.linkedURS?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Linked Outputs:</p>
                        <p className="text-sm text-gray-600">{input.linkedOutputs?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Verification Plan:</p>
                        <p className="text-sm text-gray-600">{input.verificationPlan?.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outputs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectArtifacts?.designOutputs?.map((output: any) => (
                  <div key={output.outputId} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{output.outputId}: {output.title}</h3>
                    <p className="text-gray-600 mt-1">{output.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={getStatusBadge(output.verificationStatus)}>
                        Verification: {output.verificationStatus}
                      </Badge>
                      <Badge className={getStatusBadge(output.validationStatus)}>
                        Validation: {output.validationStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectArtifacts?.verificationActivities?.map((verification: any) => (
                  <div key={verification.verificationId} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{verification.verificationId}: {verification.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={getStatusBadge(verification.status)}>
                        {verification.status}
                      </Badge>
                      <Badge variant="outline">{verification.method}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Protocol: {verification.protocol}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectArtifacts?.validationActivities?.map((validation: any) => (
                  <div key={validation.validationId} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{validation.validationId}: {validation.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={getStatusBadge(validation.status)}>
                        {validation.status}
                      </Badge>
                      <Badge variant="outline">{validation.method}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Protocol: {validation.protocol}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectWorkspace;
