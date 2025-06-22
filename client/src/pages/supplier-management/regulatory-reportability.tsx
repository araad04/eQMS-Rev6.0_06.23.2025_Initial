import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RegulatoryReportabilityAssessment from "@/components/supplier/regulatory-reportability-assessment";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, FileBarChart, Calendar, AlertTriangle, Check, X } from "lucide-react";
import { navigateTo } from "@/lib/navigation";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define interfaces for the assessment history
interface RegulatoryAssessment {
  id: number;
  supplierId: number;
  incidentDate: string;
  productInvolved: string;
  incidentDescription: string;
  isFieldAction: boolean;
  isDeviceFailure: boolean;
  isAdverseEvent: boolean;
  patientHarm: string;
  reportabilityDecision: string;
  reportabilityJustification: string;
  decisionTreePath: string[];
  regulatoryAuthorities: string[];
  reportingDeadline?: string;
  reportedDate?: string;
  reportNumbers?: Record<string, string>;
  createdBy: number;
  createdAt: string;
  updatedBy?: number;
  updatedAt?: string;
}

// Define the Assessment History component
interface AssessmentHistoryViewProps {
  supplierId: number;
}

const AssessmentHistoryView = ({ supplierId }: AssessmentHistoryViewProps) => {
  // Fetch the assessment history for this supplier
  const { data: assessments = [], isLoading, error } = useQuery<RegulatoryAssessment[]>({
    queryKey: [`/api/suppliers/regulatory-reportability/supplier/${supplierId}`],
    enabled: !!supplierId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading assessment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border rounded-lg bg-destructive/10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <h3 className="text-lg font-medium">Error loading assessment history</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There was a problem fetching the assessment history. Please try again later.
        </p>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="p-8 border rounded-lg bg-muted/50 text-center">
        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <h3 className="text-lg font-medium">No assessment history</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No regulatory reportability assessments have been conducted for this supplier yet.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => {
            const tabTrigger = document.querySelector('[value="regulatory-reportability"]') as HTMLElement;
            if (tabTrigger) tabTrigger.click();
          }}
        >
          Conduct Assessment
        </Button>
      </div>
    );
  }

  const getReportabilityBadge = (decision: string) => {
    if (decision === 'Reportable') {
      return <Badge variant="destructive">Reportable</Badge>;
    } else if (decision === 'Not Reportable') {
      return <Badge variant="outline" className="border-green-600 text-green-600">Not Reportable</Badge>;
    } else {
      return <Badge variant="secondary">Undetermined</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Assessment Date</TableHead>
              <TableHead>Product Involved</TableHead>
              <TableHead>Incident Type</TableHead>
              <TableHead>Patient Harm</TableHead>
              <TableHead className="text-center">Decision</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell className="font-medium">
                  {format(new Date(assessment.createdAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  {assessment.productInvolved}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {assessment.isFieldAction && <Badge variant="outline" className="justify-start">Field Action</Badge>}
                    {assessment.isDeviceFailure && <Badge variant="outline" className="justify-start">Device Failure</Badge>}
                    {assessment.isAdverseEvent && <Badge variant="outline" className="justify-start">Adverse Event</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant={assessment.patientHarm === 'None' ? 'outline' : 
                                  assessment.patientHarm === 'Minor' ? 'secondary' : 
                                  assessment.patientHarm === 'Serious' ? 'default' : 'destructive'}
                        >
                          {assessment.patientHarm}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Patient harm level: {assessment.patientHarm}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-center">
                  {getReportabilityBadge(assessment.reportabilityDecision)}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/regulatory-reportability/details/${assessment.id}`, '_blank')}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default function RegulatoryReportabilityPage() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();

  // Get supplier information - use proper typing
  interface Supplier {
    id: number;
    name: string;
    supplierId: string;
    [key: string]: any; // Allow for other properties
  }
  
  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: [`/api/suppliers/${id}`],
    enabled: !!id,
    retry: 2,
    staleTime: 30000,
  });

  const handleBack = () => {
    navigateTo(`/supplier-management/detail/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Supplier
          </Button>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p>Loading supplier information...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateTo('/supplier-management')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Suppliers
          </Button>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p>Supplier not found. Please check the supplier ID and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Regulatory Reportability Assessment | {supplier?.name || 'Supplier'} | eQMS</title>
        <meta name="description" content={`Regulatory reportability assessment for ${supplier?.name || 'supplier'}. Determine if incidents involving this supplier's products require regulatory reporting.`} />
      </Helmet>
      
      <div className="container p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Supplier
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <PageHeader
            title={`${supplier?.name || 'Supplier'} - Regulatory Reportability`}
            description="Assess reportability of incidents involving supplier products"
          >
            <FileBarChart className="h-6 w-6 text-primary" />
          </PageHeader>
        </div>
        
        <Tabs defaultValue="regulatory-reportability" className="space-y-6">
          <TabsList>
            <TabsTrigger value="regulatory-reportability">
              Decision Tree Assessment
            </TabsTrigger>
            <TabsTrigger value="assessment-history">
              Assessment History
            </TabsTrigger>
          </TabsList>

          <Separator />
          
          <TabsContent value="regulatory-reportability">
            <RegulatoryReportabilityAssessment supplierId={Number(id)} />
          </TabsContent>
          
          <TabsContent value="assessment-history">
            <AssessmentHistoryView supplierId={Number(id)} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}