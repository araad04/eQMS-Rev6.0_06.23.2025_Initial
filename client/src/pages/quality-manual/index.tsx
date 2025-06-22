import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Helmet } from "react-helmet";
import { 
  Plus, 
  FileText, 
  ChevronRight, 
  Calendar, 
  FilePlus2, 
  Bookmark,
  BookCopy,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  AlertCircle,
  History,
  Users,
  Unlock,
  Shield,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import EmptyState from '@/components/empty-state';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * ISO 13485:2016 Quality Manual Module
 * 
 * This module implements requirements from:
 * - Clause 4.2.1: Documentation Requirements
 * - Clause 4.2.3: Quality Manual Requirements
 * - Clause 4.1.2: Quality Management System Documentation
 * 
 * Provides structured management of the organization's Quality Manual,
 * which describes the quality management system and documents the
 * scope, exclusions, and interactions between processes.
 */
export default function QualityManualPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch quality manual from the API
  const { data: manual, isLoading } = useQuery({
    queryKey: ['/api/quality-manual'],
    enabled: true,
  });

  // Fetch versions if manual exists
  const { data: versions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ['/api/quality-manual', manual?.id, 'versions'],
    enabled: !!manual?.id,
  });

  // Create a new version mutation
  const createVersion = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/quality-manual/${manual?.id}/versions`, {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Version created",
        description: "New version of the quality manual has been created and is pending approval",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quality-manual', manual?.id, 'versions'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating version",
        description: error.message || "There was an error creating the version",
      });
    },
  });

  // Helper function to create a new version
  const handleCreateVersion = () => {
    if (!manual?.id) return;
    
    const versionNumber = versions.length > 0 
      ? (parseInt(versions[0].versionNumber || "0") + 1).toString().padStart(2, '0')
      : "01";
    
    createVersion.mutate({
      versionNumber,
      createdBy: 1, // Default user ID
      status: "Draft",
      effectiveDate: null,
      expirationDate: null
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "Under Review":
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Under Review</Badge>;
      case "Obsolete":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Obsolete</Badge>;
      case "Draft":
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Quality Manual | eQMS</title>
        <meta 
          name="description" 
          content="ISO 13485:2016 Quality Manual - The Level 1 document in the QMS hierarchy defining the quality management system" 
        />
      </Helmet>

      <TooltipProvider>
        <div className="container p-6">
          <PageHeader
            title="Organization Quality Manual"
            description="The single Level 1 document defining the entire quality management system (ISO 13485:2016)"
          />

          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !manual ? (
            <EmptyState
              icon={<BookCopy className="h-12 w-12 text-muted-foreground" />}
              title="Organization Quality Manual Not Found"
              description="Create the organization's single ISO 13485:2016 compliant quality manual to define your quality management system."
              action={
                <Button onClick={() => navigate('/quality-manual/create')}>
                  <Plus className="h-4 w-4 mr-2" /> Create Organization Quality Manual
                </Button>
              }
            />
          ) : (
            <div className="space-y-8">
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Quality Manual Overview</TabsTrigger>
                  <TabsTrigger value="versions">Version History</TabsTrigger>
                  <TabsTrigger value="approvals">Approval History</TabsTrigger>
                  <TabsTrigger value="structure">QMS Structure</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  {/* Quality Manual Overview Card */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center mb-1">
                            <CardTitle className="text-xl font-semibold">
                              {manual.title}
                            </CardTitle>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="ml-2">
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">This is the primary document that defines the organization's quality management system requirements per ISO 13485:2016 section 4.2.2</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <CardDescription className="mt-1">
                            Document ID: {manual.documentId}
                          </CardDescription>
                        </div>
                        {getStatusBadge(manual.status || "Draft")}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2 flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-primary/70" />
                              Description
                            </h3>
                            <p className="text-sm text-muted-foreground">{manual.description}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2 flex items-center">
                              <Shield className="h-4 w-4 mr-2 text-primary/70" />
                              Regulatory Compliance
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge variant="outline" className="bg-primary/5">ISO 13485:2016</Badge>
                              <Badge variant="outline" className="bg-primary/5">21 CFR Part 820</Badge>
                              <Badge variant="outline" className="bg-primary/5">EU MDR 2017/745</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2 flex items-center">
                              <History className="h-4 w-4 mr-2 text-primary/70" />
                              Document History
                            </h3>
                            <div className="text-sm text-muted-foreground space-y-2">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-2" />
                                <span>Created: {format(new Date(manual.createdAt), 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center">
                                <FileCheck className="h-3 w-3 mr-2" />
                                <span>Current Version: {manual.currentVersionNumber || "None"}</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-2" />
                                <span>Last Review: {manual.lastReviewDate ? format(new Date(manual.lastReviewDate), 'MMM d, yyyy') : "Not reviewed"}</span>
                              </div>
                              <div className="flex items-center">
                                <Unlock className="h-3 w-3 mr-2" />
                                <span>Status: {manual.status || "Draft"}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab("structure")}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-1" />
                              View QMS Structure
                            </Button>
                            
                            <Button 
                              onClick={handleCreateVersion}
                              disabled={createVersion.isPending}
                              size="sm"
                            >
                              {createVersion.isPending && (
                                <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              )}
                              <FilePlus2 className="h-4 w-4 mr-1" />
                              New Version
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* QMS Statistics Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Version Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <Bookmark className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{versions.length || 0}</p>
                              <p className="text-xs text-muted-foreground">Total Versions</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center space-x-1">
                              <Badge variant="default" className="bg-green-600 px-1 py-0">
                                {versions.filter((v: any) => v.status === "Approved").length || 0}
                              </Badge>
                              <span className="text-xs">Approved</span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <Badge variant="secondary" className="px-1 py-0">
                                {versions.filter((v: any) => v.status === "Draft").length || 0}
                              </Badge>
                              <span className="text-xs">Draft</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Review Cycle</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">Yearly</p>
                              <p className="text-xs text-muted-foreground">Required Review</p>
                            </div>
                          </div>
                          {manual.nextReviewDate && (
                            <div className="flex items-center space-x-1">
                              <Badge variant={
                                new Date(manual.nextReviewDate) < new Date() 
                                  ? "destructive" 
                                  : "outline"
                              } className="px-2">
                                {format(new Date(manual.nextReviewDate), 'MMM yyyy')}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{manual.status === "Approved" ? "Compliant" : "Pending"}</p>
                              <p className="text-xs text-muted-foreground">ISO 13485:2016</p>
                            </div>
                          </div>
                          <Badge variant={manual.status === "Approved" ? "default" : "secondary"} className={manual.status === "Approved" ? "bg-green-600" : ""}>
                            {manual.status === "Approved" ? "Verified" : "In Progress"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="versions" className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Document Versions</h2>
                    <Button 
                      onClick={handleCreateVersion}
                      disabled={createVersion.isPending}
                      size="sm"
                    >
                      {createVersion.isPending && (
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      )}
                      <FilePlus2 className="h-4 w-4 mr-1" />
                      Create New Version
                    </Button>
                  </div>
                  
                  {isLoadingVersions ? (
                    <div className="flex justify-center items-center p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : versions.length === 0 ? (
                    <Card className="bg-muted/30">
                      <CardContent className="py-6">
                        <div className="flex flex-col items-center justify-center text-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">No Versions Available</h3>
                          <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Create a version to start documenting your ISO 13485:2016 quality manual content.
                          </p>
                          <Button 
                            onClick={handleCreateVersion}
                            disabled={createVersion.isPending}
                          >
                            {createVersion.isPending && (
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            )}
                            <FilePlus2 className="h-4 w-4 mr-2" />
                            Create First Version
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Version</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created Date</TableHead>
                              <TableHead>Effective Date</TableHead>
                              <TableHead>Expiration Date</TableHead>
                              <TableHead>Created By</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {versions.map((version: any) => (
                              <TableRow key={version.id}>
                                <TableCell>
                                  <div className="font-medium flex items-center">
                                    <Bookmark className="h-3 w-3 mr-2 text-primary" />
                                    {version.versionNumber}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(version.status)}
                                </TableCell>
                                <TableCell>{format(new Date(version.createdAt), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                  {version.effectiveDate 
                                    ? format(new Date(version.effectiveDate), 'MMM d, yyyy') 
                                    : "Not set"}
                                </TableCell>
                                <TableCell>
                                  {version.expirationDate 
                                    ? format(new Date(version.expirationDate), 'MMM d, yyyy') 
                                    : "Not set"}
                                </TableCell>
                                <TableCell>{version.createdByName || "System"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/quality-manual/versions/${version.id}`)}
                                    >
                                      View
                                      <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                    
                                    {version.status === "Draft" && (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => navigate(`/quality-manual/versions/${version.id}/edit`)}
                                      >
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="approvals" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Document Approval History</CardTitle>
                      <CardDescription>
                        ISO 13485:2016 required approval records for this controlled document
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {versions.some((v: any) => v.approvals && v.approvals.length > 0) ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Version</TableHead>
                              <TableHead>Approver</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Comments</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {versions.flatMap((version: any) => 
                              (version.approvals || []).map((approval: any) => (
                                <TableRow key={`${version.id}-${approval.id}`}>
                                  <TableCell>{version.versionNumber}</TableCell>
                                  <TableCell>{approval.approverName}</TableCell>
                                  <TableCell>{approval.approverRole}</TableCell>
                                  <TableCell>{format(new Date(approval.date), 'MMM d, yyyy')}</TableCell>
                                  <TableCell>{approval.comments || "No comments"}</TableCell>
                                  <TableCell>
                                    <Badge variant={approval.approved ? "default" : "destructive"} className={approval.approved ? "bg-green-600" : ""}>
                                      {approval.approved ? "Approved" : "Rejected"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                          <h3 className="font-medium">No Approval Records</h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Document versions must complete the required approval workflow
                            to meet ISO 13485:2016 document control requirements.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="structure" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quality Management System Structure</CardTitle>
                      <CardDescription>
                        ISO 13485:2016 documentation hierarchy and process interactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="px-4">
                        <div className="flex flex-col items-center">
                          {/* Level 1 - Quality Manual */}
                          <div className="w-full max-w-xs">
                            <Card className="border-primary/50 bg-primary/5">
                              <CardContent className="p-4 flex items-center justify-center space-x-3">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <div>
                                  <h3 className="font-medium">Level 1: Quality Manual</h3>
                                  <p className="text-xs text-muted-foreground">Core QMS Description</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          {/* Connector */}
                          <div className="h-8 w-px bg-border"></div>
                          
                          {/* Level 2 - Procedures */}
                          <div className="w-full max-w-lg">
                            <Card>
                              <CardContent className="p-4 flex items-center justify-center space-x-3">
                                <ClipboardCheck className="h-5 w-5 text-primary/80" />
                                <div>
                                  <h3 className="font-medium">Level 2: Procedures</h3>
                                  <p className="text-xs text-muted-foreground">Standard Operating Procedures</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          {/* Connector */}
                          <div className="h-8 w-px bg-border"></div>
                          
                          {/* Level 3 - Work Instructions */}
                          <div className="w-full max-w-xl">
                            <div className="grid grid-cols-2 gap-4">
                              <Card>
                                <CardContent className="p-4 flex items-center justify-center space-x-3">
                                  <FileText className="h-5 w-5 text-primary/70" />
                                  <div>
                                    <h3 className="font-medium">Level 3: Work Instructions</h3>
                                    <p className="text-xs text-muted-foreground">Detailed Task Guidance</p>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardContent className="p-4 flex items-center justify-center space-x-3">
                                  <FileCheck className="h-5 w-5 text-primary/70" />
                                  <div>
                                    <h3 className="font-medium">Level 3: Specifications</h3>
                                    <p className="text-xs text-muted-foreground">Technical Requirements</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                          
                          {/* Connector */}
                          <div className="h-8 w-px bg-border"></div>
                          
                          {/* Level 4 - Records */}
                          <div className="w-full max-w-2xl">
                            <Card className="bg-muted/30 border-dashed">
                              <CardContent className="p-4 flex items-center justify-center space-x-3">
                                <Bookmark className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <h3 className="font-medium">Level 4: Records & Forms</h3>
                                  <p className="text-xs text-muted-foreground">Objective Evidence of Activities</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                        
                        <div className="mt-12">
                          <h3 className="font-medium text-sm mb-3">ISO 13485:2016 QMS Process Interactions</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-sm font-medium">Management</span>
                              <span className="text-xs text-muted-foreground text-center">Strategic direction</span>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Microscope className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-sm font-medium">Design</span>
                              <span className="text-xs text-muted-foreground text-center">Product development</span>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <PackageOpen className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-sm font-medium">Production</span>
                              <span className="text-xs text-muted-foreground text-center">Manufacturing</span>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <BarChart4 className="h-6 w-6 text-primary" />
                              </div>
                              <span className="text-sm font-medium">Measurement</span>
                              <span className="text-xs text-muted-foreground text-center">Performance evaluation</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </TooltipProvider>
    </>
  );
}