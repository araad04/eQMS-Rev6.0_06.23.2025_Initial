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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, Users, Edit, Trash2, Search, Download, Upload, CheckCircle, Clock, AlertTriangle, Calendar, FileText, Shield, ArrowRight, Link as LinkIcon, FileCheck, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Professional Design Review Records Schema
const designReviewRecordSchema = z.object({
  title: z.string().min(1, 'Review title is required'),
  description: z.string().min(1, 'Review description is required'),
  reviewType: z.string().min(1, 'Review type is required'),
  sourcePhase: z.string().min(1, 'Source phase is required'),
  targetPhase: z.string().min(1, 'Target phase is required'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  chairperson: z.string().min(1, 'Chairperson is required'),
  secretary: z.string().min(1, 'Secretary is required'),
  reviewers: z.string().min(1, 'Reviewers are required'),
  objectives: z.string().min(1, 'Review objectives are required'),
  reviewScope: z.string().min(1, 'Review scope is required'),
  entryCriteria: z.string().min(1, 'Entry criteria are required'),
  exitCriteria: z.string().min(1, 'Exit criteria are required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

type ActionItem = {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  category: 'Design Change' | 'Documentation' | 'Testing' | 'Compliance' | 'Risk Assessment' | 'Other';
  resolutionNotes?: string;
  completedDate?: string;
  linkedDocuments: string[];
};

type ReviewAttendee = {
  id: string;
  name: string;
  role: string;
  department: string;
  required: boolean;
  attended: boolean;
  contribution: string;
  signatureDate?: string;
};

type ReviewFinding = {
  id: string;
  category: 'Approved' | 'Minor Concern' | 'Major Concern' | 'Critical Issue' | 'Recommendation';
  description: string;
  impact: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
  assignedTo?: string;
  status: 'Open' | 'Addressed' | 'Deferred' | 'Resolved';
  linkedActionItem?: string;
};

type DesignReviewRecord = {
  id: string;
  reviewId: string; // DR-DP2025001-001
  title: string;
  description: string;
  reviewType: 'Phase Gate Review' | 'Intermediate Review' | 'Final Design Review' | 'Change Control Review';
  sourcePhase: string;
  targetPhase: string;
  phaseTransition: string;
  scheduledDate: string;
  actualDate?: string;
  chairperson: string;
  secretary: string;
  reviewers: string[];
  objectives: string;
  reviewScope: string[];
  entryCriteria: string[];
  exitCriteria: string[];
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rescheduled';
  reviewDecision: 'Approved' | 'Approved with Conditions' | 'Rejected' | 'More Information Needed' | 'Pending';
  decisionRationale: string;
  actionItems: ActionItem[];
  attendees: ReviewAttendee[];
  duration: number;
  meetingMinutes?: string;
  documentationPackage: string[];
  findings: ReviewFinding[];
  createdDate: string;
  lastModified: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  linkedPhaseGateId?: string;
  isGateReview: boolean;
  complianceNotes: string;
  approvalSignatures: string[];
  reviewRecordLocked: boolean;
  archivalStatus: 'Active' | 'Archived' | 'Under Review';
};

// Design review records will be loaded from the database
const mockDesignReviewRecords: DesignReviewRecord[] = [];

const DesignReviewSchedulePage = () => {
  const [selectedRecord, setSelectedRecord] = useState<DesignReviewRecord | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<z.infer<typeof designReviewRecordSchema>>({
    resolver: zodResolver(designReviewRecordSchema),
    defaultValues: {
      title: '',
      description: '',
      reviewType: '',
      sourcePhase: '',
      targetPhase: '',
      scheduledDate: '',
      chairperson: '',
      secretary: '',
      reviewers: '',
      objectives: '',
      reviewScope: '',
      entryCriteria: '',
      exitCriteria: '',
      projectId: '16'
    }
  });

  const onSubmit = (values: z.infer<typeof designReviewRecordSchema>) => {
    console.log('Creating design review record:', values);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const filteredRecords = mockDesignReviewRecords.filter(record => {
    const matchesStatus = filterStatus === 'all' || record.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesPhase = filterPhase === 'all' || record.sourcePhase.toLowerCase().includes(filterPhase.toLowerCase());
    const matchesSearch = searchTerm === '' || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.reviewId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phaseTransition.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPhase && matchesSearch;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Rescheduled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDecisionBadgeColor = (decision: string) => {
    switch (decision) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Approved with Conditions': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'More Information Needed': return 'bg-orange-100 text-orange-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Design Review Records
          </h1>
          <p className="text-muted-foreground mt-2">
            ISO 13485:7.3.5 compliant design review records and phase gate documentation
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record New Review
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDesignReviewRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              Recorded phase gates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDesignReviewRecords.filter(r => r.status === 'Completed').length}</div>
            <p className="text-xs text-muted-foreground">
              With final decisions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDesignReviewRecords.reduce((total, record) => total + record.actionItems.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total generated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phase Gates</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDesignReviewRecords.filter(r => r.isGateReview).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Mandatory reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Design Review Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by review ID, title, or phase transition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPhase} onValueChange={setFilterPhase}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="planning">Project Planning</SelectItem>
                <SelectItem value="inputs">Design Inputs</SelectItem>
                <SelectItem value="outputs">Design Outputs</SelectItem>
                <SelectItem value="verification">Design Verification</SelectItem>
                <SelectItem value="validation">Design Validation</SelectItem>
                <SelectItem value="transfer">Design Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Design Review Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Design Review Records</CardTitle>
          <CardDescription>
            Documentation of mandatory phase gate reviews and design control approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Phase Transition</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Action Items</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{record.reviewId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{record.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.reviewType}
                        {record.isGateReview && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Gate Review
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{record.phaseTransition}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {record.actualDate ? new Date(record.actualDate).toLocaleDateString() : 'Not conducted'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Scheduled: {new Date(record.scheduledDate).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDecisionBadgeColor(record.reviewDecision)}>
                      {record.reviewDecision}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{record.actionItems.length}</span>
                      {record.actionItems.some(ai => ai.status === 'Open' || ai.status === 'Overdue') && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Review Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Design Review</DialogTitle>
            <DialogDescription>
              Document a design review conducted as part of the design control process
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Phase Gate Review: Design Inputs → Design Outputs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reviewType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select review type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Phase Gate Review">Phase Gate Review</SelectItem>
                          <SelectItem value="Intermediate Review">Intermediate Review</SelectItem>
                          <SelectItem value="Final Design Review">Final Design Review</SelectItem>
                          <SelectItem value="Change Control Review">Change Control Review</SelectItem>
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
                    <FormLabel>Review Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the review purpose and scope..."
                        className="h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sourcePhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Phase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source phase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Project Planning">Project Planning</SelectItem>
                          <SelectItem value="Design Inputs">Design Inputs</SelectItem>
                          <SelectItem value="Design Outputs">Design Outputs</SelectItem>
                          <SelectItem value="Design Verification">Design Verification</SelectItem>
                          <SelectItem value="Design Validation">Design Validation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Phase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target phase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Design Inputs">Design Inputs</SelectItem>
                          <SelectItem value="Design Outputs">Design Outputs</SelectItem>
                          <SelectItem value="Design Verification">Design Verification</SelectItem>
                          <SelectItem value="Design Validation">Design Validation</SelectItem>
                          <SelectItem value="Design Transfer">Design Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chairperson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chairperson</FormLabel>
                      <FormControl>
                        <Input placeholder="Review chairperson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secretary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secretary</FormLabel>
                      <FormControl>
                        <Input placeholder="Meeting secretary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Review</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Review Detail Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {selectedRecord.reviewId}: {selectedRecord.title}
              </DialogTitle>
              <DialogDescription>
                Design Review Record - {selectedRecord.reviewType}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attendees">Attendees</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="actions">Action Items</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Review Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Review ID:</span>
                          <span className="font-medium">{selectedRecord.reviewId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phase Transition:</span>
                          <span className="font-medium">{selectedRecord.phaseTransition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scheduled:</span>
                          <span>{new Date(selectedRecord.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        {selectedRecord.actualDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Conducted:</span>
                            <span>{new Date(selectedRecord.actualDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{selectedRecord.duration} minutes</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Review Participants</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Chairperson:</span>
                          <span className="font-medium">{selectedRecord.chairperson}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Secretary:</span>
                          <span>{selectedRecord.secretary}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reviewers:</span>
                          <ul className="mt-1 ml-4">
                            {selectedRecord.reviewers.map((reviewer, index) => (
                              <li key={index} className="text-sm">• {reviewer}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Review Decision</h4>
                      <div className="space-y-2">
                        <Badge className={getDecisionBadgeColor(selectedRecord.reviewDecision)}>
                          {selectedRecord.reviewDecision}
                        </Badge>
                        {selectedRecord.decisionRationale && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {selectedRecord.decisionRationale}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Documentation Package</h4>
                      <ul className="space-y-1 text-sm">
                        {selectedRecord.documentationPackage.map((doc, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Compliance Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedRecord.complianceNotes}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Review Objectives</h4>
                  <p className="text-sm">{selectedRecord.objectives}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Entry Criteria</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedRecord.entryCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Exit Criteria</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedRecord.exitCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attendees" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Attended</TableHead>
                      <TableHead>Signature Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecord.attendees.map((attendee) => (
                      <TableRow key={attendee.id}>
                        <TableCell className="font-medium">{attendee.name}</TableCell>
                        <TableCell>{attendee.role}</TableCell>
                        <TableCell>{attendee.department}</TableCell>
                        <TableCell>
                          {attendee.required ? (
                            <Badge variant="outline" className="text-orange-600">Required</Badge>
                          ) : (
                            <Badge variant="outline">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {attendee.attended ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {attendee.signatureDate ? new Date(attendee.signatureDate).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="findings" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Finding</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Recommendation</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecord.findings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell>
                          <Badge variant="outline" className={
                            finding.category === 'Approved' ? 'text-green-600' :
                            finding.category === 'Critical Issue' ? 'text-red-600' :
                            finding.category === 'Major Concern' ? 'text-orange-600' :
                            'text-yellow-600'
                          }>
                            {finding.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{finding.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            finding.impact === 'Critical' ? 'text-red-600' :
                            finding.impact === 'High' ? 'text-orange-600' :
                            finding.impact === 'Medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }>
                            {finding.impact}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{finding.recommendation}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            finding.status === 'Resolved' ? 'text-green-600' :
                            finding.status === 'Addressed' ? 'text-blue-600' :
                            'text-orange-600'
                          }>
                            {finding.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action Item</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecord.actionItems.map((action) => (
                      <TableRow key={action.id}>
                        <TableCell className="max-w-xs">
                          <div>
                            <div className="font-medium">{action.description}</div>
                            {action.resolutionNotes && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {action.resolutionNotes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{action.assignedTo}</TableCell>
                        <TableCell>{new Date(action.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            action.priority === 'Critical' ? 'text-red-600' :
                            action.priority === 'High' ? 'text-orange-600' :
                            action.priority === 'Medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }>
                            {action.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            action.status === 'Completed' ? 'text-green-600' :
                            action.status === 'In Progress' ? 'text-blue-600' :
                            action.status === 'Overdue' ? 'text-red-600' :
                            'text-orange-600'
                          }>
                            {action.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{action.category}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DesignReviewSchedulePage;