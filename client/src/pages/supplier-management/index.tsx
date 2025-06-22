import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from "react-helmet";
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ExportDialog } from '@/components/supplier-management/export-dialog';
import { CriticalSuppliersExport } from '@/components/supplier-management/critical-suppliers-export';
import { RequalificationDemo } from '@/components/supplier-management/requalification-demo';


/**
 * Supplier Management Page
 * - Displays a list of suppliers with filtering capabilities
 * - Shows key supplier information (ID, name, status, etc.)
 * - Provides metrics and critical supplier identification
 * 
 * IEC 62304 Compliance:
 * - Implements REQ-SUPP-001: Supplier Information Management
 * - Implements REQ-SUPP-003: Critical Supplier Identification
 * - Implements REQ-SUPP-005: Supplier Performance Monitoring
 */
export default function SupplierManagementPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch suppliers from API
  const { data: suppliers = mockSuppliers, isLoading } = useQuery({
    queryKey: ['/api/suppliers'],
    // For testing purposes, we're using mock data
    // In production, this would be a real API call
  });

  // Define the supplier type for type safety
  type Supplier = {
    id: number;
    supplierId: string;
    name: string;
    category: string;
    criticality: string;
    status: string;
    riskLevel: string;
    performanceScore: number;
    [key: string]: any; // Allow other properties
  };

  // Filter suppliers based on search term and active tab
  const typedSuppliers = suppliers as Supplier[];
  const filteredSuppliers = typedSuppliers.filter((supplier) => {
    const matchesSearch = 
      searchTerm === '' || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.category && supplier.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'critical' && supplier.criticality === 'Critical') ||
      (activeTab === 'pending' && supplier.status === 'Pending') ||
      (activeTab === 'approved' && supplier.status === 'Approved');
    
    return matchesSearch && matchesTab;
  });

  // Calculate metrics
  const criticalCount = typedSuppliers.filter(s => s.criticality === 'Critical').length;
  const approvedCount = typedSuppliers.filter(s => s.status === 'Approved').length;
  const highRiskCount = typedSuppliers.filter(s => s.riskLevel === 'High').length;

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

  return (
    <>
      <Helmet>
        <title>Supplier Management | eQMS</title>
        <meta 
          name="description" 
          content="Manage and monitor suppliers for ISO 13485 and regulatory compliance." 
        />
      </Helmet>

      <div className="container p-6">
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title="Supplier Management"
            description="Monitor and manage suppliers for regulatory compliance"
          />
          <div className="flex gap-2">
            <CriticalSuppliersExport />
            <ExportDialog suppliers={suppliers || []}>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
            </ExportDialog>
            <Button onClick={() => navigateTo('/supplier-management/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Supplier
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                  <p className="text-xs text-muted-foreground">Requiring enhanced monitoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-xs text-muted-foreground">Qualified and approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Risk Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{highRiskCount}</p>
                  <p className="text-xs text-muted-foreground">Requiring risk mitigation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtering Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex-1"
          >
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="demo">Demo Data</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        {activeTab === 'calculator' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Requalification Date Calculator</CardTitle>
                <CardDescription>
                  Test the automatic date calculation based on supplier criticality levels (Critical: 1 year, Major: 2 years, Minor: 4 years)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequalificationDemo />
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'demo' ? (
          <div className="space-y-6">
            <DemoDataCreator />
          </div>
        ) : (
          /* Suppliers Table */
          isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Criticality</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier: any) => (
                      <TableRow key={supplier.id}>
                        <TableCell>{supplier.supplierId}</TableCell>
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell>{supplier.category}</TableCell>
                        <TableCell>{getCriticalityBadge(supplier.criticality)}</TableCell>
                        <TableCell>{getRiskBadge(supplier.riskLevel)}</TableCell>
                        <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                        <TableCell>{getPerformanceBadge(supplier.performanceScore)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log(`Navigating to supplier detail page`);
                              // We'll use the detail page directly for now
                              navigateTo(`/supplier-management/detail`);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </>
  );
}