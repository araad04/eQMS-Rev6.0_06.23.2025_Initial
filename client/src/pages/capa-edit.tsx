import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Save
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Define the schema for editing a CAPA
const capaEditSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  source: z.string().optional(),
  typeId: z.number().optional(),
  statusId: z.number().optional(),
  assignedTo: z.number().nullish(),
  dueDate: z.string().optional(),
  // Additional fields
  patientSafetyImpact: z.boolean().default(false),
  productPerformanceImpact: z.boolean().default(false),
  complianceImpact: z.boolean().default(false),
  immediateContainment: z.boolean().default(false),
  containmentActions: z.string().optional(),
});

type FormData = z.infer<typeof capaEditSchema>;

// CAPA status options
const statusOptions = [
  { id: 1, name: 'Open' },
  { id: 2, name: 'In Progress' },
  { id: 3, name: 'Pending Approval' },
  { id: 4, name: 'Closed' }
];

// CAPA type options
const typeOptions = [
  { id: 1, name: 'Corrective Action' },
  { id: 2, name: 'Preventive Action' },
  { id: 3, name: 'Corrective and Preventive Action' }
];

// CAPA source options
const sourceOptions = [
  { value: 'internal_audit', label: 'Internal Audit' },
  { value: 'external_audit', label: 'External Audit' },
  { value: 'customer_complaint', label: 'Customer Complaint' },
  { value: 'nonconforming_product', label: 'Nonconforming Product' },
  { value: 'management_review', label: 'Management Review' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
  { value: 'other', label: 'Other' }
];

const CapaEdit = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Define User type
  interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
  }

  // Fetch users for the assignee dropdown
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Define the CAPA type based on your schema
  interface CapaData {
    id: number;
    capaId: string;
    title: string;
    description: string;
    source?: string;
    typeId: number;
    statusId: number;
    assignedTo?: number | null;
    dueDate?: string | null;
    patientSafetyImpact: boolean;
    productPerformanceImpact: boolean;
    complianceImpact: boolean;
    immediateContainment: boolean;
    containmentActions?: string;
  }

  // Fetch the CAPA data
  const { data: capa, isLoading, error } = useQuery<CapaData>({
    queryKey: [`/api/capas/${id}`],
  });
  
  // Setup form with resolver
  const form = useForm<FormData>({
    resolver: zodResolver(capaEditSchema),
    defaultValues: {
      title: '',
      description: '',
      source: '',
      typeId: 1,
      statusId: 1,
      assignedTo: undefined,
      dueDate: '',
      patientSafetyImpact: false,
      productPerformanceImpact: false,
      complianceImpact: false,
      immediateContainment: false,
      containmentActions: '',
    },
  });
  
  // Update form values when CAPA data is loaded
  useEffect(() => {
    if (capa) {
      form.reset({
        title: capa.title || '',
        description: capa.description || '',
        source: capa.source || '',
        typeId: capa.typeId || 1,
        statusId: capa.statusId || 1,
        assignedTo: capa.assignedTo || null,
        dueDate: capa.dueDate ? new Date(capa.dueDate).toISOString().split('T')[0] : '',
        patientSafetyImpact: capa.patientSafetyImpact || false,
        productPerformanceImpact: capa.productPerformanceImpact || false,
        complianceImpact: capa.complianceImpact || false,
        immediateContainment: capa.immediateContainment || false,
        containmentActions: capa.containmentActions || '',
      });
    }
  }, [capa, form]);
  
  // Mutation for updating the CAPA
  const updateCapaMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Process date field correctly for the server
      const processedData = {
        ...data,
        // Convert date string to ISO string format or null if empty
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
      };
      
      const response = await apiRequest('PATCH', `/api/capas/${id}`, processedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "CAPA Updated",
        description: "The CAPA has been successfully updated.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/capas/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/capas'] });
      
      // Navigate back to CAPA detail page
      setLocation(`/capa-management/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update CAPA. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: FormData) => {
    updateCapaMutation.mutate(data);
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setLocation(`/capa-management/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Edit CAPA</h1>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg text-muted-foreground">Loading CAPA data...</span>
        </div>
      </div>
    );
  }
  
  // Display error state
  if (error || !capa) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setLocation('/capa-management')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Edit CAPA</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load CAPA data for editing. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center space-x-2"
          onClick={() => setLocation(`/capa-management/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <h1 className="text-2xl font-bold">Edit CAPA #{capa.capaId}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit CAPA Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* CAPA Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* CAPA Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="Provide a detailed description of the issue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* CAPA Source */}
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CAPA Type */}
                <FormField
                  control={form.control}
                  name="typeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typeOptions.map(type => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* CAPA Status */}
                <FormField
                  control={form.control}
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assigned To */}
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          if (value === "unassigned") {
                            field.onChange(null);
                          } else {
                            field.onChange(parseInt(value));
                          }
                        }} 
                        defaultValue={field.value?.toString() || "unassigned"}
                        value={field.value?.toString() || "unassigned"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Not Assigned</SelectItem>
                          {!loadingUsers && users && users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="text-md font-medium mb-3">Impact Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Safety Impact */}
                  <FormField
                    control={form.control}
                    name="patientSafetyImpact"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Patient Safety Impact
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Product Performance Impact */}
                  <FormField
                    control={form.control}
                    name="productPerformanceImpact"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Product Performance Impact
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Compliance Impact */}
                  <FormField
                    control={form.control}
                    name="complianceImpact"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Regulatory Compliance Impact
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Immediate Containment */}
                  <FormField
                    control={form.control}
                    name="immediateContainment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Requires Immediate Containment
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Containment Actions (only shown if immediateContainment is true) */}
              {form.watch("immediateContainment") && (
                <FormField
                  control={form.control}
                  name="containmentActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Containment Actions</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3}
                          placeholder="Describe the immediate containment actions taken"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/capa-management/${id}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateCapaMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  {updateCapaMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapaEdit;