import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, FileOutput, Printer, AlertTriangle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import PageHeader from "@/components/page-header";

export function NonconformingProductForm() {
  const [currentTab, setCurrentTab] = useState("identification");
  const [detectedDate, setDetectedDate] = useState<Date | undefined>(new Date());
  const [dispositionDate, setDispositionDate] = useState<Date | undefined>(undefined);
  const [isCapaRequired, setIsCapaRequired] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    setValue,
    watch 
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      productId: "1", // Default to first product
      batchId: "1", // Default batch
      batchNumber: "",
      serialNumber: "",
      quantity: 1,
      detectedBy: "1", // Default to current user (id 1 in this case)
      detectionStage: "1", // Default to first detection stage
      severityId: "1", // Default to first severity level
      containmentActions: "",
      rootCause: "",
      correctiveActions: "",
      disposition: "",
      dispositionedBy: "",
      capaId: "",
      notes: ""
    }
  });

  // Default data to use when API data isn't available
  const defaultSeverityLevels = [
    { id: 1, name: "Critical", description: "Immediate health risk" },
    { id: 2, name: "Major", description: "Significant impact on safety or performance" },
    { id: 3, name: "Minor", description: "Limited impact on safety or performance" },
    { id: 4, name: "Negligible", description: "Cosmetic or minimal impact" }
  ];

  const defaultProducts = [
    { id: 1, name: "XYZ Cardiac Monitor" },
    { id: 2, name: "InfuFlow IV Pump" },
    { id: 3, name: "VitalScan Patient Monitor" },
    { id: 4, name: "MediTherm Temperature Monitor" }
  ];

  const defaultDetectionStages = [
    { id: 1, name: "Incoming Inspection" },
    { id: 2, name: "In-process Testing" },
    { id: 3, name: "Final Inspection" },
    { id: 4, name: "Customer Complaint" },
    { id: 5, name: "Post-market Surveillance" }
  ];

  const defaultDispositionOptions = [
    { id: 1, name: "Use As Is" },
    { id: 2, name: "Rework" },
    { id: 3, name: "Repair" },
    { id: 4, name: "Scrap" },
    { id: 5, name: "Return to Supplier" },
    { id: 6, name: "Deviation" }
  ];

  // API queries with fallback to default data
  const { data: severityLevels = defaultSeverityLevels, isLoading: isLoadingSeverities } = useQuery({
    queryKey: ["/api/nonconforming-products/severity-levels"],
    enabled: true
  });

  const { data: products = defaultProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
    enabled: true
  });

  const { data: detectionStages = defaultDetectionStages, isLoading: isLoadingStages } = useQuery({
    queryKey: ["/api/nonconforming-products/detection-stages"],
    enabled: true
  });

  const { data: dispositionOptions = defaultDispositionOptions, isLoading: isLoadingDispositions } = useQuery({
    queryKey: ["/api/nonconforming-products/disposition-options"],
    enabled: true
  });

  const createNonconformingProduct = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/production/nonconforming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create nonconforming product');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Nonconforming product registered successfully",
        description: `Reference ID: ${data.id}`,
      });
      navigate("/production/nonconforming-products");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error registering nonconforming product",
        description: error.message,
      });
    }
  });

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    try {
      toast({
        title: "Preparing PDF...",
        description: "Please wait while we generate your PDF with all tabs"
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const tabs = ['identification', 'analysis', 'actions', 'disposition', 'review'];
      const tabNames = ['Identification', 'Analysis', 'Actions', 'Disposition', 'Review'];
      
      // Store current tab to restore later
      const originalTab = currentTab;
      
      for (let i = 0; i < tabs.length; i++) {
        const tabValue = tabs[i];
        const tabName = tabNames[i];
        
        // Switch to the current tab and force re-render
        setCurrentTab(tabValue);
        
        // Wait longer for tab content to render properly
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try multiple selectors to find the tab content
        let tabContent = printRef.current?.querySelector(`[data-value="${tabValue}"][data-state="active"]`);
        
        if (!tabContent) {
          // Fallback: try to find the card within any visible tab content
          tabContent = printRef.current?.querySelector(`[data-state="active"] .card`);
        }
        
        if (!tabContent) {
          // Final fallback: use the entire form content
          tabContent = printRef.current?.querySelector('form');
        }
        
        console.log(`Capturing tab ${tabName}:`, tabContent);
        
        if (tabContent) {
          // Force a layout reflow
          tabContent.getBoundingClientRect();
          
          const canvas = await html2canvas(tabContent as HTMLElement, {
            scale: 1.5,
            logging: true,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0
          });
          
          const imgData = canvas.toDataURL('image/png', 0.95);
          
          // Add new page if not the first tab
          if (i > 0) {
            pdf.addPage();
          }
          
          // Add header
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Nonconforming Product Registration', 10, 15);
          
          // Add tab title
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${i + 1}. ${tabName}`, 10, 25);
          
          // Calculate dimensions to fit the page
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Scale to fit within page margins
          const maxWidth = pdfWidth - 20;
          const maxHeight = pdfHeight - 40;
          
          const scaleX = maxWidth / (imgWidth * 0.264583); // Convert px to mm
          const scaleY = maxHeight / (imgHeight * 0.264583);
          const scale = Math.min(scaleX, scaleY);
          
          const finalWidth = imgWidth * 0.264583 * scale;
          const finalHeight = imgHeight * 0.264583 * scale;
          
          const x = (pdfWidth - finalWidth) / 2;
          const y = 30;
          
          // Add the image
          pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        } else {
          console.warn(`Could not find content for tab: ${tabName}`);
          
          // Add a placeholder page
          if (i > 0) {
            pdf.addPage();
          }
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Nonconforming Product Registration', 10, 15);
          
          pdf.setFontSize(12);
          pdf.text(`${i + 1}. ${tabName}`, 10, 25);
          
          pdf.setFontSize(10);
          pdf.text('Content not available for this tab.', 10, 40);
        }
      }
      
      // Restore original tab
      setCurrentTab(originalTab);
      
      // Generate timestamp for filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`nonconforming-product-record-${timestamp}.pdf`);
      
      toast({
        title: "PDF exported successfully",
        description: "All tabs have been exported to your PDF file"
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
    documentTitle: 'nonconforming-product-record',
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

  const onSubmit = (data: any) => {
    console.log("Form submission triggered with data:", data);
    
    // Generate a unique NCP ID (format: NCP-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const uniqueId = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    const ncpId = `NCP-${currentYear}-${uniqueId}`;
    
    // Transform form data to match the expected schema
    const formData = {
      ncpId: ncpId,
      batchId: parseInt(data.batchId || "1"),
      productId: parseInt(data.productId || "1"),
      title: data.title,
      detectedAt: detectedDate,
      detectedBy: data.detectedBy ? parseInt(data.detectedBy) : null,
      detectionStage: data.detectionStage || "in-process",
      description: data.description,
      severityId: parseInt(data.severityId || "1"),
      statusId: 1,
      batchNumber: data.batchNumber || `BATCH-${uniqueId}`,
      dispositionDate: dispositionDate,
      serialNumber: data.serialNumber || null,
      containmentActions: data.containmentActions || null,
      dispositionDecision: data.disposition || null,
      dispositionJustification: data.notes || null,
      dispositionBy: data.dispositionedBy ? parseInt(data.dispositionedBy) : null,
      capaId: isCapaRequired && data.capaId ? parseInt(data.capaId) : null,
    };

    console.log("Transformed form data:", formData);
    createNonconformingProduct.mutate(formData);
  };

  // We don't need a loading state anymore since we have default data
  const isLoading = false;

  return (
    <div className="container p-6">
      <PageHeader
        title="Nonconforming Product Registration"
        description="Record and manage nonconforming products per ISO 13485:2016 section 8.3"
      />
      
      <div className="flex justify-end mb-6">
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="identification" value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="identification">Identification</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="disposition">Disposition</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="identification">
                <Card>
                  <CardHeader>
                    <CardTitle>Nonconforming Product Identification</CardTitle>
                    <CardDescription>Identify and record the details of the nonconforming product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                        <Input 
                          id="title"
                          {...register("title", { required: "Title is required" })}
                          placeholder="Brief description of the issue"
                        />
                        {errors.title && (
                          <p className="text-sm text-red-500">{errors.title.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Detection Date <span className="text-red-500">*</span></Label>
                        <DatePicker date={detectedDate} setDate={setDetectedDate} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Detailed Description <span className="text-red-500">*</span></Label>
                      <Textarea 
                        id="description"
                        {...register("description", { required: "Description is required" })}
                        placeholder="Provide a detailed description of the nonconformity"
                        className="min-h-[120px]"
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="productId">Product <span className="text-red-500">*</span></Label>
                        <Select
                          onValueChange={(value) => setValue("productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((product: any) => (
                              <SelectItem key={product.id} value={String(product.id)}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.productId && (
                          <p className="text-sm text-red-500">{errors.productId.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="batchNumber">Batch Number</Label>
                        <Input 
                          id="batchNumber"
                          {...register("batchNumber")}
                          placeholder="Batch number if applicable"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">Serial Number</Label>
                        <Input 
                          id="serialNumber"
                          {...register("serialNumber")}
                          placeholder="Serial number if applicable"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="partNumber">Part Number</Label>
                        <Input 
                          id="partNumber"
                          {...register("partNumber")}
                          placeholder="Part number if applicable"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Affected <span className="text-red-500">*</span></Label>
                        <Input 
                          id="quantity"
                          type="number"
                          min="1"
                          {...register("quantity", { 
                            required: "Quantity is required",
                            min: { value: 1, message: "Quantity must be at least 1" }
                          })}
                        />
                        {errors.quantity && (
                          <p className="text-sm text-red-500">{errors.quantity.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="detectedBy">Detected By <span className="text-red-500">*</span></Label>
                        <Input 
                          id="detectedBy"
                          {...register("detectedBy", { required: "Detected by is required" })}
                          placeholder="Name of person who detected the issue"
                        />
                        {errors.detectedBy && (
                          <p className="text-sm text-red-500">{errors.detectedBy.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="detectionStage">Detection Stage <span className="text-red-500">*</span></Label>
                        <Select
                          onValueChange={(value) => setValue("detectionStage", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select detection stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {detectionStages?.map((stage: any) => (
                              <SelectItem key={stage.id} value={String(stage.id)}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.detectionStage && (
                          <p className="text-sm text-red-500">{errors.detectionStage.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="severityId">Severity <span className="text-red-500">*</span></Label>
                        <Select
                          onValueChange={(value) => setValue("severityId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            {severityLevels?.map((severity: any) => (
                              <SelectItem key={severity.id} value={String(severity.id)}>
                                {severity.name} - {severity.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.severityId && (
                          <p className="text-sm text-red-500">{errors.severityId.message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline" onClick={() => navigate("/production/nonconforming-products")}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => setCurrentTab("analysis")}>
                      Next: Analysis
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="analysis">
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis & Containment</CardTitle>
                    <CardDescription>Document containment actions and root cause analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="containmentActions">Immediate Containment Actions <span className="text-red-500">*</span></Label>
                      <Textarea 
                        id="containmentActions"
                        {...register("containmentActions", { required: "Containment actions are required" })}
                        placeholder="Describe immediate actions taken to contain the issue"
                        className="min-h-[120px]"
                      />
                      {errors.containmentActions && (
                        <p className="text-sm text-red-500">{errors.containmentActions.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rootCause">Root Cause Analysis <span className="text-red-500">*</span></Label>
                      <Textarea 
                        id="rootCause"
                        {...register("rootCause", { required: "Root cause analysis is required" })}
                        placeholder="Describe the root cause of the nonconformity"
                        className="min-h-[120px]"
                      />
                      {errors.rootCause && (
                        <p className="text-sm text-red-500">{errors.rootCause.message}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline" onClick={() => setCurrentTab("identification")}>
                      Previous: Identification
                    </Button>
                    <Button type="button" onClick={() => setCurrentTab("actions")}>
                      Next: Actions
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="actions">
                <Card>
                  <CardHeader>
                    <CardTitle>Corrective Actions</CardTitle>
                    <CardDescription>Document corrective actions and CAPA requirements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="correctiveActions">Corrective Actions <span className="text-red-500">*</span></Label>
                      <Textarea 
                        id="correctiveActions"
                        {...register("correctiveActions", { required: "Corrective actions are required" })}
                        placeholder="Describe actions taken to correct the nonconformity"
                        className="min-h-[120px]"
                      />
                      {errors.correctiveActions && (
                        <p className="text-sm text-red-500">{errors.correctiveActions.message}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <Switch
                        id="capaRequired"
                        checked={isCapaRequired}
                        onCheckedChange={setIsCapaRequired}
                      />
                      <Label htmlFor="capaRequired" className="font-medium">
                        CAPA Required
                      </Label>
                    </div>

                    {isCapaRequired && (
                      <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-md mt-2">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800">
                              A Corrective and Preventive Action (CAPA) will be initiated
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              A CAPA ID will be assigned after this nonconforming product record is submitted.
                              You will be able to track and manage the associated CAPA from the CAPA management module.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isCapaRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="capaId">Existing CAPA ID (if applicable)</Label>
                        <Input 
                          id="capaId"
                          {...register("capaId")}
                          placeholder="Enter CAPA ID if this is related to an existing CAPA"
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline" onClick={() => setCurrentTab("analysis")}>
                      Previous: Analysis
                    </Button>
                    <Button type="button" onClick={() => setCurrentTab("disposition")}>
                      Next: Disposition
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="disposition">
                <Card>
                  <CardHeader>
                    <CardTitle>Disposition Decision</CardTitle>
                    <CardDescription>Determine the final disposition of the nonconforming product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="disposition">Disposition <span className="text-red-500">*</span></Label>
                      <Select
                        onValueChange={(value) => setValue("disposition", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select disposition" />
                        </SelectTrigger>
                        <SelectContent>
                          {dispositionOptions?.map((option: any) => (
                            <SelectItem key={option.id} value={String(option.id)}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.disposition && (
                        <p className="text-sm text-red-500">{errors.disposition.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Disposition Date</Label>
                        <DatePicker date={dispositionDate} setDate={setDispositionDate} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dispositionedBy">Dispositioned By <span className="text-red-500">*</span></Label>
                        <Input 
                          id="dispositionedBy"
                          {...register("dispositionedBy", { required: "Dispositioned by is required" })}
                          placeholder="Name of person making disposition decision"
                        />
                        {errors.dispositionedBy && (
                          <p className="text-sm text-red-500">{errors.dispositionedBy.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea 
                        id="notes"
                        {...register("notes")}
                        placeholder="Additional notes or comments regarding disposition"
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline" onClick={() => setCurrentTab("actions")}>
                      Previous: Actions
                    </Button>
                    <Button type="button" onClick={() => setCurrentTab("review")}>
                      Next: Review
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="review">
                <Card>
                  <CardHeader>
                    <CardTitle>Review & Submit</CardTitle>
                    <CardDescription>Review all information before final submission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium">Identification</h3>
                        <Separator className="my-2" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Title</p>
                            <p>{watch("title") || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Detection Date</p>
                            <p>{detectedDate ? detectedDate.toLocaleDateString() : "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Description</p>
                            <p className="whitespace-pre-wrap">{watch("description") || "Not provided"}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium">Analysis & Containment</h3>
                        <Separator className="my-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Containment Actions</p>
                          <p className="whitespace-pre-wrap">{watch("containmentActions") || "Not provided"}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500">Root Cause</p>
                          <p className="whitespace-pre-wrap">{watch("rootCause") || "Not provided"}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium">Corrective Actions</h3>
                        <Separator className="my-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Corrective Actions</p>
                          <p className="whitespace-pre-wrap">{watch("correctiveActions") || "Not provided"}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500">CAPA Required</p>
                          <p>{isCapaRequired ? "Yes" : "No"}</p>
                        </div>
                        {!isCapaRequired && watch("capaId") && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-500">Existing CAPA ID</p>
                            <p>{watch("capaId")}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-medium">Disposition</h3>
                        <Separator className="my-2" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Disposition</p>
                            <p>{watch("disposition") ? "Selected" : "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Disposition Date</p>
                            <p>{dispositionDate ? dispositionDate.toLocaleDateString() : "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Dispositioned By</p>
                            <p>{watch("dispositionedBy") || "Not provided"}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500">Additional Notes</p>
                          <p className="whitespace-pre-wrap">{watch("notes") || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline" onClick={() => setCurrentTab("disposition")}>
                      Previous: Disposition
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Submit
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  );
}