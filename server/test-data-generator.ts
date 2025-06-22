// Test data generator for Document Control KPI validation
import { storage } from './storage';

interface TestDocument {
  title: string;
  typeId: number;
  department: string;
  purpose: string;
  scope: string;
  confidentialityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  daysAgo: number; // Document creation date
  approvalDays?: number; // Days to approve (if approved)
  isApproved?: boolean;
}

const testDocuments: TestDocument[] = [
  // Quality Manuals - typically longer approval times
  {
    title: "Quality Management System Manual v3.0",
    typeId: 1,
    department: "Quality Assurance",
    purpose: "Define comprehensive QMS framework",
    scope: "All organizational processes",
    confidentialityLevel: "CONFIDENTIAL",
    daysAgo: 45,
    approvalDays: 15,
    isApproved: true
  },
  {
    title: "Risk Management Manual",
    typeId: 1,
    department: "Quality Assurance", 
    purpose: "Establish risk management procedures",
    scope: "All product development",
    confidentialityLevel: "CONFIDENTIAL",
    daysAgo: 30,
    approvalDays: 12,
    isApproved: true
  },
  {
    title: "Design Control Manual Update",
    typeId: 1,
    department: "R&D",
    purpose: "Update design control procedures",
    scope: "Product development lifecycle",
    confidentialityLevel: "INTERNAL",
    daysAgo: 8,
    isApproved: false // Still pending
  },

  // SOPs - medium approval times
  {
    title: "SOP-Device Testing Protocol",
    typeId: 2,
    department: "Quality Control",
    purpose: "Standardize device testing procedures",
    scope: "All medical device testing",
    confidentialityLevel: "INTERNAL",
    daysAgo: 25,
    approvalDays: 7,
    isApproved: true
  },
  {
    title: "SOP-Manufacturing Line Setup",
    typeId: 2,
    department: "Manufacturing",
    purpose: "Define manufacturing setup procedures",
    scope: "Production operations",
    confidentialityLevel: "INTERNAL",
    daysAgo: 20,
    approvalDays: 9,
    isApproved: true
  },
  {
    title: "SOP-Sterilization Validation",
    typeId: 2,
    department: "Quality Control",
    purpose: "Validate sterilization processes",
    scope: "Sterile device production",
    confidentialityLevel: "INTERNAL",
    daysAgo: 15,
    approvalDays: 6,
    isApproved: true
  },
  {
    title: "SOP-CAPA Investigation Process",
    typeId: 2,
    department: "Quality Assurance",
    purpose: "Standardize CAPA investigations",
    scope: "All quality issues",
    confidentialityLevel: "INTERNAL",
    daysAgo: 12,
    isApproved: false // Pending for 12 days - over target
  },
  {
    title: "SOP-Supplier Audit Protocol",
    typeId: 2,
    department: "Supply Chain",
    purpose: "Define supplier audit procedures",
    scope: "Critical supplier management",
    confidentialityLevel: "INTERNAL",
    daysAgo: 6,
    isApproved: false // Within target window
  },

  // Work Instructions - faster approval times
  {
    title: "WI-Device Assembly Instructions",
    typeId: 3,
    department: "Manufacturing",
    purpose: "Detailed assembly instructions",
    scope: "Production line workers",
    confidentialityLevel: "INTERNAL",
    daysAgo: 18,
    approvalDays: 4,
    isApproved: true
  },
  {
    title: "WI-Equipment Calibration",
    typeId: 3,
    department: "Quality Control",
    purpose: "Equipment calibration procedures",
    scope: "QC operations",
    confidentialityLevel: "INTERNAL",
    daysAgo: 14,
    approvalDays: 5,
    isApproved: true
  },
  {
    title: "WI-Document Review Process",
    typeId: 3,
    department: "Quality Assurance",
    purpose: "Document review workflow",
    scope: "All document types",
    confidentialityLevel: "INTERNAL",
    daysAgo: 10,
    approvalDays: 3,
    isApproved: true
  },
  {
    title: "WI-Environmental Monitoring",
    typeId: 3,
    department: "Manufacturing",
    purpose: "Monitor production environment",
    scope: "Clean room operations",
    confidentialityLevel: "INTERNAL",
    daysAgo: 4,
    isApproved: false // Within target
  },

  // Forms - typically fastest approval
  {
    title: "FORM-Training Record Template",
    typeId: 4,
    department: "Human Resources",
    purpose: "Track employee training",
    scope: "All personnel",
    confidentialityLevel: "INTERNAL",
    daysAgo: 22,
    approvalDays: 2,
    isApproved: true
  },
  {
    title: "FORM-Deviation Report",
    typeId: 4,
    department: "Quality Assurance",
    purpose: "Report process deviations",
    scope: "All operations",
    confidentialityLevel: "INTERNAL",
    daysAgo: 16,
    approvalDays: 3,
    isApproved: true
  },
  {
    title: "FORM-Customer Complaint Log",
    typeId: 4,
    department: "Customer Service",
    purpose: "Track customer complaints",
    scope: "Customer interactions",
    confidentialityLevel: "INTERNAL",
    daysAgo: 9,
    isApproved: false // Pending 9 days - within target
  },

  // Technical Documents - variable approval times
  {
    title: "TS-Device Specifications v2.1",
    typeId: 5,
    department: "R&D",
    purpose: "Define device technical specs",
    scope: "Product development",
    confidentialityLevel: "CONFIDENTIAL",
    daysAgo: 35,
    approvalDays: 14,
    isApproved: true
  },
  {
    title: "DWG-Component Assembly Drawing",
    typeId: 6,
    department: "Engineering",
    purpose: "Component assembly guidance",
    scope: "Manufacturing operations",
    confidentialityLevel: "INTERNAL",
    daysAgo: 28,
    approvalDays: 8,
    isApproved: true
  },
  {
    title: "TS-Software Requirements Spec",
    typeId: 5,
    department: "Software Engineering",
    purpose: "Define software requirements",
    scope: "Medical device software",
    confidentialityLevel: "CONFIDENTIAL",
    daysAgo: 13,
    isApproved: false // Pending 13 days - over target
  },
  {
    title: "DWG-Packaging Design Update",
    typeId: 6,
    department: "Packaging",
    purpose: "Update product packaging",
    scope: "Commercial packaging",
    confidentialityLevel: "INTERNAL",
    daysAgo: 7,
    isApproved: false // Within target window
  }
];

