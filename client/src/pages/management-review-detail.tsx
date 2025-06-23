import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { navigateTo } from "@/lib/navigation";
import { format } from "date-fns";

// Components
import PageHeader from "@/components/page-header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Calendar,
  ClipboardList,
  FileText,
  Users,
  CheckCircle,
  Plus,
  Edit,
  Save,
  X,
  Trash2,
  Wand2,
  AlertTriangle,
  Presentation
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
import { ManagementReview } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ComprehensiveInputForm } from "@/components/management-review/comprehensive-input-form";
import { DocumentGenerator } from "@/components/management-review/document-generator";

const ManagementReviewDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reviewId = id ? parseInt(id) : 0;
  
  // State for comprehensive input management
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [reviewInputs, setReviewInputs] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [showComprehensiveInputDialog, setShowComprehensiveInputDialog] = useState(false);
  const [showAddActionDialog, setShowAddActionDialog] = useState(false);
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [isSubmittingInput, setIsSubmittingInput] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Medium'
  });
  
  // Fetch management review
  const { 
    data: review = {} as ManagementReview, 
    isLoading, 
    error 
  } = useQuery<ManagementReview>({
    queryKey: [`/api/management-reviews/${reviewId}`],
    enabled: !!reviewId,
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/management-reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true',
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/management-reviews/${reviewId}`] });
      toast({
        title: "Success",
        description: "Management review updated successfully",
      });
      setIsEditingBasic(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update management review",
        variant: "destructive",
      });
    },
  });

  // Generate action items mutation
  const generateActionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/management-reviews/${reviewId}/generate-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate action items');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Generated ${data.generatedCount} action items from ${data.totalInputs} review inputs`,
      });
      setIsGeneratingActions(false);
      // Refresh action items data
      queryClient.invalidateQueries({ queryKey: [`/api/management-reviews/${reviewId}/action-items`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate action items",
        variant: "destructive",
      });
      setIsGeneratingActions(false);
    },
  });

  // Fetch users for contributor selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  // Comprehensive input submission handler
  const handleComprehensiveInputSubmit = async (inputData: any) => {
    setIsSubmittingInput(true);
    
    try {
      // Transform the comprehensive input data for storage
      const processedInput = {
        ...inputData,
        id: Date.now(),
        reviewId: reviewId,
        createdAt: new Date().toISOString(),
        // Map comprehensive form fields to display format
        title: `${inputData.categoryId} - ${inputData.subcategoryId}`,
        category: inputData.categoryId,
        description: inputData.content,
        data: inputData.quantitativeData || '',
        source: inputData.contributorId,
        priority: inputData.priority,
        complianceStatus: inputData.complianceStatus,
        trend: inputData.trend,
        actionRequired: inputData.actionRequired,
        evidenceType: inputData.evidenceType,
        qualitativeAssessment: inputData.qualitativeAssessment,
        mdSapRelevant: inputData.mdSapRelevant,
        mdrRelevant: inputData.mdrRelevant,
        fdaRelevant: inputData.fdaRelevant,
        riskLevel: inputData.riskLevel,
        attachmentPath: inputData.attachmentPath,
      };
      
      setReviewInputs(prev => [...prev, processedInput]);
      setShowComprehensiveInputDialog(false);
      
      toast({
        title: "Success", 
        description: "Management review input added successfully",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add management review input",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingInput(false);
    }
  };

  const handleAddAction = () => {
    if (!newAction.title || !newAction.assignedTo) {
      toast({
        title: "Error",
        description: "Please fill in title and assigned person",
        variant: "destructive",
      });
      return;
    }
    
    const actionWithId = {
      ...newAction,
      id: Date.now(),
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    
    setActionItems([...actionItems, actionWithId]);
    setNewAction({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'Medium'
    });
    setShowAddActionDialog(false);
    
    toast({
      title: "Success",
      description: "Action item added successfully",
    });
  };

  const handleBasicEdit = () => {
    setEditFormData({
      title: review.title || '',
      description: review.description || '',
      scope: review.scope || '',
      purpose: review.purpose || ''
    });
    setIsEditingBasic(true);
  };

  const handleSaveBasicEdit = () => {
    updateReviewMutation.mutate(editFormData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['scheduled'];
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  // Handle back button
  const handleBack = () => {
    navigateTo('/management-review');
  };

  // Handle error state
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load management review details. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <>
      <Helmet>
        <title>Management Review Details | eQMS</title>
        <meta name="description" content="View and manage details of a quality management system review" />
      </Helmet>

      <div className="container mx-auto py-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reviews
        </Button>

        <PageHeader
          title={
            isLoading
              ? "Loading Management Review..."
              : review?.title || "Management Review Details"
          }
          description="View and manage management review details"
        />

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : review ? (
          <>
            {/* Basic review information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Review Information</CardTitle>
                <CardDescription>
                  Management review details and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Review Type
                    </h3>
                    <p>{review.review_type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </h3>
                    <div>
                      {getStatusBadge(review.status)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Review Date
                    </h3>
                    <p>
                      {review.review_date 
                        ? format(new Date(review.review_date), 'MMM d, yyyy')
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      Created
                    </h3>
                    <p>
                      {review.createdAt 
                        ? format(new Date(review.createdAt), 'MMM d, yyyy')
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tab navigation for review details */}
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="inputs">Inputs</TabsTrigger>
                    <TabsTrigger value="actions">Action Items</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="approvals">Approvals</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="pt-4">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Review Overview</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleBasicEdit}
                          disabled={isEditingBasic || updateReviewMutation.isPending}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </Button>
                      </div>
                      
                      {isEditingBasic ? (
                        <div className="space-y-4 p-4 border rounded-lg">
                          <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                              id="edit-title"
                              value={editFormData.title || ''}
                              onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={editFormData.description || ''}
                              onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-scope">Scope</Label>
                            <Textarea
                              id="edit-scope"
                              value={editFormData.scope || ''}
                              onChange={(e) => setEditFormData({...editFormData, scope: e.target.value})}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-purpose">Purpose</Label>
                            <Textarea
                              id="edit-purpose"
                              value={editFormData.purpose || ''}
                              onChange={(e) => setEditFormData({...editFormData, purpose: e.target.value})}
                              rows={2}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={handleSaveBasicEdit}
                              disabled={updateReviewMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditingBasic(false)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {review.description || "No description provided."}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Scope</h4>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {review.scope || "No scope defined."}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Purpose</h4>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {review.purpose || "No purpose defined."}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Meeting Minutes</h4>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {review.minutes || "No meeting minutes recorded yet."}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Conclusion</h4>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {review.conclusion || "No conclusion provided yet."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Inputs Tab - ISO 13485:2016 Section 5.6 Workflow */}
                  <TabsContent value="inputs" className="pt-4">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium">Management Review Inputs</h3>
                          <p className="text-sm text-muted-foreground">ISO 13485:2016 Section 5.6 compliant input collection</p>
                        </div>
                        <Button onClick={() => setShowComprehensiveInputDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Input
                        </Button>
                      </div>
                      
                      {/* Comprehensive Input Display */}
                      {reviewInputs.length > 0 ? (
                        <div className="space-y-4">
                          {reviewInputs.map((input: any) => (
                            <Card key={input.id} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        {input.category?.replace('_', ' ') || 'General Input'}
                                      </Badge>
                                      {input.priority && (
                                        <Badge variant={input.priority === 'critical' ? 'destructive' : 
                                                      input.priority === 'high' ? 'default' : 'secondary'}>
                                          {input.priority}
                                        </Badge>
                                      )}
                                      {input.complianceStatus && (
                                        <Badge variant={input.complianceStatus === 'compliant' ? 'default' : 'destructive'}>
                                          {input.complianceStatus}
                                        </Badge>
                                      )}
                                      <span className="text-sm text-muted-foreground">
                                        {format(new Date(input.createdAt), 'MMM d, yyyy')}
                                      </span>
                                    </div>
                                    <CardTitle className="text-lg">{input.title}</CardTitle>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setReviewInputs(reviewInputs.filter((i: any) => i.id !== input.id));
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <h5 className="font-medium mb-1">Input Content</h5>
                                  <p className="text-sm text-muted-foreground">{input.description}</p>
                                </div>
                                
                                {input.data && (
                                  <div>
                                    <h5 className="font-medium mb-1">Quantitative Data</h5>
                                    <p className="text-sm">{input.data}</p>
                                  </div>
                                )}
                                
                                {input.qualitativeAssessment && (
                                  <div>
                                    <h5 className="font-medium mb-1">Qualitative Assessment</h5>
                                    <p className="text-sm text-muted-foreground">{input.qualitativeAssessment}</p>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {input.trend && (
                                    <div>
                                      <span className="font-medium">Trend: </span>
                                      <span>{input.trend}</span>
                                    </div>
                                  )}
                                  {input.riskLevel && (
                                    <div>
                                      <span className="font-medium">Risk Level: </span>
                                      <span>{input.riskLevel}</span>
                                    </div>
                                  )}
                                  {input.evidenceType && (
                                    <div>
                                      <span className="font-medium">Evidence Type: </span>
                                      <span>{input.evidenceType}</span>
                                    </div>
                                  )}
                                  {input.actionRequired && (
                                    <div>
                                      <span className="font-medium">Action Required: </span>
                                      <Badge variant="outline" className="ml-1">Yes</Badge>
                                    </div>
                                  )}
                                </div>
                                
                                {(input.mdSapRelevant || input.mdrRelevant || input.fdaRelevant) && (
                                  <div>
                                    <h5 className="font-medium mb-1">Regulatory Scope</h5>
                                    <div className="flex space-x-2">
                                      {input.mdSapRelevant && <Badge variant="secondary">MDSAP</Badge>}
                                      {input.mdrRelevant && <Badge variant="secondary">EU MDR</Badge>}
                                      {input.fdaRelevant && <Badge variant="secondary">FDA</Badge>}
                                    </div>
                                  </div>
                                )}
                                
                                {input.attachmentPath && (
                                  <div>
                                    <span className="text-sm font-medium">Attachment: </span>
                                    <span className="text-sm text-blue-600">{input.attachmentPath}</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Management Review Inputs</h3>
                          <p className="text-muted-foreground mb-4">
                            Add Inputs following ISO 13485:2016 Section 5.6 requirements
                          </p>
                          <Button onClick={() => setShowComprehensiveInputDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Input
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Action Items Tab */}
                  <TabsContent value="actions" className="pt-4">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Action Items</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsGeneratingActions(true);
                              generateActionsMutation.mutate();
                            }}
                            disabled={isGeneratingActions || generateActionsMutation.isPending}
                          >
                            {isGeneratingActions ? (
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                            ) : (
                              <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            {isGeneratingActions ? 'Generating...' : 'Generate from Inputs'}
                          </Button>
                          <Dialog open={showAddActionDialog} onOpenChange={setShowAddActionDialog}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Action
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Add Action Item</DialogTitle>
                              <DialogDescription>
                                Create an action item from this management review
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="action-title">Title</Label>
                                <Input
                                  id="action-title"
                                  value={newAction.title}
                                  onChange={(e) => setNewAction({...newAction, title: e.target.value})}
                                  placeholder="Enter action title"
                                />
                              </div>
                              <div>
                                <Label htmlFor="action-description">Description</Label>
                                <Textarea
                                  id="action-description"
                                  value={newAction.description}
                                  onChange={(e) => setNewAction({...newAction, description: e.target.value})}
                                  placeholder="Describe the action required"
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label htmlFor="action-assigned">Assigned To</Label>
                                <Input
                                  id="action-assigned"
                                  value={newAction.assignedTo}
                                  onChange={(e) => setNewAction({...newAction, assignedTo: e.target.value})}
                                  placeholder="Person responsible"
                                />
                              </div>
                              <div>
                                <Label htmlFor="action-due">Due Date</Label>
                                <Input
                                  id="action-due"
                                  type="date"
                                  value={newAction.dueDate}
                                  onChange={(e) => setNewAction({...newAction, dueDate: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="action-priority">Priority</Label>
                                <Select value={newAction.priority} onValueChange={(value) => setNewAction({...newAction, priority: value})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowAddActionDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleAddAction}>
                                  Add Action
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        </div>
                      </div>
                      
                      {actionItems.length > 0 ? (
                        <div className="space-y-4">
                          {actionItems.map((action: any) => (
                            <Card key={action.id}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={action.priority === 'High' ? 'destructive' : action.priority === 'Medium' ? 'default' : 'secondary'}>
                                      {action.priority}
                                    </Badge>
                                    <Badge variant="outline">{action.status}</Badge>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setActionItems(actionItems.filter((a: any) => a.id !== action.id));
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <h4 className="font-medium mb-2">{action.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Assigned to: </span>
                                    <span>{action.assignedTo}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Due: </span>
                                    <span>{action.dueDate ? format(new Date(action.dueDate), 'MMM d, yyyy') : 'No due date'}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No action items yet</h3>
                          <p className="text-muted-foreground">Add action items that resulted from this review</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Documents Tab */}
                  <TabsContent value="documents" className="pt-4">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium">Document Generation</h3>
                          <p className="text-sm text-muted-foreground">Generate professional Management Review documents</p>
                        </div>
                        <Button onClick={() => setShowDocumentGenerator(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Documents
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDocumentGenerator(true)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-orange-100 rounded">
                                <Presentation className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <CardTitle className="text-sm">PowerPoint Presentation</CardTitle>
                                <CardDescription className="text-xs">
                                  Executive summary with findings and trends
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>• Overview and key findings</div>
                              <div>• Performance trends analysis</div>
                              <div>• Action items and recommendations</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDocumentGenerator(true)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-sm">Meeting Minutes</CardTitle>
                                <CardDescription className="text-xs">
                                  Formal meeting minutes with decisions
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>• Meeting details and attendees</div>
                              <div>• Detailed input discussions</div>
                              <div>• Action items and assignments</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDocumentGenerator(true)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-100 rounded">
                                <Users className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <CardTitle className="text-sm">Attendance Sheet</CardTitle>
                                <CardDescription className="text-xs">
                                  Professional attendance tracking
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>• Pre-populated user list</div>
                              <div>• Signature collection</div>
                              <div>• Chairperson approval section</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card className="bg-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            ISO 13485:2016 Section 5.6 Compliance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground space-y-2">
                            <p>All generated documents comply with ISO 13485:2016 Section 5.6 Management Review requirements:</p>
                            <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                              <li>Review inputs from all required sources</li>
                              <li>Performance data and trend analysis</li>
                              <li>Action items with assignments and due dates</li>
                              <li>Management review conclusions and decisions</li>
                              <li>Formal approval and signature sections</li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground">
                          Documents are generated as PDF files with professional formatting
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Approvals Tab */}
                  <TabsContent value="approvals" className="pt-4">
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Review Approvals</h3>
                      
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Review Status</h4>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(review.status)}
                                <span className="text-sm text-muted-foreground">
                                  {review.status === 'scheduled' && 'Awaiting review meeting'}
                                  {review.status === 'in_progress' && 'Review in progress'}
                                  {review.status === 'completed' && 'Review completed and approved'}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Approval Date</h4>
                              <p className="text-muted-foreground">
                                {review.approval_date 
                                  ? format(new Date(review.approval_date), 'MMM d, yyyy')
                                  : 'Not approved yet'}
                              </p>
                            </div>
                            
                            <div className="pt-4 border-t">
                              <Button 
                                onClick={() => {
                                  updateReviewMutation.mutate({
                                    status: review.status === 'scheduled' ? 'in_progress' : 'completed',
                                    approval_date: review.status !== 'completed' ? new Date().toISOString() : review.approval_date
                                  });
                                }}
                                disabled={updateReviewMutation.isPending || review.status === 'completed'}
                              >
                                {review.status === 'scheduled' && 'Start Review'}
                                {review.status === 'in_progress' && 'Complete & Approve Review'}
                                {review.status === 'completed' && 'Review Completed'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Review not found</h3>
            <p className="text-muted-foreground">
              The requested management review could not be found.
            </p>
          </div>
        )}
      </div>

      {/* Comprehensive Management Review Input Form */}
      <ComprehensiveInputForm
        open={showComprehensiveInputDialog}
        onOpenChange={setShowComprehensiveInputDialog}
        onSubmit={handleComprehensiveInputSubmit}
        users={users}
        isSubmitting={isSubmittingInput}
        reviewId={reviewId}
      />

      {/* Document Generator */}
      <DocumentGenerator
        open={showDocumentGenerator}
        onOpenChange={setShowDocumentGenerator}
        review={review}
        reviewInputs={reviewInputs}
        actionItems={actionItems}
        users={users}
      />
    </>
  );
};

// Status badge helper
const getStatusBadge = (status: string) => {
  const statusConfig = {
    'scheduled': { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
    'in_progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
    'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
  } as const;
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['scheduled'];
  return (
    <Badge className={`${config.color} border-0`}>
      {config.label}
    </Badge>
  );
};

export default ManagementReviewDetail;