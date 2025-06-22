import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Loader2, 
  Edit, 
  ClipboardCheck, 
  CheckCircle, 
  Play, 
  Pause, 
  X, 
  Plus, 
  Calendar,
  FileBarChart,
  AlertCircle,
  Settings
} from "lucide-react";
import PageHeader from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { BadgeColored } from "@/components/ui/badge-colored";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBatchProcessStepSchema, insertBatchDeviationSchema } from "@shared/schema";
import { z } from "zod";

// Extended schema with validation rules
const processStepFormSchema = insertBatchProcessStepSchema.extend({
  stepNumber: z.number().min(1, {
    message: "Step number must be at least 1."
  }),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters."
  }),
});

const deviationFormSchema = insertBatchDeviationSchema.extend({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters."
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters."
  }),
  severity: z.string().min(1, {
    message: "Severity is required."
  }),
});

type ProcessStepFormValues = z.infer<typeof processStepFormSchema>;
type DeviationFormValues = z.infer<typeof deviationFormSchema>;

// Helper function to get the badge variant based on status
function getBatchStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'planned':
      return <BadgeColored variant="gray">{status}</BadgeColored>;
    case 'in-progress':
      return <BadgeColored variant="blue">{status}</BadgeColored>;
    case 'completed':
      return <BadgeColored variant="green">{status}</BadgeColored>;
    case 'on-hold':
      return <BadgeColored variant="yellow">{status}</BadgeColored>;
    case 'cancelled':
      return <BadgeColored variant="red">{status}</BadgeColored>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getStepStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return <BadgeColored variant="gray">{status}</BadgeColored>;
    case 'in-progress':
      return <BadgeColored variant="blue">{status}</BadgeColored>;
    case 'completed':
      return <BadgeColored variant="green">{status}</BadgeColored>;
    case 'deviation':
      return <BadgeColored variant="red">{status}</BadgeColored>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getDeviationSeverityBadge(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical':
      return <BadgeColored variant="red">{severity}</BadgeColored>;
    case 'major':
      return <BadgeColored variant="orange">{severity}</BadgeColored>;
    case 'minor':
      return <BadgeColored variant="yellow">{severity}</BadgeColored>;
    default:
      return <Badge>{severity}</Badge>;
  }
}

function getDeviationStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'open':
      return <BadgeColored variant="blue">{status}</BadgeColored>;
    case 'in-review':
      return <BadgeColored variant="orange">{status}</BadgeColored>;
    case 'approved':
      return <BadgeColored variant="purple">{status}</BadgeColored>;
    case 'closed':
      return <BadgeColored variant="green">{status}</BadgeColored>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const batchId = parseInt(params.id);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isProcessStepDialogOpen, setIsProcessStepDialogOpen] = useState(false);
  const [isDeviationDialogOpen, setIsDeviationDialogOpen] = useState(false);
  
  // Determine if user has edit rights
  const isReadOnly = false; // In the future, we'll get this from user permissions

  // Fetch batch data
  const { data: batch, isLoading: isLoadingBatch, error: batchError } = useQuery({
    queryKey: [`/api/production/batches/${batchId}`],
    queryFn: async () => {
      const response = await fetch(`/api/production/batches/${batchId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch batch data");
      }
      return response.json();
    },
  });

  // Fetch process steps for this batch
  const { data: processSteps = [], isLoading: isLoadingSteps } = useQuery({
    queryKey: [`/api/production/batches/${batchId}/steps`],
    queryFn: async () => {
      const response = await fetch(`/api/production/batches/${batchId}/steps`);
      if (!response.ok) {
        throw new Error("Failed to fetch process steps");
      }
      return response.json();
    },
    enabled: !isLoadingBatch && !!batch,
  });

  // Fetch deviations for this batch
  const { data: deviations = [], isLoading: isLoadingDeviations } = useQuery({
    queryKey: [`/api/production/batches/${batchId}/deviations`],
    queryFn: async () => {
      const response = await fetch(`/api/production/batches/${batchId}/deviations`);
      if (!response.ok) {
        throw new Error("Failed to fetch deviations");
      }
      return response.json();
    },
    enabled: !isLoadingBatch && !!batch,
  });

  // Fetch quality checks for this batch
  const { data: qualityChecks = [], isLoading: isLoadingQualityChecks } = useQuery({
    queryKey: [`/api/production/batches/${batchId}/quality-checks`],
    queryFn: async () => {
      const response = await fetch(`/api/production/batches/${batchId}/quality-checks`);
      if (!response.ok) {
        throw new Error("Failed to fetch quality checks");
      }
      return response.json();
    },
    enabled: !isLoadingBatch && !!batch,
  });

  // Fetch product data if batch is loaded
  const { data: product } = useQuery({
    queryKey: [`/api/production/products/${batch?.productId}`],
    queryFn: async () => {
      const response = await fetch(`/api/production/products/${batch.productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product data");
      }
      return response.json();
    },
    enabled: !!batch?.productId,
  });

  // Create process step mutation
  const createProcessStepMutation = useMutation({
    mutationFn: async (data: ProcessStepFormValues) => {
      const response = await apiRequest("POST", `/api/production/batches/${batchId}/steps`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/production/batches/${batchId}/steps`] });
      setIsProcessStepDialogOpen(false);
      toast({
        title: "Process step added",
        description: "The process step has been successfully added to the batch.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add process step",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create deviation mutation
  const createDeviationMutation = useMutation({
    mutationFn: async (data: DeviationFormValues) => {
      const response = await apiRequest("POST", `/api/production/batches/${batchId}/deviations`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/production/batches/${batchId}/deviations`] });
      setIsDeviationDialogOpen(false);
      toast({
        title: "Deviation reported",
        description: "The deviation has been successfully reported.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to report deviation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update batch status mutation
  const updateBatchStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/production/batches/${batchId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/production/batches/${batchId}`] });
      toast({
        title: "Batch status updated",
        description: "The batch status has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update batch status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process step form
  const processStepForm = useForm<ProcessStepFormValues>({
    resolver: zodResolver(processStepFormSchema),
    defaultValues: {
      batchId,
      stepNumber: processSteps.length + 1,
      description: "",
      expectedResult: "",
      status: "pending",
      notes: "",
    },
  });

  // Deviation form
  const deviationForm = useForm<DeviationFormValues>({
    resolver: zodResolver(deviationFormSchema),
    defaultValues: {
      batchId,
      title: "",
      description: "",
      severity: "minor",
      status: "open",
      impact: "",
      immediateActions: "",
    },
  });

  // Handle process step form submission
  function onProcessStepSubmit(data: ProcessStepFormValues) {
    createProcessStepMutation.mutate({
      ...data,
      batchId
    });
  }

  // Handle deviation form submission
  function onDeviationSubmit(data: DeviationFormValues) {
    createDeviationMutation.mutate({
      ...data,
      batchId
    });
  }

  // Loading state
  if (isLoadingBatch) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (batchError || !batch) {
    return (
      <div className="container py-8">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to load batch data: {batchError instanceof Error ? batchError.message : "Batch not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the batch details
  return (
    <div className="container py-6">
      <PageHeader
        title={`Batch: ${batch.batchNumber}`}
        description={product ? `Product: ${product.name}` : "Loading product details..."}
        actions={
          <div className="flex space-x-2">
            {!isReadOnly && (
              <>
                {batch.status === "planned" && (
                  <Button 
                    onClick={() => updateBatchStatusMutation.mutate("in-progress")}
                    variant="outline"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Production
                  </Button>
                )}
                
                {batch.status === "in-progress" && (
                  <>
                    <Button 
                      onClick={() => updateBatchStatusMutation.mutate("on-hold")}
                      variant="outline"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Production
                    </Button>
                    
                    <Button 
                      onClick={() => updateBatchStatusMutation.mutate("completed")}
                      variant="outline"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Batch
                    </Button>
                  </>
                )}
                
                {batch.status === "on-hold" && (
                  <Button 
                    onClick={() => updateBatchStatusMutation.mutate("in-progress")}
                    variant="outline"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Resume Production
                  </Button>
                )}
                
                {batch.status !== "cancelled" && batch.status !== "completed" && (
                  <Button 
                    onClick={() => updateBatchStatusMutation.mutate("cancelled")}
                    variant="outline"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Batch
                  </Button>
                )}
                
                <Link href={`/production/batches/${batchId}/edit`}>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                </Link>
              </>
            )}
          </div>
        }
      />

      <div className="flex items-center justify-between my-4">
        <div className="flex space-x-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <div className="mt-1">{getBatchStatusBadge(batch.status)}</div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Quantity</span>
            <span className="mt-1">{batch.quantity} {batch.uom}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Planned Start</span>
            <span className="mt-1">{format(new Date(batch.plannedStartDate), "MMM d, yyyy")}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Planned End</span>
            <span className="mt-1">{format(new Date(batch.plannedEndDate), "MMM d, yyyy")}</span>
          </div>
          
          {batch.actualStartDate && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Actual Start</span>
              <span className="mt-1">{format(new Date(batch.actualStartDate), "MMM d, yyyy")}</span>
            </div>
          )}
          
          {batch.actualEndDate && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Actual End</span>
              <span className="mt-1">{format(new Date(batch.actualEndDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="process-steps">Process Steps</TabsTrigger>
          <TabsTrigger value="deviations">Deviations</TabsTrigger>
          <TabsTrigger value="quality-checks">Quality Checks</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Overview</CardTitle>
              <CardDescription>
                Summary of the production batch and its current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {batch.notes && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Notes</h3>
                  <p className="text-muted-foreground">{batch.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Process Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-3xl font-bold">{processSteps.length}</div>
                        <p className="text-sm text-muted-foreground">Total Steps</p>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          {processSteps.filter((step: { status: string }) => step.status === 'completed').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("process-steps")}>
                      View Steps
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Deviations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-3xl font-bold">{deviations.length}</div>
                        <p className="text-sm text-muted-foreground">Total Deviations</p>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          {deviations.filter((dev: { status: string }) => dev.status === 'open').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Open</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("deviations")}>
                      View Deviations
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Quality Checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-3xl font-bold">{qualityChecks.length}</div>
                        <p className="text-sm text-muted-foreground">Total Checks</p>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">
                          {qualityChecks.filter((check: { status: string }) => check.status === 'passed').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Passed</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("quality-checks")}>
                      View Quality Checks
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Created:</span>
                        <span className="text-sm">{format(new Date(batch.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      {batch.actualStartDate && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Started:</span>
                          <span className="text-sm">{format(new Date(batch.actualStartDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {batch.actualEndDate && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Completed:</span>
                          <span className="text-sm">{format(new Date(batch.actualEndDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Process Steps Tab */}
        <TabsContent value="process-steps" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Process Steps</h2>
            {!isReadOnly && (
              <Dialog open={isProcessStepDialogOpen} onOpenChange={setIsProcessStepDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Process Step
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Process Step</DialogTitle>
                    <DialogDescription>
                      Add a new process step to the batch production workflow.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...processStepForm}>
                    <form onSubmit={processStepForm.handleSubmit(onProcessStepSubmit)} className="space-y-6">
                      <FormField
                        control={processStepForm.control}
                        name="stepNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Step Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={processStepForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the process step..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={processStepForm.control}
                        name="expectedResult"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Result</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="What is the expected outcome of this step?"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={processStepForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              defaultValue={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="deviation">Deviation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={processStepForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any additional notes about this step..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="submit"
                          disabled={createProcessStepMutation.isPending}
                        >
                          {createProcessStepMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Add Step
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {isLoadingSteps ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : processSteps.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-10">
                <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No process steps defined</p>
                <p className="text-sm text-muted-foreground max-w-md text-center mb-6">
                  No process steps have been defined for this batch yet.
                  {!isReadOnly && " Click the 'Add Process Step' button to add the first step."}
                </p>
                {!isReadOnly && (
                  <Button
                    onClick={() => setIsProcessStepDialogOpen(true)}
                    variant="outline"
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Process Step
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {processSteps
                .sort((a: { stepNumber: number }, b: { stepNumber: number }) => a.stepNumber - b.stepNumber)
                .map((step: { 
                  id: number; 
                  stepNumber: number; 
                  description: string; 
                  status: string; 
                  expectedResult?: string;
                  actualResult?: string;
                  notes?: string;
                  startedAt?: string | Date;
                  completedAt?: string | Date;
                  performedBy?: number | string;
                  verifiedBy?: number | string;
                }) => (
                  <Card key={step.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">Step {step.stepNumber}: {step.description}</CardTitle>
                        <div>{getStepStatusBadge(step.status)}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {step.expectedResult && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium">Expected Result</h4>
                          <p className="text-sm text-muted-foreground">{step.expectedResult}</p>
                        </div>
                      )}
                      
                      {step.actualResult && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium">Actual Result</h4>
                          <p className="text-sm text-muted-foreground">{step.actualResult}</p>
                        </div>
                      )}
                      
                      {step.notes && (
                        <div className="mb-2">
                          <h4 className="text-sm font-medium">Notes</h4>
                          <p className="text-sm text-muted-foreground">{step.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                        {step.startedAt && (
                          <div>Started: {format(new Date(step.startedAt), "MMM d, yyyy")}</div>
                        )}
                        {step.completedAt && (
                          <div>Completed: {format(new Date(step.completedAt), "MMM d, yyyy")}</div>
                        )}
                        {step.performedBy && (
                          <div>Performed by: User {step.performedBy}</div>
                        )}
                        {step.verifiedBy && (
                          <div>Verified by: User {step.verifiedBy}</div>
                        )}
                      </div>
                    </CardContent>
                    {!isReadOnly && (
                      <CardFooter className="border-t px-6 py-3">
                        <Link href={`/production/batches/${batchId}/steps/${step.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Update Status
                          </Button>
                        </Link>
                      </CardFooter>
                    )}
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
        
        {/* Deviations Tab */}
        <TabsContent value="deviations" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Deviations</h2>
            {!isReadOnly && (
              <Dialog open={isDeviationDialogOpen} onOpenChange={setIsDeviationDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Deviation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Deviation</DialogTitle>
                    <DialogDescription>
                      Report a new deviation for this batch.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...deviationForm}>
                    <form onSubmit={deviationForm.handleSubmit(onDeviationSubmit)} className="space-y-6">
                      <FormField
                        control={deviationForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief title of the deviation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deviationForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Detailed description of the deviation..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deviationForm.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <Select 
                              defaultValue={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="major">Major</SelectItem>
                                <SelectItem value="minor">Minor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deviationForm.control}
                        name="impact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impact</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="What is the impact of this deviation?"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deviationForm.control}
                        name="immediateActions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Immediate Actions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="What immediate actions were taken?"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDeviationDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createDeviationMutation.isPending}
                        >
                          {createDeviationMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Report Deviation
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {isLoadingDeviations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : deviations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No deviations reported</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                No deviations have been reported for this batch.
                {!isReadOnly && " Click the 'Report Deviation' button to report a deviation."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deviations.map((deviation: { 
                id: number; 
                title: string; 
                severity: string; 
                status: string; 
                description: string; 
                reportedAt?: string | Date;
                impact?: string;
                immediateActions?: string;
                correctiveActions?: string;
                rootCause?: string;
                reportedBy?: number | string;
                createdAt?: string | Date;
                reviewedBy?: number | string;
                approvedBy?: number | string;
              }) => (
                <Card key={deviation.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">{deviation.title}</CardTitle>
                      <div className="flex space-x-2">
                        {getDeviationSeverityBadge(deviation.severity)}
                        {getDeviationStatusBadge(deviation.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{deviation.description}</p>
                    
                    {deviation.impact && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium">Impact</h4>
                        <p className="text-sm text-muted-foreground">{deviation.impact}</p>
                      </div>
                    )}
                    
                    {deviation.immediateActions && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium">Immediate Actions</h4>
                        <p className="text-sm text-muted-foreground">{deviation.immediateActions}</p>
                      </div>
                    )}
                    
                    {deviation.correctiveActions && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium">Corrective Actions</h4>
                        <p className="text-sm text-muted-foreground">{deviation.correctiveActions}</p>
                      </div>
                    )}
                    
                    {deviation.rootCause && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium">Root Cause</h4>
                        <p className="text-sm text-muted-foreground">{deviation.rootCause}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                      <div>Reported by: User {deviation.reportedBy}</div>
                      <div>Reported: {format(new Date(deviation.createdAt), "MMM d, yyyy")}</div>
                      {deviation.reviewedBy && (
                        <div>Reviewed by: User {deviation.reviewedBy}</div>
                      )}
                      {deviation.approvedBy && (
                        <div>Approved by: User {deviation.approvedBy}</div>
                      )}
                    </div>
                  </CardContent>
                  {!isReadOnly && (
                    <CardFooter className="border-t px-6 py-3">
                      <Link href={`/production/batches/${batchId}/deviations/${deviation.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          View & Update
                        </Button>
                      </Link>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Quality Checks Tab */}
        <TabsContent value="quality-checks" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Quality Checks</h2>
            {!isReadOnly && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Quality Check
              </Button>
            )}
          </div>
          
          {isLoadingQualityChecks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : qualityChecks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-10">
                <FileBarChart className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No quality checks defined</p>
                <p className="text-sm text-muted-foreground max-w-md text-center mb-6">
                  No quality checks have been defined for this batch yet.
                  {!isReadOnly && " Click the 'Add Quality Check' button to add a check."}
                </p>
                {!isReadOnly && (
                  <Button
                    variant="outline"
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Quality Check
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p>Quality checks will be implemented in the next phase.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}