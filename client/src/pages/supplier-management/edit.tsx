import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';

import { useToast } from '@/hooks/use-toast';
import { navigateTo } from '@/lib/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { mockSuppliers } from '@/__tests__/mocks/supplier-data';

/**
 * Supplier Edit Page
 * - Provides a form to edit an existing supplier's information
 * - Handles validation and form submission
 * - Supports criticality classification and risk assessment
 * 
 * IEC 62304 Compliance:
 * - Implements REQ-SUPP-001: Supplier Information Management
 * - Implements REQ-SUPP-003: Supplier Risk Assessment
 * - Implements REQ-SUPP-009: Supplier Data Maintenance
 */
export default function SupplierEditPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // For demonstration, using mock data
  // In production, this would fetch the supplier data based on the ID
  const supplierData = mockSuppliers.find(s => s.id === parseInt(id || '0')) || mockSuppliers[0];

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(2, { message: "Supplier name must be at least 2 characters." }),
    description: z.string().optional(),
    category: z.string({ required_error: "Please select a category" }),
    criticality: z.string({ required_error: "Please select criticality" }),
    riskLevel: z.string({ required_error: "Please select a risk level" }),
    status: z.string({ required_error: "Please select a status" }),
    contactName: z.string().min(2, { message: "Contact name must be at least 2 characters." }),
    contactEmail: z.string().email({ message: "Please enter a valid email address." }),
    contactPhone: z.string().optional(),
    address: z.string().min(5, { message: "Address must be at least 5 characters." }),
    city: z.string().min(2, { message: "City must be at least 2 characters." }),
    state: z.string().min(2, { message: "State must be at least 2 characters." }),
    postalCode: z.string().min(2, { message: "Postal code must be at least 2 characters." }),
    country: z.string().min(2, { message: "Country must be at least 2 characters." }),
    qualificationDate: z.date().optional().nullable(),
    requalificationDate: z.date().optional().nullable(),
    notes: z.string().optional(),
  });

  // Initialize form with supplier data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: supplierData?.name || '',
      description: supplierData?.description || '',
      category: supplierData?.category || '',
      criticality: supplierData?.criticality || '',
      riskLevel: supplierData?.riskLevel || '',
      status: supplierData?.status || '',
      contactName: supplierData?.contactName || '',
      contactEmail: supplierData?.contactEmail || '',
      contactPhone: supplierData?.contactPhone || '',
      address: supplierData?.address || '',
      city: supplierData?.city || '',
      state: supplierData?.state || '',
      postalCode: supplierData?.postalCode || '',
      country: supplierData?.country || '',
      qualificationDate: supplierData?.qualificationDate ? new Date(supplierData.qualificationDate) : null,
      requalificationDate: supplierData?.requalificationDate ? new Date(supplierData.requalificationDate) : null,
      notes: supplierData?.notes || '',
    }
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // In production, this would send the updated data to the server
      console.log('Form submitted with values:', values);
      
      toast({
        title: 'Success!',
        description: 'Supplier information has been updated.',
      });
      
      // Navigate back to supplier detail page
      setTimeout(() => {
        navigateTo('/supplier-management/detail');
      }, 1500);
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to update supplier information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onCancel = () => {
    navigateTo('/supplier-management/detail');
  };

  return (
    <>
      <Helmet>
        <title>Edit Supplier | eQMS</title>
        <meta 
          name="description" 
          content="Edit supplier information in the eQMS system."
        />
      </Helmet>

      <div className="container p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Supplier Details
          </Button>
        </div>

        <PageHeader 
          title={`Edit Supplier: ${supplierData?.name}`}
          description="Update supplier information and classification"
        />

        {supplierData?.criticality === 'Critical' && (
          <Alert className="mb-6 border-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Supplier</AlertTitle>
            <AlertDescription>
              This is a critical supplier that directly impacts product safety and efficacy.
              Changes to critical supplier information require additional verification per ISO 13485:2016.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic-info" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic-info">Basic Information</TabsTrigger>
                <TabsTrigger value="classification">Classification & Risk</TabsTrigger>
                <TabsTrigger value="contact">Contact & Address</TabsTrigger>
                <TabsTrigger value="qualification">Qualification</TabsTrigger>
              </TabsList>

              <TabsContent value="basic-info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter supplier name" {...field} />
                          </FormControl>
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
                              placeholder="Enter a description of the supplier's products or services" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Component Manufacturer">Component Manufacturer</SelectItem>
                              <SelectItem value="Raw Material Supplier">Raw Material Supplier</SelectItem>
                              <SelectItem value="Service Provider">Service Provider</SelectItem>
                              <SelectItem value="Contract Manufacturer">Contract Manufacturer</SelectItem>
                              <SelectItem value="Distributor">Distributor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="classification" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Classification & Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="criticality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Criticality*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select criticality classification" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Critical">Critical</SelectItem>
                              <SelectItem value="Major">Major</SelectItem>
                              <SelectItem value="Minor">Minor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Critical: Supplies components directly impacting product safety or efficacy<br />
                            Major: Supplies components with indirect impact on product performance<br />
                            Minor: Supplies components with minimal impact on final product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="riskLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Level*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select risk level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Approved">Approved</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Disqualified">Disqualified</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact name" {...field} />
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
                          <FormLabel>Contact Email*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact email" {...field} />
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
                            <Input placeholder="Enter contact phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} />
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
                            <FormLabel>State/Province*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter state/province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter postal code" {...field} />
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
                            <FormLabel>Country*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="qualification" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Qualification Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="qualificationDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Qualification Date</FormLabel>
                          <DatePicker
                            date={field.value || undefined}
                            setDate={field.onChange}
                          />
                          <FormDescription>
                            Date when supplier was initially qualified
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requalificationDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Requalification Due Date</FormLabel>
                          <DatePicker
                            date={field.value || undefined}
                            setDate={field.onChange}
                          />
                          <FormDescription>
                            Date when supplier needs to be requalified
                          </FormDescription>
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
                              placeholder="Enter additional notes about this supplier" 
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
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}