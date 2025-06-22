import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSmartForm } from "@/hooks/use-smart-form";

// Define props interface for the component
interface RegulatoryReportabilityAssessmentProps {
  supplierId?: number;
}
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { AlertCircle, CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the schema for the regulatory reportability assessment form
const reportabilitySchema = z.object({
  incidentDate: z.date({
    required_error: "Incident date is required",
  }),
  productInvolved: z.string().min(1, "Product is required"),
  incidentDescription: z.string().min(10, "A detailed description is required"),
  isFieldAction: z.boolean().default(false),
  isDeviceFailure: z.boolean().default(false),
  isAdverseEvent: z.boolean().default(false),
  patientHarm: z.string({
    required_error: "Patient harm level is required",
  }),
  regulatoryAuthorities: z.array(z.string()).min(1, "At least one authority must be selected"),
  reportabilityJustification: z.string().min(10, "Justification is required"),
});

type FormValues = z.infer<typeof reportabilitySchema>;

// Tree node interface for decision tree
interface DecisionNode {
  id: string;
  question: string;
  description?: string;
  yes?: string; // ID of the next node if answer is yes
  no?: string; // ID of the next node if answer is no
  outcome?: "reportable" | "not-reportable" | "further-evaluation"; // Final outcome if this is a leaf node
  outcomeText?: string; // Text explaining the outcome
}

// Decision tree for regulatory reportability assessment
const decisionTree: Record<string, DecisionNode> = {
  "start": {
    id: "start",
    question: "Is this a field action or correction?",
    description: "Field actions include recalls, product removals, or field corrections.",
    yes: "field-action",
    no: "device-failure",
  },
  "field-action": {
    id: "field-action",
    question: "Does the field action address a risk of death or serious injury?",
    description: "Serious injury is defined as life-threatening, results in permanent impairment, or requires medical intervention.",
    yes: "reportable-serious",
    no: "field-action-minor",
  },
  "field-action-minor": {
    id: "field-action-minor",
    question: "Was the field action initiated to reduce a risk to health posed by the device?",
    yes: "reportable-health-risk",
    no: "not-reportable-routine",
  },
  "device-failure": {
    id: "device-failure",
    question: "Did the device fail to perform as intended?",
    description: "This includes malfunctions, defects, or deterioration in characteristics/performance.",
    yes: "malfunction-harm",
    no: "adverse-event",
  },
  "malfunction-harm": {
    id: "malfunction-harm",
    question: "Could the malfunction lead to death or serious injury if it were to recur?",
    yes: "reportable-potential-harm",
    no: "not-reportable-no-harm",
  },
  "adverse-event": {
    id: "adverse-event",
    question: "Was there an adverse event associated with the device?",
    description: "An adverse event is an undesirable experience associated with the use of a medical product in a patient.",
    yes: "ae-causality",
    no: "not-reportable-no-event",
  },
  "ae-causality": {
    id: "ae-causality",
    question: "Is there a reasonable possibility that the device caused the adverse event?",
    yes: "ae-severity",
    no: "not-reportable-unrelated",
  },
  "ae-severity": {
    id: "ae-severity",
    question: "Did the adverse event result in death or serious injury?",
    yes: "reportable-ae-serious",
    no: "not-reportable-minor-ae",
  },
  "reportable-serious": {
    id: "reportable-serious",
    question: "REPORTABLE: Field action addressing risk of death or serious injury",
    outcome: "reportable",
    outcomeText: "This field action must be reported because it addresses a risk of death or serious injury.",
  },
  "reportable-health-risk": {
    id: "reportable-health-risk",
    question: "REPORTABLE: Field action to reduce a risk to health",
    outcome: "reportable",
    outcomeText: "This field action must be reported because it was initiated to reduce a risk to health posed by the device.",
  },
  "reportable-potential-harm": {
    id: "reportable-potential-harm",
    question: "REPORTABLE: Malfunction that could lead to death or serious injury",
    outcome: "reportable",
    outcomeText: "This malfunction must be reported because it could lead to death or serious injury if it were to recur.",
  },
  "reportable-ae-serious": {
    id: "reportable-ae-serious",
    question: "REPORTABLE: Adverse event resulting in death or serious injury",
    outcome: "reportable",
    outcomeText: "This adverse event must be reported because it resulted in death or serious injury and is reasonably associated with the device.",
  },
  "not-reportable-routine": {
    id: "not-reportable-routine",
    question: "NOT REPORTABLE: Routine field action not related to safety",
    outcome: "not-reportable",
    outcomeText: "This field action does not need to be reported because it's a routine action not related to safety concerns.",
  },
  "not-reportable-no-harm": {
    id: "not-reportable-no-harm",
    question: "NOT REPORTABLE: Malfunction that would not lead to harm",
    outcome: "not-reportable",
    outcomeText: "This malfunction does not need to be reported because it would not lead to death or serious injury if it were to recur.",
  },
  "not-reportable-no-event": {
    id: "not-reportable-no-event",
    question: "NOT REPORTABLE: No adverse event occurred",
    outcome: "not-reportable",
    outcomeText: "No reporting is required because no adverse event occurred.",
  },
  "not-reportable-unrelated": {
    id: "not-reportable-unrelated",
    question: "NOT REPORTABLE: Adverse event not caused by the device",
    outcome: "not-reportable",
    outcomeText: "This adverse event does not need to be reported because it was not caused by the device.",
  },
  "not-reportable-minor-ae": {
    id: "not-reportable-minor-ae",
    question: "NOT REPORTABLE: Minor adverse event",
    outcome: "not-reportable",
    outcomeText: "This adverse event does not need to be reported because it did not result in death or serious injury.",
  },
};

export const RegulatoryReportabilityAssessment = ({ supplierId }: RegulatoryReportabilityAssessmentProps) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentNodeId, setCurrentNodeId] = useState<string>("start");
  const [decisionPath, setDecisionPath] = useState<string[]>(["start"]);
  const [outcomeDetails, setOutcomeDetails] = useState<{
    outcome: "reportable" | "not-reportable" | "further-evaluation" | null;
    text: string;
  }>({
    outcome: null,
    text: "",
  });

  // Form setup with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(reportabilitySchema),
    defaultValues: {
      incidentDate: new Date(),
      productInvolved: "",
      incidentDescription: "",
      isFieldAction: false,
      isDeviceFailure: false,
      isAdverseEvent: false,
      patientHarm: "",
      regulatoryAuthorities: [],
      reportabilityJustification: "",
    },
  });

  // Get supplier details
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ["/api/suppliers", supplierId || id],
    enabled: !!(supplierId || id),
  });

  // Get existing reportability assessments for this supplier
  const { data: assessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: ["/api/suppliers/regulatory-reportability", supplierId || id],
    enabled: !!(supplierId || id),
  });

  // Submit the assessment
  const submitAssessment = useMutation({
    mutationFn: (data: FormValues & { 
      supplierId: number, 
      decisionTreePath: string[],
      reportabilityDecision: string 
    }) => {
      return apiRequest("/api/suppliers/regulatory-reportability", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Assessment submitted",
        description: "The regulatory reportability assessment has been submitted successfully.",
      });
      
      // Reset form and decision tree
      form.reset();
      setCurrentNodeId("start");
      setDecisionPath(["start"]);
      setOutcomeDetails({
        outcome: null,
        text: "",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/regulatory-reportability", id] });
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: "There was an error submitting the assessment. Please try again.",
        variant: "destructive",
      });
      console.error("Error submitting assessment:", error);
    },
  });

  const onSubmit = (values: FormValues) => {
    // Use supplierId prop if available, otherwise use from URL params
    const supplierIdentifier = supplierId || id;
    if (!supplierIdentifier || !user) return;
    
    const finalDecision = outcomeDetails.outcome === "reportable" 
      ? "Reportable" 
      : outcomeDetails.outcome === "not-reportable" 
        ? "Not Reportable" 
        : "Undetermined";
        
    submitAssessment.mutate({
      ...values,
      supplierId: Number(supplierIdentifier),
      decisionTreePath: decisionPath,
      reportabilityDecision: finalDecision,
    });
  };

  // Handle decision tree navigation
  const handleDecision = (answer: "yes" | "no") => {
    const currentNode = decisionTree[currentNodeId];
    if (!currentNode) return;

    const nextNodeId = answer === "yes" ? currentNode.yes : currentNode.no;
    if (!nextNodeId) return;

    const nextNode = decisionTree[nextNodeId];
    if (!nextNode) return;

    // Update the decision path
    setDecisionPath([...decisionPath, nextNodeId]);
    setCurrentNodeId(nextNodeId);

    // Check if we've reached an outcome
    if (nextNode.outcome) {
      setOutcomeDetails({
        outcome: nextNode.outcome,
        text: nextNode.outcomeText || "",
      });

      // Auto-fill form field based on decision tree path
      form.setValue("isFieldAction", decisionPath.includes("field-action"));
      form.setValue("isDeviceFailure", decisionPath.includes("device-failure") || decisionPath.includes("malfunction-harm"));
      form.setValue("isAdverseEvent", decisionPath.includes("adverse-event") || decisionPath.includes("ae-causality"));
    }
  };

  // Reset the decision tree
  const resetDecisionTree = () => {
    setCurrentNodeId("start");
    setDecisionPath(["start"]);
    setOutcomeDetails({
      outcome: null,
      text: "",
    });
  };

  // Current node in the decision tree
  const currentNode = decisionTree[currentNodeId];

  // Loading state
  if (isLoadingSupplier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading supplier information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TabsContent value="regulatory-reportability">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Regulatory Reportability Assessment</CardTitle>
            <CardDescription>
              Determine if an incident involving a supplier product requires regulatory reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Decision Tree Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Decision Tree Assessment</h3>
                <Card className="border-2 border-gray-200">
                  <CardContent className="pt-6">
                    {currentNode && !outcomeDetails.outcome && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0 mt-1">
                            <HelpCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-medium">{currentNode.question}</h4>
                            {currentNode.description && (
                              <p className="text-sm text-gray-500 mt-1">{currentNode.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                          <Button onClick={() => handleDecision("yes")}>
                            Yes
                          </Button>
                          <Button variant="outline" onClick={() => handleDecision("no")}>
                            No
                          </Button>
                        </div>
                      </div>
                    )}

                    {outcomeDetails.outcome && (
                      <div className="space-y-4">
                        <Alert variant={outcomeDetails.outcome === "reportable" ? "destructive" : "default"}>
                          <div className="flex items-center gap-2">
                            {outcomeDetails.outcome === "reportable" ? (
                              <AlertCircle className="h-5 w-5" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5" />
                            )}
                            <AlertTitle>
                              {outcomeDetails.outcome === "reportable" 
                                ? "Reportable Incident" 
                                : "Non-Reportable Incident"}
                            </AlertTitle>
                          </div>
                          <AlertDescription className="mt-2">
                            {outcomeDetails.text}
                          </AlertDescription>
                        </Alert>
                        <Button variant="outline" onClick={resetDecisionTree}>
                          Restart Decision Tree
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Assessment Form Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Assessment Documentation</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="incidentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Incident Date</FormLabel>
                            <DatePicker
                              date={field.value}
                              onSelect={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="productInvolved"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Involved</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter product name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="incidentDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incident Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Provide a detailed description of the incident"
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="isFieldAction"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Field Action</FormLabel>
                              <FormDescription>
                                Recall, field correction or removal
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isDeviceFailure"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Device Failure</FormLabel>
                              <FormDescription>
                                Malfunction or performance issue
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isAdverseEvent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Adverse Event</FormLabel>
                              <FormDescription>
                                Patient harm or adverse outcome
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="patientHarm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Harm Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient harm level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="minor">Minor</SelectItem>
                              <SelectItem value="serious">Serious</SelectItem>
                              <SelectItem value="death">Death</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="regulatoryAuthorities"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Applicable Regulatory Authorities</FormLabel>
                            <FormDescription>
                              Select all authorities that need to be notified
                            </FormDescription>
                          </div>
                          {["FDA", "EU MDR", "UK MHRA", "Health Canada", "TGA Australia", "PMDA Japan"].map((authority) => (
                            <FormField
                              key={authority}
                              control={form.control}
                              name="regulatoryAuthorities"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={authority}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(authority)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, authority])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== authority
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {authority}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reportabilityJustification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reportability Justification</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Explain the rationale for your reportability decision"
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline" onClick={() => form.reset()}>
                        Reset
                      </Button>
                      <Button type="submit" disabled={submitAssessment.isPending}>
                        {submitAssessment.isPending ? "Submitting..." : "Submit Assessment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Assessments Section */}
        {!isLoadingAssessments && Array.isArray(assessments) && assessments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Reportability Assessments</CardTitle>
              <CardDescription>
                History of regulatory reportability assessments for this supplier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment: any) => (
                  <Card key={assessment.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{assessment.productInvolved}</CardTitle>
                          <CardDescription>
                            {format(new Date(assessment.incidentDate), "PPP")}
                          </CardDescription>
                        </div>
                        <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                          assessment.reportabilityDecision === "Reportable" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {assessment.reportabilityDecision}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm text-gray-600 line-clamp-2">{assessment.incidentDescription}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {assessment.patientHarm && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            Harm: {assessment.patientHarm}
                          </span>
                        )}
                        {assessment.isFieldAction && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            Field Action
                          </span>
                        )}
                        {assessment.isDeviceFailure && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            Device Failure
                          </span>
                        )}
                        {assessment.isAdverseEvent && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            Adverse Event
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>
  );
};

export default RegulatoryReportabilityAssessment;