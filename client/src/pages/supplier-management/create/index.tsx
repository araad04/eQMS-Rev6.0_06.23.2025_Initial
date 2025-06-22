import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from "react-helmet";
import { Save, ArrowLeft } from 'lucide-react';
import { addYears, format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { navigateTo } from '@/lib/navigation';
import PageHeader from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { 
  supplierCategories, 
  supplierStatuses, 
  criticalityLevels, 
  riskLevels,
  productCategories 
} from '@/__tests__/mocks/supplier-data';

// Form schema validation
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Name must be at least 3 characters",
  }),
  supplierId: z.string().min(3, {
    message: "Supplier ID must be at least 3 characters",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters",
  }),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2, {
    message: "Country is required",
  }),
  contactName: z.string().min(3, {
    message: "Contact name must be at least 3 characters",
  }),
  contactEmail: z.string().email({
    message: "Please enter a valid email address",
  }),
  contactPhone: z.string().min(5, {
    message: "Phone number must be at least 5 characters",
  }),
  categoryId: z.number({
    required_error: "Please select a supplier category",
  }),
  statusId: z.number({
    required_error: "Please select a status",
  }),
  criticalityId: z.number({
    required_error: "Please select a criticality level",
  }),
  riskId: z.number({
    required_error: "Please select a risk level",
  }),
  qualificationDate: z.string().optional(),
  requalificationDate: z.string().optional(),
  lastAuditDate: z.string().optional(),
  nextAuditDate: z.string().optional(),
  productCategories: z.array(z.number()).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Supplier Creation Page
 * - Allows creation of new suppliers with detailed information
 * - Implements comprehensive risk assessment and categorization
 * - Supports IEC 62304 compliance through risk and criticality classification
 * 
 * IEC 62304 Compliance:
 * - Implements REQ-SUPP-001: Supplier Information Management
 * - Implements REQ-SUPP-002: Supplier Risk Assessment
 */
export default function CreateSupplierPage() {
  const { toast } = useToast();
  const [selectedProductCategories, setSelectedProductCategories] = useState<number[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      supplierId: `SUP-${new Date().getFullYear().toString().substring(2)}-`,
      description: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      categoryId: undefined,
      statusId: 2, // Default to Pending
      criticalityId: undefined,
      riskId: undefined,
      qualificationDate: "",
      requalificationDate: "",
      lastAuditDate: "",
      nextAuditDate: "",
      productCategories: [],
      notes: "",
    },
  });

  // Function to calculate dates based on criticality
  const calculateDates = (qualificationDate: string, criticalityId: number) => {
    console.log('🔧 SUP007 Debug - calculateDates called:', { qualificationDate, criticalityId });
    
    if (!qualificationDate || !criticalityId) {
      console.log('🔧 SUP007 Debug - Missing data, returning early');
      return;
    }

    const qualDate = new Date(qualificationDate);
    if (isNaN(qualDate.getTime())) {
      console.log('🔧 SUP007 Debug - Invalid date, returning early');
      return;
    }

    // Map criticality ID to name (1=Critical, 2=Major, 3=Minor)
    const criticalityMap: { [key: number]: { requalYears: number; auditYears: number | null } } = {
      1: { requalYears: 1, auditYears: 1 }, // Critical
      2: { requalYears: 2, auditYears: 3 }, // Major  
      3: { requalYears: 4, auditYears: null }, // Minor
    };

    const config = criticalityMap[criticalityId];
    console.log('🔧 SUP007 Debug - Config found:', config);
    
    if (!config) {
      console.log('🔧 SUP007 Debug - No config for criticalityId:', criticalityId);
      return;
    }

    // Calculate requalification date
    const requalDate = addYears(qualDate, config.requalYears);
    const requalDateFormatted = format(requalDate, 'yyyy-MM-dd');
    console.log('🔧 SUP007 Debug - Setting requalification date:', requalDateFormatted);
    form.setValue('requalificationDate', requalDateFormatted);

    // Calculate audit date if required
    if (config.auditYears) {
      const auditDate = addYears(qualDate, config.auditYears);
      const auditDateFormatted = format(auditDate, 'yyyy-MM-dd');
      console.log('🔧 SUP007 Debug - Setting audit date:', auditDateFormatted);
      form.setValue('nextAuditDate', auditDateFormatted);
    } else {
      console.log('🔧 SUP007 Debug - No audit required for Minor criticality');
      form.setValue('nextAuditDate', ''); // Clear for Minor criticality
    }
  };

  // Watch for changes in qualification date and criticality
  const qualificationDate = form.watch('qualificationDate');
  const criticalityId = form.watch('criticalityId');

  useEffect(() => {
    console.log('🔧 SUP007 Debug - useEffect triggered:', { qualificationDate, criticalityId });
    if (qualificationDate && criticalityId) {
      calculateDates(qualificationDate, criticalityId);
    }
  }, [qualificationDate, criticalityId]);

  // Create supplier mutation
  const createSupplier = useMutation({
    mutationFn: async (data: FormValues) => {
      // In a real application, this would be an API call
      // For testing purposes, we'll just simulate a successful response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data });
        }, 500);
      });
    },
    onSuccess: () => {
      toast({
        title: "Supplier created",
        description: "The supplier has been created successfully.",
      });
      navigateTo('/supplier-management');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating supplier",
        description: error.message || "There was an error creating the supplier.",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    // Add the selected product categories to the form data
    data.productCategories = selectedProductCategories;
    createSupplier.mutate(data);
  };

  // Handle product category checkbox changes
  const handleProductCategoryChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProductCategories((prev) => [...prev, id]);
    } else {
      setSelectedProductCategories((prev) => prev.filter((cat) => cat !== id));
    }
  };

  return (
    <>
      <Helmet>
        <title>Add New Supplier | eQMS</title>
        <meta 
          name="description" 
          content="Add a new supplier with comprehensive risk assessment and compliance information." 
        />
      </Helmet>

      <div className="container p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateTo('/supplier-management')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Suppliers
          </Button>
        </div>

        <PageHeader
          title="Add New Supplier"
          description="Create a new supplier record with detailed information for compliance and risk management"
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
            {/* Basic Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MedicalComponents Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier ID <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SUP-23-001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this supplier
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
                      <FormLabel>Supplier Category <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supplierCategories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the supplier and their products/services"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address & Contact Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Address & Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Street Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State/Province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Postal Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Japan">Japan</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="md:col-span-2 my-2" />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Primary contact name" {...field} />
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
                      <FormLabel>Contact Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
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
                      <FormLabel>Contact Phone <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Quality & Compliance Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Quality & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="criticalityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criticality Level <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const criticalityId = parseInt(value);
                          field.onChange(criticalityId);
                          console.log('🔧 SUP007 Debug - Criticality changed:', criticalityId);
                          
                          // Trigger calculation immediately when criticality changes
                          const currentQualDate = form.getValues('qualificationDate');
                          if (currentQualDate && criticalityId) {
                            calculateDates(currentQualDate, criticalityId);
                          }
                        }}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select criticality level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {criticalityLevels.map((level) => (
                            <SelectItem 
                              key={level.id} 
                              value={level.id.toString()}
                            >
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Critical: Every 1 year | Major: Every 2-3 years | Minor: Every 4 years
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Risk Level <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {riskLevels.map((level) => (
                            <SelectItem 
                              key={level.id} 
                              value={level.id.toString()}
                            >
                              {level.name}
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
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification Status <span className="text-red-500">*</span></FormLabel>
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
                          {supplierStatuses.map((status) => (
                            <SelectItem 
                              key={status.id} 
                              value={status.id.toString()}
                            >
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col space-y-1.5">
                  <h3 className="text-sm font-medium">Product Categories</h3>
                  <div className="flex flex-col space-y-2">
                    {productCategories.map((category) => (
                      <div className="flex items-center space-x-2" key={category.id}>
                        <Checkbox 
                          id={`category-${category.id}`} 
                          onCheckedChange={(checked: boolean) => 
                            handleProductCategoryChange(category.id, checked)
                          }
                          checked={selectedProductCategories.includes(category.id)}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="qualificationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requalificationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requalification Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastAuditDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Audit Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nextAuditDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Audit Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information about this supplier"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigateTo('/supplier-management')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createSupplier.isPending}
                >
                  {createSupplier.isPending && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
}