import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Users,
  Calendar,
  BarChart3,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

/**
 * JIRA-Level Professional Enhanced Technical Documentation Interface
 * Implements comprehensive technical documentation management with project-based organization
 * Features: ISO 13485 compliance tracking, project integration, enhanced workflow management
 */

interface TechnicalDocument {
  id: number;
  documentNumber: string;
  title: string;
  description: string;
  deviceModel: string;
  status: string;
  version: string;
  revisionLevel: string;
  designProjectId?: number;
  authorId: number;
  approvedBy?: number;
  approvedAt?: string;
  completionPercentage: number;
  complianceStatus: string;
  riskClassification: string;
  regulatoryImpact: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  projectCode?: string;
  projectTitle?: string;
}

interface ProjectDocuments {
  projectId: number;
  projectCode: string;
  projectTitle: string;
  projectDescription: string;
  documentCount: number;
  approvedCount: number;
  draftCount: number;
  reviewCount: number;
  completionRate: number;
}

interface ComplianceMetrics {
  overallMetrics: {
    totalDocuments: number;
    approvedDocuments: number;
    draftDocuments: number;
    reviewDocuments: number;
    complianceRate: number;
  };
  projectMetrics: Array<{
    projectCode: string;
    projectTitle: string;
    documentCount: number;
    approvedCount: number;
    complianceRate: number;
  }>;
}

const EnhancedTechnicalDocumentation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();

  // Fetch enhanced technical documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/technical-documentation-enhanced'],
    queryFn: () => apiRequest('/api/technical-documentation-enhanced')
  });

  // Fetch project documents
  const { data: projectDocuments = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/technical-documentation-enhanced/projects'],
    queryFn: () => apiRequest('/api/technical-documentation-enhanced/projects')
  });

  // Fetch compliance dashboard
  const { data: complianceMetrics, isLoading: complianceLoading } = useQuery({
    queryKey: ['/api/technical-documentation-enhanced/compliance/dashboard'],
    queryFn: () => apiRequest('/api/technical-documentation-enhanced/compliance/dashboard')
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: (newDocument: any) => 
      apiRequest('/api/technical-documentation-enhanced', {
        method: 'POST',
        body: JSON.stringify(newDocument)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-documentation-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technical-documentation-enhanced/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technical-documentation-enhanced/compliance/dashboard'] });
    }
  });

  // Filter documents
  const filteredDocuments = documents.filter((doc: TechnicalDocument) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.deviceModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesProject = projectFilter === 'all' || doc.projectCode === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueProjects = Array.from(new Set(documents.map((doc: TechnicalDocument) => doc.projectCode).filter(Boolean)));

  if (documentsLoading || projectsLoading || complianceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading enhanced technical documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Enhanced Technical Documentation</h1>
            <p className="text-blue-100 mt-1">
              Professional project-based documentation management with ISO 13485 compliance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-sm text-blue-100">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {complianceMetrics?.overallMetrics?.complianceRate || 0}%
              </div>
              <div className="text-sm text-blue-100">Compliance Rate</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Projects</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents by title, number, or device model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="APPROVED">Approved</option>
              </select>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Projects</option>
                {uniqueProjects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            </div>
          </div>

          {/* Documents Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredDocuments.map((document: TechnicalDocument) => (
              <Card key={document.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{document.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {document.documentNumber} • {document.deviceModel}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                      {document.regulatoryImpact && (
                        <Badge variant="outline" className="text-xs">
                          Regulatory
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completion</span>
                      <span className="font-medium">{document.completionPercentage}%</span>
                    </div>
                    <Progress value={document.completionPercentage} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Version:</span>
                        <span className="ml-1 font-medium">{document.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Author:</span>
                        <span className="ml-1 font-medium">{document.authorName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Project:</span>
                        <span className="ml-1 font-medium">
                          {document.projectCode || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Badge className={getComplianceColor(document.complianceStatus)} variant="outline">
                          {document.complianceStatus}
                        </Badge>
                        <Badge className={getRiskColor(document.riskClassification)} variant="outline">
                          {document.riskClassification} risk
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or create a new document.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectDocuments.map((project: ProjectDocuments) => (
              <Card key={project.projectId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{project.projectCode}</span>
                    <Badge variant="outline">
                      {project.documentCount} docs
                    </Badge>
                  </CardTitle>
                  <CardDescription>{project.projectTitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-medium">{project.completionRate}%</span>
                    </div>
                    <Progress value={project.completionRate} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-bold text-green-600">{project.approvedCount}</div>
                        <div className="text-green-600">Approved</div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="font-bold text-yellow-600">{project.reviewCount}</div>
                        <div className="text-yellow-600">Review</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold text-gray-600">{project.draftCount}</div>
                        <div className="text-gray-600">Draft</div>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      View Project Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {complianceMetrics?.overallMetrics?.totalDocuments || 0}
                </div>
                <div className="text-xs text-gray-500">All technical documents</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {complianceMetrics?.overallMetrics?.approvedDocuments || 0}
                </div>
                <div className="text-xs text-gray-500">Compliance ready</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {complianceMetrics?.overallMetrics?.reviewDocuments || 0}
                </div>
                <div className="text-xs text-gray-500">Pending approval</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {complianceMetrics?.overallMetrics?.complianceRate || 0}%
                </div>
                <div className="text-xs text-gray-500">ISO 13485 ready</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Compliance Overview</CardTitle>
              <CardDescription>
                Compliance status by design project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceMetrics?.projectMetrics?.map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{project.projectCode}</div>
                      <div className="text-sm text-gray-500">{project.projectTitle}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{project.documentCount}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">{project.approvedCount}</div>
                        <div className="text-xs text-gray-500">Approved</div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-medium">{project.complianceRate}%</div>
                        <div className="text-xs text-gray-500">Rate</div>
                      </div>
                      <Progress value={project.complianceRate} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Approved</span>
                    <span className="text-sm font-medium">
                      {complianceMetrics?.overallMetrics?.approvedDocuments || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">In Review</span>
                    <span className="text-sm font-medium">
                      {complianceMetrics?.overallMetrics?.reviewDocuments || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Draft</span>
                    <span className="text-sm font-medium">
                      {complianceMetrics?.overallMetrics?.draftDocuments || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regulatory Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Risk Documents</span>
                    <span className="text-sm font-medium">
                      {documents.filter((d: TechnicalDocument) => d.riskClassification === 'high').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Regulatory Impact</span>
                    <span className="text-sm font-medium">
                      {documents.filter((d: TechnicalDocument) => d.regulatoryImpact).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ISO 13485 Ready</span>
                    <span className="text-sm font-medium text-green-600">
                      {documents.filter((d: TechnicalDocument) => d.complianceStatus === 'compliant').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTechnicalDocumentation;