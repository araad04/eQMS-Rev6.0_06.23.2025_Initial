import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { PlusCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Audit } from "@shared/schema";

export default function AuditManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<Audit | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/audits/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete audit');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      toast({
        title: "Audit Deleted",
        description: "The audit has been successfully deleted.",
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

  // Fetch audits
  const { data: audits = [], isLoading, error } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
    retry: 1,
  });

  // Filter audits based on selected status and type
  const filteredAudits = audits.filter((audit) => {
    const matchesStatus = statusFilter === "all" || audit.statusId === parseInt(statusFilter);
    const matchesType = typeFilter === "all" || audit.typeId === parseInt(typeFilter);
    return matchesStatus && matchesType;
  });

  // Separate audits by type for tabbed view
  const internalAudits = filteredAudits.filter((audit) => audit.typeId === 1);
  const supplierAudits = filteredAudits.filter((audit) => audit.typeId === 2);

  // Handle delete action
  const handleDeleteClick = (audit: Audit, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation
    setAuditToDelete(audit);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (auditToDelete) {
      deleteMutation.mutate(auditToDelete.id);
      setAuditToDelete(null);
    }
  };

  // Audit status options
  const auditStatuses = [
    { id: 1, name: "Planning" },
    { id: 2, name: "Scheduled" },
    { id: 3, name: "In Progress" },
    { id: 4, name: "Completed" },
    { id: 5, name: "Closed" },
  ];

  return (
    <>
      <Helmet>
        <title>Audit Management | Medical Device eQMS</title>
        <meta name="description" content="Manage internal and supplier audits in compliance with ISO 13485:2016 requirements" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <PageHeader 
          title="Audit Management" 
          description="Plan, conduct, and track internal and supplier audits in compliance with ISO 13485:2016"
          className="gradient-header mb-6"
        >
          <Link to="/audit-create">
            <Button className="ml-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Audit
            </Button>
          </Link>
        </PageHeader>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Status Filter</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {auditStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Audit Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="1">Internal</SelectItem>
                <SelectItem value="2">Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                Failed to load audits. Please try again later.
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Audits ({filteredAudits.length})</TabsTrigger>
              <TabsTrigger value="internal">Internal ({internalAudits.length})</TabsTrigger>
              <TabsTrigger value="supplier">Supplier ({supplierAudits.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAudits.length > 0 ? (
                  filteredAudits.map((audit) => (
                    <AuditCard key={audit.id} audit={audit} onDelete={handleDeleteClick} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <p className="text-muted-foreground">No audits found matching your criteria.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="internal" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {internalAudits.length > 0 ? (
                  internalAudits.map((audit) => (
                    <AuditCard key={audit.id} audit={audit} onDelete={handleDeleteClick} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <p className="text-muted-foreground">No internal audits found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="supplier" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {supplierAudits.length > 0 ? (
                  supplierAudits.map((audit) => (
                    <AuditCard key={audit.id} audit={audit} onDelete={handleDeleteClick} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <p className="text-muted-foreground">No supplier audits found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Audit"
        description={
          auditToDelete
            ? `Are you sure you want to delete the audit "${auditToDelete.title}"? This action cannot be undone and will permanently remove all associated data including findings, corrective actions, and documentation.`
            : ""
        }
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

// Audit Card Component
function AuditCard({ audit, onDelete }: { audit: Audit; onDelete: (audit: Audit, event: React.MouseEvent) => void }) {
  const getStatusBadgeClass = (statusId: number) => {
    switch (statusId) {
      case 1: return "bg-gray-100 text-gray-800"; // Planning
      case 2: return "bg-blue-100 text-blue-800"; // Scheduled
      case 3: return "bg-yellow-100 text-yellow-800"; // In Progress
      case 4: return "bg-green-100 text-green-800"; // Completed
      case 5: return "bg-purple-100 text-purple-800"; // Closed
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusName = (statusId: number) => {
    switch (statusId) {
      case 1: return "Planning";
      case 2: return "Scheduled";
      case 3: return "In Progress";
      case 4: return "Completed";
      case 5: return "Closed";
      default: return "Unknown";
    }
  };

  const getTypeName = (typeId: number) => {
    return typeId === 1 ? "Internal" : "Supplier";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold truncate">{audit.title}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {getTypeName(audit.typeId)} Audit
            </CardDescription>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(audit.statusId)}`}>
            {getStatusName(audit.statusId)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Scope: </span>
            <span className="font-medium">{audit.scope || "Not defined"}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Scheduled: </span>
            <span className="font-medium">{audit.scheduledDate ? formatDate(audit.scheduledDate.toString()) : "Not scheduled"}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">
              {audit.typeId === 2 ? "Supplier: " : "Department: "}
            </span>
            <span className="font-medium">
              {audit.typeId === 2 ? 
                (audit.supplierId ? `Supplier ID: ${audit.supplierId}` : "Not specified") : 
                (audit.departmentId ? `Department ID: ${audit.departmentId}` : "Not specified")}
            </span>
          </div>
          <div className="pt-3 flex gap-2">
            <Link to={`/audit-detail/${audit.id}`} className="flex-1">
              <Button variant="outline" className="w-full">View Details</Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => onDelete(audit, e)}
              className="px-3"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}