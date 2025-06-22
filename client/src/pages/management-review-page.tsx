import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageHeader from "@/components/page-header";
import { Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Management Review Components
import { ManagementReviewDashboard } from "@/components/management-review/dashboard";
import { ReviewDetail } from "@/components/management-review/review-detail";
import { ReviewInputForm } from "@/components/management-review/input-form";
import { apiRequest } from "@/lib/queryClient";

// Define schema for the new review form
const newReviewSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // Support both camelCase and snake_case for date field
  reviewDate: z.date({
    required_error: "Review date is required",
  }),
  review_date: z.date().optional(),
  // Support both camelCase and snake_case for type field
  reviewType: z.enum(["standard", "critical", "continuous"], {
    required_error: "Review type is required",
  }),
  review_type: z.string().optional(),
  facilityId: z.string().optional(),
  facility_id: z.number().optional(),
  // Note: scope and purpose will be combined into description field for database storage
  description: z.string().optional(),
  scope: z.string().min(1, "Scope is required").max(500, "Scope cannot exceed 500 characters"),
  purpose: z.string().max(500, "Purpose cannot exceed 500 characters").optional(),
});

// Define schema for the new participant form
const newParticipantSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.string().min(1, "Role is required"),
  attended: z.boolean().default(false),
});

// Define schema for the new action item form
const newActionItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  assignedTo: z.string().min(1, "Assignee is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  priority: z.enum(["high", "medium", "low"], {
    required_error: "Priority is required",
  }),
  notes: z.string().optional(),
});

// Define schema for the signature form
const signatureSchema = z.object({
  role: z.string().min(1, "Role is required"),
  comments: z.string().optional(),
});

