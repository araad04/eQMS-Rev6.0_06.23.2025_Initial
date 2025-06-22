import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Save, CalendarIcon } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Validation schema for the audit form
const auditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  auditType: z.string().min(1, "Audit type is required"),
  scope: z.string().min(1, "Scope is required"),
  scheduledDate: z.date({
    required_error: "Scheduled date is required",
  }),

  supplierId: z.coerce.number().optional(),
  standardReference: z.string().optional(),
  leadAuditorId: z.coerce.number().optional(),
  teamMembers: z.string().optional(),
  statusId: z.coerce.number(),
});

type AuditFormValues = z.infer<typeof auditSchema>;

interface Audit {
  id: number;
  auditId: string;
  title: string;
  description: string;
  auditType: string;
  scope: string;
  scheduledDate: string;

  supplierId?: number;
  standardReference?: string;
  leadAuditorId?: number;
  teamMembers?: string;
  statusId: number;
  auditTypeId: number;
  summary?: string;
  completedDate?: string;
  isSupplierAudit?: boolean;
}

function AuditEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmNavigate, setConfirmNavigate] = useState(false);
  const [navigateTo, setNavigateTo] = useState("");

  // Get audit data for editing
  const { data: audit, isLoading: isLoadingAudit, error: auditError } = useQuery<Audit>({
    queryKey: ["/api/audits", parseInt(id)],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/audits/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch audit: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching audit details:", error);
        throw error;
      }
    },
  });

  // Initialize form with audit data once loaded
  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      title: "",
      description: "",
      auditType: "",
      scope: "",
      scheduledDate: new Date(),
      standardReference: "",
      teamMembers: "",
      statusId: 1,
    },
  });

  // ISO 13485:2016 compliant audit templates
  const getISO13485AuditContent = (typeId: number) => {
    const templates = {
      1: { // Management System Audit (ISO 13485:2016 Clause 5)
        description: "Systematic evaluation of management system effectiveness per ISO 13485:2016 Clause 5 (Management responsibility), including management commitment, customer focus, quality policy, planning, responsibility, authority, communication, and management review processes.",
        scope: "ISO 13485:2016 Clause 5.1-5.6: Management commitment and responsibility, customer focus implementation, quality policy establishment and communication, quality planning processes, organizational responsibility and authority definitions, management representative functions, internal communication systems, and management review processes including inputs, outputs, and follow-up actions."
      },
      2: { // Design Control Audit (ISO 13485:2016 Clause 7.3)
        description: "Comprehensive audit of design and development controls per ISO 13485:2016 Clause 7.3, covering design planning, inputs, outputs, review, verification, validation, transfer, and change control processes to ensure medical device safety and effectiveness.",
        scope: "ISO 13485:2016 Clause 7.3.1-7.3.10: Design and development planning, inputs identification and review, outputs documentation and approval, systematic design reviews, design verification activities, design validation protocols, design transfer procedures, design change controls, and design history file maintenance."
      },
      3: { // Purchasing Audit (ISO 13485:2016 Clause 7.4)
        description: "Assessment of purchasing processes and supplier controls per ISO 13485:2016 Clause 7.4, ensuring purchased products and services meet specified requirements and supplier qualification, evaluation, and monitoring systems are effective.",
        scope: "ISO 13485:2016 Clause 7.4.1-7.4.3: Purchasing process controls, supplier evaluation and selection criteria, supplier performance monitoring, purchasing information requirements, verification of purchased products, and supplier quality agreements implementation."
      },
      4: { // Production Audit (ISO 13485:2016 Clause 7.5)
        description: "Evaluation of production and service provision controls per ISO 13485:2016 Clause 7.5, including process validation, identification and traceability, customer property management, product preservation, and installation activities where applicable.",
        scope: "ISO 13485:2016 Clause 7.5.1-7.5.11: Production process controls and validation, cleanliness requirements, installation and servicing activities, product identification and traceability systems, customer property handling, product preservation during storage and delivery, and control of monitoring and measuring equipment."
      },
      5: { // Technical File Audit (ISO 13485:2016 Clause 4.2 + MDR)
        description: "Comprehensive review of technical documentation per ISO 13485:2016 Clause 4.2 and MDR Annex II/III requirements, ensuring technical file completeness, clinical evaluation adequacy, post-market surveillance implementation, and regulatory compliance maintenance.",
        scope: "ISO 13485:2016 Clause 4.2.3-4.2.5 + MDR Annex II/III: Medical device file documentation, technical file contents verification, clinical evaluation reports, post-market clinical follow-up, risk management files, quality management system documentation, labeling and instructions for use, and regulatory submission records."
      },
      6: { // Resource Management Audit (ISO 13485:2016 Clause 6)
        description: "Systematic evaluation of resource management effectiveness per ISO 13485:2016 Clause 6, including human resources competency, training programs, infrastructure adequacy, work environment controls, and contamination control measures for medical device manufacturing.",
        scope: "ISO 13485:2016 Clause 6.1-6.4: Resource provision and planning, human resources competency and training requirements, infrastructure maintenance and qualification, work environment controls including cleanliness and contamination prevention, and special requirements for sterile medical devices."
      }
    };
    
    return templates[typeId as keyof typeof templates] || {
      description: "Systematic examination of processes and procedures to ensure compliance with ISO 13485:2016 medical device quality management system requirements.",
      scope: "Relevant ISO 13485:2016 clauses, processes, procedures, documentation, and compliance requirements within the defined audit boundaries."
    };
  };

  // Auto-generate ISO 13485:2016 compliant content when audit type changes
  const handleAuditTypeChange = (typeId: string) => {
    const numericTypeId = parseInt(typeId);
    const smartContent = getISO13485AuditContent(numericTypeId);
    
    // Only auto-populate if fields are empty or contain generic content
    const currentDescription = form.getValues("description");
    const currentScope = form.getValues("scope");
    
    if (!currentDescription || currentDescription === "Standard quality audit" || currentDescription === "test test " || currentDescription.length < 20) {
      form.setValue("description", smartContent.description);
    }
    
    if (!currentScope || currentScope === "General Quality Audit" || currentScope.length < 20) {
      form.setValue("scope", smartContent.scope);
    }
    
    // Auto-update standard reference based on type
    const standardRef = numericTypeId === 5 ? "ISO 13485:2016, MDR 2017/745" : "ISO 13485:2016";
    form.setValue("standardReference", standardRef);
  };

  // Update form default values when audit data is loaded
  useEffect(() => {
    if (audit) {
      form.reset({
        title: audit.title,
        description: audit.description,
        auditType: audit.auditType || `${audit.auditTypeId === 1 ? 'Internal' : 'Supplier'}`,
        scope: audit.scope,
        scheduledDate: audit.scheduledDate ? new Date(audit.scheduledDate) : new Date(),

        supplierId: audit.supplierId,
        standardReference: audit.standardReference || "",
        leadAuditorId: audit.leadAuditorId,
        teamMembers: audit.teamMembers || "",
        statusId: audit.statusId,
      });
      
      // Auto-enhance content if it's generic
      if (audit.typeId) {
        const smartContent = getISO13485AuditContent(audit.typeId);
        if (audit.description === "Standard quality audit" || audit.description === "test test " || !audit.description || audit.description.length < 20) {
          form.setValue("description", smartContent.description);
        }
        if (audit.scope === "General Quality Audit" || !audit.scope || audit.scope.length < 20) {
          form.setValue("scope", smartContent.scope);
        }
      }
    }
  }, [audit, form]);

  // Handle edit audit submission
  const editAuditMutation = useMutation({
    mutationFn: async (data: AuditFormValues) => {
      try {
        console.log("Sending update request for audit", id, "with data:", data);
        
        // Format dates properly to prevent JSON issues
        const formattedData = {
          ...data,
          scheduledDate: data.scheduledDate ? data.scheduledDate.toISOString() : null,
        };
        
        // Use fetch directly for more control over the request
        const response = await fetch(`/api/audits/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Local": "true"
          },
          body: JSON.stringify(formattedData)
        });
        
        // Check for non-JSON responses that could indicate HTML error pages
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
          console.error("Received non-JSON response:", await response.text());
          throw new Error("Server returned an invalid response format");
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update audit");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error updating audit:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Successfully updated audit:", data);
      toast({
        title: "Success",
        description: "Audit has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits", parseInt(id)] });
      navigate(`/audit-detail/${id}`);
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update audit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AuditFormValues) => {
    console.log("Submitting updated audit data:", data);
    editAuditMutation.mutate(data);
  };

  const handleBackNavigation = () => {
    if (form.formState.isDirty) {
      setNavigateTo(`/audit-detail/${id}`);
      setConfirmNavigate(true);
    } else {
      navigate(`/audit-detail/${id}`);
    }
  };

  // Show loading state while fetching audit data
  if (isLoadingAudit) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle error state
  if (auditError || !audit) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center">
          <Button onClick={() => navigate("/audit-management")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audits
          </Button>
          <h1 className="ml-4 text-2xl font-bold">Edit Audit</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p className="mb-4">
                {auditError instanceof Error
                  ? auditError.message
                  : "Failed to load audit data. Please try again."}
              </p>
              <Button onClick={() => navigate("/audit-management")}>Return to Audit List</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Audit | eQMS</title>
        <meta name="description" content="Edit audit information" />
      </Helmet>

      <div className="container mx-auto py-6">
        <PageHeader
          title="Edit Audit"
          description={`Editing: ${audit.auditId} - ${audit.title}`}
          className="mb-6"
        >
          <Button variant="outline" onClick={handleBackNavigation}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Details
          </Button>
        </PageHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {/* Basic Audit Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audit Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Annual ISO 13485 Audit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="standardReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISO 13485:2016 Standard Reference</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              
                              // Immediately generate content based on selected clause
                              const clauseToTypeMap: { [key: string]: number } = {
                                "ISO 13485:2016 Clause 5": 1,
                                "ISO 13485:2016 Clause 6": 6,
                                "ISO 13485:2016 Clause 7.3": 2,
                                "ISO 13485:2016 Clause 7.4": 3,
                                "ISO 13485:2016 Clause 7.5": 4,
                                "ISO 13485:2016 Clause 4.2 + MDR": 5,
                                "ISO 13485:2016 Clause 8": 1,
                                "ISO 13485:2016 Full System": 1
                              };
                              
                              const typeId = clauseToTypeMap[value] || 1;
                              const smartContent = getISO13485AuditContent(typeId);
                              
                              // Generate professional audit title based on ISO clause
                              const titleMap: { [key: string]: string } = {
                                "ISO 13485:2016 Clause 5": "Management Responsibility Audit - ISO 13485:2016 Clause 5",
                                "ISO 13485:2016 Clause 6": "Resource Management Audit - ISO 13485:2016 Clause 6", 
                                "ISO 13485:2016 Clause 7.3": "Design Control Audit - ISO 13485:2016 Clause 7.3",
                                "ISO 13485:2016 Clause 7.4": "Purchasing Process Audit - ISO 13485:2016 Clause 7.4",
                                "ISO 13485:2016 Clause 7.5": "Production & Service Audit - ISO 13485:2016 Clause 7.5",
                                "ISO 13485:2016 Clause 4.2 + MDR": "Technical File Audit - ISO 13485:2016 Clause 4.2 + MDR",
                                "ISO 13485:2016 Clause 8": "Measurement & Improvement Audit - ISO 13485:2016 Clause 8",
                                "ISO 13485:2016 Full System": "Complete QMS Audit - ISO 13485:2016 Full System"
                              };
                              
                              const professionalTitle = titleMap[value] || "ISO 13485:2016 Audit";
                              
                              // Force update the form values
                              setTimeout(() => {
                                form.setValue("title", professionalTitle, { shouldDirty: true });
                                form.setValue("description", smartContent.description, { shouldDirty: true });
                                form.setValue("scope", smartContent.scope, { shouldDirty: true });
                                form.setValue("auditType", "Internal", { shouldDirty: true });
                                
                                toast({
                                  title: "ISO Content Generated! ✨",
                                  description: `Audit content updated for ${value.split(' - ')[1]}`,
                                });
                              }, 100);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ISO 13485:2016 clause to drive audit flow" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ISO 13485:2016 Clause 5">📋 Clause 5 - Management Responsibility</SelectItem>
                              <SelectItem value="ISO 13485:2016 Clause 6">👥 Clause 6 - Resource Management</SelectItem>
                              <SelectItem value="ISO 13485:2016 Clause 7.3">🔧 Clause 7.3 - Design and Development</SelectItem>
                              <SelectItem value="ISO 13485:2016 Clause 7.4">🤝 Clause 7.4 - Purchasing</SelectItem>
                              <SelectItem value="ISO 13485:2016 Clause 7.5">🏭 Clause 7.5 - Production and Service</SelectItem>
                              <SelectItem value="ISO 13485:2016 Clause 4.2 + MDR">📁 Clause 4.2 + MDR - Technical Files</SelectItem>
                              <SelectItem value="ISO 13485:2016 Clause 8">📊 Clause 8 - Measurement and Improvement</SelectItem>
                              <SelectItem value="ISO 13485:2016 Full System">🎯 Complete QMS Audit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            ⚡ This selection automatically determines audit description, scope, and workflow
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="auditType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audit Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audit type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Internal">Internal</SelectItem>
                              <SelectItem value="Supplier">Supplier</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Textarea
                            placeholder="Select ISO 13485:2016 clause above to auto-generate compliant description"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Content automatically generated when you select an ISO clause above
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scope</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Select ISO 13485:2016 clause above to auto-generate compliant scope"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Content automatically generated when you select an ISO clause above
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule and Resources */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Schedule and Resources</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Scheduled Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
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
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Planning</SelectItem>
                              <SelectItem value="2">Scheduled</SelectItem>
                              <SelectItem value="3">In Progress</SelectItem>
                              <SelectItem value="4">Completed</SelectItem>
                              <SelectItem value="5">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>



                  <FormField
                    control={form.control}
                    name="teamMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audit Team Members</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe, Jane Smith" {...field} />
                        </FormControl>
                        <FormDescription>
                          Comma separated list of team members
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackNavigation}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editAuditMutation.isPending || !form.formState.isDirty}
              >
                {editAuditMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Unsaved changes confirmation dialog */}
        <AlertDialog open={confirmNavigate} onOpenChange={setConfirmNavigate}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay on this page</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate(navigateTo)}>
                Leave without saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}

export default AuditEditPage;