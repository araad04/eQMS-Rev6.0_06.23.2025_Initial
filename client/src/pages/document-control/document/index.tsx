import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Download, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Users,
  History,
  Shield,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Document interface matching the API response structure
interface Document {
  id: number;
  title: string;
  documentId: string;
  type: string;
  status: string;
  version: string;
  revision: string;
  effectiveDate: string;
  reviewDate: string;
  updatedAt: string;
  createdAt: string;
  owner: string;
  department: string;
  dbId: number;
  typeId: number;
  statusId: number;
  createdBy: number;
  typeName: string;
  statusName: string;
  createdByName: string;
  fileName?: string;
  fileSize?: string;
  filePath?: string;
}

// Document approval form schema
const approvalFormSchema = z.object({
  comments: z.string().optional(),
  signatureConfirmation: z.boolean({
    required_error: "You must confirm your electronic signature",
  }).refine(val => val === true, {
    message: "You must confirm your electronic signature to proceed"
  }),
});

type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

// Document detail page component
export default function DocumentDetailPage() {
  const { id } = useParams();
  const documentId = parseInt(id as string, 10);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'rejected'>('approved');
  const [previewError, setPreviewError] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);

  // Add useEffect to handle iframe loading timeout  
  useEffect(() => {
    setPreviewLoading(true);
    setPreviewError(false);
  }, [documentId]);

  const isAdmin = user?.role === 'admin';
  const isQA = user?.role === 'qa' || isAdmin;
  const canApprove = isQA;

  // Fetch document details
  const { data: documentData, isLoading, error } = useQuery({
    queryKey: ['/api/documents', documentId],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch document details');
      }
      return await response.json();
    },
    enabled: !!documentId && !isNaN(documentId)
  });

  // Fetch document approvals
  const { data: approvals = [], isLoading: approvalsLoading } = useQuery({
    queryKey: ['/api/documents', documentId, 'approvals'],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/approvals`);
      if (!response.ok) {
        throw new Error('Failed to fetch document approvals');
      }
      return await response.json();
    },
    enabled: !!documentId && !isNaN(documentId)
  });

  // Fetch document versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['/api/documents', documentId, 'versions'],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (!response.ok) {
        throw new Error('Failed to fetch document versions');
      }
      return await response.json();
    },
    enabled: !!documentId && !isNaN(documentId)
  });

  // Setup form with zod validation
  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      comments: "",
      signatureConfirmation: false,
    },
  });

  // Document approval mutation
  const approvalMutation = useMutation({
    mutationFn: async (values: ApprovalFormValues & { status: string }) => {
      const response = await apiRequest(
        'POST', 
        `/api/documents/${documentId}/approvals`,
        {
          ...values,
          userId: user?.id,
          signatureDate: new Date().toISOString(),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit approval');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId, 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: `Document ${approvalStatus === 'approved' ? 'approved' : 'rejected'} successfully`,
        description: `You have ${approvalStatus === 'approved' ? 'approved' : 'rejected'} the document with your electronic signature.`,
      });
      
      setShowApprovalDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error submitting approval',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmitApproval = (values: ApprovalFormValues) => {
    approvalMutation.mutate({
      ...values,
      status: approvalStatus
    });
  };

  const handleApprove = () => {
    setApprovalStatus('approved');
    setShowApprovalDialog(true);
  };

  const handleReject = () => {
    setApprovalStatus('rejected');
    setShowApprovalDialog(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Get appropriate status badge color
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'DRAFT': 'bg-amber-500',
      'REVIEW': 'bg-blue-500',
      'APPROVED': 'bg-green-500',
      'EFFECTIVE': 'bg-green-600',
      'OBSOLETE': 'bg-red-500'
    };
    
    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {status === 'REVIEW' ? 'In Review' : 
         status === 'APPROVED' ? 'Approved' :
         status === 'EFFECTIVE' ? 'Effective' :
         status === 'OBSOLETE' ? 'Obsolete' :
         status === 'DRAFT' ? 'Draft' : status}
      </Badge>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading document details...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Document</h2>
          <p className="text-muted-foreground mb-4">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/document-control')}>
              Return to Documents
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If document doesn't exist
  if (!documentData) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
          <p className="text-muted-foreground mb-4">The document you're looking for doesn't exist or has been moved.</p>
          <Button onClick={() => navigate('/document-control')}>
            Return to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/document-control')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{documentData.title}</h1>
            {getStatusBadge(documentData.status)}
          </div>
          <p className="text-muted-foreground mt-1">
            Document ID: {documentData.id} | Version: {documentData.version}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              if (documentData.filePath) {
                const link = globalThis.document.createElement('a');
                link.href = `/api/documents/${documentData.id}/file`;
                link.download = documentData.fileName || 'document';
                globalThis.document.body.appendChild(link);
                link.click();
                globalThis.document.body.removeChild(link);
              } else {
                toast({
                  title: "Download not available",
                  description: "No file is attached to this document.",
                  variant: "destructive"
                });
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {documentData.status === 'REVIEW' && canApprove && (
            <>
              <Button variant="outline" onClick={handleReject}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="versions">
            <History className="h-4 w-4 mr-2" />
            Versions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
                <CardDescription>
                  Core document metadata and classification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                  <p>{documentData.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Document Type</h3>
                  <p>{documentData.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Version</h3>
                  <p>{documentData.version}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="flex items-center gap-2">
                    {getStatusBadge(documentData.status)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Document ID</h3>
                  <p>{documentData.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Information</CardTitle>
                <CardDescription>
                  Dates and lifecycle management details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Creation Date</h3>
                  <p>{formatDate(documentData.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Modified</h3>
                  <p>{formatDate(documentData.updatedAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Effective Date</h3>
                  <p>{formatDate(documentData.effectiveDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Review Date</h3>
                  <p>{formatDate(documentData.reviewDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                  <p>{documentData.department}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Document Content</CardTitle>
                <CardDescription>
                  Document file viewer and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden bg-muted/20">
                  {documentData.filePath ? (
                    <div className="w-full h-[600px] relative">
                      {previewLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p className="text-sm text-muted-foreground">Loading document preview...</p>
                          </div>
                        </div>
                      )}
                      {previewError ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                          <h3 className="text-lg font-medium mb-2">Preview Not Available</h3>
                          <p className="text-muted-foreground mb-4">
                            The document preview couldn't be loaded, but you can still download the file.
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setPreviewError(false);
                                setPreviewLoading(true);
                                // Force iframe reload
                                const iframe = globalThis.document.getElementById('document-preview') as HTMLIFrameElement;
                                if (iframe) {
                                  iframe.src = iframe.src;
                                }
                              }}
                            >
                              Try Again
                            </Button>
                            <Button 
                              onClick={() => window.open(`/api/documents/${documentData.id}/file?inline=true`, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Open in New Tab
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <iframe
                          id="document-preview"
                          src={`/api/documents/${documentData.id}/file?inline=true`}
                          width="100%"
                          height="100%"
                          style={{ border: 'none' }}
                          title={`Document: ${documentData.title}`}
                          onLoad={() => {
                            setPreviewLoading(false);
                            setPreviewError(false);
                          }}
                          onError={(e) => {
                            console.error('Error loading document file:', e);
                            setPreviewLoading(false);
                            setPreviewError(true);
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
                      <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-2">No file attached to this document.</p>
                      <p className="text-sm text-muted-foreground">The document may contain only metadata or the file may have been removed.</p>
                    </div>
                  )}
                </div>
                
                {/* Document actions */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    {documentData.fileName && (
                      <span>File: {documentData.fileName}</span>
                    )}
                    {documentData.fileSize && (
                      <span className="ml-2">({(parseInt(documentData.fileSize) / 1024).toFixed(1)} KB)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {documentData.filePath && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/api/documents/${documentData.id}/file?inline=true`, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const link = globalThis.document.createElement('a');
                            link.href = `/api/documents/${documentData.id}/file`;
                            link.download = documentData.fileName || 'document';
                            globalThis.document.body.appendChild(link);
                            link.click();
                            globalThis.document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
              <CardDescription>
                Review and approval audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Loading approval history...</span>
                </div>
              ) : approvals.length === 0 ? (
                <div className="text-center p-6">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No Approvals Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    This document is awaiting review and approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvals.map((approval: any, index: number) => (
                    <div key={approval.id} className="border rounded-md p-4 bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={approval.status === 'approved' ? 'default' : 'destructive'}>
                              {approval.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Badge>
                            <span className="font-medium">{approval.userName || 'User'}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(approval.signatureDate)}
                          </p>
                        </div>
                        <CheckCircle2 className={`h-5 w-5 ${approval.status === 'approved' ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                      {approval.comments && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Comments:</h4>
                          <p className="text-sm mt-1 text-muted-foreground">{approval.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                Track changes across document versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {versionsLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Loading version history...</span>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center p-6">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No Previous Versions</h3>
                  <p className="text-muted-foreground mt-1">
                    This is the first version of the document.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version: any, index: number) => (
                    <div key={version.id} className="border rounded-md p-4 bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={version.status === 'current' ? 'default' : 'secondary'}>
                              {version.status === 'current' ? 'Current' : 'Previous'}
                            </Badge>
                            <span className="font-medium">Version {version.versionNumber}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Updated {formatDate(version.createdAt)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      {version.changeDescription && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Change Description:</h4>
                          <p className="text-sm mt-1 text-muted-foreground">{version.changeDescription}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalStatus === 'approved' ? 'Approve Document' : 'Reject Document'}
            </DialogTitle>
            <DialogDescription>
              {approvalStatus === 'approved' 
                ? 'You are approving this document with your electronic signature.' 
                : 'You are rejecting this document. Please provide a reason.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitApproval)} className="space-y-4">
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {approvalStatus === 'approved' ? 'Comments (Optional)' : 'Reason for Rejection'}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={
                          approvalStatus === 'approved' 
                            ? "Add any comments about your approval (optional)"
                            : "Please explain why you are rejecting this document"
                        }
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {approvalStatus === 'approved' 
                        ? "Your comments will be recorded in the document history"
                        : "A rejection reason is required for regulatory compliance"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />
              
              <FormField
                control={form.control}
                name="signatureConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Electronic Signature Confirmation
                      </FormLabel>
                      <FormDescription>
                        I understand this electronic signature is the legal equivalent of my handwritten signature
                        per 21 CFR Part 11.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={approvalMutation.isPending}
                  variant={approvalStatus === 'approved' ? 'default' : 'destructive'}
                >
                  {approvalMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {approvalStatus === 'approved' ? 'Sign & Approve' : 'Sign & Reject'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}