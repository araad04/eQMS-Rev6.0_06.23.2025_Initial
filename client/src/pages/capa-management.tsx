import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  ClipboardList, 
  Eye, 
  AlertCircle,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Capa {
  id: number;
  capaId: string;
  title: string;
  description: string;
  typeId: number;
  statusId: number;
  initiatedBy: number;
  assignedTo?: number;
  dueDate?: string;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
  // Derived fields for display
  typeName?: string;
  statusName?: string;
  initiatedByName?: string;
  assignedToName?: string;
}

export default function CapaManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [capaType, setCapaType] = useState<string>("all");
  const [capaStatus, setCapaStatus] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [capaToDelete, setCapaToDelete] = useState<Capa | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/capas/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete CAPA');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capas"] });
      toast({
        title: "CAPA Deleted",
        description: "The CAPA has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch CAPAs
  const { data: capas, isLoading } = useQuery<Capa[]>({
    queryKey: ["/api/capas", capaType, capaStatus],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      const capas = await res.json();
      
      // Add derived fields for display
      return capas.map((capa: Capa) => ({
        ...capa,
        typeName: getCapaTypeName(capa.typeId),
        statusName: getCapaStatusName(capa.statusId),
        initiatedByName: undefined, // Will be populated from actual user data
        assignedToName: undefined // Will be populated from actual user data
      }));
    },
  });

  // Helper functions for CAPA types and statuses
  function getCapaTypeName(typeId: number): string {
    const typeMap: Record<number, string> = {
      1: "Corrective Action",
      2: "Preventive Action", 
      3: "Customer Complaint"
    };
    return typeMap[typeId] || "Unknown";
  }
  
  function getCapaStatusName(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: "Open",
      2: "In Progress",
      3: "Closed",
      4: "Cancelled"
    };
    return statusMap[statusId] || "Unknown";
  }
  
  const getStatusBadgeVariant = (status: string): "default" | "yellow" | "blue" | "green" => {
    const statusMap: Record<string, "default" | "yellow" | "blue" | "green"> = {
      "Open": "yellow",
      "In Progress": "blue",
      "Closed": "green",
      "Cancelled": "default"
    };
    return statusMap[status] || "default";
  };

  const getTypeBadgeVariant = (type: string): "default" | "red" | "blue" | "orange" => {
    const typeMap: Record<string, "default" | "red" | "blue" | "orange"> = {
      "Corrective Action": "red",
      "Preventive Action": "blue",
      "Customer Complaint": "orange"
    };
    return typeMap[type] || "default";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log(`Searching for: ${searchQuery}`);
  };

  // Handle delete action
  const handleDeleteClick = (capa: Capa, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation
    setCapaToDelete(capa);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (capaToDelete) {
      deleteMutation.mutate(capaToDelete.id);
      setCapaToDelete(null);
    }
  };

  // Filter CAPAs based on search query
  const filteredCapas = capas?.filter(capa => 
    capa.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    capa.capaId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    capa.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader 
        title="CAPA Management"
        description="Manage corrective and preventive actions"
        actions={[
          {
            label: "New CAPA",
            href: "/capa-management/create",
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
                    placeholder="Search CAPA..."
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
                <Select value={capaType} onValueChange={setCapaType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="CAPA Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="1">Corrective Action</SelectItem>
                    <SelectItem value="2">Preventive Action</SelectItem>
                    <SelectItem value="3">Customer Complaint</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={capaStatus} onValueChange={setCapaStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Open</SelectItem>
                    <SelectItem value="2">In Progress</SelectItem>
                    <SelectItem value="3">Closed</SelectItem>
                    <SelectItem value="4">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* CAPA table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="w-[130px]">CAPA ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-neutral-100 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredCapas && filteredCapas.length > 0 ? (
                  // Actual CAPA data
                  filteredCapas.map((capa) => (
                    <TableRow key={capa.id}>
                      <TableCell className="font-medium">{capa.capaId}</TableCell>
                      <TableCell>{capa.title}</TableCell>
                      <TableCell>
                        <BadgeColored variant={getTypeBadgeVariant(capa.typeName || "")}>
                          {capa.typeName}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>
                        <BadgeColored variant={getStatusBadgeVariant(capa.statusName || "")}>
                          {capa.statusName}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>{capa.assignedToName || "-"}</TableCell>
                      <TableCell>{capa.dueDate ? formatDate(capa.dueDate) : "-"}</TableCell>
                      <TableCell>{formatDate(capa.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/capa-management/${capa.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => handleDeleteClick(capa, e)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No CAPAs found
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <ClipboardList className="h-12 w-12 text-neutral-300 mb-2" />
                        <h3 className="text-lg font-medium text-neutral-900">No CAPA records found</h3>
                        <p className="text-neutral-500 mt-1">
                          {searchQuery ? 
                            "Try adjusting your search or filters" : 
                            "Get started by creating your first CAPA record"}
                        </p>
                        {!searchQuery && (
                          <Link href="/capa-management/create">
                            <Button className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Create CAPA
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
          {filteredCapas && filteredCapas.length > 0 && (
            <div className="py-4 px-6 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredCapas.length}</span> of <span className="font-medium">{filteredCapas.length}</span> results
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

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete CAPA"
        description={
          capaToDelete
            ? `Are you sure you want to delete CAPA "${capaToDelete.capaId}"? This action cannot be undone and will permanently remove the CAPA record and all associated data.`
            : ""
        }
        loading={deleteMutation.isPending}
      />
    </>
  );
}
