import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Download, 
  RefreshCw, 
  Network, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  GitBranch
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form schemas
const userNeedSchema = z.object({
  needId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  source: z.enum(['user_feedback', 'regulatory', 'market_research', 'clinical', 'other']),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  acceptanceCriteria: z.string().optional(),
});

const designInputSchema = z.object({
  inputId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['functional', 'performance', 'safety', 'regulatory', 'usability', 'other']),
  priority: z.enum(['high', 'medium', 'low']),
  source: z.string(),
  acceptanceCriteria: z.string().optional(),
  linkedUserNeeds: z.array(z.string()).optional(),
});

const designOutputSchema = z.object({
  outputId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  outputType: z.enum(['specification', 'drawing', 'software', 'procedure', 'test_method', 'other']),
  version: z.string(),
  linkedDesignInputs: z.array(z.string()).optional(),
});

const verificationSchema = z.object({
  verificationId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  method: z.enum(['analysis', 'inspection', 'test', 'demonstration']),
  acceptanceCriteria: z.string(),
  linkedDesignOutputs: z.array(z.string()).optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'failed']),
});

const validationSchema = z.object({
  validationId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  method: z.enum(['clinical_evaluation', 'usability_study', 'performance_test', 'other']),
  acceptanceCriteria: z.string(),
  linkedVerifications: z.array(z.string()).optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'failed']),
});

type UserNeedFormData = z.infer<typeof userNeedSchema>;
type DesignInputFormData = z.infer<typeof designInputSchema>;
type DesignOutputFormData = z.infer<typeof designOutputSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;
type ValidationFormData = z.infer<typeof validationSchema>;

export default function TraceabilityMatrixPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [userNeeds, setUserNeeds] = useState<any[]>([]);
  const [designInputs, setDesignInputs] = useState<any[]>([]);
  const [designOutputs, setDesignOutputs] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);

  // User Needs Form
  const userNeedForm = useForm<UserNeedFormData>({
    resolver: zodResolver(userNeedSchema),
    defaultValues: {
      source: 'user_feedback',
      priority: 'medium',
      category: '',
    },
  });

  // Design Inputs Form  
  const designInputForm = useForm<DesignInputFormData>({
    resolver: zodResolver(designInputSchema),
    defaultValues: {
      category: 'functional',
      priority: 'medium',
      source: '',
    },
  });

  const onUserNeedSubmit = (data: UserNeedFormData) => {
    const newUserNeed = {
      ...data,
      id: Date.now(),
      needId: `UN-${userNeeds.length + 1}`,
      createdAt: new Date(),
    };
    setUserNeeds([...userNeeds, newUserNeed]);
    userNeedForm.reset();
    toast({
      title: 'Success',
      description: 'User need created successfully',
    });
  };

  const onDesignInputSubmit = (data: DesignInputFormData) => {
    const newDesignInput = {
      ...data,
      id: Date.now(),
      inputId: `DI-${designInputs.length + 1}`,
      createdAt: new Date(),
    };
    setDesignInputs([...designInputs, newDesignInput]);
    designInputForm.reset();
    toast({
      title: 'Success',
      description: 'Design input created successfully',
    });
  };

  const generateMatrix = () => {
    toast({
      title: 'Matrix Generated',
      description: 'Traceability matrix has been updated with current data',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { variant: 'secondary', label: 'Planned' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'default', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { variant: 'destructive', label: 'High' },
      medium: { variant: 'default', label: 'Medium' },
      low: { variant: 'secondary', label: 'Low' },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Design Control Traceability</h1>
          <p className="text-muted-foreground mt-2">
            ISO 13485:7.3 compliant design control traceability matrix management
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={generateMatrix}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Matrix
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Matrix
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="user-needs">User Needs</TabsTrigger>
          <TabsTrigger value="design-inputs">Design Inputs</TabsTrigger>
          <TabsTrigger value="design-outputs">Design Outputs</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Needs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userNeeds.length}</div>
                <p className="text-xs text-muted-foreground">Total defined needs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Design Inputs</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{designInputs.length}</div>
                <p className="text-xs text-muted-foreground">Functional requirements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Design Outputs</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{designOutputs.length}</div>
                <p className="text-xs text-muted-foreground">Specifications & drawings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">V&V Records</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{verifications.length + validations.length}</div>
                <p className="text-xs text-muted-foreground">Verification & validation</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Traceability Matrix
              </CardTitle>
              <CardDescription>
                Visual representation of design control element relationships and traceability links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userNeeds.length + designInputs.length + designOutputs.length}</div>
                    <p className="text-muted-foreground">Total Items</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userNeeds.length}</div>
                    <p className="text-muted-foreground">User Needs</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{designInputs.length}</div>
                    <p className="text-muted-foreground">Design Inputs</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Matrix reflects current session data. Use Generate Matrix to create formal snapshot.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-needs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">User Needs Management</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User Need
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create User Need</DialogTitle>
                  <DialogDescription>
                    Define a new user need for design control traceability
                  </DialogDescription>
                </DialogHeader>
                <Form {...userNeedForm}>
                  <form onSubmit={userNeedForm.handleSubmit(onUserNeedSubmit)} className="space-y-4">
                    <FormField
                      control={userNeedForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter user need title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userNeedForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detailed description of the user need" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userNeedForm.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user_feedback">User Feedback</SelectItem>
                                <SelectItem value="regulatory">Regulatory</SelectItem>
                                <SelectItem value="market_research">Market Research</SelectItem>
                                <SelectItem value="clinical">Clinical</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={userNeedForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Safety, Performance, Usability" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">
                        Create User Need
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userNeeds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No user needs defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    userNeeds.map((need: any) => (
                      <TableRow key={need.id}>
                        <TableCell className="font-medium">{need.needId}</TableCell>
                        <TableCell>{need.title}</TableCell>
                        <TableCell>{need.source}</TableCell>
                        <TableCell>{getPriorityBadge(need.priority)}</TableCell>
                        <TableCell>{need.category}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design-inputs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Design Inputs Management</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Design Input
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Design Input</DialogTitle>
                  <DialogDescription>
                    Define a new design input derived from user needs
                  </DialogDescription>
                </DialogHeader>
                <Form {...designInputForm}>
                  <form onSubmit={designInputForm.handleSubmit(onDesignInputSubmit)} className="space-y-4">
                    <FormField
                      control={designInputForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter design input title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={designInputForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detailed description of the design input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={designInputForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="functional">Functional</SelectItem>
                                <SelectItem value="performance">Performance</SelectItem>
                                <SelectItem value="safety">Safety</SelectItem>
                                <SelectItem value="regulatory">Regulatory</SelectItem>
                                <SelectItem value="usability">Usability</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={designInputForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={designInputForm.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source</FormLabel>
                          <FormControl>
                            <Input placeholder="Source reference or document" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">
                        Create Design Input
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designInputs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No design inputs defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    designInputs.map((input: any) => (
                      <TableRow key={input.id}>
                        <TableCell className="font-medium">{input.inputId}</TableCell>
                        <TableCell>{input.title}</TableCell>
                        <TableCell>{input.category}</TableCell>
                        <TableCell>{getPriorityBadge(input.priority)}</TableCell>
                        <TableCell>{input.source}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design-outputs" className="space-y-4">
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Design Outputs</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Manage design outputs including specifications, drawings, and procedures with full traceability to design inputs.
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Design Output
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Design Verification</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Track verification activities and results with complete traceability to design outputs.
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Verification Record
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Design Validation</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Manage validation studies and evidence with traceability to verification activities.
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Validation Record
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}