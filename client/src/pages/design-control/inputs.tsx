import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, FileText, Edit, Trash2, Search, Filter, Download, Upload, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const designInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  inputTypeId: z.number().default(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  source: z.string().min(1, 'Source is required'),
  functionalRequirement: z.boolean().default(false),
  performanceRequirement: z.boolean().default(false),
  safetyRequirement: z.boolean().default(false),
  usabilityRequirement: z.boolean().default(false),
  regulatoryRequirement: z.boolean().default(false),
  acceptanceCriteria: z.string().min(1, 'Acceptance criteria is required'),
  verificationMethod: z.string().optional(),
  riskLevel: z.enum(['high', 'medium', 'low']).optional(),
  projectId: z.number(),
});

type DesignInput = {
  id: number;
  inputId: string;
  title: string;
  description: string;
  source: string;
  functionalRequirement: boolean;
  performanceRequirement: boolean;
  safetyRequirement: boolean;
  usabilityRequirement: boolean;
  regulatoryRequirement: boolean;
  acceptanceCriteria: string;
  verificationMethod?: string;
  priority: string;
  riskLevel?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  reviewedAt?: string;
  approvedAt?: string;
};

export default function DesignInputsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInput, setEditingInput] = useState<DesignInput | null>(null);
  const queryClient = useQueryClient();

  // Fetch design inputs from database
  const { data: inputs = [], isLoading } = useQuery({
    queryKey: ['/api/design-inputs/project', 16], // DP-2025-001 project ID
    queryFn: () => fetch('/api/design-inputs/project/16').then(res => res.json()),
  });

  const form = useForm<z.infer<typeof designInputSchema>>({
    resolver: zodResolver(designInputSchema),
    defaultValues: {
      title: '',
      description: '',
      inputTypeId: 1,
      priority: 'medium',
      source: '',
      functionalRequirement: false,
      performanceRequirement: false,
      safetyRequirement: false,
      usabilityRequirement: false,
      regulatoryRequirement: false,
      acceptanceCriteria: '',
      verificationMethod: '',
      riskLevel: 'medium',
      projectId: 16, // DP-2025-001 project ID
    },
  });

  // Create design input mutation
  const createInputMutation = useMutation({
    mutationFn: (data: z.infer<typeof designInputSchema>) =>
      apiRequest('/api/design-inputs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-inputs/project', 16] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Update design input mutation
  const updateInputMutation = useMutation({
    mutationFn: ({ inputId, data }: { inputId: string; data: Partial<z.infer<typeof designInputSchema>> }) =>
      apiRequest(`/api/design-inputs/${inputId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-inputs/project', 16] });
      setEditingInput(null);
    },
  });

  // Delete design input mutation
  const deleteInputMutation = useMutation({
    mutationFn: (inputId: string) =>
      apiRequest(`/api/design-inputs/${inputId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-inputs/project', 16] });
    },
  });

  const filteredInputs = inputs.filter((input: DesignInput) => {
    const matchesSearch = input.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         input.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || input.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (data: z.infer<typeof designInputSchema>) => {
    if (editingInput) {
      updateInputMutation.mutate({ inputId: editingInput.inputId, data });
    } else {
      createInputMutation.mutate(data);
    }
  };

  const handleEdit = (input: DesignInput) => {
    setEditingInput(input);
    form.reset({
      title: input.title,
      description: input.description,
      inputTypeId: 1,
      priority: input.priority as 'critical' | 'high' | 'medium' | 'low',
      source: input.source,
      functionalRequirement: input.functionalRequirement,
      performanceRequirement: input.performanceRequirement,
      safetyRequirement: input.safetyRequirement,
      usabilityRequirement: input.usabilityRequirement,
      regulatoryRequirement: input.regulatoryRequirement,
      acceptanceCriteria: input.acceptanceCriteria,
      verificationMethod: input.verificationMethod || '',
      riskLevel: (input.riskLevel as 'high' | 'medium' | 'low') || 'medium',
      projectId: 16,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (inputId: string) => {
    deleteInputMutation.mutate(inputId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8" />
          <span className="ml-2">Loading design inputs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Project Context Header */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Project Context: DP-2025-001 - clearoom</h2>
              <p className="text-blue-700 text-sm">ISO 13485:2016 Design Control Flow - Design Inputs Phase</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              Active Project
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Design Inputs</h1>
          <p className="text-muted-foreground mt-1">
            Manage design inputs and requirements linked to project DP-2025-001
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Design Input
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInput ? 'Edit Design Input' : 'Create New Design Input'}</DialogTitle>
                <DialogDescription>
                  Define design input requirements according to ISO 13485:2016 standards
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Project Context */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">DP-2025-001</Badge>
                      <span className="text-sm font-medium text-blue-900">clearoom Project</span>
                    </div>
                    <p className="text-xs text-blue-700">This design input will be linked to project DP-2025-001</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter design input title" {...field} />
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
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="User Interface">User Interface</SelectItem>
                              <SelectItem value="Safety">Safety</SelectItem>
                              <SelectItem value="Performance">Performance</SelectItem>
                              <SelectItem value="Data Management">Data Management</SelectItem>
                              <SelectItem value="Regulatory">Regulatory</SelectItem>
                              <SelectItem value="Environmental">Environmental</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of the design input requirement"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Critical">Critical</SelectItem>
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
                      name="riskLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., User Needs Analysis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="regulatoryRequirement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regulatory Requirements</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., FDA 21 CFR 820.30, IEC 62304" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptanceCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acceptance Criteria *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define measurable acceptance criteria for this design input"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingInput(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingInput ? 'Update Input' : 'Create Input'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search design inputs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="User Interface">User Interface</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="Performance">Performance</SelectItem>
                <SelectItem value="Data Management">Data Management</SelectItem>
                <SelectItem value="Regulatory">Regulatory</SelectItem>
                <SelectItem value="Environmental">Environmental</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inputs</p>
                <p className="text-2xl font-bold">{inputs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {inputs.filter(i => i.status === 'Approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {inputs.filter(i => i.status === 'Under Review').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {inputs.filter(i => i.riskLevel === 'High').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Design Inputs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Design Input Requirements</CardTitle>
          <CardDescription>
            Manage and track design input requirements for medical device development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Linked Outputs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInputs.map((input) => (
                <TableRow key={input.id}>
                  <TableCell className="font-medium">{input.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{input.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {input.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {input.projectCode}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {input.projectTitle}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{input.category}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(input.priority)}>
                      {input.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={input.riskLevel === 'High' ? 'destructive' : 'secondary'}>
                      {input.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(input.status)}>
                      {input.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={input.verificationStatus === 'Verified' ? 'default' : 'secondary'}>
                      {input.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{input.linkedOutputs}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(input)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Design Input</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this design input? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(input.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}