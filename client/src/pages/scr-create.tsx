import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Helmet } from "react-helmet";
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSupplierCorrectiveRequestSchema } from "@shared/schema";
import { z } from "zod";

// Define severity levels
const SEVERITY_LEVELS = [
  { id: "Critical", label: "Critical - Significant impact to product quality or safety" },
  { id: "Major", label: "Major - Systemic issue affecting quality system effectiveness" },
  { id: "Minor", label: "Minor - Isolated issue with limited quality impact" },
];

// Extend the schema with frontend validation
const createScrSchema = insertSupplierCorrectiveRequestSchema.extend({
  dueDate: z.date({
    required_error: "Due date is required",
  }),
});

type CreateScrFormValues = z.infer<typeof createScrSchema>;

export default function ScrCreatePage() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("details");
  const auditId = parseInt(id);

  // Fetch audit details
  const { data: audit, isLoading: isLoadingAudit } = useQuery({
    queryKey: [`/api/audits/${auditId}`],
    enabled: !isNaN(auditId),
  });

  // Fetch audit checklist items to select a finding
  const { data: checklistItems = [], isLoading: isLoadingChecklist } = useQuery({
    queryKey: [`/api/audits/${auditId}/checklist`],
    enabled: !isNaN(auditId),
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    retry: 1,
  });

  // Fetch users for assignee dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: 1,
  });

  // Generate a SCR ID based on the audit ID
  const generateScrId = () => {
    return audit ? `SCR-${audit.auditId}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : "";
  };

  // Default form values
  const defaultValues: Partial<CreateScrFormValues> = {
    title: "",
    description: "",
    scrId: generateScrId(),
    statusId: 1, // Default to "Open"
    auditId,
    supplierId: audit?.supplierId,
    severity: "Major",
    responseRequired: true,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default to 14 days from now
    initiatedBy: 1, // Default to first user
  };

  // Initialize the form
  const form = useForm<CreateScrFormValues>({
    resolver: zodResolver(createScrSchema),
    defaultValues,
    mode: "onChange",
  });

  // Create SCR mutation
  const createScrMutation = useMutation({
    mutationFn: async (data: CreateScrFormValues) => {
      // Format dates for API
      const formattedData = {
        ...data,
        dueDate: data.dueDate.toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/scr", formattedData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "SCR Created",
        description: "The Supplier Corrective Request has been created successfully.",
      });
      
      // Invalidate SCR and audit queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/scr"] });
      queryClient.invalidateQueries({ queryKey: [`/api/audits/${auditId}`] });
      
      // Navigate to the audit detail page
      navigate(`/audit-detail/${auditId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating SCR",
        description: error.message || "Failed to create Supplier Corrective Request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: CreateScrFormValues) => {
    createScrMutation.mutate(data);
  };

  // Loading state
  if (isLoadingAudit) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Supplier Corrective Request | Medical Device eQMS</title>
        <meta name="description" content="Issue a supplier corrective request based on audit findings" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <PageHeader
          title="Create Supplier Corrective Request"
          description={`For Audit: ${audit?.title || 'Loading...'}`}
          className="gradient-header mb-6"
        >
          <Button variant="outline" onClick={() => navigate(`/audit-detail/${auditId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit
          </Button>
        </PageHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">SCR Details</TabsTrigger>
                <TabsTrigger value="response">Response Requirements</TabsTrigger>
              </TabsList>
              
              <Card>
                <CardContent className="pt-6">
                  <TabsContent value="details" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="scrId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SCR ID <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter SCR ID" {...field} />
                            </FormControl>
                            <FormDescription>
                              Unique identifier for this corrective request
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter SCR title" {...field} />
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
                          <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the nonconformity or issue requiring supplier action"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier <span className="text-destructive">*</span></FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers.length > 0 ? (
                                  suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <>
                                    <SelectItem value="1">Acme Medical Supplies</SelectItem>
                                    <SelectItem value="2">MedTech Systems Inc.</SelectItem>
                                    <SelectItem value="3">Bio Components Ltd.</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="findingId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Related Finding</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select audit finding" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {checklistItems.length > 0 ? (
                                  checklistItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                      {item.questionText.substring(0, 50)}...
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="" disabled>No findings available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Link this request to a specific audit finding (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity <span className="text-destructive">*</span></FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SEVERITY_LEVELS.map((level) => (
                                  <SelectItem key={level.id} value={level.id}>
                                    {level.label}
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
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date <span className="text-destructive">*</span></FormLabel>
                            <DatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                            <FormDescription>
                              Date by which supplier response is required
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="response" className="mt-0 space-y-4">
                    <FormField
                      control={form.control}
                      name="responseRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Response Required</FormLabel>
                            <FormDescription>
                              Supplier must formally respond to this SCR
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned To</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.length > 0 ? (
                                users.map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="1">John Doe</SelectItem>
                                  <SelectItem value="2">Jane Smith</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Person responsible for following up on this SCR
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="border rounded-md p-4 bg-muted/30">
                      <h3 className="text-sm font-medium mb-2">Required Response Elements</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary mr-2 mt-0.5">1</div>
                          <span>Immediate containment actions taken</span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary mr-2 mt-0.5">2</div>
                          <span>Root cause analysis results</span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary mr-2 mt-0.5">3</div>
                          <span>Corrective actions implemented</span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary mr-2 mt-0.5">4</div>
                          <span>Evidence of implementation</span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary mr-2 mt-0.5">5</div>
                          <span>Plan to verify effectiveness</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-muted-foreground">
                        The SCR will be sent to the supplier via email once created, including all the details and response requirements.
                      </p>
                    </div>
                  </TabsContent>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/audit-detail/${auditId}`)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createScrMutation.isPending}
                  >
                    {createScrMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create SCR
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </Tabs>
          </form>
        </Form>
      </div>
    </>
  );
}