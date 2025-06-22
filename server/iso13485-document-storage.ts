/**
 * ISO 13485 Compliant Document Control Storage
 * Enhanced storage layer for comprehensive document management including SOPs, work instructions, forms, and quality manual
 */

import { db } from './db';
import { eq, and, desc, asc, like, or, inArray, sql, count } from 'drizzle-orm';
import { 
  documents, 
  documentCategories, 
  iso13485DocumentTypes, 
  iso13485Requirements,
  documentVersions,
  documentAccess,
  documentTraining,
  documentDistribution,
  documentChangeRequests,
  users
} from '../shared/schema';

export interface ISO13485DocumentFilter {
  category?: string;
  type?: string;
  status?: string;
  department?: string;
  owner?: number;
  search?: string;
  isObsolete?: boolean;
  trainingRequired?: boolean;
}

export interface ISO13485Document {
  id: number;
  documentNumber: string;
  title: string;
  typeId: number;
  status: string;
  version: string;
  revisionLevel: number;
  effectiveDate: Date | null;
  reviewDate: Date | null;
  nextReviewDate: Date | null;
  owner: number;
  department: string;
  purpose: string | null;
  scope: string | null;
  content: string | null;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  confidentialityLevel: string;
  distributionList: any;
  isControlled: boolean;
  isObsolete: boolean;
  keywords: string | null;
  relatedDocuments: any;
  trainingRequired: boolean;
  iso13485Clause: string | null;
  createdBy: number;
  approvedBy: number | null;
  approvedAt: Date | null;
  lastModifiedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  typeName?: string;
  categoryName?: string;
  ownerName?: string;
  approverName?: string;
}

export class ISO13485DocumentControlStorage {
  
