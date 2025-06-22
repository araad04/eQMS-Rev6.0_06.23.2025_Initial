import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/page-header';
import { 
  IOVVMatrix, 
  Requirement, 
  Specification, 
  VerificationTest, 
  ValidationTest, 
  Defect,
  generateTraceabilityReport, 
  checkComplianceStatus,
  exportAsCSV 
} from '@/utils/iovv-matrix';
import { 
  Download, 
  FileCheck,
  AlertCircle, 
  CheckCircle, 
  CheckSquare, 
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const IOVVMatrixPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  // This would typically be fetched from an API
  const { data: matrix, isLoading } = useQuery<IOVVMatrix>({
    queryKey: ['/api/design-control/iovv-matrix'],
    // Use default queryFn from queryClient setup
  });

  const getBadgeForStatus = (status: string) => {
    switch (status) {
      case 'Passed':
        return <Badge className="bg-green-500">Passed</Badge>;
      case 'Failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'Blocked':
        return <Badge className="bg-amber-500">Blocked</Badge>;
      case 'Not Run':
        return <Badge className="bg-slate-400">Not Run</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBadgeForPriority = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge className="bg-red-500">High</Badge>;
      case 'Medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      case 'Low':
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const handleExportCSV = () => {
    if (!matrix) return;
    
    const csv = exportAsCSV(matrix);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `iovv-matrix-${matrix.module}-${matrix.version}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Export Successful',
      description: 'IOVV Matrix has been exported as CSV.',
      variant: 'default'
    });
  };

  if (isLoading || !matrix) {
    return (
      <div className="p-6">
        <PageHeader 
          title="IOVV Matrix" 
          description="Design Control Verification and Validation Matrix" 
        />
        <div className="flex items-center justify-center h-64">
          <p>Loading IOVV matrix data...</p>
        </div>
      </div>
    );
  }

  const traceabilityReport = generateTraceabilityReport(matrix);
  const complianceStatus = checkComplianceStatus(matrix);

  return (
    <div className="p-6">
      <PageHeader 
        title="IOVV Matrix" 
        subtitle={`${matrix.module} - Version ${matrix.version}`}
        description="Design Control Verification and Validation Matrix" 
        actions={
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matrix.requirements.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total tracked requirements
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matrix.specifications.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total system specifications
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Verification Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matrix.verificationTests.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {matrix.verificationTests.filter(t => t.status === 'Passed').length} passed,{' '}
                    {matrix.verificationTests.filter(t => t.status === 'Failed').length} failed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Validation Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matrix.validationTests.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {matrix.validationTests.filter(t => t.status === 'Passed').length} passed,{' '}
                    {matrix.validationTests.filter(t => t.status === 'Failed').length} failed
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Traceability Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Specifications</span>
                        <span className="text-sm">{traceabilityReport.stats.coverage.specifications}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-200 rounded-full">
                        <div 
                          className="h-2.5 bg-blue-500 rounded-full" 
                          style={{ width: `${traceabilityReport.stats.coverage.specifications}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Verification</span>
                        <span className="text-sm">{traceabilityReport.stats.coverage.verification}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-200 rounded-full">
                        <div 
                          className="h-2.5 bg-green-500 rounded-full" 
                          style={{ width: `${traceabilityReport.stats.coverage.verification}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Validation</span>
                        <span className="text-sm">{traceabilityReport.stats.coverage.validation}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-200 rounded-full">
                        <div 
                          className="h-2.5 bg-purple-500 rounded-full" 
                          style={{ width: `${traceabilityReport.stats.coverage.validation}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {complianceStatus.compliant ? (
                    <div className="flex flex-col items-center justify-center pt-2 pb-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mb-3" />
                      <p className="text-lg font-medium text-center">All compliance criteria satisfied</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-16 w-16 text-amber-500 mb-3" />
                      <p className="text-lg font-medium text-center">Issues detected</p>
                      <p className="text-sm text-center text-muted-foreground mt-1">
                        {complianceStatus.issues.length} compliance issues found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Related Tests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.requirements.map((req) => {
                  const relatedSpecs = matrix.specifications.filter(
                    spec => spec.relatedRequirements.includes(req.id)
                  );
                  const relatedVerTests = matrix.verificationTests.filter(test => 
                    relatedSpecs.some(spec => test.relatedSpecifications.includes(spec.id))
                  );
                  const relatedValTests = matrix.validationTests.filter(
                    test => test.relatedRequirements.includes(req.id)
                  );
                  
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.id}</TableCell>
                      <TableCell>{req.description}</TableCell>
                      <TableCell>{req.source}</TableCell>
                      <TableCell>{getBadgeForPriority(req.priority)}</TableCell>
                      <TableCell>{getBadgeForPriority(req.riskLevel)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="outline">
                            V: {relatedVerTests.length}
                          </Badge>
                          <Badge variant="outline">
                            V&V: {relatedValTests.length}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Expected Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.verificationTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.id}</TableCell>
                    <TableCell>{test.description}</TableCell>
                    <TableCell>{test.testType}</TableCell>
                    <TableCell>{test.expectedResult}</TableCell>
                    <TableCell>{getBadgeForStatus(test.status)}</TableCell>
                    <TableCell>{test.executedBy || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Related Requirements</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.validationTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.id}</TableCell>
                    <TableCell>{test.description}</TableCell>
                    <TableCell>{test.testType}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {test.relatedRequirements.map(reqId => (
                          <Badge key={reqId} variant="outline">
                            {reqId}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getBadgeForStatus(test.status)}</TableCell>
                    <TableCell>
                      {test.evidence && test.evidence.length > 0 ? (
                        <Button size="sm" variant="outline">
                          <FileCheck className="h-4 w-4 mr-1" />
                          {test.evidence.length}
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center mb-4">
                  <div>
                    {complianceStatus.compliant ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                  <div className="text-lg font-medium">
                    {complianceStatus.compliant 
                      ? 'IOVV Matrix is compliant with regulatory requirements' 
                      : 'IOVV Matrix has compliance issues'
                    }
                  </div>
                </div>

                {!complianceStatus.compliant && (
                  <div className="mt-4">
                    <h3 className="text-base font-medium mb-2">Issues Found:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {complianceStatus.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-red-600">{issue}</li>
                      ))}
                    </ul>

                    <h3 className="text-base font-medium mt-4 mb-2">Recommendations:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {complianceStatus.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regulatory Mapping</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-medium mb-3">ISO 13485:2016</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Clause</TableHead>
                            <TableHead>Coverage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>7.3.2 Design Planning</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>7.3.3 Design Inputs</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>7.3.4 Design Outputs</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>7.3.5 Design Review</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>7.3.6 Design Verification</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>7.3.7 Design Validation</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>IEC 62304 Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-medium mb-3">Software Life Cycle Processes</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Section</TableHead>
                            <TableHead>Coverage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>5.1 Software Development Planning</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>5.2 Software Requirements Analysis</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>5.3 Software Architectural Design</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>5.5 Software Unit Implementation and Verification</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>5.6 Software Integration and Testing</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>5.7 Software System Testing</TableCell>
                            <TableCell>
                              <CheckSquare className="text-green-500 h-5 w-5" />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IOVVMatrixPage;