import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/page-header";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  AlertCircle, 
  Loader2, 
  Download,
  History 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Types
interface Document {
  id: number;
  documentId: string;
  title: string;
  typeId: number;
  statusId: number;
  revision: string;
  createdBy: number;
  approvedBy?: number;
  effectiveDate?: string;
  expirationDate?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

// Form schema for updating status
const statusUpdateSchema = z.object({
  statusId: z.coerce.number().min(1, "Status is required"),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

export default function DocumentDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/document-control/:id");
  const documentId = params?.id;
  const { toast } = useToast();
  
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  
  // Fetch document details
  const { 
    data: document, 
    isLoading, 
    error 
  } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/documents/${documentId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch document details");
      }
      return res.json();
    },
    enabled: !!documentId,
  });
  
  // Status update form
  const statusUpdateForm = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      statusId: document?.statusId || 1,
    },
  });
  
  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: Partial<Document>) => {
      const res = await apiRequest("PATCH", `/api/documents/${documentId}`, data);
      if (!res.ok) {
        throw new Error("Failed to update document");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Document updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId] });
      
      // Close dialog
      setOpenStatusDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update document: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmitStatusUpdate = (data: StatusUpdateFormValues) => {
    let updateData: Record<string, any> = { ...data };
    
    // If status changed to Approved, add approved date
    if (data.statusId === 3 && document?.statusId !== 3) {
      updateData.effectiveDate = new Date().toISOString();
    }
    
    updateDocumentMutation.mutate(updateData);
  };
  
  // Helper functions
  const getDocumentTypeName = (typeId: number): string => {
    const typeMap: Record<number, string> = {
      1: "SOP",
      2: "Work Instruction",
      3: "Form",
      4: "Policy",
      5: "Manual"
    };
    return typeMap[typeId] || "Unknown";
  };
  
  const getDocumentStatusName = (statusId: number): string => {
    const statusMap: Record<number, string> = {
      1: "Draft",
      2: "In Review",
      3: "Approved",
      4: "Obsolete"
    };
    return statusMap[statusId] || "Unknown";
  };
  
  const getStatusBadgeVariant = (status: string): "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange" => {
    const statusMap: Record<string, "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange"> = {
      "Draft": "yellow",
      "In Review": "blue",
      "Approved": "green",
      "Obsolete": "default"
    };
    return statusMap[status] || "default";
  };
  
  const getTypeBadgeVariant = (type: string): "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange" => {
    const typeMap: Record<string, "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange"> = {
      "SOP": "blue",
      "Work Instruction": "purple",
      "Form": "yellow",
      "Policy": "red",
      "Manual": "orange"
    };
    return typeMap[type] || "default";
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Document</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/document-control")}
        >
          Back to Document List
        </Button>
      </div>
    );
  }
  
  // No document found
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
        <p className="text-muted-foreground">The document you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/document-control")}
        >
          Back to Document List
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <PageHeader 
        title={document.title}
        description={`Document ID: ${document.documentId}`}
        actions={[
          {
            label: "Back to Document List",
            href: "/document-control",
            icon: <ArrowLeft className="h-5 w-5" />,
            variant: "outline",
          },
          {
            label: "Update Status",
            onClick: () => setOpenStatusDialog(true),
            icon: <Edit className="h-5 w-5" />,
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Document details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-2xl">{document.title}</CardTitle>
                    <CardDescription>Document ID: {document.documentId} | Rev: {document.revision}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <BadgeColored 
                      variant={getTypeBadgeVariant(getDocumentTypeName(document.typeId))}
                    >
                      {getDocumentTypeName(document.typeId)}
                    </BadgeColored>
                    <BadgeColored 
                      variant={getStatusBadgeVariant(getDocumentStatusName(document.statusId))}
                    >
                      {getDocumentStatusName(document.statusId)}
                    </BadgeColored>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {document.filePath ? (
                  <div className="mt-4 flex items-center justify-between bg-neutral-50 p-4 rounded border border-neutral-200">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <p className="font-medium">Document File</p>
                        <p className="text-neutral-600 text-sm">
                          {document.filePath.split('/').pop()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 bg-neutral-50 p-4 rounded border border-neutral-200 text-center text-neutral-600">
                    <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                    <p>No document file attached</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Document History
                </CardTitle>
                <CardDescription>
                  Version control and revision history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-primary h-6 w-6 rounded-full flex items-center justify-center text-white text-xs mt-0.5">
                      {document.revision}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Current Revision</p>
                      <p className="text-neutral-600 text-sm">
                        Updated on {document.updatedAt ? format(new Date(document.updatedAt), "PPP") : "N/A"}
                      </p>
                      <p className="text-neutral-600 text-sm mt-1">
                        Status: <span className="font-medium">{getDocumentStatusName(document.statusId)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Metadata */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <BadgeColored 
                        variant={getStatusBadgeVariant(getDocumentStatusName(document.statusId))}
                      >
                        {getDocumentStatusName(document.statusId)}
                      </BadgeColored>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1">
                      <BadgeColored 
                        variant={getTypeBadgeVariant(getDocumentTypeName(document.typeId))}
                      >
                        {getDocumentTypeName(document.typeId)}
                      </BadgeColored>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Document ID</dt>
                    <dd className="mt-1 text-gray-900">{document.documentId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Revision</dt>
                    <dd className="mt-1 text-gray-900">{document.revision}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created By</dt>
                    <dd className="mt-1 text-gray-900">User #{document.createdBy}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                    <dd className="mt-1 text-gray-900">
                      {document.approvedBy ? `User #${document.approvedBy}` : "Not approved yet"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                    <dd className="mt-1 text-gray-900">{format(new Date(document.createdAt), "PPP")}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                    <dd className="mt-1 text-gray-900">
                      {document.effectiveDate ? format(new Date(document.effectiveDate), "PPP") : "Not set"}
                    </dd>
                  </div>
                  {document.expirationDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                      <dd className="mt-1 text-gray-900">{format(new Date(document.expirationDate), "PPP")}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-gray-900">{format(new Date(document.updatedAt), "PPP")}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="border-t pt-6 pb-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setOpenStatusDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Document Status</DialogTitle>
            <DialogDescription>
              Change the current status of this document
            </DialogDescription>
          </DialogHeader>
          <Form {...statusUpdateForm}>
            <form onSubmit={statusUpdateForm.handleSubmit(onSubmitStatusUpdate)}>
              <FormField
                control={statusUpdateForm.control}
                name="statusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={document.statusId.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Draft</SelectItem>
                        <SelectItem value="2">In Review</SelectItem>
                        <SelectItem value="3">Approved</SelectItem>
                        <SelectItem value="4">Obsolete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenStatusDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateDocumentMutation.isPending}
                >
                  {updateDocumentMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}