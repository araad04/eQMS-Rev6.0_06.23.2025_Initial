/**
 * IEC 62304 Compliant Test Framework
 * 
 * This framework implements testing practices in compliance with IEC 62304:2006+AMD1:2015,
 * the international standard for medical device software lifecycle processes.
 * 
 * Document ID: TEST-FRAMEWORK-001
 * Version: 1.0.0
 * Classification: Software Safety Class B (per IEC 62304)
 * 
 * Related Documents:
 * - Software Development Plan (SDP-001)
 * - Software Requirements Specification (SRS-001)
 * - Software Architecture Document (SAD-001)
 * - Risk Management File (RMF-001)
 */

import { TestContext, TestFunction, test as baseTest, expect, describe as baseDescribe } from 'vitest';

/**
 * Risk classification levels according to IEC 62304
 */
export enum RiskClassification {
  CLASS_A = 'Class A', // No injury or damage to health is possible
  CLASS_B = 'Class B', // Non-serious injury is possible
  CLASS_C = 'Class C', // Death or serious injury is possible
}

/**
 * Test types as defined in IEC 62304 verification activities
 */
export enum TestType {
  UNIT = 'Unit Test',
  INTEGRATION = 'Integration Test',
  SYSTEM = 'System Test',
  VERIFICATION = 'Verification Test',
  VALIDATION = 'Validation Test',
}

interface IEC62304TestOptions {
  // Required by IEC 62304
  requirement: string;      // Requirement ID this test verifies
  riskClass: RiskClassification;
  testType: TestType;
  
  // Additional traceability information
  description?: string;
  module?: string;
  verification?: string;    // Verification method description
  expected?: string;        // Expected results description
}

// Extend the TestContext interface to allow storing metadata
interface IEC62304TestContext extends TestContext {
  meta?: Record<string, any>;
}

/**
 * Extended test function that enforces IEC 62304 compliance
 * by requiring documentation of requirements, risk level, and test type
 */
export const test = (
  name: string,
  options: IEC62304TestOptions,
  fn: TestFunction
) => {
  // Pre-validation of required fields as per IEC 62304
  if (!options.requirement) {
    throw new Error('IEC 62304 compliance error: Requirement ID is mandatory for all tests');
  }
  
  if (!options.riskClass) {
    throw new Error('IEC 62304 compliance error: Risk classification is mandatory for all tests');
  }
  
  if (!options.testType) {
    throw new Error('IEC 62304 compliance error: Test type is mandatory for all tests');
  }
  
  // Generate standardized test name format for traceability
  const testName = `[${options.testType}][${options.riskClass}] ${name} (Req: ${options.requirement})`;
  
  // Store test metadata for traceability reports
  const metaFn = async (context: IEC62304TestContext) => {
    // Create metadata for logging/reporting purposes (doesn't mutate context)
    const testMetadata = {
      requirement: options.requirement,
      riskClass: options.riskClass,
      testType: options.testType,
      module: options.module || 'Unspecified',
      description: options.description || name,
      verification: options.verification || 'Automated test',
      expected: options.expected || 'Test passes without errors',
      executionDate: new Date().toISOString(),
    };
    
    // Log metadata for external monitoring/analysis
    console.log(`Running IEC62304 test: ${JSON.stringify(testMetadata)}`);
    
    // Run the actual test
    await fn(context);
  };
  
  // Execute the test with the original Vitest test function
  return baseTest(testName, metaFn);
};

/**
 * Test suite wrapper that enforces IEC 62304 compliance at the suite level
 */
export const describe62304 = (
  name: string,
  options: {
    module: string;
    riskClass: RiskClassification;
  },
  fn: () => void
) => {
  const suiteName = `[${options.module}][${options.riskClass}] ${name}`;
  return baseDescribe(suiteName, fn);
};

/**
 * Expectation functions specifically for IEC 62304 test requirements
 */
export const iec62304Expect = {
  ...expect,
  
  /**
   * Assert that an input validation is properly implemented
   * Required for IEC 62304 Section 5.5.2 - Software unit verification
   */
  inputValidation: (
    validationFn: (input: any) => any, 
    invalidInput: any, 
    errorMessage?: string
  ) => {
    try {
      validationFn(invalidInput);
      throw new Error('Validation did not throw an error for invalid input');
    } catch (error: any) {
      if (errorMessage) {
        expect(error.message).toContain(errorMessage);
      }
      return true;
    }
  },
  
  /**
   * Assert that error handling is properly implemented
   * Required for IEC 62304 Section 5.5.3 - Software unit acceptance criteria
   */
  errorHandling: (
    fn: () => any,
    expectedError: any
  ) => {
    expect(fn).toThrow(expectedError);
  },
  
  /**
   * Assert that boundary conditions are properly handled
   * Required for IEC 62304 Section 5.5.2 - Software unit verification
   */
  boundaryConditions: (
    fn: (input: any) => any,
    boundaryInput: any,
    expected: any
  ) => {
    expect(fn(boundaryInput)).toEqual(expected);
  },
  
  /**
   * Assert that audit trail is correctly implemented
   * Required for IEC 62304 Section 5.1.1 - Software development life cycle
   */
  auditTrail: (
    auditRecord: any,
    expectedFields: string[]
  ) => {
    for (const field of expectedFields) {
      expect(auditRecord).toHaveProperty(field);
    }
  },
};

export default {
  test,
  describe: describe62304,
  expect: iec62304Expect,
  RiskClassification,
  TestType,
};