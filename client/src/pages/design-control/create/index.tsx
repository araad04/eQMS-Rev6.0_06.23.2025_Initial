import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { navigateTo } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Form schema for design project creation
const designProjectSchema = z.object({
  projectName: z.string().min(3, {
    message: 'Project name must be at least 3 characters.',
  }),
  projectCode: z.string().optional(), // Made optional since it's auto-generated
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  projectType: z.enum(['New', 'Modification', 'Line Extension'], {
    required_error: 'Please select a project type.',
  }),
  projectManager: z.string().min(1, {
    message: 'Please select a project manager.',
  }),
  regulatoryLead: z.string().min(1, {
    message: 'Please select a regulatory lead.',
  }),
  riskLevel: z.enum(['Low', 'Medium', 'High'], {
    required_error: 'Please select a risk level.',
  }),
});

type FormData = z.infer<typeof designProjectSchema>;

const CreateDesignProjectPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(designProjectSchema),
    defaultValues: {
      projectName: '',
      projectCode: '',
      description: '',
      projectType: undefined,
      projectManager: user?.id.toString() || '',
      regulatoryLead: '',
      riskLevel: undefined,
    },
  });

  // Fetch project types and statuses for proper mapping
  const { data: projectTypes = [] } = useQuery<Array<{id: number, name: string, code: string}>>({
    queryKey: ["/api/design-project-types"],
  });

  const { data: projectStatuses = [] } = useQuery<Array<{id: number, name: string, description: string}>>({
    queryKey: ["/api/design-project-statuses"],
  });

  // Auto-generate project code when component mounts
  useEffect(() => {
    const generateProjectCode = () => {
      const currentYear = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
      const projectCode = `DP-${currentYear}-${timestamp}`;
      
      form.setValue('projectCode', projectCode);
      toast({
        title: 'Project Code Generated',
        description: `Auto-generated project code: ${projectCode}`,
      });
    };

    // Generate code on component mount
    generateProjectCode();
  }, [form, toast]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    
    try {
      // Map form data to API schema format
      const startDate = new Date();
      const targetCompletionDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      
      const apiData = {
        title: data.projectName,
        description: data.description,
        objective: `${data.projectType} project for medical device development`,
        projectTypeId: projectTypes.find(type => type.name === 'New Product')?.id || 1,
        statusId: projectStatuses.find(status => status.name === 'Planning')?.id || 1,
        riskLevel: data.riskLevel,
        initiatedBy: user?.id || 9999,
        responsiblePerson: user?.id || 9999,
        startDate: startDate.toISOString(),
        targetCompletionDate: targetCompletionDate.toISOString(),
      };

      const response = await apiRequest('POST', '/api/design-projects', apiData);
      
      queryClient.invalidateQueries({ queryKey: ['/api/design-projects'] });
      
      toast({
        title: 'Project Created Successfully',
        description: `Design project "${data.projectName}" has been created with auto-generated project code`,
      });
      
      navigateTo('/design-control');
    } catch (error) {
      console.error('Error creating design project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create design project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Design Project</h1>
          <p className="text-muted-foreground mt-1">
            Start a new medical device design project
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigateTo('/design-control')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Enter the details for your new design project. Projects must comply with ISO 13485 and IEC 62304 standards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The official name of this design project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Code (Auto-Generated)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          readOnly 
                          className="bg-gray-50 cursor-not-allowed"
                          placeholder="Will be auto-generated"
                        />
                      </FormControl>
                      <FormDescription>
                        Automatically generated unique identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose and scope of this design project" 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Include the purpose, intended use, and key objectives
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="New">New Design</SelectItem>
                          <SelectItem value="Modification">Design Modification</SelectItem>
                          <SelectItem value="Line Extension">Line Extension</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Type of design project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Manager</FormLabel>
                      <FormControl>
                        <Input value={field.value || user?.firstName + ' ' + user?.lastName} disabled />
                      </FormControl>
                      <FormDescription>
                        Person responsible for this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regulatoryLead"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regulatory Lead</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select regulatory lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Mohamed AlSaadi</SelectItem>
                          <SelectItem value="2">John Smith</SelectItem>
                          <SelectItem value="3">Sarah Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Person responsible for regulatory compliance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="riskLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Risk Level</FormLabel>
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
                        <SelectItem value="Low">Low Risk</SelectItem>
                        <SelectItem value="Medium">Medium Risk</SelectItem>
                        <SelectItem value="High">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Overall project risk assessment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigateTo('/design-control')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Project
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

export default CreateDesignProjectPage;