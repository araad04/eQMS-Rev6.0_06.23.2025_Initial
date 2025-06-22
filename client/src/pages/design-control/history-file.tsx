import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileDown,
  ExternalLink,
  Calendar,
  User,
  Shield,
  Archive,
  Layers,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema for DHF compilation form
const dhfCompileSchema = z.object({
  projectId: z.number().min(1, 'Project ID is required'),
  version: z.string().min(1, 'Version is required'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  compilationNotes: z.string().optional(),
  includeInputs: z.boolean().default(true),
  includeOutputs: z.boolean().default(true),
  includeReviews: z.boolean().default(true),
  includeVerification: z.boolean().default(true),
  includeValidation: z.boolean().default(true),
  includeChanges: z.boolean().default(true),
  includeRiskManagement: z.boolean().default(true),
  includeTransfer: z.boolean().default(true),
});

// Schema for DHF export form
const dhfExportSchema = z.object({
  format: z.enum(['pdf', 'excel']),
  reportFormat: z.enum(['full', 'executive', 'compliance']),
  includeDetails: z.boolean().default(true),
});

type DHFCompileForm = z.infer<typeof dhfCompileSchema>;
type DHFExportForm = z.infer<typeof dhfExportSchema>;

interface DHFVersion {
  id: number;
  dhfId: string;
  version: string;
  status: string;
  compiledDate: string;
  summary: string;
  compiledByUser: {
    firstName: string;
    lastName: string;
  };
}

interface DHFItem {
  id: number;
  itemId: string;
  title: string;
  description: string;
  status: string;
  version?: string;
  phase: string;
  chronologicalDate: string;
  approvalStatus: string;
  documentReference?: string;
  hyperlink?: string;
  riskLevel?: string;
  regulatoryImpact: boolean;
  safetyImpact: boolean;
  notes?: string;
  tags: string[];
}

interface DHFSection {
  id: number;
  sectionType: string;
  sectionTitle: string;
  sectionOrder: number;
  phase: string;
  itemCount: number;
  completedItems: number;
  approvedItems: number;
  summary?: string;
  isComplete: boolean;
  items: DHFItem[];
}

interface DHF {
  id: number;
  dhfId: string;
  version: string;
  status: string;
  compiledDate: string;
  summary: string;
  compilationNotes?: string;
  projectCode: string;
  projectTitle: string;
  compiledByUser: {
    firstName: string;
    lastName: string;
  };
  sections: DHFSection[];
}

export default function DesignHistoryFilePage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDhfId, setSelectedDhfId] = useState<number | null>(null);
  const [compileDialogOpen, setCompileDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available DHF projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/dhf/projects'],
    enabled: true,
  });

  // Fetch DHF versions for selected project
  const { data: dhfVersions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ['/api/dhf/projects', selectedProjectId],
    enabled: !!selectedProjectId,
  });

  // Fetch complete DHF data
  const { data: dhfData, isLoading: isLoadingDhf } = useQuery({
    queryKey: ['/api/dhf', selectedDhfId],
    enabled: !!selectedDhfId,
  });

  // DHF compilation form
  const compileForm = useForm<DHFCompileForm>({
    resolver: zodResolver(dhfCompileSchema),
    defaultValues: {
      version: '1.0',
      includeInputs: true,
      includeOutputs: true,
      includeReviews: true,
      includeVerification: true,
      includeValidation: true,
      includeChanges: true,
      includeRiskManagement: true,
      includeTransfer: true,
    },
  });

  // DHF export form
  const exportForm = useForm<DHFExportForm>({
    resolver: zodResolver(dhfExportSchema),
    defaultValues: {
      format: 'pdf',
      reportFormat: 'full',
      includeDetails: true,
    },
  });

  // Compile DHF mutation
  const compileMutation = useMutation({
    mutationFn: (data: DHFCompileForm) => 
      apiRequest('/api/dhf/compile', 'POST', data),
    onSuccess: (response) => {
      toast({
        title: 'DHF Compiled Successfully',
        description: `Design History File ${response.data.dhfId} has been compiled.`,
      });
      setCompileDialogOpen(false);
      compileForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/dhf/projects'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Compilation Failed',
        description: error.message || 'Failed to compile DHF',
        variant: 'destructive',
      });
    },
  });

  // Export DHF mutation
  const exportMutation = useMutation({
    mutationFn: (data: DHFExportForm) => 
      apiRequest(`/api/dhf/${selectedDhfId}/export`, 'POST', data),
    onSuccess: (response) => {
      toast({
        title: 'DHF Export Initiated',
        description: 'Your export is being generated. Download will start shortly.',
      });
      setExportDialogOpen(false);
      exportForm.reset();
      
      // Trigger download
      window.open(response.data.downloadUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export DHF',
        variant: 'destructive',
      });
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ dhfId, status, comments }: { dhfId: number; status: string; comments?: string }) => 
      apiRequest(`/api/dhf/${dhfId}/status`, 'PUT', { status, comments }),
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'DHF status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dhf'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Status Update Failed',
        description: error.message || 'Failed to update DHF status',
        variant: 'destructive',
      });
    },
  });

  // Handle project selection
  useEffect(() => {
    if (selectedProjectId) {
      compileForm.setValue('projectId', selectedProjectId);
    }
  }, [selectedProjectId, compileForm]);

  // Filter DHF versions based on search and status
  const filteredVersions = dhfVersions.filter((version: DHFVersion) => {
    const dhfId = version.dhfId || '';
    const summary = version.summary || '';
    const matchesSearch = dhfId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || version.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate DHF completion statistics
  const calculateDhfStats = (dhf: DHF) => {
    const totalItems = dhf.sections.reduce((sum, section) => sum + section.itemCount, 0);
    const completedItems = dhf.sections.reduce((sum, section) => sum + section.completedItems, 0);
    const approvedItems = dhf.sections.reduce((sum, section) => sum + section.approvedItems, 0);
    
    return {
      totalItems,
      completedItems,
      approvedItems,
      completionPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      approvalPercentage: totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0,
    };
  };

  // Get status color for badges
  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500';
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-500';
      case 'in_review': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'locked': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Get risk level color
  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design History File</h1>
          <p className="text-muted-foreground">
            ISO 13485:7.3.10 compliant design documentation compilation and export for DP-2025-001 Cleanroom demonstration project
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={compileDialogOpen} onOpenChange={setCompileDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedProjectId}>
                <Plus className="h-4 w-4 mr-2" />
                Compile DHF
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compile Design History File</DialogTitle>
                <DialogDescription>
                  Generate a comprehensive DHF from design project data with automatic organization and traceability.
                </DialogDescription>
              </DialogHeader>
              <Form {...compileForm}>
                <form onSubmit={compileForm.handleSubmit((data) => compileMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={compileForm.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Version</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1.0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={compileForm.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Executive Summary</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Provide a comprehensive summary of the design project and key deliverables..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={compileForm.control}
                    name="compilationNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compilation Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Add any specific notes about this compilation..."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <h4 className="font-medium">Include Sections</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'includeInputs', label: 'Design Inputs' },
                        { key: 'includeOutputs', label: 'Design Outputs' },
                        { key: 'includeReviews', label: 'Design Reviews' },
                        { key: 'includeVerification', label: 'Verification Records' },
                        { key: 'includeValidation', label: 'Validation Records' },
                        { key: 'includeChanges', label: 'Design Changes' },
                        { key: 'includeRiskManagement', label: 'Risk Management' },
                        { key: 'includeTransfer', label: 'Design Transfer' },
                      ].map(({ key, label }) => (
                        <FormField
                          key={key}
                          control={compileForm.control}
                          name={key as keyof DHFCompileForm}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value as boolean}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <FormLabel className="text-sm">{label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setCompileDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={compileMutation.isPending}>
                      {compileMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Compiling...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Compile DHF
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {selectedDhfId && (
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Design History File</DialogTitle>
                  <DialogDescription>
                    Choose export format and level of detail for the DHF report.
                  </DialogDescription>
                </DialogHeader>
                <Form {...exportForm}>
                  <form onSubmit={exportForm.handleSubmit((data) => exportMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={exportForm.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Export Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pdf">PDF Document</SelectItem>
                              <SelectItem value="excel">Excel Workbook</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={exportForm.control}
                      name="reportFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Report Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select report format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full">Full Report</SelectItem>
                              <SelectItem value="executive">Executive Summary</SelectItem>
                              <SelectItem value="compliance">Compliance Report</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={exportForm.control}
                      name="includeDetails"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel>Include detailed item information</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setExportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={exportMutation.isPending}>
                        {exportMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FileDown className="h-4 w-4 mr-2" />
                            Export
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Project Selection
          </CardTitle>
          <CardDescription>
            Select a design project to view or compile its Design History File
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <Card 
                key={project.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedProjectId === project.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setSelectedDhfId(null);
                }}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{project.projectCode}</h3>
                      <Badge variant="outline" className={getStatusColor(project.status?.name || 'draft')}>
                        {project.status?.name || 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DHF Versions */}
      {selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              DHF Versions
            </CardTitle>
            <CardDescription>
              Available Design History File versions for the selected project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search DHF versions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DHF Version List */}
              {isLoadingVersions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredVersions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {dhfVersions.length === 0 ? 'No DHF versions found. Compile a new DHF to get started.' : 'No versions match your search criteria.'}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredVersions.map((version: DHFVersion) => (
                    <Card 
                      key={version.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedDhfId === version.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedDhfId(version.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{version.dhfId}</h3>
                              <Badge variant="secondary">v{version.version}</Badge>
                              <Badge className={getStatusColor(version.status)}>
                                {(version.status || 'draft').replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {version.summary}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(version.compiledDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {version.compiledByUser?.firstName || 'Unknown'} {version.compiledByUser?.lastName || 'User'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {version.status !== 'locked' && (
                              <div className="flex gap-1">
                                {version.status === 'draft' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      statusMutation.mutate({ dhfId: version.id, status: 'in_review' });
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {version.status === 'in_review' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      statusMutation.mutate({ dhfId: version.id, status: 'approved' });
                                    }}
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                )}
                                {version.status === 'approved' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      statusMutation.mutate({ dhfId: version.id, status: 'locked' });
                                    }}
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DHF Details */}
      {selectedDhfId && dhfData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Design History File Details
            </CardTitle>
            <CardDescription>
              {dhfData.dhfId} v{dhfData.version} - {dhfData.projectTitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="traceability">Traceability</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Completion</span>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">
                            {calculateDhfStats(dhfData).completionPercentage}%
                          </div>
                          <Progress value={calculateDhfStats(dhfData).completionPercentage} />
                          <p className="text-xs text-muted-foreground">
                            {calculateDhfStats(dhfData).completedItems} of {calculateDhfStats(dhfData).totalItems} items completed
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Approval</span>
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">
                            {calculateDhfStats(dhfData).approvalPercentage}%
                          </div>
                          <Progress value={calculateDhfStats(dhfData).approvalPercentage} />
                          <p className="text-xs text-muted-foreground">
                            {calculateDhfStats(dhfData).approvedItems} of {calculateDhfStats(dhfData).totalItems} items approved
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status</span>
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <Badge className={getStatusColor(dhfData.status)}>
                            {dhfData.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Compiled {new Date(dhfData.compiledDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Executive Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {dhfData.summary}
                    </p>
                    {dhfData.compilationNotes && (
                      <div className="mt-4 p-3 bg-muted rounded">
                        <h4 className="font-medium text-sm mb-1">Compilation Notes</h4>
                        <p className="text-sm text-muted-foreground">
                          {dhfData.compilationNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sections" className="space-y-4">
                <Accordion type="single" collapsible className="space-y-2">
                  {dhfData.sections
                    .sort((a, b) => a.sectionOrder - b.sectionOrder)
                    .map((section) => (
                    <AccordionItem key={section.id} value={section.id.toString()}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-3">
                            <div className="text-left">
                              <h3 className="font-medium">{section.sectionTitle}</h3>
                              <p className="text-sm text-muted-foreground">
                                Phase: {section.phase}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">
                              {section.itemCount} items
                            </Badge>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {section.itemCount > 0 ? Math.round((section.completedItems / section.itemCount) * 100) : 0}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {section.completedItems}/{section.itemCount} complete
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {section.summary && (
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                              {section.summary}
                            </p>
                          )}
                          
                          {section.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No items found in this section
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {section.items
                                .sort((a, b) => new Date(a.chronologicalDate).getTime() - new Date(b.chronologicalDate).getTime())
                                .map((item) => (
                                <Card key={item.id} className="p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm">{item.itemId}</h4>
                                        <Badge variant="outline" className={getStatusColor(item.status)}>
                                          {item.status}
                                        </Badge>
                                        <Badge variant="outline" className={getStatusColor(item.approvalStatus)}>
                                          {item.approvalStatus}
                                        </Badge>
                                        {item.riskLevel && (
                                          <Badge variant="outline" className={getRiskColor(item.riskLevel)}>
                                            {item.riskLevel} Risk
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium">{item.title}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {item.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>{new Date(item.chronologicalDate).toLocaleDateString()}</span>
                                        <span>Phase: {item.phase}</span>
                                        {item.version && <span>v{item.version}</span>}
                                        {item.regulatoryImpact && (
                                          <Badge variant="outline" className="bg-orange-500">
                                            Regulatory
                                          </Badge>
                                        )}
                                        {item.safetyImpact && (
                                          <Badge variant="outline" className="bg-red-500">
                                            Safety
                                          </Badge>
                                        )}
                                      </div>
                                      {item.tags.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                          {item.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-4">
                                      {item.hyperlink && (
                                        <Button variant="ghost" size="sm" asChild>
                                          <a href={item.hyperlink} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </Button>
                                      )}
                                      {item.documentReference && (
                                        <Button variant="ghost" size="sm">
                                          <FileText className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {item.notes && (
                                    <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                                      {item.notes}
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="traceability" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Traceability Matrix</CardTitle>
                    <CardDescription>
                      Relationship mapping between design inputs, outputs, verification, and validation items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Traceability matrix visualization coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                    <CardDescription>
                      Complete history of DHF activities and changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Audit trail records coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {isLoadingDhf && selectedDhfId && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading DHF details...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}