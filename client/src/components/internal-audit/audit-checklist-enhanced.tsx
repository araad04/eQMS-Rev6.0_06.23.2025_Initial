import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Plus,
  Save,
  Target,
  AlertCircle,
  Eye
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ChecklistQuestion {
  id: number;
  clause: string;
  section: string;
  requirement: string;
  question: string;
  guidance: string;
  riskLevel: "high" | "medium" | "low";
  mandatory: boolean;
}

interface ChecklistResponse {
  questionId: number;
  compliance: "compliant" | "non-compliant" | "observation" | "not-applicable";
  severity: "critical" | "major" | "minor" | null;
  findings: string;
  evidence: string;
  requiresCapa: boolean;
  capaTitle?: string;
  correctiveAction?: string;
  createdCapaId?: number;
  createdCapaLink?: string;
}

interface AuditChecklistProps {
  auditId: number;
  auditType: string;
  onComplete: () => void;
}

// Enhanced ISO 13485:2016 Checklist Questions
const CHECKLIST_TEMPLATES = {
  "management_review": {
    name: "Management Review Audit",
    standardRef: "ISO 13485:2016 Clause 5.6",
    questions: [
      {
        id: 1,
        clause: "5.6.1",
        section: "Management Review Process",
        requirement: "Management review of QMS",
        question: "Has top management conducted systematic reviews of the QMS at planned intervals?",
        guidance: "Verify meeting minutes, agenda items, and evidence of systematic evaluation. Check frequency meets organizational needs.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 2,
        clause: "5.6.2",
        section: "Review Input",
        requirement: "Quality objectives monitoring",
        question: "Are quality objectives being achieved and monitored with appropriate metrics?",
        guidance: "Review KPIs, quality metrics, performance dashboards, and trending data. Verify corrective actions for missed objectives.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 3,
        clause: "5.6.2.a",
        section: "Customer Feedback",
        requirement: "Customer feedback analysis",
        question: "Has customer feedback been systematically collected, analyzed, and addressed?",
        guidance: "Check customer complaints, satisfaction surveys, feedback logs, and response actions. Verify trending analysis.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 4,
        clause: "5.6.2.b",
        section: "CAPA Effectiveness",
        requirement: "CAPA effectiveness review",
        question: "Are corrective and preventive actions effective and verified for effectiveness?",
        guidance: "Review CAPA records, effectiveness verification activities, and closure evidence. Check for recurring issues.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 5,
        clause: "5.6.2.c",
        section: "Process Performance",
        requirement: "Process monitoring and measurement results",
        question: "Are processes monitored, measured, and performing as planned with documented evidence?",
        guidance: "Verify process KPIs, statistical process control charts, capability studies, and trend analysis reports.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 6,
        clause: "5.6.2.d",
        section: "Product Conformity",
        requirement: "Product conformity status",
        question: "Is product conformity status monitored with documented evidence of compliance?",
        guidance: "Check product testing records, inspection reports, nonconformity logs, and release documentation.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 7,
        clause: "5.6.2.e",
        section: "Regulatory Changes",
        requirement: "Changes affecting QMS",
        question: "Have regulatory changes been identified, assessed, and incorporated into the QMS?",
        guidance: "Review regulatory monitoring processes, change impact assessments, and implementation records.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 8,
        clause: "5.6.3",
        section: "Review Output",
        requirement: "Management review output decisions",
        question: "Are management review outputs documented with clear decisions and action assignments?",
        guidance: "Verify meeting minutes include decisions on QMS improvement, resource needs, and policy changes.",
        riskLevel: "medium" as const,
        mandatory: true
      }
    ]
  },
  "design_development": {
    name: "Design & Development Audit",
    standardRef: "ISO 13485:2016 Clause 7.3",
    questions: [
      {
        id: 1,
        clause: "7.3.1",
        section: "Design Planning",
        requirement: "Design and development planning",
        question: "Are design and development activities planned and controlled with documented procedures?",
        guidance: "Review design plans, project timelines, resource allocation, responsibility assignments, and stage gates.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 2,
        clause: "7.3.2",
        section: "Design Inputs",
        requirement: "Design inputs definition",
        question: "Are design inputs complete, unambiguous, and verified for adequacy?",
        guidance: "Check user needs, safety requirements, regulatory requirements, standards, and risk management inputs.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 3,
        clause: "7.3.3",
        section: "Design Outputs",
        requirement: "Design outputs verification",
        question: "Do design outputs meet input requirements and provide appropriate information?",
        guidance: "Verify specifications, drawings, acceptance criteria, user instructions, and labeling requirements.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 4,
        clause: "7.3.4",
        section: "Design Review",
        requirement: "Design review execution",
        question: "Are design reviews conducted at appropriate stages with qualified participants?",
        guidance: "Check design review records, participant qualifications, review checklists, and decision documentation.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 5,
        clause: "7.3.5",
        section: "Design Verification",
        requirement: "Design verification activities",
        question: "Is design verification performed to ensure outputs meet input requirements?",
        guidance: "Review verification protocols, test results, analysis reports, and verification records.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 6,
        clause: "7.3.6",
        section: "Design Validation",
        requirement: "Design validation under actual use conditions",
        question: "Is design validation performed under defined operating conditions to confirm user needs?",
        guidance: "Check validation protocols, clinical data, usability studies, and validation reports.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 7,
        clause: "7.3.7",
        section: "Design Transfer",
        requirement: "Design transfer to production",
        question: "Are design outputs transferred to production with verified manufacturing capability?",
        guidance: "Review transfer protocols, production validations, capability studies, and transfer records.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 8,
        clause: "7.3.8",
        section: "Design Changes",
        requirement: "Design change control",
        question: "Are design changes controlled, evaluated for impact, and properly approved?",
        guidance: "Check change control procedures, impact assessments, approval records, and implementation verification.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 9,
        clause: "7.3.9",
        section: "Design Files",
        requirement: "Design history file maintenance",
        question: "Are design history files maintained with complete design development records?",
        guidance: "Verify file completeness, organization, accessibility, and regulatory compliance requirements.",
        riskLevel: "medium" as const,
        mandatory: true
      }
    ]
  },
  "supplier_management": {
    name: "Supplier Management Audit",
    standardRef: "ISO 13485:2016 Clause 7.4",
    questions: [
      {
        id: 1,
        clause: "7.4.1",
        section: "Purchasing Process",
        requirement: "Purchasing process control",
        question: "Is the purchasing process controlled to ensure purchased products meet requirements?",
        guidance: "Review purchasing procedures, supplier qualification processes, and purchase order controls.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 2,
        clause: "7.4.2",
        section: "Purchasing Information",
        requirement: "Purchase information adequacy",
        question: "Does purchasing information adequately describe products or services being purchased?",
        guidance: "Check purchase orders, specifications, quality requirements, and approval criteria.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 3,
        clause: "7.4.3",
        section: "Verification of Purchased Products",
        requirement: "Incoming inspection and verification",
        question: "Are purchased products verified to meet specified requirements before use?",
        guidance: "Review incoming inspection procedures, test records, certificates of analysis, and acceptance criteria.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 4,
        clause: "7.4.1",
        section: "Supplier Evaluation",
        requirement: "Supplier evaluation and selection",
        question: "Are suppliers evaluated and selected based on their ability to supply conforming products?",
        guidance: "Check supplier qualification records, evaluation criteria, audit reports, and selection documentation.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 5,
        clause: "7.4.1",
        section: "Supplier Monitoring",
        requirement: "Supplier performance monitoring",
        question: "Is supplier performance monitored and evaluated on an ongoing basis?",
        guidance: "Review supplier scorecards, performance metrics, quality agreements, and monitoring reports.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 6,
        clause: "7.4.1",
        section: "Supply Chain Risk",
        requirement: "Supply chain risk management",
        question: "Are supply chain risks identified, assessed, and managed effectively?",
        guidance: "Check risk assessments, contingency plans, supplier diversity, and business continuity planning.",
        riskLevel: "high" as const,
        mandatory: true
      }
    ]
  }
};

