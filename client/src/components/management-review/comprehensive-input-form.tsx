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
import { Checkbox } from '@/components/ui/checkbox';
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
  BookOpen,
  Clock,
  BarChart3,
  AlertCircle,
  Info
} from 'lucide-react';

// Enhanced schema for comprehensive management review inputs
const comprehensiveInputSchema = z.object({
  // Core Classification
  categoryId: z.string({
    required_error: "ISO 13485 Category is required",
  }),
  subcategoryId: z.string({
    required_error: "Subcategory is required",
  }),
  
  // Content & Evidence
  content: z.string({
    required_error: "Input content is required",
  }).min(25, {
    message: "Content must be at least 25 characters for regulatory completeness",
  }),
  quantitativeData: z.string().optional(),
  qualitativeAssessment: z.string().optional(),
  evidenceType: z.enum(["data", "metrics", "audit_findings", "customer_feedback", "risk_assessment", "regulatory", "other"]).optional(),
  attachmentPath: z.string().optional(),
  
  // Assessment & Analysis
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
  
  // Regulatory & Compliance
  mdSapRelevant: z.boolean().default(false),
  mdrRelevant: z.boolean().default(false),
  fdaRelevant: z.boolean().default(false),
  riskLevel: z.enum(["high", "medium", "low", "negligible"]).optional(),
  
  // Workflow & Attribution
  contributorId: z.string({
    required_error: "Contributor/Department is required",
  }),
  departmentId: z.string().optional(),
  reviewPeriod: z.string().optional(),
  previousReviewComparison: z.string().optional(),
  
  // Follow-up
  recommendedActions: z.string().optional(),
  targetDate: z.string().optional(),
  responsibleParty: z.string().optional(),
});

type ComprehensiveInputValues = z.infer<typeof comprehensiveInputSchema>;

interface ComprehensiveInputFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ComprehensiveInputValues) => void;
  users: any[];
  isSubmitting: boolean;
  initialData?: Partial<ComprehensiveInputValues>;
  reviewId: number;
}

// ISO 13485:2016 Section 5.6 Categories with comprehensive subcategories
const ISO_CATEGORIES = [
  {
    id: "qms_performance",
    name: "Quality Management System Performance",
    description: "Overall QMS effectiveness and performance indicators",
    icon: BarChart3,
    color: "blue",
    subcategories: [
      { id: "qms_overall", name: "Overall QMS Performance", description: "System-wide effectiveness metrics" },
      { id: "qms_processes", name: "Process Performance", description: "Individual process effectiveness" },
      { id: "qms_objectives", name: "Quality Objectives", description: "Achievement of quality objectives" },
      { id: "qms_kpis", name: "Key Performance Indicators", description: "Critical performance metrics" },
    ]
  },
  {
    id: "audit_results",
    name: "Internal & External Audit Results",
    description: "Audit findings, trends, and follow-up actions",
    icon: Shield,
    color: "green",
    subcategories: [
      { id: "internal_audits", name: "Internal Audit Results", description: "Internal audit findings and trends" },
      { id: "external_audits", name: "External Audit Results", description: "Regulatory and certification audits" },
      { id: "audit_trends", name: "Audit Trends", description: "Pattern analysis across audits" },
      { id: "audit_effectiveness", name: "Audit Effectiveness", description: "Audit program performance" },
    ]
  },
  {
    id: "customer_feedback",
    name: "Customer Feedback & Satisfaction",
    description: "Customer satisfaction, complaints, and feedback analysis",
    icon: Users,
    color: "purple",
    subcategories: [
      { id: "satisfaction_surveys", name: "Customer Satisfaction", description: "Satisfaction survey results" },
      { id: "complaints", name: "Customer Complaints", description: "Complaint trends and analysis" },
      { id: "feedback_analysis", name: "Feedback Analysis", description: "Customer feedback evaluation" },
      { id: "customer_requirements", name: "Customer Requirements", description: "Changing customer needs" },
    ]
  },
  {
    id: "product_performance",
    name: "Product & Service Performance",
    description: "Product conformity, service delivery, and performance metrics",
    icon: Target,
    color: "orange",
    subcategories: [
      { id: "conformity", name: "Product Conformity", description: "Conformity to requirements" },
      { id: "nonconformities", name: "Nonconformities", description: "Product nonconformity trends" },
      { id: "service_delivery", name: "Service Delivery", description: "Service performance metrics" },
      { id: "product_safety", name: "Product Safety", description: "Safety performance indicators" },
    ]
  },
  {
    id: "capa_status",
    name: "Corrective & Preventive Actions",
    description: "CAPA effectiveness, trends, and completion status",
    icon: Zap,
    color: "red",
    subcategories: [
      { id: "capa_effectiveness", name: "CAPA Effectiveness", description: "Effectiveness of corrective actions" },
      { id: "capa_trends", name: "CAPA Trends", description: "Trending of corrective actions" },
      { id: "preventive_actions", name: "Preventive Actions", description: "Preventive action implementation" },
      { id: "capa_timeliness", name: "CAPA Timeliness", description: "Completion time performance" },
    ]
  },
  {
    id: "process_monitoring",
    name: "Process Monitoring & Measurement",
    description: "Process performance, monitoring results, and measurement data",
    icon: Activity,
    color: "cyan",
    subcategories: [
      { id: "process_performance", name: "Process Performance", description: "Key process indicators" },
      { id: "measurement_results", name: "Measurement Results", description: "Monitoring and measurement data" },
      { id: "process_capability", name: "Process Capability", description: "Process capability analysis" },
      { id: "statistical_control", name: "Statistical Control", description: "Statistical process control" },
    ]
  },
  {
    id: "resource_adequacy",
    name: "Resource Adequacy & Infrastructure",
    description: "Personnel competence, infrastructure, and resource allocation",
    icon: BookOpen,
    color: "indigo",
    subcategories: [
      { id: "personnel_competence", name: "Personnel Competence", description: "Staff training and competency" },
      { id: "infrastructure", name: "Infrastructure", description: "Facility and equipment adequacy" },
      { id: "resource_allocation", name: "Resource Allocation", description: "Resource planning and allocation" },
      { id: "training_effectiveness", name: "Training Effectiveness", description: "Training program results" },
    ]
  },
  {
    id: "regulatory_changes",
    name: "Regulatory & Statutory Changes",
    description: "Regulatory updates, compliance status, and impact assessment",
    icon: FileText,
    color: "gray",
    subcategories: [
      { id: "regulatory_updates", name: "Regulatory Updates", description: "New regulations and requirements" },
      { id: "compliance_status", name: "Compliance Status", description: "Current compliance position" },
      { id: "impact_assessment", name: "Impact Assessment", description: "Impact of regulatory changes" },
      { id: "regulatory_communications", name: "Regulatory Communications", description: "Authority communications" },
    ]
  }
];

