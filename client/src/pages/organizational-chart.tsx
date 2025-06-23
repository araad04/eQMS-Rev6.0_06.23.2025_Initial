import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Eye,
  UserCheck,
  Building2,
  TrendingUp,
  Shield,
  FileText,
  Clock
} from "lucide-react";

// Form schemas for validation
const positionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  level: z.number().min(1, "Level must be at least 1"),
  parentPositionId: z.number().optional(),
  responsibilities: z.string().optional(),
  requiredQualifications: z.string().optional(),
});

const structureFormSchema = z.object({
  positionId: z.number().min(1, "Position is required"),
  userId: z.number().optional(),
  reportingToId: z.number().optional(),
  delegatedAuthority: z.string().optional(),
  budgetAuthority: z.string().optional(),
  signatureAuthority: z.string().optional(),
});

const trainingAssignmentSchema = z.object({
  userId: z.number().min(1, "Employee is required"),
  trainingModuleId: z.number().min(1, "Training module is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high"]),
  notes: z.string().optional(),
});

type PositionFormData = z.infer<typeof positionFormSchema>;
type StructureFormData = z.infer<typeof structureFormSchema>;
type TrainingAssignmentData = z.infer<typeof trainingAssignmentSchema>;

// Custom node component for organizational positions
const OrganizationalNode = ({ data }: { data: any }) => {
  const { position, user, isVacant } = data;
  
  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 min-w-[200px] ${
      isVacant ? 'bg-gray-50 border-gray-300' : 'bg-white border-blue-300'
    }`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="text-center">
        <div className="font-semibold text-sm text-gray-900">
          {position?.title || 'Unknown Position'}
        </div>
        <div className="text-xs text-gray-600 mb-2">
          {position?.department || 'No Department'}
        </div>
        
        {!isVacant && user ? (
          <div className="text-xs">
            <div className="font-medium text-blue-700">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-gray-500">{user.email}</div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {user.role}
            </Badge>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs">
            Vacant
          </Badge>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  organizational: OrganizationalNode,
};

export default function OrganizationalChart() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTab, setSelectedTab] = useState("chart");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDelegationDialog, setShowDelegationDialog] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [selectedEmployeeForTraining, setSelectedEmployeeForTraining] = useState<any>(null);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizational structure
  const { data: structure = [], isLoading } = useQuery({
    queryKey: ["/api/organizational/structure"],
  });

  // Fetch positions hierarchy
  const { data: positions = [] } = useQuery({
    queryKey: ["/api/organizational/positions/hierarchy"],
  });

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ["/api/organizational/metrics"],
  });

  // Fetch approval rules
  const { data: approvals = [] } = useQuery({
    queryKey: ["/api/organizational/approvals"],
  });

  // Fetch delegations
  const { data: delegations = [] } = useQuery({
    queryKey: ["/api/organizational/delegations"],
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/organizational/departments"],
  });

  // Fetch training modules for assignment
  const { data: trainingModules = [] } = useQuery({
    queryKey: ["/api/training/modules"],
  });

  // Fetch users for training assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch training records for team training matrix
  const { data: trainingRecords = [] } = useQuery({
    queryKey: ["/api/training/records"],
  });

  // Fetch document types
  const { data: documentTypes = [] } = useQuery({
    queryKey: ["/api/organizational/document-types"],
  });

  // Position form
  const positionForm = useForm<PositionFormData>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "",
      level: 1,
      responsibilities: "",
      requiredQualifications: "",
    },
  });

  // Structure form
  const structureForm = useForm<StructureFormData>({
    resolver: zodResolver(structureFormSchema),
    defaultValues: {
      positionId: 0,
      delegatedAuthority: "",
      budgetAuthority: "",
      signatureAuthority: "",
    },
  });

  // Create position mutation
  const createPositionMutation = useMutation({
    mutationFn: (data: PositionFormData) => apiRequest("/api/organizational/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, createdBy: 9999 }),
    }),
    onSuccess: () => {
      toast({ title: "Position created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/positions/hierarchy"] });
      setShowPositionDialog(false);
      positionForm.reset();
    },
    onError: (error: any) => {
      console.error("Position creation error:", error);
      toast({ title: "Failed to create position", variant: "destructive" });
    },
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<PositionFormData> }) =>
      apiRequest(`/api/organizational/positions/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/positions/hierarchy"] });
      setShowPositionDialog(false);
      setEditingPosition(null);
      setIsEditMode(false);
      toast({ title: "Position Updated", description: "Position details have been updated successfully" });
    },
  });

  // Update structure mutation
  const updateStructureMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<StructureFormData> }) =>
      apiRequest(`/api/organizational/structure/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/metrics"] });
      setShowStructureDialog(false);
      setEditingStructure(null);
      toast({ title: "Structure Updated", description: "Organizational structure has been updated successfully" });
    },
  });

  // Create approval rule mutation
  const createApprovalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/organizational/approvals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: "Approval rule created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/approvals"] });
      setShowApprovalDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to create approval rule", variant: "destructive" });
    },
  });

  // Create delegation mutation
  const createDelegationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/organizational/delegations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: "Delegation created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/delegations"] });
      setShowDelegationDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to create delegation", variant: "destructive" });
    },
  });

  // Create training assignment mutation
  const assignTrainingMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/training/records", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: "Training assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/training/records"] });
      setShowTrainingDialog(false);
      setSelectedEmployeeForTraining(null);
    },
    onError: () => {
      toast({ title: "Failed to assign training", variant: "destructive" });
    },
  });

  // Convert structure data to React Flow nodes and edges
  const convertToFlowData = useCallback(() => {
    if (!structure.length) return;

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Group by level for positioning
    const levelGroups: { [key: number]: any[] } = {};
    
    structure.forEach((item: any) => {
      const level = item.position?.level || 1;
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(item);
    });

    // Create nodes
    let yOffset = 0;
    Object.keys(levelGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach((level) => {
      const items = levelGroups[parseInt(level)];
      const xSpacing = 300;
      const startX = -(items.length - 1) * xSpacing / 2;

      items.forEach((item: any, index: number) => {
        flowNodes.push({
          id: item.id.toString(),
          type: 'organizational',
          position: { x: startX + (index * xSpacing), y: yOffset },
          data: {
            position: item.position,
            user: item.user,
            isVacant: !item.user,
          },
        });
      });

      yOffset += 150;
    });

    // Create edges based on reporting relationships
    structure.forEach((item: any) => {
      if (item.reportingToId) {
        flowEdges.push({
          id: `e${item.reportingToId}-${item.id}`,
          source: item.reportingToId.toString(),
          target: item.id.toString(),
          type: 'smoothstep',
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [structure, setNodes, setEdges]);

  useEffect(() => {
    convertToFlowData();
  }, [convertToFlowData]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleCreatePosition = (formData: FormData) => {
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      department: formData.get('department') as string,
      level: parseInt(formData.get('level') as string),
      parentPositionId: formData.get('parentPositionId') ? parseInt(formData.get('parentPositionId') as string) : null,
      responsibilities: (formData.get('responsibilities') as string)?.split('\n').filter(Boolean) || [],
      requiredQualifications: (formData.get('qualifications') as string)?.split('\n').filter(Boolean) || [],
      createdBy: 9999, // Should come from auth context
    };

    createPositionMutation.mutate(data);
  };

  const handleCreateApproval = (formData: FormData) => {
    const data = {
      structureId: parseInt(formData.get('structureId') as string),
      documentType: formData.get('documentType') as string,
      approvalLevel: parseInt(formData.get('approvalLevel') as string),
      canApprove: formData.get('canApprove') === 'on',
      canReview: formData.get('canReview') === 'on',
      canDelegate: formData.get('canDelegate') === 'on',
      conditions: formData.get('conditions') as string,
    };

    createApprovalMutation.mutate(data);
  };

  const handleCreateDelegation = (formData: FormData) => {
    const data = {
      delegatorId: parseInt(formData.get('delegatorId') as string),
      delegateeId: parseInt(formData.get('delegateeId') as string),
      delegationType: formData.get('delegationType') as string,
      authority: (formData.get('authority') as string)?.split('\n').filter(Boolean) || [],
      startDate: new Date(formData.get('startDate') as string),
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : null,
      reason: formData.get('reason') as string,
      createdBy: 9999, // Should come from auth context
    };

    createDelegationMutation.mutate(data);
  };

  // Handle user assignment
  const handleAssignUser = (structureItem: any) => {
    toast({ 
      title: "User Assignment", 
      description: `Opening user assignment for ${structureItem.position?.title}` 
    });
    // This would typically open a dialog to assign/reassign users
  };

  // Handle position settings
  const handlePositionSettings = (structureItem: any) => {
    toast({ 
      title: "Position Settings", 
      description: `Opening settings for ${structureItem.position?.title}` 
    });
    // This would typically open a dialog to edit position settings
  };

  // Handle view position details
  const handleViewPosition = (position: any) => {
    toast({ 
      title: "Position Details", 
      description: `Viewing details for ${position.title}` 
    });
    // This would typically open a modal with full position details
  };

  // Handle edit position
  const handleEditPosition = (position: any) => {
    setEditingPosition(position);
    positionForm.reset({
      title: position.title || "",
      description: position.description || "",
      department: position.department || "",
      level: position.level || 1,
      parentPositionId: position.parentPositionId,
      responsibilities: Array.isArray(position.responsibilities) 
        ? position.responsibilities.join(", ") 
        : (position.responsibilities || ""),
      requiredQualifications: Array.isArray(position.requiredQualifications) 
        ? position.requiredQualifications.join(", ") 
        : (position.requiredQualifications || ""),
    });
    setShowPositionDialog(true);
  };

  // Handle edit structure
  const handleEditStructure = (structureItem: any) => {
    setEditingStructure(structureItem);
    structureForm.reset({
      positionId: structureItem.positionId || 0,
      userId: structureItem.userId,
      reportingToId: structureItem.reportingToId,
      delegatedAuthority: Array.isArray(structureItem.delegatedAuthority) 
        ? structureItem.delegatedAuthority.join(", ") 
        : (structureItem.delegatedAuthority || ""),
      budgetAuthority: structureItem.budgetAuthority || "",
      signatureAuthority: Array.isArray(structureItem.signatureAuthority) 
        ? structureItem.signatureAuthority.join(", ") 
        : (structureItem.signatureAuthority || ""),
    });
    setShowStructureDialog(true);
  };

  // Handle save position
  const onSubmitPosition = (data: PositionFormData) => {
    if (editingPosition) {
      // Convert string arrays back to proper format
      const processedData = {
        ...data,
        responsibilities: data.responsibilities ? data.responsibilities.split(", ").filter(r => r.trim()) : [],
        requiredQualifications: data.requiredQualifications ? data.requiredQualifications.split(", ").filter(r => r.trim()) : [],
      };
      updatePositionMutation.mutate({ id: editingPosition.id, updates: processedData });
    } else {
      const processedData = {
        ...data,
        responsibilities: data.responsibilities ? data.responsibilities.split(", ").filter(r => r.trim()) : [],
        requiredQualifications: data.requiredQualifications ? data.requiredQualifications.split(", ").filter(r => r.trim()) : [],
      };
      createPositionMutation.mutate(processedData);
    }
  };

  // Handle save structure
  const onSubmitStructure = (data: StructureFormData) => {
    if (editingStructure) {
      // Convert string arrays back to proper format
      const processedData = {
        ...data,
        delegatedAuthority: data.delegatedAuthority ? data.delegatedAuthority.split(", ").filter(r => r.trim()) : [],
        signatureAuthority: data.signatureAuthority ? data.signatureAuthority.split(", ").filter(r => r.trim()) : [],
      };
      updateStructureMutation.mutate({ id: editingStructure.id, updates: processedData });
    }
  };

  // Handle save changes (legacy for display)
  const handleSaveChanges = () => {
    setIsEditMode(false);
    setEditingPosition(null);
    toast({ 
      title: "Changes Saved", 
      description: "Position updates have been saved successfully" 
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingPosition(null);
    setShowPositionDialog(false);
    setShowStructureDialog(false);
    toast({ 
      title: "Edit Cancelled", 
      description: "Changes have been discarded" 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizational chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organizational Chart</h1>
          <p className="text-muted-foreground mt-2">
            Interactive organizational structure management with role-based access control
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Position</DialogTitle>
                <DialogDescription>
                  Define a new organizational position with responsibilities and qualifications.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreatePosition(formData);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Position Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="level">Organizational Level</Label>
                    <Input id="level" name="level" type="number" min="1" required />
                  </div>
                  <div>
                    <Label htmlFor="parentPositionId">Reports To (Optional)</Label>
                    <Select name="parentPositionId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos: any) => (
                          <SelectItem key={pos.id} value={pos.id.toString()}>
                            {pos.title} - {pos.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="responsibilities">Key Responsibilities (one per line)</Label>
                  <Textarea id="responsibilities" name="responsibilities" rows={4} />
                </div>
                <div>
                  <Label htmlFor="qualifications">Required Qualifications (one per line)</Label>
                  <Textarea id="qualifications" name="qualifications" rows={4} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPositionMutation.isPending}>
                    {createPositionMutation.isPending ? "Creating..." : "Create Position"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPositions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filled Positions</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.filledPositions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacant Positions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.vacantPositions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.utilizationRate?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="chart">Org Chart</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="training">Team Training</TabsTrigger>
          <TabsTrigger value="approvals">Approval Matrix</TabsTrigger>
          <TabsTrigger value="delegations">Delegations</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Org Chart</h3>
            <div className="flex gap-2">
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? "Save Changes" : "Edit Mode"}
              </Button>
            </div>
          </div>
          
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position Management</CardTitle>
              <CardDescription>
                Manage organizational positions, their hierarchy, and requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Edit Mode Controls */}
              {isEditMode && editingPosition && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-yellow-800">
                        Editing: {editingPosition.title}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveChanges}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {positions.map((position: any) => (
                  <div 
                    key={position.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                      isEditMode && editingPosition?.id === position.id 
                        ? 'border-yellow-300 bg-yellow-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold">{position.title}</h4>
                      <p className="text-sm text-gray-600">{position.department} • Level {position.level}</p>
                      {position.description && (
                        <p className="text-sm text-gray-500 mt-1">{position.description}</p>
                      )}
                      {position.responsibilities && position.responsibilities.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Key Responsibilities:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {position.responsibilities.slice(0, 3).map((resp: string, idx: number) => (
                              <li key={idx}>{resp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {isEditMode && editingPosition?.id === position.id && (
                        <div className="mt-3 p-3 bg-white border border-yellow-200 rounded-md">
                          <p className="text-xs font-medium text-yellow-800 mb-2">Edit Mode Active</p>
                          <p className="text-xs text-gray-600">
                            Position details can be modified. Use Save Changes to confirm or Cancel to discard.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewPosition(position);
                        }}
                        disabled={isEditMode && editingPosition?.id !== position.id}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={isEditMode && editingPosition?.id === position.id ? "default" : "outline"}
                        size="sm" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isEditMode && editingPosition?.id === position.id) {
                            handleCancelEdit();
                          } else {
                            handleEditPosition(position);
                          }
                        }}
                        disabled={isEditMode && editingPosition?.id !== position.id}
                      >
                        {isEditMode && editingPosition?.id === position.id ? (
                          <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                            Editing
                          </>
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organizational Structure</CardTitle>
              <CardDescription>
                Current assignments and reporting relationships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {structure.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{item.position?.title}</h4>
                      <p className="text-sm text-gray-600">{item.position?.department}</p>
                      {item.user ? (
                        <p className="text-sm text-blue-600">
                          {item.user.firstName} {item.user.lastName}
                        </p>
                      ) : (
                        <Badge variant="outline">Vacant</Badge>
                      )}
                      {item.delegatedAuthority && item.delegatedAuthority.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Delegated Authority:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.delegatedAuthority.map((auth: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{auth}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditPosition(item.position)}
                        title="Edit Position"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditStructure(item)}
                        title="Edit Structure & Authority"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePositionSettings(item);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Training Management</CardTitle>
              <CardDescription>
                Assign and track training programs for teams and departments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Training Assignment Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Assign Training to Teams
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="training-department">Select Department</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quality">Quality Assurance</SelectItem>
                            <SelectItem value="regulatory">Regulatory Affairs</SelectItem>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="clinical">Clinical Affairs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="training-program">Training Program</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select training program" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iso13485">ISO 13485:2016 QMS Training</SelectItem>
                            <SelectItem value="21cfr">21 CFR Part 11 Compliance</SelectItem>
                            <SelectItem value="design-control">Design Control Training</SelectItem>
                            <SelectItem value="risk-management">Risk Management ISO 14971</SelectItem>
                            <SelectItem value="capa">CAPA System Training</SelectItem>
                            <SelectItem value="audit">Internal Audit Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="due-date">Due Date</Label>
                        <Input type="date" id="due-date" />
                      </div>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Training
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Training Status Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-green-800">ISO 13485 Training</p>
                            <p className="text-sm text-green-600">Quality Assurance Team</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium text-yellow-800">CAPA System Training</p>
                            <p className="text-sm text-yellow-600">Engineering Team</p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-red-800">Design Control Training</p>
                            <p className="text-sm text-red-600">Regulatory Affairs Team</p>
                          </div>
                          <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Team Training Matrix */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Team Training Matrix</CardTitle>
                        <CardDescription>
                          Track training completion across teams and departments
                        </CardDescription>
                      </div>
                      <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Training
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Training to Employee</DialogTitle>
                            <DialogDescription>
                              Select an employee and training module to create a training assignment.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = {
                              userId: parseInt(formData.get('userId') as string),
                              trainingModuleId: parseInt(formData.get('trainingModuleId') as string),
                              dueDate: formData.get('dueDate') as string,
                              priority: formData.get('priority') as string,
                              notes: formData.get('notes') as string,
                              status: 'assigned',
                              assignedBy: 9999 // Current user ID
                            };
                            assignTrainingMutation.mutate(data);
                          }} className="space-y-4">
                            <div>
                              <Label htmlFor="userId">Organizational Chart Employee</Label>
                              <Select name="userId" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select org chart employee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {structure.filter(item => item.user).length > 0 ? (
                                    structure.filter(item => item.user).map((item: any) => (
                                      <SelectItem key={item.user.id} value={item.user.id.toString()}>
                                        {item.user.firstName} {item.user.lastName} - {item.position?.title}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    users.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.firstName} {user.lastName} ({user.department})
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500 mt-1">
                                {structure.filter(item => item.user).length > 0 
                                  ? "Select from employees assigned to organizational positions"
                                  : "No employees assigned to org chart positions yet - showing all users"
                                }
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="trainingModuleId">Training Module</Label>
                              <Select name="trainingModuleId" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select training module" />
                                </SelectTrigger>
                                <SelectContent>
                                  {trainingModules.map((module: any) => (
                                    <SelectItem key={module.id} value={module.id.toString()}>
                                      {module.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="dueDate">Due Date</Label>
                              <Input 
                                type="date" 
                                name="dueDate" 
                                required 
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div>
                              <Label htmlFor="priority">Priority</Label>
                              <Select name="priority" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="notes">Notes (Optional)</Label>
                              <Textarea 
                                name="notes" 
                                placeholder="Additional notes or instructions..."
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setShowTrainingDialog(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={assignTrainingMutation.isPending}>
                                {assignTrainingMutation.isPending ? "Assigning..." : "Assign Training"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Team/Department</th>
                            <th className="text-center p-3 font-medium">ISO 13485</th>
                            <th className="text-center p-3 font-medium">21 CFR Part 11</th>
                            <th className="text-center p-3 font-medium">Design Control</th>
                            <th className="text-center p-3 font-medium">Risk Management</th>
                            <th className="text-center p-3 font-medium">CAPA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">Quality Assurance</td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-yellow-100 text-yellow-800">⧗</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">Regulatory Affairs</td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-red-100 text-red-800">✗</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-yellow-100 text-yellow-800">⧗</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">Engineering</td>
                            <td className="text-center p-3">
                              <Badge className="bg-yellow-100 text-yellow-800">⧗</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-gray-100 text-gray-800">-</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-yellow-100 text-yellow-800">⧗</Badge>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">Manufacturing</td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-gray-100 text-gray-800">-</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-gray-100 text-gray-800">-</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-yellow-100 text-yellow-800">⧗</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">✓</Badge>
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">⧗</Badge>
                        <span>In Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800">✗</Badge>
                        <span>Overdue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800">-</Badge>
                        <span>Not Required</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Approval Matrix</h3>
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Approval Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Approval Rule</DialogTitle>
                  <DialogDescription>
                    Define approval authorities for document types and processes.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreateApproval(formData);
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="structureId">Position Assignment</Label>
                    <Select name="structureId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {structure.map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.position?.title} - {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Vacant'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select name="documentType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type: string) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="approvalLevel">Approval Level</Label>
                    <Input id="approvalLevel" name="approvalLevel" type="number" min="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" name="canApprove" />
                        <span className="text-sm">Can Approve</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" name="canReview" />
                        <span className="text-sm">Can Review</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" name="canDelegate" />
                        <span className="text-sm">Can Delegate</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="conditions">Special Conditions</Label>
                    <Textarea id="conditions" name="conditions" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowApprovalDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createApprovalMutation.isPending}>
                      {createApprovalMutation.isPending ? "Creating..." : "Create Rule"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {approvals.length > 0 ? approvals.map((approval: any) => (
                  <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{approval.documentType}</h4>
                      <p className="text-sm text-gray-600">
                        Level {approval.approvalLevel} • {approval.position?.title}
                      </p>
                      <p className="text-sm text-blue-600">
                        {approval.user?.firstName} {approval.user?.lastName}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {approval.canApprove && <Badge variant="default" className="text-xs">Approve</Badge>}
                        {approval.canReview && <Badge variant="secondary" className="text-xs">Review</Badge>}
                        {approval.canDelegate && <Badge variant="outline" className="text-xs">Delegate</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No approval rules defined yet.</p>
                    <p className="text-sm text-gray-500">Create approval rules to define document approval workflows.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delegations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Authority Delegations</h3>
            <Dialog open={showDelegationDialog} onOpenChange={setShowDelegationDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Delegation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Authority Delegation</DialogTitle>
                  <DialogDescription>
                    Delegate authority from one position to another temporarily or permanently.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreateDelegation(formData);
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="delegatorId">Delegating From</Label>
                    <Select name="delegatorId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delegator" />
                      </SelectTrigger>
                      <SelectContent>
                        {structure.filter(item => item.user).map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.position?.title} - {item.user.firstName} {item.user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="delegateeId">Delegating To</Label>
                    <Select name="delegateeId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delegatee" />
                      </SelectTrigger>
                      <SelectContent>
                        {structure.filter(item => item.user).map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.position?.title} - {item.user.firstName} {item.user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="delegationType">Delegation Type</Label>
                    <Select name="delegationType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporary</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="specific-task">Specific Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="authority">Delegated Authorities (one per line)</Label>
                    <Textarea id="authority" name="authority" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input id="endDate" name="endDate" type="date" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for Delegation</Label>
                    <Textarea id="reason" name="reason" required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowDelegationDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createDelegationMutation.isPending}>
                      {createDelegationMutation.isPending ? "Creating..." : "Create Delegation"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {delegations.length > 0 ? delegations.map((delegation: any) => (
                  <div key={delegation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{delegation.delegationType} Delegation</h4>
                      <p className="text-sm text-gray-600">
                        From: {delegation.delegator?.user} ({delegation.delegator?.position})
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {delegation.delegatee?.user} ({delegation.delegatee?.position})
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{delegation.reason}</p>
                      {delegation.authority && delegation.authority.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {delegation.authority.map((auth: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{auth}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(delegation.startDate).toLocaleDateString()} - {
                            delegation.endDate ? new Date(delegation.endDate).toLocaleDateString() : 'Ongoing'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active delegations.</p>
                    <p className="text-sm text-gray-500">Create delegations to temporarily or permanently transfer authority.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Position Edit Dialog */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Edit Position" : "Create New Position"}
            </DialogTitle>
            <DialogDescription>
              {editingPosition 
                ? "Modify the position details below. Changes will create an audit trail entry."
                : "Create a new organizational position with detailed specifications."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...positionForm}>
            <form onSubmit={positionForm.handleSubmit(onSubmitPosition)} className="space-y-4">
              <FormField
                control={positionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quality Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={positionForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quality Assurance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={positionForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizational Level *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          placeholder="1-10" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={positionForm.control}
                  name="parentPositionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reports To</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (Top Level)</SelectItem>
                          {positions && Array.isArray(positions) && positions.map((pos: any) => (
                            <SelectItem key={pos.id} value={pos.id.toString()}>
                              {pos.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={positionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the role and its purpose within the organization..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={positionForm.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter responsibilities separated by commas (e.g., Quality planning, Risk assessment, Compliance monitoring)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={positionForm.control}
                name="requiredQualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Qualifications</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter qualifications separated by commas (e.g., Bachelor's degree, 5+ years experience, ISO 13485 knowledge)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePositionMutation.isPending || createPositionMutation.isPending}
                >
                  {(updatePositionMutation.isPending || createPositionMutation.isPending) 
                    ? "Saving..." 
                    : editingPosition ? "Update Position" : "Create Position"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Structure Edit Dialog */}
      <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organizational Structure</DialogTitle>
            <DialogDescription>
              Modify reporting relationships and authority assignments. Changes will create an audit trail entry.
            </DialogDescription>
          </DialogHeader>
          <Form {...structureForm}>
            <form onSubmit={structureForm.handleSubmit(onSubmitStructure)} className="space-y-4">
              <FormField
                control={structureForm.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions && Array.isArray(positions) && positions.map((pos: any) => (
                          <SelectItem key={pos.id} value={pos.id.toString()}>
                            {pos.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={structureForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned User</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user or leave vacant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vacant">Vacant Position</SelectItem>
                          <SelectItem value="1">John Smith</SelectItem>
                          <SelectItem value="2">Sarah Johnson</SelectItem>
                          <SelectItem value="3">Michael Brown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={structureForm.control}
                  name="reportingToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reports To</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supervisor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Direct Supervisor</SelectItem>
                          {structure && Array.isArray(structure) && structure
                            .filter((item: any) => item.user)
                            .map((item: any) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.position?.title} - {item.user?.firstName} {item.user?.lastName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={structureForm.control}
                name="delegatedAuthority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delegated Authority</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter delegated authorities separated by commas (e.g., Budget approval up to $10,000, Staff hiring decisions, Quality release authority)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={structureForm.control}
                  name="budgetAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Authority</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., $10,000 annual, $2,000 per transaction" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={structureForm.control}
                  name="signatureAuthority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signature Authority</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter signature authorities separated by commas (e.g., Quality documents, Training records, Supplier agreements)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateStructureMutation.isPending}
                >
                  {updateStructureMutation.isPending ? "Updating..." : "Update Structure"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}