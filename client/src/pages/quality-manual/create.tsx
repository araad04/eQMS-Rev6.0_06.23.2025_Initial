import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from "react-helmet";
import { Save, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  documentId: z.string().min(3, {
    message: "Document ID must be at least 3 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateQualityManualPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      documentId: `QM-${new Date().getFullYear()}-`,
    },
  });

  const createManual = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('/api/quality-manual', {
        method: 'POST',
        data,
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Quality manual created",
        description: "The quality manual has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quality-manual'] });
      // Navigate to the quality manual main page after creation
      navigate('/quality-manual');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating quality manual",
        description: error.message || "There was an error creating the quality manual.",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    try {
    // Ensure data is properly formatted before sending
    const formattedData = {
      ...data,
      documentId: data.documentId.trim(),
      title: data.title.trim(),
      description: data.description?.trim() || ''
    };
    createManual.mutate(formattedData);
  } catch (err) {
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Please check the form fields and try again."
    });
  }
  };

  return (
    <>
      <Helmet>
        <title>Create Quality Manual | eQMS</title>
        <meta 
          name="description" 
          content="Create a new quality manual in compliance with ISO 13485:2016 requirements" 
        />
      </Helmet>

      <div className="container p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/quality-manual')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quality Manuals
          </Button>
        </div>

        <PageHeader
          title="Create Quality Manual"
          description="Create a new quality manual in compliance with ISO 13485:2016 requirements"
        />

        <Card className="max-w-3xl mx-auto mt-6">
          <CardHeader>
            <CardTitle>Quality Manual Information</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Medical Device Quality Management System Manual" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The title of the quality manual
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document ID <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., QM-2025-001" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this quality manual
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
                      <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the purpose and scope of this quality manual" 
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed description of the quality manual's purpose and scope
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/quality-manual')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createManual.isPending}
                >
                  {createManual.isPending && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  Create Quality Manual
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </>
  );
}