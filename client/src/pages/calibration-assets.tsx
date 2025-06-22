import React from "react";
import { Helmet } from "react-helmet";
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
  Calendar,
  Search,
  Database,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AddCalibrationAssetDialog } from "@/components/measurement-analysis/add-calibration-asset-dialog";
// Define independent interface for calibration assets to avoid schema type mismatch
interface CalibrationAssetDisplay {
  id: number;
  assetNumber: string;
  assetName: string;
  location: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status: string;
  accuracy: string;
  assignedTo: string;
  department: string;
}

const CalibrationAssetsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleExport = (type: "excel" | "pdf") => {
    toast({
      title: `Exporting to ${type.toUpperCase()}`,
      description: "This feature will be implemented in a future update.",
    });
  };

  // Fetch calibration assets from API
  const { data: calibrationAssets = [], isLoading, error } = useQuery<CalibrationAssetDisplay[]>({
    queryKey: ["/api/calibration/assets"],
    queryFn: async () => {
      const response = await fetch("/api/calibration/assets");
      if (!response.ok) {
        throw new Error("Failed to fetch calibration assets");
      }
      return await response.json();
    }
  });

  // Filter assets based on search term (only if there are assets)
  const filteredAssets = calibrationAssets.length > 0 
    ? calibrationAssets.filter(asset => 
        asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Calculate summary metrics from real data
  const outOfCalibrationCount = calibrationAssets.filter(asset => 
    asset.status.toLowerCase() === 'out of calibration').length;
  
  // Calculate assets due in 30 days
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const dueInThirtyDaysCount = calibrationAssets.filter(asset => {
    const nextDueDate = new Date(asset.nextCalibrationDate);
    return nextDueDate > today && nextDueDate <= thirtyDaysFromNow;
  }).length;
  
  const calibratedCount = calibrationAssets.filter(asset => 
    asset.status.toLowerCase() === 'calibrated').length;

  // Get the most urgent out-of-calibration asset
  const urgentAsset = calibrationAssets.find(asset => 
    asset.status.toLowerCase() === 'out of calibration');
  
  // Get upcoming calibrations (due in the next 30 days), sort by date
  const upcomingCalibrations = calibrationAssets
    .filter(asset => {
      const nextDueDate = new Date(asset.nextCalibrationDate);
      return nextDueDate > today && nextDueDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => 
      new Date(a.nextCalibrationDate).getTime() - new Date(b.nextCalibrationDate).getTime()
    )
    .slice(0, 3); // Show at most 3 upcoming calibrations

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'calibrated':
        return "bg-green-500 hover:bg-green-600";
      case 'in calibration':
        return "bg-blue-500 hover:bg-blue-600";
      case 'out of calibration':
        return "bg-red-500 hover:bg-red-600";
      case 'scheduled':
        return "bg-amber-500 hover:bg-amber-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Database className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Calibration Assets Found</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        There are no calibration assets in the system. Add your first calibration asset to begin tracking.
      </p>
      <AddCalibrationAssetDialog>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Calibration Asset
        </Button>
      </AddCalibrationAssetDialog>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Unable to Load Calibration Assets</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {error instanceof Error ? error.message : "There was an error loading the calibration assets."}
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Calibration Assets | eQMS</title>
        <meta name="description" content="Manage and track calibration assets and their schedule" />
      </Helmet>

      <PageHeader
        title="Calibration Assets"
        description="Manage and track measurement devices requiring calibration"
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
            <AddCalibrationAssetDialog>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Calibration Asset
              </Button>
            </AddCalibrationAssetDialog>
          </>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading calibration assets...</span>
        </div>
      ) : error ? (
        <ErrorState />
      ) : calibrationAssets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="container py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Out of Calibration</CardTitle>
                <CardDescription>Assets requiring immediate calibration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{outOfCalibrationCount}</div>
                <p className="text-sm text-muted-foreground">Items past due for calibration</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Due in 30 Days</CardTitle>
                <CardDescription>Assets due for calibration soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">{dueInThirtyDaysCount}</div>
                <p className="text-sm text-muted-foreground">Schedule calibration soon</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Calibrated Assets</CardTitle>
                <CardDescription>Total calibrated assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{calibratedCount}</div>
                <p className="text-sm text-muted-foreground">Currently calibrated</p>
              </CardContent>
            </Card>
          </div>
          
          {urgentAsset ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Calibration Alert</CardTitle>
                <CardDescription>Assets requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="font-medium">Out of Calibration: {urgentAsset.assetName}</h3>
                    <p className="text-sm text-gray-600">
                      Asset {urgentAsset.assetNumber} is past due for calibration. Required for regulatory compliance.
                    </p>
                    <div className="mt-2">
                      <Button size="sm" variant="destructive">View Details</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
          
          {upcomingCalibrations.length > 0 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Calibrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingCalibrations.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-md">
                      <div>
                        <h3 className="font-medium">{asset.assetName} ({asset.assetNumber})</h3>
                        <p className="text-sm text-muted-foreground">Due: {asset.nextCalibrationDate}</p>
                      </div>
                      <Button size="sm" variant="outline">Schedule</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All Calibration Assets</h2>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
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
                  <TableHead>Asset Number</TableHead>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Calibration</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>{asset.assetName}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>{asset.calibrationDate}</TableCell>
                    <TableCell>{asset.nextCalibrationDate}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.accuracy}</TableCell>
                    <TableCell>{asset.assignedTo}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Asset Details",
                            description: `Viewing details for ${asset.assetName} (${asset.assetNumber})`,
                          });
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAssets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      No matching calibration assets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
};

export default CalibrationAssetsPage;