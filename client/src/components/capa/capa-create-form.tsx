import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  ArrowLeft,
  AlertTriangle,
  Check,
  FileText,
  Upload,
  Clipboard,
  PencilRuler,
  SearchCheck,
  Loader2,
  Save,
  FileOutput,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

// Form schema for creating a new CAPA
const capaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  capaId: z.string().min(1, "CAPA ID is required"),
  description: z.string().min(1, "Description is required"),
  typeId: z.coerce.number().min(1, "Type is required"),
  statusId: z.coerce.number().min(1, "Status is required"),
  initiatedBy: z.coerce.number().min(1, "Initiated by is required"),
  assignedTo: z.coerce.number().optional(),
  dueDate: z.date().optional(),
  // New fields for improved CAPA workflow
  source: z.string().min(1, "Source is required"),
  riskAssessment: z.string().optional(),
  severity: z.string().optional(),
  occurrence: z.string().optional(),
  patientSafetyImpact: z.boolean().default(false),
  productPerformanceImpact: z.boolean().default(false),
  complianceImpact: z.boolean().default(false),
  immediateContainment: z.boolean().default(false),
  containmentActions: z.string().optional(),
  rcaMethod: z.string().min(1, "RCA method is required"),
  why1: z.string().optional(),
  why2: z.string().optional(),
  why3: z.string().optional(),
  why4: z.string().optional(),
  why5: z.string().optional(),
  effectiveness: z.string().optional(),
});

type CapaFormValues = z.infer<typeof capaFormSchema>;

function calculateRPN(severity: string | undefined, occurrence: string | undefined) {
  if (!severity || !occurrence) return 0;
  return parseInt(severity) * parseInt(occurrence);
}

function rpnToCategory(rpn: number) {
  if (rpn >= 15) return "High Risk";
  if (rpn >= 8) return "Medium Risk";
  return "Low Risk";
}

function rpnToClass(rpn: number) {
  if (rpn >= 15) return "text-red-600";
  if (rpn >= 8) return "text-yellow-600";
  return "text-green-600";
}


