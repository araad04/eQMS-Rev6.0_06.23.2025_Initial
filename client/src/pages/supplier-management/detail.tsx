import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from "react-helmet";
import { ArrowLeft, Printer, FileEdit, FileBarChart, History, AlertTriangle, Calendar, Clock, Mail, Phone, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useToast } from '@/hooks/use-toast';
import { navigateTo } from '@/lib/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { mockSuppliers } from '@/__tests__/mocks/supplier-data';

/**
 * Supplier Detail View Page
 * - Displays detailed information about a sample supplier
 * - Shows qualification status, risk assessment, and compliance information
 * - Provides access to audit history and performance metrics
 * 
 * IEC 62304 Compliance:
 * - Implements REQ-SUPP-001: Supplier Information Management
 * - Implements REQ-SUPP-004: Supplier Audit Documentation
 * - Implements REQ-SUPP-006: Risk Management Documentation
 */
export default function SupplierDetailPage() {
  const { toast } = useToast();
  
  // For demonstration, we're using the first supplier in our mock data
  const supplierData = mockSuppliers[0];

  const getCriticalityBadge = (criticality: string) => {
    switch(criticality) {
      case 'Critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'Major':
        return <Badge variant="default">Major</Badge>;
      case 'Minor':
        return <Badge variant="secondary">Minor</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch(risk) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge variant="default">Medium</Badge>;
      case 'Low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'Pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
      case 'Disqualified':
        return <Badge variant="destructive">Disqualified</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">{score}%</Badge>;
    if (score >= 75) return <Badge variant="default">{score}%</Badge>;
    return <Badge variant="destructive">{score}%</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <>
      <Helmet>
        <title>{supplierData?.name || 'Supplier Details'} | eQMS</title>
        <meta 
          name="description" 
          content="View detailed supplier information including qualification status, risk assessment, and compliance data." 
        />
      </Helmet>

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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <PageHeader
              title={supplierData?.name || 'Supplier Details'}
              description={`Supplier ID: ${supplierData?.supplierId || 'Unknown'}`}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {supplierData?.criticality && getCriticalityBadge(supplierData.criticality)}
              {supplierData?.riskLevel && getRiskBadge(supplierData.riskLevel)}
              {supplierData?.status && getStatusBadge(supplierData.status)}
              {supplierData?.category && (
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                  {supplierData.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                toast({
                  title: "Generating PDF",
                  description: "Creating comprehensive supplier report..."
                });
                
                try {
                  // Import jsPDF dynamically
                  const { jsPDF } = await import('jspdf');
                  await import('jspdf-autotable');
                  
                  const pdf = new jsPDF();
                  let yPosition = 20;
                  
                  // Header
                  pdf.setFontSize(20);
                  pdf.setFont(undefined, 'bold');
                  pdf.text('Supplier Detail Report', 20, yPosition);
                  yPosition += 10;
                  
                  pdf.setFontSize(12);
                  pdf.setFont(undefined, 'normal');
                  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
                  yPosition += 20;
                  
                  // Overview Section
                  pdf.setFontSize(16);
                  pdf.setFont(undefined, 'bold');
                  pdf.text('Overview', 20, yPosition);
                  yPosition += 10;
                  
                  const overviewData = [
                    ['Supplier Name', supplierData?.name || 'N/A'],
                    ['Supplier ID', supplierData?.supplierId || 'N/A'],
                    ['Description', supplierData?.description || 'N/A'],
                    ['Address', `${supplierData?.address || ''}, ${supplierData?.city || ''}, ${supplierData?.state || ''} ${supplierData?.postalCode || ''}`],
                    ['Country', supplierData?.country || 'N/A'],
                    ['Contact Name', supplierData?.contactName || 'N/A'],
                    ['Contact Email', supplierData?.contactEmail || 'N/A'],
                    ['Contact Phone', supplierData?.contactPhone || 'N/A'],
                    ['Website', supplierData?.website || 'N/A']
                  ];
                  
                  pdf.autoTable({
                    startY: yPosition,
                    head: [['Field', 'Value']],
                    body: overviewData,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246] }
                  });
                  
                  yPosition = pdf.lastAutoTable.finalY + 20;
                  
                  // Quality & Compliance Section
                  pdf.setFontSize(16);
                  pdf.setFont(undefined, 'bold');
                  pdf.text('Quality & Compliance', 20, yPosition);
                  yPosition += 10;
                  
                  const complianceData = [
                    ['Status', supplierData?.status || 'N/A'],
                    ['Criticality', supplierData?.criticality || 'N/A'],
                    ['Risk Level', supplierData?.riskLevel || 'N/A'],
                    ['Performance Score', `${supplierData?.performanceScore || 'N/A'}%`],
                    ['Qualification Date', supplierData?.qualificationDate ? formatDate(supplierData.qualificationDate) : 'N/A'],
                    ['Requalification Date', supplierData?.requalificationDate ? formatDate(supplierData.requalificationDate) : 'N/A'],
                    ['Last Audit Date', supplierData?.lastAuditDate ? formatDate(supplierData.lastAuditDate) : 'N/A'],
                    ['Next Audit Date', supplierData?.nextAuditDate ? formatDate(supplierData.nextAuditDate) : 'N/A'],
                    ['Quality Agreement', supplierData?.hasQualityAgreement ? 'Yes' : 'No'],
                    ['NDA', supplierData?.hasNda ? 'Yes' : 'No']
                  ];
                  
                  pdf.autoTable({
                    startY: yPosition,
                    head: [['Field', 'Value']],
                    body: complianceData,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246] }
                  });
                  
                  yPosition = pdf.lastAutoTable.finalY + 20;
                  
                  // Products Section
                  if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                  }
                  
                  pdf.setFontSize(16);
                  pdf.setFont(undefined, 'bold');
                  pdf.text('Products', 20, yPosition);
                  yPosition += 10;
                  
                  if (supplierData?.productCategories && supplierData.productCategories.length > 0) {
                    const productData = supplierData.productCategories.map((category, index) => [
                      `Product ${index + 1}`,
                      category
                    ]);
                    
                    pdf.autoTable({
                      startY: yPosition,
                      head: [['Item', 'Category']],
                      body: productData,
                      theme: 'grid',
                      headStyles: { fillColor: [59, 130, 246] }
                    });
                    yPosition = pdf.lastAutoTable.finalY + 20;
                  } else {
                    pdf.setFontSize(12);
                    pdf.text('No product categories assigned', 20, yPosition);
                    yPosition += 20;
                  }
                  
                  // Audit History Section
                  if (yPosition > 220) {
                    pdf.addPage();
                    yPosition = 20;
                  }
                  
                  pdf.setFontSize(16);
                  pdf.setFont(undefined, 'bold');
                  pdf.text('Audit History', 20, yPosition);
                  yPosition += 10;
                  
                  if (supplierData?.auditHistory && supplierData.auditHistory.length > 0) {
                    const auditData = supplierData.auditHistory.map(audit => [
                      formatDate(audit.date),
                      audit.type,
                      `${audit.score}%`,
                      audit.auditor,
                      audit.status
                    ]);
                    
                    pdf.autoTable({
                      startY: yPosition,
                      head: [['Date', 'Type', 'Score', 'Auditor', 'Status']],
                      body: auditData,
                      theme: 'grid',
                      headStyles: { fillColor: [59, 130, 246] }
                    });
                  } else {
                    pdf.setFontSize(12);
                    pdf.text('No audit history available', 20, yPosition);
                  }
                  
                  // Save the PDF
                  pdf.save(`Supplier_${supplierData?.supplierId || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`);
                  
                  toast({
                    title: "PDF Generated Successfully",
                    description: "Supplier report with all sections has been downloaded"
                  });
                  
                } catch (error) {
                  console.error('PDF generation failed:', error);
                  toast({
                    title: "PDF Generation Failed",
                    description: "Please try again or use browser print",
                    variant: "destructive"
                  });
                }
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Use the first supplier from mock data for demonstration
                const supplierId = supplierData?.id || 1;
                
                toast({
                  title: "Navigating to Edit Page",
                  description: `Opening edit page for supplier ${supplierId}`
                });
                
                // Navigate to edit page with the supplier ID
                setTimeout(() => {
                  navigateTo(`/supplier-management/edit/${supplierId}`);
                }, 500);
              }}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {/* Smart Assessment Button - context-aware based on criticality */}
            <Button 
              variant={supplierData?.criticality === 'Critical' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => {
                const supplierId = supplierData?.id || 1;
                const assessmentType = supplierData?.criticality === 'Critical' ? 'Critical Assessment' : 'Standard Assessment';
                
                toast({
                  title: `Scheduling ${assessmentType}`,
                  description: `Creating new assessment for ${supplierData?.name}`
                });
                
                setTimeout(() => {
                  navigateTo(`/supplier-management/assessments/${supplierId}`);
                }, 500);
              }}
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              {supplierData?.criticality === 'Critical' ? 'Schedule Critical Assessment' : 'New Assessment'}
            </Button>

            {/* Quick Contact Email Action */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (supplierData?.contactEmail) {
                  window.open(`mailto:${supplierData.contactEmail}?subject=Supplier Quality Inquiry - ${supplierData.name}`);
                  toast({
                    title: "Email Opened",
                    description: `Opening email to ${supplierData.contactName}`
                  });
                } else {
                  toast({
                    title: "No Email Available",
                    description: "Please update contact information",
                    variant: "destructive"
                  });
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Contact
            </Button>

            {/* Regulatory Check */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Regulatory Assessment",
                  description: "Opening regulatory reportability assessment"
                });
                navigateTo(`/supplier-management/regulatory-reportability/${supplierData?.id}`);
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Regulatory Check
            </Button>

            {/* Smart Audit Scheduling */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const nextAuditType = supplierData?.criticality === 'Critical' ? 'Critical Supplier Audit' : 'Standard Audit';
                toast({
                  title: "Scheduling Audit",
                  description: `Creating ${nextAuditType} for ${supplierData?.name}`
                });
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Audit
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="compliance">Quality & Compliance</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="audit-history">Audit History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1">{supplierData?.description || 'No description available'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Performance Score</h3>
                    <div className="mt-1 flex items-center">
                      {supplierData?.performanceScore && getPerformanceBadge(supplierData.performanceScore)}
                      <span className="ml-2">{supplierData?.performanceScore || 'N/A'}%</span>
                    </div>
                  </div>
                  
                  <Separator className="md:col-span-2 my-2" />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1">
                      {supplierData?.address || 'No address available'}<br />
                      {supplierData?.city && `${supplierData.city}, `}
                      {supplierData?.state && `${supplierData.state} `}
                      {supplierData?.postalCode && supplierData.postalCode}<br />
                      {supplierData?.country || ''}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                    <p className="mt-1">
                      {supplierData?.contactName || 'No contact available'}<br />
                      {supplierData?.contactEmail || ''}<br />
                      {supplierData?.contactPhone || ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{supplierData?.notes || 'No additional notes available.'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Qualification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                    <div className="mt-1">
                      {supplierData?.status && getStatusBadge(supplierData.status)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Risk Level</h3>
                    <div className="mt-1">
                      {supplierData?.riskLevel && getRiskBadge(supplierData.riskLevel)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Qualification Date</h3>
                    <p className="mt-1">
                      {supplierData?.qualificationDate ? formatDate(supplierData.qualificationDate) : 'Not qualified yet'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Requalification Due</h3>
                    <p className="mt-1">
                      {supplierData?.requalificationDate ? formatDate(supplierData.requalificationDate) : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Audit</h3>
                    <p className="mt-1">
                      {supplierData?.lastAuditDate ? formatDate(supplierData.lastAuditDate) : 'No audit performed'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Next Audit</h3>
                    <p className="mt-1">
                      {supplierData?.nextAuditDate ? formatDate(supplierData.nextAuditDate) : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={`${supplierData?.criticality === 'Critical' ? 'border-red-500' : 'border-amber-500'} mb-4`}>
                  <AlertTitle className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {supplierData?.criticality === 'Critical' ? 'Critical Supplier Alert' : 'Supplier Risk Information'}
                  </AlertTitle>
                  <AlertDescription>
                    {supplierData?.criticality === 'Critical' 
                      ? 'This supplier provides components that directly impact product safety and efficacy. Enhanced monitoring required per ISO 13485:2016 section 7.4.1.'
                      : 'Standard supplier monitoring procedures apply. Review audit schedule according to risk assessment.'}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Criticality Classification</h3>
                    <div className="mt-1 flex items-center">
                      {supplierData?.criticality && getCriticalityBadge(supplierData.criticality)}
                      <span className="ml-2">{supplierData?.criticality || 'Unknown'}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {supplierData?.criticality === 'Critical' 
                        ? 'Supplies components or services that directly impact product safety or efficacy' 
                        : supplierData?.criticality === 'Major'
                          ? 'Supplies components or services with indirect impact on product performance'
                          : 'Supplies components or services with minimal impact on final product'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Audit Frequency</h3>
                    <p className="mt-1">
                      {supplierData?.criticality === 'Critical' 
                        ? 'Every 60 days' 
                        : supplierData?.criticality === 'Major' && supplierData?.riskLevel === 'High'
                          ? 'Every 90 days'
                          : 'Annual'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplierData?.productCategories && supplierData.productCategories.length > 0 ? (
                    supplierData.productCategories.map((category, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-primary mr-2"></div>
                        <span>{category}</span>
                      </div>
                    ))
                  ) : (
                    <p>No product categories assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit-history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit History</CardTitle>
              </CardHeader>
              <CardContent>
                {supplierData?.auditHistory && supplierData.auditHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Auditor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierData.auditHistory.map((audit, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(audit.date)}</TableCell>
                          <TableCell>{audit.type}</TableCell>
                          <TableCell>{getPerformanceBadge(audit.score)}</TableCell>
                          <TableCell>{audit.auditor}</TableCell>
                          <TableCell>{getStatusBadge(audit.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-2 text-gray-500">No audit history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}