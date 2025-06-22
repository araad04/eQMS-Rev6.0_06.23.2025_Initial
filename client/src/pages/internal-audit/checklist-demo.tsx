import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Plus,
  FileText,
  Shield,
  Eye,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditChecklistEnhanced } from "@/components/internal-audit/audit-checklist-enhanced";
import PageHeader from "@/components/page-header";

export default function InternalAuditChecklistDemo() {
  const [selectedAuditType, setSelectedAuditType] = useState("management_review");
  const [showChecklist, setShowChecklist] = useState(false);

  const auditTypes = {
    management_review: {
      name: "Management Review Audit",
      description: "Systematic review of QMS effectiveness and performance",
      standardRef: "ISO 13485:2016 Clause 5.6",
      questionCount: 8,
      riskLevel: "high",
      icon: "📊"
    },
    design_development: {
      name: "Design & Development Audit",
      description: "Verification of design controls and development processes",
      standardRef: "ISO 13485:2016 Clause 7.3",
      questionCount: 9,
      riskLevel: "high", 
      icon: "🔬"
    },
    supplier_management: {
      name: "Supplier Management Audit",
      description: "Assessment of supplier evaluation and monitoring processes",
      standardRef: "ISO 13485:2016 Clause 7.4",
      questionCount: 6,
      riskLevel: "medium",
      icon: "🏭"
    }
  };

  const features = [
    {
      icon: <Shield className="h-5 w-5 text-blue-600" />,
      title: "ISO 13485:2016 Compliance",
      description: "Comprehensive clause-based questions ensuring regulatory compliance"
    },
    {
      icon: <Target className="h-5 w-5 text-green-600" />,
      title: "Risk-Based Assessment",
      description: "Critical, Major, and Minor severity classifications for findings"
    },
    {
      icon: <Plus className="h-5 w-5 text-purple-600" />,
      title: "Automatic CAPA Creation",
      description: "Seamless integration to create CAPAs for non-conformances"
    },
    {
      icon: <FileText className="h-5 w-5 text-orange-600" />,
      title: "Evidence Documentation",
      description: "Structured documentation of findings and supporting evidence"
    }
  ];

  const handleStartChecklist = () => {
    setShowChecklist(true);
  };

  const handleCompleteAudit = () => {
    setShowChecklist(false);
    // In a real implementation, this would navigate to audit completion page
  };

  if (showChecklist) {
    return (
      <>
        <Helmet>
          <title>Enhanced Audit Checklist | eQMS</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowChecklist(false)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audit Setup
            </Button>
          </div>
          
          <AuditChecklistEnhanced
            auditId={1}
            auditType={selectedAuditType}
            onComplete={handleCompleteAudit}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Enhanced Internal Audit Checklist Demo | eQMS</title>
        <meta 
          name="description" 
          content="Demonstration of enhanced internal audit checklist with automatic CAPA integration for ISO 13485:2016 compliance" 
        />
      </Helmet>

      <div className="container mx-auto py-6">
        <PageHeader
          title="Enhanced Internal Audit Checklist"
          description="Comprehensive ISO 13485:2016 compliant audit checklist with automatic CAPA integration"
          actions={
            <Link href="/internal-audit">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Audits
              </Button>
            </Link>
          }
        />

        <div className="space-y-8">
          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Enhanced Audit Features
              </CardTitle>
              <CardDescription>
                Advanced capabilities for comprehensive audit execution and CAPA integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gray-50 rounded-full">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="font-medium mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audit Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Audit Type</CardTitle>
              <CardDescription>
                Choose the type of internal audit to execute with the enhanced checklist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(auditTypes).map(([key, auditType]) => (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAuditType === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedAuditType(key)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">{auditType.icon}</div>
                        <h3 className="font-medium mb-2">{auditType.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{auditType.description}</p>
                        
                        <div className="space-y-2">
                          <Badge variant="outline" className="text-xs">
                            {auditType.standardRef}
                          </Badge>
                          <div className="flex justify-center gap-2">
                            <Badge 
                              variant={auditType.riskLevel === 'high' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {auditType.riskLevel.toUpperCase()} RISK
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {auditType.questionCount} Questions
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Checklist Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist Features Preview</CardTitle>
              <CardDescription>
                Preview of the enhanced checklist capabilities and CAPA integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="compliance" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="compliance">Compliance Tracking</TabsTrigger>
                  <TabsTrigger value="severity">Severity Assessment</TabsTrigger>
                  <TabsTrigger value="capa">CAPA Integration</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence Documentation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="compliance" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="font-medium text-green-900">Compliant</div>
                      <div className="text-sm text-green-700">Requirements met</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <div className="font-medium text-red-900">Non-Compliant</div>
                      <div className="text-sm text-red-700">CAPA required</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Eye className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <div className="font-medium text-yellow-900">Observation</div>
                      <div className="text-sm text-yellow-700">Improvement opportunity</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Not Applicable</div>
                      <div className="text-sm text-gray-700">Does not apply</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="severity" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Critical Severity</h4>
                      <p className="text-sm text-red-800">
                        Immediate patient safety impact or significant regulatory non-compliance
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Major Severity</h4>
                      <p className="text-sm text-yellow-800">
                        Could affect product quality or regulatory compliance
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Minor Severity</h4>
                      <p className="text-sm text-blue-800">
                        Process improvement opportunity with minimal risk
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="capa" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Automatic CAPA Creation Process:</h4>
                    <ol className="text-sm text-blue-800 space-y-2">
                      <li>1. Non-conformance identified during audit</li>
                      <li>2. Severity level assessed (Critical/Major/Minor)</li>
                      <li>3. CAPA requirement checkbox activated</li>
                      <li>4. CAPA title and immediate action documented</li>
                      <li>5. CAPA record automatically created and linked</li>
                      <li>6. Audit trail maintained for regulatory compliance</li>
                    </ol>
                  </div>
                </TabsContent>
                
                <TabsContent value="evidence" className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-1">Findings Documentation</h5>
                      <p className="text-sm text-gray-600">Detailed documentation of audit findings and observations</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-1">Evidence References</h5>
                      <p className="text-sm text-gray-600">Document references, procedure numbers, and evidence locations</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-1">Audit Trail</h5>
                      <p className="text-sm text-gray-600">Complete audit trail for regulatory compliance and traceability</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Start Checklist */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Ready to Start Enhanced Audit?</h3>
                <p className="text-gray-600 mb-6">
                  Execute the {auditTypes[selectedAuditType as keyof typeof auditTypes].name} with comprehensive checklist and CAPA integration
                </p>
                <Button 
                  onClick={handleStartChecklist}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start Enhanced Checklist
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}