export function AuditChecklistEnhanced({ auditId, auditType, onComplete }: AuditChecklistProps) {
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const template = CHECKLIST_TEMPLATES[auditType as keyof typeof CHECKLIST_TEMPLATES];
  
  if (!template) {
    return <div>Invalid audit type</div>;
  }

  const questions = template.questions;

  useEffect(() => {
    setResponses(questions.map(q => ({
      questionId: q.id,
      compliance: "compliant" as const,
      severity: null,
      findings: "",
      evidence: "",
      requiresCapa: false
    })));
  }, [questions]);

  const updateResponse = (questionId: number, field: keyof ChecklistResponse, value: any) => {
    setResponses(prev => prev.map(r => 
      r.questionId === questionId 
        ? { ...r, [field]: value }
        : r
    ));
  };

  const createCapaMutation = useMutation({
    mutationFn: async (capaData: any) => {
      const response = await fetch('/api/capas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        },
        body: JSON.stringify(capaData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create CAPA');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the response with the created CAPA details
      setResponses(prev => prev.map(r => 
        r.questionId === variables.questionId 
          ? { 
              ...r, 
              createdCapaId: data.id,
              createdCapaLink: `/capa-management/${data.id}`
            }
          : r
      ));
      
      toast({
        title: "CAPA Created Successfully",
        description: `CAPA record ${data.capaId} has been created and linked to the audit finding`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/capas'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create CAPA. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateCapa = (questionId: number) => {
    const response = responses.find(r => r.questionId === questionId);
    const question = questions.find(q => q.id === questionId);
    
    if (!response || !question) return;

    const capaData = {
      questionId, // Add questionId for tracking
      title: response.capaTitle || `Audit Non-conformance - ${question.clause}`,
      description: `${question.requirement}\n\nFindings: ${response.findings}\n\nImmediate Action: ${response.correctiveAction || 'To be determined'}`,
      typeId: 1, // Default type ID
      statusId: 1, // Default status ID
      source: 'internal_audit',
      riskPriority: response.severity === 'critical' ? 'high' : 
                   response.severity === 'major' ? 'medium' : 'low',
      patientSafetyImpact: response.severity === 'critical'
    };

    createCapaMutation.mutate(capaData);
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'text-green-600';
      case 'non-compliant': return 'text-red-600';
      case 'observation': return 'text-yellow-600';
      case 'not-applicable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceIcon = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'non-compliant': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'observation': return <Eye className="h-5 w-5 text-yellow-600" />;
      case 'not-applicable': return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const nonCompliantCount = responses.filter(r => r.compliance === 'non-compliant').length;
  const observationCount = responses.filter(r => r.compliance === 'observation').length;
  const compliantCount = responses.filter(r => r.compliance === 'compliant').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {template.name}
              </CardTitle>
              <CardDescription>
                {template.standardRef} - Enhanced checklist with CAPA integration
              </CardDescription>
            </div>
            <Badge variant="outline">{questions.length} Questions</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{compliantCount}</div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{nonCompliantCount}</div>
              <div className="text-sm text-gray-600">Non-Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{observationCount}</div>
              <div className="text-sm text-gray-600">Observations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {responses.filter(r => r.requiresCapa).length}
              </div>
              <div className="text-sm text-gray-600">CAPAs Required</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {questions.map((question) => {
        const response = responses.find(r => r.questionId === question.id);
        if (!response) return null;

        return (
          <Card key={question.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{question.clause}</Badge>
                    <Badge 
                      variant={question.riskLevel === 'high' ? 'destructive' : 
                              question.riskLevel === 'medium' ? 'default' : 'secondary'}
                    >
                      {question.riskLevel.toUpperCase()} RISK
                    </Badge>
                    {question.mandatory && <Badge variant="destructive">MANDATORY</Badge>}
                  </div>
                  <CardTitle className="text-lg">{question.question}</CardTitle>
                  <CardDescription className="mt-2">
                    <strong>Section:</strong> {question.section}<br />
                    <strong>Requirement:</strong> {question.requirement}<br />
                    <strong>Guidance:</strong> {question.guidance}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getComplianceIcon(response.compliance)}
                  <span className={`font-medium ${getComplianceColor(response.compliance)}`}>
                    {response.compliance.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Compliance Status</label>
                  <Select
                    value={response.compliance}
                    onValueChange={(value) => updateResponse(question.id, 'compliance', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="not-applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {response.compliance === 'non-compliant' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Severity Level</label>
                    <Select
                      value={response.severity || ''}
                      onValueChange={(value) => updateResponse(question.id, 'severity', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Findings / Observations</label>
                <Textarea
                  placeholder="Document your findings, observations, or evidence of compliance..."
                  value={response.findings}
                  onChange={(e) => updateResponse(question.id, 'findings', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Evidence / Reference</label>
                <Input
                  placeholder="Document references, procedure numbers, evidence location..."
                  value={response.evidence}
                  onChange={(e) => updateResponse(question.id, 'evidence', e.target.value)}
                />
              </div>

              {response.compliance === 'non-compliant' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`capa-${question.id}`}
                      checked={response.requiresCapa}
                      onCheckedChange={(checked) => updateResponse(question.id, 'requiresCapa', checked)}
                    />
                    <label htmlFor={`capa-${question.id}`} className="text-sm font-medium">
                      Requires CAPA (Corrective and Preventive Action)
                    </label>
                  </div>

                  {response.requiresCapa && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">CAPA Title</label>
                        <Input
                          placeholder="Brief title for the CAPA..."
                          value={response.capaTitle || ''}
                          onChange={(e) => updateResponse(question.id, 'capaTitle', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Immediate Corrective Action</label>
                        <Textarea
                          placeholder="Describe immediate actions to address the non-conformance..."
                          value={response.correctiveAction || ''}
                          onChange={(e) => updateResponse(question.id, 'correctiveAction', e.target.value)}
                          rows={2}
                        />
                      </div>
                      {response.createdCapaId ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-green-900">CAPA Created Successfully</h5>
                                <p className="text-sm text-green-700">
                                  CAPA record has been created and linked to this audit finding
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => window.open(response.createdCapaLink, '_blank')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  View CAPA
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleCreateCapa(question.id)}
                          disabled={createCapaMutation.isPending}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {createCapaMutation.isPending ? 'Creating CAPA...' : 'Create CAPA Record'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex gap-4 justify-end">
        <Button
          onClick={onComplete}
          variant="outline"
        >
          Complete Audit
        </Button>
      </div>
    </div>
  );
}