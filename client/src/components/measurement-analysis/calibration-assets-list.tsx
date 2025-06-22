import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalibrationAsset } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useLocation } from "wouter";
import { AlertCircle, FileText, PlusCircle, Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CalibrationAssetsListProps {
  data: CalibrationAsset[];
  isLoading: boolean;
}

export default function CalibrationAssetsList({ data, isLoading }: CalibrationAssetsListProps) {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter assets based on search term and filters
  const filteredAssets = data?.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    // Use manufacturer field for filtering
    const matchesType = typeFilter === "all" || item.manufacturer === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case "due_calibration":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Due Calibration</Badge>;
      case "out_of_service":
        return <Badge variant="outline" className="bg-red-100 text-red-700 hover:bg-red-100">Out of Service</Badge>;
      case "under_repair":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Under Repair</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate calibration due status
  const getCalibrationStatus = (nextCalibrationDate: Date | string | null) => {
    if (!nextCalibrationDate) return "Not Required";
    
    const today = new Date();
    const dueDate = new Date(nextCalibrationDate);
    
    // Check if date is valid
    if (isNaN(dueDate.getTime())) return "Invalid Date";
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <Badge variant="destructive">
          Overdue ({Math.abs(diffDays)} days)
        </Badge>
      );
    } else if (diffDays <= 30) {
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="due_calibration">Due Calibration</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
                <SelectItem value="under_repair">Under Repair</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {Array.from(new Set(data?.map(item => item.manufacturer) || []))
                  .filter(manufacturer => manufacturer)
                  .sort()
                  .map(manufacturer => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/calibration-assets/add")}>
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
                <TableHead>Serial #</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Calibration Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    {item.assetId}
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.serialNumber}</TableCell>
                  <TableCell className="capitalize">{item.manufacturer || 'Unknown'}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    {getCalibrationStatus(item.nextCalibrationDate)}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/measurement-analysis/calibration/${item.id}`)}
                      title="View Asset Details"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/measurement-analysis/calibration/${item.id}/records`)}
                      title="View Calibration Records"
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
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? "No calibration assets match your current filters" 
                : "No calibration assets have been added to the system yet"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/measurement-analysis/calibration/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Asset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}