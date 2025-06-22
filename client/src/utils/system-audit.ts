/**
 * System Audit Utility
 * 
 * Comprehensive framework for auditing the eQMS system:
 * - Security checks
 * - Compliance verification
 * - Performance monitoring
 * - Database health verification
 * - API testing
 * 
 * Used for regulatory compliance with:
 * - 21 CFR Part 11
 * - ISO 13485:2016
 * - IEC 62304:2006/AMD1:2015
 * - GDPR (where applicable)
 */

import { apiRequest } from "../lib/queryClient";

interface AuditResult {
  category: string;
  name: string;
  status: 'passed' | 'warning' | 'failed';
  description: string;
  details?: string;
  timestamp: string;
}

interface SystemAuditReport {
  auditId: string;
  executedBy: number;
  executedAt: string;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
    score: number; // 0-100 percentage
  };
  results: AuditResult[];
}

/**
 * Perform a complete system audit
 * @param userId - User ID performing the audit
 * @returns Promise resolving to the complete audit report
 */
export async function performSystemAudit(userId: number): Promise<SystemAuditReport> {
  const results: AuditResult[] = [];
  const timestamp = new Date().toISOString();
  const auditId = `AUD-${Date.now()}`;
  
  try {
    // Group 1: Security Checks
    await performSecurityChecks(results, timestamp);
    
    // Group 2: Compliance Verification
    await performComplianceChecks(results, timestamp);
    
    // Group 3: Performance Monitoring
    await performPerformanceChecks(results, timestamp);
    
    // Group 4: Database Health
    await performDatabaseChecks(results, timestamp);
    
    // Group 5: API Health Checks
    await performApiChecks(results, timestamp);
  } catch (error) {
    console.error("Error during system audit:", error);
    results.push({
      category: "System",
      name: "Audit Execution",
      status: "failed",
      description: "The system audit failed to complete",
      details: error instanceof Error ? error.message : String(error),
      timestamp
    });
  }
  
  // Calculate summary
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  return {
    auditId,
    executedBy: userId,
    executedAt: timestamp,
    summary: {
      total,
      passed,
      warnings,
      failed,
      score
    },
    results
  };
}

/**
 * Perform security-related checks
 */
async function performSecurityChecks(results: AuditResult[], timestamp: string): Promise<void> {
  try {
    // JWT Configuration Check
    const jwtResponse = await apiRequest('GET', '/api/system/audit/jwt-config');
    const jwtData = await jwtResponse.json();
    
    results.push({
      category: "Security",
      name: "JWT Configuration",
      status: jwtData.secure ? 'passed' : 'failed',
      description: "JWT token configuration security check",
      details: jwtData.details,
      timestamp
    });
    
    // Password Policy Check
    const passwordResponse = await apiRequest('GET', '/api/system/audit/password-policy');
    const passwordData = await passwordResponse.json();
    
    results.push({
      category: "Security",
      name: "Password Policy",
      status: passwordData.compliant ? 'passed' : 'warning',
      description: "Password policy requirements verification",
      details: passwordData.details,
      timestamp
    });
    
    // HTTPS/TLS Configuration
    results.push({
      category: "Security",
      name: "HTTPS/TLS Configuration",
      status: window.location.protocol === 'https:' ? 'passed' : 'warning',
      description: "Secure communication protocol verification",
      details: window.location.protocol === 'https:' 
        ? "System is using HTTPS for secure communications" 
        : "System is not using HTTPS, which is required for production",
      timestamp
    });
    
    // CORS Configuration
    const corsResponse = await apiRequest('GET', '/api/system/audit/cors-config');
    const corsData = await corsResponse.json();
    
    results.push({
      category: "Security",
      name: "CORS Configuration",
      status: corsData.secure ? 'passed' : 'warning',
      description: "Cross-Origin Resource Sharing security verification",
      details: corsData.details,
      timestamp
    });
    
    // Session Management
    const sessionResponse = await apiRequest('GET', '/api/system/audit/session-config');
    const sessionData = await sessionResponse.json();
    
    results.push({
      category: "Security",
      name: "Session Management",
      status: sessionData.secure ? 'passed' : 'failed',
      description: "Session security configuration verification",
      details: sessionData.details,
      timestamp
    });
    
    // XSS Protection
    const xssResponse = await apiRequest('GET', '/api/system/audit/xss-protection');
    const xssData = await xssResponse.json();
    
    results.push({
      category: "Security",
      name: "XSS Protection",
      status: xssData.secure ? 'passed' : 'failed',
      description: "Cross-site scripting protection verification",
      details: xssData.details,
      timestamp
    });
    
  } catch (error) {
    console.error("Error during security checks:", error);
    results.push({
      category: "Security",
      name: "Security Audit",
      status: "failed",
      description: "Security checks failed to complete",
      details: error instanceof Error ? error.message : String(error),
      timestamp
    });
  }
}

