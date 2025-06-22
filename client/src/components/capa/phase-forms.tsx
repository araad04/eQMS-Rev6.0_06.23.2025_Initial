import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Phase 1: Correction Phase Form
export const CorrectionPhaseForm = ({ capaId, onSuccess }: { capaId: number, onSuccess?: () => void }) => {
  const { toast } = useToast();

  // Form schema for correction phase
  const formSchema = z.object({
    immediateActions: z.string()
      .min(10, { message: "Please describe the immediate actions taken" }),
    containmentMeasures: z.string()
      .min(10, { message: "Please describe the containment measures" }),
    affectedProducts: z.string().optional(),
    potentialImpact: z.string()
      .min(10, { message: "Please assess the potential impact" }),
    immediateEffectiveness: z.string()
      .min(10, { message: "Please describe the effectiveness of immediate actions" }),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      immediateActions: "",
      containmentMeasures: "",
      affectedProducts: "",
      potentialImpact: "",
      immediateEffectiveness: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Send data to the server
      const response = await fetch(`/api/capas/${capaId}/phase-data/correction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save correction phase data');
      }

      toast({
        title: "Data saved successfully",
        description: "Correction phase data has been recorded",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save data. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correction Phase</CardTitle>
        <CardDescription>
          Document the immediate actions taken to address and contain the issue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="immediateActions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immediate Actions Taken</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the immediate actions taken to address the issue"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Document all initial steps taken to address the nonconformity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="containmentMeasures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Containment Measures</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe measures implemented to contain the issue"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detail how the issue was contained to prevent further impact
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="affectedProducts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affected Products/Processes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List all affected products, batches, or processes"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Identify all products, processes, or systems affected by the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="potentialImpact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potential Impact Assessment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Assess the potential impact on patient safety, product quality, etc."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Evaluate the potential impact on safety, quality, and regulatory compliance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="immediateEffectiveness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effectiveness of Immediate Actions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Assess the effectiveness of the immediate actions taken"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Evaluate how effective the immediate actions were in addressing the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Save Correction Phase Data</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Phase 2: Root Cause Analysis Form
export const RootCauseAnalysisForm = ({ capaId, onSuccess }: { capaId: number, onSuccess?: () => void }) => {
  const { toast } = useToast();

  // Form schema for root cause analysis
  const formSchema = z.object({
    analysisMethod: z.string()
      .min(1, { message: "Please select an analysis method" }),
    rootCauses: z.string()
      .min(10, { message: "Please identify the root causes" }),
    contributingFactors: z.string()
      .min(10, { message: "Please describe contributing factors" }),
    systemicIssues: z.string()
      .min(10, { message: "Please identify any systemic issues" }),
    riskAssessment: z.string()
      .min(10, { message: "Please provide risk assessment details" }),
    teamMembers: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      analysisMethod: "",
      rootCauses: "",
      contributingFactors: "",
      systemicIssues: "",
      riskAssessment: "",
      teamMembers: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Send data to the server
      const response = await fetch(`/api/capas/${capaId}/phase-data/root-cause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save root cause analysis data');
      }

      toast({
        title: "Data saved successfully",
        description: "Root cause analysis data has been recorded",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save data. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Root Cause Analysis</CardTitle>
        <CardDescription>
          Identify and document the root causes of the issue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="analysisMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Analysis Method</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select analysis method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5-why">5 Why Analysis</SelectItem>
                      <SelectItem value="fishbone">Fishbone/Ishikawa Diagram</SelectItem>
                      <SelectItem value="fmea">Failure Mode and Effects Analysis (FMEA)</SelectItem>
                      <SelectItem value="fta">Fault Tree Analysis (FTA)</SelectItem>
                      <SelectItem value="pareto">Pareto Analysis</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the methodology used to analyze the root cause
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rootCauses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Causes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Identify the root causes of the issue"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Clearly identify the primary root causes discovered through analysis
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contributingFactors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contributing Factors</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any factors that contributed to the issue"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Identify secondary factors that contributed to the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemicIssues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Systemic Issues</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Identify any systemic issues within processes or systems"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Document any systemic or organizational issues identified
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskAssessment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Assessment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Evaluate the risk level based on identified causes"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Assess the risk level after root cause analysis
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List all team members involved in the analysis"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Document all personnel involved in the root cause analysis
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Save Root Cause Analysis</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Phase 3: Corrective Action Form
export const CorrectiveActionForm = ({ capaId, onSuccess }: { capaId: number, onSuccess?: () => void }) => {
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  // Form schema for corrective action
  const formSchema = z.object({
    plannedActions: z.string()
      .min(10, { message: "Please describe the planned actions" }),
    implementation: z.string()
      .min(10, { message: "Please provide implementation details" }),
    resources: z.string()
      .min(5, { message: "Please identify required resources" }),
    responsiblePersons: z.string()
      .min(3, { message: "Please identify responsible persons" }),
    targetCompletionDate: z.date({
      required_error: "Please select a target completion date",
    }),
    preventiveActions: z.string()
      .min(10, { message: "Please describe preventive actions" }),
    documentChanges: z.string().optional(),
    trainingNeeds: z.boolean().default(false),
    trainingDetails: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plannedActions: "",
      implementation: "",
      resources: "",
      responsiblePersons: "",
      preventiveActions: "",
      documentChanges: "",
      trainingNeeds: false,
      trainingDetails: "",
    },
  });

  // Watch training needs to conditionally show training details
  const trainingNeeds = form.watch("trainingNeeds");

  const onSubmit = async (data: FormValues) => {
    try {
      // Send data to the server
      const response = await fetch(`/api/capas/${capaId}/phase-data/corrective-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save corrective action data');
      }

      toast({
        title: "Data saved successfully",
        description: "Corrective action data has been recorded",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save data. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Corrective Action Plan</CardTitle>
        <CardDescription>
          Define and document the actions to be taken to address the root causes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="plannedActions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned Actions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the actions planned to address the root causes"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detail the specific actions that will address each identified root cause
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="implementation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Implementation Plan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe how the actions will be implemented"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details on how the corrective actions will be implemented
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resources"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Resources</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List the resources required for implementation"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Identify personnel, materials, equipment, and budget needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsiblePersons"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsible Persons</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Who is responsible for implementing the actions"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List the individuals responsible for executing corrective actions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCompletionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Target Completion Date</FormLabel>
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
                        onSelect={(date) => {
                          setDate(date);
                          field.onChange(date);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Set a target date for completing all corrective actions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preventiveActions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preventive Actions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe actions to prevent recurrence"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detail measures to be implemented to prevent similar issues in the future
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentChanges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Changes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any documents that need to be created or updated"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Identify any SOPs, work instructions, or policies that require updates
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainingNeeds"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Training Required</FormLabel>
                    <FormDescription>
                      Check if training is needed as part of the corrective actions
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {trainingNeeds && (
              <FormField
                control={form.control}
                name="trainingDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the training requirements"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detail the training content, target audience, and timeline
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full">Save Corrective Action Plan</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Phase 4: Effectiveness Verification Form
export const EffectivenessVerificationForm = ({ capaId, onSuccess }: { capaId: number, onSuccess?: () => void }) => {
  const { toast } = useToast();

  // Form schema for effectiveness verification
  const formSchema = z.object({
    verificationMethod: z.string()
      .min(10, { message: "Please describe the verification method" }),
    measurableOutcomes: z.string()
      .min(10, { message: "Please describe measurable outcomes" }),
    verificationResults: z.string()
      .min(10, { message: "Please provide verification results" }),
    successCriteria: z.string()
      .min(10, { message: "Please define success criteria" }),
    effectivenessAssessment: z.string()
      .min(10, { message: "Please provide effectiveness assessment" }),
    followupRequired: z.boolean().default(false),
    followupPlan: z.string().optional(),
    lessonsLearned: z.string()
      .min(10, { message: "Please document lessons learned" }),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      verificationMethod: "",
      measurableOutcomes: "",
      verificationResults: "",
      successCriteria: "",
      effectivenessAssessment: "",
      followupRequired: false,
      followupPlan: "",
      lessonsLearned: "",
    },
  });

  // Watch follow-up required to conditionally show follow-up plan
  const followupRequired = form.watch("followupRequired");

  const onSubmit = async (data: FormValues) => {
    try {
      // Send data to the server
      const response = await fetch(`/api/capas/${capaId}/phase-data/effectiveness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save effectiveness verification data');
      }

      toast({
        title: "Data saved successfully",
        description: "Effectiveness verification data has been recorded",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save data. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effectiveness Verification</CardTitle>
        <CardDescription>
          Verify and document the effectiveness of the implemented corrective actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="verificationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Method</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe how effectiveness will be verified"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detail how the effectiveness of corrective actions will be verified and measured
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="measurableOutcomes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Measurable Outcomes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List the measurable outcomes expected from corrective actions"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Define specific, measurable outcomes to evaluate effectiveness
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verificationResults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Results</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Document the results of the verification activities"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Record detailed findings from effectiveness verification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="successCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Criteria</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define the criteria for determining success"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specify the criteria used to determine if corrective actions were successful
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectivenessAssessment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effectiveness Assessment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Assess the overall effectiveness of corrective actions"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Evaluate whether the corrective actions effectively addressed the root causes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="followupRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Follow-up Required</FormLabel>
                    <FormDescription>
                      Check if additional follow-up is needed after verification
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {followupRequired && (
              <FormField
                control={form.control}
                name="followupPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the follow-up plan in detail"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detail the specific follow-up activities, timeline, and responsible persons
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="lessonsLearned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lessons Learned</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Document lessons learned from this CAPA"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Capture key insights and learnings from the CAPA process for future improvement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Save Effectiveness Verification</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Phase-specific form selector component
export const PhaseFormSelector = ({ 
  capaId, 
  currentPhase,
  onSuccess
}: { 
  capaId: number;
  currentPhase: 'CORRECTION' | 'ROOT_CAUSE_ANALYSIS' | 'CORRECTIVE_ACTION' | 'EFFECTIVENESS_VERIFICATION';
  onSuccess?: () => void;
}) => {
  switch (currentPhase) {
    case 'CORRECTION':
      return <CorrectionPhaseForm capaId={capaId} onSuccess={onSuccess} />;
    case 'ROOT_CAUSE_ANALYSIS':
      return <RootCauseAnalysisForm capaId={capaId} onSuccess={onSuccess} />;
    case 'CORRECTIVE_ACTION':
      return <CorrectiveActionForm capaId={capaId} onSuccess={onSuccess} />;
    case 'EFFECTIVENESS_VERIFICATION':
      return <EffectivenessVerificationForm capaId={capaId} onSuccess={onSuccess} />;
    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Form Not Available</CardTitle>
            <CardDescription>
              No form is available for the current phase.
            </CardDescription>
          </CardHeader>
        </Card>
      );
  }
};