export function CapaCreateForm() {
  const [currentTab, setCurrentTab] = useState("identification");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [showWhyAnalysis, setShowWhyAnalysis] = useState(false);

  // Default dropdown data in case the API doesn't respond
  const defaultUsers = [
    { id: 1, username: "admin", firstName: "Admin", lastName: "User" },
    { id: 2, username: "biomedical78", firstName: "Mohamed", lastName: "AlSaadi" }
  ];

  const defaultCapaTypes = [
    { id: 1, name: "Corrective Action" },
    { id: 2, name: "Preventive Action" },
    { id: 3, name: "Customer Complaint" }
  ];

  const defaultCapaStatuses = [
    { id: 1, name: "Open" },
    { id: 2, name: "In Progress" },
    { id: 3, name: "Closed" },
    { id: 4, name: "Cancelled" }
  ];

  // Query API data with fallback to defaults
  const { data: users = defaultUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: true
  });

  const { data: capaTypes = defaultCapaTypes } = useQuery({
    queryKey: ["/api/capa/types"],
    enabled: true
  });

  const { data: capaStatuses = defaultCapaStatuses } = useQuery({
    queryKey: ["/api/capa/statuses"],
    enabled: true
  });

  // Generate a unique CAPA ID
  const generateCapaId = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const uniqueNumber = Date.now() % 1000;
    return `CAPA-${year}-${month}-${String(uniqueNumber).padStart(3, '0')}`;
  };

  // Print and export functionality
  const handleExportPDF = async () => {
    if (!printRef.current) return;

    try {
      toast({
        title: "Preparing PDF...",
        description: "Please wait while we generate your PDF"
      });

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('capa-form.pdf');

      toast({
        title: "PDF exported successfully",
        description: "The PDF has been saved to your downloads folder"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error generating PDF",
        description: "There was a problem creating your PDF. Please try again."
      });
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'capa-form',
    onBeforeGetContent: () => {
      toast({
        title: "Preparing print...",
        description: "Getting content ready for printing"
      });
      return new Promise<void>((resolve) => {
        resolve();
      });
    },
    onAfterPrint: () => {
      toast({
        title: "Print successful",
        description: "Document has been sent to printer"
      });
    },
  });

  // Form for creating a new CAPA
  const form = useForm<CapaFormValues>({
    resolver: zodResolver(capaFormSchema),
    defaultValues: {
      title: "",
      capaId: generateCapaId(),
      description: "",
      typeId: 1, // Default to 'Corrective Action'
      statusId: 1, // Default to 'Open'
      initiatedBy: 2, // Default to current user (assuming user ID 2)
      assignedTo: undefined,
      dueDate: undefined,
      // New fields for improved CAPA workflow
      source: "internal_audit", // Default to internal audit
      riskAssessment: undefined,
      severity: undefined,
      occurrence: undefined,
      patientSafetyImpact: false,
      productPerformanceImpact: false,
      complianceImpact: false,
      immediateContainment: false,
      containmentActions: "",
      rcaMethod: "5whys",
      why1: "",
      why2: "",
      why3: "",
      why4: "",
      why5: "",
      effectiveness: "",
    },
  });

  // Create CAPA mutation
  const createCapaMutation = useMutation({
    mutationFn: async (data: CapaFormValues) => {
      const res = await apiRequest("POST", "/api/capas", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "CAPA created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/capas"] });
      navigate("/capa-management");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create CAPA: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CapaFormValues) => {
    // Copy data with the date value
    const submitData = {
      ...data,
      dueDate: dueDate
    };
    createCapaMutation.mutate(submitData);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">CAPA Registration</h1>
          <p className="text-gray-600">Corrective and Preventive Action per ISO 13485:2016</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileOutput className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div ref={printRef} className="print-container">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="identification" value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="identification" className="flex items-center gap-2">
                  <Clipboard className="h-4 w-4" />
                  <span>Identification</span>
                </TabsTrigger>
                <TabsTrigger value="risk-assessment" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risk Assessment</span>
                </TabsTrigger>
                <TabsTrigger value="containment" className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Containment</span>
                </TabsTrigger>
                <TabsTrigger value="root-cause" className="flex items-center gap-2">
                  <SearchCheck className="h-4 w-4" />
                  <span>Root Cause</span>
                </TabsTrigger>
                <TabsTrigger value="plan" className="flex items-center gap-2">
                  <PencilRuler className="h-4 w-4" />
                  <span>CAPA Plan</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* 1. Issue Identification Tab */}
                <TabsContent value="identification">
                  <Card>
                    <CardHeader>
                      <CardTitle>CAPA Identification</CardTitle>
                      <CardDescription>
                        Identify the source and details of the issue requiring CAPA
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="capaId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CAPA ID <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Auto-generated ID for this CAPA
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="typeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CAPA Type <span className="text-red-500">*</span></FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select CAPA type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {capaTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Type of corrective or preventive action
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
                            <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter CAPA title" {...field} />
                            </FormControl>
                            <FormDescription>
                              Brief title describing the issue or action
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the issue and required actions in detail" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Detailed description of the issue, its impact, and context
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source <span className="text-red-500">*</span></FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="internal_audit">Internal Audit</SelectItem>
                                <SelectItem value="customer_complaint">Customer Complaint</SelectItem>
                                <SelectItem value="nc_report">Nonconformance Report</SelectItem>
                                <SelectItem value="risk_analysis">Risk Analysis</SelectItem>
                                <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Origin or trigger for this CAPA
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label>Evidence Attachments</Label>
                        <div className="mt-2 border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                          <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                          <p className="text-sm text-neutral-600">
                            Drag and drop files here, or click to browse
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Supported file types: PDF, DOC, XLSX, JPG, PNG (max 10MB)
                          </p>
                          <Button type="button" variant="outline" size="sm" className="mt-4">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-4">
                      <div></div>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentTab("risk-assessment")}
                      >
                        Next: Risk Assessment
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* 2. Risk Assessment Tab */}
                <TabsContent value="risk-assessment">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preliminary Risk Assessment</CardTitle>
                      <CardDescription>
                        Assess the risk to patient safety, product performance, or compliance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="riskAssessment"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel>Risk Assessment <span className="text-red-500">*</span></FormLabel>
                            <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="severity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Severity</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select severity" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="1">1 - Negligible</SelectItem>
                                          <SelectItem value="2">2 - Minor</SelectItem>
                                          <SelectItem value="3">3 - Moderate</SelectItem>
                                          <SelectItem value="4">4 - Major</SelectItem>
                                          <SelectItem value="5">5 - Critical</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="occurrence"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Occurrence</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select occurrence" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="1">1 - Remote</SelectItem>
                                          <SelectItem value="2">2 - Unlikely</SelectItem>
                                          <SelectItem value="3">3 - Possible</SelectItem>
                                          <SelectItem value="4">4 - Likely</SelectItem>
                                          <SelectItem value="5">5 - Frequent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium mb-2">Risk Priority Number (RPN)</div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {calculateRPN(form.watch("severity"), form.watch("occurrence"))}
                                </div>
                                <div className={cn(
                                  "text-sm font-medium mt-1",
                                  rpnToClass(calculateRPN(form.watch("severity"), form.watch("occurrence")))
                                )}>
                                  {rpnToCategory(calculateRPN(form.watch("severity"), form.watch("occurrence")))}
                                </div>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <Label>Impact Areas</Label>
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="personnelSafetyImpact"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Personnel Safety Impact
                                  </FormLabel>
                                  <FormDescription>
                                    Issue impacts personnel safety or could cause harm
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="productPerformanceImpact"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Product Performance Impact
                                  </FormLabel>
                                  <FormDescription>
                                    Issue impacts product performance or functionality
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="complianceImpact"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Compliance Impact
                                  </FormLabel>
                                  <FormDescription>
                                    Issue impacts regulatory compliance
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentTab("identification")}
                      >
                        Previous: Identification
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentTab("containment")}
                      >
                        Next: Containment
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* 3. Containment Tab */}
                <TabsContent value="containment">
                  <Card>
                    <CardHeader>
                      <CardTitle>Immediate Containment Actions</CardTitle>
                      <CardDescription>
                        Define actions taken to limit the impact and contain the issue
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="immediateContainment"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Immediate Containment Required
                              </FormLabel>
                              <FormDescription>
                                Immediate containment actions are required to limit the impact
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="containmentActions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Containment Actions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the immediate actions taken or to be taken to contain the issue" 
                                className="min-h-[120px]"
                                {...field} 
                                disabled={!form.watch("immediateContainment")}
                              />
                            </FormControl>
                            <FormDescription>
                              Describe what temporary measures were taken to prevent further impact
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentTab("risk-assessment")}
                      >
                        Previous: Risk Assessment
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentTab("root-cause")}
                      >
                        Next: Root Cause
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* 4. Root Cause Analysis Tab */}
                <TabsContent value="root-cause">
                  <Card>
                    <CardHeader>
                      <CardTitle>Root Cause Analysis</CardTitle>
                      <CardDescription>
                        Identify the underlying cause(s) of the issue
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="rcaMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel>Root Cause Analysis Method <span className="text-red-500">*</span></FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setShowWhyAnalysis(value === '5whys');
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select RCA method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="5whys">5 Whys Analysis</SelectItem>
                                <SelectItem value="fishbone">Fishbone / Ishikawa</SelectItem>
                                <SelectItem value="fta">Fault Tree Analysis</SelectItem>
                                <SelectItem value="fmea">FMEA</SelectItem>
                              </SelectContent>
                            </Select>

                            {field.value === '5whys' && (
                              <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                                <h4 className="font-medium">5-Why Analysis</h4>
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <FormField
                                    key={num}
                                    control={form.control}
                                    name={`why${num}`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Why #{num}</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder={`Why ${num}: ${num === 1 ? 'Why did this issue occur?' : 'Why did the above happen?'}`}
                                            {...field}
                                          />
                                        </FormControl>
                                        {num === 5 && (
                                          <FormDescription>
                                            This should identify the root cause that needs to be addressed
                                          </FormDescription>
                                        )}
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                            <FormDescription>
                              Systematic approach to identify the true root cause
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium">RCA Process Guidelines</h3>
                        </div>
                        <p className="text-sm text-slate-700">
                          Root Cause Analysis should:
                        </p>
                        <ul className="text-sm text-slate-700 list-disc list-inside mt-2 space-y-1">
                          <li>Identify the deepest cause(s) - not just symptoms</li>
                          <li>Consider systems, processes, and human factors</li>
                          <li>Use factual evidence rather than assumptions</li>
                          <li>Include all relevant stakeholders in the analysis</li>
                          <li>Document conclusions with supporting evidence</li>
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentTab("containment")}
                      >
                        Previous: Containment
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentTab("plan")}
                      >
                        Next: CAPA Plan
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* 5. CAPA Plan Tab */}
                <TabsContent value="plan">
                  <Card>
                    <CardHeader>
                      <CardTitle>CAPA Plan</CardTitle>
                      <CardDescription>
                        Define the corrective and preventive action plan
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="assignedTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned To</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select assignee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      {user.firstName} {user.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Person responsible for implementing the CAPA
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <DatePicker 
                            date={dueDate} 
                            setDate={setDueDate} 
                          />
                          <p className="text-xs text-muted-foreground">
                            Target date for CAPA completion
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="effectiveness"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Effectiveness Criteria</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Define criteria to measure the effectiveness of the CAPA" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              How will you measure that the CAPA was successful?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <h3 className="font-medium">Important Information</h3>
                        </div>
                        <p className="text-sm text-slate-700">
                          After creating this CAPA, you'll be able to:
                        </p>
                        <ul className="text-sm text-slate-700 list-disc list-inside mt-2">
                          <li>Add detailed root cause analysis</li>
                          <li>Define specific corrective and preventive actions</li>
                          <li>Track implementation progress</li>
                          <li>Conduct effectiveness review</li>
                          <li>Close the CAPA when all requirements are met</li>
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentTab("root-cause")}
                      >
                        Previous: Root Cause
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCapaMutation.isPending}
                      >
                        {createCapaMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Create CAPA
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}