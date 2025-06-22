import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Edit, Trash2, Link, ExternalLink, FileText, CheckSquare, Shield, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TraceabilityLink {
  id: number;
  projectId: number;
  designInputId: string;
  designInputTitle: string;
  designOutputId: string;
  designOutputTitle: string;
  verificationId?: string;
  verificationTitle?: string;
  validationId?: string;
  validationTitle?: string;
  status: 'complete' | 'in_progress' | 'pending' | 'missing';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  regulatoryImpact: boolean;
  notes?: string;
  lastUpdated: string;
  updatedBy: number;
}

const traceabilityLinkSchema = z.object({
  designInputId: z.string().min(1, "Design input ID is required"),
  designInputTitle: z.string().min(1, "Design input title is required"),
  designOutputId: z.string().min(1, "Design output ID is required"),
  designOutputTitle: z.string().min(1, "Design output title is required"),
  verificationId: z.string().optional(),
  verificationTitle: z.string().optional(),
  validationId: z.string().optional(),
  validationTitle: z.string().optional(),
  status: z.enum(['complete', 'in_progress', 'pending', 'missing']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  regulatoryImpact: z.boolean(),
  notes: z.string().optional(),
});

type TraceabilityLinkFormData = z.infer<typeof traceabilityLinkSchema>;

interface TraceabilityMatrixProps {
  projectId: number;
}

export function TraceabilityMatrix({ projectId }: TraceabilityMatrixProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<TraceabilityLink | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TraceabilityLinkFormData>({
    resolver: zodResolver(traceabilityLinkSchema),
    defaultValues: {
      status: 'pending',
      riskLevel: 'medium',
      regulatoryImpact: false,
    },
  });

  // Fetch traceability links
  const { data: traceabilityLinks = [], isLoading } = useQuery<TraceabilityLink[]>({
    queryKey: [`/api/design-projects/${projectId}/traceability`],
    queryFn: () => apiRequest("GET", `/api/design-projects/${projectId}/traceability`),
  });

  // Create traceability link mutation
  const createLinkMutation = useMutation({
    mutationFn: (data: TraceabilityLinkFormData) => {
      return apiRequest("POST", `/api/design-projects/${projectId}/traceability`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-projects/${projectId}/traceability`] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Traceability link created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create traceability link",
        variant: "destructive",
      });
    },
  });

  // Update traceability link mutation
  const updateLinkMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TraceabilityLinkFormData> }) => {
      return apiRequest("PATCH", `/api/design-projects/${projectId}/traceability/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-projects/${projectId}/traceability`] });
      setEditingLink(null);
      toast({
        title: "Success",
        description: "Traceability link updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update traceability link",
        variant: "destructive",
      });
    },
  });

  // Delete traceability link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/design-projects/${projectId}/traceability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-projects/${projectId}/traceability`] });
      toast({
        title: "Success",
        description: "Traceability link deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete traceability link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TraceabilityLinkFormData) => {
    if (editingLink) {
      updateLinkMutation.mutate({ id: editingLink.id, data });
    } else {
      createLinkMutation.mutate(data);
    }
  };

  const handleEdit = (link: TraceabilityLink) => {
    setEditingLink(link);
    form.reset({
      designInputId: link.designInputId,
      designInputTitle: link.designInputTitle,
      designOutputId: link.designOutputId,
      designOutputTitle: link.designOutputTitle,
      verificationId: link.verificationId || '',
      verificationTitle: link.verificationTitle || '',
      validationId: link.validationId || '',
      validationTitle: link.validationTitle || '',
      status: link.status,
      riskLevel: link.riskLevel,
      regulatoryImpact: link.regulatoryImpact,
      notes: link.notes || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this traceability link?')) {
      deleteLinkMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionStats = () => {
    const total = traceabilityLinks.length;
    const complete = traceabilityLinks.filter(link => link.status === 'complete').length;
    const inProgress = traceabilityLinks.filter(link => link.status === 'in_progress').length;
    const pending = traceabilityLinks.filter(link => link.status === 'pending').length;
    const missing = traceabilityLinks.filter(link => link.status === 'missing').length;
    
    return { total, complete, inProgress, pending, missing };
  };

  const stats = getCompletionStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Design Traceability Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Link className="h-5 w-5 mr-2" />
              Design Traceability Matrix
            </CardTitle>
            <CardDescription>
              Complete traceability from design inputs through design outputs, verification, and validation
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Matrix
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLink ? 'Edit Traceability Link' : 'Add Traceability Link'}
                  </DialogTitle>
                  <DialogDescription>
                    Create a traceability link between design inputs, outputs, verification, and validation activities.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="designInputId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Design Input ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="DI-001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="designInputTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Design Input Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="User Requirements" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="designOutputId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Design Output ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="DO-001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="designOutputTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Design Output Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="System Specifications" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="verificationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification ID (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="VT-001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="verificationTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Title (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Requirements Review" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="validationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validation ID (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="VL-001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="validationTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validation Title (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="User Acceptance Testing" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="complete">Complete</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="missing">Missing</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="riskLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risk Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select risk level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="regulatoryImpact"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Regulatory Impact</FormLabel>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Additional notes or comments..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingLink(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLinkMutation.isPending || updateLinkMutation.isPending}>
                        {editingLink ? 'Update' : 'Create'} Link
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Links</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{stats.complete}</div>
              <div className="text-sm text-green-600">Complete</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
              <div className="text-sm text-blue-600">In Progress</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{stats.missing}</div>
              <div className="text-sm text-red-600">Missing</div>
            </div>
          </div>

          {/* Traceability Links Table */}
          {traceabilityLinks.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Input</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Output</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {traceabilityLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{link.designInputId}</div>
                            <div className="text-xs text-gray-500">{link.designInputTitle}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{link.designOutputId}</div>
                            <div className="text-xs text-gray-500">{link.designOutputTitle}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {link.verificationId ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{link.verificationId}</div>
                              <div className="text-xs text-gray-500">{link.verificationTitle}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not linked</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {link.validationId ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{link.validationId}</div>
                              <div className="text-xs text-gray-500">{link.validationTitle}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not linked</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={getStatusColor(link.status)}>
                            {link.status.replace('_', ' ')}
                          </Badge>
                          {link.regulatoryImpact && (
                            <Badge variant="outline" className="ml-1 bg-blue-100 text-blue-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Regulatory
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={getRiskColor(link.riskLevel)}>
                            {link.riskLevel}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(link)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(link.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Link className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Traceability Links</h3>
              <p className="text-gray-500 mb-4">
                Start building your design traceability matrix by adding links between design inputs and outputs.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Link
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}