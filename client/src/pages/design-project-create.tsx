import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CalendarIcon, CheckIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PageHeader from "@/components/page-header";

type ProjectType = {
  id: number;
  name: string;
  description: string | null;
};

type ProjectStatus = {
  id: number;
  name: string;
  description: string | null;
  order: number;
};

// ModelType removed as per requirements

type RiskClass = {
  id: number;
  name: string;
  description: string | null;
  level: number;
};

// Form schema using zod
const formSchema = z.object({
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  typeId: z.coerce.number({ required_error: "Please select a project type" }),
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  statusId: z.coerce.number().default(1), // Default to the first status (typically "Planning")
  riskClass: z.string().min(1, { message: "Please select a risk classification" }),
  startDate: z.date().default(() => new Date()),
  targetCompletionDate: z.date().optional(),
  hasSoftwareComponent: z.boolean().default(false),
});

const DesignProjectCreate = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Fetch lookup data
  const { data: projectTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["/api/design-project-types"],
    queryFn: async () => {
      const res = await fetch("/api/design-project-types", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "X-Auth-Local": "true" // For Safari compatibility
        }
      });

      if (!res.ok) {
        throw new Error(`Error fetching project types: ${res.statusText}`);
      }

      return await res.json() as ProjectType[];
    },
  });

  const { data: statuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ["/api/design-project-statuses"],
    queryFn: async () => {
      const res = await fetch("/api/design-project-statuses", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "X-Auth-Local": "true" // For Safari compatibility
        }
      });

      if (!res.ok) {
        throw new Error(`Error fetching statuses: ${res.statusText}`);
      }

      return await res.json() as ProjectStatus[];
    },
  });

  // Model types removed as per requirements

  const { data: riskClasses = [], isLoading: riskClassesLoading } = useQuery({
    queryKey: ["/api/design-control/risk-classifications"],
    queryFn: async () => {
      const res = await fetch("/api/design-control/risk-classifications", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "X-Auth-Local": "true" // For Safari compatibility
        }
      });

      if (!res.ok) {
        throw new Error(`Error fetching risk classifications: ${res.statusText}`);
      }

      return await res.json() as RiskClass[];
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "X-Auth-Local": "true" // For Safari compatibility
        }
      });

      if (!res.ok) {
        throw new Error(`Error fetching users: ${res.statusText}`);
      }

      return await res.json();
    },
  });

  const loading = typesLoading || statusesLoading || riskClassesLoading || usersLoading;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", // Title is required
      description: "",
      typeId: projectTypes[0]?.id, // Default to first project type
      // Project code will be auto-generated with format DP-YYYY-XXX (fixing DES001)
      statusId: 1, // Default to first status (typically "Planning")
      riskClass: "", // Risk class is required
      startDate: new Date(),
      hasSoftwareComponent: false,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const projectData = {
        ...data,
        initiatedBy: user?.id,
        // Project code will be auto-generated server-side (fixing DES001)
        // No need to send projectCode as it will be generated in the format DP-YYYY-XXX
        objective: data.description, // Use description as objective for now
        responsiblePerson: user?.id, // Set current user as responsible person
        riskLevel: data.riskClass || "Medium", // Use selected risk class or default
        targetCompletionDate: data.targetCompletionDate || new Date(new Date().setMonth(new Date().getMonth() + 6)), // Use selected date or default to 6 months
      };

      const response = await apiRequest("POST", "/api/design-projects", projectData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create design project");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Design project created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/design-control/projects"] });
      navigate("/design-control");
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setSubmitting(true);
    createProjectMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Helmet>
        <title>Create Design Project | MedQMS</title>
        <meta name="description" content="Create a new design project in the Design Control module, compliant with ISO 13485 and IEC 62304." />
      </Helmet>

      <PageHeader
        title="Create Design Project"
        description="Start a new design project in compliance with ISO 13485 and IEC 62304"
        actions={
          <Button variant="outline" onClick={() => navigate("/design-control")}>
            Cancel
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>New Design Project</CardTitle>
          <CardDescription>
            Create a new design project with all required information. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-muted/50 p-4 mb-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium mr-2">Project Code:</span>
                    <span className="text-sm text-muted-foreground italic">Will be auto-generated</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The project code will follow this format: 
                    <span className="font-mono bg-background px-1 py-0.5 rounded mx-1">DP-YYYY-XXX</span>
                    where DP is Design Project, YYYY is the current year, and XXX is a sequential number
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter project title"
                        />
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
                          placeholder="Provide a detailed description of the project"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project type" />
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

                  {/* Status field removed as requested */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Risk Classification field removed as requested */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
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
                        <FormDescription>
                          When the project is scheduled to start
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Project Manager field removed as requested */}
                </div>

                {/* Version Format and Regulatory Path fields removed as requested */}

                {/* Target Markets field removed as requested */}

                // Removed the Model Type field as it is no longer needed

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" type="button" onClick={() => navigate("/design-control")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignProjectCreate;