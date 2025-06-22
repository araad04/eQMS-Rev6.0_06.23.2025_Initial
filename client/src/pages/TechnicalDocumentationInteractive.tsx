import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Target,
  TrendingUp,
  Shield,
  BookOpen,
  Briefcase
} from 'lucide-react';

interface MDRSection {
  id: number;
  sectionNumber: string;
  title: string;
  description: string;
  annexReference: string;
  isRequired: boolean;
  parentSectionId: number | null;
  sortOrder: number;
  template: string;
  guidance: string;
}

interface TechnicalDocument {
  id: number;
  documentNumber: string;
  title: string;
  description: string;
  categoryId: number;
  mdrSectionId: number | null;
  designProjectId: number | null;
  version: string;
  status: string;
  authorId: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface DesignProject {
  id: number;
  projectCode: string;
  title: string;
  description: string;
  riskLevel: string;
  riskClass: string;
  overallProgress: number;
  status: {
    name: string;
  };
  projectType: {
    name: string;
  };
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'under review':
        return { color: 'bg-blue-100 text-blue-800', icon: Users };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'obsolete':
        return { color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
};

export default function TechnicalDocumentationInteractive() {
  const queryClient = useQueryClient();
  
  // State management
  const [selectedMDRSection, setSelectedMDRSection] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log("Dialog states:", { isCreateDialogOpen, isImportDialogOpen, isExportDialogOpen });
  }, [isCreateDialogOpen, isImportDialogOpen, isExportDialogOpen]);
  
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    categoryId: '',
    mdrSectionId: '',
    designProjectId: '',
    version: '1.0'
  });

  // Fetch data
  const { data: mdrSections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/technical-documentation/mdr-sections/structure'],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/technical-documentation'],
  });

  const { data: designProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/design-projects-flow'],
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      const response = await fetch('/api/technical-documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify(documentData)
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
      setIsCreateDialogOpen(false);
      setNewDocument({
        title: '',
        description: '',
        categoryId: '',
        mdrSectionId: '',
        designProjectId: '',
        version: '1.0'
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document",
        variant: "destructive",
      });
    }
  });

  // Filter documents
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    
    return documents.filter((doc: TechnicalDocument) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesMDRSection = !selectedMDRSection || doc.mdrSectionId === selectedMDRSection;
      const matchesProject = !selectedProject || doc.designProjectId === selectedProject;
      
      return matchesSearch && matchesStatus && matchesMDRSection && matchesProject;
    });
  }, [documents, searchTerm, statusFilter, selectedMDRSection, selectedProject]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!documents) return { total: 0, draft: 0, approved: 0, compliance: 0 };
    
    const total = documents.length;
    const draft = documents.filter((d: TechnicalDocument) => d.status.toLowerCase() === 'draft').length;
    const approved = documents.filter((d: TechnicalDocument) => d.status.toLowerCase() === 'approved').length;
    const compliance = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    return { total, draft, approved, compliance };
  }, [documents]);

  const handleCreateDocument = () => {
    if (!newDocument.title || !newDocument.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createDocumentMutation.mutate({
      ...newDocument,
      categoryId: parseInt(newDocument.categoryId),
      mdrSectionId: newDocument.mdrSectionId ? parseInt(newDocument.mdrSectionId) : null,
      designProjectId: newDocument.designProjectId ? parseInt(newDocument.designProjectId) : null,
    });
  };

  if (sectionsLoading || documentsLoading || projectsLoading) {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technical Documentation</h1>
          <p className="text-muted-foreground">
            Manage technical documents with MDR compliance and design control integration
          </p>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.draft}</p>
                <p className="text-sm text-muted-foreground">Draft Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.compliance}%</p>
                <p className="text-sm text-muted-foreground">Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>
            Filter and manage technical documents with real-time compliance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="obsolete">Obsolete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={() => {
                  console.log("Import button clicked");
                  setIsImportDialogOpen(!isImportDialogOpen);
                }}
                variant="outline"
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                onClick={() => {
                  console.log("Export button clicked");
                  setIsExportDialogOpen(!isExportDialogOpen);
                }}
                variant="outline"
                type="button"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={() => {
                  console.log("New Document button clicked, current state:", isCreateDialogOpen);
                  setIsCreateDialogOpen(!isCreateDialogOpen);
                  console.log("Toggled dialog state to:", !isCreateDialogOpen);
                }}
                type="button"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Documents ({filteredDocuments.length})</CardTitle>
          {selectedMDRSection && (
            <CardDescription>
              Filtered by MDR Section: {mdrSections?.find((s: any) => s.id === selectedMDRSection)?.title}
              <Button variant="link" onClick={() => setSelectedMDRSection(null)} className="p-0 h-auto ml-2">
                Clear filter
              </Button>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((document: any) => {
              const project = designProjects?.find((p: any) => p.id === document.designProjectId);
              const mdrSection = mdrSections?.find((s: any) => s.id === document.mdrSectionId);
              
              return (
                <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{document.title}</h3>
                        <StatusBadge status={document.status} />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Version: {document.version}</span>
                        <span>Document: {document.documentNumber}</span>
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={document.completionPercentage} className="w-20" />
                      <span className="text-sm text-gray-500">{document.completionPercentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MDR Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>MDR Compliance Overview</CardTitle>
          <CardDescription>
            Track documentation compliance against EU MDR requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mdrSections?.map((section: any) => {
              const sectionDocs = documents?.filter((doc: any) => doc.mdrSectionId === section.id) || [];
              const completionRate = sectionDocs.length > 0 ? 
                sectionDocs.reduce((acc: number, doc: any) => acc + doc.completionPercentage, 0) / sectionDocs.length : 0;
              
              return (
                <div key={section.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{section.sectionNumber} - {section.title}</h4>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{sectionDocs.length} documents</p>
                      <Progress value={completionRate} className="w-24 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="outline">{section.annexReference}</Badge>
                    {section.isRequired && <Badge variant="secondary">Required</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Document Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Technical Document</DialogTitle>
            <DialogDescription>
              Create a new technical document for regulatory compliance and design control integration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-title" className="text-right">
                Title *
              </Label>
              <Input
                id="doc-title"
                value={newDocument.title}
                onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
                placeholder="Enter document title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="doc-description"
                value={newDocument.description}
                onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter document description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-category" className="text-right">
                Category *
              </Label>
              <Select 
                value={newDocument.categoryId} 
                onValueChange={(value) => setNewDocument(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Design Controls</SelectItem>
                  <SelectItem value="2">Risk Management</SelectItem>
                  <SelectItem value="3">Verification & Validation</SelectItem>
                  <SelectItem value="4">Clinical Evaluation</SelectItem>
                  <SelectItem value="5">Post-Market Surveillance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-mdr-section" className="text-right">
                MDR Section
              </Label>
              <Select 
                value={newDocument.mdrSectionId} 
                onValueChange={(value) => setNewDocument(prev => ({ ...prev, mdrSectionId: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select MDR section" />
                </SelectTrigger>
                <SelectContent>
                  {mdrSections?.map((section: any) => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.sectionNumber} - {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-project" className="text-right">
                Design Project
              </Label>
              <Select 
                value={newDocument.designProjectId} 
                onValueChange={(value) => setNewDocument(prev => ({ ...prev, designProjectId: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Link to design project" />
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDocument}
              disabled={!newDocument.title || !newDocument.categoryId || createDocumentMutation.isPending}
            >
              {createDocumentMutation.isPending ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Technical Documents</DialogTitle>
            <DialogDescription>
              Import documents from Excel, CSV, or JSON format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="import-file" className="text-right">
                File
              </Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.csv,.json"
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Import Started",
                description: "Document import functionality will be implemented",
              });
              setIsImportDialogOpen(false);
            }}>
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Technical Documents</DialogTitle>
            <DialogDescription>
              Export current documents to Excel, CSV, or PDF format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Format
              </Label>
              <Select defaultValue="excel">
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Export Started",
                description: "Document export functionality will be implemented",
              });
              setIsExportDialogOpen(false);
            }}>
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}