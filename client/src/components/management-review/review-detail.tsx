import React from 'react';
import { format } from 'date-fns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeColored } from "@/components/ui/badge-colored";
import { CalendarIcon, Check, Edit, FileText, Pen, Plus, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { InputCategoriesAccordion } from './input-categories';

interface ReviewDetailProps {
  review: any;
  inputs: any[];
  participants: any[];
  actionItems: any[];
  signatures: any[];
  users: any[];
  isLoading: boolean;
  onAddInput: () => void;
  onAddParticipant: () => void;
  onAddActionItem: () => void;
  onSignReview: () => void;
  onUpdateStatus: (status: string) => void;
  onEditReview: () => void;
  onDeleteReview: () => void;
  onEditInput?: (input: any) => void;
  onDeleteInput?: (inputId: number) => void;
  onEditActionItem?: (actionItem: any) => void;
  onEditParticipant?: (participant: any) => void;
  onDeleteParticipant?: (participantId: number) => void;
}

export function ReviewDetail({
  review,
  inputs = [],
  participants = [],
  actionItems = [],
  signatures = [],
  users = [],
  isLoading,
  onAddInput,
  onAddParticipant,
  onAddActionItem,
  onSignReview,
  onUpdateStatus,
  onEditReview,
  onDeleteReview,
  onEditInput,
  onDeleteInput,
  onEditActionItem,
  onEditParticipant,
  onDeleteParticipant,
}: ReviewDetailProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  
  if (isLoading || !review) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full mb-4"></div>
          <p className="text-muted-foreground">Loading review details...</p>
        </div>
      </div>
    );
  }
  
  // Extract scope and purpose from description field
  let scope = '';
  let purpose = '';
  
  if (review?.description) {
    const descriptionText = review.description;
    const scopeIndex = descriptionText.indexOf('Scope:');
    const purposeIndex = descriptionText.indexOf('Purpose:');
    
    if (scopeIndex !== -1) {
      const scopeStartIndex = scopeIndex + 'Scope:'.length;
      const scopeEndIndex = purposeIndex !== -1 ? purposeIndex : descriptionText.length;
      scope = descriptionText.substring(scopeStartIndex, scopeEndIndex).trim();
    }
    
    if (purposeIndex !== -1) {
      const purposeStartIndex = purposeIndex + 'Purpose:'.length;
      purpose = descriptionText.substring(purposeStartIndex).trim();
    }
  }

  // Get user names for display
  const getUserName = (userId: number | null | undefined) => {
    if (!userId) return 'Unknown User';
    const user = (users || []).find(u => u && u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  // Group inputs by category for better organization
  const inputsByCategory = (inputs || []).reduce<Record<string, any[]>>((acc, input) => {
    if (!input) return acc;
    const categoryName = input.categoryName || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(input);
    return acc;
  }, {});

  // Badge for review status
  const getStatusBadge = (status: string | undefined | null) => {
    // Handle undefined or null status
    if (!status) {
      return <BadgeColored color="gray">Unknown</BadgeColored>;
    }
    
    switch (status.toLowerCase()) {
      case 'scheduled':
        return <BadgeColored color="blue">{status}</BadgeColored>;
      case 'in-progress':
      case 'in progress':
        return <BadgeColored color="amber">{status}</BadgeColored>;
      case 'completed':
        return <BadgeColored color="green">{status}</BadgeColored>;
      case 'cancelled':
        return <BadgeColored color="red">{status}</BadgeColored>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Badge for action item status
  const getActionItemStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not_started':
      case 'open':
        return <BadgeColored color="blue">Open</BadgeColored>;
      case 'in-progress':
      case 'in_progress':
        return <BadgeColored color="amber">In Progress</BadgeColored>;
      case 'completed':
        return <BadgeColored color="green">Completed</BadgeColored>;
      case 'verified':
        return <BadgeColored color="indigo">Verified</BadgeColored>;
      case 'overdue':
        return <BadgeColored color="red">Overdue</BadgeColored>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with review details and actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            {review?.title || "Untitled Review"}
            {getStatusBadge(review?.status)}
          </h2>
          <p className="text-muted-foreground">Review ID: {review?.reviewId || review?.id || "N/A"}</p>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm text-muted-foreground mt-2">
            {(review?.reviewDate || review?.review_date) && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  Scheduled: {format(new Date(review.reviewDate || review.review_date), 'MMMM d, yyyy')}
                </span>
              </div>
            )}
            {review?.completionDate && (
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4" />
                <span>
                  Completed: {format(new Date(review.completionDate), 'MMMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Always show Edit button regardless of status */}
          <Button size="sm" variant="outline" onClick={() => onEditReview()}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Review
          </Button>
          
          {/* Only show Delete button if not completed */}
          {review?.status !== 'completed' && (
            <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          
          {/* Status transition buttons */}
          {review?.status === 'scheduled' && (
            <Button size="sm" onClick={() => onUpdateStatus('in-progress')} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Start Review & Add Inputs
            </Button>
          )}

          {review?.status === 'in-progress' && (
            <Button size="sm" onClick={() => onUpdateStatus('completed')}>
              Complete Review
            </Button>
          )}
          
          {(review?.status === 'in-progress' || review?.status === 'completed') && signatures.length === 0 && (
            <Button size="sm" onClick={() => onSignReview()}>
              Sign Review
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="inputs">
            Inputs <Badge variant="outline" className="ml-2">{inputs?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="participants">
            Participants <Badge variant="outline" className="ml-2">{participants?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="actionItems">
            Action Items <Badge variant="outline" className="ml-2">{actionItems?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="signatures">
            Signatures <Badge variant="outline" className="ml-2">{signatures?.length || 0}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="pt-4">
          {/* Quick Start Section for Scheduled Reviews */}
          {review?.status === 'scheduled' && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Ready to Start Review
                </CardTitle>
                <CardDescription className="text-green-700">
                  This review is scheduled and ready to begin. Add inputs and participants to start the management review process.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => onAddInput()} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Input
                  </Button>
                  <Button 
                    onClick={() => onAddParticipant()} 
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-100"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add Participants
                  </Button>
                  <Button 
                    onClick={() => onAddActionItem()} 
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-100"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Action Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">Scope</h4>
                  <p className="text-sm text-muted-foreground">{scope || review?.scope || 'No scope defined'}</p>
                </div>
                {purpose && (
                  <div>
                    <h4 className="font-medium text-sm">Purpose</h4>
                    <p className="text-sm text-muted-foreground">{purpose}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm">Summary</h4>
                  <p className="text-sm text-muted-foreground">{review?.summary || 'No summary available'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Conclusion</h4>
                  <p className="text-sm text-muted-foreground">{review?.conclusion || 'No conclusion available'}</p>
                </div>
                {review?.facilityId && (
                  <div>
                    <h4 className="font-medium text-sm">Facility</h4>
                    <p className="text-sm text-muted-foreground">{review?.facilityName || review?.facilityId}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm">Created By</h4>
                  <p className="text-sm text-muted-foreground">{getUserName(review?.initiatedBy || review?.created_by)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Required Inputs</span>
                    <span className="text-sm">
                      {inputs.filter(i => i.required).length} / {/* Total required inputs count */}
                      {11}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Action Items</span>
                    <div className="flex gap-2 text-sm">
                      <span>Completed: {actionItems.filter(a => a.status === 'completed' || a.status === 'verified').length}</span>
                      <span>Total: {actionItems.length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Participants</span>
                    <span className="text-sm">{participants.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Signatures</span>
                    <span className="text-sm">{signatures.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Summary of Inputs, Participants, and Action Items */}
          <div className="grid grid-cols-1 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Findings & Metrics</CardTitle>
                <CardDescription>Summary of key data points from this review</CardDescription>
              </CardHeader>
              <CardContent>
                {inputs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inputs have been added to this review yet.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Display a few important inputs */}
                    {Object.entries(inputsByCategory).slice(0, 3).map(([category, categoryInputs]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium mb-2">{category}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {categoryInputs.slice(0, 2).map(input => (
                            <li key={input.id} className="text-sm text-muted-foreground">
                              {input.content && input.content.length > 100 
                                ? input.content.substring(0, 100) + '...' 
                                : input.content || 'No content'
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {Object.keys(inputsByCategory).length > 3 && (
                      <p className="text-sm text-muted-foreground italic">
                        And {Object.keys(inputsByCategory).length - 3} more categories...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inputs Tab */}
        <TabsContent value="inputs" className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Review Inputs</h3>
            {review.status !== 'completed' && (
              <Button size="sm" onClick={onAddInput}>
                <Plus className="h-4 w-4 mr-2" />
                Add Input
              </Button>
            )}
          </div>

          {inputs.length === 0 ? (
            <Card>
              <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No inputs added</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Add inputs from various categories such as customer feedback, audit results, and corrective actions to conduct a comprehensive management review.
                </p>
                {review.status !== 'completed' && (
                  <Button onClick={onAddInput}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Input
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(inputsByCategory).map(([category, categoryInputs]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-md">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryInputs.map(input => (
                      <div key={input.id} className="border-b pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{input.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Contributor: {getUserName(input.contributorId)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Added: {format(new Date(input.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          {review.status !== 'completed' && onEditInput && onDeleteInput && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => onEditInput(input)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onDeleteInput(input.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {input.attachmentPath && (
                          <div className="mt-2">
                            <a 
                              href={input.attachmentPath} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              View Attachment
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Participants</h3>
            {review.status !== 'completed' && (
              <Button size="sm" onClick={onAddParticipant}>
                <Plus className="h-4 w-4 mr-2" />
                Add Participant
              </Button>
            )}
          </div>

          {participants.length === 0 ? (
            <Card>
              <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No participants added</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Add participants who will attend the management review meeting. Include key stakeholders from quality, regulatory, operations, and management teams.
                </p>
                {review.status !== 'completed' && (
                  <Button onClick={onAddParticipant}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Participant
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Attendance</TableHead>
                  {review.status !== 'completed' && onEditParticipant && onDeleteParticipant && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map(participant => {
                  const user = users.find(u => u.id === participant.userId);
                  return (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                        </div>
                      </TableCell>
                      <TableCell>{participant.role}</TableCell>
                      <TableCell>{user?.department || '-'}</TableCell>
                      <TableCell>
                        {participant.attended ? (
                          <BadgeColored color="green">Attended</BadgeColored>
                        ) : review.status === 'completed' ? (
                          <Badge variant="destructive">Did Not Attend</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      {review.status !== 'completed' && onEditParticipant && onDeleteParticipant && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onEditParticipant(participant)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onDeleteParticipant(participant.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actionItems" className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Action Items</h3>
            {(review.status === 'in-progress' || review.status === 'completed') && (
              <Button size="sm" onClick={onAddActionItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Action Item
              </Button>
            )}
          </div>

          {actionItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                <Check className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No action items created</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Action items are tasks assigned to team members based on management review findings. These items help drive continuous improvement in your quality management system.
                </p>
                {(review.status === 'in-progress' || review.status === 'completed') && (
                  <Button onClick={onAddActionItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Action Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  {onEditActionItem && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionItems.map(item => {
                  const assignedUser = users.find(u => u.id === item.assignedTo);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.priority === 'high' && (
                            <Badge variant="destructive">High</Badge>
                          )}
                          {item.description}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {assignedUser ? `${assignedUser.firstName.charAt(0)}${assignedUser.lastName.charAt(0)}` : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unknown User'}
                        </div>
                      </TableCell>
                      <TableCell>{item.dueDate ? format(new Date(item.dueDate), 'MMM d, yyyy') : 'No date set'}</TableCell>
                      <TableCell>{getActionItemStatusBadge(item.status)}</TableCell>
                      {onEditActionItem && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => onEditActionItem(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Signatures</h3>
            {(review.status === 'in-progress' || review.status === 'completed') && signatures.length === 0 && (
              <Button size="sm" onClick={onSignReview}>
                <Pen className="h-4 w-4 mr-2" />
                Sign Review
              </Button>
            )}
          </div>

          {signatures.length === 0 ? (
            <Card>
              <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                <Pen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No signatures recorded</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Management reviews require signatures from authorized personnel to verify that the review was conducted according to quality system requirements.
                </p>
                {(review.status === 'in-progress' || review.status === 'completed') && (
                  <Button onClick={onSignReview}>
                    <Pen className="h-4 w-4 mr-2" />
                    Sign Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signatures.map(signature => {
                  const user = users.find(u => u.id === signature.userId);
                  return (
                    <TableRow key={signature.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                        </div>
                      </TableCell>
                      <TableCell>{signature.role}</TableCell>
                      <TableCell>{signature.signatureDate ? format(new Date(signature.signatureDate), 'MMM d, yyyy HH:mm') : 'No date set'}</TableCell>
                      <TableCell>{signature.comments || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Management Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this management review? This action cannot be undone
              and all associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onDeleteReview();
                setDeleteConfirmOpen(false);
              }}
            >
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}