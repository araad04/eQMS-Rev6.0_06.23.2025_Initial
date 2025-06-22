import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from "react-helmet";
import { ArrowLeft, Printer, FileEdit, FileBarChart, History, AlertTriangle, Calendar, Clock, Mail, Phone, FileText, CheckCircle } from 'lucide-react';
import { useParams } from 'wouter';
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
import PageHeader from '@/components/page-header';
import { mockSuppliers } from '@/__tests__/mocks/supplier-data';

/**
 * Supplier Detail View Page
 * - Displays detailed information about a specific supplier
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
  const params = useParams();
  const supplierId = params.id;

  console.log("Supplier ID from params:", supplierId);

  // For testing, use mock data directly
  const supplierData = mockSuppliers.find(s => s.id.toString() === supplierId) || null;

  console.log("Supplier data:", supplierData);

  // If no supplier is found with the provided ID
  if (!supplierData) {
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
        
        <Alert variant="destructive" className="my-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Supplier Not Found</AlertTitle>
          <AlertDescription>
            The supplier you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
            {/* Quick Action Buttons - Context-aware actions */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Print Package Generated",
                  description: "Supplier information package ready for printing"
                });
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Package
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Editing Supplier",
                  description: `Opening edit form for ${supplierData?.name}`
                });
                navigateTo(`/supplier-management/edit/${supplierData?.id}`);
              }}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>

            {/* Smart Assessment Button - shows next required action */}
            <Button 
              variant={supplierData?.criticality === 'Critical' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => {
                const assessmentType = supplierData?.criticality === 'Critical' ? 'Critical Assessment' : 'Standard Assessment';
                toast({
                  title: `Scheduling ${assessmentType}`,
                  description: `Creating new assessment for ${supplierData?.name}`
                });
                navigateTo(`/supplier-management/assessments/${supplierData?.id}`);
              }}
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              {supplierData?.criticality === 'Critical' ? 'Schedule Critical Assessment' : 'New Assessment'}
            </Button>

            {/* Quick Contact Actions */}
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

            {/* Regulatory Reportability - Enhanced with context */}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Supplier Information</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (supplierData?.contactPhone) {
                        window.open(`tel:${supplierData.contactPhone}`);
                        toast({
                          title: "Calling Supplier",
                          description: `Dialing ${supplierData.contactName}`
                        });
                      }
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Copying Contact Info",
                        description: "Contact information copied to clipboard"
                      });
                      const contactInfo = `${supplierData?.contactName}\n${supplierData?.contactEmail}\n${supplierData?.contactPhone}`;
                      navigator.clipboard.writeText(contactInfo);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
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