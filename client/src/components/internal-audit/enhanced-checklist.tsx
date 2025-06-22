import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileText,
  Plus,
  Save,
  Target,
  AlertCircle,
  Eye,
  Upload
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
import { apiRequest } from "@/lib/queryClient";

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
}

interface EnhancedChecklistProps {
  auditId: number;
  auditType: string;
  onComplete: () => void;
}

// Enhanced ISO 13485:2016 Checklist Questions
const ENHANCED_CHECKLIST_TEMPLATES = {
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
        section: "Audit Results",
        requirement: "Internal audit results",
        question: "Have internal audit results been reviewed and appropriate actions taken?",
        guidance: "Verify audit reports, finding closure, trend analysis, and management response to audit findings.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 6,
        clause: "5.6.2.d",
        section: "Process Performance",
        requirement: "Process monitoring",
        question: "Is process performance monitored and reviewed against established criteria?",
        guidance: "Check process metrics, performance indicators, control charts, and process improvement activities.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 7,
        clause: "5.6.3",
        section: "Review Output",
        requirement: "Management review outputs",
        question: "Are review outputs documented with decisions and actions for QMS improvement?",
        guidance: "Verify documented decisions, action items with owners and dates, resource allocation decisions.",
        riskLevel: "high" as const,
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
        requirement: "Design reviews",
        question: "Are systematic design reviews conducted at appropriate stages?",
        guidance: "Check review records, participants, criteria evaluation, and action items from design reviews.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 5,
        clause: "7.3.5",
        section: "Design Verification",
        requirement: "Design verification activities",
        question: "Has design verification been performed to ensure outputs meet input requirements?",
        guidance: "Review verification protocols, test results, analysis reports, and verification records.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 6,
        clause: "7.3.6",
        section: "Design Validation",
        requirement: "Design validation",
        question: "Has design validation confirmed the device meets user needs and intended use?",
        guidance: "Check validation protocols, clinical evaluation, usability testing, and validation reports.",
        riskLevel: "high" as const,
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
        requirement: "Supplier evaluation and selection",
        question: "Are suppliers evaluated and selected based on their ability to supply conforming products?",
        guidance: "Review supplier evaluation criteria, assessment records, approved supplier list, and qualification evidence.",
        riskLevel: "high" as const,
        mandatory: true
      },
      {
        id: 2,
        clause: "7.4.1",
        section: "Supplier Monitoring",
        requirement: "Supplier performance monitoring",
        question: "Is supplier performance monitored and re-evaluated periodically?",
        guidance: "Check performance metrics, quality agreements, audit schedules, and corrective action records.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 3,
        clause: "7.4.2",
        section: "Purchasing Information",
        requirement: "Purchase order requirements",
        question: "Do purchasing documents contain adequate specification of requirements?",
        guidance: "Review purchase orders, specifications, quality requirements, and approval requirements.",
        riskLevel: "medium" as const,
        mandatory: true
      },
      {
        id: 4,
        clause: "7.4.3",
        section: "Verification of Purchased Products",
        requirement: "Incoming inspection",
        question: "Are purchased products verified to meet specified requirements?",
        guidance: "Check incoming inspection procedures, test records, acceptance criteria, and non-conforming product handling.",
        riskLevel: "high" as const,
        mandatory: true
      }
    ]
  }
};

export function EnhancedAuditChecklist({ auditId, auditType, onComplete }: EnhancedChecklistProps) {
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showCapaForm, setShowCapaForm] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const template = ENHANCED_CHECKLIST_TEMPLATES[auditType as keyof typeof ENHANCED_CHECKLIST_TEMPLATES];
  
  if (!template) {
    return <div>Invalid audit type</div>;
  }

  const questions = template.questions;

  useEffect(() => {
    // Initialize responses array
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

  const saveChecklistMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/audits/checklist/save', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checklist Saved",
        description: "Audit checklist responses have been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/audits', auditId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save checklist responses",
        variant: "destructive"
      });
    }
  });

  const createCapaMutation = useMutation({
    mutationFn: async (capaData: any) => {
      const response = await apiRequest('/api/capa', {
        method: 'POST',
        body: JSON.stringify(capaData),
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true'
        }
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const questionId = variables.questionId;
      updateResponse(questionId, 'capaId', data.id);
      setShowCapaForm(null);
      toast({
        title: "CAPA Created",
        description: `CAPA ${data.id} has been created for the non-conformance`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create CAPA",
        variant: "destructive"
      });
    }
  });

  const handleCreateCapa = (questionId: number) => {
    const response = responses.find(r => r.questionId === questionId);
    const question = questions.find(q => q.id === questionId);
    
    if (!response || !question) return;

    const capaData = {
      title: response.capaTitle || `Non-conformance - ${question.clause}`,
      description: `${question.requirement}\n\nFindings: ${response.findings}`,
      category: 'nonconformity',
      priority: response.severity === 'critical' ? 'high' : response.severity === 'major' ? 'medium' : 'low',
      source: 'internal_audit',
      root_cause_analysis: response.correctiveAction || '',
      assigned_to: 'Quality Team',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      auditId: auditId,
      questionId: questionId
    };

    createCapaMutation.mutate({ ...capaData, questionId });
  };

  const handleSaveChecklist = () => {
    const checklistData = {
      auditId,
      auditType,
      responses: responses.filter(r => r.findings || r.compliance !== 'compliant'),
      completedAt: new Date().toISOString()
    };

    saveChecklistMutation.mutate(checklistData);
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

      {questions.map((question, index) => {
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
                      <Button
                        onClick={() => handleCreateCapa(question.id)}
                        disabled={createCapaMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {createCapaMutation.isPending ? 'Creating CAPA...' : 'Create CAPA Record'}
                      </Button>
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
          onClick={handleSaveChecklist}
          disabled={saveChecklistMutation.isPending}
          className="px-8"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveChecklistMutation.isPending ? 'Saving...' : 'Save Checklist'}
        </Button>
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