/**
 * Perform compliance-related checks
 */
async function performComplianceChecks(results: AuditResult[], timestamp: string): Promise<void> {
  try {
    // 21 CFR Part 11 Compliance
    const part11Response = await apiRequest('GET', '/api/system/audit/part11-compliance');
    const part11Data = await part11Response.json();
    
    results.push({
      category: "Compliance",
      name: "21 CFR Part 11",
      status: part11Data.compliant ? 'passed' : 'warning',
      description: "FDA 21 CFR Part 11 compliance verification",
      details: part11Data.details,
      timestamp
    });
    
    // ISO 13485 Compliance
    const isoResponse = await apiRequest('GET', '/api/system/audit/iso13485-compliance');
    const isoData = await isoResponse.json();
    
    results.push({
      category: "Compliance",
      name: "ISO 13485:2016",
      status: isoData.compliant ? 'passed' : 'warning',
      description: "ISO 13485:2016 quality management system compliance",
      details: isoData.details,
      timestamp
    });
    
    // IEC 62304 Compliance
    const iecResponse = await apiRequest('GET', '/api/system/audit/iec62304-compliance');
    const iecData = await iecResponse.json();
    
    results.push({
      category: "Compliance",
      name: "IEC 62304:2006/AMD1:2015",
      status: iecData.compliant ? 'passed' : 'warning',
      description: "IEC 62304 medical device software lifecycle compliance",
      details: iecData.details,
      timestamp
    });
    
    // GDPR Compliance (if applicable)
    const gdprResponse = await apiRequest('GET', '/api/system/audit/gdpr-compliance');
    const gdprData = await gdprResponse.json();
    
    results.push({
      category: "Compliance",
      name: "GDPR Compliance",
      status: gdprData.compliant ? 'passed' : 'warning',
      description: "General Data Protection Regulation compliance verification",
      details: gdprData.details,
      timestamp
    });
    
    // Audit Trail Completeness
    const auditTrailResponse = await apiRequest('GET', '/api/system/audit/audit-trail-check');
    const auditTrailData = await auditTrailResponse.json();
    
    results.push({
      category: "Compliance",
      name: "Audit Trail Completeness",
      status: auditTrailData.complete ? 'passed' : 'failed',
      description: "Verification of audit trail integrity and completeness",
      details: auditTrailData.details,
      timestamp
    });
    
    // Electronic Signature Verification
    const signatureResponse = await apiRequest('GET', '/api/system/audit/e-signature-check');
    const signatureData = await signatureResponse.json();
    
    results.push({
      category: "Compliance",
      name: "Electronic Signatures",
      status: signatureData.compliant ? 'passed' : 'failed',
      description: "Electronic signature implementation compliance check",
      details: signatureData.details,
      timestamp
    });
    
  } catch (error) {
    console.error("Error during compliance checks:", error);
    results.push({
      category: "Compliance",
      name: "Compliance Audit",
      status: "failed",
      description: "Compliance checks failed to complete",
      details: error instanceof Error ? error.message : String(error),
      timestamp
    });
  }
}

/**
 * Perform performance-related checks
 */
