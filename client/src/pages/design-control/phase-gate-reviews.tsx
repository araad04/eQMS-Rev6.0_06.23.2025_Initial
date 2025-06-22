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
import { Plus, CheckCircle, Clock, AlertTriangle, ArrowRight, Shield, FileText, Users, Calendar, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const phaseGateSchema = z.object({
  phaseName: z.string().min(1, 'Phase name is required'),
  reviewType: z.string().min(1, 'Review type is required'),
  reviewCriteria: z.string().min(1, 'Review criteria are required'),
  approvalAuthority: z.string().min(1, 'Approval authority is required'),
  requiredDocuments: z.string().min(1, 'Required documents are required'),
  exitCriteria: z.string().min(1, 'Exit criteria are required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

type PhaseGateReview = {
  id: string;
  phaseNumber: number;
  phaseName: string;
  reviewType: string;
  reviewCriteria: string;
  approvalAuthority: string;
  requiredDocuments: string[];
  exitCriteria: string;
  status: 'Not Started' | 'In Review' | 'Approved' | 'Rejected' | 'Conditional Approval';
  reviewDate?: string;
  approvalDate?: string;
  reviewer: string;
  approver: string;
  actionItems: number;
  findings: string[];
  nextPhase?: string;
  blockingIssues: number;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  createdDate: string;
  lastModified: string;
};

const mockPhaseGateReviews: PhaseGateReview[] = [
  {
    id: 'PGR-DP2025001-001',
    phaseNumber: 1,
    phaseName: 'Project Planning Review',
    reviewType: 'Phase Gate Review - Planning Completion',
    reviewCriteria: 'Project plan complete, resources allocated, timeline established, regulatory pathway defined',
    approvalAuthority: 'Project Manager & Quality Manager',
    requiredDocuments: [
      'Project Management Plan',
      'Resource Allocation Matrix',
      'Regulatory Strategy Document',
      'Risk Management Plan',
      'Project Timeline'
    ],
    exitCriteria: 'Project plan approved, resources confirmed, regulatory pathway established, project timeline validated',
    status: 'Approved',
    reviewDate: '2025-02-08',
    approvalDate: '2025-02-10',
    reviewer: 'Quality Engineer',
    approver: 'Quality Manager',
    actionItems: 0,
    findings: [
      'Project plan meets ISO 13485:7.3.2 requirements',
      'Resource allocation sufficient for project scope',
      'Regulatory pathway clearly defined'
    ],
    nextPhase: 'Design Inputs',
    blockingIssues: 0,
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom',
    createdDate: '2025-02-05',
    lastModified: '2025-02-10'
  },
  {
    id: 'PGR-DP2025001-002',
    phaseNumber: 2,
    phaseName: 'Design Inputs Review',
    reviewType: 'Phase Gate Review - Inputs Completion',
    reviewCriteria: 'All user requirements documented, risk analysis completed, regulatory requirements identified, design inputs traceable to user needs',
    approvalAuthority: 'Quality Manager & Regulatory Affairs',
    requiredDocuments: [
      'DI-DP2025001-001: Cleanroom Environment Interface Requirements',
      'DI-DP2025001-002: Environmental Monitoring System Requirements',
      'DI-DP2025001-003: Personnel Access Control Requirements',
      'Risk Analysis Report',
      'Regulatory Requirements Matrix'
    ],
    exitCriteria: 'All design inputs approved, risk analysis complete, regulatory pathway confirmed, requirements traceability established',
    status: 'In Review',
    reviewDate: '2025-06-15',
    reviewer: 'Quality Engineer',
    approver: 'Quality Manager',
    actionItems: 2,
    findings: [
      'All cleanroom requirements properly documented per ISO 14644-1',
      'Environmental monitoring specifications align with GMP requirements',
      'Personnel access control requirements meet 21 CFR Part 11 standards'
    ],
    nextPhase: 'Design Outputs',
    blockingIssues: 1,
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom',
    createdDate: '2025-06-13',
    lastModified: '2025-06-15'
  },
  {
    id: 'PGR-DP2025001-003',
    phaseNumber: 3,
    phaseName: 'Design Outputs Review',
    reviewType: 'Phase Gate Review - Outputs Completion',
    reviewCriteria: 'Design outputs satisfy design inputs, specifications complete, design outputs meet regulatory requirements, outputs enable verification',
    approvalAuthority: 'Engineering Manager & Quality Assurance',
    requiredDocuments: [
      'DO-DP2025001-001: Cleanroom HMI Technical Specification',
      'DO-DP2025001-002: Environmental Monitoring System Architecture',
      'DO-DP2025001-003: Personnel Access Control System Design',
      'Design Output Verification Matrix',
      'Regulatory Compliance Assessment'
    ],
    exitCriteria: 'All design outputs approved, traceability to inputs verified, specifications enable verification testing, regulatory compliance confirmed',
    status: 'Not Started',
    reviewer: 'Environmental Specialist',
    approver: 'Engineering Manager',
    actionItems: 0,
    findings: [],
    nextPhase: 'Design Verification',
    blockingIssues: 0,
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom',
    createdDate: '2025-06-08',
    lastModified: '2025-06-08'
  },
  {
    id: 'PGR-DP2025001-004',
    phaseNumber: 4,
    phaseName: 'Design Verification Review',
    reviewType: 'Phase Gate Review - Verification Completion',
    reviewCriteria: 'Verification tests demonstrate design outputs meet specifications, test protocols followed, results documented, deviations resolved',
    approvalAuthority: 'Validation Manager & Quality Assurance',
    requiredDocuments: [
      'DV-DP2025001-001: Cleanroom HMI Display Verification Report',
      'DV-DP2025001-002: Environmental Sensor Response Verification Report', 
      'DV-DP2025001-003: Personnel Access Control Verification Report',
      'Verification Test Summary',
      'Deviation Investigation Reports'
    ],
    exitCriteria: 'All verification tests passed, specifications met, deviations resolved, design outputs verified against inputs',
    status: 'Not Started',
    reviewer: 'Validation Engineer',
    approver: 'Validation Manager',
    actionItems: 0,
    findings: [],
    nextPhase: 'Design Validation',
    blockingIssues: 0,
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom',
    createdDate: '2025-06-08',
    lastModified: '2025-06-08'
  },
  {
    id: 'PGR-DP2025001-005',
    phaseNumber: 5,
    phaseName: 'Design Validation Review',
    reviewType: 'Phase Gate Review - Validation Completion',
    reviewCriteria: 'Validation studies confirm device meets user needs, intended use validated, clinical/operational endpoints met, user acceptance confirmed',
    approvalAuthority: 'Clinical Affairs & Regulatory Affairs',
    requiredDocuments: [
      'DVal-DP2025001-001: Cleanroom HMI Usability Validation Report',
      'DVal-DP2025001-002: Environmental Monitoring Process Validation Report',
      'DVal-DP2025001-003: Personnel Access Control Regulatory Validation Report',
      'User Acceptance Testing Summary',
      'Clinical/Operational Evidence Package'
    ],
    exitCriteria: 'Validation studies demonstrate user needs met, intended use confirmed, regulatory requirements satisfied, user acceptance achieved',
    status: 'Not Started',
    reviewer: 'Clinical Engineer',
    approver: 'Regulatory Affairs Manager',
    actionItems: 0,
    findings: [],
    nextPhase: 'Design Transfer',
    blockingIssues: 0,
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom',
    createdDate: '2025-06-08',
    lastModified: '2025-06-08'
  },
  {
    id: 'PGR-DP2025001-006',
    phaseNumber: 6,
    phaseName: 'Design Transfer Review',
    reviewType: 'Phase Gate Review - Transfer Readiness',
    reviewCriteria: 'Design history file complete, manufacturing processes defined, quality systems established, regulatory submissions complete',
    approvalAuthority: 'Quality Manager & Manufacturing Manager',
    requiredDocuments: [
      'Complete Design History File Package',
      'Manufacturing Process Specifications',
      'Quality Control Procedures',
      'Installation and Commissioning Protocols',
      'Regulatory Submission Documentation'
    ],
    exitCriteria: 'Design history file approved, manufacturing readiness confirmed, quality systems validated, regulatory clearance obtained',
    status: 'Not Started',
    reviewer: 'Manufacturing Engineer',
    approver: 'Quality Manager',
    actionItems: 0,
    findings: [],
    nextPhase: 'Production & Post-Market Surveillance',
    blockingIssues: 0,
    projectId: '16',
    projectCode: 'DP-2025-001',
    projectTitle: 'clearoom',
    createdDate: '2025-06-08',
    lastModified: '2025-06-08'
  }
];

export default function PhaseGateReviewsPage() {
  const [reviews, setReviews] = useState<PhaseGateReview[]>(mockPhaseGateReviews);
  const [selectedReview, setSelectedReview] = useState<PhaseGateReview | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof phaseGateSchema>>({
    resolver: zodResolver(phaseGateSchema),
    defaultValues: {
      phaseName: '',
      reviewType: '',
      reviewCriteria: '',
      approvalAuthority: '',
      requiredDocuments: '',
      exitCriteria: '',
      projectId: '16',
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Conditional Approval': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Not Started': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4" />;
      case 'In Review': return <Clock className="h-4 w-4" />;
      case 'Conditional Approval': return <AlertTriangle className="h-4 w-4" />;
      case 'Rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'Not Started': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const onSubmit = (values: z.infer<typeof phaseGateSchema>) => {
    const newReview: PhaseGateReview = {
      ...values,
      id: `PGR-DP2025001-${String(reviews.length + 1).padStart(3, '0')}`,
      phaseNumber: reviews.length + 1,
      requiredDocuments: values.requiredDocuments.split(',').map(doc => doc.trim()),
      status: 'Not Started',
      reviewer: 'Development User',
      approver: 'Quality Manager',
      actionItems: 0,
      findings: [],
      blockingIssues: 0,
      projectCode: 'DP-2025-001',
      projectTitle: 'clearoom',
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0]
    };
    setReviews(prev => [...prev, newReview]);
    form.reset();
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Project Context Header */}
      <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Project Context: DP-2025-001 - clearoom</h2>
              <p className="text-purple-700 text-sm">ISO 13485:2016 Design Control Flow - Phase Gate Review System (Mandatory Reviews Between Phases)</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Active Project
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Phase Gate Reviews</h1>
          <p className="text-muted-foreground mt-1">
            Mandatory design control phase reviews ensuring proper progression through DP-2025-001 development lifecycle
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Phase Gate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Phase Gate Review</DialogTitle>
                <DialogDescription>
                  Define a new phase gate review checkpoint for the design control process
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phaseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phase Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Design Inputs Review" {...field} />
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
                              <SelectItem value="Phase Gate Review - Inputs Completion">Phase Gate Review - Inputs Completion</SelectItem>
                              <SelectItem value="Phase Gate Review - Outputs Completion">Phase Gate Review - Outputs Completion</SelectItem>
                              <SelectItem value="Phase Gate Review - Verification Completion">Phase Gate Review - Verification Completion</SelectItem>
                              <SelectItem value="Phase Gate Review - Validation Completion">Phase Gate Review - Validation Completion</SelectItem>
                              <SelectItem value="Phase Gate Review - Transfer Readiness">Phase Gate Review - Transfer Readiness</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="reviewCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Criteria</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define specific criteria that must be met for phase approval..."
                            className="min-h-[100px]"
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
                      name="approvalAuthority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approval Authority</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Quality Manager & Regulatory Affairs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requiredDocuments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Documents (comma-separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., DI-001, Risk Analysis, Regulatory Matrix" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="exitCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exit Criteria</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define specific criteria that must be satisfied to proceed to next phase..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Phase Gate</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Phase Gate Process Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Design Control Phase Gate Process Flow
          </CardTitle>
          <CardDescription>
            ISO 13485:2016 compliant phase gate system ensuring proper review and approval at each design control milestone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {reviews.map((review, index) => (
              <div key={review.id} className="flex items-center space-x-4 min-w-max">
                <Card 
                  className={`w-80 cursor-pointer transition-all hover:shadow-md border-2 ${
                    review.status === 'Approved' ? 'border-green-200 bg-green-50' :
                    review.status === 'In Review' ? 'border-yellow-200 bg-yellow-50' :
                    review.status === 'Rejected' ? 'border-red-200 bg-red-50' :
                    'border-gray-200'
                  }`}
                  onClick={() => setSelectedReview(review)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Phase {review.phaseNumber}</span>
                        <Badge className={getStatusColor(review.status)}>
                          {getStatusIcon(review.status)}
                          <span className="ml-1">{review.status}</span>
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{review.phaseName}</h3>
                      <p className="text-sm text-muted-foreground">{review.reviewType}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Approver: {review.approver}</span>
                        {review.blockingIssues > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {review.blockingIssues} Blocking Issues
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < reviews.length - 1 && (
                  <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase Gate Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Gate Review Status</CardTitle>
          <CardDescription>
            Track review progress and approval status for each design control phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase</TableHead>
                <TableHead>Review Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead>Action Items</TableHead>
                <TableHead>Blocking Issues</TableHead>
                <TableHead>Next Phase</TableHead>
                <TableHead>Last Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedReview(review)}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{review.phaseName}</div>
                      <div className="text-sm text-muted-foreground">Phase {review.phaseNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{review.reviewType}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(review.status)}>
                      {getStatusIcon(review.status)}
                      <span className="ml-1">{review.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{review.approver}</TableCell>
                  <TableCell>
                    {review.actionItems > 0 ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {review.actionItems} Items
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {review.blockingIssues > 0 ? (
                      <Badge variant="destructive">
                        {review.blockingIssues} Issues
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{review.nextPhase || 'Final Phase'}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{review.lastModified}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Selected Review Details Dialog */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Phase {selectedReview.phaseNumber}: {selectedReview.phaseName}
              </DialogTitle>
              <DialogDescription>
                {selectedReview.reviewType} - Project {selectedReview.projectCode}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Review Status</h4>
                  <Badge className={getStatusColor(selectedReview.status)}>
                    {getStatusIcon(selectedReview.status)}
                    <span className="ml-1">{selectedReview.status}</span>
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Approval Authority</h4>
                  <p className="text-sm">{selectedReview.approvalAuthority}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Review Criteria</h4>
                <p className="text-sm text-muted-foreground">{selectedReview.reviewCriteria}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Exit Criteria</h4>
                <p className="text-sm text-muted-foreground">{selectedReview.exitCriteria}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Required Documents</h4>
                <ul className="space-y-1">
                  {selectedReview.requiredDocuments.map((doc, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
              
              {selectedReview.findings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Review Findings</h4>
                  <ul className="space-y-1">
                    {selectedReview.findings.map((finding, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Reviewer</h4>
                  <p className="text-sm">{selectedReview.reviewer}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Approver</h4>
                  <p className="text-sm">{selectedReview.approver}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Next Phase</h4>
                  <p className="text-sm">{selectedReview.nextPhase || 'Final Phase'}</p>
                </div>
              </div>
              
              {selectedReview.reviewDate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Review Date</h4>
                    <p className="text-sm">{selectedReview.reviewDate}</p>
                  </div>
                  {selectedReview.approvalDate && (
                    <div>
                      <h4 className="font-semibold mb-2">Approval Date</h4>
                      <p className="text-sm">{selectedReview.approvalDate}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}