import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users,
  Target,
  TrendingUp,
  Grid3X3,
  List,
  FileText,
  Settings,
  Star,
  Activity,
  Shield
} from "lucide-react";
import { UnifiedRibbon, STANDARD_RIBBONS } from "@/components/layout/unified-ribbon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Audit types with ISO 13485 alignment
const auditTypes = [
  {
    id: 1,
    name: "Management Review",
    icon: "🎯",
    description: "Leadership effectiveness & strategic review",
    color: "from-blue-500 to-blue-600",
    checklistItems: 15,
    estimatedDuration: "4-6 hours",
    standardReferences: ["ISO 13485:2016 5.6", "FDA QSR 820.20"],
  },
  {
    id: 2,
    name: "Design & Development",
    icon: "🔬",
    description: "Product lifecycle & design controls",
    color: "from-purple-500 to-purple-600",
    checklistItems: 25,
    estimatedDuration: "6-8 hours",
    standardReferences: ["ISO 13485:2016 7.3", "FDA QSR 820.30"],
  },
  {
    id: 3,
    name: "Purchasing & Supplier",
    icon: "🤝",
    description: "Supply chain & vendor compliance",
    color: "from-green-500 to-green-600",
    checklistItems: 20,
    estimatedDuration: "4-5 hours",
    standardReferences: ["ISO 13485:2016 7.4", "FDA QSR 820.50"],
  },
  {
    id: 4,
    name: "Production & Service",
    icon: "⚙️",
    description: "Manufacturing & delivery processes",
    color: "from-orange-500 to-orange-600",
    checklistItems: 30,
    estimatedDuration: "8-10 hours",
    standardReferences: ["ISO 13485:2016 7.5", "FDA QSR 820.70"],
  },
  {
    id: 5,
    name: "Risk Management",
    icon: "⚠️",
    description: "Risk analysis & mitigation",
    color: "from-red-500 to-red-600",
    checklistItems: 18,
    estimatedDuration: "5-7 hours",
    standardReferences: ["ISO 14971", "FDA QSR 820.30(g)"],
  },
];

// Status configuration
const auditStatusConfig = {
  1: { label: "Planning", color: "bg-blue-100 text-blue-800", icon: Calendar },
  2: { label: "Scheduled", color: "bg-purple-100 text-purple-800", icon: Clock },
  3: { label: "In Progress", color: "bg-amber-100 text-amber-800", icon: Users },
  4: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  5: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: Target }
};

export default function AuditCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch audits
  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["/api/audits"],
  });

  // Create audit mutation
  const createAuditMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/audits", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Audit Created",
        description: "New audit program has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create audit program.",
        variant: "destructive",
      });
    },
  });

  // Filter audits
  const filteredAudits = audits.filter((audit: any) => {
    const matchesSearch = audit.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.auditId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || audit.statusId?.toString() === statusFilter;
    const matchesType = typeFilter === "all" || audit.typeId?.toString() === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const stats = {
    total: audits.length,
    planning: audits.filter((a: any) => a.statusId === 1).length,
    inProgress: audits.filter((a: any) => a.statusId === 3).length,
    completed: audits.filter((a: any) => a.statusId === 4).length,
    overdue: audits.filter((a: any) => {
      if (!a.endDate) return false;
      return new Date(a.endDate) < new Date() && a.statusId !== 4;
    }).length
  };

  const handleCreateAudit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const auditData = {
      title: formData.get('title'),
      typeId: parseInt(formData.get('typeId') as string),
      statusId: 1, // Planning
      scope: formData.get('scope'),
      description: formData.get('description'),
      leadAuditorName: formData.get('leadAuditorName'),
      auditLocation: formData.get('auditLocation'),
      standardReference: formData.get('standardReference'),
      qmsArea: formData.get('qmsArea'),
    };

    createAuditMutation.mutate(auditData);
  };

  // Unified Ribbon Configuration
  const [activeRibbonTab, setActiveRibbonTab] = useState("home");
  
  const ribbonActions = {
    newAudit: () => setIsCreateDialogOpen(true),
    searchAudits: () => document.getElementById('search-input')?.focus(),
    refreshData: () => queryClient.invalidateQueries({ queryKey: ['/api/audits'] }),
    exportData: () => console.log('Export functionality'),
    filterAudits: () => console.log('Filter functionality'),
    viewSettings: () => console.log('Settings functionality')
  };

  const auditRibbonTabs = [
    {
      id: "home",
      label: "Home",
      sections: [
        {
          id: "audit",
          title: "Audit",
          actions: [
            { id: "new", label: "New Audit", icon: Plus, onClick: ribbonActions.newAudit },
            { id: "schedule", label: "Schedule", icon: Calendar },
            { id: "checklist", label: "Checklist", icon: FileText }
          ]
        },
        {
          id: "view",
          title: "View",
          actions: [
            { id: "search", label: "Search", icon: Search, onClick: ribbonActions.searchAudits },
            { id: "filter", label: "Filter", icon: Filter, onClick: ribbonActions.filterAudits },
            { id: "refresh", label: "Refresh", icon: Target, onClick: ribbonActions.refreshData }
          ]
        },
        {
          id: "actions",
          title: "Actions",
          actions: [
            { id: "export", label: "Export", icon: Download, onClick: ribbonActions.exportData },
            { id: "settings", label: "Settings", icon: Settings, onClick: ribbonActions.viewSettings },
            { id: "analytics", label: "Analytics", icon: BarChart3 }
          ]
        }
      ]
    },
    {
      id: "execution",
      label: "Execution", 
      sections: [
        {
          id: "workflow",
          title: "Workflow",
          actions: [
            { id: "planning", label: "Planning", icon: Target },
            { id: "fieldwork", label: "Fieldwork", icon: Search },
            { id: "reporting", label: "Reporting", icon: FileText }
          ]
        },
        {
          id: "findings",
          title: "Findings",
          actions: [
            { id: "addFinding", label: "Add Finding", icon: AlertCircle },
            { id: "createCapa", label: "Create CAPA", icon: Shield },
            { id: "linkCapa", label: "Link CAPA", icon: Target }
          ]
        }
      ]
    }
  ];

  return (
    <div className="space-y-0">
      <Helmet>
        <title>Audit Center - eQMS</title>
        <meta name="description" content="Comprehensive audit management and workflow orchestration for ISO 13485 compliance." />
      </Helmet>

      {/* Unified Ribbon Navigation */}
      <UnifiedRibbon
        moduleName="Audit Management"
        tabs={auditRibbonTabs}
        activeTab={activeRibbonTab}
        onTabChange={setActiveRibbonTab}
      />

      {/* Header with Gradient Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-95"></div>
        <div className="relative px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Audit Center</h1>
                <p className="text-slate-300">Comprehensive audit management and workflow orchestration</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-slate-900 hover:bg-slate-100">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Audit Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Audit Program</DialogTitle>
                      <DialogDescription>
                        Create a comprehensive audit program with defined scope and objectives.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAudit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Audit Title</Label>
                          <Input id="title" name="title" placeholder="Enter audit title" required />
                        </div>
                        <div>
                          <Label htmlFor="typeId">Audit Type</Label>
                          <Select name="typeId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audit type" />
                            </SelectTrigger>
                            <SelectContent>
                              {auditTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.icon} {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="leadAuditorName">Lead Auditor</Label>
                          <Input id="leadAuditorName" name="leadAuditorName" placeholder="Lead auditor name" required />
                        </div>
                        <div>
                          <Label htmlFor="auditLocation">Audit Location</Label>
                          <Input id="auditLocation" name="auditLocation" placeholder="Location or department" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="scope">Audit Scope</Label>
                        <Textarea 
                          id="scope" 
                          name="scope" 
                          placeholder="Define the audit scope, objectives, and criteria..."
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          name="description" 
                          placeholder="Detailed description of the audit program..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="standardReference">Standard References</Label>
                          <Input 
                            id="standardReference" 
                            name="standardReference" 
                            placeholder="ISO 13485:2016, FDA QSR..." 
                          />
                        </div>
                        <div>
                          <Label htmlFor="qmsArea">QMS Area</Label>
                          <Input 
                            id="qmsArea" 
                            name="qmsArea" 
                            placeholder="Quality management area" 
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createAuditMutation.isPending}>
                          {createAuditMutation.isPending ? "Creating..." : "Create Audit Program"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Audits</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Planning</p>
                <p className="text-3xl font-bold text-purple-900">{stats.planning}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Calendar className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">In Progress</p>
                <p className="text-3xl font-bold text-amber-900">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <Activity className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Overdue</p>
                <p className="text-3xl font-bold text-red-900">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search audits by title, ID, or scope..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="1">Planning</SelectItem>
                <SelectItem value="2">Scheduled</SelectItem>
                <SelectItem value="3">In Progress</SelectItem>
                <SelectItem value="4">Completed</SelectItem>
                <SelectItem value="5">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {auditTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Programs Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAudits.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audit Programs Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "No audits match your current search criteria."
                : "Create your first audit program to begin comprehensive quality management."}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Audit Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredAudits.map((audit: any) => {
            const status = auditStatusConfig[audit.statusId as keyof typeof auditStatusConfig];
            const StatusIcon = status?.icon || Target;
            const auditType = auditTypes.find(t => t.id === audit.typeId);

            return viewMode === "grid" ? (
              <Link key={audit.id} href={`/audit-management/audit/${audit.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {audit.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {audit.auditId}
                        </p>
                        {auditType && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{auditType.icon}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {auditType.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge className={status?.color || "bg-gray-100 text-gray-800"}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status?.label || "Unknown"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {audit.scope || audit.description || "No description available"}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Lead: {audit.leadAuditorName || "Unassigned"}</span>
                      {audit.startDate && (
                        <span>
                          {new Date(audit.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Link key={audit.id} href={`/audit-management/audit/${audit.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {auditType && <span className="text-2xl">{auditType.icon}</span>}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{audit.title}</h3>
                          <p className="text-sm text-gray-600">{audit.auditId}</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-sm text-gray-600">
                            Lead: {audit.leadAuditorName || "Unassigned"}
                          </p>
                        </div>
                        <Badge className={status?.color || "bg-gray-100 text-gray-800"}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status?.label || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}