import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Shield, 
  Code, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Settings, 
  Bug, 
  TestTube,
  Plus,
  Eye,
  Download,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Software Project Form Schema
const softwareProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  classificationId: z.number().min(1, "Classification is required"),
  productFamily: z.string().optional(),
  intendedUse: z.string().min(1, "Intended use is required"),
  operatingEnvironment: z.string().min(1, "Operating environment is required"),
  softwareType: z.string().min(1, "Software type is required"),
  version: z.string().min(1, "Version is required"),
  projectManager: z.number().min(1, "Project manager is required"),
  createdBy: z.number().min(1, "Created by is required"),
});

type SoftwareProjectForm = z.infer<typeof softwareProjectSchema>;

export default function SoftwareLifecycleManagement() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize software classifications
  const initClassificationsMutation = useMutation({
    mutationFn: () => fetch('/api/software/initialize-classifications', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Local': 'true'
      }
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Classifications Initialized",
        description: "IEC 62304 software classifications have been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/software/classifications'] });
    },
    onError: () => {
      toast({
        title: "Initialization Failed",
        description: "Unable to initialize software classifications. Please check server connectivity.",
        variant: "destructive",
      });
    },
  });

  // Fetch software classifications
  const { data: classifications } = useQuery({
    queryKey: ['/api/software/classifications'],
    queryFn: () => fetch('/api/software/classifications', {
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Local': 'true'
      }
    }).then(res => res.json()),
  });

  // Fetch software projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/software/projects'],
    queryFn: () => fetch('/api/software/projects', {
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Local': 'true'
      }
    }).then(res => res.json()),
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: SoftwareProjectForm) => 
      fetch('/api/software/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Software Project Created",
        description: "IEC 62304 software project has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/software/projects'] });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Creation Failed", 
        description: "Unable to create software project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch project details when selected
  const { data: projectDetails } = useQuery({
    queryKey: ['/api/software/projects', selectedProject],
    queryFn: () => fetch(`/api/software/projects/${selectedProject}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Local': 'true'
      }
    }).then(res => res.json()),
    enabled: !!selectedProject,
  });

  // Fetch compliance report for selected project
  const { data: complianceReport } = useQuery({
    queryKey: ['/api/software/projects', selectedProject, 'compliance-report'],
    queryFn: () => fetch(`/api/software/projects/${selectedProject}/compliance-report`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Local': 'true'
      }
    }).then(res => res.json()),
    enabled: !!selectedProject,
  });

  const form = useForm<SoftwareProjectForm>({
    resolver: zodResolver(softwareProjectSchema),
    defaultValues: {
      createdBy: 9999, // Current user ID
      projectManager: 9999,
    },
  });

  const onSubmit = (data: SoftwareProjectForm) => {
    createProjectMutation.mutate(data);
  };

  const getClassificationBadge = (classification: string, riskLevel: string) => {
    const variants = {
      'Class A': 'bg-green-100 text-green-800 border-green-200',
      'Class B': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Class C': 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <Badge className={variants[classification as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {classification} ({riskLevel})
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      planning: 'bg-blue-100 text-blue-800',
      development: 'bg-orange-100 text-orange-800',
      testing: 'bg-purple-100 text-purple-800',
      released: 'bg-green-100 text-green-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IEC 62304 Software Lifecycle Management</h2>
          <p className="text-muted-foreground">
            Comprehensive software safety classification, risk analysis, and lifecycle management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => initClassificationsMutation.mutate()}
            disabled={initClassificationsMutation.isPending}
          >
            <Settings className="h-4 w-4 mr-2" />
            Initialize Classifications
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Software Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Software Project</DialogTitle>
                <DialogDescription>
                  Create a new IEC 62304 compliant software project with proper safety classification
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Version</FormLabel>
                          <FormControl>
                            <Input placeholder="1.0.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the software project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="classificationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IEC 62304 Classification</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select classification" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classifications?.map((classification: any) => (
                                <SelectItem key={classification.id} value={classification.id.toString()}>
                                  {classification.name} - {classification.riskLevel}
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
                      name="softwareType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Software Type</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Standalone">Standalone Software</SelectItem>
                              <SelectItem value="Embedded">Embedded Software</SelectItem>
                              <SelectItem value="SaMD">Software as Medical Device</SelectItem>
                              <SelectItem value="Component">Software Component</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="intendedUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intended Use</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the intended use of the software" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingEnvironment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Environment</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the operating environment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Family</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product family" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProjectMutation.isPending}>
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Software Projects Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IEC 62304 Software Projects
          </CardTitle>
          <CardDescription>
            Medical device software projects with safety classification and lifecycle management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Loading software projects...</span>
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="text-center py-12">
              <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Software Projects</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first IEC 62304 compliant software project to start managing software lifecycle processes.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Software Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project: any) => (
                  <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {project.projectId} • v{project.version}
                          </div>
                        </div>
                        {getClassificationBadge(project.classification, project.classificationRiskLevel)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Type:</span>
                          <span className="text-sm font-medium">{project.softwareType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getStatusBadge(project.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Manager:</span>
                          <span className="text-sm font-medium">
                            {project.projectManager} {project.projectManagerLastName}
                          </span>
                        </div>
                        <Button
                          className="w-full mt-4"
                          variant="outline"
                          onClick={() => setSelectedProject(project.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IEC 62304 Classification Information */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Class A Software
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Non-safety software that is not intended to harm the patient or operator
            </p>
            <div className="space-y-2 text-sm">
              <div>• Software development planning</div>
              <div>• Software requirements analysis</div>
              <div>• Software architectural design</div>
              <div>• Integration and system testing</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Class B Software
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Non-life-threatening software that could cause harm but not death
            </p>
            <div className="space-y-2 text-sm">
              <div>• All Class A requirements</div>
              <div>• Software detailed design</div>
              <div>• Software implementation</div>
              <div>• Configuration management</div>
              <div>• Problem resolution</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-600" />
              Class C Software
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Life-threatening software that could result in death or serious injury
            </p>
            <div className="space-y-2 text-sm">
              <div>• All Class A & B requirements</div>
              <div>• Comprehensive risk management</div>
              <div>• Software maintenance</div>
              <div>• Rigorous testing protocols</div>
              <div>• Formal change control</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Software Lifecycle Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Software Lifecycle Processes
          </CardTitle>
          <CardDescription>
            Key processes required for IEC 62304 compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Requirements</h4>
              <p className="text-sm text-muted-foreground">Software requirements analysis and management</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Risk Analysis</h4>
              <p className="text-sm text-muted-foreground">ISO 14971 integrated risk management</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Configuration</h4>
              <p className="text-sm text-muted-foreground">Software configuration management</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TestTube className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Testing</h4>
              <p className="text-sm text-muted-foreground">Verification and validation testing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}