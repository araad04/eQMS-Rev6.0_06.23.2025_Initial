
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const assessmentSchema = z.object({
  assessmentType: z.enum(["Initial", "Periodic", "ForCause", "Requalification"]),
  auditId: z.string().optional(),
  qualitySystemCertification: z.string().min(1, "Required"),
  regulatoryCompliance: z.string().min(1, "Required"),
  overallScore: z.number().min(0).max(100),
  findings: z.string(),
  recommendations: z.string(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

interface SupplierAssessmentFormProps {
  onSubmit: (data: AssessmentFormValues) => void;
  isLoading?: boolean;
  linkedAudits?: { id: string; title: string }[];
}

export function SupplierAssessmentForm({ onSubmit, isLoading, linkedAudits = [] }: SupplierAssessmentFormProps) {
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      assessmentType: "Initial",
      qualitySystemCertification: "",
      regulatoryCompliance: "",
      overallScore: 0,
      findings: "",
      recommendations: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Supplier Quality Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Initial">Initial Assessment</SelectItem>
                        <SelectItem value="Periodic">Periodic Review</SelectItem>
                        <SelectItem value="ForCause">For Cause Assessment</SelectItem>
                        <SelectItem value="Requalification">Requalification</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {linkedAudits.length > 0 && (
                <FormField
                  control={form.control}
                  name="auditId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Audit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audit" />
                        </SelectTrigger>
                        <SelectContent>
                          {linkedAudits.map(audit => (
                            <SelectItem key={audit.id} value={audit.id}>
                              {audit.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="qualitySystemCertification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality System Certification</FormLabel>
                  <Textarea 
                    placeholder="Enter ISO 13485, ISO 9001 certifications"
                    className="resize-none h-24"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regulatoryCompliance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regulatory Compliance Status</FormLabel>
                  <Textarea 
                    placeholder="Document regulatory compliance status"
                    className="resize-none h-24"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="overallScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Score</FormLabel>
                  <Input 
                    type="number"
                    min={0}
                    max={100}
                    className="w-full"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Findings</FormLabel>
                  <Textarea 
                    placeholder="Document assessment findings"
                    className="resize-none h-32"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actions & Recommendations</FormLabel>
                  <Textarea 
                    placeholder="Enter recommendations and follow-up actions"
                    className="resize-none h-32"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
          >
            {isLoading ? "Processing..." : "Submit Assessment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
