import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Save,
  Sparkles,
  Target,
  Upload,
  MessageSquare,
  Download,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Audit } from "@shared/schema";

// ISO 13485:2016 Intelligent Checklist Questions by Audit Type
const auditChecklistTemplates = {
  1: { // Management Review
    name: "Management Review Audit",
    standardRef: "ISO 13485:2016 5.6",
    questions: [
      {
        id: 1,
        text: "Has management reviewed the effectiveness of the quality management system?",
        clause: "5.6.1",
        section: "Management Review Process",
        guidance: "Review meeting minutes and evidence of systematic evaluation"
      },
      {
        id: 2,
        text: "Are quality objectives being met and monitored?",
        clause: "5.6.2",
        section: "Review Inputs",
        guidance: "Check quality metrics, KPIs, and performance data"
      },
      {
        id: 3,
        text: "Has customer feedback been reviewed and addressed?",
        clause: "5.6.2",
        section: "Customer Focus",
        guidance: "Verify customer complaints, feedback, and satisfaction data"
      },
      {
        id: 4,
        text: "Are corrective and preventive actions effective?",
        clause: "5.6.2",
        section: "CAPA Effectiveness",
        guidance: "Review CAPA records and effectiveness verification"
      }
    ]
  },
  2: { // Design & Development
    name: "Design & Development Audit",
    standardRef: "ISO 13485:2016 7.3",
    questions: [
      {
        id: 1,
        text: "Are design and development plans documented and controlled?",
        clause: "7.3.1",
        section: "Design Planning",
        guidance: "Review design plans, timelines, and resource allocation"
      },
      {
        id: 2,
        text: "Are design inputs complete and verified?",
        clause: "7.3.2",
        section: "Design Inputs",
        guidance: "Check user needs, safety requirements, and applicable standards"
      },
      {
        id: 3,
        text: "Do design outputs meet input requirements?",
        clause: "7.3.3",
        section: "Design Outputs",
        guidance: "Verify specifications, drawings, and acceptance criteria"
      },
      {
        id: 4,
        text: "Has design verification been performed?",
        clause: "7.3.5",
        section: "Design Verification",
        guidance: "Review test results and verification activities"
      }
    ]
  },
  3: { // Purchasing & Supplier
    name: "Purchasing & Supplier Audit",
    standardRef: "ISO 13485:2016 7.4",
    questions: [
      {
        id: 1,
        text: "Are suppliers evaluated and selected based on defined criteria?",
        clause: "7.4.1",
        section: "Purchasing Process",
        guidance: "Review supplier evaluation and selection procedures"
      },
      {
        id: 2,
        text: "Are purchasing documents adequate and controlled?",
        clause: "7.4.2",
        section: "Purchasing Information",
        guidance: "Check purchase orders, specifications, and requirements"
      },
      {
        id: 3,
        text: "Is purchased product verified before use?",
        clause: "7.4.3",
        section: "Verification of Purchased Product",
        guidance: "Review incoming inspection and acceptance procedures"
      }
    ]
  }
};

interface ChecklistItem {
  id: number;
  questionText: string;
  response: string;
  findingType: string;
  notes: string;
  evidenceFiles: string[];
}