// Helper function to generate review titles based on date and type
const generateReviewTitle = (reviewDate: Date, reviewType: string): string => {
  const year = reviewDate.getFullYear();
  const month = reviewDate.getMonth();
  const reviewTypeFormatted = reviewType.charAt(0).toUpperCase() + reviewType.slice(1);
  
  // Use quarter-based naming for standard reviews, month-based for others
  if (reviewType === "standard") {
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year} ${reviewTypeFormatted} Management Review`;
  } else {
    const monthName = reviewDate.toLocaleString('default', { month: 'long' });
    return `${monthName} ${year} ${reviewTypeFormatted} Management Review`;
  }
};

export default function ManagementReviewPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for active tab and selected review
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  
  // Dialog open states
  const [newReviewDialogOpen, setNewReviewDialogOpen] = useState(false);
  const [newInputDialogOpen, setNewInputDialogOpen] = useState(false);
  const [newParticipantDialogOpen, setNewParticipantDialogOpen] = useState(false);
  const [newActionItemDialogOpen, setNewActionItemDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [editReviewDialogOpen, setEditReviewDialogOpen] = useState(false);
  
  // State for dialog form data
  const [selectedInputForEdit, setSelectedInputForEdit] = useState<any>(null);
  const [selectedParticipantForEdit, setSelectedParticipantForEdit] = useState<any>(null);
  const [selectedActionItemForEdit, setSelectedActionItemForEdit] = useState<any>(null);
  
  // Forms setup
  const newReviewForm = useForm<z.infer<typeof newReviewSchema>>({
    resolver: zodResolver(newReviewSchema),
    defaultValues: {
      title: "",
      reviewDate: new Date(),
      reviewType: "standard",
      scope: "Review of all quality system processes and performance metrics",
      purpose: "Management review meeting to evaluate the effectiveness of the quality management system",
    },
  });
  
  // Watch for changes in reviewDate and reviewType to update title automatically
  const watchReviewDate = newReviewForm.watch('reviewDate');
  const watchReviewType = newReviewForm.watch('reviewType');
  
  // Update title automatically when date or type changes
  useEffect(() => {
    if (watchReviewDate && watchReviewType) {
      const generatedTitle = generateReviewTitle(watchReviewDate, watchReviewType);
      newReviewForm.setValue('title', generatedTitle);
    }
  }, [watchReviewDate, watchReviewType]);
  
  const editReviewForm = useForm<z.infer<typeof newReviewSchema>>({
    resolver: zodResolver(newReviewSchema),
    defaultValues: {
      title: "",
      reviewDate: new Date(),
      reviewType: "standard",
      scope: "",
      purpose: "",
    },
  });
  
  // Watch for changes in reviewDate and reviewType in edit form to update title automatically
  const watchEditReviewDate = editReviewForm.watch('reviewDate');
  const watchEditReviewType = editReviewForm.watch('reviewType');
  
  // Update edit form title automatically when date or type changes
  useEffect(() => {
    if (watchEditReviewDate && watchEditReviewType) {
      const generatedTitle = generateReviewTitle(watchEditReviewDate, watchEditReviewType);
      editReviewForm.setValue('title', generatedTitle);
    }
  }, [watchEditReviewDate, watchEditReviewType]);
  
  const newParticipantForm = useForm<z.infer<typeof newParticipantSchema>>({
    resolver: zodResolver(newParticipantSchema),
    defaultValues: {
      userId: "",
      role: "",
      attended: false,
    },
  });
  
  const newActionItemForm = useForm<z.infer<typeof newActionItemSchema>>({
    resolver: zodResolver(newActionItemSchema),
    defaultValues: {
      description: "",
      assignedTo: "",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      priority: "medium",
      notes: "",
    },
  });
  
  const signatureForm = useForm<z.infer<typeof signatureSchema>>({
    resolver: zodResolver(signatureSchema),
    defaultValues: {
      role: "",
      comments: "",
    },
  });
  
  // Queries
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["/api/management-review-dashboard"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: users = [] as any[], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
  
  const { data: selectedReview, isLoading: isLoadingReview } = useQuery({
    queryKey: ["/api/management-reviews", selectedReviewId],
    enabled: !!selectedReviewId,
  });
  
  const { data: reviewInputs = [], isLoading: isLoadingInputs } = useQuery({
    queryKey: ["/api/management-reviews", selectedReviewId, "inputs"],
    enabled: !!selectedReviewId,
  });
  
  const { data: reviewParticipants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["/api/management-reviews", selectedReviewId, "participants"],
    enabled: !!selectedReviewId,
  });
  
  const { data: reviewActionItems = [], isLoading: isLoadingActionItems } = useQuery({
    queryKey: ["/api/management-reviews", selectedReviewId, "action-items"],
    enabled: !!selectedReviewId,
  });
  
  const { data: reviewSignatures = [], isLoading: isLoadingSignatures } = useQuery({
    queryKey: ["/api/management-reviews", selectedReviewId, "signatures"],
    enabled: !!selectedReviewId,
  });
  
  // Mutations
  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Raw review data:", data);
      
      // Combine scope and purpose into description field
      let description = data.description || '';
      if (data.scope) {
        description += `\n\nScope: ${data.scope}`;
      }
      if (data.purpose) {
        description += `\n\nPurpose: ${data.purpose}`;
      }
      
      // Create a new object with server naming convention
      const reviewData = {
        title: data.title,
        description: description.trim() || undefined,
        status: data.reviewType === "continuous" ? "in-progress" : "scheduled",
        
        // Ensure we have both snake_case and camelCase fields set properly
        review_date: data.reviewDate instanceof Date ? data.reviewDate : new Date(data.reviewDate),
        review_type: data.reviewType,
        
        // Add the required fields
        created_by: user?.id, 
        scheduled_by: user?.id,
        
        // Make sure we have facility ID
        facility_id: data.facilityId ? parseInt(data.facilityId) : 1
      };
      
      // Validate all required fields are present
      if (!reviewData.review_date) {
        throw new Error("Review date is required");
      }
      
      if (!reviewData.review_type) {
        throw new Error("Review type is required");
      }
      
      if (!reviewData.created_by) {
        throw new Error("User information is missing. Please try logging in again.");
      }
      
      if (!reviewData.scheduled_by) {
        reviewData.scheduled_by = reviewData.created_by;
      }
      
      console.log("Sending to server:", reviewData);
      
      try {
        const res = await apiRequest("POST", "/api/management-reviews", reviewData);
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            console.error("Server error (JSON):", errorData);
            
            // Handle validation errors specifically
            if (errorData.details && Array.isArray(errorData.details)) {
              const validationErrors = errorData.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join('; ');
              throw new Error(`Validation error: ${validationErrors}`);
            }
            
            throw new Error(errorData.error || JSON.stringify(errorData) || "Failed to create review");
          } else {
            const errorText = await res.text();
            console.error("Server error (Text):", errorText);
            throw new Error(`Server error: ${errorText || res.statusText || "Unknown error"}`);
          }
        }
        return res.json();
      } catch (error: any) {
        console.error("Request error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Management review scheduled successfully",
      });
      setNewReviewDialogOpen(false);
      newReviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });
      setSelectedReviewId(data.id);
    },
    onError: (error: Error) => {
      // Log detailed error information
      console.error("Mutation error:", error);
      
      // Show a more user-friendly error message
      let errorMessage = "Failed to schedule management review";
      if (error.message) {
        if (error.message.includes("Validation error:")) {
          errorMessage = error.message;
        } else if (error.message.includes("Review date is required")) {
          errorMessage = "Review date is required";
          newReviewForm.setError("reviewDate", { type: "manual", message: "Review date is required" });
        } else if (error.message.includes("Review type is required")) {
          errorMessage = "Review type is required";
          newReviewForm.setError("reviewType", { type: "manual", message: "Review type is required" });
        } else if (error.message.includes("Created by field is required")) {
          errorMessage = "User information is missing. Please try logging in again.";
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const updateReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Updating review with data:", data);
      const { id, ...reviewData } = data;
      
      // Combine scope and purpose into description field
      let description = '';
      if (reviewData.scope) {
        description += `Scope: ${reviewData.scope}\n\n`;
      }
      if (reviewData.purpose) {
        description += `Purpose: ${reviewData.purpose}`;
      }
      
      // Create a new object with server naming convention
      const serverData = {
        title: reviewData.title,
        description: description.trim() || undefined,
        
        // Map the client-side fields to server-side fields
        review_date: reviewData.reviewDate instanceof Date ? reviewData.reviewDate : new Date(reviewData.reviewDate),
        review_type: reviewData.reviewType,
        
        // Status should remain unchanged unless explicitly changed
        status: reviewData.status || undefined,
        
        // Keep other fields that should persist
        created_by: reviewData.created_by || user?.id
      };
      
      // Log what we're sending to help with debugging
      console.log("Sending to server for update:", serverData);
      
      const res = await apiRequest("PATCH", `/api/management-reviews/${id}`, serverData);
      if (!res.ok) {
        const error = await res.text();
        console.error("Server error:", error);
        throw new Error(error || "Failed to update review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Management review updated successfully",
      });
      setEditReviewDialogOpen(false);
      editReviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/management-review-dashboard"] });
      if (selectedReviewId) {
        queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update management review: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
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
        queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId] });
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
  
  const createInputMutation = useMutation({
    mutationFn: async (data: any) => {
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
      setNewInputDialogOpen(false);
      setSelectedInputForEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId, "inputs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add review input: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteInputMutation = useMutation({
    mutationFn: async (inputId: number) => {
      if (!selectedReviewId) throw new Error("No review selected");
      
      const res = await apiRequest("DELETE", `/api/management-reviews/${selectedReviewId}/inputs/${inputId}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Input deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId, "inputs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete input: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const createParticipantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newParticipantSchema>) => {
      if (!selectedReviewId) throw new Error("No review selected");
      
      const res = await apiRequest("POST", `/api/management-reviews/${selectedReviewId}/participants`, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Participant added successfully",
      });
      setNewParticipantDialogOpen(false);
      newParticipantForm.reset();
      setSelectedParticipantForEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId, "participants"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add participant: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteParticipantMutation = useMutation({
    mutationFn: async (participantId: number) => {
      if (!selectedReviewId) throw new Error("No review selected");
      
      const res = await apiRequest("DELETE", `/api/management-reviews/${selectedReviewId}/participants/${participantId}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Participant deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId, "participants"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete participant: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const createActionItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newActionItemSchema>) => {
      if (!selectedReviewId) throw new Error("No review selected");
      
      const res = await apiRequest("POST", `/api/management-reviews/${selectedReviewId}/action-items`, {
        ...data,
        status: "open",
      });
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
      setNewActionItemDialogOpen(false);
      newActionItemForm.reset();
      setSelectedActionItemForEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId, "action-items"] });
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
  
  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof newActionItemSchema> & { status: string }> }) => {
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
      setNewActionItemDialogOpen(false);
      setSelectedActionItemForEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId, "action-items"] });
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
  
  const createSignatureMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signatureSchema>) => {
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
      setSignatureDialogOpen(false);
      signatureForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews", selectedReviewId, "signatures"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to sign review: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Event handlers
  const handleCreateReview = (data: z.infer<typeof newReviewSchema>) => {
    try {
      console.log("Creating new review with data:", data);
      
      // Generate automatic title if none provided
      const title = typeof data.title === 'string' && data.title.trim() === "" ? 
        generateReviewTitle(data.reviewDate, data.reviewType) : data.title;
      
      // Additional validation before submission
      if (typeof data.scope !== 'string' || data.scope.trim() === "") {
        newReviewForm.setError("scope", {
          type: "manual",
          message: "Scope is required"
        });
        
        toast({
          title: "Validation Error",
          description: "Scope is required for the management review",
          variant: "destructive",
        });
        return;
      }
      
      // Check if user is logged in
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to create a management review.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a properly formatted object that matches exactly what the server expects
      const serverData = {
        // Required fields in server format
        title: title,
        reviewDate: data.reviewDate, // Keep in camelCase for client side
        reviewType: data.reviewType, // Keep in camelCase for client side
        
        // Additional metadata
        description: data.description || "",
        scope: data.scope,
        purpose: data.purpose || "",
        status: data.reviewType === "continuous" ? "in-progress" : "scheduled",
        
        // User info
        created_by: user.id, 
        scheduled_by: user.id,
        
        // Optional fields
        facility_id: data.facilityId ? parseInt(data.facilityId) : 1
      };
      
      console.log("Submitting to server:", serverData);
      
      createReviewMutation.mutate(serverData);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Form Submission Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditReview = () => {
    if (!selectedReview) return;
    
    // Set default values for the edit form
    const review = selectedReview as any;
    
    // Extract scope and purpose from description if they're not directly available
    let scope = review.scope || "";
    let purpose = review.purpose || "";
    
    if (!scope || !purpose) {
      // Try to extract from description field
      if (review.description) {
        const descriptionText = review.description;
        const scopeIndex = descriptionText.indexOf('Scope:');
        const purposeIndex = descriptionText.indexOf('Purpose:');
        
        if (scopeIndex !== -1) {
          const scopeStartIndex = scopeIndex + 'Scope:'.length;
          const scopeEndIndex = purposeIndex !== -1 ? purposeIndex : descriptionText.length;
          scope = descriptionText.substring(scopeStartIndex, scopeEndIndex).trim();
        }
        
        if (purposeIndex !== -1) {
          const purposeStartIndex = purposeIndex + 'Purpose:'.length;
          purpose = descriptionText.substring(purposeStartIndex).trim();
        }
      }
    }
    
    // Generate title if empty using our helper function
    let title = review.title || "";
    if (!title || title.trim() === "") {
      const reviewDate = new Date(review.reviewDate || review.review_date || new Date());
      const reviewType = review.reviewType || review.review_type || "standard";
      title = generateReviewTitle(reviewDate, reviewType);
    }
    
    // Reset the form with values from the review
    editReviewForm.reset({
      title: title,
      reviewDate: new Date(review.reviewDate || review.review_date || new Date()),
      reviewType: (review.reviewType || review.review_type || "standard") as "standard" | "critical" | "continuous",
      facilityId: review.facilityId || "",
      scope: scope,
      purpose: purpose,
    });
    
    // Show the edit dialog
    setEditReviewDialogOpen(true);
  };
  
  const handleUpdateReview = (data: z.infer<typeof newReviewSchema>) => {
    if (!selectedReviewId) return;
    
    // Generate automatic title if none provided
    if (!data.title || data.title.trim() === "") {
      data.title = generateReviewTitle(new Date(data.reviewDate), data.reviewType);
    }
    
    // Preserve existing review data that shouldn't change
    const currentReview = selectedReview as any || {};
    
    // Create a clean update with only the fields we want to change
    const updateData = {
      id: selectedReviewId,
      title: data.title,
      scope: data.scope,
      purpose: data.purpose,
      reviewDate: data.reviewDate,
      reviewType: data.reviewType,
      // Only include the status if it exists
      ...(currentReview.status && { status: currentReview.status }),
      // Keep other server fields if they exist
      ...(currentReview.created_by && { created_by: currentReview.created_by }),
      ...(currentReview.scheduled_by && { scheduled_by: currentReview.scheduled_by })
    };
    
    console.log("Updating review with data:", updateData);
    updateReviewMutation.mutate(updateData);
  };
  
  const handleDeleteReview = () => {
    if (!selectedReviewId) return;
    deleteReviewMutation.mutate(selectedReviewId);
  };
  
  const handleUpdateStatus = (status: string) => {
    if (!selectedReviewId) return;
    updateReviewStatusMutation.mutate({ id: selectedReviewId, status });
  };
  
  const handleAddInput = () => {
    setSelectedInputForEdit(null);
    setNewInputDialogOpen(true);
  };
  
  const handleEditInput = (input: any) => {
    setSelectedInputForEdit(input);
    setNewInputDialogOpen(true);
  };
  
  const handleDeleteInput = (inputId: number) => {
    deleteInputMutation.mutate(inputId);
  };
  
  const handleInputSubmit = (data: any) => {
    createInputMutation.mutate(data);
  };
  
  const handleAddParticipant = () => {
    setSelectedParticipantForEdit(null);
    setNewParticipantDialogOpen(true);
  };
  
  const handleEditParticipant = (participant: any) => {
    setSelectedParticipantForEdit(participant);
    newParticipantForm.reset({
      userId: participant.userId.toString(),
      role: participant.role,
      attended: participant.attended,
    });
    setNewParticipantDialogOpen(true);
  };
  
  const handleParticipantSubmit = (data: z.infer<typeof newParticipantSchema>) => {
    createParticipantMutation.mutate(data);
  };
  
  const handleDeleteParticipant = (participantId: number) => {
    deleteParticipantMutation.mutate(participantId);
  };
  
  const handleAddActionItem = () => {
    setSelectedActionItemForEdit(null);
    setNewActionItemDialogOpen(true);
  };
  
  const handleEditActionItem = (actionItem: any) => {
    setSelectedActionItemForEdit(actionItem);
    newActionItemForm.reset({
      description: actionItem.description || "",
      assignedTo: actionItem.assignedTo ? actionItem.assignedTo.toString() : "",
      dueDate: actionItem.dueDate ? new Date(actionItem.dueDate) : new Date(),
      priority: actionItem.priority || "medium",
      notes: actionItem.notes || "",
    });
    setNewActionItemDialogOpen(true);
  };
  
  const handleActionItemSubmit = (data: z.infer<typeof newActionItemSchema>) => {
    if (selectedActionItemForEdit) {
      updateActionItemMutation.mutate({
        id: selectedActionItemForEdit.id,
        data: data,
      });
    } else {
      createActionItemMutation.mutate(data);
    }
  };
  
  const handleSignReview = () => {
    setSignatureDialogOpen(true);
  };
  
  const handleSignatureSubmit = (data: z.infer<typeof signatureSchema>) => {
    createSignatureMutation.mutate(data);
  };
  
  // Back to dashboard
  const handleBackToDashboard = () => {
    setSelectedReviewId(null);
  };
  
  const isLoading = 
    isLoadingDashboard || 
    isLoadingUsers || 
    (selectedReviewId && (
      isLoadingReview || 
      isLoadingInputs || 
      isLoadingParticipants || 
      isLoadingActionItems || 
      isLoadingSignatures
    ));
  
  // Ensure we always pass arrays to components
  const safeReviewInputs = Array.isArray(reviewInputs) ? reviewInputs : [];
  const safeReviewParticipants = Array.isArray(reviewParticipants) ? reviewParticipants : [];
  const safeReviewActionItems = Array.isArray(reviewActionItems) ? reviewActionItems : [];
  const safeReviewSignatures = Array.isArray(reviewSignatures) ? reviewSignatures : [];
  const safeUsers = Array.isArray(users) ? users : [];
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <PageHeader
        title={selectedReviewId ? "Management Review Details" : "Management Review"}
        description={selectedReviewId 
          ? "View and manage details for this management review"
          : "ISO 13485:2016 requires regular, documented reviews of your quality management system effectiveness"
        }
      />

      {/* Back to Dashboard Button */}
      {selectedReviewId && (
        <button
          onClick={handleBackToDashboard}
          className="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center"
        >
          &larr; Back to Dashboard
        </button>
      )}

      {/* New Review Button (Always visible at top when on dashboard) */}
      {!selectedReviewId && (
        <div className="mb-4">
          <Button 
            onClick={() => {
              console.log("Schedule New Review button clicked from top button");
              setNewReviewDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white font-medium"
          >
            Schedule New Review
          </Button>
        </div>
      )}
      
      {/* Main Content */}
      {!selectedReviewId ? (
        <ManagementReviewDashboard
          dashboardData={dashboardData || {}}
          isLoading={Boolean(isLoading)}
          onNewReview={() => {
            console.log("Schedule New Review button clicked from dashboard");
            setNewReviewDialogOpen(true);
          }}
          onViewReview={(id) => setSelectedReviewId(id)}
        />
      ) : (
        <ReviewDetail
          review={selectedReview}
          inputs={safeReviewInputs}
          participants={safeReviewParticipants}
          actionItems={safeReviewActionItems}
          signatures={safeReviewSignatures}
          users={safeUsers}
          isLoading={Boolean(isLoading)}
          onAddInput={handleAddInput}
          onAddParticipant={handleAddParticipant}
          onAddActionItem={handleAddActionItem}
          onSignReview={handleSignReview}
          onUpdateStatus={handleUpdateStatus}
          onEditReview={handleEditReview}
          onDeleteReview={handleDeleteReview}
          onEditInput={handleEditInput}
          onDeleteInput={handleDeleteInput}
          onEditActionItem={handleEditActionItem}
          onEditParticipant={handleEditParticipant}
          onDeleteParticipant={handleDeleteParticipant}
        />
      )}

      {/* New Review Input Dialog */}
      <ReviewInputForm
        open={newInputDialogOpen}
        onOpenChange={setNewInputDialogOpen}
        onSubmit={handleInputSubmit}
        users={Array.isArray(users) ? users : []}
        isSubmitting={createInputMutation.isPending}
        initialData={selectedInputForEdit}
        reviewId={selectedReviewId || 0}
      />
      
      {/* New Review Dialog */}
      <Dialog 
        open={newReviewDialogOpen} 
        onOpenChange={(open) => {
          console.log("Dialog open state changing to:", open);
          
          // When dialog closes, reset form if there was an error
          if (!open && createReviewMutation.isError) {
            // Wait for animation to complete before resetting
            setTimeout(() => {
              newReviewForm.reset();
              // Reset the mutation state
              createReviewMutation.reset();
            }, 300);
          }
          setNewReviewDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Schedule New Management Review</DialogTitle>
            <DialogDescription>
              Create a new management review meeting. You can add participants and input categories after creation.
              {createReviewMutation.isError && (
                <div className="mt-2 p-2 bg-red-50 text-red-600 rounded-md text-sm">
                  Please correct the errors below and try again.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...newReviewForm}>
            <form onSubmit={newReviewForm.handleSubmit(handleCreateReview)} className="space-y-4">
              <FormField
                control={newReviewForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Annual Management Review 2025" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave blank for auto-generated title based on date and type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newReviewForm.control}
                name="reviewDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center">
                      Review Date
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <DatePicker 
                      date={field.value} 
                      onSelect={field.onChange}
                    />
                    <FormDescription>
                      Date when the management review will be conducted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newReviewForm.control}
                name="reviewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Review Type
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select defaultValue={field.value} onValueChange={field.onChange}>
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
                      Type of management review being conducted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newReviewForm.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Scope
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Define the scope of this management review" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Define what will be covered in this management review
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newReviewForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose of this review" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Explanation of why this review is being conducted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4 flex justify-between gap-2">
                <div>
                  {createReviewMutation.isError && (
                    <div className="text-red-600 text-sm p-2">
                      <span className="font-medium">Error:</span> {createReviewMutation.error?.message || "Failed to create review"}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setNewReviewDialogOpen(false);
                      // Reset form after animation completes
                      setTimeout(() => {
                        newReviewForm.reset();
                        if (createReviewMutation.isError) {
                          createReviewMutation.reset();
                        }
                      }, 300);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createReviewMutation.isPending}
                  >
                    {createReviewMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      "Schedule Review"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Review Dialog */}
      <Dialog open={editReviewDialogOpen} onOpenChange={setEditReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Management Review</DialogTitle>
            <DialogDescription>
              Update the details of this management review.
            </DialogDescription>
          </DialogHeader>
          <Form {...editReviewForm}>
            <form onSubmit={editReviewForm.handleSubmit(handleUpdateReview)} className="space-y-4">
              <FormField
                control={editReviewForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Annual Management Review 2025" {...field} />
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
                    <FormLabel>Review Date</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      onSelect={field.onChange}
                    />
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editReviewForm.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Define the scope of this management review" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editReviewForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose of this review" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateReviewMutation.isPending}
                >
                  {updateReviewMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Review
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}