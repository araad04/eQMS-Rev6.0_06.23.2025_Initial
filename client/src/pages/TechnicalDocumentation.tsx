import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, Download, Upload, CheckCircle2, Clock, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

// Schema for creating new technical document
const createTechnicalDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  deviceType: z.string().min(1, "Device type is required"),
  deviceModel: z.string().min(1, "Device model is required"),
  intendedPurpose: z.string().min(1, "Intended purpose is required"),
  riskClass: z.enum(["CLASS_I", "CLASS_IIA", "CLASS_IIB", "CLASS_III"]),
  description: z.string().optional(),
  targetMarket: z.string().min(1, "Target market is required"),
});

type CreateTechnicalDocumentForm = z.infer<typeof createTechnicalDocumentSchema>;

interface TechnicalDocument {
  id: number;
  documentNumber: string;
  title: string;
  deviceType: string;
  deviceModel: string;
  intendedPurpose: string;
  riskClass: string;
  description?: string;
  targetMarket: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
}

interface MDRSection {
  id: number;
  sectionNumber: string;
  title: string;
  description: string;
  isRequired: boolean;
  template?: string;
  sortOrder: number;
}

interface CompletionStats {
  totalSections: number;
  completedSections: number;
  inProgressSections: number;
  notStartedSections: number;
  completionPercentage: number;
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800", 
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800"
};

const statusIcons = {
  DRAFT: Clock,
  IN_REVIEW: AlertCircle,
  APPROVED: CheckCircle2,
  REJECTED: AlertCircle
};

export default function TechnicalDocumentation() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch technical documents
  const { data: documents, isLoading } = useQuery<TechnicalDocument[]>({
    queryKey: ["/api/technical-documentation"],
    enabled: true,
  });

  // Fetch MDR sections structure
  const { data: mdrSections } = useQuery<MDRSection[]>({
    queryKey: ["/api/technical-documentation/mdr-sections/structure"],
    enabled: true,
  });

  // Create technical document mutation
  const createDocumentMutation = useMutation({
    mutationFn: (data: CreateTechnicalDocumentForm) => 
      apiRequest("/api/technical-documentation", "POST", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Technical document created successfully",
      });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/technical-documentation"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create technical document",
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateTechnicalDocumentForm>({
    resolver: zodResolver(createTechnicalDocumentSchema),
    defaultValues: {
      title: "",
      deviceType: "",
      deviceModel: "",
      intendedPurpose: "",
      riskClass: "CLASS_I",
      description: "",
      targetMarket: "",
    },
  });

  const onSubmit = (data: CreateTechnicalDocumentForm) => {
    createDocumentMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technical Documentation</h1>
          <p className="text-muted-foreground">
            Manage MDR-compliant technical documentation for medical devices
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Technical Document</DialogTitle>
              <DialogDescription>
                Create a new MDR-compliant technical documentation package
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Cardiac Monitor TD-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Cardiac Monitor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deviceModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CM-2000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Classification</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CLASS_I">Class I</SelectItem>
                            <SelectItem value="CLASS_IIA">Class IIa</SelectItem>
                            <SelectItem value="CLASS_IIB">Class IIb</SelectItem>
                            <SelectItem value="CLASS_III">Class III</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="intendedPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intended Purpose</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the intended purpose and clinical use..."
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
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Market</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., European Union, United States" {...field} />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional description..."
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createDocumentMutation.isPending}
                  >
                    {createDocumentMutation.isPending ? "Creating..." : "Create Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* MDR Sections Overview */}
      {mdrSections && (
        <Card>
          <CardHeader>
            <CardTitle>MDR Section Structure</CardTitle>
            <CardDescription>
              14 core sections required for MDR compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mdrSections.map((section) => (
                <Card key={section.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="shrink-0">
                      {section.sectionNumber}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm leading-tight">
                        {section.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.description}
                      </p>
                      {section.isRequired && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Documents</CardTitle>
          <CardDescription>
            Manage your MDR-compliant technical documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => {
                const StatusIcon = statusIcons[doc.status];
                return (
                  <Card key={doc.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">{doc.title}</h3>
                            <Badge className={statusColors[doc.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {doc.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Document Number: {doc.documentNumber}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Device Type:</span>
                              <p className="text-muted-foreground">{doc.deviceType}</p>
                            </div>
                            <div>
                              <span className="font-medium">Model:</span>
                              <p className="text-muted-foreground">{doc.deviceModel}</p>
                            </div>
                            <div>
                              <span className="font-medium">Risk Class:</span>
                              <p className="text-muted-foreground">{doc.riskClass.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <span className="font-medium">Target Market:</span>
                              <p className="text-muted-foreground">{doc.targetMarket}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Completion Progress</span>
                              <span className="text-sm text-muted-foreground">
                                {doc.completionPercentage}%
                              </span>
                            </div>
                            <Progress value={doc.completionPercentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Link href={`/technical-documentation/${doc.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
              <p className="mt-2 text-muted-foreground">
                Create your first technical documentation to get started
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}