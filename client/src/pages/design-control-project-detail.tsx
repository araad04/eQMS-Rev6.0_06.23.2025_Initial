import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Calendar,
  User,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  Settings,
  Upload,
  Download,
  BarChart3,
  Target,
  BookOpen,
  Shield,
  Eye,
  CheckSquare,
  ArrowRight,
  BarChart2,
  Plus,
  Filter,
  MoreVertical,
  Printer
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useReactToPrint } from 'react-to-print';

// Form schema for editing projects
const editProjectSchema = z.object({
  projectCode: z.string().min(1, "Project code is required"),
  description: z.string().min(1, "Description is required"),
  objective: z.string().optional(),
  projectTypeId: z.number(),
  statusId: z.number(),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"]),
  regulatoryImpact: z.boolean(),
  startDate: z.string(),
  targetCompletionDate: z.string(),
  notes: z.string().optional(),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface ProjectPhase {
  id: number;
  name: string;
  description: string;
  orderIndex: number;
  isGate: boolean;
  isoClause?: string;
  iecClause?: string;
  status: string;
  completionPercentage: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
}

interface DesignProject {
  id: number;
  projectCode: string;
  projectTypeId: number;
  description: string;
  objective?: string;
  statusId: number;
  initiatedBy: number;
  responsiblePerson: number;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  notes?: string;
  riskLevel: string;
  regulatoryImpact: boolean;
  hasSoftwareComponent: boolean;
  softwareClassification?: string;
  currentPhaseId?: number;
  overallProgress: number;
  budgetAllocated?: number;
  budgetSpent?: number;
  createdAt: string;
  updatedAt: string;
  projectType?: { id: number; name: string; code: string; description: string };
  status?: { id: number; name: string; description: string };
  responsiblePerson?: { id: number; firstName: string; lastName: string; username: string };
  projectManager?: { id: number; firstName: string; lastName: string; username: string };
  qualityLead?: { id: number; firstName: string; lastName: string; username: string };
  initiator?: { id: number; username: string; firstName: string; lastName: string };
  responsible?: { id: number; username: string; firstName: string; lastName: string };
}

interface ProjectType {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface ProjectStatus {
  id: number;
  name: string;
  description: string;
}

// Printable component for project report
const PrintableProjectReport = React.forwardRef<HTMLDivElement, { project: DesignProject; projectPhases: ProjectPhase[] }>(
  ({ project, projectPhases }, ref) => (
    <div ref={ref} className="print:p-8 print:text-black print:bg-white">
      <style>
        {`
          @media print {
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
            .print-avoid-break { page-break-inside: avoid; }
          }
        `}
      </style>
      
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-300 pb-4">
        <h1 className="text-2xl font-bold mb-2">Design Control Project Report</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Project Code:</strong> {project.projectCode}
          </div>
          <div>
            <strong>Generated:</strong> {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}
          </div>
          <div>
            <strong>Project Type:</strong> {project.projectType?.name}
          </div>
          <div>
            <strong>Status:</strong> {project.status?.name}
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="mb-6 print-avoid-break">
        <h2 className="text-xl font-semibold mb-3">Project Overview</h2>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div>
            <strong>Description:</strong> {project.description}
          </div>
          {project.objective && (
            <div>
              <strong>Objective:</strong> {project.objective}
            </div>
          )}
          <div>
            <strong>Risk Level:</strong> {project.riskLevel}
          </div>
          <div>
            <strong>Start Date:</strong> {format(new Date(project.startDate), "MMMM dd, yyyy")}
          </div>
          <div>
            <strong>Target Completion:</strong> {format(new Date(project.targetCompletionDate), "MMMM dd, yyyy")}
          </div>
          <div>
            <strong>Responsible Person:</strong> {project.responsible?.firstName} {project.responsible?.lastName}
          </div>
        </div>
      </div>

      {/* Design Flow Phases */}
      <div className="print-break">
        <h2 className="text-xl font-semibold mb-4">ISO 13485:2016 Design Control Flow</h2>
        <div className="space-y-4">
          {projectPhases.map((phase, index) => (
            <div key={phase.id} className="border border-gray-300 p-4 print-avoid-break">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-lg">
                  {index + 1}. {phase.name}
                  {phase.isGate && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">GATE</span>}
                </h3>
                <div className="text-sm">
                  <span className="font-medium">{phase.completionPercentage}% Complete</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{phase.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                <div>
                  <strong>Status:</strong> {phase.status.replace('_', ' ').toUpperCase()}
                </div>
                <div>
                  <strong>Order:</strong> {phase.orderIndex}
                </div>
                {phase.plannedStartDate && (
                  <div>
                    <strong>Planned Start:</strong> {format(new Date(phase.plannedStartDate), "MMM dd, yyyy")}
                  </div>
                )}
                {phase.plannedEndDate && (
                  <div>
                    <strong>Planned End:</strong> {format(new Date(phase.plannedEndDate), "MMM dd, yyyy")}
                  </div>
                )}
              </div>

              {(phase.isoClause || phase.iecClause) && (
                <div className="text-xs">
                  <strong>Compliance:</strong>
                  {phase.isoClause && <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded">ISO 13485: {phase.isoClause}</span>}
                  {phase.iecClause && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">IEC 62304: {phase.iecClause}</span>}
                </div>
              )}

              {/* Progress bar representation for print */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${phase.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="print-break">
        <h2 className="text-xl font-semibold mb-4">Project Summary</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Phase Statistics</h3>
            <div className="text-sm space-y-1">
              <div>Total Phases: {projectPhases.length}</div>
              <div>Completed: {projectPhases.filter(p => p.status.toLowerCase() === 'completed').length}</div>
              <div>In Progress: {projectPhases.filter(p => ['active', 'in_progress'].includes(p.status.toLowerCase())).length}</div>
              <div>Gate Reviews: {projectPhases.filter(p => p.isGate).length}</div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Overall Progress</h3>
            <div className="text-sm space-y-1">
              <div>Project Completion: {projectPhases.length > 0 ? Math.round(projectPhases.reduce((sum, p) => sum + p.completionPercentage, 0) / projectPhases.length) : 0}%</div>
              <div>ISO 13485 Phases: {projectPhases.filter(p => p.isoClause).length}</div>
              <div>IEC 62304 Phases: {projectPhases.filter(p => p.iecClause).length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex justify-between">
          <div>eQMS Design Control Report</div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </div>
  )
);

PrintableProjectReport.displayName = 'PrintableProjectReport';

export default function DesignControlProjectDetail() {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = React.useRef<HTMLDivElement>(null);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<DesignProject>({
    queryKey: [`/api/design-projects/${id}`],
  });

  // Fetch project phases (Design Flow core component)
  const { data: projectPhases = [], isLoading: phasesLoading } = useQuery<ProjectPhase[]>({
    queryKey: [`/api/design-project-phases/${id}`],
    enabled: !!id,
  });

  // Fetch project types
  const { data: projectTypes = [] } = useQuery<ProjectType[]>({
    queryKey: ["/api/design-project-types"],
  });

  // Fetch project statuses
  const { data: projectStatuses = [] } = useQuery<ProjectStatus[]>({
    queryKey: ["/api/design-project-statuses"],
  });

  // Form setup
  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: project ? {
      projectCode: project.projectCode,
      description: project.description,
      objective: project.objective || '',
      projectTypeId: project.projectTypeId,
      statusId: project.statusId,
      riskLevel: project.riskLevel as "Low" | "Medium" | "High" | "Critical",
      regulatoryImpact: project.regulatoryImpact,
      startDate: project.startDate.split('T')[0],
      targetCompletionDate: project.targetCompletionDate.split('T')[0],
      notes: project.notes || '',
    } : undefined,
  });

  // Update form when project data loads
  React.useEffect(() => {
    if (project) {
      form.reset({
        projectCode: project.projectCode,
        description: project.description,
        objective: project.objective || '',
        projectTypeId: project.projectTypeId,
        statusId: project.statusId,
        riskLevel: project.riskLevel as "Low" | "Medium" | "High" | "Critical",
        regulatoryImpact: project.regulatoryImpact,
        startDate: project.startDate.split('T')[0],
        targetCompletionDate: project.targetCompletionDate.split('T')[0],
        notes: project.notes || '',
      });
    }
  }, [project, form]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: EditProjectFormData) => {
      // Convert date strings to Date objects for the API
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        targetCompletionDate: new Date(data.targetCompletionDate).toISOString(),
      };
      return apiRequest("PUT", `/api/design-projects/${id}`, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-projects"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  // Update phase status mutation
  const updatePhaseStatusMutation = useMutation({
    mutationFn: ({ phaseId, status }: { phaseId: number; status: string }) => {
      return apiRequest("PATCH", `/api/design-project-phases/${phaseId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-project-phases/${id}`] });
      toast({
        title: "Success",
        description: "Phase status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update phase status",
        variant: "destructive",
      });
    },
  });

  // Initialize design flow mutation
  const initializeFlowMutation = useMutation({
    mutationFn: () => {
      return apiRequest("POST", `/api/design-projects/${id}/initialize-flow`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-project-phases/${id}`] });
      toast({
        title: "Success",
        description: "Design flow initialized with ISO 13485 phases",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initialize design flow",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProjectFormData) => {
    updateProjectMutation.mutate(data);
  };

  const handlePhaseStatusUpdate = (phaseId: number, newStatus: string) => {
    updatePhaseStatusMutation.mutate({ phaseId, status: newStatus });
  };

  const handleInitializeFlow = () => {
    initializeFlowMutation.mutate();
  };

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Design_Control_Report_${project?.projectCode}_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const handleCancel = () => {
    setIsEditing(false);
    if (project) {
      form.reset({
        projectCode: project.projectCode,
        description: project.description,
        objective: project.objective || '',
        projectTypeId: project.projectTypeId,
        statusId: project.statusId,
        riskLevel: project.riskLevel as "Low" | "Medium" | "High" | "Critical",
        regulatoryImpact: project.regulatoryImpact,
        startDate: project.startDate.split('T')[0],
        targetCompletionDate: project.targetCompletionDate.split('T')[0],
        notes: project.notes || '',
      });
    }
  };

  // Helper functions
  const getStatusColor = (statusId: number) => {
    const status = projectStatuses.find(s => s.id === statusId);
    switch (status?.name) {
      case 'Planning': return 'bg-gray-500';
      case 'Active': return 'bg-blue-500';
      case 'On Hold': return 'bg-yellow-500';
      case 'Review': return 'bg-purple-500';
      case 'Completed': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-700 bg-green-100';
      case 'Medium': return 'text-yellow-700 bg-yellow-100';
      case 'High': return 'text-orange-700 bg-orange-100';
      case 'Critical': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-purple-100 text-purple-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseIcon = (phaseName: string) => {
    switch (phaseName.toLowerCase()) {
      case 'project planning': return <Target className="h-4 w-4" />;
      case 'design input': return <FileText className="h-4 w-4" />;
      case 'design output': return <Upload className="h-4 w-4" />;
      case 'design review': return <Eye className="h-4 w-4" />;
      case 'verification': return <CheckSquare className="h-4 w-4" />;
      case 'validation': return <Shield className="h-4 w-4" />;
      case 'design transfer': return <ArrowRight className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (projectLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Project Not Found</h1>
          <p className="text-gray-600 mt-2">The requested design project could not be found.</p>
          <Button className="mt-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.projectCode}</h1>
            <p className="text-muted-foreground">{project.projectType?.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`text-white ${getStatusColor(project.statusId)}`}>
            {project.status?.name}
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={form.handleSubmit(onSubmit)} disabled={updateProjectMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateProjectMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="objective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objective</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Project Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="statusId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectStatuses.map((status) => (
                              <SelectItem key={status.id} value={status.id.toString()}>
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetCompletionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Completion Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      ) : (
        /* View Mode with Embedded Design Flow */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="design-flow">Design Flow</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="traceability">Traceability</TabsTrigger>
            <TabsTrigger value="reviews">Phase Gates</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                    <p className="mt-1">{project.description}</p>
                  </div>
                  {project.objective && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Objective</h4>
                      <p className="mt-1">{project.objective}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Risk Level</h4>
                    <Badge variant="outline" className={getRiskColor(project.riskLevel)}>
                      {project.riskLevel} Risk
                    </Badge>
                  </div>
                  {project.regulatoryImpact && (
                    <div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Regulatory Impact
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Start Date</h4>
                    <p className="mt-1">{format(new Date(project.startDate), "MMMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Target Completion</h4>
                    <p className="mt-1">{format(new Date(project.targetCompletionDate), "MMMM dd, yyyy")}</p>
                  </div>
                  {project.actualCompletionDate && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Actual Completion</h4>
                      <p className="mt-1">{format(new Date(project.actualCompletionDate), "MMMM dd, yyyy")}</p>
                    </div>
                  )}
                      <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Created</h4>
                    <p className="mt-1">{format(new Date(project.createdAt), "MMMM dd, yyyy")}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Team */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Project Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Initiated By</h4>
                    <p className="mt-1">
                      {project.initiator?.firstName} {project.initiator?.lastName} ({project.initiator?.username})
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Responsible Person</h4>
                    <p className="mt-1">
                      {project.responsible?.firstName} {project.responsible?.lastName} ({project.responsible?.username})
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {project.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{project.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Design Flow Tab - Core Component */}
          <TabsContent value="design-flow" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      ISO 13485:2016 Design Control Flow
                    </CardTitle>
                    <CardDescription>
                      Comprehensive design control workflow aligned with ISO 13485:2016 Clause 7.3 and IEC 62304 requirements
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {phasesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : projectPhases.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectPhases.map((phase) => (
                      <Card key={phase.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getPhaseIcon(phase.name)}
                              <CardTitle className="text-sm">{phase.name}</CardTitle>
                            </div>
                            {phase.isGate && (
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                                Gate
                              </Badge>
                            )}
                          </div>
                          <Badge className={`text-xs ${getPhaseStatusColor(phase.status)}`}>
                            {phase.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{phase.completionPercentage}%</span>
                            </div>
                            <Progress value={phase.completionPercentage} className="h-2" />
                          </div>
                          
                          {(phase.isoClause || phase.iecClause) && (
                            <div className="space-y-1">
                              {phase.isoClause && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  ISO 13485: {phase.isoClause}
                                </Badge>
                              )}
                              {phase.iecClause && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  IEC 62304: {phase.iecClause}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedPhase(phase.id === selectedPhase ? null : phase.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {phase.id === selectedPhase ? 'Hide' : 'View'}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Document Upload",
                                    description: "Document upload functionality would be implemented here",
                                  });
                                }}>
                                  <Upload className="h-3 w-3 mr-2" />
                                  Upload Documents
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  const newStatus = phase.status === 'completed' ? 'in_progress' : 'completed';
                                  handlePhaseStatusUpdate(phase.id, newStatus);
                                }}>
                                  <CheckSquare className="h-3 w-3 mr-2" />
                                  {phase.status === 'completed' ? 'Mark In Progress' : 'Mark Complete'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Phase Configuration",
                                    description: "Phase configuration panel would open here",
                                  });
                                }}>
                                  <Settings className="h-3 w-3 mr-2" />
                                  Configure
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                        {selectedPhase === phase.id && (
                          <CardContent className="border-t bg-gray-50 p-4">
                            <h4 className="font-medium text-sm mb-3">Phase Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Order:</span>
                                <span className="ml-2">{phase.orderIndex}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Type:</span>
                                <span className="ml-2">{phase.isGate ? 'Gate Review' : 'Work Phase'}</span>
                              </div>
                              {phase.plannedStartDate && (
                                <div>
                                  <span className="text-muted-foreground">Planned Start:</span>
                                  <span className="ml-2">{format(new Date(phase.plannedStartDate), "MMM dd, yyyy")}</span>
                                </div>
                              )}
                              {phase.plannedEndDate && (
                                <div>
                                  <span className="text-muted-foreground">Planned End:</span>
                                  <span className="ml-2">{format(new Date(phase.plannedEndDate), "MMM dd, yyyy")}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const newStatus = phase.status === 'completed' ? 'in_progress' : 'completed';
                                  handlePhaseStatusUpdate(phase.id, newStatus);
                                }}
                              >
                                {phase.status === 'completed' ? 'Reopen Phase' : 'Complete Phase'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  toast({
                                    title: "Documents",
                                    description: `${phase.name} documents would be displayed here`,
                                  });
                                }}
                              >
                                View Documents
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Design Phases Configured</h3>
                    <p className="text-gray-600 mb-4">Design phases will be automatically created based on the project type and regulatory requirements.</p>
                    <Button 
                      onClick={handleInitializeFlow}
                      disabled={initializeFlowMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {initializeFlowMutation.isPending ? 'Initializing...' : 'Initialize Design Flow'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value="phases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Phase Management</CardTitle>
                <CardDescription>Detailed phase tracking and management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectPhases.map((phase, index) => (
                    <div key={phase.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          phase.status === 'completed' ? 'bg-green-100' : 
                          phase.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            phase.status === 'completed' ? 'text-green-600' : 
                            phase.status === 'in_progress' ? 'text-blue-600' : 'text-gray-600'
                          }`}>{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{phase.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={`cursor-pointer ${getPhaseStatusColor(phase.status)}`}
                              onClick={() => {
                                const newStatus = phase.status === 'completed' ? 'in_progress' : 'completed';
                                handlePhaseStatusUpdate(phase.id, newStatus);
                              }}
                            >
                              {phase.status.replace('_', ' ')}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Phase Details",
                                    description: `Detailed view for ${phase.name} would open here`,
                                  });
                                }}>
                                  <Eye className="h-3 w-3 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Documents",
                                    description: `Document management for ${phase.name}`,
                                  });
                                }}>
                                  <Upload className="h-3 w-3 mr-2" />
                                  Manage Documents
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {phase.plannedStartDate && (
                            <span>Start: {format(new Date(phase.plannedStartDate), "MMM dd")}</span>
                          )}
                          {phase.plannedEndDate && (
                            <span>End: {format(new Date(phase.plannedEndDate), "MMM dd")}</span>
                          )}
                          <span>{phase.completionPercentage}% Complete</span>
                          {(phase.isoClause || phase.iecClause) && (
                            <div className="flex space-x-1">
                              {phase.isoClause && (
                                <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                  ISO {phase.isoClause}
                                </span>
                              )}
                              {phase.iecClause && (
                                <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  IEC {phase.iecClause}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end space-y-1">
                        <Progress value={phase.completionPercentage} className="w-20 h-2" />
                        <span className="text-xs text-gray-500">{phase.completionPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {projectPhases.length > 0 
                          ? Math.round(projectPhases.reduce((sum, p) => sum + p.completionPercentage, 0) / projectPhases.length)
                          : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Project Completion</p>
                    </div>
                    <Progress 
                      value={projectPhases.length > 0 
                        ? projectPhases.reduce((sum, p) => sum + p.completionPercentage, 0) / projectPhases.length
                        : 0} 
                      className="h-3" 
                    />
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Progress Report",
                            description: "Detailed progress report would be generated here",
                          });
                        }}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phase Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Phases</span>
                      <Badge variant="outline">{projectPhases.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <Badge className="bg-green-100 text-green-800">
                        {projectPhases.filter(p => p.status.toLowerCase() === 'completed').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Progress</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {projectPhases.filter(p => ['active', 'in_progress'].includes(p.status.toLowerCase())).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Gate Reviews</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {projectPhases.filter(p => p.isGate).length}
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('phases')}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View All Phases
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ISO 13485 Phases</span>
                      <Badge className="bg-green-100 text-green-800">
                        {projectPhases.filter(p => p.isoClause).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">IEC 62304 Phases</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {projectPhases.filter(p => p.iecClause).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Completion</span>
                      <span className="font-medium">
                        {projectPhases.length > 0 
                          ? Math.round(projectPhases.reduce((sum, p) => sum + p.completionPercentage, 0) / projectPhases.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Compliance Audit",
                            description: "Compliance audit trail would be displayed here",
                          });
                        }}
                      >
                        <Shield className="h-3 w-3 mr-2" />
                        Compliance Audit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Phase Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Phase Progress Timeline</CardTitle>
                <CardDescription>Visual timeline of design control phases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectPhases.map((phase, index) => (
                    <div key={phase.id} className="relative">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          phase.status === 'completed' ? 'bg-green-500 border-green-500' :
                          phase.status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                          'bg-gray-200 border-gray-300'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{phase.name}</span>
                            <span className="text-xs text-muted-foreground">{phase.completionPercentage}%</span>
                          </div>
                          <Progress value={phase.completionPercentage} className="h-2" />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newStatus = phase.status === 'completed' ? 'in_progress' : 'completed';
                            handlePhaseStatusUpdate(phase.id, newStatus);
                          }}
                        >
                          {phase.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </div>
                      {index < projectPhases.length - 1 && (
                        <div className="absolute left-2 top-6 w-0.5 h-6 bg-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Traceability Matrix Tab */}
          <TabsContent value="traceability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Design Traceability Matrix
                </CardTitle>
                <CardDescription>
                  Complete traceability from design inputs through design outputs, verification, and validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Traceability Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">12</div>
                      <div className="text-sm text-blue-600">Design Inputs</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">8</div>
                      <div className="text-sm text-green-600">Design Outputs</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">15</div>
                      <div className="text-sm text-purple-600">Verification Tests</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">6</div>
                      <div className="text-sm text-orange-600">Validation Studies</div>
                    </div>
                  </div>

                  {/* Traceability Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Input</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Output</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-4 text-sm">User Requirements</td>
                          <td className="px-4 py-4 text-sm">System Specifications</td>
                          <td className="px-4 py-4 text-sm">Requirements Review</td>
                          <td className="px-4 py-4 text-sm">User Acceptance Testing</td>
                          <td className="px-4 py-4">
                            <Badge className="bg-green-100 text-green-800">Complete</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 text-sm">Safety Requirements</td>
                          <td className="px-4 py-4 text-sm">Risk Analysis</td>
                          <td className="px-4 py-4 text-sm">Safety Testing</td>
                          <td className="px-4 py-4 text-sm">Clinical Validation</td>
                          <td className="px-4 py-4">
                            <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 text-sm">Performance Requirements</td>
                          <td className="px-4 py-4 text-sm">Technical Specifications</td>
                          <td className="px-4 py-4 text-sm">Performance Testing</td>
                          <td className="px-4 py-4 text-sm">Real-world Studies</td>
                          <td className="px-4 py-4">
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Traceability Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Matrix
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phase Gate Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Phase Gate Reviews
                </CardTitle>
                <CardDescription>
                  Mandatory review checkpoints between design phases for ISO 13485 compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Gate Review Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">3</div>
                      <div className="text-sm text-green-600">Completed Reviews</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">1</div>
                      <div className="text-sm text-blue-600">Upcoming Reviews</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">2</div>
                      <div className="text-sm text-orange-600">Review Actions</div>
                    </div>
                  </div>

                  {/* Gate Reviews List */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Design Input Gate Review</h4>
                        <Badge className="bg-green-100 text-green-800">Approved</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Critical review of design inputs before proceeding to design output phase
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Review Date:</span> March 15, 2025
                        </div>
                        <div>
                          <span className="font-medium">Approver:</span> Dr. Sarah Johnson
                        </div>
                        <div>
                          <span className="font-medium">Participants:</span> 5 reviewers
                        </div>
                        <div>
                          <span className="font-medium">Actions:</span> 2 resolved
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Review Report
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Design Output Gate Review</h4>
                        <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Comprehensive review of design outputs before verification phase
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Scheduled Date:</span> June 20, 2025
                        </div>
                        <div>
                          <span className="font-medium">Lead Reviewer:</span> TBD
                        </div>
                        <div>
                          <span className="font-medium">Prerequisites:</span> Design outputs complete
                        </div>
                        <div>
                          <span className="font-medium">Deliverables:</span> 8 documents
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure Review
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Verification Gate Review</h4>
                        <Badge className="bg-yellow-100 text-yellow-800">Action Required</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Critical review pending resolution of 2 verification test failures
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Target Date:</span> August 15, 2025
                        </div>
                        <div>
                          <span className="font-medium">Blocking Issues:</span> 2 test failures
                        </div>
                        <div>
                          <span className="font-medium">Assigned To:</span> Engineering Team
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span> High
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button variant="destructive" size="sm">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Resolve Issues
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Actions
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Gate Review
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Review Metrics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {/* Hidden printable component */}
        <div className="hidden">
          {project && projectPhases && (
            <PrintableProjectReport 
              ref={printRef}
              project={project}
              projectPhases={projectPhases}
            />
          )}
        </div>
    </div>
  );
}