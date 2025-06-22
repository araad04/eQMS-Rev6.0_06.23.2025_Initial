import { useState, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import {
  AlertCircleIcon,
  ArrowLeft,
  Clock,
  Clipboard,
  Building2,
  Calendar,
  FileText,
  Check,
  X,
  Edit,
  Download,
  PlusCircle,
  Loader2,
  Printer,
  FileOutput
} from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Audit, AuditChecklistItem, SupplierCorrectiveRequest } from "@shared/schema";

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  
  // Fetch audit details with better error handling
  const { 
    data: audit, 
    isLoading: isLoadingAudit, 
    error: auditError 
  } = useQuery<Audit>({
    queryKey: ["/api/audits", parseInt(id)],
    queryFn: async () => {
      try {
        console.log(`Fetching audit details for ID: ${id}`);
        const response = await fetch(`/api/audits/${id}`);
        
        if (!response.ok) {
          console.error(`Server responded with status: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch audit: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully retrieved audit data:`, data);
        return data;
      } catch (error) {
        console.error(`Error fetching audit details:`, error);
        throw error;
      }
    },
    retry: 2,  // Retry failed requests twice
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Fetch audit checklist items
  const { 
    data: checklistItems = [], 
    isLoading: isLoadingChecklist,
  } = useQuery<AuditChecklistItem[]>({
    queryKey: ["/api/audits", parseInt(id), "checklist"],
    queryFn: async () => {
      const response = await fetch(`/api/audits/${id}/checklist`);
      if (!response.ok) {
        throw new Error(`Failed to fetch checklist: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!audit,
  });

  // Fetch supplier corrective requests if it's a supplier audit
  const { 
    data: scrItems = [], 
    isLoading: isLoadingScr,
  } = useQuery<SupplierCorrectiveRequest[]>({
    queryKey: ["/api/scr", parseInt(id)],
    queryFn: async () => {
      const response = await fetch(`/api/scr?auditId=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch SCRs: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!audit && audit.typeId === 2, // Only for supplier audits
  });

  // Export audit report function
  const exportAuditReport = () => {
    if (!audit) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Report - ${audit.auditId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .audit-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .audit-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-row { margin-bottom: 8px; }
            .label { font-weight: bold; color: #555; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="audit-title">Internal Audit Report</div>
            <div class="audit-info">
              <div class="info-row"><span class="label">Audit ID:</span> ${audit.auditId}</div>
              <div class="info-row"><span class="label">Title:</span> ${audit.title}</div>
              <div class="info-row"><span class="label">Lead Auditor:</span> ${audit.leadAuditorName}</div>
              <div class="info-row"><span class="label">Location:</span> ${audit.auditLocation}</div>
              <div class="info-row"><span class="label">Generated:</span> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Audit Overview</div>
            <div class="info-row"><span class="label">Scope:</span> ${audit.scope}</div>
            <div class="info-row"><span class="label">Description:</span> ${audit.description || 'N/A'}</div>
            <div class="info-row"><span class="label">Start Date:</span> ${new Date(audit.startDate).toLocaleDateString()}</div>
            <div class="info-row"><span class="label">Status:</span> ${getStatusLabel(audit.statusId)}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Audit Details</div>
            <div class="info-row"><span class="label">Created:</span> ${new Date(audit.createdAt).toLocaleDateString()}</div>
            <div class="info-row"><span class="label">Last Updated:</span> ${new Date(audit.updatedAt).toLocaleDateString()}</div>
            ${audit.standardReference ? `<div class="info-row"><span class="label">Standards:</span> ${audit.standardReference}</div>` : ''}
          </div>
          
          <div class="footer">
            <p>Generated by eQMS Internal Audit System</p>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
    
    toast({
      title: "Audit Report Generated! 📄",
      description: "Report opened in new window for printing or saving as PDF.",
      variant: "default",
    });
  };

  const getStatusLabel = (statusId: number) => {
    const statusMap: { [key: number]: string } = {
      1: "Planning",
      2: "Scheduled", 
      3: "In Progress",
      4: "Completed",
      5: "Closed"
    };
    return statusMap[statusId] || "Unknown";
  };

  // Update audit status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (statusId: number) => {
      const response = await apiRequest("PATCH", `/api/audits/${id}`, { statusId });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the audit query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["/api/audits", parseInt(id)] });
      
      toast({
        title: "Status Updated",
        description: "The audit status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update audit status.",
        variant: "destructive",
      });
    },
  });

  // Format a date string
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get human readable status name
  const getStatusName = (statusId: number) => {
    switch (statusId) {
      case 1: return "Planning";
      case 2: return "Scheduled";
      case 3: return "In Progress";
      case 4: return "Completed & Closed";
      case 5: return "Completed & Closed";
      default: return "Unknown";
    }
  };
  
  // Get status badge styling
  const getStatusBadgeClass = (statusId: number) => {
    switch (statusId) {
      case 1: return "bg-gray-100 text-gray-800";
      case 2: return "bg-blue-100 text-blue-800";
      case 3: return "bg-yellow-100 text-yellow-800";
      case 4: return "bg-green-100 text-green-800";
      case 5: return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: string) => {
    updateStatusMutation.mutate(parseInt(newStatus));
  };

  // Print function for browser printing
  const handlePrint = () => {
    window.print();
  };

  // Comprehensive PDF export function for all tabs
  const handleExportPDF = async () => {
    if (!audit) return;
    
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      
      // Store original tab state
      const originalTab = activeTab;
      
      // Add header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Internal Audit Report', margin, 30);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Audit ID: ${audit.auditId}`, margin, 45);
      pdf.text(`Title: ${audit.title}`, margin, 55);
      pdf.text(`Lead Auditor: ${audit.leadAuditorName}`, margin, 65);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 75);
      
      let yPosition = 90;
      
      // Function to add new page if needed
      const checkAndAddPage = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
      };
      
      // Tab 1: Overview
      checkAndAddPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OVERVIEW', margin, yPosition);
      yPosition += 20;
      
      // Switch to overview tab and capture
      setActiveTab('overview');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const overviewElement = document.querySelector('[data-state="active"][data-value="overview"]') || 
                             document.querySelector('div[role="tabpanel"]:not([hidden])') ||
                             document.querySelector('.space-y-4');
      
      if (overviewElement) {
        try {
          const canvas = await html2canvas(overviewElement as HTMLElement, {
            scale: 0.8,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          checkAndAddPage(imgHeight);
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
        } catch (error) {
          console.warn('Could not capture overview tab:', error);
        }
      }
      
      // Tab 2: Checklist
      checkAndAddPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CHECKLIST', margin, yPosition);
      yPosition += 20;
      
      // Switch to checklist tab and capture
      setActiveTab('checklist');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const checklistElement = document.querySelector('[data-state="active"][data-value="checklist"]') || 
                              document.querySelector('div[role="tabpanel"]:not([hidden])') ||
                              document.querySelector('.checklist-container');
      
      if (checklistElement) {
        try {
          const canvas = await html2canvas(checklistElement as HTMLElement, {
            scale: 0.8,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          checkAndAddPage(imgHeight);
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
        } catch (error) {
          console.warn('Could not capture checklist tab:', error);
        }
      }
      
      // Tab 3: Findings
      checkAndAddPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FINDINGS', margin, yPosition);
      yPosition += 20;
      
      // Switch to findings tab and capture
      setActiveTab('findings');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const findingsElement = document.querySelector('[data-state="active"][data-value="findings"]') || 
                             document.querySelector('div[role="tabpanel"]:not([hidden])') ||
                             document.querySelector('.findings-container');
      
      if (findingsElement) {
        try {
          const canvas = await html2canvas(findingsElement as HTMLElement, {
            scale: 0.8,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          checkAndAddPage(imgHeight);
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
        } catch (error) {
          console.warn('Could not capture findings tab:', error);
        }
      }
      
      // Add footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Medical Device eQMS - Audit Report - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `Audit_Report_${audit.auditId}_${timestamp}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
      // Restore original tab
      setActiveTab(originalTab);
      
      toast({
        title: "PDF Export Successful",
        description: `Audit report exported as ${filename}`,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingAudit) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (auditError || !audit) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center">
          <Button onClick={() => navigate("/audit-management")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audits
          </Button>
          <h1 className="ml-4 text-2xl font-bold">Audit Details</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Audit</CardTitle>
            <CardDescription>
              We encountered a problem retrieving the audit details
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <div className="h-4 w-4 text-destructive">
                <AlertCircleIcon />
              </div>
              <AlertTitle>Failed to load audit details</AlertTitle>
              <AlertDescription>
                {auditError instanceof Error 
                  ? auditError.message 
                  : "Unable to retrieve audit information. Please try again later."}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Troubleshooting Options:</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Verify that the audit ID exists in the system</li>
                  <li>Check your network connection</li>
                  <li>Contact your system administrator if the problem persists</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">Reference: AUD005</div>
                <div className="space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                  <Button 
                    onClick={() => navigate("/audit-management")}
                  >
                    Return to Audit List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSupplierAudit = audit.typeId === 2;
  const nonCompliantItems = checklistItems.filter(item => !item.isCompliant).length;
  const totalItems = checklistItems.length;
  const hasScrItems = scrItems.length > 0;

  return (
    <>
      <Helmet>
        <title>{audit.title} | Audit Details | Medical Device eQMS</title>
        <meta name="description" content={`Details for audit: ${audit.title}`} />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <PageHeader
          title={audit.title}
          description={`${isSupplierAudit ? "Supplier" : "Internal"} Audit Details`}
          className="gradient-header mb-6"
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/audit-management")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Audits
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileOutput className="mr-2 h-4 w-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </PageHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Audit Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Audit Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-3">
                  <div>
                    <span className="font-medium">Current Status:</span>
                    <div className="mt-1">
                      <Badge className={`px-3 py-1 text-sm ${getStatusBadgeClass(audit.statusId)}`}>
                        {getStatusName(audit.statusId)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Update Status:</span>
                    <Select
                      disabled={updateStatusMutation.isPending}
                      onValueChange={handleStatusUpdate}
                      value={audit.statusId.toString()}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Planning</SelectItem>
                        <SelectItem value="2">Scheduled</SelectItem>
                        <SelectItem value="3">In Progress</SelectItem>
                        <SelectItem value="4">Completed & Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Audit Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Audit Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">{formatDate(audit.scheduledDate ?? audit.startDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{audit.duration ? `${audit.duration} days` : "Not specified"}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isSupplierAudit ? "Supplier" : "Department"}
                    </p>
                    <p className="font-medium">
                      {isSupplierAudit ? (audit.supplierName || "Not specified") : (audit.departmentName || "Not specified")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Auditor</p>
                    <p className="font-medium">{audit.leadAuditorName || "Not assigned"}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/audit-edit/${audit.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Audit
                </Button>
              </CardFooter>
            </Card>
            
            {/* Audit Statistics Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Audit Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clipboard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Checklist Items</p>
                    <p className="font-medium">{totalItems || "No items"}</p>
                  </div>
                </div>
                
                {totalItems > 0 && (
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Non-Compliant Items</p>
                      <p className="font-medium">{nonCompliantItems}</p>
                    </div>
                  </div>
                )}
                
                {isSupplierAudit && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Supplier Corrective Requests</p>
                      <p className="font-medium">{scrItems.length || "None"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2" ref={printAreaRef}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                {isSupplierAudit && (
                  <TabsTrigger value="scr">
                    SCRs {hasScrItems && <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">{scrItems.length}</span>}
                  </TabsTrigger>
                )}
                <TabsTrigger value="findings">Findings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-0" data-tab="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Overview</CardTitle>
                    <CardDescription>
                      Created on {formatDate(audit.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-md font-medium mb-2">Description</h3>
                      <p className="text-muted-foreground">{audit.description || "No description provided."}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium mb-2">Scope</h3>
                      <p className="text-muted-foreground">{audit.scope || "No scope defined."}</p>
                    </div>
                    
                    {audit.standardReference && (
                      <div>
                        <h3 className="text-md font-medium mb-2">Standard References</h3>
                        <p className="text-muted-foreground">{audit.standardReference}</p>
                      </div>
                    )}
                    
                    {audit.summary && (
                      <div>
                        <h3 className="text-md font-medium mb-2">Audit Summary</h3>
                        <p className="text-muted-foreground">{audit.summary}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    {audit.statusId < 3 && (
                      <Button variant="default" onClick={() => updateStatusMutation.mutate(3)}>
                        Begin Audit
                      </Button>
                    )}
                    
                    {audit.statusId === 3 && (
                      <Button variant="default" onClick={() => updateStatusMutation.mutate(4)}>
                        Complete Audit
                      </Button>
                    )}
                    
                    <Button variant="outline" onClick={exportAuditReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Audit Report
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="checklist" className="mt-0" data-tab="checklist">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Audit Checklist</CardTitle>
                        <CardDescription>
                          Items to be verified during the audit
                        </CardDescription>
                      </div>
                      <Button onClick={() => navigate(`/audit-checklist-create/${audit.id}`)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Items
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingChecklist ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : checklistItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No checklist items added yet.</p>
                        <p className="mt-2">Click "Add Items" to create a new checklist for this audit.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {checklistItems.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <div className="flex items-start p-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{item.requirement}</h4>
                                  {item.isCompliant !== null && (
                                    <Badge className={item.isCompliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                      {item.isCompliant ? "Compliant" : "Non-Compliant"}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {item.referenceClause}
                                </p>
                                {item.comments && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium">Comments: </span>
                                    {item.comments}
                                  </div>
                                )}
                                {!item.isCompliant && item.evidence && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium">Evidence: </span>
                                    {item.evidence}
                                  </div>
                                )}
                              </div>
                              <div className="flex shrink-0 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/audit-checklist-item/${item.id}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {isSupplierAudit && (
                <TabsContent value="scr" className="mt-0">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Supplier Corrective Requests</CardTitle>
                          <CardDescription>
                            Corrective actions requested from the supplier
                          </CardDescription>
                        </div>
                        <Button onClick={() => navigate(`/scr-create/${audit.id}`)}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create SCR
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingScr ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : scrItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No supplier corrective requests created yet.</p>
                          <p className="mt-2">Click "Create SCR" to request corrective action from the supplier.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {scrItems.map((scr) => (
                            <Card key={scr.id} className="overflow-hidden">
                              <div className="p-4">
                                <div className="flex justify-between mb-2">
                                  <h4 className="font-medium">{scr.title}</h4>
                                  <Badge className={
                                    scr.statusId === 1 ? "bg-blue-100 text-blue-800" :
                                    scr.statusId === 2 ? "bg-yellow-100 text-yellow-800" :
                                    scr.statusId === 3 ? "bg-green-100 text-green-800" :
                                    "bg-gray-100 text-gray-800"
                                  }>
                                    {scr.statusId === 1 ? "Open" :
                                     scr.statusId === 2 ? "In Progress" :
                                     scr.statusId === 3 ? "Closed" : "Unknown"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {scr.description}
                                </p>
                                <div className="text-xs text-muted-foreground flex items-center justify-between mt-2">
                                  <span>SCR #{scr.scrId}</span>
                                  <span>Due: {formatDate(scr.dueDate)}</span>
                                </div>
                                <div className="mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => navigate(`/scr-detail/${scr.id}`)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              <TabsContent value="findings" className="mt-0" data-tab="findings">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Audit Findings</CardTitle>
                        <CardDescription>
                          Non-conformities and observations identified during the audit
                        </CardDescription>
                      </div>
                      <Button disabled={audit.statusId < 3}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Finding
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No findings have been added yet.</p>
                      {audit.statusId < 3 ? (
                        <p className="mt-2">Findings can be added once the audit is in progress.</p>
                      ) : (
                        <p className="mt-2">Click "Add Finding" to record a non-conformity or observation.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}