async function performPerformanceChecks(results: AuditResult[], timestamp: string): Promise<void> {
  try {
    // API Response Time
    const startTime = performance.now();
    await apiRequest('GET', '/api/health');
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    results.push({
      category: "Performance",
      name: "API Response Time",
      status: responseTime < 300 ? 'passed' : responseTime < 1000 ? 'warning' : 'failed',
      description: "API endpoint response time check",
      details: `Response time: ${Math.round(responseTime)}ms`,
      timestamp
    });
    
    // Memory Usage
    const memoryResponse = await apiRequest('GET', '/api/system/audit/memory-usage');
    const memoryData = await memoryResponse.json();
    
    results.push({
      category: "Performance",
      name: "Memory Usage",
      status: memoryData.inLimits ? 'passed' : 'warning',
      description: "Server memory utilization check",
      details: memoryData.details,
      timestamp
    });
    
    // CPU Usage
    const cpuResponse = await apiRequest('GET', '/api/system/audit/cpu-usage');
    const cpuData = await cpuResponse.json();
    
    results.push({
      category: "Performance",
      name: "CPU Usage",
      status: cpuData.inLimits ? 'passed' : 'warning',
      description: "Server CPU utilization check",
      details: cpuData.details,
      timestamp
    });
    
    // Database Query Performance
    const dbPerformanceResponse = await apiRequest('GET', '/api/system/audit/db-performance');
    const dbPerformanceData = await dbPerformanceResponse.json();
    
    results.push({
      category: "Performance",
      name: "Database Query Performance",
      status: dbPerformanceData.acceptable ? 'passed' : 'warning',
      description: "Database query execution time verification",
      details: dbPerformanceData.details,
      timestamp
    });
    
    // Frontend Load Time
    const frontendResponse = await apiRequest('GET', '/api/system/audit/frontend-performance');
    const frontendData = await frontendResponse.json();
    
    results.push({
      category: "Performance",
      name: "Frontend Load Time",
      status: frontendData.acceptable ? 'passed' : 'warning',
      description: "Frontend application load time measurement",
      details: frontendData.details,
      timestamp
    });
    
  } catch (error) {
    console.error("Error during performance checks:", error);
    results.push({
      category: "Performance",
      name: "Performance Audit",
      status: "failed",
      description: "Performance checks failed to complete",
      details: error instanceof Error ? error.message : String(error),
      timestamp
    });
  }
}

/**
 * Perform database health checks
 */
async function performDatabaseChecks(results: AuditResult[], timestamp: string): Promise<void> {
  try {
    // Database Connectivity
    const dbConnectivityResponse = await apiRequest('GET', '/api/database-health/connectivity');
    const dbConnectivityData = await dbConnectivityResponse.json();
    
    results.push({
      category: "Database",
      name: "Database Connectivity",
      status: dbConnectivityData.connected ? 'passed' : 'failed',
      description: "Database connection verification",
      details: dbConnectivityData.details,
      timestamp
    });
    
    // Database Table Structure
    const dbSchemaResponse = await apiRequest('GET', '/api/database-health/schema');
    const dbSchemaData = await dbSchemaResponse.json();
    
    results.push({
      category: "Database",
      name: "Database Schema Integrity",
      status: dbSchemaData.valid ? 'passed' : 'failed',
      description: "Database schema structure validation",
      details: dbSchemaData.details,
      timestamp
    });
    
    // Database Backup Status
    const dbBackupResponse = await apiRequest('GET', '/api/database-health/backup-status');
    const dbBackupData = await dbBackupResponse.json();
    
    results.push({
      category: "Database",
      name: "Database Backup Status",
      status: dbBackupData.upToDate ? 'passed' : 'warning',
      description: "Database backup recency verification",
      details: dbBackupData.details,
      timestamp
    });
    
    // Database Size and Growth
    const dbSizeResponse = await apiRequest('GET', '/api/database-health/size');
    const dbSizeData = await dbSizeResponse.json();
    
    results.push({
      category: "Database",
      name: "Database Size and Growth",
      status: dbSizeData.withinLimits ? 'passed' : 'warning',
      description: "Database size and growth trend analysis",
      details: dbSizeData.details,
      timestamp
    });
    
    // Index Health
    const dbIndexResponse = await apiRequest('GET', '/api/database-health/index-health');
    const dbIndexData = await dbIndexResponse.json();
    
    results.push({
      category: "Database",
      name: "Index Optimization",
      status: dbIndexData.optimized ? 'passed' : 'warning',
      description: "Database index performance verification",
      details: dbIndexData.details,
      timestamp
    });
    
  } catch (error) {
    console.error("Error during database checks:", error);
    results.push({
      category: "Database",
      name: "Database Audit",
      status: "failed",
      description: "Database health checks failed to complete",
      details: error instanceof Error ? error.message : String(error),
      timestamp
    });
  }
}

