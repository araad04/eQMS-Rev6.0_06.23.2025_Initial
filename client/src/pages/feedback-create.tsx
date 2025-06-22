import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

// Create a feedback form schema
const feedbackFormSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  comments: z.string().min(10, "Please provide detailed feedback"),
  productId: z.number().nullable().optional(),
  source: z.enum(["email", "phone", "website", "in_person", "social_media", "other"]),
  satisfactionScore: z.coerce.number().int().min(1).max(5),
  category: z.enum(["product", "service", "usability", "reliability", "other"]),
  justification: z.string().optional(), // Justification for not creating a complaint for negative feedback
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export default function FeedbackCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FeedbackFormValues | null>(null);
  const [justificationRequired, setJustificationRequired] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      comments: "",
      source: "website",
      satisfactionScore: 3,
      category: "product",
      justification: "",
    },
  });

  // Watch for satisfaction score changes for determining if complaint is needed
  const satisfactionScore = form.watch("satisfactionScore");

  // Watch for justification changes
  const justification = form.watch("justification");

  const feedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      // Convert form values to the feedback API format
      const apiData = {
        // Map form fields to API fields
        dateReceived: new Date(), // Send as Date object instead of ISO string
        feedbackSource: values.source,
        productId: values.productId || null,
        feedbackType: values.satisfactionScore <= 2 ? "negative" : 
                     values.satisfactionScore >= 4 ? "positive" : "neutral",
        summary: values.customerName + " - " + values.category,
        description: values.comments,
        category: values.category,
        targetResponseDays: 5, // Default 5 days for response
        status: "open",
        sentiment: values.satisfactionScore <= 2 ? "negative" : 
                  values.satisfactionScore >= 4 ? "positive" : "neutral", // Derive sentiment from score
        justification: values.justification
      };
      
      const res = await apiRequest("POST", "/api/customer-feedback", apiData);
      if (!res.ok) {
        // Handle error response safely
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to submit feedback");
        } catch (parseError) {
          // If we can't parse the error as JSON (e.g., it's HTML)
          throw new Error(`Failed to submit feedback: ${res.status} ${res.statusText}`);
        }
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Feedback recorded",
        description: "The customer feedback has been successfully recorded in the system.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-feedback"] });
      navigate("/measurement-analysis/feedback");
    },
    onError: (error: Error) => {
      toast({
        title: "Error recording feedback",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  function onSubmit(values: FeedbackFormValues) {
    // Check if satisfaction score is low (1 or 2)
    const hasLowSatisfaction = values.satisfactionScore <= 2;
    
    // Prompt for CAPA creation if satisfaction is low
    if (hasLowSatisfaction && 
        (!values.justification || values.justification.trim() === "")) {
      setPendingFormData(values);
      setShowComplaintDialog(true);
      return;
    }
    
    // Otherwise, proceed with submission
    setIsSubmitting(true);
    feedbackMutation.mutate(values);
  }
  
  function handleCreateComplaint() {
    setShowComplaintDialog(false);
    
    // Record feedback first, then navigate to complaint creation
    if (pendingFormData) {
      setIsSubmitting(true);
      feedbackMutation.mutate(pendingFormData, {
        onSuccess: (data) => {
          // Navigate to complaint creation form, pre-populating with feedback data
          navigate(`/measurement-analysis/complaints/create?feedbackId=${data.id}&customerName=${encodeURIComponent(pendingFormData.customerName)}&description=${encodeURIComponent(pendingFormData.comments)}`);
        }
      });
    }
  }
  
  function handleJustifyNoComplaint() {
    setJustificationRequired(true);
    setShowComplaintDialog(false);
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/measurement-analysis/feedback")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Customer Feedback</h1>
          <p className="text-muted-foreground">
            Document customer feedback to improve products and services
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Information</CardTitle>
          <CardDescription>
            Enter all relevant details about the customer feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormItem>
                    <FormLabel>Feedback ID</FormLabel>
                    <FormControl>
                      <Input value="Will be auto-generated (FBK-YYYY-XXX)" disabled />
                    </FormControl>
                    <FormDescription>
                      System-generated unique identifier
                    </FormDescription>
                  </FormItem>
                </div>

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback Source</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                  name="customerEmail"
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
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="usability">Usability</SelectItem>
                          <SelectItem value="reliability">Reliability</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </div>

              <FormField
                control={form.control}
                name="satisfactionScore"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Satisfaction Score</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">1 - Very Dissatisfied</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="2" />
                          </FormControl>
                          <FormLabel className="font-normal">2 - Dissatisfied</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="3" />
                          </FormControl>
                          <FormLabel className="font-normal">3 - Neutral</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="4" />
                          </FormControl>
                          <FormLabel className="font-normal">4 - Satisfied</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="5" />
                          </FormControl>
                          <FormLabel className="font-normal">5 - Very Satisfied</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed feedback comments..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Capture the customer's exact words and experiences when possible
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(satisfactionScore <= 2 && justificationRequired) && (
                <FormField
                  control={form.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center text-destructive">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Justification for Not Creating a Complaint
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide a detailed explanation of why this negative feedback does not require a customer complaint..."
                          className="min-h-24 border-destructive"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-destructive">
                        Required: Explain why this negative feedback should not result in a formal complaint
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/measurement-analysis/feedback")}
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
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Record Feedback
                    </>
                  )}
                </Button>
              </div>
              
              {/* Alert Dialog for Low Satisfaction Score */}
              <AlertDialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                      Low Satisfaction Detected
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This feedback has a low satisfaction score (1-2).
                      According to regulatory requirements, such feedback should be evaluated to determine 
                      if a Corrective and Preventive Action (CAPA) is warranted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <p className="text-sm font-medium mb-2">Do you want to create a CAPA from this feedback?</p>
                    <ul className="text-sm list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Creating a CAPA will help ensure proper tracking and resolution</li>
                      <li>The CAPA will be linked to this feedback record</li>
                      <li>Regulatory compliance requires formal handling of quality issues</li>
                      <li>Low satisfaction scores (1-2) require quality system review</li>
                    </ul>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleJustifyNoComplaint}>No, Provide Justification</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateComplaint} className="bg-destructive hover:bg-destructive/90">
                      Yes, Create CAPA
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}