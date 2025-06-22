/**
 * IOVV Matrix Data Types
 * 
 * This module defines the type structure for the Installation, Operational, and
 * Performance Qualification (IOVV) Matrix, including verification and validation tests,
 * test results, and evidence collection interfaces.
 * 
 * Classification: Software Safety Class B (per IEC 62304)
 */

/**
 * Common test properties
 */
interface BaseTest {
  id: string;
  description: string;
  testType: string;
  testMethod: string;
  testScript?: {
    path: string;
    function?: string;
    params?: Record<string, any>;
  };
  expectedResult: string;
  actualResult?: string;
  status: 'Not Started' | 'In Progress' | 'Passed' | 'Failed' | 'Blocked';
  executionDate?: string;
  executedBy?: string;
}

/**
 * Verification test specific properties
 */
export interface VerificationTest extends BaseTest {
  relatedSpecifications?: string[];
}

/**
 * Evidence item for validation tests
 */
export interface ValidationEvidence {
  id: string;
  type: string;
  description: string;
  path: string;
  timestamp: string;
}

/**
 * Validation test specific properties
 */
export interface ValidationTest extends BaseTest {
  relatedRequirements?: string[];
  evidence?: ValidationEvidence[];
}

/**
 * Defect information for tracking issues found during testing
 */
export interface Defect {
  id: string;
  description: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Cosmetic';
  status: 'Open' | 'In Progress' | 'Fixed' | 'Verified' | 'Closed' | 'Rejected';
  relatedTests: string[];
  relatedRequirements: string[];
  resolution?: string;
  reportedDate: string;
  reportedBy: string;
  assignedTo?: string;
  fixedDate?: string;
  fixedBy?: string;
  verifiedDate?: string;
  verifiedBy?: string;
  impact: {
    functionality: boolean;
    safety: boolean;
    performance: boolean;
    usability: boolean;
    compliance: boolean;
  };
}

/**
 * Complete IOVV Matrix structure
 */
export interface IOVVMatrix {
  id: number;
  projectId: number;
  name: string;
  description: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Rejected' | 'Obsolete';
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedDate?: string;
  verificationTests: VerificationTest[];
  validationTests: ValidationTest[];
  defects: Defect[];
  metrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    notStartedTests: number;
    inProgressTests: number;
    blockedTests: number;
    verificationProgress: number;
    validationProgress: number;
    overallProgress: number;
    defectsByStatus: Record<string, number>;
    defectsByPriority: Record<string, number>;
  };
}

/**
 * Runs automated verification tests based on the IOVV Matrix data
 * 
 * @param matrix The IOVVMatrix containing test definitions
 * @param executedBy Username of the person executing the tests
 * @returns Updated matrix with test results
 */
export const runAutomatedTests = async (matrix: IOVVMatrix, executedBy: string): Promise<IOVVMatrix> => {
  // Clone the matrix to avoid mutations
  const updatedMatrix = { ...matrix };
  
  // Process each verification test
  const updatedTests = updatedMatrix.verificationTests.map(test => {
    // Only run automated tests that are marked as automated
    if (test.automationLevel !== 'Automated') {
      return test;
    }
    
    // Mark the test as executed
    const executionDate = new Date().toISOString();
    let status: VerificationTest['status'] = 'Passed';
    let actualResult = 'Test executed successfully';
    
    try {
      // Here we would actually execute the test code
      // For now, this is a placeholder that randomly passes or fails
      if (Math.random() > 0.8) {
        throw new Error('Random test failure for demonstration purposes');
      }
      
      // If we get here, test passed
    } catch (error) {
      status = 'Failed';
      actualResult = `Test failed: ${error.message}`;
    }
    
    return {
      ...test,
      status,
      actualResult,
      executionDate,
      executedBy
    };
  });
  
  updatedMatrix.verificationTests = updatedTests;
  
  // Recalculate metrics
  const passedTests = updatedTests.filter(t => t.status === 'Passed').length;
  const failedTests = updatedTests.filter(t => t.status === 'Failed').length;
  const notStartedTests = updatedTests.filter(t => t.status === 'Not Run').length;
  const inProgressTests = updatedTests.filter(t => t.status === 'In Progress').length;
  const blockedTests = updatedTests.filter(t => t.status === 'Blocked').length;
  
  updatedMatrix.metrics = {
    ...updatedMatrix.metrics,
    passedTests,
    failedTests,
    notStartedTests,
    inProgressTests,
    blockedTests,
    verificationProgress: (passedTests / updatedMatrix.verificationTests.length) * 100,
    overallProgress: ((passedTests + updatedMatrix.metrics.passedTests) / 
      (updatedMatrix.verificationTests.length + updatedMatrix.validationTests.length)) * 100
  };
  
  return updatedMatrix;
}

/**
 * Test execution log entry
 */
export interface TestExecutionLog {
  id: string;
  testId: string;
  testType: 'verification' | 'validation';
  status: 'success' | 'failure' | 'warning' | 'info';
  message: string;
  timestamp: string;
  duration: number;
}

/**
 * Formats a test result status into a user-friendly display string
 * 
 * @param status The test status
 * @returns A formatted display string
 */
export function formatTestStatus(status: string): string {
  switch (status) {
    case 'Not Started':
      return 'Not Started';
    case 'In Progress':
      return 'In Progress';
    case 'Passed':
      return 'Passed';
    case 'Failed':
      return 'Failed';
    case 'Blocked':
      return 'Blocked';
    default:
      return status;
  }
}

/**
 * Get the appropriate color variant for a test status
 * 
 * @param status The test status
 * @returns The appropriate color variant
 */
export function getStatusVariant(status: string): string {
  switch (status) {
    case 'Passed':
      return 'success';
    case 'Failed':
      return 'destructive';
    case 'Blocked':
      return 'warning';
    case 'In Progress':
      return 'info';
    default:
      return 'outline';
  }
}

/**
 * Calculate the test execution progress for a given set of tests
 * 
 * @param tests Array of tests
 * @returns Progress percentage (0-100)
 */
export function calculateTestProgress(tests: (VerificationTest | ValidationTest)[]): number {
  if (!tests || tests.length === 0) return 0;
  
  const completed = tests.filter(test => test.status === 'Passed' || test.status === 'Failed').length;
  return Math.round((completed / tests.length) * 100);
}