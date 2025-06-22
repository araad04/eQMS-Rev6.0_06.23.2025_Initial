import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { navigateTo } from "@/lib/navigation";
import { format } from "date-fns";

// Components
import PageHeader from "@/components/page-header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { 
  Calendar,
  ClipboardList,
  Filter,
  PlusCircle,
  Search,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
import { ManagementReview } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Helper functions
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "scheduled":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Scheduled</Badge>;
    case "in-progress":
    case "in progress":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">In Progress</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Format the review title to extract just the descriptive part after the ID
const formatReviewTitle = (title: string) => {
  if (!title) return "";
  
  // If title includes a review number (e.g., MR-2025-001: Some Title)
  if (title.includes(":")) {
    return title.split(":")[1].trim();
  }
  
  return title;
};

const ManagementReviewList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<ManagementReview | null>(null);

  // Query management reviews
  const { 
    data: managementReviews = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/management-reviews'],
    retry: 1,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/management-reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete management review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/management-reviews'] });
      toast({
        title: "Management Review Deleted",
        description: "The management review has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert to array if not already (for type safety)
  const reviewsArray = Array.isArray(managementReviews) ? managementReviews : [];

  // Apply filters
  const filteredReviews = reviewsArray.filter((review: ManagementReview) => {
    // Text search
    const matchesSearch = searchTerm === "" || 
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === null || 
      review.status?.toLowerCase() === statusFilter.toLowerCase();
    
    // Type filter
    const matchesType = typeFilter === null || 
      review.review_type?.toLowerCase() === typeFilter.toLowerCase();
    
    // Tab filter
    if (currentTab === "all") return matchesSearch && matchesStatus && matchesType;
    if (currentTab === "scheduled") return matchesSearch && matchesStatus && matchesType && review.status?.toLowerCase() === "scheduled";
    if (currentTab === "in-progress") return matchesSearch && matchesStatus && matchesType && review.status?.toLowerCase() === "in-progress";
    if (currentTab === "completed") return matchesSearch && matchesStatus && matchesType && review.status?.toLowerCase() === "completed";
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle error state
  if (error) {
    console.error("Error fetching management reviews:", error);
    toast({
      title: "Error",
      description: "Failed to load management reviews. Please try again.",
      variant: "destructive",
    });
  }

  // Metrics calculations
  const totalReviews = reviewsArray.length;
  const scheduledReviews = reviewsArray.filter(r => r.status?.toLowerCase() === "scheduled").length;
  const inProgressReviews = reviewsArray.filter(r => r.status?.toLowerCase() === "in-progress").length;
  const completedReviews = reviewsArray.filter(r => r.status?.toLowerCase() === "completed").length;

  // Handle row click to navigate to detail page
  const handleRowClick = (reviewId: number) => {
    navigateTo(`/management-review/${reviewId}`);
  };

  // Handle creating a new review
  const handleCreateReview = () => {
    navigateTo('/management-review/create');
  };

  // Handle delete action
  const handleDeleteClick = (review: ManagementReview, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (reviewToDelete) {
      deleteMutation.mutate(reviewToDelete.id);
      setReviewToDelete(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Management Reviews | eQMS</title>
        <meta name="description" content="View and manage quality management system reviews" />
      </Helmet>

      <div className="container mx-auto py-6">
        <PageHeader
          title="Management Reviews"
          description="Schedule, manage, and track management review meetings"
          actions={
            <Button onClick={handleCreateReview}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule Review
            </Button>
          }
        />

        {/* Dashboard metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <ClipboardList className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
              <p className="text-2xl font-bold">{totalReviews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Calendar className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Scheduled</p>
              <p className="text-2xl font-bold">{scheduledReviews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Calendar className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-2xl font-bold">{inProgressReviews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Calendar className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold">{completedReviews}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Management Review List</CardTitle>
            <CardDescription>
              View all scheduled and completed management reviews
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={typeFilter || ""}
                  onValueChange={(value) => setTypeFilter(value || null)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Review Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Special">Special</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[140px]">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("scheduled")}>
                      Scheduled
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("in-progress")}>
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                      Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {renderReviewsTable(filteredReviews, isLoading, handleRowClick, handleDeleteClick)}
              </TabsContent>
              <TabsContent value="scheduled">
                {renderReviewsTable(filteredReviews, isLoading, handleRowClick, handleDeleteClick)}
              </TabsContent>
              <TabsContent value="in-progress">
                {renderReviewsTable(filteredReviews, isLoading, handleRowClick, handleDeleteClick)}
              </TabsContent>
              <TabsContent value="completed">
                {renderReviewsTable(filteredReviews, isLoading, handleRowClick, handleDeleteClick)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title="Delete Management Review"
          description={`Are you sure you want to delete ${reviewToDelete?.title || 'this management review'}? This action cannot be undone and will remove all associated data.`}
          itemName={reviewToDelete?.title}
        />
      </div>
    </>
  );
};

// Helper function to render the reviews table
const renderReviewsTable = (
  reviews: ManagementReview[], 
  isLoading: boolean, 
  handleRowClick: (id: number) => void,
  handleDeleteClick: (review: ManagementReview, event: React.MouseEvent) => void
) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-lg font-medium">No management reviews found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or create a new management review
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Review ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Review Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow 
              key={review.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(review.id)}
            >
              <TableCell className="font-medium">
                {review.title?.includes(':') 
                  ? review.title.split(':')[0].trim() 
                  : `MR-${review.id}`}
              </TableCell>
              <TableCell>{formatReviewTitle(review.title)}</TableCell>
              <TableCell>{review.review_type}</TableCell>
              <TableCell>{getStatusBadge(review.status)}</TableCell>
              <TableCell>
                {review.review_date 
                  ? format(new Date(review.review_date), 'MMM d, yyyy')
                  : 'Not scheduled'}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleDeleteClick(review, e)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ManagementReviewList;