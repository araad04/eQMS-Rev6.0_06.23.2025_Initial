import { useState } from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Activity,
  AlertCircle,
  Bookmark,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Code,
  Download,
  File,
  FileText,
  Folder,
  GitBranch,
  Grid3X3,
  Info,
  Layers,
  Loader2,
  Plus,
  Settings,
  SplitSquareVertical,
  Target,
  User,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeColored } from "@/components/ui/badge-colored"; // Import BadgeColored
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageHeader from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define document types for design documents
type DesignDocument = {
  id: number;
  projectId: number;
  documentCode: string;
  title: string;
  description: string | null;
  documentType: string;
  version: string;
  status: string;
  filePath: string | null;
  approvedBy: number | null;
  approvalDate: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  creatorName?: string | null;
  approverName?: string | null;
};

// Define the Zod schema for document creation
const documentFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  documentType: z.string().min(1, { message: "Document type is required" }),
  version: z.string().min(1, { message: "Version is required" }),
  documentCode: z.string().optional(),
});

type FormValues = z.infer<typeof documentFormSchema>;

type DesignProject = {
  id: number;
  projectCode: string;
  title: string;
  description: string;
  statusId: number;
  statusName?: string;
  typeName?: string;
  riskClass: string;
  modelType: string;
  hasSoftwareComponent: boolean;
  startDate: string;
  targetCompletionDate: string;
  projectManagerName?: string;
  initiatedByName?: string;
  userNeedsCount: number;
  designInputsCount: number;
  designOutputsCount: number;
  verificationCount: number;
  validationCount: number;
  completionPercentage: number;
};

