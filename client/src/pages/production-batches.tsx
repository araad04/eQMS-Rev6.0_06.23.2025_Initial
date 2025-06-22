import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, ClipboardList, AlertCircle, Loader2, FileText, Beaker } from "lucide-react";
import PageHeader from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { BadgeColored } from "@/components/ui/badge-colored";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { insertProductionBatchSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

// Extended schema with validation rules
const batchFormSchema = insertProductionBatchSchema.extend({
  batchNumber: z.string().min(1, {
    message: "Batch number is required."
  }),
  batchSize: z.number().min(1, {
    message: "Batch size must be at least 1."
  }),
  startDate: z.date({
    required_error: "Start date is required.",
  }).optional(),
  productId: z.number().min(1, {
    message: "Product selection is required."
  })
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

// Helper function to get the badge variant based on status
function getBatchStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'planned':
      return <BadgeColored variant="gray">{status}</BadgeColored>;
    case 'in-progress':
      return <BadgeColored variant="blue">{status}</BadgeColored>;
    case 'completed':
      return <BadgeColored variant="green">{status}</BadgeColored>;
    case 'on-hold':
      return <BadgeColored variant="yellow">{status}</BadgeColored>;
    case 'cancelled':
      return <BadgeColored variant="red">{status}</BadgeColored>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function ProductionBatchesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Get product ID from URL params if available
  const urlParams = new URLSearchParams(window.location.search);
  const productIdParam = urlParams.get('productId');

  React.useEffect(() => {
    if (productIdParam) {
      const parsedId = parseInt(productIdParam);
      if (!isNaN(parsedId)) {
        setSelectedProductId(parsedId);
      }
    }
  }, [productIdParam]);

  // Fetch products for the select dropdown
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/production/products"],
    queryFn: async () => {
      const response = await fetch("/api/production/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  // Fetch batches, optionally filtered by product ID
  const { data: batches, isLoading: isLoadingBatches, error } = useQuery({
    queryKey: ["/api/production/batches", selectedProductId],
    queryFn: async () => {
      const url = selectedProductId 
        ? `/api/production/batches?productId=${selectedProductId}`
        : "/api/production/batches";
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }
      return response.json();
    },
  });

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (data: BatchFormValues) => {
      const response = await apiRequest("POST", "/api/production/batches", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production/batches"] });
      setDialogOpen(false);
      toast({
        title: "Batch created",
        description: "The production batch has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      productId: selectedProductId || undefined,
      batchNumber: "",
      batchSize: 1,
      status: "planned",
      notes: "",
    },
  });

  // Update form when selected product changes
  React.useEffect(() => {
    if (selectedProductId) {
      form.setValue("productId", selectedProductId);
    }
  }, [selectedProductId, form]);

  function onSubmit(data: BatchFormValues) {
    // Ensure productId is a number and add required fields matching database schema
    const formData = {
      ...data,
      productId: Number(data.productId),
      batchSize: Number(data.batchSize),
      createdBy: 9999, // Use current user ID
      status: data.status || "planned",
    };
    createBatchMutation.mutate(formData);
  }

  // Handle product filter change
  function handleProductFilterChange(productId: string | null) {
    if (productId && productId !== 'all') {
      setSelectedProductId(parseInt(productId));
      setLocation(`/production/batches?productId=${productId}`);
    } else {
      setSelectedProductId(null);
      setLocation('/production/batches');
    }
  }

  return (
    <div className="container py-6">
      <PageHeader
        title="Production Batches"
        description="Manage your production batches"
        actions={
          <>
            <Select
              value={selectedProductId?.toString() || ""}
              onValueChange={(value) => handleProductFilterChange(value || null)}
            >
              <SelectTrigger className="w-[240px] mr-2">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products?.map((product: { id: number; name: string }) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Production Batch</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to create a new production batch.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Leave empty for auto-generated LOT-YYYY-XXX" {...field} />
                          </FormControl>
                          <FormDescription>
                            Will be automatically generated as LOT-YYYY-XXX if left empty.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select
                            value={field.value?.toString() || ""}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products?.map((product: { id: number; name: string }) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter batch number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for this production batch.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="batchSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter batch size" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of units to be produced in this batch.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date (Optional)</FormLabel>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            defaultValue={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="on-hold">On Hold</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any special instructions or notes for this batch..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit"
                        disabled={createBatchMutation.isPending}
                      >
                        {createBatchMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Batch
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Loading state */}
      {(isLoadingBatches || isLoadingProducts) && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="mt-6 border-destructive bg-destructive/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to load batches: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {batches && batches.length === 0 && !isLoadingBatches && (
        <Card className="mt-6">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-10">
            <Beaker className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No batches yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedProductId
                ? "No batches found for the selected product."
                : "Create your first production batch to start tracking production."}
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Batch
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Display batches */}
      {batches && batches.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Production Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Planned Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch: { id: number; batchNumber: string; productId: number; plannedStartDate: string | Date; plannedEndDate: string | Date; status: string }) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                    <TableCell>
                      {products?.find((p: { id: number; name: string }) => p.id === batch.productId)?.name || `Product ${batch.productId}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Start: {format(new Date(batch.plannedStartDate), "MMM d, yyyy")}</span>
                        <span className="text-xs text-muted-foreground">End: {format(new Date(batch.plannedEndDate), "MMM d, yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getBatchStatusBadge(batch.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/production/batches/${batch.id}`}>
                          <Button size="icon" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/production/batches/${batch.id}/edit`}>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}