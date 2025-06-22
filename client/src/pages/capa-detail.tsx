import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Clipboard, 
  AlertCircle, 
  Calendar, 
  User, 
  Tag, 
  FileText,
  ChevronRight,
  SquarePen,
  CheckCircle2,
  Pencil,
  Printer,
  FileOutput
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';

// Import the CAPA workflow components
import { CapaWorkflowStatus } from '@/components/capa/workflow-status';
import { PhaseFormSelector } from '@/components/capa/phase-forms';
import { EnhancedCapaWorkflow } from '@/components/capa/enhanced-workflow';
import { IntegratedCapaWorkflow } from '@/components/capa/integrated-workflow';

// Define the CAPA type
type CAPA = {
  id: number;
  capaId: string;
  title: string;
  description: string;
  source: string;
  capaType: string;
  riskPriority: string;
  patientSafetyImpact: boolean;
  productPerformanceImpact: boolean;
  complianceImpact: boolean;
  initiatedBy: number;
  assignedTo: number | null;
  dueDate: string | null;
  closedDate: string | null;
  createdAt: string;
  updatedAt: string;
  workflow?: {
    id: number;
    currentState: 'CORRECTION' | 'ROOT_CAUSE_ANALYSIS' | 'CORRECTIVE_ACTION' | 'EFFECTIVENESS_VERIFICATION';
    assignedTo: number;
  };
  initiatedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedToUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function CapaDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const [activeTab, setActiveTab] = useState('overview');
  const [isPhaseFormOpen, setIsPhaseFormOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Query to fetch CAPA details
  const { 
    data: capa, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/capas', id],
    queryFn: async () => {
      const response = await fetch(`/api/capas/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch CAPA details');
      }
      return response.json();
    }
  });

  // Function to handle workflow state change
  const handleWorkflowStateChange = () => {
    // Refetch the CAPA data to get the latest workflow state
    refetch();
  };

  // Function to handle phase form submission
  const handlePhaseFormSuccess = () => {
    setIsPhaseFormOpen(false);
    // Optionally refetch data if needed
    refetch();
  };

  // Print functionality
  const handlePrint = () => {
    toast({
      title: "Print initiated",
      description: "Preparing print view for CAPA record.",
    });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Comprehensive PDF Export with all tabs
  const handleExportPDF = async () => {
    if (!printRef.current || !capa) return;

    try {
      toast({
        title: "Preparing PDF...",
        description: "Generating comprehensive CAPA PDF with all sections"
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const tabs = ['overview', 'workflow', 'documentation', 'history'];
      const tabNames = ['Overview', 'Workflow', 'Documentation', 'History'];
      
      // Store original tab state
      const originalTab = activeTab;
      
      for (let i = 0; i < tabs.length; i++) {
        const tabId = tabs[i];
        const tabName = tabNames[i];
        
        // Switch to the tab and wait for render
        setActiveTab(tabId);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Try to capture the entire container instead of specific tab content
        let targetElement = printRef.current;
        
        if (targetElement) {
          const canvas = await html2canvas(targetElement, {
            height: Math.min(targetElement.scrollHeight, 4000),
            width: targetElement.scrollWidth,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            scale: 0.8
          });
          
          const imgData = canvas.toDataURL('image/png', 0.9);
          
          // Add new page if not the first tab
          if (i > 0) {
            pdf.addPage();
          }
          
          // Add header with CAPA info
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`CAPA ${capa.capaId}: ${capa.title}`, 10, 15);
          
          // Add tab section title
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Section ${i + 1}: ${tabName}`, 10, 25);
          
          // Calculate dimensions to fit the page
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Scale to fit within page margins
          const maxWidth = pdfWidth - 20;
          const maxHeight = pdfHeight - 45;
          
          const scaleX = maxWidth / (imgWidth * 0.264583);
          const scaleY = maxHeight / (imgHeight * 0.264583);
          const scale = Math.min(scaleX, scaleY);
          
          const finalWidth = imgWidth * 0.264583 * scale;
          const finalHeight = imgHeight * 0.264583 * scale;
          
          const x = 10;
          const y = 30;
          
          // Add the image
          pdf.addImage(imgData, 'PNG', x, y, finalWidth, Math.min(finalHeight, maxHeight));
        }
      }
      
      // Restore original tab
      setActiveTab(originalTab);
      
      // Generate timestamp for filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`CAPA-${capa.capaId}-Complete-${timestamp}.pdf`);
      
      toast({
        title: "PDF exported successfully",
        description: `CAPA ${capa.capaId} exported with all ${tabs.length} sections`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error generating PDF",
        description: "Please try again or contact support if the issue persists"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setLocation('/capa-management')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !capa) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setLocation('/capa-management')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold">CAPA Details</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load CAPA details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get the severity badge color
  const getSeverityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
      <Helmet>
        <title>{capa.capaId} - {capa.title} | eQMS</title>
        <meta name="description" content={`Details for CAPA ${capa.capaId}: ${capa.title}`} />
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6" ref={printRef}>
        {/* Header with back button and CAPA ID */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={() => setLocation('/capa-management')}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to CAPA List</span>
            </Button>
            <h1 className="text-2xl font-bold flex items-center">
              <span className="mr-2">{capa.capaId}</span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <span>{capa.title}</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={`${getSeverityColor(capa.riskPriority || 'medium')} px-3 py-1 text-xs font-medium border`}>
              {(capa.riskPriority || 'medium').toUpperCase()} Priority
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs">
              {capa.capaType ? `${capa.capaType.charAt(0).toUpperCase()}${capa.capaType.slice(1)}` : 'Unknown'} Action
            </Badge>
            
            {/* Print and Export Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="flex items-center space-x-2"
              >
                <FileOutput className="h-4 w-4" />
                <span>Export PDF</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* CAPA Content with tabs */}
        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-4 w-full md:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main CAPA information */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>CAPA Details</CardTitle>
                  <CardDescription>Details and description of this CAPA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 whitespace-pre-line">{capa.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Source</h3>
                      <p className="mt-1">{capa.source ? `${capa.source.charAt(0).toUpperCase()}${capa.source.slice(1)}` : 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Type</h3>
                      <p className="mt-1">{capa.capaType ? `${capa.capaType.charAt(0).toUpperCase()}${capa.capaType.slice(1)}` : 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created On</h3>
                      <p className="mt-1">{formatDate(capa.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                      <p className="mt-1">{formatDate(capa.dueDate)}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Risk Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${capa.patientSafetyImpact ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <span>Patient Safety</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${capa.productPerformanceImpact ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                        <span>Product Performance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${capa.complianceImpact ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <span>Compliance</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Sidebar with assignment and status info */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment</CardTitle>
                  <CardDescription>Assignment and status information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Initiated By</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="h-5 w-5 text-gray-400" />
                      <span>{capa.initiatedByUser ? `${capa.initiatedByUser.firstName} ${capa.initiatedByUser.lastName}` : 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="h-5 w-5 text-gray-400" />
                      <span>{capa.assignedToUser ? `${capa.assignedToUser.firstName} ${capa.assignedToUser.lastName}` : 'Unassigned'}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span>{formatDate(capa.dueDate)}</span>
                    </div>
                  </div>
                  
                  {capa.closedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Closed Date</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>{formatDate(capa.closedDate)}</span>
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation(`/capa-management/edit/${capa.id}`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit CAPA
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick workflow status card */}
            {capa.workflow && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Current Workflow Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-3 mb-4 md:mb-0">
                      <Badge 
                        className="bg-primary text-white py-1 px-3"
                        variant="outline"
                      >
                        {capa.workflow && capa.workflow.currentState ? 
                          capa.workflow.currentState.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') :
                          'Not Started'}
                      </Badge>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('workflow')}
                      >
                        View Workflow Details
                      </Button>
                      <Dialog open={isPhaseFormOpen} onOpenChange={setIsPhaseFormOpen}>
                        <DialogTrigger asChild>
                          <Button>Update Current Phase</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Update {capa.workflow && capa.workflow.currentState ? 
                                capa.workflow.currentState.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 
                                'Current'} Phase
                            </DialogTitle>
                            <DialogDescription>
                              Complete the required information for this phase of the CAPA process
                            </DialogDescription>
                          </DialogHeader>
                          
                          <PhaseFormSelector 
                            capaId={capa.id} 
                            currentPhase={capa.workflow.currentState} 
                            onSuccess={handlePhaseFormSuccess}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Enhanced 5-Phase Regulatory-Compliant Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <IntegratedCapaWorkflow 
              capaId={capa.id} 
              onStateChange={handleWorkflowStateChange}
            />
          </TabsContent>
          

          
          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Related Documents</CardTitle>
                <CardDescription>Documents related to this CAPA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium">No documents attached</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no documents attached to this CAPA yet
                  </p>
                  <Button variant="outline" className="mt-4">
                    Attach Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CAPA History</CardTitle>
                <CardDescription>Audit trail of changes to this CAPA</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[9px] mt-1.5 w-4 h-4 rounded-full bg-primary"></div>
                      <div className="mb-1 text-sm font-medium">CAPA Created</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(capa.createdAt)} by {capa.initiatedByUser ? `${capa.initiatedByUser.firstName} ${capa.initiatedByUser.lastName}` : 'Unknown'}
                      </div>
                      <div className="mt-2 text-sm">Initial CAPA created with ID {capa.capaId}</div>
                    </div>
                    
                    {capa.workflow && (
                      <div className="relative">
                        <div className="absolute -left-[9px] mt-1.5 w-4 h-4 rounded-full bg-primary"></div>
                        <div className="mb-1 text-sm font-medium">Workflow Started</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(capa.workflow.createdAt || capa.createdAt)}
                        </div>
                        <div className="mt-2 text-sm">CAPA workflow initialized in {capa.workflow && capa.workflow.currentState ? 
                          capa.workflow.currentState.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 
                          'initial'} state</div>
                      </div>
                    )}
                    
                    {/* Additional history entries would be shown here */}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}