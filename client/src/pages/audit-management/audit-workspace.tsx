import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { 
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardList,
  Target,
  Settings,
  Plus,
  Edit,
  Save,
  X,
  ArrowLeft,
  Play,
  Pause,
  StopCircle,
  Eye,
  Download,
  Upload,
  MessageSquare,
  Activity,
  Shield,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Audit phases for workflow management
const auditPhases = [
  {
    id: 1,
    name: "Planning",
    description: "Define audit scope, objectives, and plan",
    icon: Calendar,
    color: "bg-blue-100 text-blue-800",
    activities: ["Scope Definition", "Team Assignment", "Schedule Planning", "Resource Allocation"]
  },
  {
    id: 2,
    name: "Preparation",
    description: "Prepare checklists, protocols, and documentation",
    icon: ClipboardList,
    color: "bg-purple-100 text-purple-800",
    activities: ["Checklist Creation", "Protocol Review", "Document Preparation", "Team Briefing"]
  },
  {
    id: 3,
    name: "Execution",
    description: "Conduct audit activities and collect evidence",
    icon: Play,
    color: "bg-amber-100 text-amber-800",
    activities: ["Opening Meeting", "Evidence Collection", "Interviews", "Observation"]
  },
  {
    id: 4,
    name: "Reporting",
    description: "Document findings and prepare audit report",
    icon: FileText,
    color: "bg-orange-100 text-orange-800",
    activities: ["Finding Analysis", "Report Drafting", "Review Process", "Final Report"]
  },
  {
    id: 5,
    name: "Follow-up",
    description: "Track corrective actions and close audit",
    icon: Target,
    color: "bg-green-100 text-green-800",
    activities: ["CAPA Tracking", "Effectiveness Review", "Closure Activities", "Lessons Learned"]
  }
];

const auditStatusConfig = {
  1: { label: "Planning", color: "bg-blue-100 text-blue-800", icon: Calendar },
  2: { label: "Scheduled", color: "bg-purple-100 text-purple-800", icon: Clock },
  3: { label: "In Progress", color: "bg-amber-100 text-amber-800", icon: Users },
  4: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  5: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: Target }
};

