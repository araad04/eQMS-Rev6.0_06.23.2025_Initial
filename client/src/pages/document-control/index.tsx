import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, FileText, BookOpen, ClipboardList, FormInput, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Document {
  id: number;
  documentNumber: string;
  title: string;
  type: string;
  status: string;
  version: string;
  effectiveDate: Date;
  owner: string;
  department: string;
  category: string;
}

interface DocumentCategory {
  id: number;
  name: string;
  description: string;
}

interface DocumentType {
  id: number;
  name: string;
  prefix: string;
  categoryId: number;
}

interface ISO13485Compliance {
  totalDocuments: number;
  activeDocuments: number;
  obsoleteDocuments: number;
  pendingReview: number;
  compliancePercentage: number;
  lastAuditDate: Date;
  nextReviewDate: Date;
  iso13485Clauses: Array<{
    clause: string;
    title: string;
    status: string;
  }>;
}

export default function DocumentControl() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents using the default query client with proper headers
  const { data: documents = [], isLoading: documentsLoading, error, refetch } = useQuery({
    queryKey: ["/api/iso13485-documents"],
    queryFn: async () => {
      const response = await fetch('/api/iso13485-documents', {
        headers: {
          'X-Auth-Local': 'true',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  // Debug logging
  console.log('Documents state:', { 
    documents, 
    isLoading: documentsLoading, 
    error: error?.message,
    documentsLength: documents?.length || 0
  });

  // Auto-refresh documents on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Fetch document categories
  const { data: categories = [] } = useQuery<DocumentCategory[]>({
    queryKey: ["/api/iso13485-documents/categories"],
  });

  // Fetch document types
  const { data: types = [] } = useQuery<DocumentType[]>({
    queryKey: ["/api/iso13485-documents/types"],
  });

  // Fetch ISO 13485 compliance status
  const { data: compliance } = useQuery<ISO13485Compliance>({
    queryKey: ["/api/iso13485-documents/iso13485/compliance"],
  });

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    const matchesStatus = !selectedStatus || doc.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group documents by category
  const documentsByCategory = categories.reduce((acc, category) => {
    acc[category.name] = filteredDocuments.filter(doc => doc.category === category.name);
    return acc;
  }, {} as Record<string, Document[]>);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'obsolete': return 'bg-red-100 text-red-800';
      case 'under review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Management Documents': return <BookOpen className="h-4 w-4" />;
      case 'Procedures': return <FileText className="h-4 w-4" />;
      case 'Work Instructions': return <ClipboardList className="h-4 w-4" />;
      case 'Forms': return <FormInput className="h-4 w-4" />;
      case 'Technical Documents': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ISO 13485 Document Control</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive document management system for medical device quality management
          </p>
        </div>
        <Link href="/document-control/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
        </Link>
      </div>

      {/* Compliance Dashboard */}
      {compliance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              ISO 13485 Compliance Dashboard
            </CardTitle>
            <CardDescription>
              Document control compliance status and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{compliance.totalDocuments}</div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{compliance.activeDocuments}</div>
                <div className="text-sm text-gray-600">Active Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{compliance.pendingReview}</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{compliance.compliancePercentage}%</div>
                <div className="text-sm text-gray-600">Compliance Rate</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">ISO 13485 Clause Compliance</h4>
              {compliance.iso13485Clauses.map((clause) => (
                <div key={clause.clause} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="font-medium">{clause.clause}</span>
                    <span className="ml-2 text-gray-600">{clause.title}</span>
                  </div>
                  <Badge className={clause.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {clause.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents by title or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Obsolete">Obsolete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document Categories Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.name}>
              <div className="flex items-center">
                {getCategoryIcon(category.name)}
                <span className="ml-1 hidden sm:inline">{category.name}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-sm text-gray-600">{document.documentNumber}</span>
                        <Badge className={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                        <Badge variant="outline">{document.type}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{document.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Version: {document.version}</div>
                        <div>Owner: {document.owner} | Department: {document.department}</div>
                        <div>Effective Date: {new Date(document.effectiveDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/document-control/edit/${document.id}`}>
                        <Button variant="outline" size="sm">
                          View/Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.name} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getCategoryIcon(category.name)}
                  <span className="ml-2">{category.name}</span>
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {documentsByCategory[category.name]?.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-mono text-sm text-gray-600">{document.documentNumber}</span>
                              <Badge className={getStatusColor(document.status)}>
                                {document.status}
                              </Badge>
                            </div>
                            <h4 className="font-semibold mb-1">{document.title}</h4>
                            <div className="text-sm text-gray-600">
                              <div>Version: {document.version} | Owner: {document.owner}</div>
                              <div>Effective: {new Date(document.effectiveDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <Link href={`/document-control/edit/${document.id}`}>
                            <Button variant="outline" size="sm">
                              View/Edit
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No documents found in this category
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}