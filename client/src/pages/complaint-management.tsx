import { useState } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, FileText, PlusCircle, Search } from "lucide-react";
import { Complaint } from "@shared/schema";
import { formatDate } from "@/lib/utils";

export default function ComplaintManagement() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: complaints, isLoading, error } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    queryFn: async () => {
      const response = await fetch('/api/complaints');
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      return response.json();
    }
  });

  // Filter complaints based on search term and filters
  const filteredComplaints = complaints ? complaints.filter((item: Complaint) => {
    const matchesSearch =
      searchTerm === "" ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  }) : [];

  // Get human-readable status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "under_investigation": return "Under Investigation";
      case "corrective_action": return "Corrective Action";
      case "resolved": return "Resolved";
      case "closed": return "Closed";
      default: return status;
    }
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="outline">New</Badge>;
      case "under_investigation":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100">{getStatusLabel(status)}</Badge>;
      case "corrective_action":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100">{getStatusLabel(status)}</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">{getStatusLabel(status)}</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-100">{getStatusLabel(status)}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get complaint category badge styling
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "product_quality":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Product Quality</Badge>;
      case "adverse_event":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Adverse Event</Badge>;
      case "packaging":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Packaging</Badge>;
      case "labeling":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Labeling</Badge>;
      case "shipping":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Shipping</Badge>;
      case "other":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Other</Badge>;
      default:
        return <Badge>{category}</Badge>;
    }
  };
  
  // Convert severity number to human-readable label
  const getSeverityLabel = (severity: number): string => {
    switch (severity) {
      case 1: return "Low";
      case 2: return "Medium";
      case 3: return "High";
      case 4: return "Critical";
      case 5: return "Emergency";
      default: return "Unknown";
    }
  };
  
  // Get user name from ID
  const getUserName = (userId: number | null): string => {
    if (!userId) return "Unassigned";
    // In a real application, you would fetch this data from the API or state
    // For now, using a placeholder until we implement user fetching
    return `User ${userId}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Complaint Management</h1>
          <p className="text-muted-foreground">
            Track and manage customer complaints and adverse event reports
          </p>
        </div>
        <Button onClick={() => navigate("/measurement-analysis/complaints/create")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Record Complaint
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaints</CardTitle>
          <CardDescription>
            View and manage customer complaints related to products and services
          </CardDescription>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search complaints..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="under_investigation">Investigating</SelectItem>
                <SelectItem value="corrective_action">Action Required</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="product_quality">Product Quality</SelectItem>
                <SelectItem value="adverse_event">Adverse Event</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="labeling">Labeling</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-destructive">
              <AlertCircle className="mr-2 h-6 w-6" />
              Error loading complaint data
            </div>
          ) : filteredComplaints && filteredComplaints.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((item: Complaint) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {item.complaintNumber}
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>{getCategoryBadge(item.category)}</TableCell>
                    <TableCell>
                      <Badge variant={item.severity === 3 ? "destructive" : 
                             item.severity === 2 ? "outline" : "secondary"}>
                        {getSeverityLabel(item.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getUserName(item.assignedTo) || "Unassigned"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/measurement-analysis/complaints/${item.id}`)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No complaints found</h3>
              <p className="text-muted-foreground mt-1">
                No customer complaints match your current filters
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/measurement-analysis/complaints/create")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Record New Complaint
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}