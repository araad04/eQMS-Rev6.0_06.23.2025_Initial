import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plane, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users, 
  Calendar,
  Shield,
  Cog,
  Target,
  BookOpen,
  ChevronRight
} from "lucide-react";
import PageHeader from "@/components/page-header";

interface EnhancedDesignProject {
  id: number;
  projectCode: string;
  title: string;
  description: string;
  objective: string;
  riskLevel: string;
  riskClass: string;
  regulatoryPathway: string;
  regulatoryImpact: boolean;
  hasSoftwareComponent: boolean;
  softwareClassification: string;
  overallProgress: number;
  startDate: string;
  targetCompletionDate: string;
  status: {
    id: number;
    name: string;
    description: string;
  };
  projectType: {
    id: number;
    name: string;
    code: string;
    requiresSoftwareLifecycle: boolean;
  };
  responsiblePerson: {
    id: number;
    firstName: string;
    lastName: string;
  };
  projectManager: {
    id: number;
    firstName: string;
    lastName: string;
  };
  phases: Array<{
    id: number;
    name: string;
    status: string;
    completionPercentage: number;
    as9100dClause: string;
  }>;
}

interface DesignPhase {
  id: number;
  name: string;
  description: string;
  orderIndex: number;
  isGate: boolean;
  as9100dClause: string;
  iso13485Clause: string;
  nadcapRequirement: string;
  status: string;
  completionPercentage: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  approver: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  approvedAt: string | null;
  approvalComments: string | null;
  deliverables: string[];
  entryExitCriteria: {
    entry: string[];
    exit: string[];
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'in_progress':
      return <Clock className="h-5 w-5 text-blue-600" />;
    case 'planned':
      return <Target className="h-5 w-5 text-yellow-600" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-gray-400" />;
  }
};

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'High':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function AerospaceDesignFlow() {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/design-projects-flow'],
  });

  const { data: phases, isLoading: phasesLoading } = useQuery({
    queryKey: ['/api/design-project-phases', 16],
    enabled: !!projects && projects.length > 0,
  });

  const { data: complianceMapping } = useQuery({
    queryKey: ['/api/design-compliance-mapping'],
  });

  if (projectsLoading || phasesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AS9100D Aerospace Design Control"
          description="Comprehensive aerospace component design control with AS9100D and NADCAP compliance"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading aerospace design control data...</p>
          </div>
        </div>
      </div>
    );
  }

  const project = projects?.[0] as EnhancedDesignProject;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AS9100D Aerospace Design Control"
        description="Comprehensive aerospace component design control with AS9100D and NADCAP compliance"
      />

      {/* Project Overview Card */}
      {project && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-900">{project.title}</CardTitle>
                  <CardDescription className="text-blue-700 font-medium">
                    {project.projectCode} • {project.projectType.name}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getRiskLevelColor(project.riskLevel)}>
                {project.riskLevel} Risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{project.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <div className="space-y-2">
                  <Progress value={project.overallProgress} className="h-3" />
                  <p className="text-sm text-gray-600">{project.overallProgress}% Complete</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Regulatory Pathway</p>
                <p className="text-sm text-gray-900">{project.regulatoryPathway}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Software Classification</p>
                <p className="text-sm text-gray-900">{project.softwareClassification}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Project Manager</p>
                <p className="text-sm text-gray-900">
                  {project.projectManager.firstName} {project.projectManager.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4" />
                <span>Target: {new Date(project.targetCompletionDate).toLocaleDateString()}</span>
              </div>
              {project.regulatoryImpact && (
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">Regulatory Impact</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="phases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="phases">Design Phases</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Mapping</TabsTrigger>
          <TabsTrigger value="workflow">Phase Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-6">
          {/* Phase Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cog className="h-5 w-5" />
                <span>AS9100D Design Phase Progress</span>
              </CardTitle>
              <CardDescription>
                Six-phase design control process per AS9100D:8.3 requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phases?.map((phase: DesignPhase) => (
                  <Card 
                    key={phase.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPhase === phase.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedPhase(phase.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(phase.status)}
                          <span className="font-medium text-sm">{phase.name}</span>
                        </div>
                        {phase.isGate && (
                          <Badge variant="outline" className="text-xs">Gate</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{phase.completionPercentage}%</span>
                        </div>
                        <Progress value={phase.completionPercentage} className="h-2" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">AS9100D Clause</p>
                        <p className="text-xs text-gray-900">{phase.as9100dClause}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">NADCAP Requirement</p>
                        <p className="text-xs text-gray-900">{phase.nadcapRequirement}</p>
                      </div>

                      {phase.status === 'completed' && phase.approvedAt && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">
                              Approved {new Date(phase.approvedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Phase Details */}
          {selectedPhase && phases && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Phase Details: {phases.find((p: DesignPhase) => p.id === selectedPhase)?.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const phase = phases.find((p: DesignPhase) => p.id === selectedPhase);
                  if (!phase) return null;

                  return (
                    <div className="space-y-6">
                      <p className="text-gray-700">{phase.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Key Deliverables</h4>
                          <ul className="space-y-1">
                            {phase.deliverables.map((deliverable, index) => (
                              <li key={index} className="flex items-center space-x-2 text-sm">
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                <span>{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Entry & Exit Criteria</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Entry Criteria</p>
                              <ul className="text-sm space-y-1">
                                {phase.entryExitCriteria.entry.map((criteria, index) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <div className="h-1 w-1 bg-green-600 rounded-full"></div>
                                    <span>{criteria}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Exit Criteria</p>
                              <ul className="text-sm space-y-1">
                                {phase.entryExitCriteria.exit.map((criteria, index) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <div className="h-1 w-1 bg-blue-600 rounded-full"></div>
                                    <span>{criteria}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Planned Timeline</p>
                          <p>Start: {new Date(phase.plannedStartDate).toLocaleDateString()}</p>
                          <p>End: {new Date(phase.plannedEndDate).toLocaleDateString()}</p>
                        </div>
                        
                        {phase.actualStartDate && (
                          <div>
                            <p className="font-medium text-gray-600">Actual Timeline</p>
                            <p>Started: {new Date(phase.actualStartDate).toLocaleDateString()}</p>
                            {phase.actualEndDate && (
                              <p>Completed: {new Date(phase.actualEndDate).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}
                        
                        <div>
                          <p className="font-medium text-gray-600">Compliance References</p>
                          <p>AS9100D: {phase.as9100dClause}</p>
                          <p>ISO 13485: {phase.iso13485Clause}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {complianceMapping && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AS9100D Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>AS9100D Compliance</span>
                  </CardTitle>
                  <CardDescription>
                    Aerospace Quality Management System requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(complianceMapping.as9100d).map(([clause, details]: [string, any]) => (
                      <div key={clause} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{clause}</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {details.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{details.title}</p>
                        <p className="text-xs text-gray-500">{details.implementation}</p>
                        {details.nadcapMapping && (
                          <p className="text-xs text-blue-600 mt-1">NADCAP: {details.nadcapMapping}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ISO 13485 Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    <span>ISO 13485 Compliance</span>
                  </CardTitle>
                  <CardDescription>
                    Medical Device Quality Management System requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(complianceMapping.iso13485).map(([clause, details]: [string, any]) => (
                      <div key={clause} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{clause}</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {details.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{details.title}</p>
                        <p className="text-xs text-gray-500">{details.implementation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Phase-Gate Workflow</span>
              </CardTitle>
              <CardDescription>
                Comprehensive design control workflow with mandatory phase gates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">AS9100D Design Control Process Overview:</p>
                  <p>
                    This enhanced design control process integrates AS9100D aerospace requirements with 
                    ISO 13485 medical device standards, providing comprehensive compliance for complex 
                    aerospace components that may have medical applications or require dual certification.
                  </p>
                </div>
                
                <Button className="w-full" variant="outline">
                  View Detailed Phase Actions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}