  // Initialize default categories and types
  async initializeISO13485Structure() {
    try {
      // Create document categories
      const categories = [
        { code: 'QM', name: 'Quality Manual', description: 'Top-level quality management system documentation', prefix: 'QM-', isRequired: true, reviewFrequency: 12, retentionPeriod: 10, sortOrder: 1 },
        { code: 'SOP', name: 'Standard Operating Procedures', description: 'Detailed procedures for routine operations', prefix: 'SOP-', isRequired: true, reviewFrequency: 24, retentionPeriod: 7, sortOrder: 2 },
        { code: 'WI', name: 'Work Instructions', description: 'Step-by-step instructions for specific tasks', prefix: 'WI-', isRequired: true, reviewFrequency: 24, retentionPeriod: 7, sortOrder: 3 },
        { code: 'FORM', name: 'Forms', description: 'Templates and forms for data collection', prefix: 'FORM-', isRequired: true, reviewFrequency: 36, retentionPeriod: 5, sortOrder: 4 },
        { code: 'PROC', name: 'Procedures', description: 'Process procedures and protocols', prefix: 'PROC-', isRequired: true, reviewFrequency: 24, retentionPeriod: 7, sortOrder: 5 },
        { code: 'POL', name: 'Policies', description: 'Organizational policies and guidelines', prefix: 'POL-', isRequired: false, reviewFrequency: 36, retentionPeriod: 10, sortOrder: 6 },
        { code: 'SPEC', name: 'Specifications', description: 'Technical specifications and requirements', prefix: 'SPEC-', isRequired: false, reviewFrequency: 24, retentionPeriod: 10, sortOrder: 7 },
        { code: 'PLAN', name: 'Plans', description: 'Planning documents and strategies', prefix: 'PLAN-', isRequired: false, reviewFrequency: 12, retentionPeriod: 7, sortOrder: 8 }
      ];

      for (const category of categories) {
        await db.insert(documentCategories).values(category).onConflictDoNothing();
      }

      // Get category IDs
      const createdCategories = await db.select().from(documentCategories);
      const categoryMap = new Map(createdCategories.map(cat => [cat.code, cat.id]));

      // Create document types based on ISO 13485 requirements
      const documentTypes = [
        // Quality Manual
        { categoryId: categoryMap.get('QM')!, code: 'QM-001', name: 'Quality Manual', description: 'Main quality manual document', template: '', requiredSections: ['scope', 'references', 'definitions', 'qms'], approvalWorkflow: ['qa_manager', 'top_management'], isActive: true, sortOrder: 1 },
        
        // SOPs
        { categoryId: categoryMap.get('SOP')!, code: 'SOP-DOC', name: 'Document Control SOP', description: 'Standard operating procedure for document control', template: '', requiredSections: ['purpose', 'scope', 'procedure', 'responsibilities'], approvalWorkflow: ['qa_manager'], isActive: true, sortOrder: 1 },
        { categoryId: categoryMap.get('SOP')!, code: 'SOP-DES', name: 'Design Control SOP', description: 'Standard operating procedure for design controls', template: '', requiredSections: ['purpose', 'scope', 'procedure', 'responsibilities'], approvalWorkflow: ['qa_manager'], isActive: true, sortOrder: 2 },
        { categoryId: categoryMap.get('SOP')!, code: 'SOP-MR', name: 'Management Review SOP', description: 'Standard operating procedure for management review', template: '', requiredSections: ['purpose', 'scope', 'procedure', 'responsibilities'], approvalWorkflow: ['qa_manager'], isActive: true, sortOrder: 3 },
        { categoryId: categoryMap.get('SOP')!, code: 'SOP-CAPA', name: 'CAPA SOP', description: 'Standard operating procedure for corrective and preventive actions', template: '', requiredSections: ['purpose', 'scope', 'procedure', 'responsibilities'], approvalWorkflow: ['qa_manager'], isActive: true, sortOrder: 4 },
        { categoryId: categoryMap.get('SOP')!, code: 'SOP-INC', name: 'Incident Management SOP', description: 'Standard operating procedure for incident management', template: '', requiredSections: ['purpose', 'scope', 'procedure', 'responsibilities'], approvalWorkflow: ['qa_manager'], isActive: true, sortOrder: 5 },
        
        // Work Instructions
        { categoryId: categoryMap.get('WI')!, code: 'WI-DOC', name: 'Document Creation Work Instruction', description: 'Step-by-step instructions for creating documents', template: '', requiredSections: ['purpose', 'materials', 'procedure', 'records'], approvalWorkflow: ['supervisor'], isActive: true, sortOrder: 1 },
        { categoryId: categoryMap.get('WI')!, code: 'WI-APP', name: 'Document Approval Work Instruction', description: 'Step-by-step instructions for document approval', template: '', requiredSections: ['purpose', 'materials', 'procedure', 'records'], approvalWorkflow: ['supervisor'], isActive: true, sortOrder: 2 },
        
        // Forms
        { categoryId: categoryMap.get('FORM')!, code: 'FORM-CHG', name: 'Document Change Request Form', description: 'Form for requesting document changes', template: '', requiredSections: ['header', 'change_details', 'justification', 'approval'], approvalWorkflow: ['qa'], isActive: true, sortOrder: 1 },
        { categoryId: categoryMap.get('FORM')!, code: 'FORM-TRN', name: 'Training Record Form', description: 'Form for recording training completion', template: '', requiredSections: ['header', 'training_details', 'completion', 'signature'], approvalWorkflow: ['trainer'], isActive: true, sortOrder: 2 },
      ];

      for (const docType of documentTypes) {
        await db.insert(iso13485DocumentTypes).values(docType).onConflictDoNothing();
      }

      // Initialize ISO 13485 required documents checklist
      const iso13485Reqs = [
        { clause: '4.2.3', requirement: 'Control of documents', documentType: 'SOP', title: 'Document Control Procedure', description: 'Procedure for controlling quality system documents', priority: 'HIGH' },
        { clause: '5.1', requirement: 'Management commitment', documentType: 'POL', title: 'Quality Policy', description: 'Top management quality policy statement', priority: 'HIGH' },
        { clause: '5.3', requirement: 'Quality policy', documentType: 'POL', title: 'Quality Policy Implementation', description: 'Implementation of quality policy throughout organization', priority: 'HIGH' },
        { clause: '5.4.1', requirement: 'Quality objectives', documentType: 'PLAN', title: 'Quality Objectives and Planning', description: 'Establishment and review of quality objectives', priority: 'HIGH' },
        { clause: '5.5.2', requirement: 'Management representative', documentType: 'PROC', title: 'Management Representative Appointment', description: 'Appointment and responsibilities of management representative', priority: 'HIGH' },
        { clause: '5.6', requirement: 'Management review', documentType: 'SOP', title: 'Management Review Procedure', description: 'Systematic review of QMS by top management', priority: 'HIGH' },
        { clause: '6.2.2', requirement: 'Competence, training and awareness', documentType: 'SOP', title: 'Training and Competency Procedure', description: 'Ensuring competence of personnel', priority: 'HIGH' },
        { clause: '7.1', requirement: 'Planning of product realization', documentType: 'PLAN', title: 'Product Realization Planning', description: 'Planning processes for product realization', priority: 'HIGH' },
        { clause: '7.3.1', requirement: 'Design and development planning', documentType: 'SOP', title: 'Design Control Procedure', description: 'Planning and control of design and development', priority: 'HIGH' },
        { clause: '7.3.2', requirement: 'Design and development inputs', documentType: 'FORM', title: 'Design Input Form', description: 'Capture of design and development inputs', priority: 'HIGH' },
        { clause: '7.3.3', requirement: 'Design and development outputs', documentType: 'FORM', title: 'Design Output Form', description: 'Documentation of design and development outputs', priority: 'HIGH' },
        { clause: '7.3.4', requirement: 'Design and development review', documentType: 'FORM', title: 'Design Review Form', description: 'Systematic review of design and development', priority: 'HIGH' },
        { clause: '7.3.5', requirement: 'Design and development verification', documentType: 'FORM', title: 'Design Verification Form', description: 'Verification of design and development', priority: 'HIGH' },
        { clause: '7.3.6', requirement: 'Design and development validation', documentType: 'FORM', title: 'Design Validation Form', description: 'Validation of design and development', priority: 'HIGH' },
        { clause: '7.3.7', requirement: 'Control of design and development changes', documentType: 'SOP', title: 'Design Change Control Procedure', description: 'Control of changes to design and development', priority: 'HIGH' },
        { clause: '8.2.1', requirement: 'Customer satisfaction', documentType: 'SOP', title: 'Customer Satisfaction Monitoring Procedure', description: 'Monitoring customer satisfaction', priority: 'MEDIUM' },
        { clause: '8.2.2', requirement: 'Internal audit', documentType: 'SOP', title: 'Internal Audit Procedure', description: 'Planning and conducting internal audits', priority: 'HIGH' },
        { clause: '8.3', requirement: 'Control of nonconforming product', documentType: 'SOP', title: 'Nonconforming Product Control Procedure', description: 'Control of nonconforming product', priority: 'HIGH' },
        { clause: '8.4', requirement: 'Analysis of data', documentType: 'SOP', title: 'Data Analysis Procedure', description: 'Analysis of data for QMS effectiveness', priority: 'MEDIUM' },
        { clause: '8.5.2', requirement: 'Corrective action', documentType: 'SOP', title: 'Corrective Action Procedure', description: 'Elimination of causes of nonconformities', priority: 'HIGH' },
        { clause: '8.5.3', requirement: 'Preventive action', documentType: 'SOP', title: 'Preventive Action Procedure', description: 'Elimination of causes of potential nonconformities', priority: 'HIGH' },
      ];

      for (const req of iso13485Reqs) {
        await db.insert(iso13485Requirements).values(req).onConflictDoNothing();
      }

      return { success: true, message: 'ISO 13485 document structure initialized successfully' };
    } catch (error) {
      console.error('Error initializing ISO 13485 structure:', error);
      return { success: false, error: 'Failed to initialize ISO 13485 structure' };
    }
  }