export async function generateTestDocuments() {
  console.log('Generating Document Control KPI test data...');
  
  const createdDocuments = [];
  
  for (const testDoc of testDocuments) {
    try {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - testDoc.daysAgo);
      
      let effectiveDate = new Date(createdDate);
      let approvalStatus = 'Pending';
      
      if (testDoc.isApproved && testDoc.approvalDays) {
        effectiveDate.setDate(effectiveDate.getDate() + testDoc.approvalDays);
        approvalStatus = 'Approved';
      }
      
      const document = await storage.createDocument({
        title: testDoc.title,
        typeId: testDoc.typeId,
        status: 'Pending Approval',
        version: '1.0',
        revisionLevel: 'A',
        effectiveDate,
        reviewDate: effectiveDate,
        nextReviewDate: new Date(effectiveDate.getTime() + (3 * 365 * 24 * 60 * 60 * 1000)),
        owner: 9999,
        department: testDoc.department,
        purpose: testDoc.purpose,
        scope: testDoc.scope,
        content: '',
        confidentialityLevel: testDoc.confidentialityLevel,
        distributionList: [],
        isControlled: true,
        trainingRequired: testDoc.typeId === 2, // SOPs require training
        keywords: '',
        relatedDocuments: [],
        createdAt: createdDate,
        createdBy: 9999,
        modifiedAt: effectiveDate,
        modifiedBy: 9999,
        approvalStatus,
        isObsolete: false,
        hasAttachments: false,
        filePath: null,
        fileName: null,
        fileSize: null,
        fileType: null
      });
      
      createdDocuments.push({
        ...document,
        approvalDays: testDoc.approvalDays,
        daysPending: testDoc.isApproved ? testDoc.approvalDays : testDoc.daysAgo
      });
      
    } catch (error) {
      console.error(`Error creating test document ${testDoc.title}:`, error);
    }
  }
  
  console.log(`Created ${createdDocuments.length} test documents for KPI analysis`);
  
  // Calculate KPI metrics from test data
  const pendingDocs = createdDocuments.filter(doc => doc.approvalStatus === 'Pending');
  const approvedDocs = createdDocuments.filter(doc => doc.approvalStatus === 'Approved');
  
  const allApprovalTimes = [
    ...approvedDocs.map(doc => doc.approvalDays),
    ...pendingDocs.map(doc => doc.daysPending)
  ].filter(time => time != null);
  
  const avgApprovalTime = allApprovalTimes.reduce((sum, time) => sum + time, 0) / allApprovalTimes.length;
  const withinTarget = allApprovalTimes.filter(time => time <= 10).length;
  const compliance = (withinTarget / allApprovalTimes.length) * 100;
  const overTarget = pendingDocs.filter(doc => doc.daysPending > 10).length;
  
  console.log('\n=== Document Control KPI Summary ===');
  console.log(`Total Documents: ${createdDocuments.length}`);
  console.log(`Pending Approval: ${pendingDocs.length}`);
  console.log(`Average Approval Time: ${avgApprovalTime.toFixed(1)} days`);
  console.log(`Target Compliance (≤10 days): ${compliance.toFixed(1)}%`);
  console.log(`Documents Over Target: ${overTarget}`);
  console.log(`Critical Documents (>10 days pending): ${pendingDocs.filter(doc => doc.daysPending > 10).map(doc => doc.title).join(', ')}`);
  
  return createdDocuments;
}