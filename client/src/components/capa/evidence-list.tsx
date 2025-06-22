import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionEvidence, useAddEvidenceMutation, useVerifyActionMutation } from "@/hooks/use-capa-actions";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

import {
  AlertCircle,
  FileText,
  Link2,
  Loader2,
  Plus,
  ThumbsUp,
  Upload,
  Clock,
  User2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EvidenceListProps {
  actionId: number;
}

export function EvidenceList({ actionId }: EvidenceListProps) {
  const { data: evidence, isLoading, error } = useActionEvidence(actionId);
  const { user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <h3 className="text-lg font-semibold">Error loading evidence</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Evidence & Verification</h3>
        <AddEvidenceDialog actionId={actionId} />
      </div>
      
      {!evidence?.length ? (
        <div className="rounded-md bg-muted p-8 text-center">
          <h3 className="text-sm font-medium mb-2">No evidence uploaded yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Upload documentation, test results, or other evidence to demonstrate completion of this action.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evidence.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <CardDescription className="text-xs">
                      Uploaded {format(new Date(item.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </CardDescription>
                  </div>
                  
                  {item.evidenceType === "link" ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Link2 className="h-3 w-3 mr-1" />
                      Link
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <FileText className="h-3 w-3 mr-1" />
                      Document
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <p className="text-sm">{item.description}</p>
                
                {item.evidenceType === "link" && item.url && (
                  <div className="flex items-center">
                    <Link2 className="h-4 w-4 mr-1 text-blue-500" />
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {item.url}
                    </a>
                  </div>
                )}
                
                {item.reviewedBy ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-2 flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Verified</p>
                      <p className="text-xs text-green-600">{item.reviewComments}</p>
                    </div>
                  </div>
                ) : (
                  user && user.role === "admin" && (
                    <VerifyEvidenceDialog actionId={actionId} evidenceId={item.id} />
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* If all evidence is provided but action not verified, show verification button for admins */}
      {evidence?.length > 0 && !evidence.some(e => e.reviewedBy) && user?.role === "admin" && (
        <VerifyActionDialog actionId={actionId} />
      )}
    </div>
  );
}

// Form to add evidence
function AddEvidenceDialog({ actionId }: { actionId: number }) {
  const [open, setOpen] = useState(false);
  const addEvidence = useAddEvidenceMutation();
  
  const evidenceFormSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    evidenceType: z.enum(["document", "link"]),
    url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    // In a real implementation, we would handle file uploads
    // For now, we'll just simulate with a link
  });
  
  type EvidenceFormValues = z.infer<typeof evidenceFormSchema>;
  
  const form = useForm<EvidenceFormValues>({
    resolver: zodResolver(evidenceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      evidenceType: "link",
      url: "",
    },
  });
  
  const watchEvidenceType = form.watch("evidenceType");
  
  function onSubmit(data: EvidenceFormValues) {
    // For document uploads, we'd handle file uploads here
    // For now, let's just use the link approach
    
    addEvidence.mutate({
      actionId,
      evidence: {
        ...data,
        timestamp: new Date(),
      }
    }, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      }
    });
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Evidence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Action Evidence</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Evidence title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this evidence" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="evidenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="document">Document Upload</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {watchEvidenceType === 'link' && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {watchEvidenceType === 'document' && (
              <div className="border border-dashed rounded-md p-4 text-center">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Upload Document</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Drag and drop files here or click to browse
                </p>
                <Button variant="outline" size="sm" type="button">
                  Browse Files
                </Button>
                <FormDescription className="text-xs mt-2">
                  Max file size: 10MB. Supported formats: PDF, DOCX, XLSX, JPG, PNG
                </FormDescription>
              </div>
            )}
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={addEvidence.isPending}
              >
                {addEvidence.isPending ? "Submitting..." : "Submit Evidence"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Form to verify evidence
function VerifyEvidenceDialog({ actionId, evidenceId }: { actionId: number, evidenceId: number }) {
  const [open, setOpen] = useState(false);
  
  // In a real implementation, we would have a mutation to verify evidence
  // For now, we'll just use a placeholder
  
  const handleVerify = () => {
    // Handle verification
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <ThumbsUp className="h-4 w-4 mr-1" />
          Verify This Evidence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Evidence</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Verification Comments</h4>
            <Textarea
              placeholder="Add your verification comments..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Verification Status</h4>
            <Select defaultValue="approved">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" onClick={handleVerify}>
              Submit Verification
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Form to verify entire action
function VerifyActionDialog({ actionId }: { actionId: number }) {
  const [open, setOpen] = useState(false);
  const verifyAction = useVerifyActionMutation();
  
  const verificationFormSchema = z.object({
    status: z.enum(["approved", "rejected"], {
      required_error: "Please select verification status",
    }),
    comments: z.string().min(10, "Comments must be at least 10 characters"),
  });
  
  type VerificationFormValues = z.infer<typeof verificationFormSchema>;
  
  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      status: "approved",
      comments: "",
    },
  });
  
  function onSubmit(data: VerificationFormValues) {
    verifyAction.mutate({
      actionId,
      verification: {
        ...data,
        verifiedAt: new Date(),
      }
    }, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      }
    });
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Verify This Action
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Action</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Comments</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add your verification comments" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={verifyAction.isPending}
              >
                {verifyAction.isPending ? "Submitting..." : "Submit Verification"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}