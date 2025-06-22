import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BarChart3,
  CalendarIcon,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  PieChart,
  Trash,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define form schemas
const reviewFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  reviewDate: z.date(),
  reviewType: z.enum(["standard", "critical", "continuous"]),
  // startTime and duration fields removed as requested
});

const attendeeFormSchema = z.object({
  userId: z.number(),
  role: z.string().min(1, "Role is required"),
});

const inputFormSchema = z.object({
  source: z.string().min(1, "Source is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "audit", 
    "customer_feedback", 
    "process_performance", 
    "capa", 
    "follow_up", 
    "change", 
    "improvement", 
    "regulatory"
  ], {
    required_error: "Category is required",
    invalid_type_error: "Category must be one of the ISO 13485 required inputs",
  }),
  status: z.enum(["pending", "in_progress", "completed"], {
    required_error: "Status is required"
  }),
});

const actionItemFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  assignedTo: z.number(),
  dueDate: z.date(),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["open", "in-progress", "completed", "overdue"]),
  comments: z.string().optional(),
});

const signatureFormSchema = z.object({
  role: z.string().min(1, "Role is required"),
  meaning: z.string().min(1, "Meaning is required"),
});

// Define dashboard data interface
interface DashboardData {
  counts: {
    byStatus: Array<{ status: string; count: number }>;
    openActionItems: number;
    overdueActionItems: number;
  };
  recentCompletedReviews: Array<any>;
  upcomingReviews: Array<any>;
  // For backward compatibility with existing UI components
  reviewStats?: {
    total: number;
    completed: number;
    scheduled: number;
    inProgress: number;
  };
  actionItemStats?: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  overdueActionItems?: Array<any>;
  actionItemsByPriority?: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function ManagementReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [openNewReviewDialog, setOpenNewReviewDialog] = useState(false);
  const [openEditReviewDialog, setOpenEditReviewDialog] = useState(false);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [openNewAttendeeDialog, setOpenNewAttendeeDialog] = useState(false);
  const [openNewInputDialog, setOpenNewInputDialog] = useState(false);
  const [openNewActionItemDialog, setOpenNewActionItemDialog] = useState(false);
  const [openSignDialog, setOpenSignDialog] = useState(false);

