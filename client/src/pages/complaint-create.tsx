import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertComplaintSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CheckCircle2, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define enum values for complaints
const COMPLAINT_CATEGORIES = ["product_quality", "adverse_event", "packaging", "labeling", "shipping", "other"] as const;
const COMPLAINT_STATUSES = ["new", "under_investigation", "corrective_action", "resolved", "closed"] as const;

// Create a modified schema for the frontend with client-side validation
const complaintFormSchema = z.object({
  complaintNumber: z.string().optional(),
  customerName: z.string().min(2, "Customer name is required"),
  customerContact: z.string().email("Valid email is required"),
  description: z.string().min(10, "Please provide a detailed description"),
  category: z.enum(COMPLAINT_CATEGORIES),
  severity: z.coerce.number().int().min(1).max(5),
  productId: z.number().nullable().optional(),
  batchNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  assignedTo: z.number().nullable().optional(),
  dueDate: z.date().optional(),
  status: z.enum(COMPLAINT_STATUSES).default("new"),
  dateReceived: z.date(),
  isReportable: z.boolean().default(false),
  reportabilityReason: z.string().nullable().optional(),
  regulationType: z.string().nullable().optional(),
});

type ComplaintFormValues = z.infer<typeof complaintFormSchema>;

export default function ComplaintCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      customerName: "",
      customerContact: "",
      description: "",
      category: "product_quality",
      severity: 3,
      status: "new",
      dateReceived: new Date(),
      isReportable: false,
      reportabilityReason: null,
      regulationType: null,
    },
  });

  const complaintMutation = useMutation({
    mutationFn: async (values: ComplaintFormValues) => {
      console.log("Submitting complaint data:", values);
      const res = await apiRequest("POST", "/api/complaints", values);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create complaint");
      }
      return await res.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: "Complaint recorded",
        description: "The complaint has been successfully recorded in the system.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      navigate("/measurement-analysis/complaints");
    },
    onError: (error: Error) => {
      console.error("Complaint submission error:", error);
      toast({
        title: "Error recording complaint",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  function onSubmit(values: ComplaintFormValues) {
    setIsSubmitting(true);
    
    // Ensure dates are properly formatted for API request
    const formattedValues = {
      ...values,
      // Make sure dateReceived is a Date object
      dateReceived: values.dateReceived instanceof Date ? values.dateReceived : new Date(values.dateReceived),
      // Handle optional dates
      dueDate: values.dueDate instanceof Date ? values.dueDate : (values.dueDate ? new Date(values.dueDate) : undefined)
    };
    
    complaintMutation.mutate(formattedValues);
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/measurement-analysis/complaints")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record New Complaint</h1>
          <p className="text-muted-foreground">
            Document customer complaints for investigation and resolution
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaint Information</CardTitle>
          <CardDescription>
            Enter all relevant details about the customer complaint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="text-sm font-medium">Complaint Number</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A unique identifier will be automatically generated in the format <span className="font-mono">CMP-YYYY-XXX</span>
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Where YYYY is the current year and XXX is a sequential number
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="under_investigation">Under Investigation</SelectItem>
                          <SelectItem value="corrective_action">Corrective Action</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter customer name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="customer@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="product_quality">Product Quality</SelectItem>
                          <SelectItem value="adverse_event">Adverse Event</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                          <SelectItem value="labeling">Labeling</SelectItem>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity (1-5)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Low</SelectItem>
                          <SelectItem value="2">2 - Medium</SelectItem>
                          <SelectItem value="3">3 - High</SelectItem>
                          <SelectItem value="4">4 - Critical</SelectItem>
                          <SelectItem value="5">5 - Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        1 = Low severity, 5 = Emergency severity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., BAT-2025-0123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., SN-12345678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateReceived"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Received</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select date</span>
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
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date when this complaint was received from the customer
                      </FormDescription>
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
                    <FormLabel>Complaint Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of the complaint..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include all relevant details, including when and how the issue occurred
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Regulatory Reportability</CardTitle>
                  <CardDescription>
                    Determine if this complaint requires reporting to regulatory authorities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isReportable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Reportable to Regulatory Bodies</FormLabel>
                          <FormDescription>
                            Does this complaint require regulatory reporting?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("isReportable") && (
                    <>
                      <FormField
                        control={form.control}
                        name="regulationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regulation Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select regulation type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mdr">EU MDR</SelectItem>
                                <SelectItem value="ivdr">EU IVDR</SelectItem>
                                <SelectItem value="fda">FDA 21 CFR Part 803</SelectItem>
                                <SelectItem value="mhra">UK MHRA</SelectItem>
                                <SelectItem value="pmda">Japan PMDA</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Under which regulation is this reportable?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reportabilityReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Reportability</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value || ""}
                                placeholder="Explain why this complaint requires regulatory reporting"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/measurement-analysis/complaints")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="loader mr-2"></span> Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Record Complaint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}