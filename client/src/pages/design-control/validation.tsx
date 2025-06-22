import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Stethoscope, Edit, Trash2, Search, Download, Upload, CheckCircle, Clock, AlertTriangle, Users, Activity } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const validationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  linkedOutputId: z.string().min(1, 'Linked design output is required'),
  validationType: z.string().min(1, 'Validation type is required'),
  validationMethod: z.string().min(1, 'Validation method is required'),
  userNeeds: z.string().min(1, 'User needs are required'),
  intendedUse: z.string().min(1, 'Intended use is required'),
  clinicalProtocol: z.string().min(1, 'Clinical protocol is required'),
  successCriteria: z.string().min(1, 'Success criteria are required'),
  riskLevel: z.string().min(1, 'Risk level is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

type DesignValidation = {
  id: string;
  title: string;
  description: string;
  linkedOutputId: string;
  linkedOutputTitle: string;
  validationType: string;
  validationMethod: string;
  userNeeds: string;
  intendedUse: string;
  clinicalProtocol: string;
  successCriteria: string;
  actualResults?: string;
  riskLevel: string;
  status: string;
  result: string;
  startDate?: string;
  completionDate?: string;
  principalInvestigator: string;
  studyPopulation?: string;
  sampleSize?: number;
  primaryEndpoint: string;
  secondaryEndpoints?: string;
  adverseEvents: number;
  protocolDeviations: number;
  documentReference: string;
  regulatorySubmission?: string;
  createdDate: string;
  lastModified: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
};

const mockValidations: DesignValidation[] = [
  {
    id: 'DVal-DP2025001-001',
    title: 'Operational Validation - Cleanroom HMI Usability',
    description: 'Operational validation study to confirm cleanroom HMI meets user needs in real manufacturing environment',
    linkedOutputId: 'DO-DP2025001-001',
    linkedOutputTitle: 'Cleanroom HMI Technical Specification',
    validationType: 'User Validation Study',
    validationMethod: 'Prospective Operational Study',
    userNeeds: 'Manufacturing operators need intuitive cleanroom interface for environmental monitoring and contamination control',
    intendedUse: 'Cleanroom management interface for pharmaceutical and medical device manufacturing facilities',
    clinicalProtocol: 'Multi-site operational study with 50 manufacturing operators across 3 cleanroom facilities',
    successCriteria: 'Task completion rate >98%, user satisfaction score >4.7/5, error rate <1%, contamination events reduced by >90%',
    actualResults: 'Task completion: 99.1%, satisfaction: 4.8/5, error rate: 0.7%. Contamination events reduced by 94%.',
    riskLevel: 'Medium',
    status: 'Completed',
    result: 'Successful',
    startDate: '2025-06-01',
    completionDate: '2025-06-20',
    principalInvestigator: 'Development User',
    studyPopulation: 'Licensed manufacturing operators with >1 year cleanroom experience',
    sampleSize: 52,
    primaryEndpoint: 'Task completion rate for critical environmental monitoring tasks',
    secondaryEndpoints: 'User satisfaction, learning curve, error rates, contamination prevention effectiveness',
    adverseEvents: 0,
    protocolDeviations: 1,
    documentReference: 'VALIDATION-CR-HMI-001',
    regulatorySubmission: 'GMP Compliance Report',
    createdDate: '2025-05-15',
    lastModified: '2025-06-20',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  },
  {
    id: 'DVal-DP2025001-002',
    title: 'Process Validation - Environmental Monitoring System',
    description: 'Process validation of environmental monitoring system effectiveness in maintaining cleanroom integrity and contamination control',
    linkedOutputId: 'DO-DP2025001-002',
    linkedOutputTitle: 'Environmental Monitoring System Architecture',
    validationType: 'Process Validation Study',
    validationMethod: 'Installation, Operational, and Performance Qualification (IQ/OQ/PQ)',
    userNeeds: 'Manufacturing staff need reliable environmental monitoring system to maintain cleanroom standards and prevent contamination',
    intendedUse: 'Environmental monitoring system for pharmaceutical and medical device manufacturing cleanrooms',
    clinicalProtocol: 'Comprehensive IQ/OQ/PQ study across 3 cleanroom facilities measuring sensor accuracy and alarm response',
    successCriteria: 'Sensor accuracy >99.9%, alarm response time <30 seconds, zero missed contamination events per GMP requirements',
    riskLevel: 'High',
    status: 'In Progress',
    result: 'Ongoing',
    startDate: '2025-06-01',
    principalInvestigator: 'Environmental Specialist',
    studyPopulation: 'Manufacturing cleanroom environments (ISO Class 5-7)',
    sampleSize: 75,
    primaryEndpoint: 'Environmental monitoring system accuracy and contamination detection',
    secondaryEndpoints: 'Response time, false alarm rate, operator satisfaction, contamination prevention effectiveness',
    adverseEvents: 0,
    protocolDeviations: 1,
    documentReference: 'VALIDATION-CR-ENV-002',
    createdDate: '2025-05-15',
    lastModified: '2025-06-09',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  },
  {
    id: 'DVal-003',
    title: 'Post-Market Clinical Follow-up - Data Integrity',
    description: 'Post-market surveillance study to validate long-term data integrity and system reliability',
    linkedOutputId: 'DO-003',
    linkedOutputTitle: 'Data Management Architecture',
    validationType: 'Post-Market Study',
    validationMethod: 'Longitudinal Observational Study',
    userNeeds: 'Healthcare providers need confidence in long-term data integrity for patient care continuity',
    intendedUse: 'Patient data management system for longitudinal care in multiple clinical settings',
    clinicalProtocol: '12-month observational study tracking data integrity across 10 clinical sites',
    successCriteria: 'Data integrity >99.99%, zero data loss events, backup recovery time <4 hours',
    riskLevel: 'High',
    status: 'Planned',
    result: 'Not Started',
    principalInvestigator: 'Dr. Lisa Wong',
    studyPopulation: 'Patients with chronic conditions requiring long-term monitoring',
    sampleSize: 500,
    primaryEndpoint: 'Data integrity and availability over 12-month period',
    secondaryEndpoints: 'System uptime, backup reliability, user confidence, data quality metrics',
    adverseEvents: 0,
    protocolDeviations: 0,
    documentReference: 'PMCF-DM-003',
    createdDate: '2024-03-01',
    lastModified: '2024-03-01'
  }
];

export default function DesignValidationPage() {
  const [validations, setValidations] = useState<DesignValidation[]>(mockValidations);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingValidation, setEditingValidation] = useState<DesignValidation | null>(null);

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: '',
      description: '',
      linkedOutputId: '',
      validationType: '',
      validationMethod: '',
      userNeeds: '',
      intendedUse: '',
      clinicalProtocol: '',
      successCriteria: '',
      riskLevel: '',
    },
  });

  const filteredValidations = validations.filter(validation => {
    const matchesSearch = validation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         validation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || validation.validationType === filterType;
    const matchesStatus = filterStatus === 'all' || validation.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-yellow-100 text-yellow-800';
      case 'On Hold': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Successful': return 'bg-green-100 text-green-800';
      case 'Successful with Conditions': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Ongoing': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const onSubmit = (values: z.infer<typeof validationSchema>) => {
    if (editingValidation) {
      setValidations(prev => prev.map(validation => 
        validation.id === editingValidation.id 
          ? { 
              ...validation, 
              ...values,
              linkedOutputTitle: `Output ${values.linkedOutputId}`,
              lastModified: new Date().toISOString().split('T')[0] 
            }
          : validation
      ));
      setEditingValidation(null);
    } else {
      const newValidation: DesignValidation = {
        ...values,
        id: `DVal-${String(validations.length + 1).padStart(3, '0')}`,
        linkedOutputTitle: `Output ${values.linkedOutputId}`,
        status: 'Planned',
        result: 'Not Started',
        principalInvestigator: 'Current User',
        primaryEndpoint: 'To be defined',
        adverseEvents: 0,
        protocolDeviations: 0,
        documentReference: `CLINICAL-${values.validationType.toUpperCase()}-${String(validations.length + 1).padStart(3, '0')}`,
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };
      setValidations(prev => [...prev, newValidation]);
    }
    form.reset();
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (validation: DesignValidation) => {
    setEditingValidation(validation);
    form.reset({
      title: validation.title,
      description: validation.description,
      linkedOutputId: validation.linkedOutputId,
      validationType: validation.validationType,
      validationMethod: validation.validationMethod,
      userNeeds: validation.userNeeds,
      intendedUse: validation.intendedUse,
      clinicalProtocol: validation.clinicalProtocol,
      successCriteria: validation.successCriteria,
      riskLevel: validation.riskLevel,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setValidations(prev => prev.filter(validation => validation.id !== id));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Design Validation</h1>
          <p className="text-muted-foreground mt-1">
            Manage design validation studies for ISO 13485:2016 compliance
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
                Add Validation Study
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingValidation ? 'Edit Design Validation' : 'Create New Design Validation Study'}</DialogTitle>
                <DialogDescription>
                  Define validation studies according to ISO 13485:2016 standards
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
                          <FormLabel>Validation Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter validation study title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedOutputId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Design Output *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., DO-001" {...field} />
                          </FormControl>
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
                            placeholder="Detailed description of the validation study"
                            className="min-h-[80px]"
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
                      name="validationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validation Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Clinical Study">Clinical Study</SelectItem>
                              <SelectItem value="Usability Study">Usability Study</SelectItem>
                              <SelectItem value="Post-Market Study">Post-Market Study</SelectItem>
                              <SelectItem value="Simulated Use">Simulated Use</SelectItem>
                              <SelectItem value="Real-World Evidence">Real-World Evidence</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validation Method *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Prospective Clinical Trial">Prospective Clinical Trial</SelectItem>
                              <SelectItem value="Retrospective Analysis">Retrospective Analysis</SelectItem>
                              <SelectItem value="Real-world Evidence Study">Real-world Evidence Study</SelectItem>
                              <SelectItem value="Longitudinal Observational Study">Longitudinal Observational Study</SelectItem>
                              <SelectItem value="Human Factors Study">Human Factors Study</SelectItem>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="userNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Needs *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define the user needs being validated"
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
                    name="intendedUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intended Use *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define the intended use being validated"
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
                    name="clinicalProtocol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Protocol *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the clinical protocol and methodology"
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
                    name="successCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Success Criteria *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define measurable success criteria and endpoints"
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
                        setEditingValidation(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingValidation ? 'Update Validation' : 'Create Validation Study'}
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
                  placeholder="Search validation studies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Clinical Study">Clinical Study</SelectItem>
                <SelectItem value="Usability Study">Usability Study</SelectItem>
                <SelectItem value="Post-Market Study">Post-Market Study</SelectItem>
                <SelectItem value="Simulated Use">Simulated Use</SelectItem>
                <SelectItem value="Real-World Evidence">Real-World Evidence</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
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
                <p className="text-sm font-medium text-muted-foreground">Total Studies</p>
                <p className="text-2xl font-bold">{validations.length}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {validations.filter(v => v.status === 'Completed').length}
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
                <p className="text-sm font-medium text-muted-foreground">Active Studies</p>
                <p className="text-2xl font-bold text-blue-600">
                  {validations.filter(v => v.status === 'In Progress').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold text-purple-600">
                  {validations.reduce((sum, v) => sum + (v.sampleSize || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Studies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Design Validation Studies</CardTitle>
          <CardDescription>
            Manage and track design validation studies for medical device development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked Output</TableHead>
                <TableHead>PI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Sample Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredValidations.map((validation) => (
                <TableRow key={validation.id}>
                  <TableCell className="font-medium">{validation.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{validation.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {validation.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{validation.validationType}</TableCell>
                  <TableCell>{validation.linkedOutputId}</TableCell>
                  <TableCell>{validation.principalInvestigator}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(validation.status)}>
                      {validation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getResultColor(validation.result)}>
                      {validation.result}
                    </Badge>
                  </TableCell>
                  <TableCell>{validation.sampleSize || 'TBD'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(validation)}
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
                            <AlertDialogTitle>Delete Validation Study</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this validation study? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(validation.id)}>
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