  // Forms setup
  const newReviewForm = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      title: "",
      reviewDate: new Date(),
      reviewType: "standard",
      // startTime and duration removed as requested
    },
  });
  
  // Edit review form setup
  const editReviewForm = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      title: "",
      reviewDate: new Date(),
      reviewType: "standard",
    },
  });

  const newAttendeeForm = useForm<z.infer<typeof attendeeFormSchema>>({
    resolver: zodResolver(attendeeFormSchema),
    defaultValues: {
      userId: 0,
      role: "",
    },
  });

  const newInputForm = useForm<z.infer<typeof inputFormSchema>>({
    resolver: zodResolver(inputFormSchema),
    defaultValues: {
      source: "",
      description: "",
      category: "audit",
      status: "pending",
    },
  });

  const newActionItemForm = useForm<z.infer<typeof actionItemFormSchema>>({
    resolver: zodResolver(actionItemFormSchema),
    defaultValues: {
      description: "",
      assignedTo: 0,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      priority: "medium",
      status: "open",
      comments: "",
    },
  });

  const signatureForm = useForm<z.infer<typeof signatureFormSchema>>({
    resolver: zodResolver(signatureFormSchema),
    defaultValues: {
      role: "",
      meaning: "",
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewFormSchema>) => {
      // Determine the review status
      let status = "scheduled";
      if (data.reviewType === "continuous") {
        status = "in-progress";
      }

      // Prepare review data
      const reviewData = {
        ...data,
        status,
        purpose: "Management review meeting to evaluate the effectiveness of the quality management system",
        scope: "Review of all quality system processes and performance metrics",
        reviewDateTime: new Date(
          `${format(data.reviewDate, 'yyyy-MM-dd')}T00:00:00`
        ).toISOString(),
        // startTime and duration fields removed as requested
      };

      const res = await apiRequest("POST", "/api/management-reviews", reviewData);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Management review created successfully",
      });
      setOpenNewReviewDialog(false);
      newReviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });

      // Select the newly created review
      setSelectedReviewId(data.id);
      setActiveTab("reviews");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create management review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create attendee mutation
  const createAttendeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof attendeeFormSchema>) => {
      if (!selectedReviewId) throw new Error("No review selected");

      const res = await apiRequest("POST", `/api/management-reviews/${selectedReviewId}/attendees`, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Attendee added successfully",
      });
      setOpenNewAttendeeDialog(false);
      newAttendeeForm.reset();
      refetchAttendees();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add attendee: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create input mutation
  const createInputMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inputFormSchema>) => {
      if (!selectedReviewId) throw new Error("No review selected");

      const res = await apiRequest("POST", `/api/management-reviews/${selectedReviewId}/inputs`, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Review input added successfully",
      });
      setOpenNewInputDialog(false);
      newInputForm.reset();
      refetchInputs();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add review input: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create action item mutation
  const createActionItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof actionItemFormSchema>) => {
      if (!selectedReviewId) throw new Error("No review selected");

      const res = await apiRequest("POST", `/api/management-reviews/${selectedReviewId}/action-items`, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Action item added successfully",
      });
      setOpenNewActionItemDialog(false);
      newActionItemForm.reset();
      refetchActionItems();
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add action item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Sign review mutation
  const signReviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signatureFormSchema>) => {
      if (!selectedReviewId) throw new Error("No review selected");

      const res = await apiRequest("POST", `/api/management-reviews/${selectedReviewId}/signatures`, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Review signed successfully",
      });
      setOpenSignDialog(false);
      signatureForm.reset();
      refetchReviewDetails();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to sign review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update review status mutation
  const updateReviewStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/management-reviews/${id}`, { status });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Review status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });
      if (selectedReviewId) {
        refetchReviewDetails();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update review status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update review details mutation (for editing)
  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof reviewFormSchema>> }) => {
      const res = await apiRequest("PATCH", `/api/management-reviews/${id}`, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Management review updated successfully",
      });
      setOpenEditReviewDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });
      if (selectedReviewId) {
        refetchReviewDetails();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update review: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/management-reviews/${id}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Management review deleted successfully",
      });
      setOpenDeleteConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });
      setSelectedReviewId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete review: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update action item mutation
  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof actionItemFormSchema>> }) => {
      const res = await apiRequest("PATCH", `/api/management-review-action-items/${id}`, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Action item updated successfully",
      });
      refetchActionItems();
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update action item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError,
  } = useQuery<DashboardData>({
    queryKey: ["/api/management-review-dashboard"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch reviews data
  const {
    data: reviews = [],
    isLoading: isLoadingReviews,
  } = useQuery<any[]>({
    queryKey: ["/api/management-reviews"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch users data for selection dropdowns
  const {
    data: users = [],
    isLoading: isLoadingUsers,
  } = useQuery<any[]>({
    queryKey: ["/api/users"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Fetch review details when a review is selected
  const {
    data: selectedReview,
    isLoading: isLoadingReviewDetails,
    refetch: refetchReviewDetails,
  } = useQuery<any>({
    queryKey: [`/api/management-reviews/${selectedReviewId}`],
    enabled: !!selectedReviewId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch review attendees
  const {
    data: attendees = [],
    isLoading: isLoadingAttendees,
    refetch: refetchAttendees,
  } = useQuery<any[]>({
    queryKey: [`/api/management-reviews/${selectedReviewId}/attendees`],
    enabled: !!selectedReviewId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch review inputs
  const {
    data: inputs = [],
    isLoading: isLoadingInputs,
    refetch: refetchInputs,
  } = useQuery<any[]>({
    queryKey: [`/api/management-reviews/${selectedReviewId}/inputs`],
    enabled: !!selectedReviewId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch review action items
  const {
    data: actionItems = [],
    isLoading: isLoadingActionItems,
    refetch: refetchActionItems,
  } = useQuery<any[]>({
    queryKey: [`/api/management-reviews/${selectedReviewId}/action-items`],
    enabled: !!selectedReviewId,
    staleTime: 1000 * 60, // 1 minute
  });

  const onSubmitReview = (data: z.infer<typeof reviewFormSchema>) => {
    createReviewMutation.mutate(data);
  };

  const onSubmitAttendee = (data: z.infer<typeof attendeeFormSchema>) => {
    createAttendeeMutation.mutate(data);
  };

  const onSubmitInput = (data: z.infer<typeof inputFormSchema>) => {
    createInputMutation.mutate(data);
  };

  const onSubmitActionItem = (data: z.infer<typeof actionItemFormSchema>) => {
    createActionItemMutation.mutate(data);
  };

  const onSubmitSignature = (data: z.infer<typeof signatureFormSchema>) => {
    signReviewMutation.mutate(data);
  };

  // Handles action item status changes with type-safe status
  const handleActionItemStatusChange = (id: number, status: "open" | "in-progress" | "completed" | "overdue") => {
    if (id && status) {
      updateActionItemMutation.mutate({ id, data: { status } });
    }
  };

  // Get status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "delayed": 
        return <Badge variant="destructive">Delayed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-muted">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format date with fallback
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Not specified";
    return format(new Date(date), "MMM d, yyyy");
  };

  // Get user name from users array
  const getUserName = (userId: number | null | undefined) => {
    if (!userId || !users) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Management Review</h1>
              <p className="text-gray-500 text-sm mt-1">Quality system effectiveness monitoring</p>
            </div>
            <Button 
              onClick={() => setOpenNewReviewDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              New Review
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 h-10">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 h-10 font-medium text-gray-600 data-[state=active]:text-green-600"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 h-10 font-medium text-gray-600 data-[state=active]:text-green-600"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Reviews</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {isLoadingDashboard ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : dashboardError ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>There was a problem loading the dashboard data: {dashboardError.message}</p>
                  <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] })}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : dashboardData ? (
              <>
                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border rounded-md shadow-sm overflow-hidden">
                    <div className="h-1 bg-blue-600"></div>
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">Management Reviews</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-800">{dashboardData?.reviewStats?.total || 0}</div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          {dashboardData?.reviewStats?.completed || 0} completed
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                          {dashboardData?.reviewStats?.scheduled || 0} scheduled
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                          {dashboardData?.reviewStats?.inProgress || 0} in progress
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border rounded-md shadow-sm overflow-hidden">
                    <div className="h-1 bg-indigo-600"></div>
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">Action Items</CardTitle>
                        <ListChecks className="h-4 w-4 text-indigo-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-800">{dashboardData?.actionItemStats?.total || 0}</div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                          {dashboardData?.actionItemStats?.open || 0} open
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
                          {dashboardData?.actionItemStats?.inProgress || 0} in progress
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          {dashboardData?.actionItemStats?.completed || 0} completed
                        </span>
                      </div>
                      {(dashboardData?.actionItemStats?.overdue || 0) > 0 && (
                        <div className="flex items-center text-xs text-red-600 font-medium mt-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {dashboardData?.actionItemStats?.overdue || 0} overdue
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border rounded-md shadow-sm overflow-hidden">
                    <div className="h-1 bg-red-600"></div>
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">Overdue Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{dashboardData?.actionItemStats?.overdue || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Requires immediate attention
                      </div>
                      {(dashboardData?.actionItemStats?.overdue || 0) > 0 && (
                        <Button variant="outline" size="sm" className="mt-2 text-xs h-auto py-1 px-2 text-red-600 border-red-200 hover:bg-red-50">
                          View All
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Priority Distribution card removed as requested */}
                </div>

                {/* Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  {/* Recent Completed Reviews */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Recently Completed Reviews</CardTitle>
                      <CardDescription>Last completed management reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboardData.recentCompletedReviews && dashboardData.recentCompletedReviews.length > 0 ? (
                        <div className="space-y-4">
                          {dashboardData.recentCompletedReviews.map((review: any) => (
                            <div key={review.id} className="flex items-start space-x-4 p-3 rounded-md bg-green-50 border border-green-100">
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                              <div className="space-y-1 flex-1">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium text-sm">{review.title}</p>
                                  <Badge variant="outline" className="text-green-600 bg-green-50">Completed</Badge>
                                </div>
                                <div className="flex space-x-2 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <CalendarIcon className="mr-1 h-3 w-3" /> 
                                    {formatDate(review.reviewDate)}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Users className="mr-1 h-3 w-3" /> 
                                    {review.attendeeCount || 0} attendees
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No completed reviews yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Reviews */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Upcoming Reviews</CardTitle>
                      <CardDescription>Scheduled management reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboardData.upcomingReviews && dashboardData.upcomingReviews.length > 0 ? (
                        <div className="space-y-4">
                          {dashboardData.upcomingReviews.map((review: any) => (
                            <div key={review.id} className="flex items-start space-x-4 p-3 rounded-md bg-blue-50 border border-blue-100">
                              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div className="space-y-1 flex-1">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium text-sm">{review.title}</p>
                                  <Badge variant="outline" className="text-blue-600 bg-blue-50">Scheduled</Badge>
                                </div>
                                <div className="flex space-x-2 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <CalendarIcon className="mr-1 h-3 w-3" /> 
                                    {formatDate(review.reviewDate)}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Clock className="mr-1 h-3 w-3" /> 
                                    {review.startTime || 'TBD'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No upcoming reviews scheduled</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex justify-center items-center py-8">
                  <p className="text-muted-foreground">No dashboard data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-2xl font-semibold">Management Reviews</h2>
                <Button onClick={() => setOpenNewReviewDialog(true)} className="bg-green-600 hover:bg-green-700">
                  New Review
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of reviews */}
                <div className="lg:col-span-1 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">All Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {isLoadingReviews ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                          <p>No management reviews found</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setOpenNewReviewDialog(true)}
                          >
                            Create Your First Review
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {reviews.map((review) => (
                            <div 
                              key={review.id} 
                              className={cn(
                                "flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50",
                                selectedReviewId === review.id && "bg-slate-50"
                              )}
                              onClick={() => setSelectedReviewId(review.id)}
                            >
                              <div className="space-y-1">
                                <p className="font-medium text-sm">{review.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(review.reviewDate).toLocaleDateString()}
                                </p>
                              </div>
                              {getStatusBadge(review.status)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Selected review details */}
                <div className="lg:col-span-2 space-y-4">
                  {selectedReviewId ? (
                    isLoadingReviewDetails ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : selectedReview ? (
                      <div className="space-y-6">
                        <Card>
                          <div className="h-1 bg-green-600"></div>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl font-semibold">{selectedReview.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  {selectedReview.reviewId || 'ID not assigned'}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(selectedReview.status)}
                                {/* Only show edit and delete for scheduled reviews */}
                                {selectedReview.status === "scheduled" && (
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-gray-500 hover:text-blue-500"
                                      onClick={() => {
                                        // Set form values from selected review
                                        editReviewForm.reset({
                                          title: selectedReview.title,
                                          reviewDate: new Date(selectedReview.reviewDate),
                                          reviewType: selectedReview.reviewType || "standard",
                                        });
                                        setOpenEditReviewDialog(true);
                                      }}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                                      onClick={() => setOpenDeleteConfirmDialog(true)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="text-sm font-medium">{new Date(selectedReview.reviewDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="text-sm font-medium">{selectedReview.status}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground">Purpose</p>
                              <p className="text-sm">{selectedReview.description || "Evaluate the effectiveness of the quality management system"}</p>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              {selectedReview.status === "scheduled" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => updateReviewStatusMutation.mutate({ 
                                    id: selectedReview.id, 
                                    status: "in_progress" 
                                  })}
                                >
                                  Start Review
                                </Button>
                              )}
                              {selectedReview.status === "in_progress" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => updateReviewStatusMutation.mutate({ 
                                    id: selectedReview.id, 
                                    status: "completed" 
                                  })}
                                >
                                  Complete Review
                                </Button>
                              )}
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => setOpenSignDialog(true)}
                              >
                                Sign Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Review Inputs Section (ISO 13485 requirement) */}
                        <Tabs defaultValue="inputs" className="space-y-4">
                          <TabsList>
                            <TabsTrigger value="inputs">Inputs</TabsTrigger>
                            <TabsTrigger value="attendees">Attendees</TabsTrigger>
                            <TabsTrigger value="actions">Action Items</TabsTrigger>
                          </TabsList>
                          
                          {/* Inputs Tab (ISO 13485 required) */}
                          <TabsContent value="inputs" className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-medium">Review Inputs</h3>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setOpenNewInputDialog(true)}
                                className="flex items-center gap-1"
                              >
                                <span>Add Input</span>
                              </Button>
                            </div>
                            
                            {isLoadingInputs ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : inputs.length === 0 ? (
                              <Card>
                                <CardContent className="p-6 text-center">
                                  <p className="text-muted-foreground mb-4">No review inputs added yet</p>
                                  <p className="text-xs text-muted-foreground mb-4">
                                    ISO 13485 requires management review inputs to include:
                                  </p>
                                  <ul className="text-xs text-muted-foreground text-left list-disc pl-6 mb-4 space-y-1">
                                    <li>Audit results</li>
                                    <li>Customer feedback</li>
                                    <li>Process performance and product conformity</li>
                                    <li>Status of corrective and preventive actions</li>
                                    <li>Follow-up actions from previous management reviews</li>
                                    <li>Changes that could affect the quality management system</li>
                                    <li>Recommendations for improvement</li>
                                    <li>New or revised regulatory requirements</li>
                                  </ul>
                                  <Button 
                                    onClick={() => setOpenNewInputDialog(true)}
                                    className="mt-2"
                                  >
                                    Add Required Inputs
                                  </Button>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-3">
                                {inputs.map((input) => (
                                  <Card key={input.id} className="overflow-hidden">
                                    <div className={cn(
                                      "h-1",
                                      input.category === "audit" && "bg-blue-500",
                                      input.category === "customer_feedback" && "bg-orange-500",
                                      input.category === "process_performance" && "bg-green-500",
                                      input.category === "capa" && "bg-purple-500",
                                      input.category === "follow_up" && "bg-yellow-500",
                                      input.category === "change" && "bg-indigo-500",
                                      input.category === "improvement" && "bg-teal-500",
                                      input.category === "regulatory" && "bg-red-500",
                                    )}></div>
                                    <CardContent className="p-4">
                                      <div className="grid grid-cols-[1fr_auto] gap-4">
                                        <div>
                                          <h4 className="text-sm font-semibold">{input.source}</h4>
                                          <p className="text-sm mt-1">{input.description}</p>
                                        </div>
                                        <div>
                                          <Badge variant={input.status === "completed" ? "default" : "outline"}>
                                            {input.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                          
                          {/* Attendees Tab */}
                          <TabsContent value="attendees" className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-medium">Attendees</h3>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setOpenNewAttendeeDialog(true)}
                                className="flex items-center gap-1"
                              >
                                <span>Add Attendee</span>
                              </Button>
                            </div>
                            
                            {isLoadingAttendees ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : attendees.length === 0 ? (
                              <Card>
                                <CardContent className="p-6 text-center">
                                  <p className="text-muted-foreground">No attendees added yet</p>
                                  <Button 
                                    onClick={() => setOpenNewAttendeeDialog(true)}
                                    className="mt-4"
                                  >
                                    Add Attendees
                                  </Button>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-3">
                                {attendees.map((attendee) => {
                                  const user = users.find(u => u.id === attendee.userId);
                                  return (
                                    <Card key={attendee.id}>
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                          <Avatar>
                                            <AvatarFallback>{user?.first_name?.[0]}{user?.last_name?.[0]}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className="text-sm font-semibold">{user?.first_name} {user?.last_name}</h4>
                                            <p className="text-xs text-muted-foreground">{attendee.role}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </TabsContent>
                          
                          {/* Action Items Tab */}
                          <TabsContent value="actions" className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-medium">Action Items</h3>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setOpenNewActionItemDialog(true)}
                                className="flex items-center gap-1"
                              >
                                <span>Add Action Item</span>
                              </Button>
                            </div>
                            
                            {isLoadingActionItems ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : actionItems.length === 0 ? (
                              <Card>
                                <CardContent className="p-6 text-center">
                                  <p className="text-muted-foreground">No action items added yet</p>
                                  <Button 
                                    onClick={() => setOpenNewActionItemDialog(true)}
                                    className="mt-4"
                                  >
                                    Add Action Items
                                  </Button>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-3">
                                {actionItems.map((item) => {
                                  const assignedUser = users.find(u => u.id === item.assignedTo);
                                  return (
                                    <Card key={item.id} className="overflow-hidden">
                                      <div className={cn(
                                        "h-1",
                                        item.priority === "high" && "bg-red-500",
                                        item.priority === "medium" && "bg-amber-500",
                                        item.priority === "low" && "bg-blue-500",
                                      )}></div>
                                      <CardContent className="p-4">
                                        <div className="grid gap-2">
                                          <div className="flex justify-between">
                                            <h4 className="text-sm font-semibold">{item.description}</h4>
                                            <Badge variant={
                                              item.status === "completed" ? "default" : 
                                              item.status === "overdue" ? "destructive" : 
                                              "outline"
                                            }>
                                              {item.status}
                                            </Badge>
                                          </div>
                                          <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Assigned to: {assignedUser?.first_name} {assignedUser?.last_name}</span>
                                            <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                          </div>
                                          {item.comments && (
                                            <p className="text-xs mt-2 border-t pt-2">{item.comments}</p>
                                          )}
                                          {item.status !== "completed" && (
                                            <div className="flex gap-2 mt-2">
                                              {item.status !== "in-progress" && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-xs h-7"
                                                  onClick={() => handleActionItemStatusChange(item.id, "in-progress")}
                                                >
                                                  Start
                                                </Button>
                                              )}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7"
                                                onClick={() => handleActionItemStatusChange(item.id, "completed")}
                                              >
                                                Complete
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-12 border rounded-lg">
                        <p className="text-muted-foreground">Error loading review details</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col justify-center items-center py-16 text-center border rounded-lg bg-slate-50">
                      <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Review Selected</h3>
                      <p className="text-muted-foreground max-w-md">
                        Select a review from the list to view details or create a new review.
                      </p>
                      <Button 
                        className="mt-6 bg-green-600 hover:bg-green-700" 
                        onClick={() => setOpenNewReviewDialog(true)}
                      >
                        Create New Review
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Dialog for creating a new review */}
      <Dialog open={openNewReviewDialog} onOpenChange={setOpenNewReviewDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Management Review</DialogTitle>
            <DialogDescription>
              Schedule a new management review meeting
            </DialogDescription>
          </DialogHeader>
          <Form {...newReviewForm}>
            <form onSubmit={newReviewForm.handleSubmit(onSubmitReview)} className="space-y-4">
              <FormField
                control={newReviewForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quarterly Management Review Q2 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newReviewForm.control}
                name="reviewDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
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
                              format(field.value, "MMMM d, yyyy")
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
                control={newReviewForm.control}
                name="reviewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a review type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard Review</SelectItem>
                        <SelectItem value="critical">Critical Review</SelectItem>
                        <SelectItem value="continuous">Continuous Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines the scope and frequency of the review
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time and Duration fields removed as requested */}

              <DialogFooter>
                <Button type="submit" disabled={createReviewMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {createReviewMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Review
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding an input */}
      <Dialog open={openNewInputDialog} onOpenChange={setOpenNewInputDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add ISO 13485 Required Input</DialogTitle>
            <DialogDescription>
              Add an input for management review as required by ISO 13485:2016 clause 5.6.2
            </DialogDescription>
          </DialogHeader>
          <Form {...newInputForm}>
            <form onSubmit={newInputForm.handleSubmit(onSubmitInput)} className="space-y-4">
              <FormField
                control={newInputForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISO 13485 Input Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select required input category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="audit">Audit Results</SelectItem>
                        <SelectItem value="customer_feedback">Customer Feedback</SelectItem>
                        <SelectItem value="process_performance">Process Performance & Product Conformity</SelectItem>
                        <SelectItem value="capa">Status of Corrective & Preventive Actions</SelectItem>
                        <SelectItem value="follow_up">Follow-up Actions from Previous Reviews</SelectItem>
                        <SelectItem value="change">Changes Affecting the QMS</SelectItem>
                        <SelectItem value="improvement">Recommendations for Improvement</SelectItem>
                        <SelectItem value="regulatory">New/Revised Regulatory Requirements</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Required input categories as per ISO 13485:2016 clause 5.6.2
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newInputForm.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Internal Audit Report Q1 2025" {...field} />
                    </FormControl>
                    <FormDescription>
                      Specific document, report, or source of this input
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newInputForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the input including relevant data, metrics, or findings" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newInputForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select review status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="in_progress">Under Review</SelectItem>
                        <SelectItem value="completed">Review Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createInputMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createInputMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Input"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding an attendee */}
      <Dialog open={openNewAttendeeDialog} onOpenChange={setOpenNewAttendeeDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Attendee</DialogTitle>
            <DialogDescription>
              Add an attendee to the management review meeting
            </DialogDescription>
          </DialogHeader>
          <Form {...newAttendeeForm}>
            <form onSubmit={newAttendeeForm.handleSubmit(onSubmitAttendee)} className="space-y-4">
              <FormField
                control={newAttendeeForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newAttendeeForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role in Review</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chair, QA Representative, Technical Expert" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createAttendeeMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createAttendeeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Attendee"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding an action item */}
      <Dialog open={openNewActionItemDialog} onOpenChange={setOpenNewActionItemDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Action Item</DialogTitle>
            <DialogDescription>
              Add an action item resulting from the management review
            </DialogDescription>
          </DialogHeader>
          <Form {...newActionItemForm}>
            <form onSubmit={newActionItemForm.handleSubmit(onSubmitActionItem)} className="space-y-4">
              <FormField
                control={newActionItemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description of the action to be taken" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newActionItemForm.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newActionItemForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
                              format(field.value, "MMMM d, yyyy")
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
                control={newActionItemForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newActionItemForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newActionItemForm.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional comments or instructions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createActionItemMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createActionItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Action Item"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for signing the review */}
      <Dialog open={openSignDialog} onOpenChange={setOpenSignDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Sign Management Review</DialogTitle>
            <DialogDescription>
              Sign off on this management review
            </DialogDescription>
          </DialogHeader>
          <Form {...signatureForm}>
            <form onSubmit={signatureForm.handleSubmit(onSubmitSignature)} className="space-y-4">
              <FormField
                control={signatureForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quality Manager, Director" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signatureForm.control}
                name="meaning"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meaning of Signature</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Approval of review outcomes and action items" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={signReviewMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {signReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    "Sign Review"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing a review */}
      <Dialog open={openEditReviewDialog} onOpenChange={setOpenEditReviewDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Management Review</DialogTitle>
            <DialogDescription>
              Update details for this scheduled management review
            </DialogDescription>
          </DialogHeader>
          <Form {...editReviewForm}>
            <form 
              onSubmit={editReviewForm.handleSubmit((data) => {
                if (selectedReviewId) {
                  updateReviewMutation.mutate({ id: selectedReviewId, data });
                }
              })} 
              className="space-y-4"
            >
              <FormField
                control={editReviewForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quarterly Management Review Q2 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editReviewForm.control}
                name="reviewDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
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
                              format(field.value, "MMMM d, yyyy")
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
                control={editReviewForm.control}
                name="reviewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a review type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard Review</SelectItem>
                        <SelectItem value="critical">Critical Review</SelectItem>
                        <SelectItem value="continuous">Continuous Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines the scope and frequency of the review
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateReviewMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updateReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Review"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for confirming review deletion */}
      <Dialog open={openDeleteConfirmDialog} onOpenChange={setOpenDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Management Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this management review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {selectedReview && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium">{selectedReview.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedReview.reviewDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setOpenDeleteConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedReviewId && deleteReviewMutation.mutate(selectedReviewId)}
              disabled={deleteReviewMutation.isPending}
            >
              {deleteReviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}