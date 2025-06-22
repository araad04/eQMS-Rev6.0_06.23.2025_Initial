import React from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle,
  Search,
  Package,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NonconformingProduct } from "@/../../shared/schema";

const NonconformingProductsPage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleExport = (type: "excel" | "pdf") => {
    toast({
      title: `Exporting to ${type.toUpperCase()}`,
      description: "This feature will be implemented in a future update.",
    });
  };

  // Fetch nonconforming products from API
  const { data: nonconformingProducts = [], isLoading } = useQuery<NonconformingProduct[]>({
    queryKey: ["/api/production/nonconforming"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/production/nonconforming/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "Nonconforming product has been successfully deleted.",
      });
      // Invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: ["/api/production/nonconforming"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: "Failed to delete the nonconforming product. Please try again.",
      });
      console.error('Delete error:', error);
    },
  });

  const handleDelete = (product: NonconformingProduct) => {
    deleteMutation.mutate(product.id);
  };

  // Filter nonconforming products based on search term
  const filteredProducts = nonconformingProducts.filter((product: NonconformingProduct) => 
    product.ncpId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.detectionStage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return "bg-red-500 hover:bg-red-600";
      case 'high':
        return "bg-orange-500 hover:bg-orange-600";
      case 'medium':
        return "bg-yellow-500 hover:bg-yellow-600";
      case 'low':
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return "bg-red-500 hover:bg-red-600";
      case 'under investigation':
        return "bg-amber-500 hover:bg-amber-600";
      case 'corrective action implemented':
        return "bg-green-500 hover:bg-green-600";
      case 'closed':
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  return (
    <>
      <Helmet>
        <title>Nonconforming Products | eQMS</title>
        <meta name="description" content="Manage and track nonconforming products" />
      </Helmet>

      <PageHeader
        title="Nonconforming Products"
        description="Identify, record, and manage nonconforming products"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate("/production/nonconforming-product-form")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Nonconforming Product
            </Button>
          </>
        }
      />

      <div className="container py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Open</CardTitle>
              <CardDescription>Nonconforming products requiring action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">2</div>
              <p className="text-sm text-muted-foreground">Includes 1 critical issue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Under Investigation</CardTitle>
              <CardDescription>Products being evaluated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">1</div>
              <p className="text-sm text-muted-foreground">Medium severity</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">This Month</CardTitle>
              <CardDescription>All nonconforming products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">4</div>
              <p className="text-sm text-muted-foreground">1 closed this month</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Critical alerts from database - only show if there are critical severity items */}
        {filteredProducts.some(product => product.severityId === 1) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Critical Alerts</CardTitle>
              <CardDescription>Nonconforming products requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredProducts
                .filter(product => product.severityId === 1)
                .slice(0, 3)
                .map(product => (
                  <div key={product.id} className="flex items-center space-x-4 p-4 bg-red-50 border border-red-200 rounded-md mb-2 last:mb-0">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                      <h3 className="font-medium">Critical Nonconformity: {product.ncpId}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => navigate(`/production/nonconforming-products/${product.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">All Nonconforming Products</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Date Detected</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product: NonconformingProduct) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.ncpId}</TableCell>
                  <TableCell>{product.batchNumber}</TableCell>
                  <TableCell>{product.detectedAt ? new Date(product.detectedAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{product.description}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityBadgeColor(product.severityId?.toString() || 'medium')}>
                      Severity {product.severityId || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(product.statusId?.toString() || 'open')}>
                      {product.statusId === 1 ? 'Open' : product.statusId === 2 ? 'Closed' : 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.detectedBy || 'Unassigned'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/production/nonconforming-products/${product.id}`)}
                      >
                        View
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Nonconforming Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.ncpId}"? This action cannot be undone.
                              <br /><br />
                              <strong>Product Details:</strong>
                              <br />• ID: {product.ncpId}
                              <br />• Batch: {product.batchNumber}
                              <br />• Description: {product.description}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? "Deleting..." : "Delete Product"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">No nonconforming products found</p>
                      <p className="text-sm text-gray-400">Records will appear here when nonconforming products are identified</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-pulse">Loading nonconforming products...</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default NonconformingProductsPage;