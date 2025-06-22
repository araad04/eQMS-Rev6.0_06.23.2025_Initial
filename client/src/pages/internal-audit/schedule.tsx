import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { z } from "zod";
import { 
  Calendar, 
  Users, 
  Clock, 
  Target, 
  Sparkles, 
  ArrowLeft,
  CheckCircle2,
  Settings,
  FileText,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";

// Enhanced audit types with ISO 13485:2016 alignment and intelligent checklist generation
const auditTypes = [
  {
    id: 1,
    name: "Management Review",
    icon: "🎯",
    description: "Leadership effectiveness & strategic review",
    color: "from-blue-500 to-blue-600",
    checklistItems: 15,
    estimatedDuration: "4-6 hours",
    standardReferences: ["ISO 13485:2016 5.6", "FDA QSR 820.20"],
    keyAreas: ["Leadership commitment", "Resource management", "Performance metrics", "Improvement opportunities"]
  },
  {
    id: 2,
    name: "Design & Development",
    icon: "🔬",
    description: "Product lifecycle & design controls",
    color: "from-purple-500 to-purple-600",
    checklistItems: 25,
    estimatedDuration: "6-8 hours",
    standardReferences: ["ISO 13485:2016 7.3", "FDA QSR 820.30"],
    keyAreas: ["Design planning", "Design inputs", "Design outputs", "Design verification", "Design validation"]
  },
  {
    id: 3,
    name: "Purchasing & Supplier",
    icon: "🤝",
    description: "Supply chain & vendor compliance",
    color: "from-green-500 to-green-600",
    checklistItems: 20,
    estimatedDuration: "4-5 hours",
    standardReferences: ["ISO 13485:2016 7.4", "FDA QSR 820.50"],
    keyAreas: ["Supplier evaluation", "Purchasing processes", "Supplier monitoring", "Incoming inspection"]
  },
  {
    id: 4,
    name: "Production & Service",
    icon: "⚙️",
    description: "Manufacturing & delivery processes",
    color: "from-orange-500 to-orange-600",
    checklistItems: 30,
    estimatedDuration: "8-10 hours",
    standardReferences: ["ISO 13485:2016 7.5", "FDA QSR 820.70"],
    keyAreas: ["Production planning", "Process validation", "Infrastructure", "Work environment"]
  },
  {
    id: 5,
    name: "Technical File",
    icon: "📋",
    description: "Documentation & regulatory compliance",
    color: "from-indigo-500 to-indigo-600",
    checklistItems: 18,
    estimatedDuration: "3-4 hours",
    standardReferences: ["ISO 13485:2016 4.2", "MDR Annex II"],
    keyAreas: ["Document control", "Record management", "Technical documentation", "Regulatory submissions"]
  },
  {
    id: 6,
    name: "Risk Management",
    icon: "⚡",
    description: "Risk analysis & mitigation strategies",
    color: "from-red-500 to-red-600",
    checklistItems: 22,
    estimatedDuration: "5-6 hours",
    standardReferences: ["ISO 14971:2019", "ISO 13485:2016 7.1"],
    keyAreas: ["Risk analysis", "Risk evaluation", "Risk control", "Risk management file"]
  }
];

// Form validation schema
const scheduleAuditSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  typeId: z.string().min(1, "Please select an audit type"),
  scope: z.string().min(10, "Scope must be at least 10 characters"),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, "Please select a scheduled date"),
  leadAuditorName: z.string().min(2, "Lead auditor name is required"),
  auditLocation: z.string().min(3, "Audit location is required"),
  standardReference: z.string().optional(),
});

type ScheduleAuditFormData = z.infer<typeof scheduleAuditSchema>;

