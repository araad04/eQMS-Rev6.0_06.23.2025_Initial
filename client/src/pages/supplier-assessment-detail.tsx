import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AssessmentSuggestions } from "@/components/supplier-management/assessment-suggestions";
import { format } from "date-fns";
import { ArrowLeft, Clipboard, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SupplierAssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const assessmentId = parseInt(id);
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assessment, isLoading, error } = useQuery({ 
    queryKey: ["/api/supplier-assessments", assessmentId],
    enabled: !isNaN(assessmentId)
  });

  const handleSuggestionsUpdated = () => {
    // Invalidate the assessment query to refresh the data
    queryClient.invalidateQueries({ queryKey: ["/api/supplier-assessments", assessmentId] });
    
    toast({
      title: "Suggestions Updated",
      description: "Assessment suggestions have been updated successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-4 max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Error Loading Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>An error occurred while loading the supplier assessment.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/supplier-assessments")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assessments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Format dates for display
  const scheduledDate = assessment.scheduledDate ? format(new Date(assessment.scheduledDate), 'MMM d, yyyy') : 'Not scheduled';
  const conductedDate = assessment.conductedDate ? format(new Date(assessment.conductedDate), 'MMM d, yyyy') : 'Not conducted';
  const createdDate = assessment.createdAt ? format(new Date(assessment.createdAt), 'MMM d, yyyy') : 'Unknown';

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Supplier Assessment {assessment.id} | eQMS</title>
        <meta name="description" content={`Supplier assessment details for ${assessment.supplier_name}`} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4 p-0 h-auto"
            onClick={() => navigate("/supplier-assessments")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Supplier Assessment Details
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">
                {assessment.assessmentType} for {assessment.supplier_name}
              </CardTitle>
              <Badge className={getStatusColor(assessment.status)}>
                {assessment.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Assessment ID: {assessment.id}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled Date</p>
                <p>{scheduledDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conducted Date</p>
                <p>{conductedDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{createdDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier Risk Level</p>
                <p>{assessment.supplier_criticality || 'Standard'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="findings" className="mb-8">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="findings">
              <FileText className="h-4 w-4 mr-2" />
              Findings & Results
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <CheckCircle className="h-4 w-4 mr-2" />
              Improvement Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Findings</CardTitle>
              </CardHeader>
              <CardContent>
                {assessment.findings ? (
                  <div className="whitespace-pre-line">{assessment.findings}</div>
                ) : (
                  <p className="text-muted-foreground italic">No findings have been documented yet.</p>
                )}

                {assessment.score !== null && assessment.score !== undefined && (
                  <div className="mt-4">
                    <Separator className="my-4" />
                    <h3 className="font-medium mb-2">Overall Score</h3>
                    <div className="flex items-center">
                      <Badge className={
                        assessment.score >= 80 ? "bg-green-100 text-green-800" :
                        assessment.score >= 60 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {assessment.score}/100
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions">
            <AssessmentSuggestions 
              assessmentId={assessmentId}
              initialSuggestions={assessment.suggestions || ""}
              isEditable={true}
              onSuggestionsUpdated={handleSuggestionsUpdated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}