import { useQuery } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { exportToPdf, exportToExcel, type ExportOptions } from "@/utils/export-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Building, 
  Eye, 
  PhoneCall, 
  Mail,
  FileText,
  FileSpreadsheet,
  Filter,
  Download
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

interface Supplier {
  id: number;
  name: string;
  supplierId: string;
  categoryId: number;
  statusId: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  qualificationDate?: string;
  requalificationDate?: string;
  createdAt: string;
  updatedAt: string;
  // Derived fields for display
  categoryName?: string;
  statusName?: string;
}

// Export filter options
interface ExportFilterOptions {
  includeContacts: boolean;
  includeAddress: boolean;
  includeQualificationDates: boolean;
  filterByCategory: string;
  filterByStatus: string;
}

export default function SupplierManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierCategory, setSupplierCategory] = useState<string>("all");
  const [supplierStatus, setSupplierStatus] = useState<string>("all");
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Export filter state
  const [exportFilters, setExportFilters] = useState<ExportFilterOptions>({
    includeContacts: true,
    includeAddress: true,
    includeQualificationDates: true,
    filterByCategory: "all",
    filterByStatus: "all"
  });

  // Role-based access control for exports - temporarily allowing all roles for testing
  const canExport = true; // Allow all users to export for testing

  // Function to create sample suppliers
  const createSampleSuppliers = async () => {
    try {
      toast({
        title: "Creating sample suppliers",
        description: "Please wait...",
      });

      const response = await fetch('/api/suppliers/add-samples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to create sample suppliers: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Created ${result.suppliers?.length || 0} sample suppliers`,
      });

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error creating sample suppliers:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sample suppliers",
        variant: "destructive",
      });
    }
  };

  // Fetch suppliers
  const { data: suppliers, isLoading, refetch } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", supplierCategory, supplierStatus],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }

      const suppliers = await res.json();

      // Add derived fields for display
      return suppliers.map((supplier: Supplier) => ({
        ...supplier,
        categoryName: getSupplierCategoryName(supplier.categoryId),
        statusName: getSupplierStatusName(supplier.statusId)
      }));
    },
  });

  // Helper functions for supplier categories and statuses
  function getSupplierCategoryName(categoryId: number): string {
    const categoryMap: Record<number, string> = {
      1: "Critical",
      2: "Major",
      3: "Minor",
      4: "Service Provider",
      5: "Consultant"
    };
    return categoryMap[categoryId] || "Unknown";
  }

  function getSupplierStatusName(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: "Approved",
      2: "Pending Qualification",
      3: "On Probation",
      4: "Suspended",
      5: "Disqualified"
    };
    return statusMap[statusId] || "Unknown";
  }

  const getCategoryBadgeVariant = (category: string) => {
    const categoryMap: Record<string, any> = {
      "Critical": "red",
      "Major": "orange",
      "Minor": "yellow",
      "Service Provider": "blue",
      "Consultant": "purple"
    };
    return categoryMap[category] || "default";
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusMap: Record<string, any> = {
      "Approved": "green",
      "Pending Qualification": "yellow",
      "On Probation": "orange",
      "Suspended": "red",
      "Disqualified": "default"
    };
    return statusMap[status] || "default";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log(`Searching for: ${searchQuery}`);
  };

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers?.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.supplierId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isRequalificationDue = (date?: string): boolean => {
    if (!date) return false;

    const requalDate = new Date(date);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return requalDate <= thirtyDaysFromNow;
  };

  // Export handlers
  const handleExportPdf = () => {
    if (!filteredSuppliers || filteredSuppliers.length === 0) {
      toast({
        title: "Export failed",
        description: "No suppliers to export",
        variant: "destructive",
      });
      return;
    }

    // Define columns to export based on current filters
    const columns = [
      { header: "Supplier ID", key: "supplierId" as keyof Supplier },
      { header: "Name", key: "name" as keyof Supplier },
      { header: "Category", key: "categoryName" as keyof Supplier },
      { header: "Status", key: "statusName" as keyof Supplier },
    ];

    // Add optional columns based on filters
    if (exportFilters.includeContacts) {
      columns.push(
        { header: "Contact Name", key: "contactName" as keyof Supplier },
        { header: "Email", key: "contactEmail" as keyof Supplier },
        { header: "Phone", key: "contactPhone" as keyof Supplier }
      );
    }

    if (exportFilters.includeAddress) {
      columns.push({ header: "Address", key: "address" as keyof Supplier });
    }

    if (exportFilters.includeQualificationDates) {
      columns.push(
        { 
          header: "Qualification Date", 
          key: "qualificationDate" as keyof Supplier,
          formatter: (value: string) => value ? formatDate(value) : "Not qualified" 
        },
        { 
          header: "Requalification Due", 
          key: "requalificationDate" as keyof Supplier,
          formatter: (value: string) => value ? formatDate(value) : "N/A" 
        }
      );
    }

    // Apply filters for export if specified
    let dataToExport = [...filteredSuppliers];
    let filterInfo = "";

    if (exportFilters.filterByCategory !== "all") {
      const categoryName = getSupplierCategoryName(parseInt(exportFilters.filterByCategory));
      dataToExport = dataToExport.filter(s => s.categoryId === parseInt(exportFilters.filterByCategory));
      filterInfo += `Category: ${categoryName}, `;
    }

    if (exportFilters.filterByStatus !== "all") {
      const statusName = getSupplierStatusName(parseInt(exportFilters.filterByStatus));
      dataToExport = dataToExport.filter(s => s.statusId === parseInt(exportFilters.filterByStatus));
      filterInfo += `Status: ${statusName}, `;
    }

    if (searchQuery) {
      filterInfo += `Search: "${searchQuery}", `;
    }

    // Remove trailing comma and space
    if (filterInfo) {
      filterInfo = filterInfo.substring(0, filterInfo.length - 2);
    }

    // Configure export options
    const exportOptions: ExportOptions = {
      filename: "Supplier_List",
      title: "Supplier Management",
      subtitle: "Supplier List",
      filterInfo,
      footerText: `${user?.firstName} ${user?.lastName} | eQMS | Generated on ${formatDate(new Date().toISOString())}`,
    };

    try {
      exportToPdf(dataToExport, columns, exportOptions);
      toast({
        title: "Export successful",
        description: "Supplier list has been exported to PDF",
        variant: "success",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export supplier list to PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    if (!filteredSuppliers || filteredSuppliers.length === 0) {
      toast({
        title: "Export failed",
        description: "No suppliers to export",
        variant: "destructive",
      });
      return;
    }

    // Define columns to export based on current filters
    const columns = [
      { header: "Supplier ID", key: "supplierId" as keyof Supplier },
      { header: "Name", key: "name" as keyof Supplier },
      { header: "Category", key: "categoryName" as keyof Supplier },
      { header: "Status", key: "statusName" as keyof Supplier },
    ];

    // Add optional columns based on filters
    if (exportFilters.includeContacts) {
      columns.push(
        { header: "Contact Name", key: "contactName" as keyof Supplier },
        { header: "Email", key: "contactEmail" as keyof Supplier },
        { header: "Phone", key: "contactPhone" as keyof Supplier }
      );
    }

    if (exportFilters.includeAddress) {
      columns.push({ header: "Address", key: "address" as keyof Supplier });
    }

    if (exportFilters.includeQualificationDates) {
      columns.push(
        { 
          header: "Qualification Date", 
          key: "qualificationDate" as keyof Supplier,
          formatter: (value: string) => value ? formatDate(value) : "Not qualified" 
        },
        { 
          header: "Requalification Due", 
          key: "requalificationDate" as keyof Supplier,
          formatter: (value: string) => value ? formatDate(value) : "N/A" 
        }
      );
    }

    // Apply filters for export if specified
    let dataToExport = [...filteredSuppliers];

    if (exportFilters.filterByCategory !== "all") {
      dataToExport = dataToExport.filter(s => s.categoryId === parseInt(exportFilters.filterByCategory));
    }

    if (exportFilters.filterByStatus !== "all") {
      dataToExport = dataToExport.filter(s => s.statusId === parseInt(exportFilters.filterByStatus));
    }

    // Configure export options
    const exportOptions: ExportOptions = {
      filename: "Supplier_List",
    };

    try {
      exportToExcel(dataToExport, columns, exportOptions);
      toast({
        title: "Export successful",
        description: "Supplier list has been exported to Excel",
        variant: "success",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export supplier list to Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <PageHeader 
        title="Supplier Management"
        description="Manage and qualify your suppliers"
        actions={[
          {
            label: "Add Supplier",
            href: "/supplier-management/create",
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
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </form>

              {/* Filters and export buttons */}
              <div className="flex flex-wrap gap-3">
                <Select value={supplierCategory} onValueChange={setSupplierCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Supplier Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="1">Critical</SelectItem>
                    <SelectItem value="2">Major</SelectItem>
                    <SelectItem value="3">Minor</SelectItem>
                    <SelectItem value="4">Service Provider</SelectItem>
                    <SelectItem value="5">Consultant</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={supplierStatus} onValueChange={setSupplierStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Approved</SelectItem>
                    <SelectItem value="2">Pending Qualification</SelectItem>
                    <SelectItem value="3">On Probation</SelectItem>
                    <SelectItem value="4">Suspended</SelectItem>
                    <SelectItem value="5">Disqualified</SelectItem>
                  </SelectContent>
                </Select>

                {canExport && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleExportPdf}>
                        <FileText className="mr-2 h-4 w-4" /> Export to PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportExcel}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowFilterDialog(true)}>
                        <Filter className="mr-2 h-4 w-4" /> Filter Export
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* Suppliers table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="w-[150px]">Supplier ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Qualified Date</TableHead>
                  <TableHead>Requalification Due</TableHead>
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
                ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
                  // Actual supplier data
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.supplierId}</TableCell>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>
                        <BadgeColored variant={getCategoryBadgeVariant(supplier.categoryName || "")}>
                          {supplier.categoryName}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>
                        <BadgeColored variant={getStatusBadgeVariant(supplier.statusName || "")}>
                          {supplier.statusName}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>
                        {supplier.contactName ? (
                          <div className="flex flex-col">
                            <span>{supplier.contactName}</span>
                            {supplier.contactEmail && (
                              <a 
                                href={`mailto:${supplier.contactEmail}`} 
                                className="text-primary inline-flex items-center text-xs"
                              >
                                <Mail className="h-3 w-3 mr-1" /> {supplier.contactEmail}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400">No contact details</span>
                        )}
                      </TableCell>
                      <TableCell>{supplier.qualificationDate ? formatDate(supplier.qualificationDate) : "Not qualified"}</TableCell>
                      <TableCell>
                        {supplier.requalificationDate ? (
                          <span className={isRequalificationDue(supplier.requalificationDate) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(supplier.requalificationDate)}
                            {isRequalificationDue(supplier.requalificationDate) && " (Due soon)"}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/supplier-management/view/${supplier.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No suppliers found
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Building className="h-12 w-12 text-neutral-300 mb-2" />
                        <h3 className="text-lg font-medium text-neutral-900">No suppliers found</h3>
                        <p className="text-neutral-500 mt-1">
                          {searchQuery ? 
                            "Try adjusting your search or filters" : 
                            "Get started by adding your first supplier"}
                        </p>
                        {!searchQuery && (
                          <div className="flex gap-2 mt-4">
                            <Button onClick={createSampleSuppliers} variant="outline">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Sample Suppliers
                            </Button>
                            <Link href="/supplier-management/create">
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Supplier
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredSuppliers && filteredSuppliers.length > 0 && (
            <div className="py-4 px-6 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredSuppliers.length}</span> of <span className="font-medium">{filteredSuppliers.length}</span> results
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

      {/* Export Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription>
              Customize the content and filters for your export
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Include Data</h3>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeContacts" 
                  checked={exportFilters.includeContacts}
                  onCheckedChange={(checked) => 
                    setExportFilters({...exportFilters, includeContacts: checked as boolean})
                  }
                />
                <Label htmlFor="includeContacts">Contact Information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeAddress" 
                  checked={exportFilters.includeAddress}
                  onCheckedChange={(checked) => 
                    setExportFilters({...exportFilters, includeAddress: checked as boolean})
                  }
                />
                <Label htmlFor="includeAddress">Address</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeQualificationDates" 
                  checked={exportFilters.includeQualificationDates}
                  onCheckedChange={(checked) => 
                    setExportFilters({...exportFilters, includeQualificationDates: checked as boolean})
                  }
                />
                <Label htmlFor="includeQualificationDates">Qualification Dates</Label>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Filter Data</h3>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="filterByCategory">Category</Label>
                <Select 
                  value={exportFilters.filterByCategory} 
                  onValueChange={(value) => setExportFilters({...exportFilters, filterByCategory: value})}
                >
                  <SelectTrigger id="filterByCategory">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="1">Critical</SelectItem>
                    <SelectItem value="2">Major</SelectItem>
                    <SelectItem value="3">Minor</SelectItem>
                    <SelectItem value="4">Service Provider</SelectItem>
                    <SelectItem value="5">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="filterByStatus">Status</Label>
                <Select 
                  value={exportFilters.filterByStatus} 
                  onValueChange={(value) => setExportFilters({...exportFilters, filterByStatus: value})}
                >
                  <SelectTrigger id="filterByStatus">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Approved</SelectItem>
                    <SelectItem value="2">Pending Qualification</SelectItem>
                    <SelectItem value="3">On Probation</SelectItem>
                    <SelectItem value="4">Suspended</SelectItem>
                    <SelectItem value="5">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowFilterDialog(false);
                toast({
                  title: "Export filters applied",
                  description: "Your export preferences have been saved",
                });
              }}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}