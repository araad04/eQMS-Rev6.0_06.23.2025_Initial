import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  FileText, 
  Eye,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Document {
  id: number;
  documentId: string;
  title: string;
  typeId: number;
  statusId: number;
  revision: string;
  createdBy: number;
  updatedAt: string;
  // Derived fields for display
  typeName?: string;
  statusName?: string;
  createdByName?: string;
}

export default function DocumentControl() {
  const [searchQuery, setSearchQuery] = useState("");
  const [documentType, setDocumentType] = useState<string>("all");
  const [documentStatus, setDocumentStatus] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch documents
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", documentType, documentStatus],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      const documents = await res.json();
      console.log("Raw documents from API:", documents);
      
      // Add derived fields for display and map dbId to id
      const transformedDocs = documents.map((doc: any) => {
        console.log("Processing document:", doc);
        const transformed = {
          ...doc,
          id: doc.dbId, // Map dbId from API to id expected by frontend
          documentId: doc.title, // Use title as document identifier
          revision: doc.version || "1.0",
          typeId: doc.type === "SOP" ? 1 : doc.type === "WI" ? 2 : doc.type === "FORM" ? 3 : doc.type === "POLICY" ? 4 : 5,
          statusId: doc.status === "DRAFT" ? 1 : doc.status === "REVIEW" ? 2 : doc.status === "APPROVED" ? 3 : 4,
          createdBy: parseInt(doc.owner) || 9999,
          updatedAt: doc.reviewDate || new Date().toISOString(),
          typeName: doc.type,
          statusName: doc.status,
          createdByName: "System"
        };
        console.log("Transformed document:", transformed);
        return transformed;
      });
      
      console.log("Final transformed documents:", transformedDocs);
      return transformedDocs;
    },
  });

  // Delete document mutation with ISO 13485 compliance validation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest("DELETE", `/api/documents/${documentId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Deleted",
        description: "Document has been successfully removed from the system with audit trail recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed", 
        description: error.message || "Failed to delete document. Check compliance requirements.",
        variant: "destructive",
      });
    },
  });

  // Document deletion handler with compliance checks
  const handleDeleteDocument = (doc: Document) => {
    console.log("Delete document called with:", doc);
    console.log("Document ID:", doc.id, "Type:", typeof doc.id);
    
    // Check if we have a valid ID
    if (!doc.id || doc.id === undefined) {
      toast({
        title: "Deletion Failed",
        description: "Invalid document ID. Cannot delete document.",
        variant: "destructive",
      });
      return;
    }
    
    // ISO 13485 compliance check - prevent deletion of approved documents
    if (doc.statusName === "Approved") {
      toast({
        title: "Deletion Restricted",
        description: "Approved documents cannot be deleted per ISO 13485 requirements. Use obsolete status instead.",
        variant: "destructive",
      });
      return;
    }
    
    deleteDocumentMutation.mutate(doc.id);
  };

  // Helper functions for document types and statuses
  function getDocumentTypeName(typeId: number): string {
    const typeMap: Record<number, string> = {
      1: "SOP",
      2: "Work Instruction",
      3: "Form",
      4: "Policy",
      5: "Manual"
    };
    return typeMap[typeId] || "Unknown";
  }
  
  function getDocumentStatusName(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: "Draft",
      2: "In Review",
      3: "Approved",
      4: "Obsolete"
    };
    return statusMap[statusId] || "Unknown";
  }
  
  const getTypeBadgeVariant = (type: string): "default" | "blue" | "purple" | "green" | "indigo" | "pink" => {
    const typeMap: Record<string, "default" | "blue" | "purple" | "green" | "indigo" | "pink"> = {
      "SOP": "blue",
      "Work Instruction": "purple",
      "Form": "green",
      "Policy": "indigo",
      "Manual": "pink"
    };
    return typeMap[type] || "default";
  };

  const getStatusBadgeVariant = (status: string): "default" | "green" | "yellow" | "red" => {
    const statusMap: Record<string, "default" | "green" | "yellow" | "red"> = {
      "Approved": "green",
      "In Review": "yellow",
      "Draft": "red",
      "Obsolete": "default"
    };
    return statusMap[status] || "default";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log(`Searching for: ${searchQuery}`);
  };

  // Filter documents based on search query
  const filteredDocuments = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.documentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader 
        title="Document Control"
        description="Manage your quality system documentation"
        actions={[
          {
            label: "New Document",
            href: "/document-control/create",
            icon: <Plus className="h-5 w-5" />,
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <div className="bg-white shadow rounded-lg">
          {/* Search and filter section */}
          <div className="p-5 border-b border-neutral-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search bar */}
              <form onSubmit={handleSearch} className="w-full md:w-96">
                <div className="relative">
                  <Input
                    type="text" 
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </form>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="1">SOP</SelectItem>
                    <SelectItem value="2">Work Instruction</SelectItem>
                    <SelectItem value="3">Form</SelectItem>
                    <SelectItem value="4">Policy</SelectItem>
                    <SelectItem value="5">Manual</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={documentStatus} onValueChange={setDocumentStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Draft</SelectItem>
                    <SelectItem value="2">In Review</SelectItem>
                    <SelectItem value="3">Approved</SelectItem>
                    <SelectItem value="4">Obsolete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Documents table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="w-[150px]">Document ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Revision</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-neutral-100 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredDocuments && filteredDocuments.length > 0 ? (
                  // Actual document data
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.documentId}</TableCell>
                      <TableCell>{doc.title}</TableCell>
                      <TableCell>
                        <BadgeColored variant={getTypeBadgeVariant(doc.typeName || "")}>
                          {doc.typeName}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>
                        <BadgeColored variant={getStatusBadgeVariant(doc.statusName || "")}>
                          {doc.statusName}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>{doc.revision}</TableCell>
                      <TableCell>{formatDate(doc.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/document-control/document/${doc.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          
                          {/* Delete button with compliance validation */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={doc.statusName === "Approved"}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                                  Delete Document
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{doc.title}"? This action cannot be undone and will be recorded in the audit trail for ISO 13485 compliance.
                                  {doc.statusName === "Approved" && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                                      <strong>Note:</strong> Approved documents cannot be deleted per ISO 13485 requirements. Use obsolete status instead.
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deleteDocumentMutation.isPending}
                                >
                                  {deleteDocumentMutation.isPending ? "Deleting..." : "Delete Document"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No documents found
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-neutral-300 mb-2" />
                        <h3 className="text-lg font-medium text-neutral-900">No documents found</h3>
                        <p className="text-neutral-500 mt-1">
                          {searchQuery ? 
                            "Try adjusting your search or filters" : 
                            "Get started by creating your first document"}
                        </p>
                        {!searchQuery && (
                          <Link href="/document-control/create">
                            <Button className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Document
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredDocuments && filteredDocuments.length > 0 && (
            <div className="py-4 px-6 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredDocuments.length}</span> of <span className="font-medium">{filteredDocuments.length}</span> results
                </p>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
