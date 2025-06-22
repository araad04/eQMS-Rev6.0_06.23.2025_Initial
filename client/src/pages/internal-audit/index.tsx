import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";
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
import PageHeader from "@/components/page-header";
import { Audit } from "@shared/schema";

// Status configuration with enhanced visual design
const auditStatusConfig = {
  1: { label: "Planning", color: "bg-blue-100 text-blue-800", icon: Calendar },
  2: { label: "Scheduled", color: "bg-purple-100 text-purple-800", icon: Clock },
  3: { label: "In Progress", color: "bg-amber-100 text-amber-800", icon: Users },
  4: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  5: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: Target }
};

// Audit types with ISO 13485:2016 alignment
const auditTypeConfig = {
  1: { name: "Management Review", icon: "🎯", description: "Leadership effectiveness & strategic review" },
  2: { name: "Design & Development", icon: "🔬", description: "Product lifecycle & design controls" },
  3: { name: "Purchasing & Supplier", icon: "🤝", description: "Supply chain & vendor compliance" },
  4: { name: "Production & Service", icon: "⚙️", description: "Manufacturing & delivery processes" },
  5: { name: "Technical File", icon: "📋", description: "Documentation & regulatory compliance" },
  6: { name: "Risk Management", icon: "⚡", description: "Risk analysis & mitigation strategies" }
};

interface AuditCardProps {
  audit: Audit;
}

function AuditCard({ audit }: AuditCardProps) {
  const status = auditStatusConfig[audit.statusId as keyof typeof auditStatusConfig];
  const StatusIcon = status?.icon || Clock;
  const auditType = auditTypeConfig[audit.typeId as keyof typeof auditTypeConfig];

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{auditType?.icon}</div>
            <div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {audit.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {auditType?.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className={status?.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span>
              Scheduled: {audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : "TBD"}
            </span>
          </div>
          
          {audit.scope && (
            <p className="text-sm text-gray-700 line-clamp-2">
              <span className="font-medium">Scope:</span> {audit.scope}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-xs text-gray-500">
              <Users className="h-3 w-3 mr-1" />
              Lead: {audit.leadAuditorName || "Unassigned"}
            </div>
            <Link href={`/internal-audit/${audit.id}`}>
              <Button size="sm" variant="outline" className="group-hover:bg-blue-50">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InternalAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch audits with enhanced error handling
  const { data: audits = [], isLoading, error } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
    retry: 1,
  });

  // Filter audits based on criteria
  const filteredAudits = audits.filter((audit) => {
    const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.scope?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || audit.statusId === parseInt(statusFilter);
    const matchesType = typeFilter === "all" || audit.typeId === parseInt(typeFilter);
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate metrics for dashboard
  const metrics = {
    total: audits.length,
    scheduled: audits.filter(a => a.statusId === 2).length,
    inProgress: audits.filter(a => a.statusId === 3).length,
    completed: audits.filter(a => a.statusId === 4).length,
  };

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Audits</h3>
          <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Internal Audit Management | eQMS</title>
        <meta name="description" content="Comprehensive ISO 13485:2016 internal audit scheduling, execution, and CAPA integration system" />
      </Helmet>

      <div className="container py-8 space-y-8">
        <PageHeader
          title="Internal Audit Management"
          description="Intelligent ISO 13485:2016 audit scheduling with dynamic checklists and automatic CAPA integration"
          actions={
            <div className="flex space-x-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Button>
              <Link href="/internal-audit/schedule">
                <Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Sparkles className="h-4 w-4" />
                  <span>Schedule New Audit</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Enhanced Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Audits</p>
                  <p className="text-3xl font-bold text-blue-900">{metrics.total}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Scheduled</p>
                  <p className="text-3xl font-bold text-purple-900">{metrics.scheduled}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">In Progress</p>
                  <p className="text-3xl font-bold text-amber-900">{metrics.inProgress}</p>
                </div>
                <Users className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Completed</p>
                  <p className="text-3xl font-bold text-green-900">{metrics.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search audits by title, scope, or standard..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-white">
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
                  <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="1">Management Review</SelectItem>
                    <SelectItem value="2">Design & Development</SelectItem>
                    <SelectItem value="3">Purchasing & Supplier</SelectItem>
                    <SelectItem value="4">Production & Service</SelectItem>
                    <SelectItem value="5">Technical File</SelectItem>
                    <SelectItem value="6">Risk Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Listing */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAudits.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAudits.map((audit) => (
                  <AuditCard key={audit.id} audit={audit} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Audits Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by scheduling your first internal audit."}
                </p>
                <Link href="/internal-audit/schedule">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule New Audit
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {/* List view implementation would go here */}
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">List View</h3>
              <p className="text-gray-500">Enhanced list view coming soon with advanced sorting and filtering.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}