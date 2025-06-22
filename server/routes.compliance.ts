/**
 * Compliance and Regulatory Reporting Routes
 * Generates compliance reports for regulatory submissions
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from './auth';
import { performanceMiddleware } from './middleware/performance-monitoring';
import { generateRegulatorySubmissionReport, ComplianceReportGenerator } from './utils/compliance-report-generator';

const router = Router();

// Apply middleware to all compliance routes
router.use(authMiddleware);
router.use(performanceMiddleware);

/**
 * Generate comprehensive compliance report
 * GET /api/compliance/report/:type
 */
router.get('/report/:type', async (req: Request, res: Response) => {
  try {
    const reportType = req.params.type.toUpperCase() as 'ISO_13485' | 'IEC_62304' | 'CFR_PART_11' | 'COMPREHENSIVE';
    
    if (!['ISO_13485', 'IEC_62304', 'CFR_PART_11', 'COMPREHENSIVE'].includes(reportType)) {
      return res.status(400).json({
        error: 'Invalid report type',
        validTypes: ['ISO_13485', 'IEC_62304', 'CFR_PART_11', 'COMPREHENSIVE']
      });
    }

    console.log(`📊 Generating ${reportType} compliance report for user ${req.user?.id}`);
    
    const report = await generateRegulatorySubmissionReport(reportType);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${reportType}-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.status(200).json({
      reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.username,
      data: JSON.parse(report)
    });

  } catch (error) {
    console.error('Compliance report generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate compliance report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get compliance dashboard summary
 * GET /api/compliance/dashboard
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    
    const config = {
      reportType: 'COMPREHENSIVE' as const,
      startDate,
      endDate,
      includeAuditTrails: true,
      includePerformanceMetrics: true,
      includeSecurityEvents: true
    };

    const fullReport = await ComplianceReportGenerator.generateComplianceReport(config);
    
    // Return summarized dashboard data
    const dashboard = {
      overall_compliance_score: fullReport.regulatory_compliance.overall_score,
      security_score: fullReport.security_assessment.security_score,
      performance_score: fullReport.performance_validation.performance_score,
      system_metrics: fullReport.system_metrics,
      recent_activity: {
        audit_entries_last_30_days: fullReport.audit_trail_analysis.coverage_analysis.total_entries,
        average_response_time: fullReport.performance_validation.response_times.average_response_time,
        uptime_percentage: fullReport.system_metrics.systemUptime
      },
      compliance_status: {
        iso_13485: fullReport.regulatory_compliance.iso_13485_compliance.score >= 85 ? 'COMPLIANT' : 'NEEDS_ATTENTION',
        iec_62304: fullReport.regulatory_compliance.iec_62304_compliance.score >= 85 ? 'COMPLIANT' : 'NEEDS_ATTENTION',
        cfr_part_11: fullReport.regulatory_compliance.cfr_part_11_compliance.score >= 85 ? 'COMPLIANT' : 'NEEDS_ATTENTION'
      },
      recommendations: fullReport.recommendations.slice(0, 3) // Top 3 recommendations
    };

    res.json(dashboard);

  } catch (error) {
    console.error('Dashboard generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate compliance dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Export compliance data for regulatory submission
 * POST /api/compliance/export
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { reportTypes, dateRange, format } = req.body;
    
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();
    
    const reports = [];
    
    for (const reportType of (reportTypes || ['COMPREHENSIVE'])) {
      const report = await generateRegulatorySubmissionReport(reportType);
      reports.push({
        type: reportType,
        data: JSON.parse(report)
      });
    }
    
    const exportData = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        generated_by: req.user?.username,
        date_range: { start: startDate, end: endDate },
        format: format || 'json',
        eqms_version: '1.0.0',
        regulatory_standards: ['ISO 13485:2016', 'IEC 62304:2006', '21 CFR Part 11']
      },
      compliance_reports: reports
    };

    if (format === 'pdf') {
      // Future implementation for PDF export
      return res.status(501).json({
        error: 'PDF export not yet implemented',
        message: 'Use JSON format for now'
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="regulatory-submission-export.json"');
    
    res.json(exportData);

  } catch (error) {
    console.error('Compliance export failed:', error);
    res.status(500).json({
      error: 'Failed to export compliance data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as complianceRoutes };