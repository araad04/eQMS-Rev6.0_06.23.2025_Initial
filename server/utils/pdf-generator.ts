
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export interface PDFGenerationOptions {
  documentType: string;
  title: string;
  data: any;
  template: string;
  includeSignatures?: boolean;
  watermark?: string;
  pageNumbers?: boolean;
  header?: string;
  footer?: string;
}

export class PDFGeneratorService {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    // Load PDF templates for different document types
    this.templates.set('capa', this.getCAPATemplate());
    this.templates.set('management-review', this.getManagementReviewTemplate());
    this.templates.set('audit-report', this.getAuditReportTemplate());
    this.templates.set('training-record', this.getTrainingRecordTemplate());
    this.templates.set('design-control', this.getDesignControlTemplate());
    this.templates.set('document-control', this.getDocumentControlTemplate());
  }

  async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set page content with template
      const html = this.renderTemplate(options);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF with comprehensive options
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        displayHeaderFooter: true,
        headerTemplate: options.header || this.getDefaultHeader(options),
        footerTemplate: options.footer || this.getDefaultFooter(options)
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  private renderTemplate(options: PDFGenerationOptions): string {
    const template = this.templates.get(options.documentType) || this.getGenericTemplate();
    
    // Replace placeholders with actual data
    let html = template
      .replace(/{{title}}/g, options.title)
      .replace(/{{documentType}}/g, options.documentType)
      .replace(/{{date}}/g, new Date().toLocaleDateString())
      .replace(/{{time}}/g, new Date().toLocaleTimeString());

    // Process data-specific replacements
    if (options.data) {
      Object.keys(options.data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, String(options.data[key] || ''));
      });
    }

    return html;
  }

  private getCAPATemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
        .title { font-size: 18pt; font-weight: bold; margin-bottom: 10px; }
        .document-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .section { margin-bottom: 25px; border: 2px solid #000; padding: 15px; }
        .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 5px; }
        .field-group { margin-bottom: 15px; }
        .field-label { font-weight: bold; margin-bottom: 5px; }
        .field-value { border-bottom: 1px solid #000; min-height: 20px; padding: 5px; }
        .signature-section { margin-top: 30px; border-top: 2px solid #000; padding-top: 20px; }
        .signature-field { display: inline-block; width: 250px; margin-right: 50px; margin-bottom: 40px; }
        .signature-line { border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">CORRECTIVE AND PREVENTIVE ACTION (CAPA)</div>
        <div>Document ID: {{capaId}} | Date: {{date}}</div>
      </div>
      
      <div class="document-info">
        <div>
          <div class="field-group">
            <div class="field-label">CAPA Number:</div>
            <div class="field-value">{{capaId}}</div>
          </div>
          <div class="field-group">
            <div class="field-label">Date Initiated:</div>
            <div class="field-value">{{createdAt}}</div>
          </div>
        </div>
        <div>
          <div class="field-group">
            <div class="field-label">Priority:</div>
            <div class="field-value">{{riskPriority}}</div>
          </div>
          <div class="field-group">
            <div class="field-label">Status:</div>
            <div class="field-value">{{status}}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Problem Description</div>
        <div class="field-group">
          <div class="field-label">Title:</div>
          <div class="field-value">{{title}}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Description:</div>
          <div class="field-value">{{description}}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Source:</div>
          <div class="field-value">{{source}}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Root Cause Analysis</div>
        <div class="field-group">
          <div class="field-label">Method Used:</div>
          <div class="field-value">{{rcaMethod}}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Root Cause:</div>
          <div class="field-value">{{rootCause}}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Corrective Action</div>
        <div class="field-group">
          <div class="field-label">Action Plan:</div>
          <div class="field-value">{{correctiveAction}}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Assigned To:</div>
          <div class="field-value">{{assignedToName}}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Due Date:</div>
          <div class="field-value">{{dueDate}}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Preventive Action</div>
        <div class="field-group">
          <div class="field-label">Preventive Measures:</div>
          <div class="field-value">{{preventiveAction}}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Effectiveness Verification</div>
        <div class="field-group">
          <div class="field-label">Verification Method:</div>
          <div class="field-value">{{effectiveness}}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Results:</div>
          <div class="field-value">{{effectivenessResults}}</div>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-field">
          <div class="signature-line"></div>
          <div>Initiated By: {{initiatedByName}}</div>
          <div>Date: {{createdAt}}</div>
        </div>
        <div class="signature-field">
          <div class="signature-line"></div>
          <div>Reviewed By:</div>
          <div>Date:</div>
        </div>
        <div class="signature-field">
          <div class="signature-line"></div>
          <div>Approved By:</div>
          <div>Date:</div>
        </div>
      </div>
    </body>
    </html>`;
  }

  private getManagementReviewTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
        .title { font-size: 18pt; font-weight: bold; margin-bottom: 10px; }
        .section { margin-bottom: 25px; border: 1px solid #000; padding: 15px; }
        .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 15px; background-color: #f0f0f0; padding: 10px; }
        .attendees { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .input-category { margin-bottom: 20px; page-break-inside: avoid; }
        .action-items table { width: 100%; border-collapse: collapse; }
        .action-items th, .action-items td { border: 1px solid #000; padding: 8px; text-align: left; }
        .action-items th { background-color: #f0f0f0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">MANAGEMENT REVIEW</div>
        <div>{{title}}</div>
        <div>Date: {{reviewDate}} | Type: {{reviewType}}</div>
      </div>

      <div class="section">
        <div class="section-title">Meeting Information</div>
        <div><strong>Review Date:</strong> {{reviewDate}}</div>
        <div><strong>Review Type:</strong> {{reviewType}}</div>
        <div><strong>Status:</strong> {{status}}</div>
      </div>

      <div class="section">
        <div class="section-title">Attendees</div>
        <div class="attendees">
          {{#each attendees}}
          <div>• {{this}}</div>
          {{/each}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Review Inputs</div>
        {{#each reviewInputs}}
        <div class="input-category">
          <h4>{{category}}</h4>
          <div>{{content}}</div>
        </div>
        {{/each}}
      </div>

      <div class="section">
        <div class="section-title">Action Items</div>
        <div class="action-items">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {{#each actionItems}}
              <tr>
                <td>{{description}}</td>
                <td>{{assignedTo}}</td>
                <td>{{dueDate}}</td>
                <td>{{priority}}</td>
                <td>{{status}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-field">
          <div class="signature-line"></div>
          <div>Conducted By:</div>
          <div>Date:</div>
        </div>
        <div class="signature-field">
          <div class="signature-line"></div>
          <div>Quality Manager:</div>
          <div>Date:</div>
        </div>
      </div>
    </body>
    </html>`;
  }

  private getAuditReportTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
        .findings table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .findings th, .findings td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; }
        .findings th { background-color: #f0f0f0; font-weight: bold; }
        .severity-high { background-color: #ffebee; }
        .severity-medium { background-color: #fff3e0; }
        .severity-low { background-color: #f3e5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">AUDIT REPORT</div>
        <div>{{title}}</div>
        <div>Audit Date: {{auditDate}} | Type: {{auditType}}</div>
      </div>

      <div class="section">
        <div class="section-title">Audit Information</div>
        <div><strong>Audit Scope:</strong> {{auditScope}}</div>
        <div><strong>Lead Auditor:</strong> {{leadAuditor}}</div>
        <div><strong>Audit Criteria:</strong> {{auditCriteria}}</div>
      </div>

      <div class="section">
        <div class="section-title">Findings</div>
        <div class="findings">
          <table>
            <thead>
              <tr>
                <th>Finding #</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Clause Reference</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {{#each findings}}
              <tr class="severity-{{severity}}">
                <td>{{findingNumber}}</td>
                <td>{{description}}</td>
                <td>{{severity}}</td>
                <td>{{clause}}</td>
                <td>{{evidence}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>`;
  }

  private getTrainingRecordTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        .training-matrix table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        .training-matrix th, .training-matrix td { border: 1px solid #000; padding: 6px; text-align: center; }
        .completed { background-color: #c8e6c9; }
        .pending { background-color: #ffecb3; }
        .overdue { background-color: #ffcdd2; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">TRAINING RECORD</div>
        <div>{{employeeName}} - {{department}}</div>
        <div>Record Date: {{date}}</div>
      </div>

      <div class="section">
        <div class="section-title">Training Matrix</div>
        <div class="training-matrix">
          <table>
            <thead>
              <tr>
                <th>Training Course</th>
                <th>Required</th>
                <th>Completion Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Trainer</th>
              </tr>
            </thead>
            <tbody>
              {{#each trainingRecords}}
              <tr class="{{status}}">
                <td>{{courseName}}</td>
                <td>{{required}}</td>
                <td>{{completionDate}}</td>
                <td>{{expiryDate}}</td>
                <td>{{status}}</td>
                <td>{{trainer}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>`;
  }

  private getDesignControlTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        .traceability-matrix table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        .traceability-matrix th, .traceability-matrix td { border: 1px solid #000; padding: 6px; text-align: left; }
        .phase-section { margin-bottom: 30px; page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">DESIGN CONTROL DOCUMENTATION</div>
        <div>{{projectTitle}}</div>
        <div>Project ID: {{projectId}} | Date: {{date}}</div>
      </div>

      <div class="section">
        <div class="section-title">Project Information</div>
        <div><strong>Project Title:</strong> {{projectTitle}}</div>
        <div><strong>Project Type:</strong> {{projectType}}</div>
        <div><strong>Risk Level:</strong> {{riskLevel}}</div>
        <div><strong>Responsible Person:</strong> {{responsiblePerson}}</div>
      </div>

      <div class="section">
        <div class="section-title">Design Inputs</div>
        {{#each designInputs}}
        <div class="phase-section">
          <h4>{{title}}</h4>
          <div>{{description}}</div>
          <div><strong>Status:</strong> {{status}}</div>
        </div>
        {{/each}}
      </div>

      <div class="section">
        <div class="section-title">Design Outputs</div>
        {{#each designOutputs}}
        <div class="phase-section">
          <h4>{{title}}</h4>
          <div>{{description}}</div>
          <div><strong>Status:</strong> {{status}}</div>
        </div>
        {{/each}}
      </div>

      <div class="section">
        <div class="section-title">Traceability Matrix</div>
        <div class="traceability-matrix">
          <table>
            <thead>
              <tr>
                <th>Input ID</th>
                <th>Output ID</th>
                <th>Verification ID</th>
                <th>Validation ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {{#each traceabilityLinks}}
              <tr>
                <td>{{inputId}}</td>
                <td>{{outputId}}</td>
                <td>{{verificationId}}</td>
                <td>{{validationId}}</td>
                <td>{{status}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>`;
  }

  private getDocumentControlTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        .approval-matrix table { width: 100%; border-collapse: collapse; }
        .approval-matrix th, .approval-matrix td { border: 1px solid #000; padding: 8px; }
        .version-history table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .version-history th, .version-history td { border: 1px solid #000; padding: 6px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">DOCUMENT CONTROL RECORD</div>
        <div>{{documentTitle}}</div>
        <div>Document ID: {{documentId}} | Version: {{version}}</div>
      </div>

      <div class="section">
        <div class="section-title">Document Information</div>
        <div><strong>Title:</strong> {{documentTitle}}</div>
        <div><strong>Document Number:</strong> {{documentNumber}}</div>
        <div><strong>Version:</strong> {{version}}</div>
        <div><strong>Effective Date:</strong> {{effectiveDate}}</div>
        <div><strong>Review Date:</strong> {{nextReviewDate}}</div>
      </div>

      <div class="section">
        <div class="section-title">Approval Matrix</div>
        <div class="approval-matrix">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Name</th>
                <th>Action</th>
                <th>Date</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              {{#each approvals}}
              <tr>
                <td>{{role}}</td>
                <td>{{name}}</td>
                <td>{{action}}</td>
                <td>{{date}}</td>
                <td>{{signature}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Version History</div>
        <div class="version-history">
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Changes</th>
                <th>Author</th>
              </tr>
            </thead>
            <tbody>
              {{#each versionHistory}}
              <tr>
                <td>{{version}}</td>
                <td>{{date}}</td>
                <td>{{changes}}</td>
                <td>{{author}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>`;
  }

  private getGenericTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
        .title { font-size: 18pt; font-weight: bold; margin-bottom: 10px; }
        .content { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">{{title}}</div>
        <div>Generated: {{date}} {{time}}</div>
      </div>
      <div class="content">
        {{content}}
      </div>
    </body>
    </html>`;
  }

  private getDefaultHeader(options: PDFGenerationOptions): string {
    return `
    <div style="font-size: 10pt; text-align: center; width: 100%; margin: 0 20px;">
      <span>eQMS - ${options.documentType} | ${options.title}</span>
    </div>`;
  }

  private getDefaultFooter(options: PDFGenerationOptions): string {
    return `
    <div style="font-size: 9pt; text-align: center; width: 100%; margin: 0 20px;">
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated: ${new Date().toLocaleString()}</span>
    </div>`;
  }
}

export const pdfGenerator = new PDFGeneratorService();
