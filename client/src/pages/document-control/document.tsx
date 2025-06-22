import React from "react";
import { Helmet } from "react-helmet";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Download, Edit, Eye, Clock, User } from "lucide-react";
import { format } from "date-fns";

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [, navigateTo] = useLocation();

  // Fetch document details from API
  const { data: document, isLoading, error } = useQuery({
    queryKey: ["/api/documents", id],
    enabled: !!id,
  });

  // Type-safe document access
  const safeDocument = document || {};

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'draft': { color: 'bg-gray-500', label: 'Draft' },
      'under_review': { color: 'bg-yellow-500', label: 'Under Review' },
      'approved': { color: 'bg-green-500', label: 'Approved' },
      'active': { color: 'bg-blue-500', label: 'Active' },
      'obsolete': { color: 'bg-red-500', label: 'Obsolete' }
    };
    
    const config = statusConfig[status] || statusConfig['draft'];
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="container p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container p-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="text-xl font-semibold mt-4">Document Not Found</h2>
          <p className="text-gray-500 mt-2">The document you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => navigateTo('/document-control')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{safeDocument.title || 'Document Details'} | eQMS</title>
        <meta 
          name="description" 
          content="View detailed document information including version history, approval status, and metadata." 
        />
      </Helmet>

      <div className="container p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateTo('/document-control')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <PageHeader
              title={document.title || 'Document Details'}
              description={`Document ID: ${document.documentId || 'Unknown'}`}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {document.status && getStatusBadge(document.status)}
              <Badge variant="outline" className="border-blue-500 text-blue-600">
                Version {document.revision || '1.0'}
              </Badge>
              {document.typeId && (
                <Badge variant="outline" className="border-purple-500 text-purple-600">
                  Type {document.typeId}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {document.filePath && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Handle file download
                  window.open(document.filePath, '_blank');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigateTo(`/document-control/edit/${document.dbId}`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (document.filePath) {
                  window.open(document.filePath, '_blank');
                } else {
                  // Handle preview for documents without files
                  alert('Document preview not available');
                }
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p className="mt-1">{document.title || 'No title available'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Document ID</h3>
                  <p className="mt-1 font-mono">{document.documentId || 'No ID assigned'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Current Revision</h3>
                  <p className="mt-1">{document.revision || '1.0'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">File Path</h3>
                  <p className="mt-1 text-sm text-gray-600 break-all">
                    {document.filePath || 'No file attached'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Version {document.revision || '1.0'}</p>
                        <p className="text-sm text-gray-500">Current version</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {document.createdAt ? formatDate(document.createdAt) : 'Unknown date'}
                      </p>
                      <p className="text-xs text-gray-500">Created</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    {document.status && getStatusBadge(document.status)}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <div className="mt-1 flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {document.createdAt ? formatDate(document.createdAt) : 'Unknown'}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <div className="mt-1 flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {document.updatedAt ? formatDate(document.updatedAt) : 'Unknown'}
                  </div>
                </div>
                
                {document.effectiveDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Effective Date</h3>
                    <div className="mt-1 flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(document.effectiveDate)}
                    </div>
                  </div>
                )}
                
                {document.expirationDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Expiration Date</h3>
                    <div className="mt-1 flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(document.expirationDate)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                  <div className="mt-1 flex items-center text-sm">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    User ID: {document.createdBy || 'Unknown'}
                  </div>
                </div>
                
                {document.approvedBy && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Approved By</h3>
                    <div className="mt-1 flex items-center text-sm">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      User ID: {document.approvedBy}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}