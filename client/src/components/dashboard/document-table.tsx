import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeColored } from "@/components/ui/badge-colored";
import { formatDate } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface Document {
  id: number;
  documentId: string;
  title: string;
  type: string;
  status: string;
  revision: string;
  updatedAt: string;
}

export function DocumentTable() {
  const [documentType, setDocumentType] = useState<string>("all");
  const [documentStatus, setDocumentStatus] = useState<string>("all");
  
  // Get documents from the API with filtering
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", documentType, documentStatus],
    queryFn: async () => {
      let url = "/api/documents";
      const params = new URLSearchParams();
      
      if (documentType !== 'all') {
        params.append('type', documentType);
      }
      
      if (documentStatus !== 'all') {
        params.append('status', documentStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      return await response.json();
    }
  });

  const getStatusBadgeVariant = (status: string): "default" | "green" | "yellow" | "red" => {
    const statusMap: Record<string, "default" | "green" | "yellow" | "red"> = {
      "Approved": "green",
      "In Review": "yellow",
      "Draft": "red",
      "Obsolete": "default"
    };
    return statusMap[status] || "default";
  };

  const getTypeBadgeVariant = (type: string): "default" | "blue" | "purple" | "green" | "orange" | "indigo" => {
    const typeMap: Record<string, "default" | "blue" | "purple" | "green" | "orange" | "indigo"> = {
      "SOP": "blue",
      "Work Instruction": "purple",
      "Form": "green",
      "Template": "orange",
      "Policy": "indigo"
    };
    return typeMap[type] || "default";
  };

  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="px-5 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-900">Document Tracking</h3>
          <div className="flex space-x-3">
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SOP">SOP</SelectItem>
                <SelectItem value="Work Instruction">Work Instructions</SelectItem>
                <SelectItem value="Form">Forms</SelectItem>
                <SelectItem value="Policy">Policy</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={documentStatus} onValueChange={setDocumentStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Obsolete">Obsolete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Document ID
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Title
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Revision
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Last Updated
                    </TableHead>
                    <TableHead className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody className="bg-white divide-y divide-neutral-200">
                  {isLoading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(7)].map((_, j) => (
                          <TableCell key={j} className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-neutral-100 rounded"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    documents?.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {document.documentId}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {document.title}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          <BadgeColored variant={getTypeBadgeVariant(document.type)}>
                            {document.type}
                          </BadgeColored>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <BadgeColored variant={getStatusBadgeVariant(document.status)}>
                            {document.status}
                          </BadgeColored>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {document.revision}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {formatDate(document.updatedAt)}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/document-control/${document.id}`} className="text-primary hover:text-primary-dark">
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{documents?.length || 0}</span> of <span className="font-medium">42</span> results
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
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">8</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">9</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