export default function DesignProjectDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Form for creating new documents
  const form = useForm<FormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      documentType: "specification",
      version: "1.0.0",
      documentCode: "",
    },
  });

  // Default project to show while loading
  const defaultProject: DesignProject = {
    id: parseInt(id || "0"),
    projectCode: "",
    title: "",
    description: "",
    statusId: 0,
    statusName: "",
    typeName: "",
    riskClass: "",
    modelType: "",
    hasSoftwareComponent: false,
    startDate: "",
    targetCompletionDate: "",
    projectManagerName: "",
    initiatedByName: "",
    userNeedsCount: 0,
    designInputsCount: 0,
    designOutputsCount: 0,
    verificationCount: 0,
    validationCount: 0,
    completionPercentage: 0
  };

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["/api/design/projects", id],
    queryFn: async () => {
      const res = await fetch(`/api/design/projects/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch project details");
      }
      return await res.json();
    }
  });

  // Query to fetch design documents
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["/api/design/projects", id, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/design/projects/${id}/documents`);
      if (!res.ok) {
        throw new Error("Failed to fetch project documents");
      }
      return await res.json();
    },
    enabled: !!id
  });
  
  // Mutation to create a new document
  const createDocumentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest(
        "POST", 
        `/api/design/projects/${id}/documents`,
        data
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create document");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Close dialog and reset form
      setIsDialogOpen(false);
      form.reset();
      
      // Show success toast and invalidate documents query
      toast({
        title: "Success",
        description: "Document created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/design/projects", id, "documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setSubmitting(true);
    createDocumentMutation.mutate(values);
  };
  
  // Use fetched data or default while loading
  const displayProject: DesignProject = project || defaultProject;

  function getStatusBadgeVariant(statusName: string | undefined) {
    switch (statusName) {
      case "Planning":
        return "outline";
      case "Design Input":
        return "secondary";
      case "Design Output":
        return "default";
      case "Verification":
        return "warning";
      case "Validation":
        return "success";
      case "Completed":
        return "success";
      default:
        return "outline";
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-2">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-lg font-medium">Failed to load design project</p>
        <p className="text-sm text-muted-foreground">
          There was an error loading the project. Please try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{displayProject.title} | Design Control | eQMS System</title>
        <meta
          name="description"
          content={`Design Control Project: ${displayProject.title}. Manage design and development activities with full ISO 13485:2016 compliance.`}
        />
      </Helmet>

      <PageHeader
        title={displayProject.title}
        description={displayProject.projectCode}
        backLink="/design-control"
        backLinkText="Back to Projects"
      >
        <div className="flex items-center space-x-2">
          <BadgeColored variant={getStatusBadgeVariant(displayProject.statusName)} className="h-6">
            {displayProject.statusName}
          </BadgeColored>
          <Link to={`/design-control/${id}/matrix`}>
            <Button variant="secondary" size="sm">
              <Grid3X3 className="h-3.5 w-3.5 mr-1" />
              View Design Matrix
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export DHF
          </Button>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Document
          </Button>
        </div>
      </PageHeader>

      <div className="px-4 md:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Completion</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayProject.completionPercentage}%</div>
              <Progress value={displayProject.completionPercentage} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayProject.statusName}</div>
              <p className="text-xs text-muted-foreground">
                Next: Design Output
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">96 days</div>
              <p className="text-xs text-muted-foreground">
                Target: {new Date(displayProject.targetCompletionDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Classification</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayProject.riskClass}</div>
              <p className="text-xs text-muted-foreground">
                {displayProject.hasSoftwareComponent ? "IEC 62304 Applicable" : "No Software"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-7 lg:w-[700px]">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="design_input">
              <FileText className="h-4 w-4 mr-2" />
              Design Input
            </TabsTrigger>
            <TabsTrigger value="design_output">
              <Folder className="h-4 w-4 mr-2" />
              Design Output
            </TabsTrigger>
            <TabsTrigger value="verification">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="validation">
              <Target className="h-4 w-4 mr-2" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="documents">
              <File className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="traceability">
              <SplitSquareVertical className="h-4 w-4 mr-2" />
              Traceability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Basic information about the design project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Project Code
                      </p>
                      <p>{displayProject.projectCode}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Type
                      </p>
                      <p>{displayProject.typeName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Start Date
                      </p>
                      <p>{new Date(displayProject.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Target Completion
                      </p>
                      <p>{new Date(displayProject.targetCompletionDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Development Model
                      </p>
                      <p>{displayProject.modelType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Software Component
                      </p>
                      <p>{displayProject.hasSoftwareComponent ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm">{displayProject.description}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Team & Approvals</CardTitle>
                  <CardDescription>
                    People involved in this design project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Initiated By
                    </p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p>{displayProject.initiatedByName}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Design Review Status
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">Planning Review</p>
                        </div>
                        <BadgeColored variant="success">Approved</BadgeColored>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">Design Input Review</p>
                        </div>
                        <BadgeColored variant="outline">Planned</BadgeColored>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Design Control Elements</CardTitle>
                <CardDescription>
                  Progress across the design control process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">User Needs</h4>
                      <BadgeColored variant="outline">{displayProject.userNeedsCount}</BadgeColored>
                    </div>
                    <Progress value={100} className="h-1" />
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">Design Inputs</h4>
                      <BadgeColored variant="outline">{displayProject.designInputsCount}</BadgeColored>
                    </div>
                    <Progress value={75} className="h-1" />
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">Design Outputs</h4>
                      <BadgeColored variant="outline">{displayProject.designOutputsCount}</BadgeColored>
                    </div>
                    <Progress value={35} className="h-1" />
                    <p className="text-xs text-muted-foreground">Started</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">Verification</h4>
                      <BadgeColored variant="outline">{displayProject.verificationCount}</BadgeColored>
                    </div>
                    <Progress value={10} className="h-1" />
                    <p className="text-xs text-muted-foreground">Early Stage</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">Validation</h4>
                      <BadgeColored variant="outline">{displayProject.validationCount}</BadgeColored>
                    </div>
                    <Progress value={0} className="h-1" />
                    <p className="text-xs text-muted-foreground">Not Started</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full p-1 bg-muted">
                        <File className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Design Input #DI-028 Added</p>
                        <p className="text-xs text-muted-foreground">Yesterday, 3:24 PM by Sarah Johnson</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="rounded-full p-1 bg-muted">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Design Review Scheduled</p>
                        <p className="text-xs text-muted-foreground">May 15, 2025 at 10:00 AM</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="rounded-full p-1 bg-muted">
                        <Settings className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Project Settings Updated</p>
                        <p className="text-xs text-muted-foreground">May 9, 2025 by System Administrator</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {displayProject.hasSoftwareComponent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Software Development</CardTitle>
                    <CardDescription>
                      IEC 62304 Software Lifecycle
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">Software Requirements</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-medium">23</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">Architecture Design</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-medium">2</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">Units/Modules</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-medium">8</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">Integration Tests</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-medium">4</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">Releases</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-medium">0</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="design_input" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Design Inputs</CardTitle>
                  <CardDescription>
                    Requirements for this medical device
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Design Input
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Design Input content will be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design_output" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Design Outputs</CardTitle>
                  <CardDescription>
                    Specifications and outputs of the design process
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Design Output
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Design Output content will be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Verification Activities</CardTitle>
                  <CardDescription>
                    Tests to confirm design input requirements are met
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Verification Plan
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Verification content will be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Validation Activities</CardTitle>
                  <CardDescription>
                    Testing to confirm the device meets user needs
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Validation Plan
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Validation content will be implemented</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Design Documents</CardTitle>
                  <CardDescription>
                    Project documents, specifications, and records
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Document</DialogTitle>
                      <DialogDescription>
                        Add a new document to the design project. Fill out the form below with the document details.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter document title" />
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
                                <Textarea 
                                  {...field} 
                                  placeholder="Enter document description"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="documentType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Document Type *</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="specification">Specification</SelectItem>
                                    <SelectItem value="plan">Plan</SelectItem>
                                    <SelectItem value="report">Report</SelectItem>
                                    <SelectItem value="procedure">Procedure</SelectItem>
                                    <SelectItem value="protocol">Protocol</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="version"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Version *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="1.0.0" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="documentCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Code</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Leave blank for auto-generated code" 
                                />
                              </FormControl>
                              <FormDescription>
                                If left blank, a code will be automatically generated
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            type="button" 
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Document
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {docsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.documentCode}</TableCell>
                            <TableCell>{doc.title}</TableCell>
                            <TableCell>
                              {doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1)}
                            </TableCell>
                            <TableCell>{doc.version}</TableCell>
                            <TableCell>
                              <BadgeColored variant={doc.status === "approved" ? "success" : "outline"}>
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </BadgeColored>
                            </TableCell>
                            <TableCell>{doc.creatorName || "-"}</TableCell>
                            <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <File className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No Documents</h3>
                    <p className="text-muted-foreground mt-2 mb-4 max-w-md">
                      There are no documents for this design project yet. Add a document to get started.
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="traceability" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Traceability Matrix</CardTitle>
                  <CardDescription>
                    End-to-end traceability for requirements
                  </CardDescription>
                </div>
                <Link to={`/design-matrix/${id}`}>
                  <Button>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Open Matrix
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-muted p-3 text-center font-medium text-sm rounded-t">User Needs</div>
                  <div className="bg-muted p-3 text-center font-medium text-sm rounded-t">Design Inputs</div>
                  <div className="bg-muted p-3 text-center font-medium text-sm rounded-t">Design Outputs</div>
                  <div className="bg-muted p-3 text-center font-medium text-sm rounded-t">Verifications</div>
                  <div className="bg-muted p-3 text-center font-medium text-sm rounded-t">Validations</div>
                  
                  <div className="border p-2 text-sm min-h-[40px]">
                    <div className="text-muted-foreground text-xs">UN Count: {displayProject.userNeedsCount || 0}</div>
                  </div>
                  <div className="border p-2 text-sm min-h-[40px]">
                    <div className="text-muted-foreground text-xs">DI Count: {displayProject.designInputsCount || 0}</div>
                  </div>
                  <div className="border p-2 text-sm min-h-[40px]">
                    <div className="text-muted-foreground text-xs">DO Count: {displayProject.designOutputsCount || 0}</div>
                  </div>
                  <div className="border p-2 text-sm min-h-[40px]">
                    <div className="text-muted-foreground text-xs">VER Count: {displayProject.verificationCount || 0}</div>
                  </div>
                  <div className="border p-2 text-sm min-h-[40px]">
                    <div className="text-muted-foreground text-xs">VAL Count: {displayProject.validationCount || 0}</div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Link to={`/design-matrix/${id}`}>
                    <Button variant="outline" size="sm">
                      <GitBranch className="h-4 w-4 mr-2" />
                      View Full Traceability Matrix
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}