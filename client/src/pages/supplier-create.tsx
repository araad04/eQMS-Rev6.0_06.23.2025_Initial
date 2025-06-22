import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateRequalificationDate } from "@/utils/supplier-criticality";
import { CriticalityInfo } from "@/components/supplier-management/criticality-info";

// Form schema for creating a new supplier
const supplierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  supplierId: z.string().min(1, "Supplier ID is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  statusId: z.coerce.number().min(1, "Status is required"),
  criticality: z.enum(["Critical", "Major", "Minor"], {
    required_error: "Criticality is required"
  }),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
  qualificationDate: z.date().optional(),
  requalificationDate: z.date().optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function SupplierCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Generate a unique Supplier ID
  const generateSupplierId = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SUP-${year}-${month}-${random}`;
  };
  
  // Form for creating a new supplier
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      supplierId: generateSupplierId(),
      description: "",
      categoryId: 1, // Default to 'Critical'
      statusId: 2, // Default to 'Pending Qualification'
      criticality: "Critical",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      qualificationDate: undefined,
      requalificationDate: undefined,
    },
  });

  // Watch for changes in qualification date and criticality
  const qualificationDate = form.watch("qualificationDate");
  const criticality = form.watch("criticality");

  // Automatically calculate requalification date when qualification date or criticality changes
  useEffect(() => {
    console.log('🔧 SUP007 Debug - useEffect triggered:', { qualificationDate: qualificationDate?.toISOString() || '', criticality });
    
    if (qualificationDate && criticality) {
      try {
        const calculatedDate = calculateRequalificationDate(qualificationDate, criticality);
        console.log('🔧 SUP007 Debug - Calculated requalification date:', calculatedDate.toISOString());
        
        // Update the form with the calculated requalification date
        form.setValue("requalificationDate", calculatedDate, { 
          shouldValidate: true,
          shouldDirty: true 
        });
      } catch (error) {
        console.error('Error calculating requalification date:', error);
      }
    }
  }, [qualificationDate, criticality, form]);
  
  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Supplier added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      navigate("/supplier-management");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: SupplierFormValues) => {
    createSupplierMutation.mutate(data);
  };
  
  return (
    <>
      <PageHeader 
        title="Add Supplier"
        description="Add a new supplier to your QMS"
        actions={[
          {
            label: "Back to Suppliers",
            href: "/supplier-management",
            icon: <ArrowLeft className="h-5 w-5" />,
            variant: "outline",
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Auto-generated ID for this supplier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Category</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Critical</SelectItem>
                            <SelectItem value="2">Major</SelectItem>
                            <SelectItem value="3">Minor</SelectItem>
                            <SelectItem value="4">Service Provider</SelectItem>
                            <SelectItem value="5">Consultant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Category that best describes this supplier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter supplier name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The official name of the supplier
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the supplier's services or products" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Brief description of what this supplier provides
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Criticality</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select criticality level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Critical">Critical (1 year requalification)</SelectItem>
                          <SelectItem value="Major">Major (2 year requalification)</SelectItem>
                          <SelectItem value="Minor">Minor (4 year requalification)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Critical suppliers directly impact product safety and require annual requalification
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter supplier address" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Full address of the supplier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State or Province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact person" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="statusId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Approved</SelectItem>
                            <SelectItem value="2">Pending Qualification</SelectItem>
                            <SelectItem value="3">On Probation</SelectItem>
                            <SelectItem value="4">Suspended</SelectItem>
                            <SelectItem value="5">Disqualified</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="qualificationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Qualification Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={!field.value ? "text-muted-foreground" : ""}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                        <FormDescription>
                          Date when supplier was qualified (if applicable)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requalificationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Requalification Date (Auto-calculated)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={!field.value ? "text-muted-foreground" : ""}
                              disabled={true}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Will be calculated automatically</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                      </Popover>
                      <FormDescription>
                        Automatically calculated based on qualification date and criticality level
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show criticality information when criticality and qualification date are selected */}
                {criticality && qualificationDate && (
                  <CriticalityInfo
                    criticality={criticality}
                    qualificationDate={qualificationDate.toISOString().split('T')[0]}
                    requalificationDate={form.watch("requalificationDate")?.toISOString().split('T')[0]}
                  />
                )}

                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => navigate("/supplier-management")}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSupplierMutation.isPending}
                  >
                    {createSupplierMutation.isPending ? "Creating..." : "Create Supplier"}
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