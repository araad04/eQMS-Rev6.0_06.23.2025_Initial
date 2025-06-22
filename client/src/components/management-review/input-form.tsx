import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Users, 
  Target,
  Activity,
  Shield,
  Zap,
  BookOpen
} from 'lucide-react';
import { ISO13485_INPUT_CATEGORIES } from './input-categories';
import { InputCategoriesAccordion } from './input-categories';

// Enhanced schema for comprehensive management review inputs
const inputFormSchema = z.object({
  categoryId: z.string({
    required_error: "ISO 13485 Category is required",
  }),
  subcategoryId: z.string({
    required_error: "Subcategory is required",
  }),
  content: z.string({
    required_error: "Input content is required",
  }).min(10, {
    message: "Content must be at least 10 characters for regulatory completeness",
  }),
  contributorId: z.string({
    required_error: "Contributor/Department is required",
  }),
  priority: z.enum(["critical", "high", "medium", "low"], {
    required_error: "Priority level is required",
  }),
  complianceStatus: z.enum(["compliant", "non_compliant", "improvement_needed", "under_review"], {
    required_error: "Compliance status is required",
  }),
  trend: z.enum(["improving", "stable", "declining", "new_issue"], {
    required_error: "Performance trend is required",
  }),
  actionRequired: z.boolean().default(false),
  attachmentPath: z.string().optional(),
  evidenceType: z.enum(["data", "metrics", "audit_findings", "customer_feedback", "risk_assessment", "other"]).optional(),
  quantitativeData: z.string().optional(),
  qualitativeAssessment: z.string().optional(),
  mdSapRelevant: z.boolean().default(false),
  mdrRelevant: z.boolean().default(false),
});

type InputFormValues = z.infer<typeof inputFormSchema>;

interface InputFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InputFormValues) => void;
  users: any[];
  isSubmitting: boolean;
  initialData?: Partial<InputFormValues>;
  reviewId: number;
}

export function ReviewInputForm({
  open,
  onOpenChange,
  onSubmit,
  users,
  isSubmitting,
  initialData,
  reviewId,
}: InputFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<(typeof ISO13485_INPUT_CATEGORIES)[0] | null>(
    initialData?.categoryId 
      ? ISO13485_INPUT_CATEGORIES.find(c => c.id === initialData.categoryId) || null 
      : null
  );

  // Set up the form with validation
  const form = useForm<InputFormValues>({
    resolver: zodResolver(inputFormSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || '',
      content: initialData?.content || '',
      contributorId: initialData?.contributorId || '',
      attachmentPath: initialData?.attachmentPath || '',
      mdSapRelevant: initialData?.mdSapRelevant || false,
      mdrRelevant: initialData?.mdrRelevant || false,
    },
  });

  // Handle category selection
  const handleCategorySelect = (category: (typeof ISO13485_INPUT_CATEGORIES)[0]) => {
    setSelectedCategory(category);
    form.setValue('categoryId', category.id);
    
    // If the category has regulatory relevance, set the relevant flags
    form.setValue('mdrRelevant', category.mdrRelevant || false);
    form.setValue('mdSapRelevant', category.mdsapRelevant || false);
  };

  // Handle form submission
  const handleSubmit = (data: InputFormValues) => {
    onSubmit({
      ...data,
      contributorId: typeof data.contributorId === 'string' ? data.contributorId : String(data.contributorId),
    });
  };

  // Get priority icon and color
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'high': return { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'medium': return { icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'low': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      default: return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  // Get compliance status config
  const getComplianceConfig = (status: string) => {
    switch (status) {
      case 'compliant': return { color: 'text-green-600', bg: 'bg-green-50', label: 'Compliant' };
      case 'non_compliant': return { color: 'text-red-600', bg: 'bg-red-50', label: 'Non-Compliant' };
      case 'improvement_needed': return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Improvement Needed' };
      case 'under_review': return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Under Review' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Unknown' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Management Review Input - ISO 13485:2016 Section 5.6
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Comprehensive quality management system input collection following regulatory requirements
          </DialogDescription>
          <DialogTitle>
            {initialData ? 'Edit Management Review Input' : 'Add Management Review Input'}
          </DialogTitle>
          <DialogDescription>
            Add information to be reviewed in the management review meeting. 
            Select a category that best matches the input type according to ISO 13485:2016 requirements.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Category selection panel */}
          <div className="md:w-1/3 border rounded-md overflow-hidden">
            <div className="p-3 bg-muted font-medium text-sm">
              Input Categories
            </div>
            <ScrollArea className="h-[400px] md:h-[500px]">
              <InputCategoriesAccordion 
                showDetails={false}
                onSelectCategory={handleCategorySelect}
                selectedCategoryId={form.watch('categoryId')}
              />
            </ScrollArea>
          </div>
          
          {/* Form panel */}
          <div className="md:w-2/3 overflow-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {selectedCategory && (
                  <div className="bg-muted/50 p-4 rounded-md mb-4">
                    <h3 className="font-medium text-sm">{selectedCategory.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{selectedCategory.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{selectedCategory.regulation}</p>
                    
                    {selectedCategory.examples && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1">Example inputs:</p>
                        <ul className="text-xs text-muted-foreground list-disc pl-5">
                          {selectedCategory.examples.map((example, i) => (
                            <li key={i}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="contributorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contributor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contributor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.firstName} {user.lastName} ({user.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The person who provided this input
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the detailed information for this input..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide detailed information including metrics, findings, or observations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="attachmentPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attachment (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Attachment path or URL"
                            {...field}
                          />
                          <Button type="button" variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Attach supporting evidence like reports, metrics, or charts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="hidden">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="hidden" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mdrRelevant"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input 
                            type="hidden" 
                            name={field.name}
                            value={field.value ? "true" : "false"}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mdSapRelevant"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input 
                            type="hidden" 
                            name={field.name}
                            value={field.value ? "true" : "false"}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter className="mt-6 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Update Input' : 'Add Input'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}