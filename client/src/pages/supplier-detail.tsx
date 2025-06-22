import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/page-header";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Edit, 
  Building, 
  AlertCircle, 
  Loader2, 
  CalendarPlus,
  Calendar as CalendarIcon, 
  Phone, 
  Mail,
  MapPin,
  Info,
  FileCheck,
  ClipboardCheck,
  FileSpreadsheet
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Types
interface Supplier {
  id: number;
  supplierId: string;
  name: string;
  categoryId: number;
  statusId: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  qualificationDate?: string;
  requalificationDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Form schema for updating status
const statusUpdateSchema = z.object({
  statusId: z.coerce.number().min(1, "Status is required"),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

// Form schema for updating qualification dates
const qualificationUpdateSchema = z.object({
  qualificationDate: z.date().optional(),
  requalificationDate: z.date().optional(),
});

type QualificationUpdateFormValues = z.infer<typeof qualificationUpdateSchema>;

export default function SupplierDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/supplier-management/:id");
  const supplierId = params?.id;
  const { toast } = useToast();
  
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openQualificationDialog, setOpenQualificationDialog] = useState(false);
  
  // Fetch supplier details
  const { 
    data: supplier, 
    isLoading, 
    error 
  } = useQuery<Supplier>({
    queryKey: ["/api/suppliers", supplierId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/suppliers/${supplierId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch supplier details");
      }
      return res.json();
    },
    enabled: !!supplierId,
  });
  
  // Status update form
  const statusUpdateForm = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      statusId: supplier?.statusId || 1,
    },
  });
  
  // Qualification update form
  const qualificationForm = useForm<QualificationUpdateFormValues>({
    resolver: zodResolver(qualificationUpdateSchema),
    defaultValues: {
      qualificationDate: supplier?.qualificationDate ? new Date(supplier.qualificationDate) : undefined,
      requalificationDate: supplier?.requalificationDate ? new Date(supplier.requalificationDate) : undefined,
    },
  });
  
  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async (data: Partial<Supplier>) => {
      const res = await apiRequest("PATCH", `/api/suppliers/${supplierId}`, data);
      if (!res.ok) {
        throw new Error("Failed to update supplier");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Supplier updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", supplierId] });
      
      // Close dialogs
      setOpenStatusDialog(false);
      setOpenQualificationDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handlers
  const onSubmitStatusUpdate = (data: StatusUpdateFormValues) => {
    updateSupplierMutation.mutate(data);
  };
  
  const onSubmitQualificationUpdate = (data: QualificationUpdateFormValues) => {
    const updateData: Partial<Supplier> = {};
    
    if (data.qualificationDate) {
      updateData.qualificationDate = data.qualificationDate.toISOString();
    } else {
      updateData.qualificationDate = undefined;
    }
    
    if (data.requalificationDate) {
      updateData.requalificationDate = data.requalificationDate.toISOString();
    } else {
      updateData.requalificationDate = undefined;
    }
    
    updateSupplierMutation.mutate(updateData);
  };
  
  // Helper functions
  const getSupplierCategoryName = (categoryId: number): string => {
    const categoryMap: Record<number, string> = {
      1: "Critical",
      2: "Major",
      3: "Minor",
      4: "Service Provider",
      5: "Consultant"
    };
    return categoryMap[categoryId] || "Unknown";
  };
  
  const getSupplierStatusName = (statusId: number): string => {
    const statusMap: Record<number, string> = {
      1: "Approved",
      2: "Pending Qualification",
      3: "On Probation",
      4: "Suspended",
      5: "Disqualified"
    };
    return statusMap[statusId] || "Unknown";
  };
  
  const getStatusBadgeVariant = (status: string): "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange" => {
    const statusMap: Record<string, "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange"> = {
      "Approved": "green",
      "Pending Qualification": "yellow",
      "On Probation": "orange",
      "Suspended": "red",
      "Disqualified": "default"
    };
    return statusMap[status] || "default";
  };
  
  const getCategoryBadgeVariant = (category: string): "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange" => {
    const categoryMap: Record<string, "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange"> = {
      "Critical": "red",
      "Major": "orange",
      "Minor": "yellow",
      "Service Provider": "blue",
      "Consultant": "purple"
    };
    return categoryMap[category] || "default";
  };
  
  const isRequalificationDue = (date?: string): boolean => {
    if (!date) return false;
    
    const requalDate = new Date(date);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    return requalDate <= thirtyDaysFromNow;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Supplier</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/supplier-management")}
        >
          Back to Suppliers
        </Button>
      </div>
    );
  }
  
  // No supplier found
  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Building className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Supplier Not Found</h2>
        <p className="text-muted-foreground">The supplier you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/supplier-management")}
        >
          Back to Suppliers
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <PageHeader 
        title={supplier.name}
        description={`Supplier ID: ${supplier.supplierId}`}
        actions={[
          {
            label: "Back to Suppliers",
            href: "/supplier-management",
            icon: <ArrowLeft className="h-5 w-5" />,
            variant: "outline",
          },
          {
            label: "Update Status",
            onClick: () => setOpenStatusDialog(true),
            icon: <Edit className="h-5 w-5" />,
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Supplier details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-2xl">{supplier.name}</CardTitle>
                    <CardDescription>Added on {format(new Date(supplier.createdAt), "PPP")}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <BadgeColored 
                      variant={getCategoryBadgeVariant(getSupplierCategoryName(supplier.categoryId))}
                    >
                      {getSupplierCategoryName(supplier.categoryId)}
                    </BadgeColored>
                    <BadgeColored 
                      variant={getStatusBadgeVariant(getSupplierStatusName(supplier.statusId))}
                    >
                      {getSupplierStatusName(supplier.statusId)}
                    </BadgeColored>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="mb-6">
                    <TabsTrigger value="overview">
                      <Info className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="qualification">
                      <FileCheck className="h-4 w-4 mr-2" />
                      Qualification
                    </TabsTrigger>
                    <TabsTrigger value="audits">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Audits
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Documents
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview">
                    <div className="space-y-6">
                      {/* Contact Information */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Email</p>
                              <p className="text-sm text-gray-500">
                                {supplier.contactEmail || "Not specified"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Phone</p>
                              <p className="text-sm text-gray-500">
                                {supplier.contactPhone || "Not specified"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start md:col-span-2">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Address</p>
                              <p className="text-sm text-gray-500 whitespace-pre-line">
                                {supplier.address || "No address provided"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contact Person */}
                      {supplier.contactName && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Primary Contact</h3>
                          <div className="bg-neutral-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium">
                                {supplier.contactName?.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">{supplier.contactName}</p>
                                <p className="text-sm text-gray-500">
                                  {supplier.contactEmail && <span className="mr-3">{supplier.contactEmail}</span>}
                                  {supplier.contactPhone && <span>{supplier.contactPhone}</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="qualification">
                    <div className="space-y-6">
                      {/* Qualification Status */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Qualification Status</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setOpenQualificationDialog(true)}
                          >
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Update Dates
                          </Button>
                        </div>
                        
                        <div className="bg-neutral-50 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                              <BadgeColored 
                                variant={getStatusBadgeVariant(getSupplierStatusName(supplier.statusId))}
                              >
                                {getSupplierStatusName(supplier.statusId)}
                              </BadgeColored>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                              <BadgeColored 
                                variant={getCategoryBadgeVariant(getSupplierCategoryName(supplier.categoryId))}
                              >
                                {getSupplierCategoryName(supplier.categoryId)}
                              </BadgeColored>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Qualification Date</p>
                              <p className="text-sm text-gray-900">
                                {supplier.qualificationDate ? 
                                  format(new Date(supplier.qualificationDate), "PPP") : 
                                  "Not qualified yet"}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Requalification Due</p>
                              <p className={`text-sm ${isRequalificationDue(supplier.requalificationDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                {supplier.requalificationDate ? (
                                  <>
                                    {format(new Date(supplier.requalificationDate), "PPP")}
                                    {isRequalificationDue(supplier.requalificationDate) && " (Due soon)"}
                                  </>
                                ) : (
                                  "Not scheduled"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Qualification History */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Qualification History</h3>
                        <div className="text-center py-6 text-muted-foreground bg-neutral-50 rounded-md">
                          <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                          <p>No qualification history records available</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="audits">
                    <div className="text-center py-6 text-muted-foreground bg-neutral-50 rounded-md">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No supplier audits conducted yet</p>
                      <Button className="mt-4" onClick={() => navigate("/audit-management/create")}>
                        Schedule Supplier Audit
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents">
                    <div className="text-center py-6 text-muted-foreground bg-neutral-50 rounded-md">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No supplier documents available</p>
                      <Button className="mt-4" onClick={() => navigate("/document-control/create")}>
                        Create Supplier Document
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Metadata */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <BadgeColored 
                        variant={getStatusBadgeVariant(getSupplierStatusName(supplier.statusId))}
                      >
                        {getSupplierStatusName(supplier.statusId)}
                      </BadgeColored>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1">
                      <BadgeColored 
                        variant={getCategoryBadgeVariant(getSupplierCategoryName(supplier.categoryId))}
                      >
                        {getSupplierCategoryName(supplier.categoryId)}
                      </BadgeColored>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Supplier ID</dt>
                    <dd className="mt-1 text-gray-900">{supplier.supplierId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Added On</dt>
                    <dd className="mt-1 text-gray-900">{format(new Date(supplier.createdAt), "PPP")}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-gray-900">{format(new Date(supplier.updatedAt), "PPP")}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="border-t pt-6 pb-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setOpenStatusDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quality Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Current Risk Rating</dt>
                    <dd className="mt-1">
                      <BadgeColored variant="default">
                        Not Assessed
                      </BadgeColored>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Open CAPAs</dt>
                    <dd className="mt-1 text-gray-900">0</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Recent Audits</dt>
                    <dd className="mt-1 text-gray-900">0</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">On-Time Delivery</dt>
                    <dd className="mt-1 text-gray-900">No data available</dd>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Supplier Status</DialogTitle>
            <DialogDescription>
              Change the current status of this supplier
            </DialogDescription>
          </DialogHeader>
          <Form {...statusUpdateForm}>
            <form onSubmit={statusUpdateForm.handleSubmit(onSubmitStatusUpdate)}>
              <FormField
                control={statusUpdateForm.control}
                name="statusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={supplier.statusId.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Approved</SelectItem>
                        <SelectItem value="2">Pending Qualification</SelectItem>
                        <SelectItem value="3">On Probation</SelectItem>
                        <SelectItem value="4">Suspended</SelectItem>
                        <SelectItem value="5">Disqualified</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenStatusDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateSupplierMutation.isPending}
                >
                  {updateSupplierMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Qualification Dates Dialog */}
      <Dialog open={openQualificationDialog} onOpenChange={setOpenQualificationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Qualification Dates</DialogTitle>
            <DialogDescription>
              Set or update the supplier qualification schedule
            </DialogDescription>
          </DialogHeader>
          <Form {...qualificationForm}>
            <form onSubmit={qualificationForm.handleSubmit(onSubmitQualificationUpdate)}>
              <div className="space-y-4">
                <FormField
                  control={qualificationForm.control}
                  name="qualificationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Qualification Date</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={qualificationForm.control}
                  name="requalificationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Requalification Due Date</FormLabel>
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
                            disabled={date => 
                              qualificationForm.getValues().qualificationDate ? 
                                date < qualificationForm.getValues().qualificationDate! : false
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenQualificationDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateSupplierMutation.isPending}
                >
                  {updateSupplierMutation.isPending ? "Updating..." : "Update Dates"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}