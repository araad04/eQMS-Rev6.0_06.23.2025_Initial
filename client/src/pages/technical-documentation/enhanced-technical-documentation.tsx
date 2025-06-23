import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Settings, 
  BarChart3,
  Users,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Briefcase,
  Edit,
  Play,
  Eye,
  Workflow,
  Target,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TechnicalDocument {
  id: number;
  documentNumber: string;
  title: string;
  description: string;
  deviceModel: string;
  status: string;
  version: string;
  revisionLevel: string;
  mdrSectionId?: number;
  designProjectId?: number;
  categoryId: number;
  authorId: number;
  reviewerId?: number;
  approvedBy?: number;
  approvedAt?: string;
  completionPercentage: number;
  complianceStatus: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
  riskClassification: string;
  regulatoryImpact: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MDRSection {
  id: number;
  sectionNumber: string;
  title: string;
  description: string;
  requirementLevel: string;
  complianceStatus: string;
  documentCount: number;
  completionRate: number;
}

interface DocumentCategory {
  id: number;
  name: string;
  description: string;
  required: boolean;
  mdrReference: string;
}

const EnhancedTechnicalDocumentation: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State Management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [mdrSectionFilter, setMdrSectionFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialog States
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TechnicalDocument | null>(null);

  // Form States
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    deviceModel: '',
    categoryId: '',
    mdrSectionId: '',
    designProjectId: '',
    riskClassification: 'low',
    regulatoryImpact: false
  });

  const [reviewForm, setReviewForm] = useState({
    documentId: '',
    reviewComments: '',
    reviewDecision: 'pending',
    nextReviewDate: ''
  });

  // Data Queries
  const { data: documents, isLoading: documentsLoading } = useQuery<TechnicalDocument[]>({
    queryKey: ['/api/technical-documentation'],
  });

  const { data: mdrSections, isLoading: sectionsLoading } = useQuery<MDRSection[]>({
    queryKey: ['/api/technical-documentation/mdr-sections/structure'],
  });

  const { data: designProjects } = useQuery({
    queryKey: ['/api/design-projects-flow'],
  });

  // Mock categories for now
  const categories = [
    { id: 1, name: 'Design Controls', description: 'Design control documentation', required: true, mdrReference: 'Annex II' },
    { id: 2, name: 'Risk Management', description: 'Risk management files', required: true, mdrReference: 'Annex I' },
    { id: 3, name: 'Clinical Evaluation', description: 'Clinical evaluation reports', required: true, mdrReference: 'Annex XIV' },
    { id: 4, name: 'Technical Documentation', description: 'Technical documentation files', required: true, mdrReference: 'Annex II' },
    { id: 5, name: 'Quality System', description: 'Quality management system docs', required: true, mdrReference: 'Annex IX' }
  ];

  // Mutations
  const createDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/technical-documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technical-documentation'] });
      toast({
        title: "Document Created",
        description: "Technical document has been created successfully.",
      });
      setShowCreateDialog(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document",
        variant: "destructive",
      });
    }
  });

  // Helper Functions
  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      description: '',
      deviceModel: '',
      categoryId: '',
      mdrSectionId: '',
      designProjectId: '',
      riskClassification: 'low',
      regulatoryImpact: false
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'under review':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filtered Documents
  const filteredDocuments = React.useMemo(() => {
    if (!documents) return [];
    
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesCategory = categoryFilter === 'all' || doc.categoryId.toString() === categoryFilter;
      const matchesMDR = mdrSectionFilter === 'all' || doc.mdrSectionId?.toString() === mdrSectionFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesMDR;
    });
  }, [documents, searchTerm, statusFilter, categoryFilter, mdrSectionFilter]);

  // Calculate Metrics
  const metrics = React.useMemo(() => {
    if (!documents) return { total: 0, draft: 0, review: 0, approved: 0, compliance: 0, overdue: 0 };
    
    const total = documents.length;
    const draft = documents.filter(d => d.status.toLowerCase() === 'draft').length;
    const review = documents.filter(d => d.status.toLowerCase() === 'under review').length;
    const approved = documents.filter(d => d.status.toLowerCase() === 'approved').length;
    const compliance = total > 0 ? Math.round((approved / total) * 100) : 0;
    const overdue = documents.filter(d => {
      if (!d.nextReviewDate) return false;
      return new Date(d.nextReviewDate) < new Date();
    }).length;
    
    return { total, draft, review, approved, compliance, overdue };
  }, [documents]);

  // Event Handlers
  const handleCreateDocument = () => {
    if (!createForm.title || !createForm.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createDocumentMutation.mutate({
      ...createForm,
      categoryId: parseInt(createForm.categoryId),
      mdrSectionId: createForm.mdrSectionId ? parseInt(createForm.mdrSectionId) : null,
      designProjectId: createForm.designProjectId ? parseInt(createForm.designProjectId) : null,
    });
  };

  if (documentsLoading || sectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Technical Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Technical Documentation Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional MDR-compliant technical documentation management with design control integration
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Enhanced Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-900">{metrics.total}</p>
                <p className="text-xs text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-900">{metrics.draft}</p>
                <p className="text-xs text-muted-foreground">Draft Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-900">{metrics.review}</p>
                <p className="text-xs text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-900">{metrics.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-purple-900">{metrics.compliance}%</p>
                <p className="text-xs text-muted-foreground">Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-900">{metrics.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
          <TabsList className="grid w-full grid-cols-7 bg-transparent p-1">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              All Documents
            </TabsTrigger>
            <TabsTrigger 
              value="mdr-compliance" 
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              MDR Compliance
            </TabsTrigger>
            <TabsTrigger 
              value="workflows" 
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
            >
              <Workflow className="h-4 w-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-sm"
            >
              <Target className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Management Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Document Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        New Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Technical Document</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={createForm.title}
                            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                            placeholder="Document title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="device-model">Device Model</Label>
                          <Input
                            id="device-model"
                            value={createForm.deviceModel}
                            onChange={(e) => setCreateForm({ ...createForm, deviceModel: e.target.value })}
                            placeholder="Device model"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={createForm.description}
                            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            placeholder="Document description"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select value={createForm.categoryId} onValueChange={(value) => setCreateForm({ ...createForm, categoryId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="design-project">Design Project</Label>
                          <Select value={createForm.designProjectId} onValueChange={(value) => setCreateForm({ ...createForm, designProjectId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select design project" />
                            </SelectTrigger>
                            <SelectContent>
                              {designProjects?.map((project: any) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.projectCode} - {project.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="risk-classification">Risk Classification</Label>
                          <Select value={createForm.riskClassification} onValueChange={(value) => setCreateForm({ ...createForm, riskClassification: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low Risk</SelectItem>
                              <SelectItem value="medium">Medium Risk</SelectItem>
                              <SelectItem value="high">High Risk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex gap-4 pt-4">
                          <Button onClick={handleCreateDocument} disabled={createDocumentMutation.isPending}>
                            {createDocumentMutation.isPending ? 'Creating...' : 'Create Document'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-900 mb-2">Interactive Tools</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>• Create new technical documentation</p>
                    <p>• Link documents to design projects</p>
                    <p>• Manage MDR compliance tracking</p>
                    <p>• Execute review workflows</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredDocuments.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      {getStatusIcon(doc.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500">{doc.documentNumber}</p>
                      </div>
                      <Badge className={getStatusBadge(doc.status)} variant="secondary">
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <div className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Document Library ({filteredDocuments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="under review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={mdrSectionFilter} onValueChange={setMdrSectionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by MDR section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All MDR Sections</SelectItem>
                      {mdrSections?.map((section) => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.sectionNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Documents Grid/List */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                  {filteredDocuments.map((document) => {
                    const project = designProjects?.find((p: any) => p.id === document.designProjectId);
                    const mdrSection = mdrSections?.find((s: any) => s.id === document.mdrSectionId);
                    const category = categories?.find((c: any) => c.id === document.categoryId);
                    
                    return (
                      <Card key={document.id} className={`transition-all duration-300 hover:shadow-md ${viewMode === 'list' ? 'border-l-4 border-l-blue-500' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {document.title}
                                {getStatusIcon(document.status)}
                              </CardTitle>
                              <p className="text-sm text-gray-500 mt-1">{document.documentNumber}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusBadge(document.status)} variant="secondary">
                                {document.status}
                              </Badge>
                              <Badge className={getRiskBadge(document.riskClassification || 'low')} variant="outline">
                                {document.riskClassification || 'low'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">{document.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>v{document.version}</span>
                            {project && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {project.projectCode}
                              </span>
                            )}
                            {mdrSection && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {mdrSection.sectionNumber}
                              </span>
                            )}
                            {category && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {category.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Progress value={document.completionPercentage || 0} className="flex-1" />
                            <span className="text-sm text-gray-500">{document.completionPercentage || 0}%</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Play className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MDR Compliance Tab */}
        <TabsContent value="mdr-compliance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>MDR Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mdrSections?.map((section) => {
                  const sectionDocs = documents?.filter(doc => doc.mdrSectionId === section.id) || [];
                  const completionRate = section.completionRate || 0;
                  
                  return (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{section.sectionNumber} - {section.title}</h3>
                          <p className="text-sm text-gray-600">{sectionDocs.length} documents</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{completionRate}% Complete</p>
                          <Progress value={completionRate} className="w-24 mt-1" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder tabs */}
        <TabsContent value="workflows" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Document workflow management interface will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Document review management interface will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Analytics and reporting interface will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Document templates management interface will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTechnicalDocumentation;