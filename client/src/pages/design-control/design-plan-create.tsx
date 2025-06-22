/**
 * Create Design Plan - Phase-Gated Design Control
 * DCM-001 Implementation - ISO 13485:7.3 + 21 CFR 820.30 Compliance
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const createDesignPlanSchema = z.object({
  projectId: z.number(),
  planId: z.string().min(1, "Plan ID is required"),
  planStatus: z.enum(["draft", "active", "completed", "archived"]),
  plannedStartDate: z.date(),
  plannedEndDate: z.date(),
  targetCompletionDate: z.date(),
  riskAssessment: z.object({
    overallRiskLevel: z.enum(["low", "medium", "high", "critical"]),
    identifiedRisks: z.array(z.string()),
    mitigationStrategies: z.array(z.string()),
  }),
  milestones: z.array(z.object({
    name: z.string(),
    description: z.string(),
    targetDate: z.date(),
    dependencies: z.array(z.string()),
  })),
  regulatoryPathway: z.enum(["510k", "pma", "de_novo", "class_i", "class_ii"]),
  qualityObjectives: z.array(z.string()),
  successCriteria: z.array(z.string()),
});

type CreateDesignPlanForm = z.infer<typeof createDesignPlanSchema>;

export default function CreateDesignPlan() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateDesignPlanForm>({
    resolver: zodResolver(createDesignPlanSchema),
    defaultValues: {
      planStatus: "draft",
      riskAssessment: {
        overallRiskLevel: "medium",
        identifiedRisks: [],
        mitigationStrategies: [],
      },
      milestones: [],
      regulatoryPathway: "510k",
      qualityObjectives: [],
      successCriteria: [],
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: CreateDesignPlanForm) =>
      apiRequest("/api/design-plan/plans", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-plan/plans"] });
      toast({
        title: "Design Plan Created",
        description: `Design plan ${result.planId} has been created successfully.`,
      });
      navigate(`/design-control/projects/${result.projectId}/plan`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create design plan.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateDesignPlanForm) => {
    createPlanMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/design-control")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Design Control
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Design Plan</h1>
            <p className="text-muted-foreground mt-1">
              Initialize phase-gated design control process
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Design Plan Configuration</CardTitle>
          <CardDescription>
            Configure the phase-gated design control process for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project ID */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter project ID"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Plan ID */}
                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., DP-2025-001-PLAN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Plan Status */}
                <FormField
                  control={form.control}
                  name="planStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Regulatory Pathway */}
                <FormField
                  control={form.control}
                  name="regulatoryPathway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regulatory Pathway</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select regulatory pathway" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="510k">510(k) Premarket Notification</SelectItem>
                          <SelectItem value="pma">PMA - Premarket Approval</SelectItem>
                          <SelectItem value="de_novo">De Novo Classification</SelectItem>
                          <SelectItem value="class_i">Class I Device</SelectItem>
                          <SelectItem value="class_ii">Class II Device</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Planned Start Date */}
                <FormField
                  control={form.control}
                  name="plannedStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Planned Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
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
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Completion Date */}
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
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
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
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Risk Assessment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Risk Assessment</h3>
                <FormField
                  control={form.control}
                  name="riskAssessment.overallRiskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                          <SelectItem value="critical">Critical Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/design-control")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createPlanMutation.isPending ? "Creating..." : "Create Design Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}