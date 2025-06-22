/**
 * IOVV Matrix API Connection Utilities
 * 
 * This module provides integration between the IOVV Matrix front-end components
 * and the server-side API for test execution and evidence collection.
 * 
 * Classification: Software Safety Class B (per IEC 62304)
 */

import { TestResult } from './test-runner';
import { Evidence } from './evidence-collector';
import { VerificationTest, ValidationTest } from './iovv-matrix';
import { apiRequest, queryClient } from '@/lib/queryClient';

/**
 * Registers a test result with the server
 * 
 * @param testType The type of test (verification or validation)
 * @param testId The ID of the test
 * @param result The test result to register
 * @returns Promise resolving to the updated test
 */
export async function registerTestResult(
  testType: 'verification' | 'validation',
  testId: string,
  result: TestResult
): Promise<VerificationTest | ValidationTest> {
  const response = await apiRequest(
    'POST',
    `/api/design-control/${testType}-tests/${testId}/results`,
    {
      status: result.success ? 'Passed' : 'Failed',
      actualResult: result.message,
      executionDate: result.timestamp,
      executedBy: 'system', // This would normally be the current user
      duration: result.duration,
    }
  );

  // Invalidate the cache for this test
  queryClient.invalidateQueries({
    queryKey: [`/api/design-control/${testType}-tests/${testId}`],
  });

  return await response.json();
}

/**
 * Registers validation evidence with the server
 * 
 * @param testId The ID of the validation test
 * @param evidence The evidence to register
 * @returns Promise resolving to the uploaded evidence details
 */
export async function registerEvidence(
  testId: string,
  evidence: Evidence
): Promise<{ id: string; path: string }> {
  // If evidence has content, upload it as form data
  if (evidence.content) {
    const formData = new FormData();
    formData.append('file', evidence.content, evidence.filename);
    formData.append('type', evidence.type);
    formData.append('description', evidence.description);
    formData.append('testId', testId);

    const response = await fetch(`/api/design-control/validation-tests/${testId}/evidence`, {
      method: 'POST',
      body: formData,
    });

    // Invalidate the cache for this test
    queryClient.invalidateQueries({
      queryKey: [`/api/design-control/validation-tests/${testId}`],
    });

    return await response.json();
  }

  // If no content, just register the metadata
  const response = await apiRequest(
    'POST',
    `/api/design-control/validation-tests/${testId}/evidence-metadata`,
    {
      type: evidence.type,
      description: evidence.description,
      path: evidence.filename,
    }
  );

  // Invalidate the cache for this test
  queryClient.invalidateQueries({
    queryKey: [`/api/design-control/validation-tests/${testId}`],
  });

  return await response.json();
}

/**
 * Logs a test execution event
 * 
 * @param testId The ID of the test
 * @param testType The type of test
 * @param status The execution status
 * @param message The execution message
 * @param duration The execution duration in milliseconds
 * @returns Promise resolving to the created log entry
 */
export async function logTestExecution(
  testId: string,
  testType: 'verification' | 'validation',
  status: 'success' | 'failure' | 'warning' | 'info',
  message: string,
  duration: number
): Promise<any> {
  const response = await apiRequest(
    'POST',
    `/api/design-control/test-execution-logs`,
    {
      testId,
      testType,
      status,
      message,
      startTime: new Date(Date.now() - duration).toISOString(),
      endTime: new Date().toISOString(),
      duration,
    }
  );

  return await response.json();
}

/**
 * Fetches test data from the server
 * 
 * @param testType The type of test (verification or validation)
 * @param testId The ID of the test
 * @returns Promise resolving to the test data
 */
export async function fetchTestData(
  testType: 'verification' | 'validation',
  testId: string
): Promise<VerificationTest | ValidationTest> {
  const response = await apiRequest(
    'GET',
    `/api/design-control/${testType}-tests/${testId}`
  );

  return await response.json();
}

/**
 * Creates a new defect based on test failure
 * 
 * @param matrixId The ID of the IOVV matrix
 * @param testType The type of test (verification or validation)
 * @param testId The ID of the test
 * @param error The error details
 * @returns Promise resolving to the created defect
 */
export async function createDefectFromTestFailure(
  matrixId: number,
  testType: 'verification' | 'validation',
  testId: string,
  error: Error | string
): Promise<any> {
  const test = await fetchTestData(testType, testId);
  
  const defectData = {
    matrixId,
    description: `Test failure: ${typeof error === 'string' ? error : error.message}`,
    severity: 'Major',
    status: 'Open',
    relatedTests: [testId],
    relatedRequirements: testType === 'validation' 
      ? (test as ValidationTest).relatedRequirements 
      : [],
    reportedDate: new Date().toISOString(),
    reportedBy: 'system', // This would normally be the current user
    impact: {
      functionality: true,
      safety: false,
      performance: false,
      usability: false,
      compliance: true,
    },
  };

  const response = await apiRequest(
    'POST',
    `/api/design-control/defects`,
    defectData
  );

  // Invalidate the cache for the matrix
  queryClient.invalidateQueries({
    queryKey: [`/api/design-control/matrices/${matrixId}`],
  });

  return await response.json();
}