export default function AuditChecklistPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: audit, isLoading } = useQuery<Audit>({
    queryKey: [`/api/audits/${id}`],
    retry: 1,
  });

  const generateChecklistMutation = useMutation({
    mutationFn: async () => {
      if (!audit) return;
      
      setIsGenerating(true);
      
      // Simulate intelligent checklist generation
      const template = auditChecklistTemplates[audit.typeId as keyof typeof auditChecklistTemplates];
      
      if (template) {
        const generatedItems: ChecklistItem[] = template.questions.map(q => ({
          id: q.id,
          questionText: q.text,
          response: "",
          findingType: "",
          notes: "",
          evidenceFiles: []
        }));
        
        setChecklistItems(generatedItems);
        
        toast({
          title: "Intelligent Checklist Generated! ✨",
          description: `${generatedItems.length} questions generated based on ${template.standardRef}`,
          variant: "default",
        });
      }
      
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate checklist. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: string) => {
    const updatedItems = [...checklistItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setChecklistItems(updatedItems);
  };

  const saveChecklistMutation = useMutation({
    mutationFn: async () => {
      // Save checklist to database
      const checklistData = {
        auditId: audit?.id,
        items: checklistItems,
        status: 'in_progress',
        savedAt: new Date().toISOString()
      };
      
      const response = await fetch(`/api/audits/${id}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Local": "true",
        },
        body: JSON.stringify(checklistData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save checklist: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checklist Saved Successfully! ✅",
        description: "Your audit checklist has been saved and can be resumed later.",
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/audits/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save checklist. Please try again.",
        variant: "destructive",
      });
    }
  });

  const exportToPDF = () => {
    if (!audit || checklistItems.length === 0) return;
    
    // Create PDF content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const template = auditChecklistTemplates[audit.typeId as keyof typeof auditChecklistTemplates];
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Checklist - ${audit.auditId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .audit-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .audit-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .question { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .question-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .question-details { margin-bottom: 15px; color: #666; }
            .response { background: #f0f8ff; padding: 10px; border-radius: 3px; margin-bottom: 10px; }
            .finding { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 12px; margin-left: 10px; }
            .finding.compliant { background: #d4edda; color: #155724; }
            .finding.nonconformity { background: #f8d7da; color: #721c24; }
            .finding.observation { background: #fff3cd; color: #856404; }
            .notes { margin-top: 10px; font-style: italic; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="audit-title">Internal Audit Checklist</div>
            <div class="audit-info">
              <strong>Audit ID:</strong> ${audit.auditId}<br>
              <strong>Title:</strong> ${audit.title}<br>
              <strong>Type:</strong> ${template?.name || 'Standard Audit'}<br>
              <strong>Standard:</strong> ${template?.standardRef || 'ISO 13485:2016'}<br>
              <strong>Lead Auditor:</strong> ${audit.leadAuditorName}<br>
              <strong>Location:</strong> ${audit.auditLocation}<br>
              <strong>Generated:</strong> ${new Date().toLocaleDateString()}
            </div>
          </div>
          
          ${checklistItems.map((item, index) => {
            const templateQuestion = template?.questions.find(q => q.id === item.id);
            return `
              <div class="question">
                <div class="question-title">
                  Question ${item.id}: ${item.questionText}
                  ${item.findingType ? `<span class="finding ${item.findingType}">${item.findingType.toUpperCase()}</span>` : ''}
                </div>
                ${templateQuestion ? `
                  <div class="question-details">
                    <strong>Clause:</strong> ${templateQuestion.clause} | 
                    <strong>Section:</strong> ${templateQuestion.section}<br>
                    <strong>Guidance:</strong> ${templateQuestion.guidance}
                  </div>
                ` : ''}
                <div class="response">
                  <strong>Response:</strong> ${item.response || 'Not answered'}
                </div>
                ${item.notes ? `<div class="notes"><strong>Notes:</strong> ${item.notes}</div>` : ''}
              </div>
            `;
          }).join('')}
          
          <div class="footer">
            <p><strong>Summary:</strong></p>
            <p>Total Questions: ${checklistItems.length}</p>
            <p>Compliant: ${checklistItems.filter(i => i.findingType === 'compliant').length}</p>
            <p>Non-Conformities: ${checklistItems.filter(i => i.findingType === 'nonconformity').length}</p>
            <p>Observations: ${checklistItems.filter(i => i.findingType === 'observation').length}</p>
            <p>Generated by eQMS Internal Audit System - ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-trigger print dialog
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
    
    toast({
      title: "PDF Export Ready! 📄",
      description: "Checklist opened in new window for printing or saving as PDF.",
      variant: "default",
    });
  };

  const handleResponseChange = (index: number, response: string) => {
    updateChecklistItem(index, 'response', response);
    
    // Auto-determine finding type based on response
    let findingType = "";
    if (response.toLowerCase().includes("yes") || response.toLowerCase().includes("compliant")) {
      findingType = "compliant";
    } else if (response.toLowerCase().includes("no") || response.toLowerCase().includes("non")) {
      findingType = "nonconformity";
    } else if (response.toLowerCase().includes("partial") || response.toLowerCase().includes("minor")) {
      findingType = "observation";
    }
    
    if (findingType) {
      updateChecklistItem(index, 'findingType', findingType);
    }
  };

  if (isLoading || !audit) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-lg">Loading audit checklist...</div>
        </div>
      </div>
    );
  }

  const template = auditChecklistTemplates[audit.typeId as keyof typeof auditChecklistTemplates];

  return (
    <>
      <Helmet>
        <title>Audit Checklist - {audit.title} | Internal Audit | eQMS</title>
        <meta name="description" content={`Intelligent audit checklist for ${audit.title}`} />
      </Helmet>

      <div className="container py-8 space-y-8">
        <PageHeader
          title="Intelligent Audit Checklist"
          description={`${template?.name || "Audit Checklist"} - ${audit.auditId}`}
          actions={
            <div className="flex space-x-3">
              <Link href={`/internal-audit/${id}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Audit
                </Button>
              </Link>
              {checklistItems.length > 0 && (
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => saveChecklistMutation.mutate()}
                    disabled={saveChecklistMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saveChecklistMutation.isPending ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Checklist
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={exportToPDF}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              )}
            </div>
          }
        />

        {checklistItems.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Ready to Generate Intelligent Checklist
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Generate an intelligent checklist based on {template?.name} requirements 
                and {template?.standardRef} standards.
              </p>
              <Button 
                onClick={() => generateChecklistMutation.mutate()}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating Intelligent Checklist...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Intelligent Checklist
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Intelligent Checklist Generated
                </CardTitle>
                <CardDescription className="text-blue-700">
                  {checklistItems.length} questions generated based on {template?.standardRef}
                </CardDescription>
              </CardHeader>
            </Card>

            {checklistItems.map((item, index) => {
              const templateQuestion = template?.questions.find(q => q.id === item.id);
              return (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Question {item.id}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {item.questionText}
                        </CardDescription>
                        {templateQuestion && (
                          <div className="mt-3 space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {templateQuestion.clause}
                            </Badge>
                            <p className="text-xs text-gray-600">
                              <strong>Section:</strong> {templateQuestion.section}
                            </p>
                            <p className="text-xs text-gray-600">
                              <strong>Guidance:</strong> {templateQuestion.guidance}
                            </p>
                          </div>
                        )}
                      </div>
                      {item.findingType && (
                        <Badge 
                          variant="secondary" 
                          className={
                            item.findingType === "compliant" 
                              ? "bg-green-100 text-green-800" 
                              : item.findingType === "nonconformity"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {item.findingType === "compliant" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {item.findingType === "nonconformity" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {item.findingType}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Response
                      </label>
                      <Select 
                        value={item.response} 
                        onValueChange={(value) => handleResponseChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select response" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes - Compliant</SelectItem>
                          <SelectItem value="no">No - Non-Conformity</SelectItem>
                          <SelectItem value="partial">Partial - Observation</SelectItem>
                          <SelectItem value="na">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Notes & Evidence
                      </label>
                      <Textarea
                        placeholder="Add detailed notes, observations, and evidence..."
                        value={item.notes}
                        onChange={(e) => updateChecklistItem(index, 'notes', e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Evidence
                      </Button>
                      {item.findingType === "nonconformity" && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                          <Plus className="h-4 w-4 mr-2" />
                          Create CAPA
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}