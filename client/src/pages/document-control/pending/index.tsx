import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/lib/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, Clock, AlertTriangle, ChevronLeft, 
  Eye, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Document interface for type-safety
interface Document {
  id: number;
  documentId: string;
  title: string;
  typeId: number;
  statusId: number;
  typeName?: string;
  ownerDepartment: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// Document status names and colors
const documentStatuses: Record<number, { name: string, color: string }> = {
  1: { name: 'Draft', color: 'bg-amber-500' },
  2: { name: 'Pending Approval', color: 'bg-blue-500' },
  3: { name: 'Approved', color: 'bg-green-500' },
  4: { name: 'Released', color: 'bg-green-600' },
  5: { name: 'Obsolete', color: 'bg-red-500' }
};

// Document type names
const documentTypes: Record<number, string> = {
  1: 'SOP',
  2: 'Work Instruction',
  3: 'Form',
  4: 'Policy',
  5: 'Specification',
  6: 'Template'
};

const PendingDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const isQA = user?.role === 'qa' || isAdmin;
  
  // Fetch pending documents from API
  const { 
    data: pendingDocuments = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Document[]>({
    queryKey: ['/api/documents/pending'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/documents/pending');
        if (!response.ok) {
          throw new Error('Failed to fetch pending documents');
        }
        return await response.json();
      } catch (err) {
        console.error('Error fetching pending documents:', err);
        throw err;
      }
    }
  });

  // Get status badge color
  const getStatusBadge = (statusId: number) => {
    const status = documentStatuses[statusId] || { name: 'Unknown', color: 'bg-gray-500' };
    return (
      <Badge className={`${status.color} hover:${status.color}`}>
        {status.name}
      </Badge>
    );
  };

  // Get document type name
  const getDocumentType = (typeId: number) => {
    return documentTypes[typeId] || 'Unknown';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  // Handle document approval
  const handleApproveDocument = (documentId: number) => {
    navigateTo(`/document-control/document/${documentId}`);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pending Document Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve documents waiting for your action
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigateTo('/document-control')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Document Control
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents Pending Approval</CardTitle>
          <CardDescription>
            {pendingDocuments.length} document{pendingDocuments.length !== 1 ? 's' : ''} waiting for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Loading pending documents...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Documents</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {error instanceof Error ? error.message : "There was an error loading the pending documents."}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : pendingDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                There are no documents waiting for your approval at this time.
              </p>
              <Button variant="outline" onClick={() => navigateTo('/document-control')}>
                Return to Document Library
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.documentId}</TableCell>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>{getDocumentType(doc.typeId)}</TableCell>
                    <TableCell>{doc.ownerDepartment}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(doc.statusId)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2"
                        onClick={() => navigateTo(`/document-control/document/${doc.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {isQA && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveDocument(doc.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingDocumentsPage;