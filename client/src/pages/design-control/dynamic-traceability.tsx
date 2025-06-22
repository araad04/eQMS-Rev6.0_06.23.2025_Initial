
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  GitBranch, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  BarChart3,
  Network,
  ArrowRight,
  Eye,
  FileText,
  Target,
  TestTube,
  Shield,
  Link,
  Plus,
  Trash2
} from "lucide-react";

interface TraceabilityItem {
  id: string;
  identifier: string;
  title: string;
  type: 'urs_requirement' | 'user_need' | 'design_input' | 'design_output' | 'verification' | 'validation' | 'test_case' | 'risk_control';
  status: string;
  priority?: string;
  riskLevel?: string;
  linkedItems: string[];
  sourceModule: string;
  moduleRoute: string;
  lastModified: string;
  owner?: string;
  description?: string;
  completionPercentage?: number;
  complianceContext?: string;
  regulatoryRequirement?: boolean;
}

interface TraceabilityLink {
  id: string;
  linkId: string;
  sourceType: string;
  sourceIdentifier: string;
  targetType: string;
  targetIdentifier: string;
  linkType: 'derives' | 'implements' | 'verifies' | 'validates' | 'controls' | 'satisfies';
  traceabilityStrength: 'direct' | 'indirect' | 'partial';
  isActive: boolean;
  verificationStatus?: 'verified' | 'pending' | 'failed';
  lastVerified?: string;
  verificationMethod?: string;
}

interface TraceabilityMatrix {
  items: TraceabilityItem[];
  links: TraceabilityLink[];
  coverage: {
    totalRequirements: number;
    linkedRequirements: number;
    coveragePercentage: number;
    missingLinks: number;
    partialLinks: number;
    directLinks: number;
    indirectLinks: number;
  };
}

export default function ComprehensiveTraceabilityMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("matrix");
  const [selectedItem, setSelectedItem] = useState<TraceabilityItem | null>(null);

  // Fetch comprehensive traceability data
  const { data: ursRequirements = [], isLoading: ursLoading } = useQuery({
    queryKey: ['/api/design-control/urs-requirements'],
  });

  const { data: userRequirements = [], isLoading: urLoading } = useQuery({
    queryKey: ['/api/design-control/user-requirements'],
  });

  const { data: designInputs = [], isLoading: diLoading } = useQuery({
    queryKey: ['/api/design-control/design-inputs'],
  });

  const { data: designOutputs = [], isLoading: doLoading } = useQuery({
    queryKey: ['/api/design-control/design-outputs'],
  });

  const { data: verificationPlans = [], isLoading: vpLoading } = useQuery({
    queryKey: ['/api/design-control/verification-plans'],
  });

  const { data: validationPlans = [], isLoading: valLoading } = useQuery({
    queryKey: ['/api/design-control/validation-plans'],
  });

  const { data: testCases = [], isLoading: tcLoading } = useQuery({
    queryKey: ['/api/design-control/test-cases'],
  });

  const { data: riskControls = [], isLoading: rcLoading } = useQuery({
    queryKey: ['/api/design-control/risk-controls'],
  });

  const { data: traceabilityLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ['/api/design-control/traceability-links'],
  });

  const { data: coverageMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/design-control/traceability-coverage'],
  });

  const isLoading = ursLoading || urLoading || diLoading || doLoading || vpLoading || valLoading || tcLoading || rcLoading || linksLoading || metricsLoading;

  // Build comprehensive traceability matrix
  const buildTraceabilityMatrix = (): TraceabilityMatrix => {
    const allItems: TraceabilityItem[] = [
      // URS Requirements
      ...(ursRequirements || []).map((req: any) => ({
        id: req.requirementId,
        identifier: req.requirementId,
        title: req.title,
        type: 'urs_requirement' as const,
        status: req.status,
        priority: req.priority,
        riskLevel: req.riskLevel,
        linkedItems: [],
        sourceModule: 'URS',
        moduleRoute: '/design-control/urs',
        lastModified: req.updatedAt || req.createdAt,
        owner: req.owner,
        description: req.description,
        completionPercentage: req.status === 'approved' ? 100 : 50,
        complianceContext: req.regulatoryContext,
        regulatoryRequirement: req.regulatoryRequirement
      })),
      // User Requirements
      ...(userRequirements || []).map((req: any) => ({
        id: req.requirementId,
        identifier: req.requirementId,
        title: req.title,
        type: 'user_need' as const,
        status: req.status,
        priority: req.priority,
        riskLevel: req.riskLevel,
        linkedItems: [],
        sourceModule: 'User Needs',
        moduleRoute: '/design-control/user-needs',
        lastModified: req.createdAt,
        owner: req.stakeholderCategory,
        description: req.description,
        completionPercentage: req.traceabilityStatus === 'linked' ? 100 : 0,
        complianceContext: req.regulatoryContext
      })),
      // Design Inputs
      ...(designInputs || []).map((input: any) => ({
        id: input.inputId,
        identifier: input.inputId,
        title: input.title,
        type: 'design_input' as const,
        status: input.status,
        priority: input.priority,
        riskLevel: input.riskLevel,
        linkedItems: [],
        sourceModule: 'Design Inputs',
        moduleRoute: '/design-control/inputs',
        lastModified: input.createdAt,
        description: input.description,
        completionPercentage: input.status === 'approved' ? 100 : 75
      })),
      // Design Outputs
      ...(designOutputs || []).map((output: any) => ({
        id: output.outputId,
        identifier: output.outputId,
        title: output.title,
        type: 'design_output' as const,
        status: output.status,
        priority: output.priority,
        linkedItems: [],
        sourceModule: 'Design Outputs',
        moduleRoute: '/design-control/outputs',
        lastModified: output.createdAt,
        description: output.description,
        completionPercentage: output.status === 'verified' ? 100 : 60
      })),
      // Verification Plans
      ...(verificationPlans || []).map((plan: any) => ({
        id: plan.planId,
        identifier: plan.planId,
        title: plan.title,
        type: 'verification' as const,
        status: plan.status,
        priority: plan.priority,
        linkedItems: [],
        sourceModule: 'Verification',
        moduleRoute: '/design-control/verification',
        lastModified: plan.createdAt,
        description: plan.description,
        completionPercentage: plan.executionProgress || 0
      })),
      // Validation Plans
      ...(validationPlans || []).map((plan: any) => ({
        id: plan.planId,
        identifier: plan.planId,
        title: plan.title,
        type: 'validation' as const,
        status: plan.status,
        priority: plan.priority,
        linkedItems: [],
        sourceModule: 'Validation',
        moduleRoute: '/design-control/validation',
        lastModified: plan.createdAt,
        description: plan.description,
        completionPercentage: plan.executionProgress || 0
      })),
      // Test Cases
      ...(testCases || []).map((test: any) => ({
        id: test.testId,
        identifier: test.testId,
        title: test.title,
        type: 'test_case' as const,
        status: test.status,
        priority: test.priority,
        linkedItems: [],
        sourceModule: 'Test Cases',
        moduleRoute: '/design-control/test-cases',
        lastModified: test.createdAt,
        description: test.description,
        completionPercentage: test.status === 'passed' ? 100 : 0
      })),
      // Risk Controls
      ...(riskControls || []).map((control: any) => ({
        id: control.controlId,
        identifier: control.controlId,
        title: control.title,
        type: 'risk_control' as const,
        status: control.status,
        priority: control.priority,
        linkedItems: [],
        sourceModule: 'Risk Controls',
        moduleRoute: '/design-control/risk-controls',
        lastModified: control.createdAt,
        description: control.description,
        completionPercentage: control.implementationStatus === 'implemented' ? 100 : 50
      }))
    ];

    // Process traceability links to populate linkedItems
    (traceabilityLinks || []).forEach((link: TraceabilityLink) => {
      const sourceItem = allItems.find(item => item.identifier === link.sourceIdentifier);
      const targetItem = allItems.find(item => item.identifier === link.targetIdentifier);
      
      if (sourceItem && targetItem) {
        sourceItem.linkedItems.push(targetItem.identifier);
      }
    });

    return {
      items: allItems,
      links: traceabilityLinks || [],
      coverage: coverageMetrics || {
        totalRequirements: allItems.length,
        linkedRequirements: 0,
        coveragePercentage: 0,
        missingLinks: 0,
        partialLinks: 0,
        directLinks: 0,
        indirectLinks: 0
      }
    };
  };

  const traceabilityMatrix = buildTraceabilityMatrix();

  // Filter items based on search and filters
  const filteredItems = traceabilityMatrix.items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urs_requirement': return <FileText className="h-4 w-4" />;
      case 'user_need': return <Target className="h-4 w-4" />;
      case 'design_input': return <ArrowRight className="h-4 w-4" />;
      case 'design_output': return <GitBranch className="h-4 w-4" />;
      case 'verification': return <TestTube className="h-4 w-4" />;
      case 'validation': return <CheckCircle className="h-4 w-4" />;
      case 'test_case': return <TestTube className="h-4 w-4" />;
      case 'risk_control': return <Shield className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string, type: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
      case 'passed':
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Find linked items for an item
  const getLinkedItems = (itemId: string, linkType?: string) => {
    return traceabilityMatrix.links.filter(link => 
      (link.sourceIdentifier === itemId || link.targetIdentifier === itemId) &&
      (!linkType || link.linkType === linkType)
    );
  };

  // Generate traceability report
  const generateTraceabilityReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: traceabilityMatrix.coverage,
      itemsByType: traceabilityMatrix.items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      orphanedItems: traceabilityMatrix.items.filter(item => item.linkedItems.length === 0),
      criticalPath: traceabilityMatrix.items.filter(item => 
        item.priority === 'critical' || item.regulatoryRequirement
      )
    };
    
    console.log('Traceability Report:', report);
    // In real implementation, this would generate and download a report
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading comprehensive traceability matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Design Control Traceability Matrix</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive ISO 13485:7.3 compliant traceability from URS through validation
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={generateTraceabilityReport}
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Matrix
          </Button>
        </div>
      </div>

      {/* Coverage Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{traceabilityMatrix.items.length}</p>
              </div>
              <Network className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold">{traceabilityMatrix.coverage.coveragePercentage}%</p>
              </div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <Progress value={traceabilityMatrix.coverage.coveragePercentage} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Direct Links</p>
                <p className="text-2xl font-bold">{traceabilityMatrix.coverage.directLinks}</p>
              </div>
              <GitBranch className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Missing Links</p>
                <p className="text-2xl font-bold">{traceabilityMatrix.coverage.missingLinks}</p>
              </div>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items by title, identifier, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="urs_requirement">URS Requirements</SelectItem>
                <SelectItem value="user_need">User Needs</SelectItem>
                <SelectItem value="design_input">Design Inputs</SelectItem>
                <SelectItem value="design_output">Design Outputs</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="validation">Validation</SelectItem>
                <SelectItem value="test_case">Test Cases</SelectItem>
                <SelectItem value="risk_control">Risk Controls</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matrix">Traceability Matrix</TabsTrigger>
          <TabsTrigger value="flow">Traceability Flow</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="compliance">Compliance View</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Traceability Matrix</CardTitle>
              <CardDescription>
                Complete view of all design control elements with forward and backward traceability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="text-xs capitalize">
                              {item.type.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {item.identifier}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status, item.type)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.priority && (
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)}`} />
                              <span className="text-xs capitalize">{item.priority}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.completionPercentage !== undefined && (
                            <div className="w-16">
                              <Progress value={item.completionPercentage} className="h-2" />
                              <span className="text-xs text-muted-foreground">
                                {item.completionPercentage}%
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getLinkedItems(item.identifier).slice(0, 3).map((link, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {link.linkType}
                              </Badge>
                            ))}
                            {getLinkedItems(item.identifier).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{getLinkedItems(item.identifier).length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {item.owner || 'Unassigned'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedItem(item)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>{item.title}</DialogTitle>
                                  <DialogDescription>
                                    {item.identifier} - {item.type.replace('_', ' ')}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {item.description && (
                                    <div>
                                      <h4 className="font-medium mb-2">Description</h4>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium mb-2">Traceability Links</h4>
                                    <div className="space-y-2">
                                      {getLinkedItems(item.identifier).map((link) => (
                                        <div key={link.id} className="flex items-center gap-2 p-2 border rounded">
                                          <Badge variant="outline">{link.linkType}</Badge>
                                          <span className="text-sm">
                                            {link.sourceIdentifier} → {link.targetIdentifier}
                                          </span>
                                          <Badge className={link.traceabilityStrength === 'direct' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                            {link.traceabilityStrength}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(item.moduleRoute, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traceability Flow Diagram</CardTitle>
              <CardDescription>
                Visual representation of traceability relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Interactive flow diagram showing the complete traceability chain from URS requirements through validation.
                  This view would include a visual network diagram showing all connections.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gap Analysis</CardTitle>
              <CardDescription>
                Identify missing traceability links and orphaned items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {traceabilityMatrix.coverage.missingLinks > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {traceabilityMatrix.coverage.missingLinks} items are missing required traceability links.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Orphaned Items</h4>
                  <div className="space-y-2">
                    {traceabilityMatrix.items
                      .filter(item => item.linkedItems.length === 0)
                      .map(item => (
                        <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                          {getTypeIcon(item.type)}
                          <span className="font-medium">{item.identifier}</span>
                          <span className="text-sm text-muted-foreground">{item.title}</span>
                          <Badge variant="destructive">No Links</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance View</CardTitle>
              <CardDescription>
                ISO 13485:7.3 and IEC 62304 compliance mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Regulatory Requirements Coverage</h4>
                  <div className="space-y-2">
                    {traceabilityMatrix.items
                      .filter(item => item.regulatoryRequirement)
                      .map(item => (
                        <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                          {getTypeIcon(item.type)}
                          <span className="font-medium">{item.identifier}</span>
                          <span className="text-sm">{item.title}</span>
                          <Badge variant="outline">{item.complianceContext}</Badge>
                          <Badge className={item.linkedItems.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {item.linkedItems.length > 0 ? 'Traced' : 'Not Traced'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
