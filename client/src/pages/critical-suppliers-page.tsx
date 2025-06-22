import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Filter, Check, X, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function CriticalSuppliersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const { toast } = useToast();

  // Fetch critical suppliers from API
  const { data: suppliers, isLoading, error } = useQuery({
    queryKey: ["/api/critical-suppliers"],
    queryFn: async () => {
      const res = await fetch(`/api/critical-suppliers`);
      if (!res.ok) {
        throw new Error("Failed to fetch critical suppliers");
      }
      return await res.json();
    }
  });

  // Fetch supplier statuses
  const { data: supplierStatuses } = useQuery({
    queryKey: ["/api/supplier-statuses"],
    queryFn: async () => {
      const res = await fetch(`/api/supplier-statuses`);
      if (!res.ok) {
        throw new Error("Failed to fetch supplier statuses");
      }
      return await res.json();
    }
  });

  // Fetch supplier categories
  const { data: supplierCategories } = useQuery({
    queryKey: ["/api/supplier-categories"],
    queryFn: async () => {
      const res = await fetch(`/api/supplier-categories`);
      if (!res.ok) {
        throw new Error("Failed to fetch supplier categories");
      }
      return await res.json();
    }
  });

  // Form state for new supplier
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    categoryId: "",
    statusId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    isCritical: true,
    activities: ""
  });

  // Handle input change for new supplier form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change for new supplier form
  const handleSelectChange = (name: string, value: string) => {
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (supplier: typeof newSupplier) => {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...supplier,
          categoryId: parseInt(supplier.categoryId),
          statusId: parseInt(supplier.statusId),
          supplierId: `SUP-${Math.floor(1000 + Math.random() * 9000)}`
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to create supplier");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Supplier created",
        description: "Supplier has been successfully added",
        variant: "default",
      });
      setOpenCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/critical-suppliers"] });
      setNewSupplier({
        name: "",
        categoryId: "",
        statusId: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        isCritical: true,
        activities: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create supplier: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter suppliers
  const filteredSuppliers = suppliers?.filter(supplier => {
    // Apply text search
    if (searchQuery && !supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !supplier.supplierId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Apply status filter
    if (statusFilter !== "all" && supplier.statusId !== parseInt(statusFilter)) {
      return false;
    }

    return true;
  }) || [];

  // Helper function to get status name
  const getStatusName = (statusId) => {
    if (!supplierStatuses) return "Unknown";
    const status = supplierStatuses.find(s => s.id === statusId);
    return status ? status.name : "Unknown";
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (statusName) => {
    switch(statusName.toLowerCase()) {
      case "qualified":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "conditional":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "disqualified":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Helper function to get category name
  const getCategoryName = (categoryId) => {
    if (!supplierCategories) return "Unknown";
    const category = supplierCategories.find(c => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Handle create supplier form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierMutation.mutate(newSupplier);
  };

  if (error) {
    return (
      <Layout>
        <Helmet>
          <title>Critical Suppliers - eQMS</title>
          <meta name="description" content="View and manage critical suppliers for regulatory compliance" />
        </Helmet>
        <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
          <Card className="w-[500px]">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle size={20} />
                Error Loading Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">We encountered an error while loading the critical suppliers list:</p>
              <p className="px-4 py-2 bg-red-50 text-red-800 rounded-md font-mono text-sm">{error.message}</p>
              <div className="flex justify-end mt-6">
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] })}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Critical Suppliers - eQMS</title>
        <meta name="description" content="View and manage critical suppliers for regulatory compliance" />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Critical Suppliers</h1>
            <p className="text-muted-foreground mt-1">
              Manage critical suppliers required for regulatory compliance
            </p>
          </div>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} />
                Add Critical Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add Critical Supplier</DialogTitle>
                <DialogDescription>
                  Add a new critical supplier to your qualified suppliers list.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Supplier Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter supplier name"
                      required
                      value={newSupplier.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="categoryId">Category</Label>
                      <Select
                        value={newSupplier.categoryId}
                        onValueChange={(value) => handleSelectChange("categoryId", value)}
                        required
                      >
                        <SelectTrigger id="categoryId">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {supplierCategories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="statusId">Status</Label>
                      <Select
                        value={newSupplier.statusId}
                        onValueChange={(value) => handleSelectChange("statusId", value)}
                        required
                      >
                        <SelectTrigger id="statusId">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {supplierStatuses?.map((status) => (
                              <SelectItem key={status.id} value={status.id.toString()}>
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="activities">Activities</Label>
                    <Textarea
                      id="activities"
                      name="activities"
                      placeholder="Description of supplier activities"
                      required
                      value={newSupplier.activities}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Supplier address"
                      value={newSupplier.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        name="contactName"
                        placeholder="Contact person"
                        value={newSupplier.contactName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        placeholder="Email address"
                        value={newSupplier.contactEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        placeholder="Phone number"
                        value={newSupplier.contactPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSupplierMutation.isPending}>
                    {createSupplierMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Supplier
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search suppliers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {supplierStatuses?.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">No critical suppliers found</h3>
                <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                  {searchQuery || statusFilter !== "all" ? 
                    "Try adjusting your filters to find what you're looking for." : 
                    "Add your first critical supplier to get started."}
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Activities</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        <div>
                          <Link href={`/supplier-management/${supplier.id}`} className="hover:underline font-medium">
                            {supplier.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">{supplier.supplierId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryName(supplier.categoryId)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={supplier.activities}>
                        {supplier.activities || "No activities specified"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={supplier.address}>
                        {supplier.address || "No address specified"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const statusName = getStatusName(supplier.statusId);
                          return (
                            <Badge className={getStatusBadgeColor(statusName)}>
                              {statusName}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}