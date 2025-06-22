import React, { useState } from 'react';
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
import { Plus, FileText, Edit, Trash2, Search, Download, Upload, CheckCircle, Clock, AlertTriangle, Link } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const designOutputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  outputType: z.string().min(1, 'Output type is required'),
  linkedInputId: z.string().min(1, 'Linked input is required'),
  specifications: z.string().min(1, 'Specifications are required'),
  verificationMethod: z.string().min(1, 'Verification method is required'),
  validationMethod: z.string().optional(),
  riskClassification: z.string().min(1, 'Risk classification is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

type DesignOutput = {
  id: string;
  title: string;
  description: string;
  category: string;
  outputType: string;
  linkedInputId: string;
  linkedInputTitle: string;
  specifications: string;
  verificationMethod: string;
  validationMethod?: string;
  riskClassification: string;
  status: string;
  verificationStatus: string;
  validationStatus: string;
  createdDate: string;
  lastModified: string;
  assignedTo: string;
  documentReference: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
};

const mockDesignOutputs: DesignOutput[] = [
  {
    id: 'DO-DP2025001-001',
    title: 'Cleanroom HMI Technical Specification',
    description: 'Complete technical specification for contamination-resistant human-machine interface including touchless controls and sterilizable surfaces',
    category: 'User Interface',
    outputType: 'Technical Specification',
    linkedInputId: 'DI-DP2025001-001',
    linkedInputTitle: 'Cleanroom Environment Interface Requirements',
    specifications: 'IP65-rated 12" touchscreen, antimicrobial coating, gesture control capability, autoclavable peripheral components, Class 100 cleanroom compatible',
    verificationMethod: 'Environmental Testing, Contamination Control Verification',
    validationMethod: 'Cleanroom Operational Testing, User Validation Studies',
    riskClassification: 'High',
    status: 'Approved',
    verificationStatus: 'Verified',
    validationStatus: 'In Progress',
    createdDate: '2025-06-08',
    lastModified: '2025-06-09',
    assignedTo: 'Development User',
    documentReference: 'DOC-CR-HMI-001',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  },
  {
    id: 'DO-DP2025001-002',
    title: 'Environmental Monitoring System Architecture',
    description: 'Complete system design for real-time environmental parameter monitoring with automated data logging and alert systems',
    category: 'Environmental',
    outputType: 'System Architecture',
    linkedInputId: 'DI-DP2025001-002',
    linkedInputTitle: 'Environmental Monitoring System Requirements',
    specifications: 'Distributed sensor network, real-time data acquisition at 1Hz, automated alert thresholds, 21 CFR Part 11 compliant data logging, redundant communication pathways',
    verificationMethod: 'System Integration Testing, Calibration Verification',
    validationMethod: 'Performance Qualification, Operational Testing',
    riskClassification: 'High',
    status: 'Under Review',
    verificationStatus: 'In Progress',
    validationStatus: 'Pending',
    createdDate: '2025-06-08',
    lastModified: '2025-06-09',
    assignedTo: 'Development User',
    documentReference: 'DOC-CR-ENV-002',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  },
  {
    id: 'DO-DP2025001-003',
    title: 'Personnel Access Control System Design',
    description: 'Biometric access control system design with gowning verification and training status validation for cleanroom personnel',
    category: 'Safety',
    outputType: 'Design Drawing',
    linkedInputId: 'DI-DP2025001-003',
    linkedInputTitle: 'Personnel Access Control Requirements',
    specifications: 'Biometric scanners at entry points, RFID badge integration, automated gowning compliance check, training database integration, contamination event logging',
    verificationMethod: 'Security Testing, Integration Verification',
    validationMethod: 'Operational Validation, User Acceptance Testing',
    riskClassification: 'Medium',
    status: 'Draft',
    verificationStatus: 'Not Started',
    validationStatus: 'Not Started',
    createdDate: '2025-06-08',
    lastModified: '2025-06-09',
    assignedTo: 'Development User',
    documentReference: 'DOC-CR-ACC-003',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  }
];

export default function DesignOutputsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOutput, setEditingOutput] = useState<DesignOutput | null>(null);
  const queryClient = useQueryClient();

  // Fetch design outputs from API
  const { data: outputs = [], isLoading } = useQuery({
    queryKey: ['/api/design-outputs'],
  });

  // Create output mutation
  const createOutputMutation = useMutation({
    mutationFn: (data: z.infer<typeof designOutputSchema>) =>
      apiRequest('/api/design-outputs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-outputs'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Update output mutation
  const updateOutputMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<z.infer<typeof designOutputSchema>> }) =>
      apiRequest(`/api/design-outputs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-outputs'] });
      setEditingOutput(null);
    },
  });

  // Delete output mutation
  const deleteOutputMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/design-outputs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/design-outputs'] });
    },
  });

  const form = useForm<z.infer<typeof designOutputSchema>>({
    resolver: zodResolver(designOutputSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      outputType: '',
      linkedInputId: '',
      specifications: '',
      verificationMethod: '',
      validationMethod: '',
      riskClassification: '',
      projectId: '16',
    },
  });

  const filteredOutputs = outputs.filter(output => {
    const matchesSearch = output.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         output.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || output.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || output.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const onSubmit = (values: z.infer<typeof designOutputSchema>) => {
    if (editingOutput) {
      setOutputs(prev => prev.map(output => 
        output.id === editingOutput.id 
          ? { 
              ...output, 
              ...values, 
              linkedInputTitle: `Input ${values.linkedInputId}`,
              lastModified: new Date().toISOString().split('T')[0],
              projectCode: 'DP-2025-001',
              projectTitle: 'clearoom'
            }
          : output
      ));
      setEditingOutput(null);
    } else {
      const newOutput: DesignOutput = {
        ...values,
        id: `DO-DP2025001-${String(outputs.length + 1).padStart(3, '0')}`,
        linkedInputTitle: `Input ${values.linkedInputId}`,
        status: 'Draft',
        verificationStatus: 'Not Started',
        validationStatus: 'Not Started',
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        assignedTo: 'Development User',
        documentReference: `DOC-CR-${values.category.toUpperCase()}-${String(outputs.length + 1).padStart(3, '0')}`,
        projectCode: 'DP-2025-001',
        projectTitle: 'clearoom'
      };
      setOutputs(prev => [...prev, newOutput]);
    }
    form.reset();
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (output: DesignOutput) => {
    setEditingOutput(output);
    form.reset({
      title: output.title,
      description: output.description,
      category: output.category,
      outputType: output.outputType,
      linkedInputId: output.linkedInputId,
      specifications: output.specifications,
      verificationMethod: output.verificationMethod,
      validationMethod: output.validationMethod || '',
      riskClassification: output.riskClassification,
      projectId: output.projectId,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setOutputs(prev => prev.filter(output => output.id !== id));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Project Context Header */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-green-900">Project Context: DP-2025-001 - clearoom</h2>
              <p className="text-green-700 text-sm">ISO 13485:2016 Design Control Flow - Design Outputs Phase (Traceable to Design Inputs)</p>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Active Project
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Design Outputs</h1>
          <p className="text-muted-foreground mt-1">
            Design specifications and deliverables linked to project DP-2025-001 inputs
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
                Add Design Output
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOutput ? 'Edit Design Output' : 'Create New Design Output'}</DialogTitle>
                <DialogDescription>
                  Define design output specifications according to ISO 13485:2016 standards
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter design output title" {...field} />
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
                              <SelectItem value="Software">Software</SelectItem>
                              <SelectItem value="Hardware">Hardware</SelectItem>
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
                            placeholder="Detailed description of the design output"
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
                      name="outputType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Output Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select output type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Technical Specification">Technical Specification</SelectItem>
                              <SelectItem value="Design Drawing">Design Drawing</SelectItem>
                              <SelectItem value="Software Code">Software Code</SelectItem>
                              <SelectItem value="System Architecture">System Architecture</SelectItem>
                              <SelectItem value="Test Protocol">Test Protocol</SelectItem>
                              <SelectItem value="User Manual">User Manual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedInputId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Design Input *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., DI-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="riskClassification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Classification *</FormLabel>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="specifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technical Specifications *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define detailed technical specifications for this design output"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="verificationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Method *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Define how this output will be verified"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validation Method</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Define how this output will be validated (if applicable)"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingOutput(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingOutput ? 'Update Output' : 'Create Output'}
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
                  placeholder="Search design outputs..."
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
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
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
                <p className="text-sm font-medium text-muted-foreground">Total Outputs</p>
                <p className="text-2xl font-bold">{outputs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">
                  {outputs.filter(o => o.verificationStatus === 'Verified').length}
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
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {outputs.filter(o => o.verificationStatus === 'In Progress').length}
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
                  {outputs.filter(o => o.riskClassification === 'High').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Design Outputs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Design Output Specifications</CardTitle>
          <CardDescription>
            Manage and track design output specifications for medical device development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked Input</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Validation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOutputs.map((output) => (
                <TableRow key={output.id}>
                  <TableCell className="font-medium">{output.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{output.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {output.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{output.outputType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link className="h-3 w-3" />
                      <span className="text-sm">{output.linkedInputId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={output.riskClassification === 'High' ? 'destructive' : 'secondary'}>
                      {output.riskClassification}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(output.status)}>
                      {output.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getVerificationColor(output.verificationStatus)}>
                      {output.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getVerificationColor(output.validationStatus)}>
                      {output.validationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(output)}
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
                            <AlertDialogTitle>Delete Design Output</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this design output? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(output.id)}>
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