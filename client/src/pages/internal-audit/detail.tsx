import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Sparkles,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/page-header";
import { Audit } from "@shared/schema";

// Status configuration
const auditStatusConfig = {
  1: { label: "Planning", color: "bg-blue-100 text-blue-800", icon: Calendar },
  2: { label: "Scheduled", color: "bg-purple-100 text-purple-800", icon: Clock },
  3: { label: "In Progress", color: "bg-amber-100 text-amber-800", icon: Users },
  4: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  5: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: Target }
};

// Audit types
const auditTypeConfig = {
  1: { name: "Management Review", icon: "🎯" },
  2: { name: "Design & Development", icon: "🔬" },
  3: { name: "Purchasing & Supplier", icon: "🤝" },
  4: { name: "Production & Service", icon: "⚙️" },
  5: { name: "Technical File", icon: "📋" },
  6: { name: "Risk Management", icon: "⚡" }
};

export default function InternalAuditDetail() {
  const { id } = useParams();

  const { data: audit, isLoading, error } = useQuery<Audit>({
    queryKey: [`/api/audits/${id}`],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-lg">Loading audit details...</div>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Audit Not Found</h3>
          <p className="text-gray-600 mb-4">The audit you're looking for doesn't exist or couldn't be loaded.</p>
          <Link href="/internal-audit">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = auditStatusConfig[audit.statusId as keyof typeof auditStatusConfig];
  const auditType = auditTypeConfig[audit.typeId as keyof typeof auditTypeConfig];
  const StatusIcon = status?.icon || Clock;

  return (
    <>
      <Helmet>
        <title>{audit.title} | Internal Audit | eQMS</title>
        <meta name="description" content={`Internal audit details: ${audit.title}`} />
      </Helmet>

      <div className="container py-8 space-y-8">
        <PageHeader
          title={audit.title}
          description={`${auditType?.name} Audit - ${audit.auditId}`}
          actions={
            <div className="flex space-x-3">
              <Link href="/internal-audit">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Audits
                </Button>
              </Link>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Sparkles className="h-4 w-4 mr-2" />
                Execute Audit
              </Button>
            </div>
          }
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Audit Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="text-2xl">{auditType?.icon}</div>
                    <span>Audit Overview</span>
                  </CardTitle>
                  <Badge variant="secondary" className={status?.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Audit Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-gray-600 mr-2">Scheduled:</span>
                        <span className="font-medium">
                          {audit.scheduledDate 
                            ? new Date(audit.scheduledDate).toLocaleDateString()
                            : "Not scheduled"
                          }
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-gray-600 mr-2">Lead Auditor:</span>
                        <span className="font-medium">{audit.leadAuditorName || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="text-gray-600 mr-2">Location:</span>
                        <span className="font-medium">{audit.auditLocation || "TBD"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Standards & References</h4>
                    <div className="space-y-2">
                      {audit.standardReference ? (
                        <div className="flex items-center text-sm">
                          <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                          <span className="font-medium">{audit.standardReference}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No standards specified</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Scope</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {audit.scope || "No scope defined"}
                  </p>
                </div>

                {audit.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {audit.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Audit Checklist Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Enhanced Audit Checklist
                </CardTitle>
                <CardDescription>
                  ISO 13485:2016 compliant checklist with automatic CAPA integration for non-conformances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Enhanced Features:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Comprehensive ISO 13485:2016 clause-based questions</li>
                      <li>• Risk-based severity assessment (Critical/Major/Minor)</li>
                      <li>• Automatic CAPA creation for non-conformances</li>
                      <li>• Real-time compliance tracking and metrics</li>
                      <li>• Evidence documentation and audit trail</li>
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">4-7</div>
                      <div className="text-sm text-green-700">Questions per Module</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">Auto</div>
                      <div className="text-sm text-yellow-700">CAPA Creation</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">ISO</div>
                      <div className="text-sm text-purple-700">13485:2016 Compliant</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                      onClick={() => window.location.href = `/internal-audit/checklist-demo`}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Enhanced Checklist
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Previous Audits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/internal-audit/${audit.id}/checklist`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Checklist
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Assign Team Members
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Audit ID</span>
                  <p className="font-mono text-sm">{audit.auditId}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created</span>
                  <p className="text-sm">{new Date(audit.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <p className="text-sm">{new Date(audit.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}