import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { navigateTo } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// UI Components
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";

// Define the form schema
const createReviewSchema = z.object({
  title: z.string().min(1, "Title is required"),
  reviewDate: z.date({
    required_error: "Review date is required",
  }),
  reviewType: z.string().min(1, "Review type is required"),
  scope: z.string().min(1, "Scope is required"),
  purpose: z.string().min(1, "Purpose is required"),
  description: z.string().optional(),
});

type CreateReviewFormData = z.infer<typeof createReviewSchema>;

export default function CreateManagementReview() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<CreateReviewFormData>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      title: "",
      reviewDate: new Date(),
      reviewType: "standard",
      scope: "Review of all quality system processes and performance metrics",
      purpose: "Management review meeting to evaluate the effectiveness of the quality management system",
      description: "",
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateReviewFormData) => {
      const response = await fetch("/api/management-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Local": "true",
        },
        body: JSON.stringify({
          ...data,
          review_date: data.reviewDate,
          review_type: data.reviewType,
          status: "scheduled",
          created_by: user?.id || 9999,
          scheduled_by: user?.id || 9999,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create management review");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Management Review Created",
        description: "The management review has been successfully scheduled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      navigateTo(`/management-review/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CreateReviewFormData) => {
    createMutation.mutate(data);
  };

  // Handle back navigation
  const handleBack = () => {
    navigateTo("/management-review");
  };

  return (
    <>
      <Helmet>
        <title>Schedule Management Review | eQMS</title>
        <meta name="description" content="Schedule a new management review meeting for quality system evaluation" />
      </Helmet>

      <div className="container mx-auto py-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reviews
        </Button>

        <PageHeader
          title="Schedule Management Review"
          description="Create a new management review meeting to evaluate quality system effectiveness"
        />

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Review Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Q1 2025 Management Review"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a descriptive title for this management review
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reviewType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select review type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard Review</SelectItem>
                          <SelectItem value="annual">Annual Review</SelectItem>
                          <SelectItem value="special">Special Review</SelectItem>
                          <SelectItem value="interim">Interim Review</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the type of management review being conducted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reviewDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Review Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        onSelect={field.onChange}
                        placeholder="Select review date"
                      />
                      <FormDescription>
                        Select the date when the management review will be conducted
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
                      <FormLabel>Review Scope</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Define the scope of this management review..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe what areas and processes will be covered in this review
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Purpose</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="State the purpose and objectives of this review..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Explain the purpose and expected outcomes of this management review
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes or special considerations..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Add any additional information or special considerations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Schedule Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}