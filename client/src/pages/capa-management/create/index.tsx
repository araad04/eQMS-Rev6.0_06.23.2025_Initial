import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { navigateTo } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Save, FileQuestion, AlertTriangle } from 'lucide-react';

// Form schema for CAPA creation
const capaFormSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  source: z.string().min(1, {
    message: 'Source is required',
  }),
  capaType: z.enum(['corrective', 'preventive', 'complaint'], {
    required_error: 'Please select a CAPA type.',
  }),
  riskPriority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select a risk priority.',
  }),
  patientSafetyImpact: z.boolean().default(false),
  productPerformanceImpact: z.boolean().default(false),
  complianceImpact: z.boolean().default(false),
  immediateContainment: z.boolean().default(false),
  containmentActions: z.string().optional(),
  assignedTo: z.string().min(1, {
    message: 'Please select a person to assign this CAPA to.',
  }),
  dueDate: z.string().min(1, {
    message: 'Due date is required',
  }),
});

type FormData = z.infer<typeof capaFormSchema>;

const CreateCAPAPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Enable the Create CAPA button for all users - including any test users
  const canEdit = true;

  const form = useForm<FormData>({
    resolver: zodResolver(capaFormSchema),
    defaultValues: {
      title: '',
      description: '',
      source: '',
      capaType: undefined,
      riskPriority: undefined,
      patientSafetyImpact: false,
      productPerformanceImpact: false,
      complianceImpact: false,
      immediateContainment: false,
      containmentActions: '',
      assignedTo: '',
      dueDate: '',
    },
  });

  function onSubmit(data: FormData) {
    console.log('Form data submitted:', data);
    
    // Prepare the data for API submission
    const apiData = {
      title: data.title,
      description: data.description,
      capaId: `CAPA-${new Date().getFullYear()}-${String(Date.now() % 10000).padStart(4, '0')}`,
      typeId: data.capaType === 'corrective' ? 1 : (data.capaType === 'preventive' ? 2 : 3),
      statusId: 1, // Default to 'Open'
      initiatedBy: user?.id || 1,
      assignedTo: parseInt(data.assignedTo) || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      source: data.source,
      riskPriority: data.riskPriority,
      patientSafetyImpact: data.patientSafetyImpact,
      productPerformanceImpact: data.productPerformanceImpact,
      complianceImpact: data.complianceImpact,
      immediateContainment: data.immediateContainment,
      containmentActions: data.containmentActions || ""
    };
    
    // Send the data to the API
    fetch('/api/capas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(result => {
      toast({
        title: 'CAPA Created',
        description: `Successfully created CAPA: ${data.title}`,
      });
      
      // Redirect back to the CAPA management dashboard
      setTimeout(() => {
        navigateTo('/capa-management');
      }, 1500);
    })
    .catch(error => {
      console.error('Error creating CAPA:', error);
      toast({
        title: 'Error Creating CAPA',
        description: `There was an error creating the CAPA: ${error.message}`,
        variant: 'destructive'
      });
    });
  }

  const watchImmediateContainment = form.watch('immediateContainment');

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create CAPA</h1>
          <p className="text-muted-foreground mt-1">
            Create a new corrective or preventive action
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigateTo('/capa-management')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CAPA List
        </Button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 border rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">ISO 13485:2016 Compliance</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              All CAPAs must comply with §8.5.2 and §8.5.3 requirements for documentation, 
              effectiveness verification, and regulatory reporting.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="identification" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="identification">Identification</TabsTrigger>
              <TabsTrigger value="riskAssessment">Risk Assessment</TabsTrigger>
              <TabsTrigger value="assignment">Assignment & Planning</TabsTrigger>
            </TabsList>
            
            <TabsContent value="identification">
              <Card>
                <CardHeader>
                  <CardTitle>CAPA Identification</CardTitle>
                  <CardDescription>
                    Basic information about the corrective or preventive action
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="capaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CAPA Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select CAPA type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="corrective">Corrective Action</SelectItem>
                            <SelectItem value="preventive">Preventive Action</SelectItem>
                            <SelectItem value="complaint">Customer Complaint</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Type of action to be taken
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CAPA Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a clear and concise title" {...field} />
                        </FormControl>
                        <FormDescription>
                          Brief description of the issue or improvement
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
                            placeholder="Provide a detailed description of the issue or potential issue" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed information about what happened or what could happen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="audit">Audit Finding</SelectItem>
                            <SelectItem value="nonconformity">Nonconformity</SelectItem>
                            <SelectItem value="customer">Customer Feedback</SelectItem>
                            <SelectItem value="internal">Internal Observation</SelectItem>
                            <SelectItem value="regulatory">Regulatory Finding</SelectItem>
                            <SelectItem value="trend">Quality Data Trend</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Source of the identification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="immediateContainment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Immediate Containment Required</FormLabel>
                          <FormDescription>
                            Check if immediate action is needed to contain the issue
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {watchImmediateContainment && (
                    <FormField
                      control={form.control}
                      name="containmentActions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Containment Actions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the immediate actions taken to contain the issue" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Detail what immediate steps were taken to prevent further impact
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="riskAssessment">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>
                    Evaluate the risk level and impact of this issue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="riskPriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Priority</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-1"
                          >
                            <FormItem className="flex items-center space-x-1 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="low" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="peer-data-[state=checked]:bg-green-100 peer-data-[state=checked]:border-green-400 cursor-pointer rounded-md border border-muted bg-popover px-3 py-2 text-center text-sm">
                                Low
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-1 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="medium" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="peer-data-[state=checked]:bg-amber-100 peer-data-[state=checked]:border-amber-400 cursor-pointer rounded-md border border-muted bg-popover px-3 py-2 text-center text-sm">
                                Medium
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-1 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="high" className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="peer-data-[state=checked]:bg-red-100 peer-data-[state=checked]:border-red-400 cursor-pointer rounded-md border border-muted bg-popover px-3 py-2 text-center text-sm">
                                High
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Select the risk level for this issue
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel>Impact Assessment</FormLabel>
                    <FormDescription className="mb-3">
                      Select all areas that are impacted by this issue
                    </FormDescription>
                    
                    <FormField
                      control={form.control}
                      name="patientSafetyImpact"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Patient Safety Impact</FormLabel>
                            <FormDescription>
                              Issue could impact patient safety
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="productPerformanceImpact"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Product Performance Impact</FormLabel>
                            <FormDescription>
                              Issue could impact device performance
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complianceImpact"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Regulatory Compliance Impact</FormLabel>
                            <FormDescription>
                              Issue could impact regulatory compliance
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assignment">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment and Planning</CardTitle>
                  <CardDescription>
                    Assign responsibility and set deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select responsible person" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Mohamed AlSaadi</SelectItem>
                            <SelectItem value="2">John Smith</SelectItem>
                            <SelectItem value="3">Sarah Johnson</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Person responsible for implementing this CAPA
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Date by which the CAPA should be completed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigateTo('/capa-management')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={!canEdit}
            >
              <Save className="h-4 w-4" />
              Create CAPA
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateCAPAPage;