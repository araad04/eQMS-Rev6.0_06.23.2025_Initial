import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Calendar, FileText, User } from "lucide-react";

interface Assessment {
  id: number;
  supplierId: number;
  supplierName: string;
  assessmentType: string;
  status: string;
  scheduledDate: string;
  conductedDate?: string;
  conductedBy?: number;
  score?: number;
  findings?: string;
  recommendations?: string;
  nextAssessmentDate?: string;
}

export default function SupplierAssessments() {
  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ['/api/supplier-assessments'],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/supplier-management">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Suppliers
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Supplier Assessments</h1>
      </div>

      <div className="grid gap-6">
        {assessments && assessments.length > 0 ? (
          assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{assessment.supplierName}</CardTitle>
                    <p className="text-gray-600 mt-1">
                      {assessment.assessmentType} Assessment
                    </p>
                  </div>
                  <Badge className={getStatusColor(assessment.status)}>
                    {assessment.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Scheduled</p>
                      <p className="font-medium">
                        {new Date(assessment.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {assessment.conductedDate && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Conducted</p>
                        <p className="font-medium">
                          {new Date(assessment.conductedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {assessment.score && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="text-sm text-gray-600">Score</p>
                        <p className={`font-bold ${getScoreColor(assessment.score)}`}>
                          {assessment.score}%
                        </p>
                      </div>
                    </div>
                  )}

                  {assessment.conductedBy && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Conducted By</p>
                        <p className="font-medium">User #{assessment.conductedBy}</p>
                      </div>
                    </div>
                  )}
                </div>

                {assessment.findings && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Key Findings</h4>
                    <p className="text-sm text-yellow-700">{assessment.findings}</p>
                  </div>
                )}

                {assessment.recommendations && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                    <p className="text-sm text-blue-700">{assessment.recommendations}</p>
                  </div>
                )}

                {assessment.nextAssessmentDate && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Next Assessment</h4>
                    <p className="text-sm text-green-700">
                      Scheduled for {new Date(assessment.nextAssessmentDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Assessments Found
              </h3>
              <p className="text-gray-600 mb-4">
                No supplier assessments have been created yet.
              </p>
              <Link href="/supplier-management">
                <Button>
                  View Suppliers
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}