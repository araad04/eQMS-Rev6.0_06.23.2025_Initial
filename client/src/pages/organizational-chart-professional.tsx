import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";

// Professional Type Definitions
interface OrganizationalPosition {
  id: number;
  title: string;
  department: string;
  level: number;
  description?: string;
  parentPositionId?: number;
  responsibilities: string[];
  requiredQualifications: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationalStructure {
  id: number;
  positionId: number;
  userId?: number;
  reportingToId?: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  delegatedAuthority: string[];
  budgetAuthority?: string;
  signatureAuthority: string[];
  position: OrganizationalPosition;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface OrganizationalMetrics {
  totalPositions: number;
  filledPositions: number;
  vacantPositions: number;
  utilizationRate: number;
  activeDelegations: number;
  departmentDistribution: Array<{
    department: string;
    count: number;
  }>;
}

// Professional Form Schemas with Enhanced Validation
const positionFormSchema = z.object({
  title: z.string()
    .min(2, "Position title must be at least 2 characters")
    .max(100, "Position title cannot exceed 100 characters"),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  department: z.string()
    .min(2, "Department name is required"),
  level: z.number()
    .min(1, "Organizational level must be at least 1")
    .max(10, "Organizational level cannot exceed 10"),
  parentPositionId: z.number().optional(),
  responsibilities: z.string()
    .max(1000, "Responsibilities cannot exceed 1000 characters")
    .optional(),
  requiredQualifications: z.string()
    .max(1000, "Required qualifications cannot exceed 1000 characters")
    .optional(),
});

const structureFormSchema = z.object({
  positionId: z.number().min(1, "Position selection is required"),
  userId: z.number().optional(),
  reportingToId: z.number().optional(),
  delegatedAuthority: z.string()
    .max(1000, "Delegated authority cannot exceed 1000 characters")
    .optional(),
  signatureAuthority: z.string()
    .max(1000, "Signature authority cannot exceed 1000 characters")
    .optional(),
});

type PositionFormData = z.infer<typeof positionFormSchema>;
type StructureFormData = z.infer<typeof structureFormSchema>;

// Professional Custom Node Component
const ProfessionalOrganizationalNode = ({ data }: { data: any }) => {
  const { position, user, isVacant, level } = data;
  
  const nodeColors = {
    1: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-800" },
    2: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800" },
    3: { bg: "bg-green-100", border: "border-green-300", text: "text-green-800" },
    4: { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-800" },
    default: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-800" }
  };
  
  const colors = nodeColors[level as keyof typeof nodeColors] || nodeColors.default;
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[220px] max-w-[280px] ${colors.bg} ${colors.border}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="text-center">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            Level {level}
          </Badge>
          {isVacant ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
        
        <h3 className={`font-semibold text-sm mb-1 ${colors.text}`}>
          {position?.title}
        </h3>
        
        <p className="text-xs text-gray-600 mb-2">
          {position?.department}
        </p>
        
        {user ? (
          <div className="text-xs">
            <p className="font-medium text-gray-800">
              {user.firstName} {user.lastName}
            </p>
          </div>
        ) : (
          <Badge variant="destructive" className="text-xs">
            Vacant
          </Badge>
        )}
        
        {position?.delegatedAuthority && position.delegatedAuthority.length > 0 && (
          <div className="mt-2">
            <Shield className="h-3 w-3 mx-auto text-blue-600" />
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Memoized node types to prevent React Flow warnings
const nodeTypes = {
  organizationalNode: ProfessionalOrganizationalNode,
};

export default function ProfessionalOrganizationalChart() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTab, setSelectedTab] = useState("chart");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<OrganizationalPosition | null>(null);
  const [editingStructure, setEditingStructure] = useState<OrganizationalStructure | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data Fetching with Professional Error Handling
  const { data: structure = [], isLoading: structureLoading, error: structureError } = useQuery<OrganizationalStructure[]>({
    queryKey: ["/api/organizational/structure"],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: positions = [], isLoading: positionsLoading, error: positionsError } = useQuery<OrganizationalPosition[]>({
    queryKey: ["/api/organizational/positions/hierarchy"],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<OrganizationalMetrics>({
    queryKey: ["/api/organizational/metrics"],
    retry: 3,
    retryDelay: 1000,
  });

  // Professional Form Configurations
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

  const structureForm = useForm<StructureFormData>({
    resolver: zodResolver(structureFormSchema),
    defaultValues: {
      positionId: 0,
      delegatedAuthority: "",
      signatureAuthority: "",
    },
  });

  // Professional Mutation Handlers with Comprehensive Error Handling
  const createPositionMutation = useMutation({
    mutationFn: async (data: PositionFormData) => {
      const processedData = {
        ...data,
        responsibilities: data.responsibilities ? data.responsibilities.split(",").map(r => r.trim()).filter(Boolean) : [],
        requiredQualifications: data.requiredQualifications ? data.requiredQualifications.split(",").map(r => r.trim()).filter(Boolean) : [],
        parentPositionId: data.parentPositionId || undefined,
        createdBy: 9999, // Current user ID
        isActive: true,
      };
      
      return apiRequest("POST", "/api/organizational/positions", processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/positions/hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/metrics"] });
      setShowPositionDialog(false);
      positionForm.reset();
      toast({ 
        title: "Success", 
        description: "Position created successfully with audit trail entry." 
      });
    },
    onError: (error: any) => {
      console.error("Position creation error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to create position. Please check your input and try again.",
        variant: "destructive" 
      });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<PositionFormData> }) => {
      const processedUpdates = {
        ...data.updates,
        responsibilities: data.updates.responsibilities 
          ? data.updates.responsibilities.split(",").map(r => r.trim()).filter(Boolean) 
          : undefined,
        requiredQualifications: data.updates.requiredQualifications 
          ? data.updates.requiredQualifications.split(",").map(r => r.trim()).filter(Boolean) 
          : undefined,
        parentPositionId: data.updates.parentPositionId || undefined,
        updatedAt: new Date().toISOString(),
      };
      
      return apiRequest("PUT", `/api/organizational/positions/${data.id}`, processedUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/positions/hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/metrics"] });
      setShowPositionDialog(false);
      setEditingPosition(null);
      setIsEditMode(false);
      toast({ 
        title: "Success", 
        description: "Position updated successfully with audit trail entry." 
      });
    },
    onError: (error: any) => {
      console.error("Position update error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update position. Please check your input and try again.",
        variant: "destructive" 
      });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (positionId: number) => {
      return apiRequest("DELETE", `/api/organizational/positions/${positionId}`, { userId: 9999 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/positions/hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/metrics"] });
      toast({ 
        title: "Success", 
        description: "Position deleted successfully." 
      });
    },
    onError: (error: any) => {
      console.error("Position deletion error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete position. It may be assigned or have dependencies.",
        variant: "destructive" 
      });
    },
  });

  const updateStructureMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<StructureFormData> }) => {
      const processedUpdates = {
        ...data.updates,
        delegatedAuthority: data.updates.delegatedAuthority 
          ? data.updates.delegatedAuthority.split(",").map(r => r.trim()).filter(Boolean) 
          : undefined,
        signatureAuthority: data.updates.signatureAuthority 
          ? data.updates.signatureAuthority.split(",").map(r => r.trim()).filter(Boolean) 
          : undefined,
        updatedAt: new Date().toISOString(),
      };
      
      return apiRequest("PUT", `/api/organizational/structure/${data.id}`, processedUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizational/metrics"] });
      setShowStructureDialog(false);
      setEditingStructure(null);
      toast({ 
        title: "Success", 
        description: "Organizational structure updated successfully with audit trail entry." 
      });
    },
    onError: (error: any) => {
      console.error("Structure update error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update organizational structure. Please check your input and try again.",
        variant: "destructive" 
      });
    },
  });

  // Professional React Flow Configuration
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!structure.length) return { flowNodes: [], flowEdges: [] };

    const flowNodes: Node[] = structure.map((item, index) => ({
      id: item.id.toString(),
      type: 'organizationalNode',
      position: { 
        x: (index % 4) * 300 + 50, 
        y: (item.position.level - 1) * 150 + 50 
      },
      data: {
        position: item.position,
        user: item.user,
        isVacant: !item.user,
        level: item.position.level,
        delegatedAuthority: item.delegatedAuthority,
      },
    }));

    const flowEdges: Edge[] = structure
      .filter(item => item.reportingToId)
      .map(item => ({
        id: `e-${item.reportingToId}-${item.id}`,
        source: item.reportingToId!.toString(),
        target: item.id.toString(),
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      }));

    return { flowNodes, flowEdges };
  }, [structure]);

  // Professional Event Handlers
  const handleEditPosition = useCallback((position: OrganizationalPosition) => {
    setEditingPosition(position);
    positionForm.reset({
      title: position.title,
      description: position.description || "",
      department: position.department,
      level: position.level,
      parentPositionId: position.parentPositionId,
      responsibilities: Array.isArray(position.responsibilities) 
        ? position.responsibilities.join(", ") 
        : "",
      requiredQualifications: Array.isArray(position.requiredQualifications) 
        ? position.requiredQualifications.join(", ") 
        : "",
    });
    setShowPositionDialog(true);
  }, [positionForm]);

  const handleEditStructure = useCallback((structureItem: OrganizationalStructure) => {
    setEditingStructure(structureItem);
    structureForm.reset({
      positionId: structureItem.positionId,
      userId: structureItem.userId,
      reportingToId: structureItem.reportingToId,
      delegatedAuthority: Array.isArray(structureItem.delegatedAuthority) 
        ? structureItem.delegatedAuthority.join(", ") 
        : "",
      signatureAuthority: Array.isArray(structureItem.signatureAuthority) 
        ? structureItem.signatureAuthority.join(", ") 
        : "",
    });
    setShowStructureDialog(true);
  }, [structureForm]);

  const handleCreateNewPosition = useCallback(() => {
    setEditingPosition(null);
    positionForm.reset();
    setShowPositionDialog(true);
  }, [positionForm]);

  const onSubmitPosition = useCallback((data: PositionFormData) => {
    if (editingPosition) {
      updatePositionMutation.mutate({ id: editingPosition.id, updates: data });
    } else {
      createPositionMutation.mutate(data);
    }
  }, [editingPosition, updatePositionMutation, createPositionMutation]);

  const onSubmitStructure = useCallback((data: StructureFormData) => {
    if (editingStructure) {
      updateStructureMutation.mutate({ id: editingStructure.id, updates: data });
    }
  }, [editingStructure, updateStructureMutation]);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditingPosition(null);
    setEditingStructure(null);
    setShowPositionDialog(false);
    setShowStructureDialog(false);
  }, []);