export function ComprehensiveInputForm({
  open,
  onOpenChange,
  onSubmit,
  users,
  isSubmitting,
  initialData,
  reviewId,
}: ComprehensiveInputFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<(typeof ISO_CATEGORIES)[0] | null>(
    initialData?.categoryId 
      ? ISO_CATEGORIES.find(c => c.id === initialData.categoryId) || null 
      : null
  );
  const [currentStep, setCurrentStep] = useState(0);

  // Set up the form with validation
  const form = useForm<ComprehensiveInputValues>({
    resolver: zodResolver(comprehensiveInputSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || '',
      subcategoryId: initialData?.subcategoryId || '',
      content: initialData?.content || '',
      contributorId: initialData?.contributorId || '',
      priority: initialData?.priority || 'medium',
      complianceStatus: initialData?.complianceStatus || 'compliant',
      trend: initialData?.trend || 'stable',
      actionRequired: initialData?.actionRequired || false,
      mdSapRelevant: initialData?.mdSapRelevant || false,
      mdrRelevant: initialData?.mdrRelevant || false,
      fdaRelevant: initialData?.fdaRelevant || false,
      ...initialData,
    },
  });

  // Handle category selection
  const handleCategorySelect = (category: (typeof ISO_CATEGORIES)[0]) => {
    setSelectedCategory(category);
    form.setValue('categoryId', category.id);
    form.setValue('subcategoryId', ''); // Reset subcategory
    setCurrentStep(1);
  };

  // Handle form submission
  const handleSubmit = (data: ComprehensiveInputValues) => {
    onSubmit(data);
  };

  // Get priority configuration
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'high': return { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'medium': return { icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'low': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      default: return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  // Get compliance configuration
  const getComplianceConfig = (status: string) => {
    switch (status) {
      case 'compliant': return { color: 'text-green-600', bg: 'bg-green-50', label: 'Compliant' };
      case 'non_compliant': return { color: 'text-red-600', bg: 'bg-red-50', label: 'Non-Compliant' };
      case 'improvement_needed': return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Improvement Needed' };
      case 'under_review': return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Under Review' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Unknown' };
    }
  };

  const steps = [
    { id: 0, name: "Category Selection", icon: BookOpen },
    { id: 1, name: "Content & Evidence", icon: FileText },
    { id: 2, name: "Assessment", icon: Target },
    { id: 3, name: "Compliance", icon: Shield },
    { id: 4, name: "Review & Submit", icon: CheckCircle }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Management Review Input - ISO 13485:2016 Section 5.6
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Comprehensive quality management system input collection following regulatory requirements
          </DialogDescription>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between pt-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`ml-2 text-xs font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-hidden">
            <ScrollArea className="h-[65vh] pr-4">
              <div className="space-y-6">
                
                {/* Step 0: Category Selection */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium">Select ISO 13485:2016 Section 5.6 Input Category</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {ISO_CATEGORIES.map((category) => (
                        <Card 
                          key={category.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedCategory?.id === category.id 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleCategorySelect(category)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded bg-${category.color}-100`}>
                                <category.icon className={`h-5 w-5 text-${category.color}-600`} />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                                <CardDescription className="text-xs">{category.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Content & Evidence */}
                {currentStep === 1 && selectedCategory && (
                  <div className="space-y-6">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded">
                              <selectedCategory.icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-blue-900">{selectedCategory.name}</CardTitle>
                              <CardDescription className="text-blue-700">{selectedCategory.description}</CardDescription>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(null);
                              setCurrentStep(0);
                            }}
                          >
                            Change Category
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Input Content & Supporting Evidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Subcategory Selection */}
                        <FormField
                          control={form.control}
                          name="subcategoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specific Area/Subcategory *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select specific area within this category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedCategory.subcategories.map((sub) => (
                                    <SelectItem key={sub.id} value={sub.id}>
                                      <div className="space-y-1">
                                        <div className="font-medium">{sub.name}</div>
                                        <div className="text-xs text-muted-foreground">{sub.description}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Main Content */}
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Detailed Input Content *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={`Provide comprehensive input for ${selectedCategory.name}. Include specific findings, observations, data trends, performance metrics, or issues identified. Be specific and factual.`}
                                  className="min-h-[150px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide detailed, factual information with specific examples, metrics, or observations (minimum 25 characters)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Evidence Type */}
                        <FormField
                          control={form.control}
                          name="evidenceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type of Evidence/Support</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select the type of supporting evidence" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="data">📊 Quantitative Data/Metrics</SelectItem>
                                  <SelectItem value="metrics">📈 Performance Metrics</SelectItem>
                                  <SelectItem value="audit_findings">🔍 Audit Findings</SelectItem>
                                  <SelectItem value="customer_feedback">👥 Customer Feedback</SelectItem>
                                  <SelectItem value="risk_assessment">⚠️ Risk Assessment</SelectItem>
                                  <SelectItem value="regulatory">📋 Regulatory Documentation</SelectItem>
                                  <SelectItem value="other">📄 Other Documentation</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Quantitative Data */}
                        <FormField
                          control={form.control}
                          name="quantitativeData"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantitative Data/Metrics</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Include specific numbers, percentages, trends, statistical data, KPIs, or measurable outcomes (e.g., '99.2% on-time delivery', '15% reduction in NCRs', 'Customer satisfaction: 4.8/5.0')"
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide measurable data to support your input with specific values and trends
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Supporting Documentation */}
                        <FormField
                          control={form.control}
                          name="attachmentPath"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supporting Documentation</FormLabel>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        field.onChange(file.name);
                                      }
                                    }}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                  />
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Upload reports, data sheets, audit reports, customer communications, or other evidence
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button type="button" onClick={() => setCurrentStep(2)}>
                            Continue to Assessment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 2: Assessment */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Performance Assessment & Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Priority Level */}
                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority Level *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select priority level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="critical">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        Critical - Immediate Action Required
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="high">
                                      <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-orange-600" />
                                        High - Significant Management Attention
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-yellow-600" />
                                        Medium - Routine Management Review
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="low">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        Low - Information Only
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Performance Trend */}
                          <FormField
                            control={form.control}
                            name="trend"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Performance Trend *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select observed trend" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="improving">📈 Improving - Positive Trend</SelectItem>
                                    <SelectItem value="stable">📊 Stable - Consistent Performance</SelectItem>
                                    <SelectItem value="declining">📉 Declining - Negative Trend</SelectItem>
                                    <SelectItem value="new_issue">🆕 New Issue - First Occurrence</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Qualitative Assessment */}
                        <FormField
                          control={form.control}
                          name="qualitativeAssessment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualitative Assessment & Analysis</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide qualitative analysis, root cause insights, impact assessment, stakeholder feedback, professional judgment, context, and implications beyond raw data..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Include professional analysis, context, implications, and qualitative insights
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Action Required and Risk Level */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="actionRequired"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Action Required</FormLabel>
                                    <FormDescription>
                                      Check if this input requires specific management action or follow-up
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="riskLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Risk Level</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select risk level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="high">🔴 High Risk</SelectItem>
                                    <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                                    <SelectItem value="low">🟢 Low Risk</SelectItem>
                                    <SelectItem value="negligible">⚪ Negligible Risk</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-between">
                          <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                            Back to Content
                          </Button>
                          <Button type="button" onClick={() => setCurrentStep(3)}>
                            Continue to Compliance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: Compliance */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Regulatory Compliance Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Compliance Status */}
                        <FormField
                          control={form.control}
                          name="complianceStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compliance Status *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select compliance status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="compliant">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      Compliant - Meets All Requirements
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="improvement_needed">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                      Improvement Needed - Minor Issues
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="non_compliant">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      Non-Compliant - Significant Issues
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="under_review">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      Under Review - Assessment Ongoing
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Regulatory Scope */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Regulatory Scope & Applicability</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="mdSapRelevant"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm">MDSAP Relevant</FormLabel>
                                    <FormDescription className="text-xs">
                                      Medical Device Single Audit Program
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="mdrRelevant"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm">EU MDR Relevant</FormLabel>
                                    <FormDescription className="text-xs">
                                      European Medical Device Regulation
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="fdaRelevant"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm">FDA Relevant</FormLabel>
                                    <FormDescription className="text-xs">
                                      US FDA 21 CFR Part 820
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                            Back to Assessment
                          </Button>
                          <Button type="button" onClick={() => setCurrentStep(4)}>
                            Continue to Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Input Attribution & Final Review
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Contributor */}
                        <FormField
                          control={form.control}
                          name="contributorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Input Contributor *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contributor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        {user.firstName} {user.lastName} - {user.department}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Person or department responsible for providing this input
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Review Period */}
                        <FormField
                          control={form.control}
                          name="reviewPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Review Period</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Q2 2025, January-March 2025, FY2025"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Specify the time period this input covers
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Summary Display */}
                        <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                          <h4 className="text-sm font-medium">Input Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Category:</span> {selectedCategory?.name}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Priority:</span> {form.watch('priority')}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Compliance:</span> {form.watch('complianceStatus')}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Trend:</span> {form.watch('trend')}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Review ID:</span> {reviewId}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                            Back to Compliance
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Input'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}