/**
 * Perform API health checks
 */
async function performApiChecks(results: AuditResult[], timestamp: string): Promise<void> {
  try {
    // API Health Check
    const apiHealthResponse = await apiRequest('GET', '/api/health');
    const apiHealthData = await apiHealthResponse.json();
    
    results.push({
      category: "API",
      name: "API Health Status",
      status: apiHealthData.status === 'ok' ? 'passed' : 'failed',
      description: "API health endpoint verification",
      details: `API Version: ${apiHealthData.apiVersion}, Environment: ${apiHealthData.environment}`,
      timestamp
    });
    
    // API Authentication
    const apiAuthResponse = await apiRequest('GET', '/api/system/audit/auth-check');
    const apiAuthData = await apiAuthResponse.json();
    
    results.push({
      category: "API",
      name: "API Authentication",
      status: apiAuthData.valid ? 'passed' : 'failed',
      description: "API authentication mechanism verification",
      details: apiAuthData.details,
      timestamp
    });
    
    // API Rate Limiting
    const apiRateLimitResponse = await apiRequest('GET', '/api/system/audit/rate-limit-check');
    const apiRateLimitData = await apiRateLimitResponse.json();
    
    results.push({
      category: "API",
      name: "API Rate Limiting",
      status: apiRateLimitData.configured ? 'passed' : 'warning',
      description: "API rate limiting configuration verification",
      details: apiRateLimitData.details,
      timestamp
    });
    
    // API Documentation
    const apiDocsResponse = await apiRequest('GET', '/api/system/audit/docs-check');
    const apiDocsData = await apiDocsResponse.json();
    
    results.push({
      category: "API",
      name: "API Documentation",
      status: apiDocsData.valid ? 'passed' : 'warning',
      description: "API documentation completeness verification",
      details: apiDocsData.details,
      timestamp
    });
    
    // API Versioning
    const apiVersionResponse = await apiRequest('GET', '/api/system/audit/versioning-check');
    const apiVersionData = await apiVersionResponse.json();
    
    results.push({
      category: "API",
      name: "API Versioning",
      status: apiVersionData.proper ? 'passed' : 'warning',
      description: "API versioning implementation verification",
      details: apiVersionData.details,
      timestamp
    });
    
  } catch (error) {
    console.error("Error during API checks:", error);
    results.push({
      category: "API",
      name: "API Audit",
      status: "failed",
      description: "API health checks failed to complete",
      details: error instanceof Error ? error.message : String(error),
      timestamp
    });
  }
}

/**
 * Save the audit report to the database
 * @param report - The complete audit report
 * @returns Promise resolving to the saved report with ID
 */
export async function saveAuditReport(report: SystemAuditReport): Promise<SystemAuditReport> {
  try {
    const response = await apiRequest('POST', '/api/system/audit/reports', report);
    return await response.json();
  } catch (error) {
    console.error("Failed to save audit report:", error);
    throw new Error("Failed to save audit report to the database");
  }
}

/**
 * Get a previously saved audit report
 * @param auditId - ID of the audit to retrieve
 * @returns Promise resolving to the audit report
 */
export async function getAuditReport(auditId: string): Promise<SystemAuditReport> {
  try {
    const response = await apiRequest('GET', `/api/system/audit/reports/${auditId}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to retrieve audit report ${auditId}:`, error);
    throw new Error("Failed to retrieve audit report from the database");
  }
}

/**
 * Get list of all audit reports
 * @returns Promise resolving to an array of audit reports
 */
export async function getAllAuditReports(): Promise<SystemAuditReport[]> {
  try {
    const response = await apiRequest('GET', '/api/system/audit/reports');
    return await response.json();
  } catch (error) {
    console.error("Failed to retrieve audit reports:", error);
    throw new Error("Failed to retrieve audit reports from the database");
  }
}