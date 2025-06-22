import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, FileCog, ClipboardList, AlertTriangle } from "lucide-react";
import { Complaint } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ComplaintDetail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [, params] = useRoute("/measurement-analysis/complaints/:id");
  const complaintId = params?.id;
  const [isCreatingCapa, setIsCreatingCapa] = useState(false);

  const { data: complaint, isLoading, error } = useQuery<Complaint>({
    queryKey: [`/api/complaints/${complaintId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/complaints/${complaintId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch complaint details");
      }
      return res.json();
    },
    enabled: !!complaintId,
  });

  const createCapaMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/complaints/${complaintId}/create-capa`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create CAPA");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CAPA Created",
        description: `CAPA ${data.capaId} has been created successfully from this complaint.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/complaints/${complaintId}`] });
      // Navigate to the CAPA detail page
      navigate(`/capa-management/${data.capa.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating CAPA",
        description: error.message,
        variant: "destructive",
      });
      setIsCreatingCapa(false);
    },
  });

  const handleCreateCapa = () => {
    if (complaint?.capaId) {
      toast({
        title: "CAPA Already Exists",
        description: "A CAPA has already been created for this complaint.",
        variant: "default",
      });
      return;
    }
    
    setIsCreatingCapa(true);
    createCapaMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/measurement-analysis/complaints")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-52 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/measurement-analysis/complaints")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Error</h1>
            <p className="text-muted-foreground">
              Failed to load complaint details
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error Loading Complaint
            </CardTitle>
            <CardDescription>
              There was an error loading the complaint details. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error?.message || "Unknown error occurred"}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/measurement-analysis/complaints")}>
              Return to Complaints
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Function to convert status codes to human-readable labels
  function formatStatusLabel(status: string): string {
    switch (status) {
      case "new": return "New";
      case "under_investigation": return "Under Investigation";
      case "corrective_action": return "Corrective Action";
      case "resolved": return "Resolved";
      case "closed": return "Closed";
      default: return status;
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "new":
        return "default";
      case "under_investigation":
        return "secondary";
      case "corrective_action":
        return "outline";
      case "resolved":
        return "outline";
      case "closed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1: return "Low";
      case 2: return "Medium";
      case 3: return "High";
      case 4: return "Critical";
      case 5: return "Emergency";
      default: return "Unknown";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "product_quality": return "Product Quality";
      case "adverse_event": return "Adverse Event";
      case "packaging": return "Packaging";
      case "labeling": return "Labeling";
      case "shipping": return "Shipping";
      case "other": return "Other";
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/measurement-analysis/complaints")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Complaint Detail</h1>
            <p className="text-muted-foreground">
              {complaint.complaintNumber}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleCreateCapa}
            disabled={isCreatingCapa || !!complaint.capaId}
            className="flex items-center"
          >
            {isCreatingCapa ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"></span>
                Creating CAPA...
              </>
            ) : (
              <>
                <FileCog className="mr-2 h-4 w-4" />
                {complaint.capaId ? "CAPA Created" : "Create CAPA"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{complaint.customerName}'s Complaint</span>
              <Badge variant={getStatusBadgeVariant(complaint.status)}>
                {formatStatusLabel(complaint.status)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Received on {format(new Date(complaint.dateReceived), "PPP")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{complaint.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Category</h3>
                <p className="text-sm text-muted-foreground">{getCategoryLabel(complaint.category)}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Severity</h3>
                <div className="flex items-center">
                  <Badge
                    variant={complaint.severity >= 4 ? "destructive" : complaint.severity >= 3 ? "outline" : "outline"}
                    className="mr-2"
                  >
                    {complaint.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{getSeverityLabel(complaint.severity)}</span>
                </div>
              </div>
              {complaint.batchNumber && (
                <div>
                  <h3 className="font-medium mb-2">Batch Number</h3>
                  <p className="text-sm text-muted-foreground">{complaint.batchNumber}</p>
                </div>
              )}
              {complaint.serialNumber && (
                <div>
                  <h3 className="font-medium mb-2">Serial Number</h3>
                  <p className="text-sm text-muted-foreground">{complaint.serialNumber}</p>
                </div>
              )}
            </div>

            {(complaint.rootCause || complaint.investigationFindings || complaint.correctiveAction) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {complaint.investigationFindings && (
                    <div>
                      <h3 className="font-medium mb-2">Investigation Findings</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{complaint.investigationFindings}</p>
                    </div>
                  )}
                  {complaint.rootCause && (
                    <div>
                      <h3 className="font-medium mb-2">Root Cause</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{complaint.rootCause}</p>
                    </div>
                  )}
                  {complaint.correctiveAction && (
                    <div>
                      <h3 className="font-medium mb-2">Corrective Action</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{complaint.correctiveAction}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Customer</h3>
                <p className="text-sm text-muted-foreground">{complaint.customerName}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Email</h3>
                <p className="text-sm text-muted-foreground">{complaint.customerContact}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reportability Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Reportable to Authorities</h3>
                <Badge variant={complaint.isReportable ? "destructive" : "outline"}>
                  {complaint.isReportable ? "Yes" : "No"}
                </Badge>
              </div>
              
              {complaint.isReportable && (
                <>
                  {complaint.regulationType && (
                    <div>
                      <h3 className="font-medium mb-1">Regulation</h3>
                      <p className="text-sm text-muted-foreground">
                        {complaint.regulationType === "mdr" ? "EU MDR" : 
                         complaint.regulationType === "ivdr" ? "EU IVDR" : 
                         complaint.regulationType === "fda" ? "FDA 21 CFR Part 803" :
                         complaint.regulationType === "mhra" ? "UK MHRA" : 
                         complaint.regulationType === "pmda" ? "Japan PMDA" : 
                         complaint.regulationType === "other" ? "Other" : 
                         complaint.regulationType}
                      </p>
                    </div>
                  )}
                  
                  {complaint.reportabilityReason && (
                    <div>
                      <h3 className="font-medium mb-1">Reason for Reportability</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{complaint.reportabilityReason}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {complaint.capaId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related CAPA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5" />
                  <Button
                    variant="link"
                    onClick={() => navigate(`/capa-management/${complaint.capaId}`)}
                    className="p-0 h-auto font-medium"
                  >
                    View Associated CAPA
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}