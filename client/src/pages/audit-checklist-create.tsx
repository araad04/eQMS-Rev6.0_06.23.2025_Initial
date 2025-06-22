import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Download,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  FileSpreadsheet
} from "lucide-react";
// No form validation needed for direct state management
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Audit } from "@shared/schema";

// Enhanced schema for comprehensive checklist items
interface ChecklistItem {
  id: string;
  clause: string;
  requirement: string;
  question: string;
  compliance: "compliant" | "non-compliant" | "not-applicable" | "pending";
  documentation: string; // Combined evidence, findings, and notes
  requiresCapa: boolean;
  capaId?: string;
}

// ISO 13485:2016 Questions by QMS Area
const ISO13485Questions: Record<string, ChecklistItem[]> = {
  "management-responsibility": [
    {
      id: "mr-001",
      clause: "5.1",
      requirement: "Management commitment",
      question: "Has top management demonstrated commitment to the quality management system by establishing and maintaining a quality policy?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mr-002", 
      clause: "5.2",
      requirement: "Customer focus",
      question: "Does the organization ensure that customer requirements are determined and met with the aim of enhancing customer satisfaction?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mr-003",
      clause: "5.3",
      requirement: "Quality policy",
      question: "Is the quality policy appropriate to the purpose of the organization and provides a framework for setting quality objectives?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mr-004",
      clause: "5.4.1",
      requirement: "Quality objectives",
      question: "Are quality objectives established at relevant functions and levels within the organization?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mr-005",
      clause: "5.5.1",
      requirement: "Responsibility and authority",
      question: "Has top management ensured that responsibilities and authorities are defined and communicated within the organization?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mr-006",
      clause: "5.5.2",
      requirement: "Management representative",
      question: "Has top management appointed a member of management as the management representative?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mr-007",
      clause: "5.6.1",
      requirement: "Management review - General",
      question: "Does top management review the organization's quality management system at planned intervals?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    }
  ],
  "resource-management": [
    {
      id: "rm-001",
      clause: "6.1",
      requirement: "Provision of resources",
      question: "Has the organization determined and provided the resources needed to implement and maintain the QMS?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "rm-002",
      clause: "6.2.1",
      requirement: "Human resources - General",
      question: "Is personnel performing work affecting product quality competent on the basis of appropriate education, training, skills and experience?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "rm-003",
      clause: "6.2.2",
      requirement: "Competence, training and awareness",
      question: "Does the organization determine the necessary competence for personnel performing work affecting product quality?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "rm-004",
      clause: "6.3",
      requirement: "Infrastructure",
      question: "Has the organization determined, provided and maintained the infrastructure needed to achieve conformity to product requirements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "rm-005",
      clause: "6.4.1",
      requirement: "Work environment",
      question: "Has the organization determined and managed the work environment needed to achieve conformity to product requirements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "rm-006",
      clause: "6.4.2",
      requirement: "Contamination control",
      question: "Where contamination control is necessary, has the organization established and maintained a contamination control plan?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    }
  ],
  "design-development": [
    {
      id: "dd-001",
      clause: "7.3.1",
      requirement: "Design and development planning",
      question: "Does the organization plan and control the design and development of medical devices?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dd-002",
      clause: "7.3.2",
      requirement: "Design and development inputs",
      question: "Are inputs relating to product requirements determined and records maintained?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dd-003",
      clause: "7.3.3",
      requirement: "Design and development outputs",
      question: "Are the outputs of design and development provided in a form that enables verification against the design and development input?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dd-004",
      clause: "7.3.4",
      requirement: "Design and development review",
      question: "Are systematic reviews of design and development performed at suitable stages?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dd-005",
      clause: "7.3.5",
      requirement: "Design and development verification",
      question: "Is verification performed to ensure that design and development outputs have met the design and development input requirements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dd-006",
      clause: "7.3.6",
      requirement: "Design and development validation",
      question: "Is design and development validation performed to ensure that the resulting product is capable of meeting the requirements for the specified application?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dd-007",
      clause: "7.3.8",
      requirement: "Design and development files",
      question: "Are design and development files maintained for each type of medical device?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    }
  ],
  "document-control": [
    {
      id: "dc-001",
      clause: "4.2.3",
      requirement: "Control of documents",
      question: "Are documents required by the quality management system controlled?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dc-002",
      clause: "4.2.4",
      requirement: "Control of records",
      question: "Are records established and maintained to provide evidence of conformity to requirements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "dc-003",
      clause: "4.2.5",
      requirement: "Medical device files",
      question: "Are medical device files established and maintained for each medical device type?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    }
  ],
  "purchasing": [
    {
      id: "pur-001",
      clause: "7.4.1",
      requirement: "Purchasing process",
      question: "Does the organization ensure that purchased product conforms to specified purchase requirements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "pur-002",
      clause: "7.4.2",
      requirement: "Purchasing information",
      question: "Does purchasing information describe the product to be purchased and include requirements for approval or qualification of product, procedures, processes and equipment?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "pur-003",
      clause: "7.4.3",
      requirement: "Verification of purchased product",
      question: "Does the organization establish and implement the inspection or other activities necessary for ensuring that purchased product meets specified purchase requirements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    }
  ],
  "production-service": [
    {
      id: "ps-001",
      clause: "7.5.1",
      requirement: "Control of production and service provision",
      question: "Does the organization plan and carry out production and service provision under controlled conditions?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "ps-002",
      clause: "7.5.2",
      requirement: "Cleanliness of product and contamination control",
      question: "Are requirements for cleanliness of product or contamination control during production established and implemented?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "ps-003",
      clause: "7.5.3",
      requirement: "Installation activities",
      question: "When installation is a specified requirement, are appropriate installation activities performed and verified?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "ps-004",
      clause: "7.5.4",
      requirement: "Servicing activities",
      question: "When servicing is a specified requirement, are appropriate servicing activities performed and verified?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "ps-005",
      clause: "7.5.5",
      requirement: "Particular requirements for sterile medical devices",
      question: "For sterile medical devices, are the requirements for maintaining sterility throughout the production process established and implemented?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "ps-006",
      clause: "7.5.9",
      requirement: "Traceability",
      question: "Where traceability is a requirement, does the organization control the unique identification of the product and maintain records?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    }
  ],
  "measurement-improvement": [
    {
      id: "mi-001",
      clause: "8.2.1",
      requirement: "Feedback",
      question: "Does the organization establish a feedback system to provide early warning of quality problems and for input into the corrective and preventive action process?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-002",
      clause: "8.2.2",
      requirement: "Complaint handling",
      question: "Are procedures for receiving, reviewing and evaluating complaints established and maintained?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-003",
      clause: "8.2.3",
      requirement: "Reporting to regulatory authorities",
      question: "Are procedures established for reporting information to regulatory authorities as required by applicable regulatory requirements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-004",
      clause: "8.2.4",
      requirement: "Internal audit",
      question: "Does the organization conduct internal audits at planned intervals to determine whether the quality management system conforms to planned arrangements?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-005",
      clause: "8.2.5",
      requirement: "Monitoring and measurement of processes",
      question: "Does the organization apply suitable methods for monitoring and measurement of the quality management system processes?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-006",
      clause: "8.2.6",
      requirement: "Monitoring and measurement of product",
      question: "Does the organization monitor and measure the characteristics of the product to verify that product requirements have been met?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-007",
      clause: "8.3",
      requirement: "Control of nonconforming product",
      question: "Does the organization ensure that product which does not conform to product requirements is identified and controlled?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-008",
      clause: "8.4",
      requirement: "Analysis of data",
      question: "Does the organization determine, collect and analyze appropriate data to demonstrate the suitability and effectiveness of the quality management system?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-009",
      clause: "8.5.2",
      requirement: "Corrective action",
      question: "Does the organization take action to eliminate the cause of nonconformities in order to prevent recurrence?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    },
    {
      id: "mi-010",
      clause: "8.5.3",
      requirement: "Preventive action",
      question: "Does the organization determine action to eliminate the causes of potential nonconformities in order to prevent their occurrence?",
      compliance: "pending",
      documentation: "",
      requiresCapa: false
    }
  ]
};

// Add more QMS areas as needed...

type FormValues = {
  checklistItems: ChecklistItem[];
};

export default function AuditChecklistCreate() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch audit details
  const { 
    data: audit, 
    isLoading: isLoadingAudit, 
    error: auditError 
  } = useQuery<Audit>({
    queryKey: ["/api/audits", parseInt(id!)],
    queryFn: async () => {
      const response = await fetch(`/api/audits/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch audit: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Determine QMS area and load appropriate questions
  useEffect(() => {
    if (audit) {
      // Check if this is a complete QMS system audit
      const isCompleteQMS = audit.title?.toLowerCase().includes("complete qms") || 
                           audit.title?.toLowerCase().includes("complete quality") ||
                           audit.title?.toLowerCase().includes("full system") ||
                           audit.description?.toLowerCase().includes("comprehensive full-system audit") ||
                           audit.description?.toLowerCase().includes("all aspects of iso 13485");
      
      let allQuestions: ChecklistItem[] = [];
      
      if (isCompleteQMS) {
        // For complete QMS audits, include ALL ISO 13485:2016 areas
        Object.values(ISO13485Questions).forEach(areaQuestions => {
          allQuestions = [...allQuestions, ...areaQuestions];
        });
      } else {
        // Extract specific QMS area from audit title or description
        let qmsArea = "management-responsibility"; // default
        
        if (audit.title?.toLowerCase().includes("resource") || audit.description?.toLowerCase().includes("resource")) {
          qmsArea = "resource-management";
        } else if (audit.title?.toLowerCase().includes("design") || audit.description?.toLowerCase().includes("design")) {
          qmsArea = "design-development";
        } else if (audit.title?.toLowerCase().includes("document") || audit.description?.toLowerCase().includes("document")) {
          qmsArea = "document-control";
        } else if (audit.title?.toLowerCase().includes("purchasing") || audit.description?.toLowerCase().includes("purchasing")) {
          qmsArea = "purchasing";
        } else if (audit.title?.toLowerCase().includes("production") || audit.description?.toLowerCase().includes("production")) {
          qmsArea = "production-service";
        } else if (audit.title?.toLowerCase().includes("measurement") || audit.description?.toLowerCase().includes("measurement")) {
          qmsArea = "measurement-improvement";
        }
        
        allQuestions = ISO13485Questions[qmsArea] || ISO13485Questions["management-responsibility"];
      }
      
      setChecklistItems([...allQuestions]);
    }
  }, [audit]);

  // Update checklist item
  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const updatedItems = [...checklistItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-set requiresCapa when non-compliant
    if (field === "compliance" && value === "non-compliant") {
      updatedItems[index].requiresCapa = true;
    } else if (field === "compliance" && value !== "non-compliant") {
      updatedItems[index].requiresCapa = false;
      updatedItems[index].capaId = undefined;
    }
    
    setChecklistItems(updatedItems);
  };

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Transform our checklist items to match the expected database schema
      const transformedItems = checklistItems.map(item => ({
        questionText: item.question,
        responseType: "dropdown", // All our items use dropdown for compliance
        regulationClause: item.clause,
        response: item.compliance,
        findingType: item.compliance === "compliant" ? "Compliant" : 
                    item.compliance === "non-compliant" ? "NC" : 
                    item.compliance === "not-applicable" ? "N/A" : "Pending",
        notes: item.documentation,
        evidenceFileURL: null
      }));

      // Use the batch endpoint for better efficiency
      const response = await apiRequest("POST", `/api/audits/${id}/checklist-items/batch`, transformedItems);
      
      if (!response.ok) {
        throw new Error("Failed to save checklist");
      }
      
      toast({
        title: "Audit Checklist Saved",
        description: `Successfully saved ${checklistItems.length} checklist items with ISO 13485:2016 compliance assessment.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/audits", parseInt(id!), "checklist"] });
      navigate(`/audit-detail/${id}`);
    } catch (error) {
      console.error("Error saving checklist:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save checklist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel
  const handleExport = () => {
    // Basic export functionality - would need additional libraries for full Excel export
    const csvContent = [
      ["Clause", "Requirement", "Question", "Compliance", "Documentation", "CAPA Required"],
      ...checklistItems.map(item => [
        item.clause,
        item.requirement,
        item.question,
        item.compliance,
        item.documentation,
        item.requiresCapa ? "Yes" : "No"
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${id}-checklist.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingAudit) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (auditError || !audit) {
    return (
      <div className="container mx-auto py-6">
        <Button onClick={() => navigate(`/audit-detail/${id}`)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Details
        </Button>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              There was a problem loading the audit information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {auditError instanceof Error ? auditError.message : "Failed to load audit details"}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>ISO 13485:2016 Audit Checklist | {audit.title} | Medical Device eQMS</title>
        <meta name="description" content={`Comprehensive ISO 13485:2016 audit checklist for: ${audit.title}`} />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <PageHeader
          title="ISO 13485:2016 Audit Checklist"
          description={`Audit: ${audit.title}`}
          className="mb-6"
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/audit-detail/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Audit
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </PageHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Comprehensive ISO 13485:2016 Audit Checklist
            </CardTitle>
            <CardDescription>
              Comprehensive ISO 13485:2016 audit checklist with structured documentation fields for evidence collection, 
              compliance assessment, and integrated CAPA workflow for non-conformances.
            </CardDescription>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Documentation Guidance</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Evidence:</strong> Reference specific documents, records, interviews, and observations</p>
                <p><strong>Findings:</strong> Document objective evidence and specific examples of compliance/non-compliance</p>
                <p><strong>Risk Assessment:</strong> For non-conformances, assess potential impact on product quality and patient safety</p>
                <p><strong>CAPA Integration:</strong> Link non-conformances to corrective and preventive action system</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Clause</TableHead>
                    <TableHead className="w-40">Requirement</TableHead>
                    <TableHead className="w-80">Question</TableHead>
                    <TableHead className="w-28">Compliance</TableHead>
                    <TableHead className="min-w-[600px]">Documentation</TableHead>
                    <TableHead className="w-20">CAPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklistItems.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-muted/25">
                      <TableCell className="font-mono text-sm bg-blue-50">
                        <Badge variant="outline" className="text-xs">
                          {item.clause}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {item.requirement}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.question}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.compliance}
                          onValueChange={(value) => 
                            updateChecklistItem(index, "compliance", value as ChecklistItem["compliance"])
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                Pending
                              </div>
                            </SelectItem>
                            <SelectItem value="compliant">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Compliant
                              </div>
                            </SelectItem>
                            <SelectItem value="non-compliant">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                Non-Compliant
                              </div>
                            </SelectItem>
                            <SelectItem value="not-applicable">
                              <div className="flex items-center gap-2">
                                <X className="w-4 h-4 text-gray-500" />
                                N/A
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.documentation}
                          onChange={(e) => updateChecklistItem(index, "documentation", e.target.value)}
                          placeholder={`EVIDENCE REVIEWED:
• Document references: (e.g., SOP-QM-001, WI-PRD-105)
• Records examined: (e.g., Training records, calibration certificates)
• Interviews conducted: (e.g., QA Manager, Production Supervisor)
• Areas/processes observed: (e.g., Manufacturing floor, Clean room)

FINDINGS/OBSERVATIONS:
• Objective evidence of compliance/non-compliance
• Specific examples and details
• Reference to requirements not met (if applicable)

NOTES:
• Additional context or recommendations
• Follow-up actions needed
• Risk assessment if non-compliant`}
                          className="min-h-[120px] text-sm font-mono"
                          rows={8}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Checkbox
                            checked={item.requiresCapa}
                            onCheckedChange={(checked) => 
                              updateChecklistItem(index, "requiresCapa", checked)
                            }
                            disabled={item.compliance !== "non-compliant"}
                          />
                          {item.requiresCapa && (
                            <Input
                              value={item.capaId || ""}
                              onChange={(e) => updateChecklistItem(index, "capaId", e.target.value)}
                              placeholder="CAPA ID"
                              className="text-xs"
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {checklistItems.length} ISO 13485:2016 checklist items loaded
                {checklistItems.filter(item => item.compliance === "non-compliant").length > 0 && (
                  <span className="ml-4 text-red-600 font-medium">
                    {checklistItems.filter(item => item.compliance === "non-compliant").length} non-conformances requiring CAPA
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/audit-detail/${id}`)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Checklist...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save ISO 13485:2016 Checklist
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}