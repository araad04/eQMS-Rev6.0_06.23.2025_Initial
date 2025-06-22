import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Form schema for creating a new document
const documentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  documentId: z.string().min(1, "Document ID is required"),
  typeId: z.coerce.number().min(1, "Type is required"),
  statusId: z.coerce.number().min(1, "Status is required"),
  revision: z.string().min(1, "Revision is required"),
  createdBy: z.coerce.number().min(1, "Created by is required"),
  filePath: z.string().optional(),
  approvedBy: z.coerce.number().optional(),
  effectiveDate: z.date().optional(),
  expirationDate: z.date().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

export default function DocumentCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Generate a unique Document ID
  const generateDocumentId = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DOC-${year}-${month}-${random}`;
  };
  
  // Form for creating a new document
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      documentId: generateDocumentId(),
      typeId: 1, // Default to 'SOP'
      statusId: 1, // Default to 'Draft'
      revision: "A",
      createdBy: 2, // Default to current user (assuming user ID 2)
      filePath: undefined,
      approvedBy: undefined,
      effectiveDate: undefined,
      expirationDate: undefined,
    },
  });
  
  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      const res = await apiRequest("POST", "/api/documents", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Document created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      navigate("/document-control");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create document: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: DocumentFormValues) => {
    createDocumentMutation.mutate(data);
  };
  
  return (
    <>
      <PageHeader 
        title="Create Document"
        description="Create a new controlled document"
        actions={[
          {
            label: "Back to Document List",
            href: "/document-control",
            icon: <ArrowLeft className="h-5 w-5" />,
            variant: "outline",
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="documentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Auto-generated ID for this document
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="revision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Revision</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Current revision of this document
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document title" {...field} />
                      </FormControl>
                      <FormDescription>
                        Brief title describing the document
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">SOP</SelectItem>
                            <SelectItem value="2">Work Instruction</SelectItem>
                            <SelectItem value="3">Form</SelectItem>
                            <SelectItem value="4">Policy</SelectItem>
                            <SelectItem value="5">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Type of document
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="statusId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Draft</SelectItem>
                            <SelectItem value="2">In Review</SelectItem>
                            <SelectItem value="3">Approved</SelectItem>
                            <SelectItem value="4">Obsolete</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="filePath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document File</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="File path or URL"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => {
                            // In a real implementation, this would open a file upload dialog
                            toast({
                              title: "File Upload",
                              description: "File upload would be implemented in a production environment",
                            });
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        Path or URL to the document file (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="approvedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approved By</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select approver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Admin User</SelectItem>
                            <SelectItem value="2">Quality Manager</SelectItem>
                            <SelectItem value="3">QA Specialist</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Person who approved this document (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="effectiveDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Effective Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={!field.value ? "text-muted-foreground" : ""}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Date when this document becomes effective (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiration Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={!field.value ? "text-muted-foreground" : ""}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Date when this document expires (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/document-control")}
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}