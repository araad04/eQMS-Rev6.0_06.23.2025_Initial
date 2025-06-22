import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Wrench, 
  PlusCircle, 
  Search, 
  AlertCircle, 
  Calendar, 
  FileText 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Sample data for Maintenance Assets
const SAMPLE_ASSETS = [
  {
    id: 1,
    assetNumber: "MAINT-001",
    assetName: "Production Line A",
    location: "Main Factory",
    lastMaintenanceDate: "2025-04-10",
    nextMaintenanceDate: "2025-05-30",
    status: "operational",
    department: "Production",
    criticality: "high"
  },
  {
    id: 2,
    assetNumber: "MAINT-002",
    assetName: "HVAC System 1",
    location: "Building 1",
    lastMaintenanceDate: "2025-03-15",
    nextMaintenanceDate: "2025-06-15",
    status: "scheduled",
    department: "Facilities",
    criticality: "medium"
  },
  {
    id: 3,
    assetNumber: "MAINT-003",
    assetName: "Clean Room Air Handler",
    location: "Clean Room A",
    lastMaintenanceDate: "2025-04-25",
    nextMaintenanceDate: "2025-05-25",
    status: "needs_attention",
    department: "Quality",
    criticality: "high"
  },
  {
    id: 4,
    assetNumber: "MAINT-004",
    assetName: "Backup Generator",
    location: "Utility Room",
    lastMaintenanceDate: "2025-02-20",
    nextMaintenanceDate: "2025-05-20",
    status: "due_soon",
    department: "Facilities",
    criticality: "high"
  },
  {
    id: 5,
    assetNumber: "MAINT-005",
    assetName: "Water Purification System",
    location: "Lab Area",
    lastMaintenanceDate: "2025-03-30",
    nextMaintenanceDate: "2025-06-30",
    status: "operational",
    department: "R&D",
    criticality: "medium"
  }
];

export default function MaintenanceAssetsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");

  // Use sample data directly without API call
  // This would be replaced with a real API call in production
  const [isLoading, setIsLoading] = React.useState(true);
  const [assets, setAssets] = React.useState<typeof SAMPLE_ASSETS>([]);
  
  React.useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      setAssets(SAMPLE_ASSETS);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Filter assets based on search term and filters
  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = 
      searchTerm === "" ||
      asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || asset.status === statusFilter;

    const matchesDepartment = 
      departmentFilter === "all" || asset.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">Operational</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>;
      case "needs_attention":
        return <Badge variant="outline" className="bg-red-100 text-red-700 hover:bg-red-100">Needs Attention</Badge>;
      case "due_soon":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Due Soon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate days until next maintenance
  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <Badge variant="destructive">
          Overdue ({Math.abs(diffDays)} days)
        </Badge>
      );
    } else if (diffDays <= 14) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          Due Soon ({diffDays} days)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">
          {diffDays} days
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Maintenance Assets" 
        description="Track and manage maintenance schedules for critical equipment and facilities"
        actions={[
          {
            label: "Add New Asset",
            href: "/maintenance-assets/add",
            icon: <PlusCircle className="h-4 w-4" />
          }
        ]}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search assets..."
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
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="needs_attention">Needs Attention</SelectItem>
                  <SelectItem value="due_soon">Due Soon</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(assets?.map(item => item.department) || []))
                    .filter(department => department)
                    .sort()
                    .map(department => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={() => navigate("/maintenance-assets/add")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAssets && filteredAssets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {asset.assetNumber}
                    </TableCell>
                    <TableCell>{asset.assetName}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.lastMaintenanceDate}</TableCell>
                    <TableCell>{getDaysUntil(asset.nextMaintenanceDate)}</TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell>
                      <Badge className={asset.criticality === 'high' ? 'bg-red-100 text-red-800' : 
                                      asset.criticality === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-blue-100 text-blue-800'}>
                        {asset.criticality.charAt(0).toUpperCase() + asset.criticality.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/maintenance-assets/${asset.id}`)}
                        title="View Asset Details"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/maintenance-assets/${asset.id}/history`)}
                        title="View Maintenance History"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No assets found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                  ? "No maintenance assets match your current filters" 
                  : "No maintenance assets have been added to the system yet"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/maintenance-assets/add")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}