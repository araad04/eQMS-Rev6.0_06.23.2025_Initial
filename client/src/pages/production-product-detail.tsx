import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertProductSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

// Extended schema with validation rules
const productFormSchema = insertProductSchema.extend({
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters."
  }),
  productCode: z.string().min(1, {
    message: "Product code is required."
  }),
  description: z.string().optional(),
  category: z.string().optional(),
  classification: z.string().optional(),
  regulatoryStatus: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductDetailPage() {
  const { toast } = useToast();
  const { id } = useParams();
  const [, setLocation] = useLocation();

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["/api/production/products", parseInt(id!)],
    queryFn: async () => {
      const response = await fetch(`/api/production/products/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await apiRequest("PATCH", `/api/production/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/products", parseInt(id!)] });
      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      productCode: "",
      description: "",
      category: "",
      classification: "",
      regulatoryStatus: "",
      notes: "",
      isActive: true,
    },
  });

  // Update form when product data loads
  React.useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        productCode: product.productCode || "",
        description: product.description || "",
        category: product.category || "",
        classification: product.classification || "",
        regulatoryStatus: product.regulatoryStatus || "",
        notes: product.notes || "",
        isActive: product.isActive ?? true,
      });
    }
  }, [product, form]);

  function onSubmit(data: ProductFormValues) {
    updateProductMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-6">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load product: {error instanceof Error ? error.message : "Product not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <PageHeader
        title={`Edit Product: ${product.name}`}
        description="Update product information and specifications"
        actions={
          <Button
            variant="outline"
            onClick={() => setLocation("/production/products")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        }
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name should clearly identify the product.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product code" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique identifier for the product.
                      </FormDescription>
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
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classification</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter classification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regulatoryStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regulatory Status</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter regulatory status" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>
                          Whether this product is currently active in production.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter product description" 
                        {...field} 
                        value={field.value || ""}
                        rows={3}
                      />
                    </FormControl>
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
                        placeholder="Enter additional notes" 
                        {...field} 
                        value={field.value || ""}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}