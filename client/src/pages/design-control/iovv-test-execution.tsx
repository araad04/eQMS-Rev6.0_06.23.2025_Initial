import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { 
  VerificationTest, 
  ValidationTest 
} from '@/utils/iovv-matrix';
import { runVerificationTest, TestResult } from '@/utils/test-runner';
import { 
  captureScreenshot, 
  collectAndUploadEvidence, 
  generatePDFDocument 
} from '@/utils/evidence-collector';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, FileCheck, FilePlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function IOVVTestExecutionPage() {
  const [, setLocation] = useLocation();
  const { id, type } = useParams<{ id: string; type: string }>();
  const [activeTab, setActiveTab] = useState('details');
  const [executing, setExecuting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [collectingEvidence, setCollectingEvidence] = useState(false);

  // Determine which test type we're dealing with
  const isVerification = type === 'verification';
  const isValidation = type === 'validation';

  // Query for test data
  const { data: test, isLoading } = useQuery({
    queryKey: [`/api/design-control/${type}-tests/${id}`],
    enabled: !!id && (isVerification || isValidation),
  });

  // Mutation for updating test results
  const updateTestMutation = useMutation({
    mutationFn: async (result: TestResult) => {
      const response = await apiRequest(
        'PATCH',
        `/api/design-control/${type}-tests/${id}/results`,
        {
          status: result.success ? 'Passed' : 'Failed',
          actualResult: result.message,
          executionDate: result.timestamp,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate test data query to refresh the view
      queryClient.invalidateQueries({
        queryKey: [`/api/design-control/${type}-tests/${id}`],
      });
      toast({
        title: 'Test results updated',
        description: 'The test results have been recorded in the system.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update test results',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handler for executing verification tests
  const handleExecuteVerificationTest = async () => {
    if (!test || !isVerification) return;
    
    setExecuting(true);
    try {
      // Execute the test
      const result = await runVerificationTest(test as VerificationTest);
      setTestResult(result);
      
      // Update the test results in the database
      updateTestMutation.mutate(result);
    } catch (error: any) {
      toast({
        title: 'Test execution failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  // Handler for collecting evidence for validation tests
  const handleCollectEvidence = async () => {
    if (!test || !isValidation) return;
    
    setCollectingEvidence(true);
    try {
      // Get elements from the page to capture
      const testDetailsElement = document.getElementById('test-details-card');
      const testResultsElement = document.getElementById('test-results-section');
      
      if (!testDetailsElement) {
        throw new Error('Could not find test details element to capture');
      }
      
      // Collect evidence
      const evidence = await collectAndUploadEvidence(
        test as ValidationTest,
        {
          'Test Details': testDetailsElement,
          ...(testResultsElement ? { 'Test Results': testResultsElement } : {}),
        },
        {
          'Test Execution Log': JSON.stringify(testResult || {}, null, 2),
        },
        {
          'Test Report': {
            title: `Test Report - ${test.id}`,
            content: `
              <h1>Validation Test Report</h1>
              <p><strong>Test ID:</strong> ${test.id}</p>
              <p><strong>Description:</strong> ${test.description}</p>
              <p><strong>Test Type:</strong> ${test.testType}</p>
              <p><strong>Test Method:</strong> ${test.testMethod}</p>
              <p><strong>Expected Result:</strong> ${test.expectedResult}</p>
              <p><strong>Actual Result:</strong> ${test.actualResult || 'Not executed'}</p>
              <p><strong>Status:</strong> ${test.status}</p>
              <p><strong>Execution Date:</strong> ${test.executionDate || 'Not executed'}</p>
              <p><strong>Executed By:</strong> ${test.executedBy || 'Not executed'}</p>
            `,
          },
        }
      );
      
      toast({
        title: 'Evidence collected',
        description: `${evidence.length} items of evidence have been collected and uploaded.`,
      });
      
      // Refresh the test data
      queryClient.invalidateQueries({
        queryKey: [`/api/design-control/${type}-tests/${id}`],
      });
    } catch (error: any) {
      toast({
        title: 'Evidence collection failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCollectingEvidence(false);
    }
  };

  // Handle manual test execution
  const handleManualTestExecution = (success: boolean) => {
    const result: TestResult = {
      testId: id,
      success,
      message: success ? 'Test passed manually' : 'Test failed manually',
      duration: 0,
      timestamp: new Date().toISOString(),
    };
    
    setTestResult(result);
    updateTestMutation.mutate(result);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-bold mb-4">Test Not Found</h2>
          <p className="text-gray-500 mb-4">The requested test could not be found.</p>
          <Button onClick={() => setLocation('/design-control/iovv-matrix')}>
            Back to IOVV Matrix
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={`${isVerification ? 'Verification' : 'Validation'} Test Execution`} 
        subtitle={`Test ID: ${test.id}`}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setLocation('/design-control/iovv-matrix')}
            >
              Back to Matrix
            </Button>
            {isVerification && (
              <Button 
                onClick={handleExecuteVerificationTest} 
                disabled={executing}
              >
                {executing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Execute Test
                  </>
                )}
              </Button>
            )}
            {isValidation && (
              <Button 
                onClick={handleCollectEvidence} 
                disabled={collectingEvidence}
              >
                {collectingEvidence ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Collecting...
                  </>
                ) : (
                  <>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Collect Evidence
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Test Details</TabsTrigger>
          <TabsTrigger value="results">Results & Evidence</TabsTrigger>
          {isValidation && <TabsTrigger value="evidence">Evidence Collection</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="details">
          <Card id="test-details-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Test Details</span>
                <Badge variant={
                  test.status === 'Passed' ? 'success' :
                  test.status === 'Failed' ? 'destructive' :
                  test.status === 'Blocked' ? 'warning' : 'outline'
                }>
                  {test.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-gray-700">{test.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium text-gray-900">Test Type</h4>
                  <p className="text-gray-600">{test.testType}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Test Method</h4>
                  <p className="text-gray-600">{test.testMethod}</p>
                </div>
                
                {isVerification && (
                  <div>
                    <h4 className="font-medium text-gray-900">Related Specifications</h4>
                    <p className="text-gray-600">
                      {(test as VerificationTest).relatedSpecifications?.join(', ') || 'None'}
                    </p>
                  </div>
                )}
                
                {isValidation && (
                  <div>
                    <h4 className="font-medium text-gray-900">Related Requirements</h4>
                    <p className="text-gray-600">
                      {(test as ValidationTest).relatedRequirements?.join(', ') || 'None'}
                    </p>
                  </div>
                )}
                
                {test.testScript && (
                  <div>
                    <h4 className="font-medium text-gray-900">Test Script</h4>
                    <p className="text-gray-600">
                      {test.testScript.path}{test.testScript.function ? `#${test.testScript.function}` : ''}
                    </p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold">Expected Result</h3>
                <p className="text-gray-700">{test.expectedResult}</p>
              </div>
              
              {test.actualResult && (
                <div>
                  <h3 className="text-lg font-semibold">Actual Result</h3>
                  <p className="text-gray-700">{test.actualResult}</p>
                </div>
              )}
              
              {test.executionDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Execution Date</h4>
                    <p className="text-gray-600">
                      {new Date(test.executionDate).toLocaleString()}
                    </p>
                  </div>
                  {test.executedBy && (
                    <div>
                      <h4 className="font-medium text-gray-900">Executed By</h4>
                      <p className="text-gray-600">{test.executedBy}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card id="test-results-section">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testResult ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium">Status:</span>
                    {testResult.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span>Passed</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-1" />
                        <span>Failed</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-lg font-medium">Message:</span>
                    <p className="mt-1 text-gray-700">{testResult.message}</p>
                  </div>
                  
                  <div>
                    <span className="text-lg font-medium">Duration:</span>
                    <p className="mt-1 text-gray-700">{testResult.duration}ms</p>
                  </div>
                  
                  <div>
                    <span className="text-lg font-medium">Timestamp:</span>
                    <p className="mt-1 text-gray-700">
                      {new Date(testResult.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  {testResult.artifacts && testResult.artifacts.length > 0 && (
                    <div>
                      <span className="text-lg font-medium">Artifacts:</span>
                      <ul className="mt-1 list-disc list-inside">
                        {testResult.artifacts.map((artifact, index) => (
                          <li key={index} className="text-gray-700">{artifact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Test Results Yet</h3>
                  <p className="text-gray-500 mt-2">
                    {isVerification 
                      ? "Execute the test to see results here." 
                      : "Record manual test results below."}
                  </p>
                  
                  {isValidation && (
                    <div className="mt-6 flex justify-center gap-3">
                      <Button
                        onClick={() => handleManualTestExecution(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Pass
                      </Button>
                      <Button
                        onClick={() => handleManualTestExecution(false)}
                        variant="destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Fail
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {isValidation && (
          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Collection</CardTitle>
              </CardHeader>
              <CardContent>
                {test.evidence && test.evidence.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Collected Evidence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(test as ValidationTest).evidence?.map((item, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="font-medium">{item.type}</div>
                            <div className="text-sm text-gray-500 truncate">{item.path}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Evidence Collected</h3>
                    <p className="text-gray-500 mt-2">
                      Click "Collect Evidence" to gather and upload evidence for this validation test.
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">About Evidence Collection</h3>
                  <p className="text-gray-700">
                    Evidence collection captures screenshots, logs, and generates reports to document
                    the validation test execution. This evidence is critical for regulatory compliance
                    and demonstrating that the software meets user requirements.
                  </p>
                  <div className="mt-4 bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-blue-800">Evidence Types</h4>
                    <ul className="list-disc list-inside mt-2 text-blue-700">
                      <li>Screenshots of test execution</li>
                      <li>Test execution logs</li>
                      <li>Generated PDF reports</li>
                      <li>Other supporting documentation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}