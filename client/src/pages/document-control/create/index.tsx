import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Upload, FileText, Save, AlertCircle, Calendar, User, Building, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const documentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  typeId: z.number().min(1, "Document type is required"),
  department: z.string().min(1, "Department is required"),

  purpose: z.string().optional(),
  scope: z.string().optional(),
  content: z.string().optional(),
  confidentialityLevel: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL"]).default("INTERNAL"),
  distributionList: z.array(z.string()).optional(),
  isControlled: z.boolean().default(true),
  trainingRequired: z.boolean().default(false),
  keywords: z.string().optional(),
  relatedDocuments: z.array(z.number()).optional(),
  file: z.any().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface DocumentType {
  id: number;
  name: string;
  prefix: string;
  categoryId: number;
}

interface DocumentCategory {
  id: number;
  name: string;
  description: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
}

const departments = [
  "Quality Assurance",
  "Quality Control", 
  "Engineering",
  "Manufacturing",
  "Regulatory Affairs",
  "Research & Development",
  "Operations",
  "Management"
];



export default function CreateDocument() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDocumentNumber, setPreviewDocumentNumber] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document types
  const { data: documentTypes = [] } = useQuery<DocumentType[]>({
    queryKey: ["/api/iso13485-documents/types"],
  });

  // Fetch document categories
  const { data: categories = [] } = useQuery<DocumentCategory[]>({
    queryKey: ["/api/iso13485-documents/categories"],
  });

  // Fetch users for owner selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: false, // Enable when needed
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      typeId: 0,
      department: "",

      purpose: "",
      scope: "",
      content: "",
      confidentialityLevel: "INTERNAL",
      distributionList: [],
      isControlled: true,
      trainingRequired: false,
      keywords: "",
      relatedDocuments: [],
    },
  });

  // Watch typeId to generate document number preview
  const selectedTypeId = form.watch("typeId");

  // Generate document number preview when type changes
  const generateDocumentNumber = useMutation({
    mutationFn: async (typeId: number) => {
      const response = await fetch(`/api/iso13485-documents/generate-number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ typeId }),
      });
      const data = await response.json();
      return data.documentNumber;
    },
    onSuccess: (documentNumber) => {
      setPreviewDocumentNumber(documentNumber);
    },
  });

  // Create document mutation
  const createDocument = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const formData = new FormData();
      
      // Add document metadata
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'file' && value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add file if selected
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`/api/iso13485-documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (document) => {
      toast({
        title: "Document Created Successfully",
        description: `Document ${document.documentNumber} has been created and assigned for review.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/iso13485-documents"] });
      setLocation("/document-control");
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Document",
        description: error.message || "Failed to create document. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle type selection and generate document number
  const handleTypeChange = (typeId: string) => {
    const id = parseInt(typeId);
    form.setValue("typeId", id);
    
    if (id > 0) {
      generateDocumentNumber.mutate(id);
      
      // Set automatic 2-year review period for SOPs
      const selectedType = documentTypes.find(t => t.id === id);
      if (selectedType?.name === "Standard Operating Procedure") {
        form.setValue("trainingRequired", true);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF, Word document, or text file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Auto-fill title if empty
      if (!form.getValues("title")) {
        const filename = file.name.replace(/\.[^/.]+$/, "");
        form.setValue("title", filename);
      }
    }
  };

  const onSubmit = (data: DocumentFormData) => {
    createDocument.mutate(data);
  };

  const selectedType = documentTypes.find(t => t.id === selectedTypeId);
  const selectedCategory = categories.find(c => c.id === selectedType?.categoryId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Create New Document</h1>
          <p className="text-gray-600 mt-1">
            Create and upload a new controlled document with automatic ID assignment
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/document-control")}>
          Cancel
        </Button>
      </div>

      {/* Document Number Preview */}
      {previewDocumentNumber && (
        <Alert>
          <Tag className="h-4 w-4" />
          <AlertDescription>
            <strong>Document Number Preview:</strong> {previewDocumentNumber}
            {selectedType?.name === "Standard Operating Procedure" && (
              <span className="ml-2 text-blue-600">
                • 2-year review period will be automatically scheduled
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Document Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Document Information
                  </CardTitle>
                  <CardDescription>
                    Basic document details and classification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Document Type */}
                  <FormField
                    control={form.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type *</FormLabel>
                        <Select onValueChange={handleTypeChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <div key={category.id}>
                                <div className="px-2 py-1 text-sm font-semibold text-gray-500">
                                  {category.name}
                                </div>
                                {documentTypes
                                  .filter(type => type.categoryId === category.id)
                                  .map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                      {type.name} ({type.prefix})
                                    </SelectItem>
                                  ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter document title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Department */}
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Document File
                  </CardTitle>
                  <CardDescription>
                    Upload the document file (PDF, Word, or text format)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        {selectedFile ? selectedFile.name : "Upload Document File"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Drag and drop or click to select (PDF, Word, Text - Max 10MB)
                      </p>
                    </label>
                    {selectedFile && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center">
                          <FileText className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm text-green-700">
                            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Settings</CardTitle>
                  <CardDescription>
                    Control and compliance settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Confidentiality Level */}
                  <FormField
                    control={form.control}
                    name="confidentialityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confidentiality Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Public</SelectItem>
                            <SelectItem value="INTERNAL">Internal</SelectItem>
                            <SelectItem value="CONFIDENTIAL">Confidential/Restricted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Training Required */}
                  <FormField
                    control={form.control}
                    name="trainingRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Training Required</FormLabel>
                          <FormDescription>
                            Require training before document access
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* SOP Review Period Notice */}
                  {selectedType?.name === "Standard Operating Procedure" && (
                    <Alert>
                      <Calendar className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Automatic Review Schedule:</strong> This SOP will be automatically scheduled for review every 2 years from the effective date. Training will be required for all users.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/document-control")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createDocument.isPending}
              className="min-w-[120px]"
            >
              {createDocument.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Document
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}