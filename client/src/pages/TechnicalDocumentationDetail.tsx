import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, FileText, Calendar, User, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface TechnicalDocumentSection {
  id: number;
  sectionNumber: string;
  title: string;
  content: string;
  completionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';
  reviewComments: string | null;
  lastModified: string;
  modifiedBy: string;
}

interface TechnicalDocument {
  id: number;
  title: string;
  deviceModel: string;
  documentNumber: string;
  status: string;
  version: string;
  revisionLevel: string;
  createdAt: string;
  updatedAt: string;
  createdByUser: string;
  createdByLastName: string;
  approvedByUser: string | null;
  approvedByLastName: string | null;
  approvedAt: string | null;
  designProjectId: number | null;
  sections?: TechnicalDocumentSection[];
}

export default function TechnicalDocumentationDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [sectionContent, setSectionContent] = useState("");
  const [sectionStatus, setSectionStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED'>('NOT_STARTED');
  const [reviewComments, setReviewComments] = useState("");

  // Get technical document details
  const { data: document, isLoading } = useQuery<TechnicalDocument>({
    queryKey: ["/api/technical-documentation", id],
    enabled: !!id,
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: (data: { sectionId: number; content: string; completionStatus?: string; reviewComments?: string }) =>
      apiRequest(`/api/technical-documentation/${id}/sections/${data.sectionId}`, "PUT", {
        content: data.content,
        completionStatus: data.completionStatus,
        reviewComments: data.reviewComments
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Section updated successfully",
      });
      setEditingSection(null);
      queryClient.invalidateQueries({ queryKey: ["/api/technical-documentation", id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    },
  });

  const handleEditSection = (section: TechnicalDocumentSection) => {
    setEditingSection(section.id);
    setSectionContent(section.content);
    setSectionStatus(section.completionStatus);
    setReviewComments(section.reviewComments || "");
  };

  const handleSaveSection = () => {
    if (editingSection) {
      updateSectionMutation.mutate({
        sectionId: editingSection,
        content: sectionContent,
        completionStatus: sectionStatus,
        reviewComments: reviewComments
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REVIEWED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'NOT_STARTED': 'secondary',
      'IN_PROGRESS': 'outline',
      'COMPLETED': 'default',
      'REVIEWED': 'default'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="text-lg">Loading technical document...</div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Document Not Found</h1>
          <p className="text-gray-600 mt-2">The requested technical document could not be found.</p>
          <Button
            onClick={() => setLocation("/technical-documentation")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Technical Documentation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/technical-documentation")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{document.title}</h1>
            <p className="text-gray-600">Document #{document.documentNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(document.status)}
          <Badge variant="outline">v{document.version}.{document.revisionLevel}</Badge>
        </div>
      </div>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">Device Model</Label>
            <p className="font-medium">{document.deviceModel}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Created By</Label>
            <p className="font-medium">{document.createdByUser} {document.createdByLastName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Created Date</Label>
            <p className="font-medium">{new Date(document.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
            <p className="font-medium">{new Date(document.updatedAt).toLocaleDateString()}</p>
          </div>
          {document.approvedByUser && (
            <>
              <div>
                <Label className="text-sm font-medium text-gray-500">Approved By</Label>
                <p className="font-medium">{document.approvedByUser} {document.approvedByLastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Approved Date</Label>
                <p className="font-medium">{document.approvedAt ? new Date(document.approvedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Document Sections */}
      <Card>
        <CardHeader>
          <CardTitle>MDR Technical Documentation Sections</CardTitle>
          <CardDescription>
            Complete all sections to ensure EU MDR compliance for your medical device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {document.sections && document.sections.length > 0 ? (
            document.sections.map((section, index) => (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(section.completionStatus)}
                    <div>
                      <h3 className="font-semibold">
                        {section.sectionNumber}. {section.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <User className="h-3 w-3" />
                        <span>Modified by {section.modifiedBy}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{new Date(section.lastModified).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(section.completionStatus)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSection(section)}
                      disabled={editingSection === section.id}
                    >
                      {editingSection === section.id ? "Editing..." : "Edit"}
                    </Button>
                  </div>
                </div>

                {editingSection === section.id ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={sectionContent}
                        onChange={(e) => setSectionContent(e.target.value)}
                        rows={8}
                        placeholder="Enter section content..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Completion Status</Label>
                        <Select value={sectionStatus} onValueChange={(value: any) => setSectionStatus(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="REVIEWED">Reviewed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="comments">Review Comments</Label>
                        <Input
                          id="comments"
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Optional review comments..."
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSaveSection}
                        disabled={updateSectionMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateSectionMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingSection(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="prose max-w-none">
                      {section.content ? (
                        <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                          {section.content}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic p-3">
                          No content provided yet. Click "Edit" to add content for this section.
                        </div>
                      )}
                    </div>
                    {section.reviewComments && (
                      <div className="bg-blue-50 p-3 rounded border">
                        <Label className="text-sm font-medium text-blue-700">Review Comments:</Label>
                        <p className="text-blue-600 mt-1">{section.reviewComments}</p>
                      </div>
                    )}
                  </div>
                )}
                {index < document.sections!.length - 1 && <Separator className="mt-4" />}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sections available for this document.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}