export default function AuditWorkspace() {
  const [match, params] = useRoute("/audit-management/audit/:id");
  const auditId = params?.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [activePhase, setActivePhase] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch audit details
  const { data: audit, isLoading } = useQuery({
    queryKey: ["/api/audits", auditId],
    enabled: !!auditId,
  });

  // Fetch audit checklist
  const { data: checklist = [] } = useQuery({
    queryKey: ["/api/audits", auditId, "checklist"],
    enabled: !!auditId,
  });

  // Type-safe audit data with fallbacks
  const auditData = audit as any || {};
  const checklistData = Array.isArray(checklist) ? checklist as any[] : [];

  // Update audit mutation
  const updateAuditMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/audits/${auditId}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId] });
      setIsEditingDetails(false);
      toast({
        title: "Audit Updated",
        description: "Audit details have been updated successfully.",
      });
    },
  });

  // Phase transition mutation
  const phaseTransitionMutation = useMutation({
    mutationFn: (phaseId: number) => apiRequest(`/api/audits/${auditId}/phase`, "PUT", { phaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId] });
      toast({
        title: "Phase Updated",
        description: "Audit phase has been updated successfully.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Audit Not Found</h3>
        <p className="text-gray-600 mb-6">The requested audit could not be found.</p>
        <Link href="/audit-management">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audit Center
          </Button>
        </Link>
      </div>
    );
  }

  const status = auditStatusConfig[audit.statusId as keyof typeof auditStatusConfig];
  const StatusIcon = status?.icon || Target;
  const currentPhase = auditPhases.find(p => p.id === activePhase) || auditPhases[0];

  const calculateProgress = () => {
    const completedItems = checklist.filter((item: any) => item.response).length;
    return checklist.length > 0 ? Math.round((completedItems / checklist.length) * 100) : 0;
  };

  const handleUpdateAudit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const updateData = {
      title: formData.get('title'),
      scope: formData.get('scope'),
      description: formData.get('description'),
      leadAuditorName: formData.get('leadAuditorName'),
      auditLocation: formData.get('auditLocation'),
    };

    updateAuditMutation.mutate(updateData);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{`${audit.title || "Audit"} - Audit Workspace - eQMS`}</title>
        <meta name="description" content={`Audit workspace for ${audit.title || "audit"} with comprehensive workflow management.`} />
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/audit-management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audit Center
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{audit.title}</h1>
            <p className="text-gray-600">{audit.auditId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={status?.color || "bg-gray-100 text-gray-800"}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status?.label || "Unknown"}
          </Badge>
          <Button
            onClick={() => setIsEditingDetails(true)}
            size="sm"
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Overall Progress</p>
                <p className="text-2xl font-bold text-blue-900">{calculateProgress()}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Current Phase</p>
                <p className="text-lg font-bold text-purple-900">{currentPhase.name}</p>
              </div>
              <currentPhase.icon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Checklist Items</p>
                <p className="text-2xl font-bold text-amber-900">{checklist.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Lead Auditor</p>
                <p className="text-lg font-bold text-green-900">{audit.leadAuditorName || "Unassigned"}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Phase Progress</span>
              <span className="text-sm text-gray-600">{activePhase} of {auditPhases.length}</span>
            </div>
            <Progress value={(activePhase / auditPhases.length) * 100} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {auditPhases.map((phase, index) => {
                const PhaseIcon = phase.icon;
                const isActive = phase.id === activePhase;
                const isCompleted = phase.id < activePhase;
                
                return (
                  <div
                    key={phase.id}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : isCompleted
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setActivePhase(phase.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <PhaseIcon className={`h-5 w-5 ${
                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                      }`} />
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <h4 className="font-medium text-sm mb-1">{phase.name}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{phase.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Details</CardTitle>
                <CardDescription>
                  Key information about this audit program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Scope</Label>
                  <p className="text-sm text-gray-600 mt-1">{audit.scope || "No scope defined"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{audit.description || "No description provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm text-gray-600 mt-1">{audit.auditLocation || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Standard References</Label>
                  <p className="text-sm text-gray-600 mt-1">{audit.standardReference || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Phase Activities</CardTitle>
                <CardDescription>
                  {currentPhase.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentPhase.activities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm font-medium">{activity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  {activePhase > 1 && (
                    <Button 
                      onClick={() => phaseTransitionMutation.mutate(activePhase - 1)}
                      variant="outline" 
                      size="sm"
                    >
                      Previous Phase
                    </Button>
                  )}
                  {activePhase < auditPhases.length && (
                    <Button 
                      onClick={() => phaseTransitionMutation.mutate(activePhase + 1)}
                      size="sm"
                    >
                      Next Phase
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Audit Checklist</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {checklist.filter((item: any) => item.response).length} of {checklist.length} completed
                  </span>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklist.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Checklist Items</h3>
                  <p className="text-gray-600 mb-4">Create checklist items to guide your audit process.</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {checklist.map((item: any, index: number) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{item.questionText}</h4>
                          {item.regulationClause && (
                            <p className="text-sm text-gray-600 mb-2">
                              Reference: {item.regulationClause}
                            </p>
                          )}
                          {item.response ? (
                            <div className="bg-green-50 p-3 rounded">
                              <p className="text-sm">{item.response}</p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm text-gray-500">Awaiting response...</p>
                            </div>
                          )}
                        </div>
                        <Badge variant={item.response ? "default" : "secondary"}>
                          {item.response ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <Card>
            <CardHeader>
              <CardTitle>Audit Findings</CardTitle>
              <CardDescription>
                Document findings, non-conformances, and opportunities for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Findings Yet</h3>
                <p className="text-gray-600 mb-4">Findings will be documented during audit execution.</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Finding
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Audit Documents</CardTitle>
              <CardDescription>
                Manage audit-related documents, evidence, and attachments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Uploaded</h3>
                <p className="text-gray-600 mb-4">Upload documents, evidence, and supporting materials.</p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Audit Team</CardTitle>
              <CardDescription>
                Manage audit team members and their responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{audit.leadAuditorName || "Unassigned"}</h4>
                      <p className="text-sm text-gray-600">Lead Auditor</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">Add additional team members</p>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Details Dialog */}
      <Dialog open={isEditingDetails} onOpenChange={setIsEditingDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Audit Details</DialogTitle>
            <DialogDescription>
              Update audit information and configuration
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAudit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Audit Title</Label>
              <Input 
                id="edit-title" 
                name="title" 
                defaultValue={audit.title} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-leadAuditorName">Lead Auditor</Label>
                <Input 
                  id="edit-leadAuditorName" 
                  name="leadAuditorName" 
                  defaultValue={audit.leadAuditorName || ""} 
                />
              </div>
              <div>
                <Label htmlFor="edit-auditLocation">Location</Label>
                <Input 
                  id="edit-auditLocation" 
                  name="auditLocation" 
                  defaultValue={audit.auditLocation || ""} 
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-scope">Scope</Label>
              <Textarea 
                id="edit-scope" 
                name="scope" 
                defaultValue={audit.scope || ""} 
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                name="description" 
                defaultValue={audit.description || ""} 
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditingDetails(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAuditMutation.isPending}>
                {updateAuditMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}