export default function ScheduleAuditPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<number | null>(null);

  const form = useForm<ScheduleAuditFormData>({
    resolver: zodResolver(scheduleAuditSchema),
    defaultValues: {
      title: "",
      typeId: "",
      scope: "",
      description: "",
      scheduledDate: "",
      leadAuditorName: "",
      auditLocation: "On-site",
      standardReference: "",
    },
  });

  const createAuditMutation = useMutation({
    mutationFn: async (data: ScheduleAuditFormData) => {
      const auditData = {
        title: data.title,
        typeId: parseInt(data.typeId),
        statusId: 2, // Scheduled status
        scope: data.scope,
        description: data.description || "",
        startDate: new Date(data.scheduledDate),
        scheduledDate: new Date(data.scheduledDate),
        leadAuditorName: data.leadAuditorName,
        auditLocation: data.auditLocation,
        standardReference: data.standardReference || "",
        createdBy: 9999, // Current user ID - would be dynamic in real implementation
      };
      
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Local": "true",
        },
        body: JSON.stringify(auditData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create audit: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Audit Scheduled Successfully! ✨",
        description: "Your audit has been scheduled and intelligent checklists are being generated.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      navigate(`/internal-audit/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule audit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleAuditFormData) => {
    createAuditMutation.mutate(data);
  };

  const handleTypeSelection = (typeId: string) => {
    const type = auditTypes.find(t => t.id === parseInt(typeId));
    setSelectedType(type ? type.id : null);
    
    if (type) {
      // Auto-populate fields based on selected type
      form.setValue("typeId", typeId);
      form.setValue("standardReference", type.standardReferences.join(", "));
      
      // Generate intelligent title suggestion
      const currentDate = new Date().toLocaleDateString();
      form.setValue("title", `${type.name} Audit - ${currentDate}`);
      
      // Generate scope based on key areas
      const scopeText = `Comprehensive audit covering: ${type.keyAreas.join(", ")}. This audit will evaluate compliance with ${type.standardReferences[0]} requirements.`;
      form.setValue("scope", scopeText);
    }
  };

  return (
    <>
      <Helmet>
        <title>Schedule Internal Audit | eQMS</title>
        <meta name="description" content="Schedule intelligent ISO 13485:2016 internal audits with automatic checklist generation" />
      </Helmet>

      <div className="container py-8 space-y-8">
        <PageHeader
          title="Schedule Internal Audit"
          description="Intelligent audit scheduling with dynamic checklist generation and CAPA integration"
          actions={
            <Button variant="outline" onClick={() => navigate("/internal-audit")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
          }
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Audit Type Selection */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Select Audit Type</span>
                </CardTitle>
                <CardDescription>
                  Choose the type of internal audit to automatically generate intelligent checklists
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {auditTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedType === type.id 
                        ? `bg-gradient-to-r ${type.color} text-white shadow-lg` 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleTypeSelection(type.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{type.icon}</div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${selectedType === type.id ? "text-white" : "text-gray-900"}`}>
                            {type.name}
                          </h4>
                          <p className={`text-xs ${selectedType === type.id ? "text-white/90" : "text-gray-600"}`}>
                            {type.description}
                          </p>
                          <div className={`flex items-center space-x-4 mt-2 text-xs ${selectedType === type.id ? "text-white/80" : "text-gray-500"}`}>
                            <span>📋 {type.checklistItems} items</span>
                            <span>⏱️ {type.estimatedDuration}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {selectedType && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-900">
                    <Sparkles className="h-5 w-5" />
                    <span>Intelligent Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Auto-generated checklists</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>CAPA integration for findings</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Real-time progress tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Automated report generation</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Audit Details Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span>Audit Details</span>
                </CardTitle>
                <CardDescription>
                  Configure your audit schedule and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audit Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter audit title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scheduledDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scheduled Date</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="scope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audit Scope</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Define the audit scope and objectives"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Clearly define what will be covered in this audit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="leadAuditorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Auditor</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter lead auditor name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="auditLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audit Location</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="On-site">On-site</SelectItem>
                                  <SelectItem value="Remote">Remote</SelectItem>
                                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any additional notes or special instructions"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => navigate("/internal-audit")}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createAuditMutation.isPending || !selectedType}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {createAuditMutation.isPending ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Scheduling Audit...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Schedule Audit
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}