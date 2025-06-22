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
import { Plus, FlaskConical, Edit, Trash2, Search, Download, Upload, CheckCircle, Clock, AlertTriangle, FileText, PlayCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const verificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  linkedOutputId: z.string().min(1, 'Linked design output is required'),
  verificationMethod: z.string().min(1, 'Verification method is required'),
  testType: z.string().min(1, 'Test type is required'),
  acceptanceCriteria: z.string().min(1, 'Acceptance criteria are required'),
  testProcedure: z.string().min(1, 'Test procedure is required'),
  expectedResults: z.string().min(1, 'Expected results are required'),
  testEnvironment: z.string().min(1, 'Test environment is required'),
  riskLevel: z.string().min(1, 'Risk level is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

type DesignVerification = {
  id: string;
  title: string;
  description: string;
  linkedOutputId: string;
  linkedOutputTitle: string;
  verificationMethod: string;
  testType: string;
  acceptanceCriteria: string;
  testProcedure: string;
  expectedResults: string;
  actualResults?: string;
  testEnvironment: string;
  riskLevel: string;
  status: string;
  result: string;
  testDate?: string;
  tester: string;
  witnessedBy?: string;
  documentReference: string;
  deviations: number;
  retestRequired: boolean;
  createdDate: string;
  lastModified: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
};

const mockVerifications: DesignVerification[] = [
  {
    id: 'DV-DP2025001-001',
    title: 'Cleanroom HMI Display Verification',
    description: 'Verify that the cleanroom human-machine interface display meets regulatory readability requirements under cleanroom lighting conditions',
    linkedOutputId: 'DO-DP2025001-001',
    linkedOutputTitle: 'Cleanroom HMI Technical Specification',
    verificationMethod: 'Laboratory Testing',
    testType: 'Performance Test',
    acceptanceCriteria: 'Display readable at 99.9% accuracy under cleanroom lighting conditions (200-1000 lux) per ISO 14644-1',
    testProcedure: 'Test HMI display readability using cleanroom-compliant lighting fixtures with calibrated photometer measurements',
    expectedResults: 'All critical parameters clearly readable with 99.9% accuracy across cleanroom lighting range',
    actualResults: 'Achieved 99.95% accuracy across all test conditions. All cleanroom lighting scenarios passed.',
    testEnvironment: 'Controlled cleanroom test facility, calibrated equipment, ISO Class 7 environment',
    riskLevel: 'Medium',
    status: 'Completed',
    result: 'Pass',
    testDate: '2025-06-15',
    tester: 'Development User',
    witnessedBy: 'Quality Engineer',
    documentReference: 'TEST-CR-HMI-001',
    deviations: 0,
    retestRequired: false,
    createdDate: '2025-06-08',
    lastModified: '2025-06-15',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  },
  {
    id: 'DV-DP2025001-002',
    title: 'Environmental Sensor Response Verification',
    description: 'Verify that environmental monitoring sensors respond within specified time limits for critical contamination events',
    linkedOutputId: 'DO-DP2025001-002',
    linkedOutputTitle: 'Environmental Monitoring System Architecture',
    verificationMethod: 'Automated Testing',
    testType: 'Safety Test',
    acceptanceCriteria: 'Sensor alarm activation within 30 seconds of contamination event with 100% reliability per GMP requirements',
    testProcedure: 'Automated test suite simulating contamination events over 500 test cycles with particle injection scenarios',
    expectedResults: 'Average response time < 15 seconds, maximum response time < 30 seconds, 100% detection rate',
    testEnvironment: 'Cleanroom test chamber with controlled particle injection system and precision timing equipment',
    riskLevel: 'High',
    status: 'In Progress',
    result: 'Pending',
    tester: 'Environmental Specialist',
    documentReference: 'TEST-CR-ENV-002',
    deviations: 0,
    retestRequired: false,
    createdDate: '2025-06-08',
    lastModified: '2025-06-09',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  },
  {
    id: 'DV-DP2025001-003',
    title: 'Personnel Access Control Verification',
    description: 'Verify that personnel access control systems maintain cleanroom integrity and proper entry/exit protocols per GMP requirements',
    linkedOutputId: 'DO-DP2025001-003',
    linkedOutputTitle: 'Personnel Access Control System Design',
    verificationMethod: 'Functional Testing',
    testType: 'Integrity Test',
    acceptanceCriteria: 'Zero unauthorized access events, 100% protocol compliance, decontamination cycle completion within 5 minutes per 21 CFR Part 11',
    testProcedure: 'Comprehensive access testing with simulated personnel entry/exit scenarios and contamination monitoring',
    expectedResults: 'All access protocols executed correctly, decontamination systems functional, audit trail complete',
    testEnvironment: 'Full-scale cleanroom access facility with operational decontamination systems',
    riskLevel: 'High',
    status: 'Scheduled',
    result: 'Pending',
    tester: 'Safety Engineer',
    documentReference: 'TEST-CR-ACCESS-003',
    deviations: 0,
    retestRequired: false,
    createdDate: '2025-06-08',
    lastModified: '2025-06-09',
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom'
  }
];

export default function DesignVerificationPage() {
  const [verifications, setVerifications] = useState<DesignVerification[]>(mockVerifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVerification, setEditingVerification] = useState<DesignVerification | null>(null);

  const form = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      title: '',
      description: '',
      linkedOutputId: '',
      verificationMethod: '',
      testType: '',
      acceptanceCriteria: '',
      testProcedure: '',
      expectedResults: '',
      testEnvironment: '',
      riskLevel: '',
      projectId: '16',
    },
  });

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || verification.testType === filterType;
    const matchesStatus = filterStatus === 'all' || verification.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-yellow-100 text-yellow-800';
      case 'On Hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Pass': return 'bg-green-100 text-green-800';
      case 'Pass with Minor Deviations': return 'bg-yellow-100 text-yellow-800';
      case 'Fail': return 'bg-red-100 text-red-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const onSubmit = (values: z.infer<typeof verificationSchema>) => {
    if (editingVerification) {
      setVerifications(prev => prev.map(verification => 
        verification.id === editingVerification.id 
          ? { 
              ...verification, 
              ...values,
              linkedOutputTitle: `Output ${values.linkedOutputId}`,
              lastModified: new Date().toISOString().split('T')[0],
              projectCode: 'DP-2025-001',
              projectTitle: 'clearoom'
            }
          : verification
      ));
      setEditingVerification(null);
    } else {
      const newVerification: DesignVerification = {
        ...values,
        id: `DV-DP2025001-${String(verifications.length + 1).padStart(3, '0')}`,
        linkedOutputTitle: `Output ${values.linkedOutputId}`,
        status: 'Planned',
        result: 'Not Started',
        tester: 'Development User',
        documentReference: `TEST-CR-${values.testType.toUpperCase()}-${String(verifications.length + 1).padStart(3, '0')}`,
        deviations: 0,
        retestRequired: false,
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        projectCode: 'DP-2025-001',
        projectTitle: 'clearoom'
      };
      setVerifications(prev => [...prev, newVerification]);
    }
    form.reset();
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (verification: DesignVerification) => {
    setEditingVerification(verification);
    form.reset({
      title: verification.title,
      description: verification.description,
      linkedOutputId: verification.linkedOutputId,
      verificationMethod: verification.verificationMethod,
      testType: verification.testType,
      acceptanceCriteria: verification.acceptanceCriteria,
      testProcedure: verification.testProcedure,
      expectedResults: verification.expectedResults,
      testEnvironment: verification.testEnvironment,
      riskLevel: verification.riskLevel,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setVerifications(prev => prev.filter(verification => verification.id !== id));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Project Context Header */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Project Context: DP-2025-001 - clearoom</h2>
              <p className="text-blue-700 text-sm">ISO 13485:2016 Design Control Flow - Design Verification Phase (Validates Design Outputs)</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              Active Project
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Design Verification</h1>
          <p className="text-muted-foreground mt-1">
            Testing and verification activities linked to project DP-2025-001 design outputs
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
                Add Verification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVerification ? 'Edit Design Verification' : 'Create New Design Verification'}</DialogTitle>
                <DialogDescription>
                  Define verification tests according to ISO 13485:2016 standards
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
                          <FormLabel>Verification Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter verification title" {...field} />
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
                            placeholder="Detailed description of what will be verified"
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
                      name="verificationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Method *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Laboratory Testing">Laboratory Testing</SelectItem>
                              <SelectItem value="Software Testing">Software Testing</SelectItem>
                              <SelectItem value="Automated Testing">Automated Testing</SelectItem>
                              <SelectItem value="Design Review">Design Review</SelectItem>
                              <SelectItem value="Analysis">Analysis</SelectItem>
                              <SelectItem value="Inspection">Inspection</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="testType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select test type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Performance Test">Performance Test</SelectItem>
                              <SelectItem value="Safety Test">Safety Test</SelectItem>
                              <SelectItem value="Integration Test">Integration Test</SelectItem>
                              <SelectItem value="Unit Test">Unit Test</SelectItem>
                              <SelectItem value="Environmental Test">Environmental Test</SelectItem>
                              <SelectItem value="Usability Test">Usability Test</SelectItem>
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
                    name="acceptanceCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acceptance Criteria *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define measurable criteria for successful verification"
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
                    name="testProcedure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Procedure *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed step-by-step test procedure"
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
                      name="expectedResults"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Results *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Define expected test results"
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
                      name="testEnvironment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Environment *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe test environment and equipment"
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
                        setEditingVerification(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingVerification ? 'Update Verification' : 'Create Verification'}
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
                  placeholder="Search verifications..."
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
                <SelectItem value="Performance Test">Performance</SelectItem>
                <SelectItem value="Safety Test">Safety</SelectItem>
                <SelectItem value="Integration Test">Integration</SelectItem>
                <SelectItem value="Unit Test">Unit</SelectItem>
                <SelectItem value="Environmental Test">Environmental</SelectItem>
                <SelectItem value="Usability Test">Usability</SelectItem>
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
                <p className="text-sm font-medium text-muted-foreground">Total Verifications</p>
                <p className="text-2xl font-bold">{verifications.length}</p>
              </div>
              <FlaskConical className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {verifications.filter(v => v.status === 'Completed').length}
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
                <p className="text-2xl font-bold text-blue-600">
                  {verifications.filter(v => v.status === 'In Progress').length}
                </p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {verifications.filter(v => v.riskLevel === 'High').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Design Verification Activities</CardTitle>
          <CardDescription>
            Manage and track design verification tests for medical device development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Linked Output</TableHead>
                <TableHead>Test Type</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Tester</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVerifications.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell className="font-medium">{verification.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{verification.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {verification.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{verification.linkedOutputId}</TableCell>
                  <TableCell>{verification.testType}</TableCell>
                  <TableCell>
                    <Badge variant={verification.riskLevel === 'High' ? 'destructive' : 'secondary'}>
                      {verification.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(verification.status)}>
                      {verification.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getResultColor(verification.result)}>
                      {verification.result}
                    </Badge>
                  </TableCell>
                  <TableCell>{verification.tester}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(verification)}
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
                            <AlertDialogTitle>Delete Design Verification</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this verification? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(verification.id)}>
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