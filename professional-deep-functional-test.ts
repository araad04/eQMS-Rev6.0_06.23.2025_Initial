
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from './server/index';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

interface TestProtocolRecord {
  testId: string;
  testName: string;
  ursRequirement: string;
  executionTime: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  evidence: string[];
  issues: string[];
  hotfixes: string[];
}

class ProfessionalTestExecutor {
  private app: any;
  private testProtocol: TestProtocolRecord[] = [];
  private baseUrl = 'http://localhost:5000';

  constructor() {
    this.initializeTestEnvironment();
  }

  private async initializeTestEnvironment() {
    process.env.NODE_ENV = 'test';
    this.app = createApp();
  }

  private recordTest(record: TestProtocolRecord) {
    this.testProtocol.push(record);
    console.log(`📋 Test Protocol: ${record.testId} - ${record.status}`);
  }

  private async generateTestReport() {
    const report = {
      executionDate: new Date().toISOString(),
      totalTests: this.testProtocol.length,
      passed: this.testProtocol.filter(t => t.status === 'PASS').length,
      failed: this.testProtocol.filter(t => t.status === 'FAIL').length,
      warnings: this.testProtocol.filter(t => t.status === 'WARNING').length,
      tests: this.testProtocol
    };

    const reportPath = `test-reports/professional-functional-test-${Date.now()}.json`;
    if (!fs.existsSync('test-reports')) {
      fs.mkdirSync('test-reports', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const mdReport = this.generateMarkdownReport(report);
    fs.writeFileSync(reportPath.replace('.json', '.md'), mdReport);
    
    return report;
  }

  private generateMarkdownReport(report: any): string {
    return `
# Professional eQMS Functional Test Report

**Execution Date:** ${report.executionDate}
**Total Tests:** ${report.totalTests}
**Passed:** ${report.passed}
**Failed:** ${report.failed}
**Warnings:** ${report.warnings}

## Test Results Summary

| Test ID | Test Name | URS Requirement | Status | Issues | Hot Fixes |
|---------|-----------|----------------|--------|--------|-----------|
${report.tests.map((t: TestProtocolRecord) => 
  `| ${t.testId} | ${t.testName} | ${t.ursRequirement} | ${t.status} | ${t.issues.length} | ${t.hotfixes.length} |`
).join('\n')}

## Detailed Test Results

${report.tests.map((t: TestProtocolRecord) => `
### ${t.testId}: ${t.testName}

**URS Requirement:** ${t.ursRequirement}
**Status:** ${t.status}
**Execution Time:** ${t.executionTime}

**Evidence:**
${t.evidence.map(e => `- ${e}`).join('\n')}

**Issues Found:**
${t.issues.map(i => `- ${i}`).join('\n')}

**Hot Fixes Applied:**
${t.hotfixes.map(h => `- ${h}`).join('\n')}

---
`).join('\n')}
`;
  }

  // Authentication Module Tests (URS AUTH-001 to AUTH-007)
  async testAuthenticationModule() {
    const testRecord: TestProtocolRecord = {
      testId: 'FT-AUTH-001',
      testName: 'User Authentication System',
      ursRequirement: 'AUTH-001: System shall require user authentication with username and password',
      executionTime: new Date().toISOString(),
      status: 'PASS',
      evidence: [],
      issues: [],
      hotfixes: []
    };

    try {
      // Test valid login
      const loginResponse = await request(this.app)
        .post('/api/auth/login')
        .send({
          username: 'biomedical78',
          password: 'testpass123'
        });

      if (loginResponse.status === 200) {
        testRecord.evidence.push('Valid login accepted with 200 status');
        testRecord.evidence.push(`Token received: ${loginResponse.body.token ? 'Yes' : 'No'}`);
      } else {
        testRecord.issues.push(`Login failed with status: ${loginResponse.status}`);
        testRecord.status = 'FAIL';
      }

      // Test invalid login
      const invalidLoginResponse = await request(this.app)
        .post('/api/auth/login')
        .send({
          username: 'invalid',
          password: 'wrong'
        });

      if (invalidLoginResponse.status === 401) {
        testRecord.evidence.push('Invalid login properly rejected with 401 status');
      } else {
        testRecord.issues.push(`Invalid login should return 401, got: ${invalidLoginResponse.status}`);
        testRecord.status = 'WARNING';
      }

    } catch (error) {
      testRecord.issues.push(`Authentication test failed: ${error}`);
      testRecord.status = 'FAIL';
    }

    this.recordTest(testRecord);
  }

  // Document Control Module Tests (URS DOC-001 to DOC-015)
  async testDocumentControlModule() {
    const testRecord: TestProtocolRecord = {
      testId: 'FT-DOC-001',
      testName: 'Document Control System',
      ursRequirement: 'DOC-001: System shall support creation, review, approval, and distribution of documents',
      executionTime: new Date().toISOString(),
      status: 'PASS',
      evidence: [],
      issues: [],
      hotfixes: []
    };

    try {
      // Test document creation
      const createResponse = await request(this.app)
        .post('/api/documents')
        .set('X-Auth-Local', 'true')
        .send({
          title: 'Test Document',
          documentType: 'procedure',
          content: 'Test content for functional testing',
          department: 'Quality'
        });

      if (createResponse.status === 201) {
        testRecord.evidence.push('Document creation successful');
        const documentId = createResponse.body.data?.id;
        
        if (documentId) {
          // Test document retrieval
          const getResponse = await request(this.app)
            .get(`/api/documents/${documentId}`)
            .set('X-Auth-Local', 'true');

          if (getResponse.status === 200) {
            testRecord.evidence.push('Document retrieval successful');
            testRecord.evidence.push(`Document has required fields: ${JSON.stringify(Object.keys(getResponse.body.data))}`);
          } else {
            testRecord.issues.push(`Document retrieval failed: ${getResponse.status}`);
            testRecord.status = 'WARNING';
          }
        }
      } else {
        testRecord.issues.push(`Document creation failed: ${createResponse.status}`);
        testRecord.status = 'FAIL';
      }

      // Test document listing
      const listResponse = await request(this.app)
        .get('/api/documents')
        .set('X-Auth-Local', 'true');

      if (listResponse.status === 200) {
        testRecord.evidence.push('Document listing successful');
        testRecord.evidence.push(`Documents found: ${listResponse.body.data?.length || 0}`);
      } else {
        testRecord.issues.push(`Document listing failed: ${listResponse.status}`);
        testRecord.status = 'WARNING';
      }

    } catch (error) {
      testRecord.issues.push(`Document control test failed: ${error}`);
      testRecord.status = 'FAIL';
    }

    this.recordTest(testRecord);
  }

  // CAPA Management Module Tests (URS CAPA-001 to CAPA-015)
  async testCAPAModule() {
    const testRecord: TestProtocolRecord = {
      testId: 'FT-CAPA-001',
      testName: 'CAPA Management System',
      ursRequirement: 'CAPA-001: System shall support creation, investigation, implementation, and closure of CAPA records',
      executionTime: new Date().toISOString(),
      status: 'PASS',
      evidence: [],
      issues: [],
      hotfixes: []
    };

    try {
      // Test CAPA creation
      const capaData = {
        title: 'Test CAPA for Functional Testing',
        description: 'Functional test CAPA record',
        source: 'customer',
        category: 'corrective',
        priority: 'medium',
        assignedTo: 1,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const createResponse = await request(this.app)
        .post('/api/capa')
        .set('X-Auth-Local', 'true')
        .send(capaData);

      if (createResponse.status === 201) {
        testRecord.evidence.push('CAPA creation successful');
        const capaId = createResponse.body.data?.id;
        
        if (capaId) {
          // Test CAPA workflow progression
          const updateResponse = await request(this.app)
            .put(`/api/capa/${capaId}`)
            .set('X-Auth-Local', 'true')
            .send({
              ...capaData,
              status: 'investigation'
            });

          if (updateResponse.status === 200) {
            testRecord.evidence.push('CAPA workflow progression successful');
          } else {
            testRecord.issues.push(`CAPA workflow update failed: ${updateResponse.status}`);
            testRecord.status = 'WARNING';
          }
        }
      } else {
        testRecord.issues.push(`CAPA creation failed: ${createResponse.status}`);
        testRecord.status = 'FAIL';
      }

      // Test CAPA listing
      const listResponse = await request(this.app)
        .get('/api/capa')
        .set('X-Auth-Local', 'true');

      if (listResponse.status === 200) {
        testRecord.evidence.push('CAPA listing successful');
        testRecord.evidence.push(`CAPAs found: ${listResponse.body.data?.length || 0}`);
      } else {
        testRecord.issues.push(`CAPA listing failed: ${listResponse.status}`);
        testRecord.status = 'WARNING';
      }

    } catch (error) {
      testRecord.issues.push(`CAPA test failed: ${error}`);
      testRecord.status = 'FAIL';
    }

    this.recordTest(testRecord);
  }

  // Management Review Module Tests (URS MGR-001 to MGR-014)
  async testManagementReviewModule() {
    const testRecord: TestProtocolRecord = {
      testId: 'FT-MGR-001',
      testName: 'Management Review System',
      ursRequirement: 'MGR-001: System shall support creation and management of management review meetings',
      executionTime: new Date().toISOString(),
      status: 'PASS',
      evidence: [],
      issues: [],
      hotfixes: []
    };

    try {
      // Test management review creation
      const reviewData = {
        title: 'Q1 2025 Management Review Test',
        reviewDate: new Date().toISOString(),
        reviewType: 'quarterly',
        participants: ['John Doe', 'Jane Smith'],
        agenda: 'Functional testing agenda'
      };

      const createResponse = await request(this.app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(reviewData);

      if (createResponse.status === 201) {
        testRecord.evidence.push('Management review creation successful');
        const reviewId = createResponse.body.data?.id;
        
        if (reviewId) {
          // Test review input addition
          const inputResponse = await request(this.app)
            .post(`/api/management-reviews/${reviewId}/inputs`)
            .set('X-Auth-Local', 'true')
            .send({
              category: 'customer_feedback',
              inputData: 'Test input data for functional testing'
            });

          if (inputResponse.status === 201) {
            testRecord.evidence.push('Management review input addition successful');
          } else {
            testRecord.issues.push(`Management review input failed: ${inputResponse.status}`);
            testRecord.status = 'WARNING';
          }
        }
      } else {
        testRecord.issues.push(`Management review creation failed: ${createResponse.status}`);
        testRecord.status = 'FAIL';
      }

    } catch (error) {
      testRecord.issues.push(`Management review test failed: ${error}`);
      testRecord.status = 'FAIL';
    }

    this.recordTest(testRecord);
  }

  // Supplier Management Module Tests (URS SUP-001 to SUP-015)
  async testSupplierManagementModule() {
    const testRecord: TestProtocolRecord = {
      testId: 'FT-SUP-001',
      testName: 'Supplier Management System',
      ursRequirement: 'SUP-001: System shall support creation and management of supplier records',
      executionTime: new Date().toISOString(),
      status: 'PASS',
      evidence: [],
      issues: [],
      hotfixes: []
    };

    try {
      // Test supplier creation
      const supplierData = {
        name: 'Test Supplier Ltd',
        contactEmail: 'test@supplier.com',
        address: '123 Test Street',
        supplierType: 'manufacturing',
        criticalityLevel: 'medium',
        status: 'active'
      };

      const createResponse = await request(this.app)
        .post('/api/suppliers')
        .set('X-Auth-Local', 'true')
        .send(supplierData);

      if (createResponse.status === 201) {
        testRecord.evidence.push('Supplier creation successful');
        const supplierId = createResponse.body.data?.id;
        
        if (supplierId) {
          // Test supplier assessment
          const assessmentResponse = await request(this.app)
            .post(`/api/suppliers/${supplierId}/assessments`)
            .set('X-Auth-Local', 'true')
            .send({
              assessmentType: 'initial',
              score: 85,
              assessmentDate: new Date().toISOString(),
              findings: 'Test assessment findings'
            });

          if (assessmentResponse.status === 201) {
            testRecord.evidence.push('Supplier assessment creation successful');
          } else {
            testRecord.issues.push(`Supplier assessment failed: ${assessmentResponse.status}`);
            testRecord.status = 'WARNING';
          }
        }
      } else {
        testRecord.issues.push(`Supplier creation failed: ${createResponse.status}`);
        testRecord.status = 'FAIL';
      }

    } catch (error) {
      testRecord.issues.push(`Supplier management test failed: ${error}`);
      testRecord.status = 'FAIL';
    }

    this.recordTest(testRecord);
  }

  // Performance Requirements Tests (URS PERF-001 to PERF-005)
  async testPerformanceRequirements() {
    const testRecord: TestProtocolRecord = {
      testId: 'FT-PERF-001',
      testName: 'System Performance Validation',
      ursRequirement: 'PERF-002: System shall respond to user interactions within 2 seconds under normal load',
      executionTime: new Date().toISOString(),
      status: 'PASS',
      evidence: [],
      issues: [],
      hotfixes: []
    };

    try {
      const startTime = Date.now();
      
      const response = await request(this.app)
        .get('/api/dashboard')
        .set('X-Auth-Local', 'true');

      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        testRecord.evidence.push(`Dashboard loaded successfully in ${responseTime}ms`);
        
        if (responseTime < 2000) {
          testRecord.evidence.push('Performance requirement met (< 2 seconds)');
        } else {
          testRecord.issues.push(`Performance requirement not met: ${responseTime}ms > 2000ms`);
          testRecord.status = 'WARNING';
        }
      } else {
        testRecord.issues.push(`Dashboard load failed: ${response.status}`);
        testRecord.status = 'FAIL';
      }

    } catch (error) {
      testRecord.issues.push(`Performance test failed: ${error}`);
      testRecord.status = 'FAIL';
    }

    this.recordTest(testRecord);
  }

  // Security Requirements Tests (URS SEC-001 to SEC-010)
  async testSecurityRequirements() {
    const testRecord: TestProtocolRecord = {
      testId: 'FT-SEC-001',
      testName: 'Security Controls Validation',
      ursRequirement: 'SEC-006: System shall maintain a comprehensive audit trail of all system activities',
      executionTime: new Date().toISOString(),
      status: 'PASS',
      evidence: [],
      issues: [],
      hotfixes: []
    };

    try {
      // Test audit trail generation
      const testAction = await request(this.app)
        .get('/api/documents')
        .set('X-Auth-Local', 'true');

      if (testAction.status === 200) {
        testRecord.evidence.push('Test action executed successfully');
        
        // Check audit trail
        const auditResponse = await request(this.app)
          .get('/api/audit-trail')
          .set('X-Auth-Local', 'true');

        if (auditResponse.status === 200) {
          testRecord.evidence.push('Audit trail accessible');
          testRecord.evidence.push(`Audit entries found: ${auditResponse.body.data?.length || 0}`);
        } else {
          testRecord.issues.push(`Audit trail not accessible: ${auditResponse.status}`);
          testRecord.status = 'WARNING';
        }
      } else {
        testRecord.issues.push(`Test action failed: ${testAction.status}`);
        testRecord.status = 'FAIL';
      }

    } catch (error) {
      testRecord.issues.push(`Security test failed: ${error}`);
      testRecord.status = 'FAIL';
    }

    this.recordTest(testRecord);
  }

  // Execute all tests
  async executeAllTests() {
    console.log('🚀 Starting Professional eQMS Functional Testing Protocol');
    console.log('📋 Testing against URS requirements...\n');

    await this.testAuthenticationModule();
    await this.testDocumentControlModule();
    await this.testCAPAModule();
    await this.testManagementReviewModule();
    await this.testSupplierManagementModule();
    await this.testPerformanceRequirements();
    await this.testSecurityRequirements();

    const report = await this.generateTestReport();
    
    console.log('\n✅ Professional Functional Testing Complete');
    console.log(`📊 Results: ${report.passed} PASSED, ${report.failed} FAILED, ${report.warnings} WARNINGS`);
    
    return report;
  }
}

// Main test execution
describe('Professional eQMS Functional Deep Test Suite', () => {
  let executor: ProfessionalTestExecutor;

  beforeAll(async () => {
    executor = new ProfessionalTestExecutor();
  });

  test('Execute comprehensive URS-based functional testing', async () => {
    const report = await executor.executeAllTests();
    
    // Ensure minimum pass rate
    const passRate = (report.passed / report.totalTests) * 100;
    expect(passRate).toBeGreaterThanOrEqual(80);
    
    // Log test results
    console.log(`\n📋 Professional Test Protocol Complete`);
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
    
    if (report.failed > 0) {
      console.log(`⚠️  ${report.failed} critical issues require hot fixes`);
    }
  }, 300000); // 5-minute timeout for comprehensive testing
});