  // Get all documents with enhanced filtering
  async getDocuments(filter: ISO13485DocumentFilter = {}): Promise<ISO13485Document[]> {
    try {
      let query = db
        .select({
          id: documents.id,
          documentNumber: documents.documentNumber,
          title: documents.title,
          typeId: documents.typeId,
          status: documents.status,
          version: documents.version,
          revisionLevel: documents.revisionLevel,
          effectiveDate: documents.effectiveDate,
          reviewDate: documents.reviewDate,
          nextReviewDate: documents.nextReviewDate,
          owner: documents.owner,
          department: documents.department,
          purpose: documents.purpose,
          scope: documents.scope,
          content: documents.content,
          filePath: documents.filePath,
          fileName: documents.fileName,
          fileSize: documents.fileSize,
          fileType: documents.fileType,
          confidentialityLevel: documents.confidentialityLevel,
          distributionList: documents.distributionList,
          isControlled: documents.isControlled,
          isObsolete: documents.isObsolete,
          keywords: documents.keywords,
          relatedDocuments: documents.relatedDocuments,
          trainingRequired: documents.trainingRequired,
          iso13485Clause: documents.iso13485Clause,
          createdBy: documents.createdBy,
          approvedBy: documents.approvedBy,
          approvedAt: documents.approvedAt,
          lastModifiedBy: documents.lastModifiedBy,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
          typeName: iso13485DocumentTypes.name,
          categoryName: documentCategories.name,
          ownerName: users.firstName,
        })
        .from(documents)
        .leftJoin(iso13485DocumentTypes, eq(documents.typeId, iso13485DocumentTypes.id))
        .leftJoin(documentCategories, eq(iso13485DocumentTypes.categoryId, documentCategories.id))
        .leftJoin(users, eq(documents.owner, users.id));

      // Apply filters
      if (filter.status) {
        query = query.where(eq(documents.status, filter.status));
      }
      if (filter.department) {
        query = query.where(eq(documents.department, filter.department));
      }
      if (filter.owner) {
        query = query.where(eq(documents.owner, filter.owner));
      }
      if (filter.isObsolete !== undefined) {
        query = query.where(eq(documents.isObsolete, filter.isObsolete));
      }
      if (filter.search) {
        query = query.where(
          or(
            like(documents.title, `%${filter.search}%`),
            like(documents.documentNumber, `%${filter.search}%`),
            like(documents.keywords, `%${filter.search}%`)
          )
        );
      }

      const result = await query.orderBy(desc(documents.updatedAt));
      return result as ISO13485Document[];
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Get document categories
  async getDocumentCategories() {
    try {
      return await db.select().from(documentCategories).orderBy(asc(documentCategories.sortOrder));
    } catch (error) {
      console.error('Error getting document categories:', error);
      throw error;
    }
  }

  // Get document types by category
  async getDocumentTypes(categoryId?: number) {
    try {
      let query = db.select().from(iso13485DocumentTypes);
      
      if (categoryId) {
        query = query.where(eq(iso13485DocumentTypes.categoryId, categoryId));
      }
      
      return await query.orderBy(asc(iso13485DocumentTypes.sortOrder));
    } catch (error) {
      console.error('Error getting document types:', error);
      throw error;
    }
  }

  // Get ISO 13485 requirements compliance status
  async getISO13485Compliance() {
    try {
      const requirements = await db
        .select({
          id: iso13485Requirements.id,
          clause: iso13485Requirements.clause,
          requirement: iso13485Requirements.requirement,
          documentType: iso13485Requirements.documentType,
          title: iso13485Requirements.title,
          description: iso13485Requirements.description,
          isImplemented: iso13485Requirements.isImplemented,
          documentId: iso13485Requirements.documentId,
          priority: iso13485Requirements.priority,
          dueDate: iso13485Requirements.dueDate,
          documentNumber: documents.documentNumber,
          documentTitle: documents.title,
          documentStatus: documents.status,
        })
        .from(iso13485Requirements)
        .leftJoin(documents, eq(iso13485Requirements.documentId, documents.id))
        .orderBy(asc(iso13485Requirements.clause));

      // Calculate compliance statistics
      const total = requirements.length;
      const implemented = requirements.filter(req => req.isImplemented).length;
      const pending = total - implemented;
      const complianceRate = total > 0 ? (implemented / total) * 100 : 0;

      return {
        requirements,
        statistics: {
          total,
          implemented,
          pending,
          complianceRate: Math.round(complianceRate * 100) / 100
        }
      };
    } catch (error) {
      console.error('Error getting ISO 13485 compliance:', error);
      throw error;
    }
  }

  // Generate document number based on type
  async generateDocumentNumber(typeId: number): Promise<string> {
    try {
      const docType = await db
        .select({ prefix: documentCategories.prefix })
        .from(iso13485DocumentTypes)
        .leftJoin(documentCategories, eq(iso13485DocumentTypes.categoryId, documentCategories.id))
        .where(eq(iso13485DocumentTypes.id, typeId))
        .limit(1);

      if (!docType[0]) {
        throw new Error('Document type not found');
      }

      const prefix = docType[0].prefix || 'DOC-';
      
      // Get the next sequence number
      const lastDoc = await db
        .select({ documentNumber: documents.documentNumber })
        .from(documents)
        .where(like(documents.documentNumber, `${prefix}%`))
        .orderBy(desc(documents.documentNumber))
        .limit(1);

      let nextNumber = 1;
      if (lastDoc[0]) {
        const lastNumber = parseInt(lastDoc[0].documentNumber.replace(prefix, ''));
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating document number:', error);
      throw error;
    }
  }

  // Get document by ID with full details
  async getDocumentById(id: number): Promise<ISO13485Document | null> {
    try {
      const result = await db
        .select({
          id: documents.id,
          documentNumber: documents.documentNumber,
          title: documents.title,
          typeId: documents.typeId,
          status: documents.status,
          version: documents.version,
          revisionLevel: documents.revisionLevel,
          effectiveDate: documents.effectiveDate,
          reviewDate: documents.reviewDate,
          nextReviewDate: documents.nextReviewDate,
          owner: documents.owner,
          department: documents.department,
          purpose: documents.purpose,
          scope: documents.scope,
          content: documents.content,
          filePath: documents.filePath,
          fileName: documents.fileName,
          fileSize: documents.fileSize,
          fileType: documents.fileType,
          confidentialityLevel: documents.confidentialityLevel,
          distributionList: documents.distributionList,
          isControlled: documents.isControlled,
          isObsolete: documents.isObsolete,
          keywords: documents.keywords,
          relatedDocuments: documents.relatedDocuments,
          trainingRequired: documents.trainingRequired,
          iso13485Clause: documents.iso13485Clause,
          createdBy: documents.createdBy,
          approvedBy: documents.approvedBy,
          approvedAt: documents.approvedAt,
          lastModifiedBy: documents.lastModifiedBy,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
          typeName: iso13485DocumentTypes.name,
          categoryName: documentCategories.name,
          ownerName: users.firstName,
        })
        .from(documents)
        .leftJoin(iso13485DocumentTypes, eq(documents.typeId, iso13485DocumentTypes.id))
        .leftJoin(documentCategories, eq(iso13485DocumentTypes.categoryId, documentCategories.id))
        .leftJoin(users, eq(documents.owner, users.id))
        .where(eq(documents.id, id))
        .limit(1);

      return result[0] as ISO13485Document || null;
    } catch (error) {
      console.error('Error getting document by ID:', error);
      throw error;
    }
  }
}

export const iso13485DocumentStorage = new ISO13485DocumentControlStorage();