  // Professional Loading and Error States
  if (structureLoading || positionsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading organizational data...</p>
        </div>
      </div>
    );
  }

  if (structureError || positionsError || metricsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <p className="text-sm text-red-600">Failed to load organizational data</p>
          <Button 
            variant="outline" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/organizational"] });
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizational Chart</h1>
          <p className="text-gray-600 mt-1">
            ISO 13485:2016 compliant organizational structure management with full audit trail
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCreateNewPosition} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Position
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Professional Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Positions</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalPositions}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Filled Positions</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.filledPositions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vacant Positions</p>
                  <p className="text-2xl font-bold text-amber-600">{metrics.vacantPositions}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(metrics.utilizationRate * 100)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Tabs Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chart">Org Chart</TabsTrigger>
          <TabsTrigger value="management">Position Management</TabsTrigger>
        </TabsList>



        <TabsContent value="chart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Organizational Chart</CardTitle>
              <CardDescription>
                Visual representation of reporting relationships and organizational hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '600px', width: '100%' }}>
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <MiniMap />
                  <Controls />
                  <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Position Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Position Definitions
                </CardTitle>
                <CardDescription>Manage organizational positions and their requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {positions.map((position) => (
                    <div key={position.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{position.title}</h4>
                          <Badge variant="outline" className="text-xs">Level {position.level}</Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditPosition(position)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{position.department}</Badge>
                      </div>
                      {position.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{position.description}</p>
                      )}
                      {position.responsibilities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {position.responsibilities.slice(0, 2).map((resp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {resp}
                            </Badge>
                          ))}
                          {position.responsibilities.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{position.responsibilities.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Structure Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Position Assignments
                </CardTitle>
                <CardDescription>Manage reporting relationships and authority assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {structure.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{item.position.title}</h4>
                          {item.user ? (
                            <Badge variant="default" className="text-xs">
                              {item.user.firstName} {item.user.lastName}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Vacant</Badge>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditStructure(item)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{item.position.department}</Badge>

                      </div>
                      {item.delegatedAuthority.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Authority:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.delegatedAuthority.slice(0, 2).map((auth, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {auth}
                              </Badge>
                            ))}
                            {item.delegatedAuthority.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.delegatedAuthority.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Management Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common organizational management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={handleCreateNewPosition} className="flex flex-col items-center gap-2 h-20">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm">New Position</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <UserCheck className="h-5 w-5" />
                  <span className="text-sm">Assign User</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Set Authority</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">Export Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Professional Position Dialog */}
      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Edit Position" : "Create New Position"}
            </DialogTitle>
            <DialogDescription>
              {editingPosition 
                ? "Modify position details. All changes will be recorded in the audit trail for ISO 13485:2016 compliance."
                : "Create a new organizational position with detailed specifications and requirements."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...positionForm}>
            <form onSubmit={positionForm.handleSubmit(onSubmitPosition)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

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
                      <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (Top Level)</SelectItem>
                          {positions.map((pos) => (
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
                        rows={3}
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
                        rows={3}
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
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {(updatePositionMutation.isPending || createPositionMutation.isPending) && (
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingPosition ? "Update Position" : "Create Position"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Professional Structure Dialog */}
      <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organizational Structure</DialogTitle>
            <DialogDescription>
              {editingStructure 
                ? `Modify reporting relationships and authority assignments for ${editingStructure.position.title}. All changes will be recorded in the audit trail for ISO 13485:2016 compliance.`
                : "Modify reporting relationships and authority assignments. All changes will be recorded in the audit trail for ISO 13485:2016 compliance."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...structureForm}>
            <form onSubmit={structureForm.handleSubmit(onSubmitStructure)} className="space-y-4">
              {editingStructure && (
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">{editingStructure.position.title}</h4>
                      <p className="text-sm text-blue-700">{editingStructure.position.department} • Level {editingStructure.position.level}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={structureForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned User</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "vacant" ? undefined : parseInt(value))}>
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
                      <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supervisor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Direct Supervisor</SelectItem>
                          {structure
                            .filter((item) => item.user)
                            .map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.position.title} - {item.user!.firstName} {item.user!.lastName}
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
                        rows={3}
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
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateStructureMutation.isPending && (
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Update Structure
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}