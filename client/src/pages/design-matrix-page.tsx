import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Filter,
  GitBranch,
  Github as GithubIcon,
  Link as LinkIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  UserCircle2,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BadgeColored } from '@/components/ui/badge-colored';
import PageHeader from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';

// Types for the design matrix elements
type UserNeed = {
  id: number;
  needCode: string;
  description: string;
  source: string;
  priority: number;
  status: string;
  createdBy: number;
  creatorName?: string;
}

type DesignInput = {
  id: number;
  inputCode: string;
  description: string;
  type: string;
  verificationMethod?: string;
  status: string;
  priority: number;
  createdBy: number;
  creatorName?: string;
}

type DesignOutput = {
  id: number;
  outputCode: string;
  description: string;
  type: string;
  status: string;
  approvedBy?: number;
  approverName?: string;
  createdBy: number;
  creatorName?: string;
}

type Verification = {
  id: number;
  verificationCode: string;
  description: string;
  testMethod: string;
  status: string;
  assignedTo?: number;
  assigneeName?: string;
  result?: string;
  createdBy: number;
  creatorName?: string;
}

type Validation = {
  id: number;
  validationCode: string;
  description: string;
  testMethod: string;
  status: string;
  assignedTo?: number;
  assigneeName?: string;
  result?: string;
  createdBy: number;
  creatorName?: string;
}

type TraceabilityLink = {
  id: number;
  sourceId: number;
  sourceType: string;
  targetId: number;
  targetType: string;
}

type MatrixRow = {
  userNeed?: UserNeed;
  designInputs: DesignInput[];
  designOutputs: DesignOutput[];
  verifications: Verification[];
  validations: Validation[];
}

type ProjectInfo = {
  id: number;
  title: string;
  projectCode: string;
  statusName: string;
  riskClass: string;
}

// Form schemas
const userNeedFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  source: z.string().optional(),
  priority: z.coerce.number().min(1).max(5).default(3),
});

const designInputFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.string().default("functional"),
  verificationMethod: z.string().optional(),
  priority: z.coerce.number().min(1).max(5).default(3),
  linkedUserNeedId: z.coerce.number().optional(),
});

const designOutputFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.string().default("specification"),
  linkedDesignInputId: z.coerce.number().optional(),
});

const verificationFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  testMethod: z.string().default("test"),
  linkedDesignOutputId: z.coerce.number().optional(),
});

const validationFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  testMethod: z.string().default("test"),
  linkedUserNeedId: z.coerce.number().optional(),
});

const DesignMatrixPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("matrix");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showLinkIndicators, setShowLinkIndicators] = useState(true);
  const [showOrphanedItems, setShowOrphanedItems] = useState(false);
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [highlightedElement, setHighlightedElement] = useState<{id: number, type: string} | null>(null);
  
  // Fetch project info
  const { data: projectInfo, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/design-control/projects/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/design-control/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });
  
  // Fetch design matrix data from database - no hardcoded sample data
  const { data: matrixUserNeeds = [], isLoading: userNeedsLoading } = useQuery({
    queryKey: [`/api/design-control/user-needs/${id}`],
    enabled: !!id,
  });

  const { data: matrixDesignInputs = [], isLoading: designInputsLoading } = useQuery({
    queryKey: [`/api/design-control/design-inputs/${id}`],
    enabled: !!id,
  });

  const { data: matrixDesignOutputs = [], isLoading: designOutputsLoading } = useQuery({
    queryKey: [`/api/design-control/design-outputs/${id}`],
    enabled: !!id,
  });

  const { data: matrixVerifications = [], isLoading: verificationsLoading } = useQuery({
    queryKey: [`/api/design-control/verifications/${id}`],
    enabled: !!id,
  });

  const { data: matrixValidations = [], isLoading: validationsLoading } = useQuery({
    queryKey: [`/api/design-control/validations/${id}`],
    enabled: !!id,
  });

  const { data: matrixTraceabilityLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: [`/api/design-control/traceability-links/${id}`],
    enabled: !!id,
  });

  // Type assertions for database queries to fix TypeScript errors
  const userNeeds = (matrixUserNeeds || []) as UserNeed[];
  const designInputs = (matrixDesignInputs || []) as DesignInput[];
  const designOutputs = (matrixDesignOutputs || []) as DesignOutput[];
  const verifications = (matrixVerifications || []) as Verification[];
  const validations = (matrixValidations || []) as Validation[];
  const traceabilityLinks = (matrixTraceabilityLinks || []) as TraceabilityLink[];

  // Loading state for all matrix data
  const isMatrixLoading = userNeedsLoading || designInputsLoading || designOutputsLoading || 
                         verificationsLoading || validationsLoading || linksLoading;

  // Forms for adding new elements
  const userNeedForm = useForm<z.infer<typeof userNeedFormSchema>>({
    resolver: zodResolver(userNeedFormSchema),
    defaultValues: {
      description: "",
      source: "",
      priority: 3,
    },
  });

  const designInputForm = useForm<z.infer<typeof designInputFormSchema>>({
    resolver: zodResolver(designInputFormSchema),
    defaultValues: {
      description: "",
      type: "functional",
      verificationMethod: "",
      priority: 3,
      linkedUserNeedId: undefined,
    },
  });

  const designOutputForm = useForm<z.infer<typeof designOutputFormSchema>>({
    resolver: zodResolver(designOutputFormSchema),
    defaultValues: {
      description: "",
      type: "specification",
      linkedDesignInputId: undefined,
    },
  });

  const verificationForm = useForm<z.infer<typeof verificationFormSchema>>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      description: "",
      testMethod: "test",
      linkedDesignOutputId: undefined,
    },
  });

  const validationForm = useForm<z.infer<typeof validationFormSchema>>({
    resolver: zodResolver(validationFormSchema),
    defaultValues: {
      description: "",
      testMethod: "test",
      linkedUserNeedId: undefined,
    },
  });
  
  // Dummy mutations for demonstration purposes
  const addUserNeedMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userNeedFormSchema>) => {
      // In a real implementation, this would call the API
      console.log("Adding user need:", data);
      return { ...data, id: Math.floor(Math.random() * 1000), needCode: `UN-${userNeeds.length + 1}` };
    },
    onSuccess: () => {
      toast({
        title: "User Need Added",
        description: "The user need was successfully added to the project.",
      });
      setIsDialogOpen(false);
      userNeedForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user need",
        variant: "destructive",
      });
    }
  });

  const addDesignInputMutation = useMutation({
    mutationFn: async (data: z.infer<typeof designInputFormSchema>) => {
      // In a real implementation, this would call the API
      console.log("Adding design input:", data);
      return { ...data, id: Math.floor(Math.random() * 1000), inputCode: `DI-${designInputs.length + 1}` };
    },
    onSuccess: () => {
      toast({
        title: "Design Input Added",
        description: "The design input was successfully added to the project.",
      });
      setIsDialogOpen(false);
      designInputForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add design input",
        variant: "destructive",
      });
    }
  });
  
  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'in progress':
      case 'in_progress':
        return 'warning';
      case 'pending':
      case 'draft':
      case 'planned':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  const getLinkedItems = (id: number, type: string, direction: 'source' | 'target') => {
    return traceabilityLinks.filter(link => 
      direction === 'source' 
        ? link.sourceId === id && link.sourceType === type
        : link.targetId === id && link.targetType === type
    );
  };
  
  const isOrphaned = (id: number, type: string) => {
    if (type === 'user_need') {
      // User needs should be linked to design inputs
      return !traceabilityLinks.some(link => 
        link.sourceId === id && link.sourceType === type
      );
    } else if (type === 'design_input') {
      // Design inputs should have a user need source and design output target
      return !traceabilityLinks.some(link => 
        (link.targetId === id && link.targetType === type) ||
        (link.sourceId === id && link.sourceType === type)
      );
    } else if (type === 'design_output') {
      // Design outputs should have a design input source and verification target
      return !traceabilityLinks.some(link => 
        (link.targetId === id && link.targetType === type) ||
        (link.sourceId === id && link.sourceType === type)
      );
    } else if (type === 'verification') {
      // Verifications should have a design output source
      return !traceabilityLinks.some(link => 
        link.targetId === id && link.targetType === type
      );
    } else if (type === 'validation') {
      // Validations should be linked to user needs
      return !traceabilityLinks.some(link => 
        (link.targetId === id && link.targetType === type) ||
        (link.sourceId === id && link.sourceType === type)
      );
    }
    return false;
  };

  const handleElementMouseEnter = (id: number, type: string) => {
    setHighlightedElement({ id, type });
  };

  const handleElementMouseLeave = () => {
    setHighlightedElement(null);
  };
  
  const isHighlighted = (id: number, type: string) => {
    if (!highlightedElement) return false;
    
    // Check if this is the element itself
    if (highlightedElement.id === id && highlightedElement.type === type) {
      return true;
    }
    
    // Check if this element is connected to the highlighted element through a traceability link
    return traceabilityLinks.some(link => 
      (link.sourceId === highlightedElement.id && link.sourceType === highlightedElement.type && 
       link.targetId === id && link.targetType === type) ||
      (link.targetId === highlightedElement.id && link.targetType === highlightedElement.type && 
       link.sourceId === id && link.sourceType === type)
    );
  };
  
  const openAddDialog = (type: string) => {
    setDialogType(type);
    setIsDialogOpen(true);
    
    // Reset the appropriate form
    switch(type) {
      case 'user_need':
        userNeedForm.reset();
        break;
      case 'design_input':
        designInputForm.reset();
        break;
      case 'design_output':
        designOutputForm.reset();
        break;
      case 'verification':
        verificationForm.reset();
        break;
      case 'validation':
        validationForm.reset();
        break;
    }
  };
  
  const handleAddElement = (type: string) => {
    switch(type) {
      case 'user_need':
        userNeedForm.handleSubmit((data) => {
          addUserNeedMutation.mutate(data);
        })();
        break;
      case 'design_input':
        designInputForm.handleSubmit((data) => {
          addDesignInputMutation.mutate(data);
        })();
        break;
      // Other type handlers would go here
    }
  };
  
  // Create matrix rows based on user needs
  const matrixRows = userNeeds.map(userNeed => {
    // Get linked design inputs for this user need
    const linkedDesignInputIds = traceabilityLinks
      .filter(link => link.sourceId === userNeed.id && link.sourceType === 'user_need' && link.targetType === 'design_input')
      .map(link => link.targetId);
    
    const linkedDesignInputs = designInputs.filter(di => linkedDesignInputIds.includes(di.id));
    
    // For each design input, get linked design outputs
    const linkedDesignOutputs = designOutputs.filter(dOut => {
      return linkedDesignInputs.some(dIn => {
        return traceabilityLinks.some(link => 
          link.sourceId === dIn.id && 
          link.sourceType === 'design_input' && 
          link.targetId === dOut.id && 
          link.targetType === 'design_output'
        );
      });
    });
    
    // For each design output, get linked verifications
    const linkedVerifications = verifications.filter(ver => {
      return linkedDesignOutputs.some(dOut => {
        return traceabilityLinks.some(link => 
          link.sourceId === dOut.id && 
          link.sourceType === 'design_output' && 
          link.targetId === ver.id && 
          link.targetType === 'verification'
        );
      });
    });
    
    // Get directly linked validations for this user need
    const linkedValidationIds = traceabilityLinks
      .filter(link => link.sourceId === userNeed.id && link.sourceType === 'user_need' && link.targetType === 'validation')
      .map(link => link.targetId);
    
    const linkedValidations = validations.filter(val => linkedValidationIds.includes(val.id));
    
    return {
      userNeed,
      designInputs: linkedDesignInputs,
      designOutputs: linkedDesignOutputs,
      verifications: linkedVerifications,
      validations: linkedValidations
    };
  });
  
  return (
    <div className="container mx-auto p-6">
      <Helmet>
        <title>Design Matrix | Design Control | eQMS System</title>
        <meta
          name="description"
          content="Design matrix for traceability between user needs, design inputs, outputs, verification and validation activities."
        />
      </Helmet>
      
      {/* Page Header */}
      <PageHeader
        title="Design Traceability Matrix"
        description={projectLoading ? "Loading project..." : `Project: ${projectInfo?.title || ''} (${projectInfo?.projectCode || ''})`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link to={`/design-control/${id}`}>
              <Button variant="outline" size="sm">
                Back to Project
              </Button>
            </Link>
          </div>
        }
      />
      
      {/* Display project information */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Design Control Matrix</CardTitle>
              <CardDescription>
                ISO 13485:2016 §7.3 Design and Development Traceability
              </CardDescription>
            </div>
            
            {/* Matrix View Options */}
            <div className="flex gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[360px]">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="matrix" className="text-xs">
                    <GitBranch className="h-4 w-4 mr-1" />
                    Matrix View
                  </TabsTrigger>
                  <TabsTrigger value="graph" className="text-xs">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Graph View
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle 
                    pressed={showLinkIndicators} 
                    onPressedChange={setShowLinkIndicators}
                    size="sm" 
                    className="text-xs"
                  >
                    <LinkIcon className="h-3.5 w-3.5 mr-1" />
                    Show Links
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show visual indicators of traceability links</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle 
                    pressed={showOrphanedItems} 
                    onPressedChange={setShowOrphanedItems}
                    size="sm" 
                    className="text-xs"
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Orphaned Items
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Highlight items without proper traceability links</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
      
      {/* Matrix Content */}
      <TabsContent value="matrix" className="mt-0 p-0">
        <div className="grid grid-cols-5 gap-4">
          {/* Column Headers */}
          <div className="bg-muted p-3 flex justify-between items-center rounded-t-md">
            <span className="font-medium text-sm">User Needs</span>
            <Button variant="ghost" size="icon" onClick={() => openAddDialog('user_need')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-muted p-3 flex justify-between items-center rounded-t-md">
            <span className="font-medium text-sm">Design Inputs</span>
            <Button variant="ghost" size="icon" onClick={() => openAddDialog('design_input')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-muted p-3 flex justify-between items-center rounded-t-md">
            <span className="font-medium text-sm">Design Outputs</span>
            <Button variant="ghost" size="icon" onClick={() => openAddDialog('design_output')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-muted p-3 flex justify-between items-center rounded-t-md">
            <span className="font-medium text-sm">Verifications</span>
            <Button variant="ghost" size="icon" onClick={() => openAddDialog('verification')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-muted p-3 flex justify-between items-center rounded-t-md">
            <span className="font-medium text-sm">Validations</span>
            <Button variant="ghost" size="icon" onClick={() => openAddDialog('validation')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Loading state */}
          {projectLoading && (
            <div className="col-span-5 text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary/70" />
              <p className="mt-2 text-muted-foreground">Loading design matrix data...</p>
            </div>
          )}
          
          {/* Matrix Content */}
          {!projectLoading && matrixRows.map((row, rowIndex) => (
            <>
              {/* User Need Column */}
              <div 
                key={`un-${row.userNeed.id}`}
                className={`border rounded-md p-3 ${isHighlighted(row.userNeed.id, 'user_need') ? 'bg-blue-50 border-blue-200' : ''}`}
                onMouseEnter={() => handleElementMouseEnter(row.userNeed.id, 'user_need')}
                onMouseLeave={handleElementMouseLeave}
              >
                <div className="text-xs text-muted-foreground mb-1">{row.userNeed.needCode}</div>
                <div className="font-medium text-sm mb-1">User Need - {rowIndex + 1}</div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {row.userNeed.description}
                </p>
                <div className="flex items-center justify-between">
                  <BadgeColored variant={getStatusColor(row.userNeed.status)} className="text-xs">
                    {row.userNeed.status.charAt(0).toUpperCase() + row.userNeed.status.slice(1)}
                  </BadgeColored>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Design Input Column */}
              <div className="space-y-2">
                {row.designInputs.length > 0 ? row.designInputs.map(di => (
                  <div 
                    key={`di-${di.id}`}
                    className={`border rounded-md p-3 ${isHighlighted(di.id, 'design_input') ? 'bg-blue-50 border-blue-200' : ''}`}
                    onMouseEnter={() => handleElementMouseEnter(di.id, 'design_input')}
                    onMouseLeave={handleElementMouseLeave}
                  >
                    <div className="text-xs text-muted-foreground mb-1">{di.inputCode}</div>
                    <div className="font-medium text-sm mb-1">Design Input - {di.inputCode.split('-')[1]}</div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {di.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <BadgeColored variant={getStatusColor(di.status)} className="text-xs">
                        {di.status.replace('_', ' ').charAt(0).toUpperCase() + di.status.slice(1)}
                      </BadgeColored>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="border border-dashed rounded p-3 flex items-center justify-center text-gray-500 h-24">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => openAddDialog('design_input')}>
                      <Plus className="h-4 w-4" />
                      Add Input
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Design Output Column */}
              <div className="space-y-2">
                {row.designOutputs.length > 0 ? row.designOutputs.map(dOut => (
                  <div 
                    key={`do-${dOut.id}`}
                    className={`border rounded-md p-3 ${isHighlighted(dOut.id, 'design_output') ? 'bg-blue-50 border-blue-200' : ''}`}
                    onMouseEnter={() => handleElementMouseEnter(dOut.id, 'design_output')}
                    onMouseLeave={handleElementMouseLeave}
                  >
                    <div className="text-xs text-muted-foreground mb-1">{dOut.outputCode}</div>
                    <div className="font-medium text-sm mb-1">Design Output - {dOut.outputCode.split('-')[1]}</div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {dOut.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <BadgeColored variant={getStatusColor(dOut.status)} className="text-xs">
                        {dOut.status.replace('_', ' ').charAt(0).toUpperCase() + dOut.status.slice(1)}
                      </BadgeColored>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      <GithubIcon className="h-3 w-3 inline mr-1" />
                      <span className="hover:underline cursor-pointer">Github link for Data Analytics source code</span>
                    </div>
                  </div>
                )) : (
                  <div className="border border-dashed rounded p-3 flex items-center justify-center text-gray-500 h-24">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => openAddDialog('design_output')}>
                      <Plus className="h-4 w-4" />
                      Add Output
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Verification Column */}
              <div className="space-y-2">
                {row.verifications.length > 0 ? row.verifications.map(ver => (
                  <div 
                    key={`ver-${ver.id}`}
                    className={`border rounded-md p-3 ${ver.status === 'approved' ? 'bg-green-50 border-green-200' : ''} ${isHighlighted(ver.id, 'verification') ? 'bg-blue-50 border-blue-200' : ''}`}
                    onMouseEnter={() => handleElementMouseEnter(ver.id, 'verification')}
                    onMouseLeave={handleElementMouseLeave}
                  >
                    <div className="text-xs text-muted-foreground mb-1">{ver.verificationCode}</div>
                    <div className="font-medium text-sm mb-1">Design Verification - {ver.verificationCode.split('-')[1]}</div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {ver.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <BadgeColored variant={getStatusColor(ver.status)} className="text-xs">
                        {ver.status.replace('_', ' ').charAt(0).toUpperCase() + ver.status.slice(1)}
                      </BadgeColored>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="border border-dashed rounded p-3 flex items-center justify-center text-gray-500 h-24">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => openAddDialog('verification')}>
                      <Plus className="h-4 w-4" />
                      Add Verification
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Validation Column */}
              <div className="space-y-2">
                {row.validations.length > 0 ? row.validations.map(val => (
                  <div 
                    key={`val-${val.id}`}
                    className={`border rounded-md p-3 ${isHighlighted(val.id, 'validation') ? 'bg-blue-50 border-blue-200' : ''}`}
                    onMouseEnter={() => handleElementMouseEnter(val.id, 'validation')}
                    onMouseLeave={handleElementMouseLeave}
                  >
                    <div className="text-xs text-muted-foreground mb-1">{val.validationCode}</div>
                    <div className="font-medium text-sm mb-1">Design Validation - {val.validationCode.split('-')[1]}</div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {val.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <BadgeColored variant={getStatusColor(val.status)} className="text-xs">
                        {val.status.replace('_', ' ').charAt(0).toUpperCase() + val.status.slice(1)}
                      </BadgeColored>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="border border-dashed rounded p-3 flex items-center justify-center text-gray-500 h-24">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => openAddDialog('validation')}>
                      <Plus className="h-4 w-4" />
                      Add Validation
                    </Button>
                  </div>
                )}
              </div>
            </>
          ))}
          
          {/* Empty state */}
          {!projectLoading && userNeeds.length === 0 && (
            <div className="col-span-5 text-center py-12 border border-dashed rounded-md">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium">No Matrix Elements</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Begin by adding user needs, which form the foundation of your design control
                process in accordance with ISO 13485:2016.
              </p>
              <Button onClick={() => openAddDialog('user_need')}>
                <Plus className="h-4 w-4 mr-2" />
                Add First User Need
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
      
      {/* Graph View */}
      <TabsContent value="graph" className="mt-0 p-0">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Graph Visualization</h3>
              <p className="text-muted-foreground mt-2 mb-4 max-w-md">
                The graphical view of traceability links will be implemented in the next iteration.
                This will provide a visual representation of connections between design elements.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Add dialogs for each element type */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'user_need' && 'Add User Need'}
              {dialogType === 'design_input' && 'Add Design Input'}
              {dialogType === 'design_output' && 'Add Design Output'}
              {dialogType === 'verification' && 'Add Verification'}
              {dialogType === 'validation' && 'Add Validation'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'user_need' && 'Add a new user need to this design project.'}
              {dialogType === 'design_input' && 'Add a new design input based on user needs.'}
              {dialogType === 'design_output' && 'Add a new design output that implements design inputs.'}
              {dialogType === 'verification' && 'Add a verification test for a design output.'}
              {dialogType === 'validation' && 'Add a validation test that addresses user needs.'}
            </DialogDescription>
          </DialogHeader>
          
          {/* User Need Form */}
          {dialogType === 'user_need' && (
            <Form {...userNeedForm}>
              <form onSubmit={userNeedForm.handleSubmit((data) => handleAddElement('user_need'))} className="space-y-4">
                <FormField
                  control={userNeedForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the user need" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={userNeedForm.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g., Stakeholder meeting, Regulation, etc." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The origin of this user need
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={userNeedForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Low</SelectItem>
                          <SelectItem value="2">2 - Medium-Low</SelectItem>
                          <SelectItem value="3">3 - Medium</SelectItem>
                          <SelectItem value="4">4 - Medium-High</SelectItem>
                          <SelectItem value="5">5 - High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addUserNeedMutation.isPending}>
                    {addUserNeedMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add User Need"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
          
          {/* Design Input Form */}
          {dialogType === 'design_input' && (
            <Form {...designInputForm}>
              <form onSubmit={designInputForm.handleSubmit((data) => handleAddElement('design_input'))} className="space-y-4">
                <FormField
                  control={designInputForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the design input" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={designInputForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="functional">Functional</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="interface">Interface</SelectItem>
                          <SelectItem value="regulatory">Regulatory</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="usability">Usability</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={designInputForm.control}
                  name="verificationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Method</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select verification method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="test">Test</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="analysis">Analysis</SelectItem>
                          <SelectItem value="demonstration">Demonstration</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How this requirement will be verified
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={designInputForm.control}
                  name="linkedUserNeedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Linked User Need</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Link to a user need" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userNeeds.map((un) => (
                            <SelectItem key={un.id} value={un.id.toString()}>
                              {un.needCode} - {un.description.substring(0, 30)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Connect this design input to a user need for traceability
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addDesignInputMutation.isPending}>
                    {addDesignInputMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Design Input"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
          
          {/* Other forms would be implemented similarly */}
        </DialogContent>
      </Dialog>
      
      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          This design matrix helps establish traceability between user needs, design inputs, design outputs, and verification & validation activities in accordance with ISO 13485:2016 requirements.
        </p>
      </div>
    </div>
  );
};

export default DesignMatrixPage;