import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, decimal, pgEnum, varchar } from "drizzle-orm/pg-core";
import { relations, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("viewer"), // admin, manager, qa, viewer
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier Management
export const supplierCategories = pgTable("supplier_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const supplierStatuses = pgTable("supplier_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  supplierId: text("supplier_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull().references(() => supplierCategories.id),
  statusId: integer("status_id").notNull().references(() => supplierStatuses.id),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  postalCode: text("postal_code"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  website: text("website"),
  criticality: text("criticality").notNull(), // Critical, Major, Minor
  initialRiskLevel: text("initial_risk_level").notNull(), // High, Medium, Low
  currentRiskLevel: text("current_risk_level"), // Updated based on audits and performance
  qualificationDate: timestamp("qualification_date"),
  requalificationDate: timestamp("requalification_date"),
  hasQualityAgreement: boolean("has_quality_agreement").default(false),
  hasNda: boolean("has_nda").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  archivedBy: integer("archived_by").references(() => users.id),
  archivedAt: timestamp("archived_at"),
  isArchived: boolean("is_archived").default(false),
});

export const supplierCertifications = pgTable("supplier_certifications", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  name: text("name").notNull(),
  certificationNumber: text("certification_number"),
  issuingBody: text("issuing_body"),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  documentUrl: text("document_url"),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const supplierProductCategories = pgTable("supplier_product_categories", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  categoryName: text("category_name").notNull(),
  addedBy: integer("added_by").notNull().references(() => users.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const supplierAuditTrail = pgTable("supplier_audit_trail", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  action: text("action").notNull(), // created, updated, archived, restored
  field: text("field"), // specific field that was changed
  oldValue: text("old_value"),
  newValue: text("new_value"),
  userId: integer("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// Supplier Assessments
export const supplierAssessments = pgTable("supplier_assessments", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  assessmentType: text("assessment_type").notNull(), // Audit, Survey, Performance Review, Risk Assessment, Regulatory Reportability
  scheduledDate: timestamp("scheduled_date").notNull(),
  conductedDate: timestamp("conducted_date"),
  status: text("status").notNull(), // Scheduled, In Progress, Completed, Cancelled
  score: integer("score"), // 0-100 or null if not scored
  findings: text("findings"),
  suggestions: text("suggestions"), // Added suggestions field for improvement recommendations
  attachmentUrls: text("attachment_urls").array(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedBy: integer("completed_by").references(() => users.id),
});

// Regulatory Reportability Decision Tree
export const regulatoryReportabilityAssessments = pgTable("regulatory_reportability_assessments", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  assessmentId: integer("assessment_id").references(() => supplierAssessments.id),
  incidentDate: timestamp("incident_date").notNull(),
  productInvolved: text("product_involved").notNull(),
  incidentDescription: text("incident_description").notNull(),
  isFieldAction: boolean("is_field_action").default(false),
  isDeviceFailure: boolean("is_device_failure").default(false),
  isAdverseEvent: boolean("is_adverse_event").default(false),
  patientHarm: text("patient_harm").notNull(), // None, Minor, Serious, Death
  reportabilityDecision: text("reportability_decision"), // Reportable, Not Reportable, Undetermined
  reportabilityJustification: text("reportability_justification"),
  decisionTreePath: json("decision_tree_path"), // Stores the path taken through the decision tree
  regulatoryAuthorities: text("regulatory_authorities").array(), // FDA, EU MDR, UK MHRA, etc.
  reportingDeadline: timestamp("reporting_deadline"),
  reportedDate: timestamp("reported_date"),
  reportNumbers: json("report_numbers"), // {FDA: "123456", EU: "MDR-2025-0001"}
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    department: true,
  })
  .extend({
    username: z.string().min(3).max(50),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    email: z.string().email(),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    role: z.enum(["admin", "manager", "qa", "viewer"]),
    department: z.string().min(1).max(100)
  });
  
// Create insert schema for supplier assessments
export const insertSupplierAssessmentSchema = createInsertSchema(supplierAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  conductedDate: z.string().or(z.date()).optional().nullable().transform(val => 
    typeof val === 'string' && val ? new Date(val) : val
  ),
  suggestions: z.string().optional(),
});

// Create insert schema for regulatory reportability assessments
export const insertRegulatoryReportabilitySchema = createInsertSchema(regulatoryReportabilityAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  incidentDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  reportingDeadline: z.string().or(z.date()).optional().nullable().transform(val => 
    typeof val === 'string' && val ? new Date(val) : val
  ),
  reportedDate: z.string().or(z.date()).optional().nullable().transform(val => 
    typeof val === 'string' && val ? new Date(val) : val
  ),
});

// Define types for Supplier Assessments - already defined below

// Relations for supplier assessments
export const supplierAssessmentRelations = relations(supplierAssessments, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierAssessments.supplierId],
    references: [suppliers.id],
  }),
  createdByUser: one(users, {
    fields: [supplierAssessments.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [supplierAssessments.updatedBy],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [supplierAssessments.completedBy],
    references: [users.id],
  }),
}));

// Relations for regulatory reportability assessments
export const regulatoryReportabilityRelations = relations(regulatoryReportabilityAssessments, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [regulatoryReportabilityAssessments.supplierId],
    references: [suppliers.id],
  }),
  assessment: one(supplierAssessments, {
    fields: [regulatoryReportabilityAssessments.assessmentId],
    references: [supplierAssessments.id],
  }),
  createdByUser: one(users, {
    fields: [regulatoryReportabilityAssessments.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [regulatoryReportabilityAssessments.updatedBy],
    references: [users.id],
  }),
}));

// Define User types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Define Regulatory Reportability types
export type RegulatoryReportabilityAssessment = typeof regulatoryReportabilityAssessments.$inferSelect;
export type InsertRegulatoryReportabilityAssessment = z.infer<typeof insertRegulatoryReportabilitySchema>;
// This is a duplicate type definition, already defined elsewhere

// Document Control - Legacy tables (will be replaced by enhanced ISO 13485 structure)
export const documentStatuses = pgTable("document_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// ISO 13485 Document Control System - Categories and Types
export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // QM, SOP, WI, FORM, PROC, POL
  name: text("name").notNull(),
  description: text("description"),
  prefix: text("prefix").notNull(), // For document numbering (e.g., SOP-, WI-, FORM-)
  isRequired: boolean("is_required").default(false), // ISO 13485 required documents
  reviewFrequency: integer("review_frequency"), // In months
  retentionPeriod: integer("retention_period"), // In years
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const iso13485DocumentTypes = pgTable("iso13485_document_types", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => documentCategories.id),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  template: text("template"), // Standard template content
  requiredSections: json("required_sections"), // JSON array of required sections
  approvalWorkflow: json("approval_workflow"), // JSON workflow definition
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ISO 13485 Required Documents Master List
export const iso13485Requirements = pgTable("iso13485_requirements", {
  id: serial("id").primaryKey(),
  clause: text("clause").notNull(), // 4.2.3, 7.3.2, etc.
  requirement: text("requirement").notNull(),
  documentType: text("document_type").notNull(), // SOP, WI, FORM, RECORD
  title: text("title").notNull(),
  description: text("description"),
  isImplemented: boolean("is_implemented").default(false),
  documentId: integer("document_id").references(() => documents.id),
  priority: text("priority").default("HIGH"), // HIGH, MEDIUM, LOW
  dueDate: timestamp("due_date"),
  implementationNotes: text("implementation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  documentId: text("document_id"), // Business identifier
  typeId: integer("type_id").notNull(),
  statusId: integer("status_id"),
  revision: text("revision").notNull(),
  filePath: text("file_path"),
  createdBy: integer("created_by").notNull(),
  approvedBy: integer("approved_by"),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Additional columns that exist in the actual database
  documentNumber: text("document_number"),
  status: text("status"),
  type: text("type"),
  version: text("version"),
  approvedAt: timestamp("approved_at"),
  nextReviewDate: timestamp("next_review_date"),
  department: text("department"),
  tags: text("tags").array(),
  content: text("content"),
  revisionLevel: integer("revision_level"),
  reviewDate: timestamp("review_date"),
  supersededBy: integer("superseded_by"),
  supersedes: integer("supersedes"),
  owner: integer("owner"),
  purpose: text("purpose"),
  scope: text("scope"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  checksum: text("checksum"),
  confidentialityLevel: text("confidentiality_level"),
  distributionList: json("distribution_list"),
  isControlled: boolean("is_controlled"),
  isObsolete: boolean("is_obsolete"),
  keywords: text("keywords"),
  relatedDocuments: json("related_documents"),
  trainingRequired: boolean("training_required"),
  iso13485Clause: text("iso13485_clause"),
  lastModifiedBy: integer("last_modified_by"),
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  version: text("version").notNull(),
  revisionLevel: integer("revision_level").notNull(),
  content: text("content"),
  filePath: text("file_path"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  changeDescription: text("change_description").notNull(),
  changeReason: text("change_reason").notNull(),
  isArchived: boolean("is_archived").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Document Access Control and Training Requirements
export const documentAccess = pgTable("document_access", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role"), // For role-based access
  department: text("department"), // For department-based access
  accessType: text("access_type").notNull(), // READ, EDIT, APPROVE
  grantedBy: integer("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const documentTraining = pgTable("document_training", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  userId: integer("user_id").notNull().references(() => users.id),
  trainedBy: integer("trained_by").notNull().references(() => users.id),
  trainingDate: timestamp("training_date").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  isCompleted: boolean("is_completed").default(false),
  notes: text("notes"),
});

// Organizational Approval Matrix
export const organizationalApprovalMatrix = pgTable("organizational_approval_matrix", {
  id: serial("id").primaryKey(),
  structureId: integer("structure_id").notNull().references(() => organizationalStructure.id),
  documentType: text("document_type").notNull(),
  approvalLevel: integer("approval_level").notNull(),
  canApprove: boolean("can_approve").default(false),
  canReview: boolean("can_review").default(false),
  canDelegate: boolean("can_delegate").default(false),
  approvalLimit: decimal("approval_limit", { precision: 15, scale: 2 }),
  requiresSignature: boolean("requires_signature").default(false),
  escalationDays: integer("escalation_days").default(5),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Approval Workflow - Links to Organizational Approval Matrix
export const documentApprovalWorkflow = pgTable("document_approval_workflow", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  approvalMatrixId: integer("approval_matrix_id").notNull(),
  currentApprovalLevel: integer("current_approval_level").default(1),
  status: text("status").notNull().default("PENDING"), // PENDING, IN_PROGRESS, APPROVED, REJECTED, ESCALATED
  initiatedBy: integer("initiated_by").notNull().references(() => users.id),
  initiatedAt: timestamp("initiated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
  escalationReason: text("escalation_reason"),
  documentVersion: text("document_version").notNull(),
  workflowMetadata: json("workflow_metadata"), // Additional workflow data
});

export const documentApprovalSteps = pgTable("document_approval_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => documentApprovalWorkflow.id),
  approvalLevel: integer("approval_level").notNull(),
  assignedToStructureId: integer("assigned_to_structure_id").notNull().references(() => organizationalStructure.id),
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED, DELEGATED
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  comments: text("comments"),
  rejectionReason: text("rejection_reason"),
  isDelegated: boolean("is_delegated").default(false),
  delegatedTo: integer("delegated_to").references(() => organizationalStructure.id),
  delegatedBy: integer("delegated_by").references(() => users.id),
  delegatedAt: timestamp("delegated_at"),
  remindersSent: integer("reminders_sent").default(0),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Distribution and Controlled Copy Management
export const documentDistribution = pgTable("document_distribution", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  copyNumber: text("copy_number").notNull(), // Controlled copy number
  distributedTo: integer("distributed_to").notNull().references(() => users.id),
  distributionMethod: text("distribution_method").notNull(), // ELECTRONIC, HARDCOPY
  distributedBy: integer("distributed_by").notNull().references(() => users.id),
  distributedAt: timestamp("distributed_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  returnedAt: timestamp("returned_at"),
  status: text("status").default("ACTIVE"), // ACTIVE, RETURNED, OBSOLETE
});

// Document Change Control
export const documentChangeRequests = pgTable("document_change_requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  requestType: text("request_type").notNull(), // REVISION, SUPERSEDE, OBSOLETE
  title: text("title").notNull(),
  description: text("description").notNull(),
  justification: text("justification").notNull(),
  urgency: text("urgency").default("NORMAL"), // URGENT, HIGH, NORMAL, LOW
  impactAssessment: text("impact_assessment"),
  proposedChanges: json("proposed_changes"), // JSON array of specific changes
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  status: text("status").default("SUBMITTED"), // SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, IMPLEMENTED
  requestDate: timestamp("request_date").defaultNow().notNull(),
  targetImplementationDate: timestamp("target_implementation_date"),
  actualImplementationDate: timestamp("actual_implementation_date"),
  reviewComments: text("review_comments"),
  approvalComments: text("approval_comments"),
});

// Technical Documentation Module - EU MDR Compliant System

export const technicalDocuments = pgTable("technical_documents", {
  id: serial("id").primaryKey(),
  designProjectId: integer("design_project_id").references(() => designProjects.id),
  title: text("title").notNull(),
  deviceModel: text("device_model").notNull(),
  documentNumber: text("document_number").notNull().unique(),
  status: text("status").notNull().default("DRAFT"), // DRAFT, IN_REVIEW, APPROVED, SUPERSEDED
  version: text("version").notNull().default("1.0"),
  revisionLevel: integer("revision_level").default(0),
  compiledPdfPath: text("compiled_pdf_path"),
  euRepresentative: text("eu_representative"),
  manufacturerInfo: json("manufacturer_info"),
  deviceIdentification: json("device_identification"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// MDR Annex II & III Section Structure
export const mdrSections = pgTable("mdr_sections", {
  id: serial("id").primaryKey(),
  sectionNumber: text("section_number").notNull().unique(), // 1, 2, 3.1, 4.2, etc.
  title: text("title").notNull(),
  description: text("description"),
  annexReference: text("annex_reference").notNull(), // Annex II, Annex III
  isRequired: boolean("is_required").default(true),
  parentSectionId: integer("parent_section_id").references(() => mdrSections.id),
  sortOrder: integer("sort_order").default(0),
  template: text("template"), // Default template content
  guidance: text("guidance"), // Guidance text for users
});

export const technicalDocumentSections = pgTable("technical_document_sections", {
  id: serial("id").primaryKey(),
  techDocId: integer("tech_doc_id").notNull().references(() => technicalDocuments.id),
  sectionId: integer("section_id").notNull().references(() => mdrSections.id),
  sectionNumber: text("section_number").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  autoLinked: boolean("auto_linked").default(false),
  sourceType: text("source_type"), // MANUAL, DESIGN_OUTPUT, RISK_ANALYSIS, CLINICAL_DATA
  sourceId: integer("source_id"), // Reference to source data
  completionStatus: text("completion_status").default("NOT_STARTED"), // NOT_STARTED, IN_PROGRESS, COMPLETED, REVIEWED
  lastSynced: timestamp("last_synced"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const technicalDocumentAttachments = pgTable("technical_document_attachments", {
  id: serial("id").primaryKey(),
  techDocId: integer("tech_doc_id").notNull().references(() => technicalDocuments.id),
  sectionId: integer("section_id").references(() => mdrSections.id),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  description: text("description"),
  category: text("category"), // LABELING, CLINICAL_EVIDENCE, MANUFACTURING, RISK_ANALYSIS
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Cross-referencing system for design control integration
export const technicalDocumentReferences = pgTable("technical_document_references", {
  id: serial("id").primaryKey(),
  techDocId: integer("tech_doc_id").notNull().references(() => technicalDocuments.id),
  sectionId: integer("section_id").notNull().references(() => mdrSections.id),
  referenceType: text("reference_type").notNull(), // DESIGN_INPUT, DESIGN_OUTPUT, RISK_RECORD, CLINICAL_DATA
  referenceId: integer("reference_id").notNull(),
  referenceTitle: text("reference_title"),
  automaticallyLinked: boolean("automatically_linked").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Approval workflow for technical documentation
export const technicalDocumentApprovalWorkflow = pgTable("technical_document_approval_workflow", {
  id: serial("id").primaryKey(),
  techDocId: integer("tech_doc_id").notNull().references(() => technicalDocuments.id),
  currentStep: integer("current_step").default(1),
  status: text("status").notNull().default("PENDING"), // PENDING, IN_PROGRESS, APPROVED, REJECTED
  submittedBy: integer("submitted_by").notNull().references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
});

export const technicalDocumentApprovalSteps = pgTable("technical_document_approval_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => technicalDocumentApprovalWorkflow.id),
  stepNumber: integer("step_number").notNull(),
  assignedTo: integer("assigned_to").notNull().references(() => users.id),
  stepType: text("step_type").notNull(), // REVIEW, APPROVE, FINAL_APPROVAL
  status: text("status").notNull().default("PENDING"), // PENDING, COMPLETED, REJECTED, DELEGATED
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),
  comments: text("comments"),
  isDelegated: boolean("is_delegated").default(false),
  delegatedTo: integer("delegated_to").references(() => users.id),
  delegatedBy: integer("delegated_by").references(() => users.id),
  delegatedAt: timestamp("delegated_at"),
});

// Version control for technical documentation
export const technicalDocumentVersions = pgTable("technical_document_versions", {
  id: serial("id").primaryKey(),
  techDocId: integer("tech_doc_id").notNull().references(() => technicalDocuments.id),
  version: text("version").notNull(),
  revisionLevel: integer("revision_level").notNull(),
  changeDescription: text("change_description").notNull(),
  changeReason: text("change_reason").notNull(),
  sectionsSnapshot: json("sections_snapshot"), // JSON snapshot of all sections at this version
  attachmentsSnapshot: json("attachments_snapshot"), // JSON snapshot of attachments
  compiledPdfPath: text("compiled_pdf_path"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isArchived: boolean("is_archived").default(false),
});

// Technical Documentation Types
export type TechnicalDocument = typeof technicalDocuments.$inferSelect;
export type InsertTechnicalDocument = typeof technicalDocuments.$inferInsert;
export type MdrSection = typeof mdrSections.$inferSelect;
export type InsertMdrSection = typeof mdrSections.$inferInsert;
export type TechnicalDocumentSection = typeof technicalDocumentSections.$inferSelect;
export type InsertTechnicalDocumentSection = typeof technicalDocumentSections.$inferInsert;
export type TechnicalDocumentAttachment = typeof technicalDocumentAttachments.$inferSelect;
export type InsertTechnicalDocumentAttachment = typeof technicalDocumentAttachments.$inferInsert;
export type TechnicalDocumentReference = typeof technicalDocumentReferences.$inferSelect;
export type InsertTechnicalDocumentReference = typeof technicalDocumentReferences.$inferInsert;
export type TechnicalDocumentApprovalWorkflow = typeof technicalDocumentApprovalWorkflow.$inferSelect;
export type InsertTechnicalDocumentApprovalWorkflow = typeof technicalDocumentApprovalWorkflow.$inferInsert;
export type TechnicalDocumentApprovalStep = typeof technicalDocumentApprovalSteps.$inferSelect;
export type InsertTechnicalDocumentApprovalStep = typeof technicalDocumentApprovalSteps.$inferInsert;
export type TechnicalDocumentVersion = typeof technicalDocumentVersions.$inferSelect;
export type InsertTechnicalDocumentVersion = typeof technicalDocumentVersions.$inferInsert;

// Create insert schemas for validation
export const insertTechnicalDocumentSchema = createInsertSchema(technicalDocuments);
export const insertMdrSectionSchema = createInsertSchema(mdrSections);
export const insertTechnicalDocumentSectionSchema = createInsertSchema(technicalDocumentSections);
export const insertTechnicalDocumentAttachmentSchema = createInsertSchema(technicalDocumentAttachments);
export const insertTechnicalDocumentReferenceSchema = createInsertSchema(technicalDocumentReferences);
export const insertTechnicalDocumentApprovalWorkflowSchema = createInsertSchema(technicalDocumentApprovalWorkflow);
export const insertTechnicalDocumentApprovalStepSchema = createInsertSchema(technicalDocumentApprovalSteps);
export const insertTechnicalDocumentVersionSchema = createInsertSchema(technicalDocumentVersions);

// Training Records System - tables will be defined after all other tables

// Document Revisions System
export const documentRevisions = pgTable("document_revisions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  revisionNumber: text("revision_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  changeDescription: text("change_description").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvalStatus: text("approval_status").default("pending").notNull(), // pending, approved, rejected
});

// Document Revision Changes - track specific field changes
export const documentRevisionChanges = pgTable("document_revision_changes", {
  id: serial("id").primaryKey(),
  revisionId: integer("revision_id").notNull().references(() => documentRevisions.id),
  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
});

export const documentApprovals = pgTable("document_approvals", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  documentType: text("document_type").notNull(), // document, procedure, work_instruction
  userId: integer("user_id").notNull(),
  status: text("status").notNull(), // pending, approved, rejected
  comments: text("comments"),
  signatureDate: timestamp("signature_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CAPA Management
export const capaTypes = pgTable("capa_types", {
  id: serial("id").primaryKey(), 
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const capaStatuses = pgTable("capa_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// CAPA Workflow States - Enhanced 5-Phase Model
export const capaWorkflowStates = pgEnum('capa_workflow_state', [
  'CORRECTION', 
  'ROOT_CAUSE_ANALYSIS', 
  'CORRECTIVE_ACTION', 
  'PREVENTIVE_ACTION',
  'EFFECTIVENESS_VERIFICATION'
]);

// CAPA Workflow tables
export const capaWorkflows = pgTable('capa_workflows', {
  id: serial('id').primaryKey(),
  capaId: integer('capa_id').notNull().references(() => capas.id),
  currentState: capaWorkflowStates('current_state').notNull().default('CORRECTION'),
  assignedTo: integer('assigned_to').references(() => users.id),
  dueDate: timestamp('due_date'),
  transitionDate: timestamp('transition_date'), // Date when moved to the current state
  transitionedBy: integer('transitioned_by').references(() => users.id), // Who moved it to the current state
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Immediate Correction phase
export const capaCorrections = pgTable('capa_corrections', {
  id: serial('id').primaryKey(),
  capaId: integer('capa_id').notNull().references(() => capas.id),
  description: text('description').notNull(),
  actionTaken: text('action_taken').notNull(),
  implementedBy: integer('implemented_by').notNull().references(() => users.id),
  implementationDate: timestamp('implementation_date').notNull(),
  evidence: text('evidence'),
  containmentType: text('containment_type').notNull(), // Quarantine, Rework, Product Hold, etc.
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Define a table to track workflow state transitions
export const capaWorkflowHistory = pgTable('capa_workflow_history', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').notNull().references(() => capaWorkflows.id),
  fromState: capaWorkflowStates('from_state'), // null for initial state
  toState: capaWorkflowStates('to_state').notNull(),
  transitionDate: timestamp('transition_date').defaultNow().notNull(),
  transitionedBy: integer('transitioned_by').notNull().references(() => users.id),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow()
});

export const capas = pgTable("capas", {
  id: serial("id").primaryKey(),
  capaId: text("capa_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  typeId: integer("type_id").notNull(),
  statusId: integer("status_id").notNull(),
  // Fields for identification
  source: text("source"),
  // Foreign key relationships to linked entities - audit_id removed as it doesn't exist in DB
  // Commenting out rather than removing to preserve schema history
  // auditId: integer("audit_id").references(() => audits.id),
  // complaintId: integer("complaint_id").references(() => complaints.id),
  // Fields for metrics and reporting
  // These fields don't exist in the actual database
  // timeToImplementation: integer("time_to_implementation"), // Days from creation to implementation
  // timeToClose: integer("time_to_close"), // Days from creation to closure
  // Fields for risk assessment
  riskPriority: text("risk_priority"),
  personnelSafetyImpact: boolean("personnel_safety_impact").default(false),
  productPerformanceImpact: boolean("product_performance_impact").default(false),
  complianceImpact: boolean("compliance_impact").default(false),
  // Fields for containment
  immediateContainment: boolean("immediate_containment").default(false),
  containmentActions: text("containment_actions"),
  // Fields for root cause
  rcaMethod: text("rca_method"),
  rootCause: text("root_cause"),
  // Fields for actions
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  effectiveness: text("effectiveness"),
  // Fields for ownership and dates
  initiatedBy: integer("initiated_by").notNull(),
  assignedTo: integer("assigned_to"),
  dueDate: timestamp("due_date"),
  closedDate: timestamp("closed_date"),
  // Fields for CAPA phase tracking
  implementationPhase: integer("implementation_phase").default(0), // 0: Not Started, 1: In Progress, 2: Complete
  readyForEffectivenessReview: boolean("ready_for_effectiveness_review").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CAPA Implementation specific tables based on the requirements

// For URS-004 - Root Cause Analysis (Enhanced)
export const capaRootCauses = pgTable("capa_root_causes", {
  id: serial("id").primaryKey(),
  capaId: integer("capa_id").notNull(),
  identifier: text("identifier").notNull(), // RC #1, RC #2, etc.
  title: text("title").notNull(), // Standardized title/label
  description: text("description").notNull(),
  analysisMethod: text("analysis_method").notNull(), // 5 Whys, Fishbone, FTA, etc.
  documentLink: text("document_link"), // Link to related documentation
  responsiblePerson: integer("responsible_person").references(() => users.id),
  completionDate: timestamp("completion_date"),
  status: text("status").default("in_progress"), // in_progress, completed
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const capaRootCauseContributors = pgTable("capa_root_cause_contributors", {
  id: serial("id").primaryKey(),
  rootCauseId: integer("root_cause_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("investigator"), // investigator, reviewer, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Map CAPA actions to specific root causes
export const capaRootCauseActionMap = pgTable("capa_root_cause_action_map", {
  id: serial("id").primaryKey(),
  rootCauseId: integer("root_cause_id").notNull(),
  actionId: integer("action_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// For URS-006 - Effectiveness Review
export const capaEffectivenessReviews = pgTable("capa_effectiveness_reviews", {
  id: serial("id").primaryKey(),
  capaId: integer("capa_id").notNull(),
  reviewerId: integer("reviewer_id").notNull(),
  reviewDate: timestamp("review_date").defaultNow().notNull(),
  criteria: text("criteria").notNull(),
  outcome: text("outcome").notNull(), // Effective / Not Effective
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// For URS-CAPA - Reporting capabilities
export const capaReportingMetrics = pgTable("capa_reporting_metrics", {
  id: serial("id").primaryKey(),
  reportDate: timestamp("report_date").defaultNow().notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalCapas: integer("total_capas").notNull(),
  openCapas: integer("open_capas").notNull(),
  closedCapas: integer("closed_capas").notNull(),
  averageTimeToClose: decimal("average_time_to_close", { precision: 10, scale: 2 }), // In days
  onTimeClosureRate: decimal("on_time_closure_rate", { precision: 5, scale: 2 }), // Percentage
  byTypeDistribution: json("by_type_distribution").notNull(), // JSON with counts by type
  bySourceDistribution: json("by_source_distribution").notNull(), // JSON with counts by source
  byStatusDistribution: json("by_status_distribution").notNull(), // JSON with counts by status
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// For URS-007 - CAPA Closure
export const capaClosures = pgTable("capa_closures", {
  id: serial("id").primaryKey(),
  capaId: integer("capa_id").notNull(),
  closedBy: integer("closed_by").notNull(),
  closureDate: timestamp("closure_date").defaultNow().notNull(),
  summary: text("summary").notNull(),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// For URS-002, URS-004, URS-005, URS-006 - CAPA Actions
export const capaActions = pgTable("capa_actions", {
  id: serial("id").primaryKey(),
  capaId: integer("capa_id").notNull(),
  description: text("description").notNull(),
  assignedTo: integer("assigned_to").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  dependencies: text("dependencies"), // Comma-separated list of dependencies (other action IDs)
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// For URS-07, URS-08, URS-09 - Evidence Collection
export const capaEvidence = pgTable("capa_evidence", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull(),
  capaId: integer("capa_id").notNull(), // To enable direct querying
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // document, image, external_reference, etc.
  description: text("description"),
  uploadedBy: integer("uploaded_by").notNull(),
  reviewed: boolean("reviewed").default(false),
  reviewedBy: integer("reviewed_by"), 
  reviewComments: text("review_comments"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// For URS-13, URS-14 - Verification of Completion
export const capaVerifications = pgTable("capa_verifications", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull(),
  reviewerId: integer("reviewer_id").notNull(),
  comments: text("comments"),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  status: text("status").notNull(), // verified, rejected
});

// For URS-17, URS-18, URS-19 - Change Communication
export const capaCommunications = pgTable("capa_communications", {
  id: serial("id").primaryKey(),
  capaId: integer("capa_id").notNull(),
  actionId: integer("action_id"), // Optional, may be associated with a specific action
  communicationType: text("communication_type").notNull(), // email, meeting, training, etc.
  description: text("description").notNull(),
  communicatedBy: integer("communicated_by").notNull(),
  communicatedAt: timestamp("communicated_at").defaultNow().notNull(),
  requiresAcknowledgment: boolean("requires_acknowledgment").default(false),
});

// Create insert schemas for CAPA Action Implementation tables
export const insertCapaActionSchema = createInsertSchema(capaActions).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertCapaEvidenceSchema = createInsertSchema(capaEvidence).omit({
  id: true,
  timestamp: true,
});

export const insertCapaVerificationSchema = createInsertSchema(capaVerifications).omit({
  id: true,
  verifiedAt: true,
});

export const insertCapaCommunicationSchema = createInsertSchema(capaCommunications).omit({
  id: true,
  communicatedAt: true,
});

// Define the types for TypeScript
export type CapaAction = typeof capaActions.$inferSelect;
export type InsertCapaAction = z.infer<typeof insertCapaActionSchema>;

export type CapaEvidence = typeof capaEvidence.$inferSelect;
export type InsertCapaEvidence = z.infer<typeof insertCapaEvidenceSchema>;

export type CapaVerification = typeof capaVerifications.$inferSelect;
export type InsertCapaVerification = z.infer<typeof insertCapaVerificationSchema>;

export type CapaCommunication = typeof capaCommunications.$inferSelect;
export type InsertCapaCommunication = z.infer<typeof insertCapaCommunicationSchema>;

// Insert schemas for new CAPA tables
export const insertCapaRootCauseSchema = createInsertSchema(capaRootCauses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  completionDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertCapaRootCauseContributorSchema = createInsertSchema(capaRootCauseContributors).omit({
  id: true,
  createdAt: true,
});

export const insertCapaRootCauseActionMapSchema = createInsertSchema(capaRootCauseActionMap).omit({
  id: true,
  createdAt: true,
});

export const insertCapaEffectivenessReviewSchema = createInsertSchema(capaEffectivenessReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  reviewDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertCapaClosureSchema = createInsertSchema(capaClosures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New CAPA workflow insert schemas
export const insertCapaWorkflowSchema = createInsertSchema(capaWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCapaCorrectionSchema = createInsertSchema(capaCorrections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCapaWorkflowHistorySchema = createInsertSchema(capaWorkflowHistory).omit({
  id: true,
  createdAt: true,
});

// Create insert schema for CAPA
export const insertCapaSchema = createInsertSchema(capas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).optional().transform(val => 
    typeof val === 'string' && val ? new Date(val) : val
  ),
  closedDate: z.string().or(z.date()).optional().transform(val => 
    typeof val === 'string' && val ? new Date(val) : val
  ),
});

// Define types for CAPAs
export type Capa = typeof capas.$inferSelect;
export type InsertCapa = z.infer<typeof insertCapaSchema>;

// Define types for new CAPA tables
export type CapaRootCause = typeof capaRootCauses.$inferSelect;
export type InsertCapaRootCause = z.infer<typeof insertCapaRootCauseSchema>;

export type CapaRootCauseContributor = typeof capaRootCauseContributors.$inferSelect;
export type InsertCapaRootCauseContributor = z.infer<typeof insertCapaRootCauseContributorSchema>;

export type CapaRootCauseActionMap = typeof capaRootCauseActionMap.$inferSelect;
export type InsertCapaRootCauseActionMap = z.infer<typeof insertCapaRootCauseActionMapSchema>;

export type CapaEffectivenessReview = typeof capaEffectivenessReviews.$inferSelect;
export type InsertCapaEffectivenessReview = z.infer<typeof insertCapaEffectivenessReviewSchema>;

export type CapaClosure = typeof capaClosures.$inferSelect;
export type InsertCapaClosure = z.infer<typeof insertCapaClosureSchema>;

// New CAPA workflow types
export type CapaWorkflow = typeof capaWorkflows.$inferSelect;
export type InsertCapaWorkflow = z.infer<typeof insertCapaWorkflowSchema>;

export type CapaCorrection = typeof capaCorrections.$inferSelect;
export type InsertCapaCorrection = z.infer<typeof insertCapaCorrectionSchema>;

export type CapaWorkflowHistory = typeof capaWorkflowHistory.$inferSelect;
export type InsertCapaWorkflowHistory = z.infer<typeof insertCapaWorkflowHistorySchema>;

// Define CAPA relations
export const capasRelations = relations(capas, ({ one, many }) => ({
  capaType: one(capaTypes, {
    fields: [capas.typeId],
    references: [capaTypes.id],
  }),
  capaStatus: one(capaStatuses, {
    fields: [capas.statusId],
    references: [capaStatuses.id],
  }),
  initiatedByUser: one(users, {
    fields: [capas.initiatedBy],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [capas.assignedTo],
    references: [users.id],
  }),
  // New workflow relations
  workflow: many(capaWorkflows),
  corrections: many(capaCorrections),
  // Existing relations
  actions: many(capaActions),
  communications: many(capaCommunications),
  rootCauses: many(capaRootCauses),
  effectivenessReviews: many(capaEffectivenessReviews),
  closures: many(capaClosures),
}));

// Relations for CAPA Actions
export const capaActionsRelations = relations(capaActions, ({ one, many }) => ({
  capa: one(capas, {
    fields: [capaActions.capaId],
    references: [capas.id],
  }),
  assignedToUser: one(users, {
    fields: [capaActions.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [capaActions.createdBy],
    references: [users.id],
  }),
  evidence: many(capaEvidence),
  verifications: many(capaVerifications),
}));

// New workflow relations
export const capaWorkflowsRelations = relations(capaWorkflows, ({ one, many }) => ({
  capa: one(capas, {
    fields: [capaWorkflows.capaId],
    references: [capas.id],
  }),
  assignedToUser: one(users, {
    fields: [capaWorkflows.assignedTo],
    references: [users.id],
  }),
  transitionedByUser: one(users, {
    fields: [capaWorkflows.transitionedBy],
    references: [users.id],
  }),
  history: many(capaWorkflowHistory),
}));

export const capaCorrectionsRelations = relations(capaCorrections, ({ one }) => ({
  capa: one(capas, {
    fields: [capaCorrections.capaId],
    references: [capas.id],
  }),
  implementedByUser: one(users, {
    fields: [capaCorrections.implementedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [capaCorrections.createdBy],
    references: [users.id],
  }),
}));

export const capaWorkflowHistoryRelations = relations(capaWorkflowHistory, ({ one }) => ({
  workflow: one(capaWorkflows, {
    fields: [capaWorkflowHistory.workflowId],
    references: [capaWorkflows.id],
  }),
  transitionedByUser: one(users, {
    fields: [capaWorkflowHistory.transitionedBy],
    references: [users.id],
  }),
}));

// Management Review Module
export const managementReviewStatuses = pgTable("management_review_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const managementReviews = pgTable("management_reviews", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Title stores the review number + descriptive title
  description: text("description"),
  status: text("status").default("scheduled").notNull(),
  review_type: text("review_type").notNull(), // Regular or Special
  review_date: timestamp("review_date").notNull(),
  approval_date: timestamp("approval_date"),
  created_by: integer("created_by").notNull(),
  scheduled_by: integer("scheduled_by").notNull(),
  purpose: text("purpose"),
  scope: text("scope"),
  minutes: text("minutes"),
  conclusion: text("conclusion"),
  creation_date: timestamp("creation_date"),
  // Fields below are commented out until database migration is applied
  // presentation_file: text("presentation_file"), // File path to presentation attachment
  // file_content_type: text("file_content_type"), // MIME type of the uploaded presentation
  // invite_sent: boolean("invite_sent").default(false), // Flag to track if calendar invites were sent
  // reminder_sent: boolean("reminder_sent").default(false), // Flag to track if reminders were sent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const managementReviewInputs = pgTable("management_review_inputs", {
  id: serial("id").primaryKey(),
  review_id: integer("review_id").notNull(),
  title: text("title"),
  category: text("category"),
  description: text("description"),
  source: text("source"),
  source_id: integer("source_id"),
  data: json("data"),
  created_by: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const managementReviewInputCategories = pgTable("management_review_input_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  required: boolean("required").default(true),
  displayOrder: integer("display_order").notNull(),
});

export const managementReviewActionItems = pgTable("management_review_action_items", {
  id: serial("id").primaryKey(),
  review_id: integer("review_id").notNull(),
  description: text("description"),
  assigned_to: integer("assigned_to"),
  due_date: timestamp("due_date"),
  status: text("status").default("open"),
  priority: text("priority").default("medium"),
  completed_by: integer("completed_by"),
  completed_date: timestamp("completed_date"),
  verified_by: integer("verified_by"),
  verified_date: timestamp("verified_date"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const managementReviewActionItemChanges = pgTable("management_review_action_item_changes", {
  id: serial("id").primaryKey(),
  actionItemId: integer("action_item_id").notNull(),
  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  changedBy: integer("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const managementReviewSignatures = pgTable("management_review_signatures", {
  id: serial("id").primaryKey(),
  review_id: integer("review_id").notNull(),
  user_id: integer("user_id").notNull(),
  role: text("role"),
  signature_date: timestamp("signature_date").defaultNow(),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table for management review attendees (for scheduling and invitations)
export const managementReviewAttendees = pgTable("management_review_attendees", {
  id: serial("id").primaryKey(),
  review_id: integer("review_id").notNull().references(() => managementReviews.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  role: text("role"), // Role in the meeting: Chair, Member, Guest, etc.
  attendance_status: text("attendance_status").default("invited"), // invited, confirmed, declined, attended
  invite_sent: boolean("invite_sent").default(false),
  reminder_sent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for Management Review tables
export const insertManagementReviewSchema = createInsertSchema(managementReviews)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Support both client-side (camelCase) and server-side (snake_case) field names
    title: z.string().optional(), // Title can be auto-generated
    reviewDate: z.date().optional(), // Client-side camelCase version
    reviewType: z.string().optional(), // Client-side camelCase version
    autoNumbering: z.boolean().default(true), // Flag for auto-numbering
    
    // Ensure required fields are properly validated
    review_date: z.date().or(z.string().transform(val => new Date(val))),
    review_type: z.string(),
    created_by: z.number(),
    scheduled_by: z.number(),
    
    // Optional fields
    purpose: z.string().optional(),
    scope: z.string().optional(),
    minutes: z.string().optional(),
    conclusion: z.string().optional(),
    
    // Transform date strings to Date objects 
    approval_date: z.string().or(z.date()).optional().nullable().transform((val) => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') return new Date(val);
      return val;
    }),
  });

export const insertManagementReviewInputSchema = createInsertSchema(managementReviewInputs)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Support both reviewId (client-side) and review_id (server-side)
    reviewId: z.number().optional(),
    review_id: z.number(),
  });

export const insertManagementReviewActionItemSchema = createInsertSchema(managementReviewActionItems)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Support both reviewId (client-side) and review_id (server-side)
    reviewId: z.number().optional(),
    review_id: z.number(),
    
    dueDate: z.string().or(z.date()).transform((val) => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    }),
    completionDate: z.string().or(z.date()).optional().transform((val) => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    }),
    verificationDate: z.string().or(z.date()).optional().transform((val) => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    }),
  });

// Create insert schema for management review signatures
export const insertManagementReviewSignatureSchema = createInsertSchema(managementReviewSignatures, {
  id: undefined,
  signature_date: undefined,
  createdAt: undefined
});

// Create insert schema for management review attendees
export const insertManagementReviewAttendeeSchema = createInsertSchema(managementReviewAttendees, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
}).extend({
  // Support both reviewId (client-side) and review_id (server-side)
  reviewId: z.number().optional(),
  userId: z.number().optional(),
});

// IEC 62304 Software Lifecycle Management Tables
export const softwareClassifications = pgTable("software_classifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Class A, Class B, Class C
  description: text("description").notNull(),
  requirements: text("requirements").notNull(), // JSON string of specific requirements
  riskLevel: text("risk_level").notNull(), // Non-safety, Non-life-threatening, Life-threatening
  processRequirements: text("process_requirements").notNull(), // JSON array of process steps
  documentationRequirements: text("documentation_requirements").notNull(), // JSON array of required docs
});

export const softwareProjects = pgTable("software_projects", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  classificationId: integer("classification_id").notNull().references(() => softwareClassifications.id),
  designControlId: integer("design_control_id").references(() => designProjects.id),
  productFamily: text("product_family"),
  intendedUse: text("intended_use").notNull(),
  operatingEnvironment: text("operating_environment").notNull(),
  softwareType: text("software_type").notNull(), // Standalone, Embedded, SaMD, Component
  version: text("version").notNull(),
  status: text("status").default("planning").notNull(), // planning, development, testing, released, retired
  projectManager: integer("project_manager").notNull().references(() => users.id),
  leadDeveloper: integer("lead_developer").references(() => users.id),
  qualityAssurance: integer("quality_assurance").references(() => users.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareRequirements = pgTable("software_requirements", {
  id: serial("id").primaryKey(),
  requirementId: text("requirement_id").notNull().unique(),
  projectId: integer("project_id").notNull().references(() => softwareProjects.id),
  parentRequirementId: integer("parent_requirement_id").references(() => softwareRequirements.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // System, Software, Interface, Performance, Safety
  priority: text("priority").notNull(), // Critical, High, Medium, Low
  source: text("source"), // Stakeholder, Regulation, Standard, Risk Analysis
  rationale: text("rationale"),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  traceabilityUpstream: text("traceability_upstream"), // JSON array of upstream requirements
  traceabilityDownstream: text("traceability_downstream"), // JSON array of downstream items
  verificationMethod: text("verification_method"), // Analysis, Inspection, Test, Demonstration
  status: text("status").default("draft").notNull(), // draft, approved, implemented, verified, obsolete
  riskLevel: text("risk_level"), // High, Medium, Low
  safetyRelated: boolean("safety_related").default(false),
  securityRelated: boolean("security_related").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareArchitecture = pgTable("software_architecture", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => softwareProjects.id),
  componentName: text("component_name").notNull(),
  componentType: text("component_type").notNull(), // Module, Library, Service, Interface, Database
  description: text("description").notNull(),
  interfaceDescription: text("interface_description"),
  dependencies: text("dependencies"), // JSON array of component dependencies
  safetyClassification: text("safety_classification"), // Safety-critical, Safety-related, Non-safety
  isolationMechanism: text("isolation_mechanism"), // For safety-critical components
  verificationApproach: text("verification_approach"),
  implementationNotes: text("implementation_notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareRiskAnalysis = pgTable("software_risk_analysis", {
  id: serial("id").primaryKey(),
  riskId: text("risk_id").notNull().unique(),
  projectId: integer("project_id").notNull().references(() => softwareProjects.id),
  hazardDescription: text("hazard_description").notNull(),
  hazardoussituation: text("hazardous_situation").notNull(),
  harm: text("harm").notNull(),
  causeOfFailure: text("cause_of_failure").notNull(),
  softwareComponent: text("software_component"),
  failureMode: text("failure_mode").notNull(),
  probabilityOfOccurrence: integer("probability_of_occurrence").notNull(), // 1-5 scale
  severityOfHarm: integer("severity_of_harm").notNull(), // 1-5 scale
  probabilityOfDetection: integer("probability_of_detection").notNull(), // 1-5 scale
  riskScore: integer("risk_score").notNull(), // Calculated risk score
  riskLevel: text("risk_level").notNull(), // Unacceptable, As Low As Reasonably Practicable, Acceptable
  riskControlMeasures: text("risk_control_measures").notNull(), // JSON array of control measures
  residualRiskScore: integer("residual_risk_score"),
  residualRiskLevel: text("residual_risk_level"),
  verificationOfControls: text("verification_of_controls"),
  status: text("status").default("identified").notNull(), // identified, analyzed, controlled, verified, closed
  createdBy: integer("created_by").notNull().references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareConfigurationItems = pgTable("software_configuration_items", {
  id: serial("id").primaryKey(),
  itemId: text("item_id").notNull().unique(),
  projectId: integer("project_id").notNull().references(() => softwareProjects.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // Source Code, Documentation, Configuration, Database, Third-party
  version: text("version").notNull(),
  description: text("description"),
  location: text("location"), // File path, repository location, etc.
  checksum: text("checksum"), // For integrity verification
  status: text("status").default("baseline").notNull(), // baseline, changed, released, archived
  changeRequestId: text("change_request_id"), // Link to change control
  baselineDate: timestamp("baseline_date"),
  releaseDate: timestamp("release_date"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareProblems = pgTable("software_problems", {
  id: serial("id").primaryKey(),
  problemId: text("problem_id").notNull().unique(),
  projectId: integer("project_id").notNull().references(() => softwareProjects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  problemType: text("problem_type").notNull(), // Bug, Enhancement, Security, Performance, Usability
  severity: text("severity").notNull(), // Critical, Major, Minor, Cosmetic
  priority: text("priority").notNull(), // Urgent, High, Medium, Low
  source: text("source").notNull(), // Testing, Customer Report, Internal Review, Audit
  discoveredIn: text("discovered_in"), // Version where problem was found
  component: text("component"), // Software component affected
  environment: text("environment"), // Test, Production, Development
  reproducible: boolean("reproducible").default(false),
  reproductionSteps: text("reproduction_steps"),
  expectedBehavior: text("expected_behavior"),
  actualBehavior: text("actual_behavior"),
  workaround: text("workaround"),
  riskAssessment: text("risk_assessment"),
  safetyImpact: boolean("safety_impact").default(false),
  securityImpact: boolean("security_impact").default(false),
  regulatoryImpact: boolean("regulatory_impact").default(false),
  changeRequestId: text("change_request_id"), // Link to change control
  resolution: text("resolution"),
  resolvedIn: text("resolved_in"), // Version where problem was resolved
  verificationMethod: text("verification_method"),
  verificationResults: text("verification_results"),
  status: text("status").default("open").notNull(), // open, investigating, resolved, verified, closed, deferred
  reportedBy: integer("reported_by").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedBy: integer("resolved_by").references(() => users.id),
  verifiedBy: integer("verified_by").references(() => users.id),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareTestPlans = pgTable("software_test_plans", {
  id: serial("id").primaryKey(),
  planId: text("plan_id").notNull().unique(),
  projectId: integer("project_id").notNull().references(() => softwareProjects.id),
  name: text("name").notNull(),
  description: text("description"),
  testType: text("test_type").notNull(), // Unit, Integration, System, Acceptance
  scope: text("scope").notNull(),
  objectives: text("objectives").notNull(),
  testStrategy: text("test_strategy"),
  entryExitCriteria: text("entry_exit_criteria"),
  testEnvironment: text("test_environment"),
  riskAssessment: text("risk_assessment"),
  schedule: text("schedule"),
  resources: text("resources"),
  traceabilityMatrix: text("traceability_matrix"), // JSON mapping requirements to test cases
  status: text("status").default("draft").notNull(), // draft, approved, executing, completed, cancelled
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareTestCases = pgTable("software_test_cases", {
  id: serial("id").primaryKey(),
  testCaseId: text("test_case_id").notNull().unique(),
  testPlanId: integer("test_plan_id").notNull().references(() => softwareTestPlans.id),
  requirementId: integer("requirement_id").references(() => softwareRequirements.id),
  title: text("title").notNull(),
  description: text("description"),
  preconditions: text("preconditions"),
  testSteps: text("test_steps").notNull(), // JSON array of test steps
  expectedResults: text("expected_results").notNull(),
  testData: text("test_data"),
  priority: text("priority").notNull(), // Critical, High, Medium, Low
  category: text("category"), // Functional, Performance, Security, Usability
  automated: boolean("automated").default(false),
  automationScript: text("automation_script"),
  estimatedDuration: integer("estimated_duration"), // In minutes
  createdBy: integer("created_by").notNull().references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const softwareTestExecutions = pgTable("software_test_executions", {
  id: serial("id").primaryKey(),
  executionId: text("execution_id").notNull().unique(),
  testCaseId: integer("test_case_id").notNull().references(() => softwareTestCases.id),
  testPlanId: integer("test_plan_id").notNull().references(() => softwareTestPlans.id),
  version: text("version").notNull(), // Software version being tested
  environment: text("environment").notNull(),
  result: text("result").notNull(), // Pass, Fail, Blocked, Not Executed
  actualResults: text("actual_results"),
  defectsFound: text("defects_found"), // JSON array of problem IDs
  comments: text("comments"),
  evidence: text("evidence"), // Screenshots, logs, etc.
  executionTime: integer("execution_time"), // Actual duration in minutes
  executedBy: integer("executed_by").notNull().references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Design project documents table for project document uploads
export const designProjectDocuments = pgTable('design_project_documents', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => designProjects.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  description: text('description'),
  version: varchar('version', { length: 20 }).default('1.0'),
});

// IEC 62304 Software Lifecycle Relations
export const softwareProjectsRelations = relations(softwareProjects, ({ one, many }) => ({
  classification: one(softwareClassifications, {
    fields: [softwareProjects.classificationId],
    references: [softwareClassifications.id],
  }),
  designControl: one(designProjects, {
    fields: [softwareProjects.designControlId],
    references: [designProjects.id],
  }),
  projectManagerUser: one(users, {
    fields: [softwareProjects.projectManager],
    references: [users.id],
    relationName: "projectManager"
  }),
  leadDeveloperUser: one(users, {
    fields: [softwareProjects.leadDeveloper],
    references: [users.id],
    relationName: "leadDeveloper"
  }),
  qualityAssuranceUser: one(users, {
    fields: [softwareProjects.qualityAssurance],
    references: [users.id],
    relationName: "qualityAssurance"
  }),
  createdByUser: one(users, {
    fields: [softwareProjects.createdBy],
    references: [users.id],
    relationName: "createdBy"
  }),
  requirements: many(softwareRequirements),
  architecture: many(softwareArchitecture),
  riskAnalysis: many(softwareRiskAnalysis),
  configurationItems: many(softwareConfigurationItems),
  problems: many(softwareProblems),
  testPlans: many(softwareTestPlans),
}));

// Insert schemas for IEC 62304 tables
export const insertSoftwareClassificationSchema = createInsertSchema(softwareClassifications);
export const insertSoftwareProjectSchema = createInsertSchema(softwareProjects)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertSoftwareRequirementSchema = createInsertSchema(softwareRequirements)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertSoftwareArchitectureSchema = createInsertSchema(softwareArchitecture)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertSoftwareRiskAnalysisSchema = createInsertSchema(softwareRiskAnalysis)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertSoftwareConfigurationItemSchema = createInsertSchema(softwareConfigurationItems)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertSoftwareProblemSchema = createInsertSchema(softwareProblems)
  .omit({ id: true, createdAt: true, updatedAt: true, reportedAt: true });
export const insertSoftwareTestPlanSchema = createInsertSchema(softwareTestPlans)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertSoftwareTestCaseSchema = createInsertSchema(softwareTestCases)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertSoftwareTestExecutionSchema = createInsertSchema(softwareTestExecutions)
  .omit({ id: true, createdAt: true, executedAt: true });

// Types for IEC 62304 tables
export type SoftwareClassification = typeof softwareClassifications.$inferSelect;
export type InsertSoftwareClassification = z.infer<typeof insertSoftwareClassificationSchema>;

export type SoftwareProject = typeof softwareProjects.$inferSelect;
export type InsertSoftwareProject = z.infer<typeof insertSoftwareProjectSchema>;

export type SoftwareRequirement = typeof softwareRequirements.$inferSelect;
export type InsertSoftwareRequirement = z.infer<typeof insertSoftwareRequirementSchema>;

export type SoftwareArchitecture = typeof softwareArchitecture.$inferSelect;
export type InsertSoftwareArchitecture = z.infer<typeof insertSoftwareArchitectureSchema>;

export type SoftwareRiskAnalysis = typeof softwareRiskAnalysis.$inferSelect;
export type InsertSoftwareRiskAnalysis = z.infer<typeof insertSoftwareRiskAnalysisSchema>;

export type SoftwareConfigurationItem = typeof softwareConfigurationItems.$inferSelect;
export type InsertSoftwareConfigurationItem = z.infer<typeof insertSoftwareConfigurationItemSchema>;

export type SoftwareProblem = typeof softwareProblems.$inferSelect;
export type InsertSoftwareProblem = z.infer<typeof insertSoftwareProblemSchema>;

export type SoftwareTestPlan = typeof softwareTestPlans.$inferSelect;
export type InsertSoftwareTestPlan = z.infer<typeof insertSoftwareTestPlanSchema>;

export type SoftwareTestCase = typeof softwareTestCases.$inferSelect;
export type InsertSoftwareTestCase = z.infer<typeof insertSoftwareTestCaseSchema>;

export type SoftwareTestExecution = typeof softwareTestExecutions.$inferSelect;
export type InsertSoftwareTestExecution = z.infer<typeof insertSoftwareTestExecutionSchema>;

// Dynamic Traceability Matrix (ISO 13485:7.3.9 - Non-editable Artifact)
export const traceabilityMatrixArtifacts = pgTable("traceability_matrix_artifacts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  matrixId: text("matrix_id").notNull().unique(), // TM-DP-2025-001-v1.0
  version: text("version").notNull().default("1.0"),
  generationDate: timestamp("generation_date").defaultNow().notNull(),
  matrixType: text("matrix_type").notNull(), // full, inputs_outputs, verification, validation
  includeUserRequirements: boolean("include_user_requirements").default(true),
  includeDesignInputs: boolean("include_design_inputs").default(true),
  includeDesignOutputs: boolean("include_design_outputs").default(true),
  includeVerification: boolean("include_verification").default(true),
  includeValidation: boolean("include_validation").default(true),
  includeRiskManagement: boolean("include_risk_management").default(true),
  matrixData: json("matrix_data").notNull(), // Complete matrix with hyperlinks
  coverageStatistics: json("coverage_statistics"), // Compliance metrics
  gapAnalysis: json("gap_analysis"), // Missing traceability links
  regulatoryCompliance: json("regulatory_compliance"), // ISO/FDA/MDR compliance status
  exportFormat: text("export_format").default("both"), // pdf, excel, both
  pdfPath: text("pdf_path"), // Generated PDF file path
  excelPath: text("excel_path"), // Generated Excel file path
  revisionStamp: text("revision_stamp"), // Unique revision identifier
  approvalRequired: boolean("approval_required").default(true),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isLocked: boolean("is_locked").default(false),
  lockReason: text("lock_reason"), // Why matrix is locked
  generatedBy: integer("generated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const traceabilityLinks = pgTable("traceability_links", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  linkId: text("link_id").notNull().unique(), // TL-DP-2025-001-001
  sourceType: text("source_type").notNull(), // user_requirement, design_input, design_output
  sourceId: integer("source_id").notNull(), // Reference to source record
  sourceIdentifier: text("source_identifier").notNull(), // UR-001, DI-001, etc.
  targetType: text("target_type").notNull(), // design_input, design_output, verification, validation
  targetId: integer("target_id").notNull(), // Reference to target record
  targetIdentifier: text("target_identifier").notNull(), // DI-001, DO-001, etc.
  linkType: text("link_type").notNull(), // derives_from, implements, verifies, validates
  linkRationale: text("link_rationale"), // Why this link exists
  traceabilityStrength: text("traceability_strength").default("direct"), // direct, indirect, partial
  verificationMethod: text("verification_method"), // How link was verified
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Legacy Design Control Traceability Module (Transitioning to Dynamic Matrix)
// Status enum for common task tracking
export const taskStatusEnum = pgEnum("task_status", ["in_progress", "done", "failed", "needs_review", "not_started"]);

// User Needs Table
export const designUserNeeds = pgTable("design_user_needs", {
  id: serial("id").primaryKey(),
  needId: text("need_id").notNull().unique(), // UN-1, UN-2, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // High, Medium, Low
  status: taskStatusEnum("status").default("not_started").notNull(),
  linkedInputs: json("linked_inputs").notNull().default("[]"), // Array of Design Input IDs
  tags: json("tags").notNull().default("[]"), // Additional metadata tags
  owner: integer("owner").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  changeLog: json("change_log").notNull().default("[]"), // Auto-generated change history
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Traceability Design Inputs Table (for traceability module)
export const traceabilityDesignInputs = pgTable("traceability_design_inputs", {
  id: serial("id").primaryKey(),
  inputId: text("input_id").notNull().unique(), // DI-1, DI-2, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  linksToNeeds: json("links_to_needs").notNull().default("[]"), // Array of User Need IDs
  version: text("version").notNull().default("1.0"),
  status: taskStatusEnum("status").default("not_started").notNull(),
  owner: integer("owner").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  changeLog: json("change_log").notNull().default("[]"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Traceability Design Outputs Table (for traceability module)
export const traceabilityDesignOutputs = pgTable("traceability_design_outputs", {
  id: serial("id").primaryKey(),
  outputId: text("output_id").notNull().unique(), // DO-1, DO-2, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  linksToInputs: json("links_to_inputs").notNull().default("[]"), // Array of Design Input IDs
  codeReferencePath: text("code_reference_path"), // Path to implementation
  artifactId: text("artifact_id"), // Reference to specific deliverable
  reviewChecklist: json("review_checklist").notNull().default("[]"), // Internal review items
  linkedVerificationRecord: text("linked_verification_record"), // VER-ID reference
  status: taskStatusEnum("status").default("not_started").notNull(),
  owner: integer("owner").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  changeLog: json("change_log").notNull().default("[]"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Verification Records Table
export const verificationRecords = pgTable("verification_records", {
  id: serial("id").primaryKey(),
  verificationId: text("verification_id").notNull().unique(), // VER-1, VER-2, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  linkedOutputId: text("linked_output_id").notNull(), // Design Output ID
  testProtocol: text("test_protocol").notNull(), // Stored test protocol
  version: text("version").notNull().default("1.0"),
  evidenceFiles: json("evidence_files").notNull().default("[]"), // Array of file references
  executionTimestamp: timestamp("execution_timestamp"),
  testResults: text("test_results"),
  status: taskStatusEnum("status").default("not_started").notNull(),
  owner: integer("owner").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  changeLog: json("change_log").notNull().default("[]"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Validation Records Table
export const validationRecords = pgTable("validation_records", {
  id: serial("id").primaryKey(),
  validationId: text("validation_id").notNull().unique(), // VAL-1, VAL-2, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  linkedUserNeeds: json("linked_user_needs").notNull().default("[]"), // Array of User Need IDs
  validationProtocol: text("validation_protocol").notNull(),
  resultsAgainstRequirements: text("results_against_requirements"),
  summaryReport: text("summary_report"), // Generated PDF reference
  signedPdfPath: text("signed_pdf_path"), // Path to signed summary report
  status: taskStatusEnum("status").default("not_started").notNull(),
  owner: integer("owner").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  changeLog: json("change_log").notNull().default("[]"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task Dependencies Table (for complex task relationships)
export const designTaskDependencies = pgTable("design_task_dependencies", {
  id: serial("id").primaryKey(),
  taskType: text("task_type").notNull(), // user_need, design_input, design_output, verification, validation
  taskId: text("task_id").notNull(), // The ID of the task (UN-1, DI-1, etc.)
  dependsOnType: text("depends_on_type").notNull(),
  dependsOnId: text("depends_on_id").notNull(),
  dependencyReason: text("dependency_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Traceability Matrix Views (for reporting)
export const traceabilityMatrixSnapshots = pgTable("traceability_matrix_snapshots", {
  id: serial("id").primaryKey(),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
  matrixData: json("matrix_data").notNull(), // Complete traceability matrix
  generatedBy: integer("generated_by").notNull().references(() => users.id),
  purpose: text("purpose"), // Regular snapshot, audit, release, etc.
});

// Activity Log for Change Tracking
export const designControlActivityLog = pgTable("design_control_activity_log", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // user_need, design_input, etc.
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(), // created, updated, status_changed, deleted
  previousValue: json("previous_value"),
  newValue: json("new_value"),
  userId: integer("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Design Control Relations
export const designUserNeedsRelations = relations(designUserNeeds, ({ one, many }) => ({
  owner: one(users, {
    fields: [designUserNeeds.owner],
    references: [users.id],
    relationName: "userNeedOwner"
  }),
  createdByUser: one(users, {
    fields: [designUserNeeds.createdBy],
    references: [users.id],
    relationName: "userNeedCreator"
  }),
}));

export const traceabilityDesignInputsRelations = relations(traceabilityDesignInputs, ({ one, many }) => ({
  owner: one(users, {
    fields: [traceabilityDesignInputs.owner],
    references: [users.id],
    relationName: "traceabilityInputOwner"
  }),
  createdByUser: one(users, {
    fields: [traceabilityDesignInputs.createdBy],
    references: [users.id],
    relationName: "traceabilityInputCreator"
  }),
}));

export const traceabilityDesignOutputsRelations = relations(traceabilityDesignOutputs, ({ one, many }) => ({
  owner: one(users, {
    fields: [traceabilityDesignOutputs.owner],
    references: [users.id],
    relationName: "traceabilityOutputOwner"
  }),
  createdByUser: one(users, {
    fields: [traceabilityDesignOutputs.createdBy],
    references: [users.id],
    relationName: "traceabilityOutputCreator"
  }),
}));

export const verificationRecordsRelations = relations(verificationRecords, ({ one, many }) => ({
  owner: one(users, {
    fields: [verificationRecords.owner],
    references: [users.id],
    relationName: "verificationOwner"
  }),
  createdByUser: one(users, {
    fields: [verificationRecords.createdBy],
    references: [users.id],
    relationName: "verificationCreator"
  }),
}));

export const validationRecordsRelations = relations(validationRecords, ({ one, many }) => ({
  owner: one(users, {
    fields: [validationRecords.owner],
    references: [users.id],
    relationName: "validationOwner"
  }),
  createdByUser: one(users, {
    fields: [validationRecords.createdBy],
    references: [users.id],
    relationName: "validationCreator"
  }),
}));

// Insert schemas for Design Control Traceability
export const insertDesignUserNeedSchema = createInsertSchema(designUserNeeds)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertTraceabilityDesignInputSchema = createInsertSchema(traceabilityDesignInputs)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertTraceabilityDesignOutputSchema = createInsertSchema(traceabilityDesignOutputs)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertVerificationRecordSchema = createInsertSchema(verificationRecords)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertValidationRecordSchema = createInsertSchema(validationRecords)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertDesignTaskDependencySchema = createInsertSchema(designTaskDependencies)
  .omit({ id: true, createdAt: true });
export const insertTraceabilityMatrixSnapshotSchema = createInsertSchema(traceabilityMatrixSnapshots)
  .omit({ id: true, snapshotDate: true });
export const insertDesignControlActivityLogSchema = createInsertSchema(designControlActivityLog)
  .omit({ id: true, timestamp: true });

// Types for Design Control Traceability
export type DesignUserNeed = typeof designUserNeeds.$inferSelect;
export type InsertDesignUserNeed = z.infer<typeof insertDesignUserNeedSchema>;

export type TraceabilityDesignInput = typeof traceabilityDesignInputs.$inferSelect;
export type InsertTraceabilityDesignInput = z.infer<typeof insertTraceabilityDesignInputSchema>;

export type TraceabilityDesignOutput = typeof traceabilityDesignOutputs.$inferSelect;
export type InsertTraceabilityDesignOutput = z.infer<typeof insertTraceabilityDesignOutputSchema>;

export type VerificationRecord = typeof verificationRecords.$inferSelect;
export type InsertVerificationRecord = z.infer<typeof insertVerificationRecordSchema>;

export type ValidationRecord = typeof validationRecords.$inferSelect;
export type InsertValidationRecord = z.infer<typeof insertValidationRecordSchema>;

export type DesignTaskDependency = typeof designTaskDependencies.$inferSelect;
export type InsertDesignTaskDependency = z.infer<typeof insertDesignTaskDependencySchema>;

export type TraceabilityMatrixSnapshot = typeof traceabilityMatrixSnapshots.$inferSelect;
export type InsertTraceabilityMatrixSnapshot = z.infer<typeof insertTraceabilityMatrixSnapshotSchema>;

export type DesignControlActivityLog = typeof designControlActivityLog.$inferSelect;
export type InsertDesignControlActivityLog = z.infer<typeof insertDesignControlActivityLogSchema>;



// Define the types for Management Review tables
export type ManagementReview = typeof managementReviews.$inferSelect;
export type InsertManagementReview = z.infer<typeof insertManagementReviewSchema>;

export type ManagementReviewInput = typeof managementReviewInputs.$inferSelect;
export type InsertManagementReviewInput = z.infer<typeof insertManagementReviewInputSchema>;

export type ManagementReviewInputCategory = typeof managementReviewInputCategories.$inferSelect;

export type ManagementReviewActionItem = typeof managementReviewActionItems.$inferSelect;
export type InsertManagementReviewActionItem = z.infer<typeof insertManagementReviewActionItemSchema>;

export type ManagementReviewSignature = typeof managementReviewSignatures.$inferSelect;
export type InsertManagementReviewSignature = z.infer<typeof insertManagementReviewSignatureSchema>;

// Define Management Review relations
export const managementReviewsRelations = relations(managementReviews, ({ one, many }) => ({
  creator: one(users, {
    fields: [managementReviews.created_by],
    references: [users.id]
  }),
  scheduler: one(users, {
    fields: [managementReviews.scheduled_by],
    references: [users.id]
  }),
  inputs: many(managementReviewInputs),
  actionItems: many(managementReviewActionItems),
  signatures: many(managementReviewSignatures),
  attendees: many(managementReviewAttendees)
}));

export const managementReviewAttendeesRelations = relations(managementReviewAttendees, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewAttendees.review_id],
    references: [managementReviews.id]
  }),
  user: one(users, {
    fields: [managementReviewAttendees.user_id],
    references: [users.id]
  })
}));

export const managementReviewInputsRelations = relations(managementReviewInputs, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewInputs.review_id],
    references: [managementReviews.id]
  }),
  creator: one(users, {
    fields: [managementReviewInputs.created_by],
    references: [users.id]
  })
}));

export const managementReviewActionItemsRelations = relations(managementReviewActionItems, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewActionItems.review_id],
    references: [managementReviews.id]
  }),
  assignee: one(users, {
    fields: [managementReviewActionItems.assigned_to],
    references: [users.id]
  }),
  completer: one(users, {
    fields: [managementReviewActionItems.completed_by],
    references: [users.id],
    relationName: "completer"
  }),
  verifier: one(users, {
    fields: [managementReviewActionItems.verified_by],
    references: [users.id],
    relationName: "verifier"
  })
}));

export const managementReviewSignaturesRelations = relations(managementReviewSignatures, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewSignatures.review_id],
    references: [managementReviews.id]
  }),
  user: one(users, {
    fields: [managementReviewSignatures.user_id],
    references: [users.id]
  })
}));


// Applying the fix for activityLogs export

// Audit Module Schema
export const auditTypes = pgTable("audit_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const auditStatuses = pgTable("audit_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  auditId: text("audit_id").notNull().unique(),
  title: text("title").notNull(),
  typeId: integer("type_id").notNull().references(() => auditTypes.id),
  statusId: integer("status_id").notNull().references(() => auditStatuses.id),
  scope: text("scope").notNull(),
  // This column is actually lead_auditor_name in the database, not lead_auditor
  leadAuditorName: text("lead_auditor_name"),
  auditLocation: text("audit_location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  scheduledDate: timestamp("scheduled_date"),
  supplierId: integer("supplier_id"), // For supplier audits
  departmentId: integer("department_id"), // For internal audits
  description: text("description"),
  standardReference: text("standard_reference"), // e.g., ISO 13485:2016, FDA QSR, etc.
  qmsArea: text("qms_area"), // QMS area selection for intelligent automation
  createdBy: integer("created_by"),
  hasChecklistItems: boolean("has_checklist_items").default(false),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Checklist schema
export const auditChecklistItems = pgTable("audit_checklist_items", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull().references(() => audits.id),
  questionText: text("question_text").notNull(),
  responseType: text("response_type").notNull(), // Yes/No, Text, Dropdown, Upload
  regulationClause: text("regulation_clause"), // e.g., ISO 13485:2016 7.5.6
  response: text("response"),
  findingType: text("finding_type"), // Compliant, NC, Observation, OFI
  evidenceFileURL: text("evidence_file_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supplier Corrective Request (SCR) Schema
export const scrStatuses = pgTable("scr_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const supplierCorrectiveRequests = pgTable("supplier_corrective_requests", {
  id: serial("id").primaryKey(),
  scrId: text("scr_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  statusId: integer("status_id").notNull().references(() => scrStatuses.id),
  auditId: integer("audit_id").references(() => audits.id),
  supplierId: integer("supplier_id"), // Reference supplier table when it exists
  findingId: integer("finding_id").references(() => auditChecklistItems.id),
  severity: text("severity").notNull(), // Critical, Major, Minor
  responseRequired: boolean("response_required").default(true),
  dueDate: timestamp("due_date").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  initiatedBy: integer("initiated_by").notNull().references(() => users.id),
  closedDate: timestamp("closed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// SCR Attachments
export const scrAttachments = pgTable("scr_attachments", {
  id: serial("id").primaryKey(),
  scrId: integer("scr_id").notNull().references(() => supplierCorrectiveRequests.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  description: text("description"),
});

// Enhanced Audit Checklist Templates for Intelligent Generation
export const auditChecklistTemplates = pgTable("audit_checklist_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  auditTypeId: integer("audit_type_id").notNull().references(() => auditTypes.id),
  description: text("description"),
  standardReference: text("standard_reference"), // ISO 13485:2016, FDA QSR, etc.
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Template Questions for Dynamic Checklist Generation
export const auditChecklistQuestions = pgTable("audit_checklist_questions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => auditChecklistTemplates.id),
  questionText: text("question_text").notNull(),
  regulationClause: text("regulation_clause"), // e.g., "7.5.6", "4.2.3"
  standardSection: text("standard_section"), // e.g., "Document Control", "Management Review"
  responseType: text("response_type").notNull().default("yes_no"), // yes_no, text, file_upload, numeric
  isRequired: boolean("is_required").default(true),
  sortOrder: integer("sort_order").notNull(),
  guidanceNotes: text("guidance_notes"), // Auditor guidance for the question
  evidenceRequired: boolean("evidence_required").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Responses with Enhanced CAPA Integration
export const auditResponses = pgTable("audit_responses", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull().references(() => audits.id),
  questionId: integer("question_id").notNull().references(() => auditChecklistQuestions.id),
  response: text("response"),
  findingType: text("finding_type"), // compliant, nonconformity, observation, ofi
  severity: text("severity"), // critical, major, minor
  description: text("description"), // Finding description
  evidenceFiles: json("evidence_files"), // Array of file paths
  requiresCapa: boolean("requires_capa").default(false),
  capaId: integer("capa_id"), // Link to created CAPA
  respondedBy: integer("responded_by").notNull().references(() => users.id),
  respondedAt: timestamp("responded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Findings with Automatic CAPA Generation
export const auditFindings = pgTable("audit_findings", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull().references(() => audits.id),
  responseId: integer("response_id").notNull().references(() => auditResponses.id),
  findingNumber: text("finding_number").notNull(), // Auto-generated: F-001, F-002, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, major, minor
  regulationClause: text("regulation_clause"),
  rootCauseAnalysis: text("root_cause_analysis"),
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  status: text("status").default("open"), // open, in_progress, closed, verified
  capaId: integer("capa_id"), // Auto-created CAPA reference
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  scheduledDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  supplierId: z.number().optional().nullable(),
  departmentId: z.number().optional().nullable(),
  description: z.string().optional(),
  standardReference: z.string().optional(),
});

export const insertAuditChecklistTemplateSchema = createInsertSchema(auditChecklistTemplates).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

export const insertAuditChecklistQuestionSchema = createInsertSchema(auditChecklistQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditResponseSchema = createInsertSchema(auditResponses).omit({
  id: true,
  updatedAt: true,
});

export const insertAuditFindingSchema = createInsertSchema(auditFindings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditChecklistItemSchema = createInsertSchema(auditChecklistItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierCorrectiveRequestSchema = createInsertSchema(supplierCorrectiveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  closedDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string' && val) {
      return new Date(val);
    }
    return val;
  }),
});

export const insertScrAttachmentSchema = createInsertSchema(scrAttachments).omit({
  id: true,
  uploadedAt: true,
});

// Define types
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;

export type AuditChecklistItem = typeof auditChecklistItems.$inferSelect;
export type InsertAuditChecklistItem = z.infer<typeof insertAuditChecklistItemSchema>;

export type AuditChecklistTemplate = typeof auditChecklistTemplates.$inferSelect;
export type InsertAuditChecklistTemplate = z.infer<typeof insertAuditChecklistTemplateSchema>;

export type AuditChecklistQuestion = typeof auditChecklistQuestions.$inferSelect;
export type InsertAuditChecklistQuestion = z.infer<typeof insertAuditChecklistQuestionSchema>;

export type AuditResponse = typeof auditResponses.$inferSelect;
export type InsertAuditResponse = z.infer<typeof insertAuditResponseSchema>;

export type AuditFinding = typeof auditFindings.$inferSelect;
export type InsertAuditFinding = z.infer<typeof insertAuditFindingSchema>;

export type SupplierCorrectiveRequest = typeof supplierCorrectiveRequests.$inferSelect;
export type InsertSupplierCorrectiveRequest = z.infer<typeof insertSupplierCorrectiveRequestSchema>;

export type ScrAttachment = typeof scrAttachments.$inferSelect;
export type InsertScrAttachment = z.infer<typeof insertScrAttachmentSchema>;

// Storage Configuration & External Repository Integration
// ISO 13485:2016 (4.2.5), ISO/IEC 27001 compliant storage management

export const storageProviders = pgTable("storage_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // aws-s3, azure-blob, gcp-storage, sharepoint, local-sftp
  providerType: text("provider_type").notNull(),
  description: text("description"),
  configSchema: json("config_schema").notNull(), // JSON schema for provider-specific configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storageConfigs = pgTable("storage_configs", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => storageProviders.id),
  configName: text("config_name").notNull(),
  configJson: json("config_json").notNull(), // Encrypted credentials and settings
  isActive: boolean("is_active").default(false),
  isDefault: boolean("is_default").default(false),
  documentTypeFilter: text("document_type_filter"), // JSON array of document types
  directoryMapping: json("directory_mapping"), // Custom directory structure per document type
  connectionStatus: text("connection_status").default("untested"), // untested, connected, failed
  lastTestDate: timestamp("last_test_date"),
  testResults: json("test_results"), // Connection test results and error messages
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueDefaultPerProvider: uniqueIndex("unique_default_per_provider").on(table.providerId, table.isDefault).where(eq(table.isDefault, true)),
}));

export const storageFiles = pgTable("storage_files", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  configId: integer("config_id").notNull().references(() => storageConfigs.id),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  filePath: text("file_path").notNull(), // Path in external storage
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  checksum: text("checksum"), // SHA-256 for integrity verification
  version: text("version").default("1.0"),
  documentType: text("document_type"), // SOP, WI, FORM, etc.
  classification: text("classification").default("internal"), // public, internal, confidential, restricted
  encryptionStatus: text("encryption_status").default("encrypted"), // encrypted, plaintext
  metadata: json("metadata"), // Additional file metadata
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  archivedAt: timestamp("archived_at"),
  isArchived: boolean("is_archived").default(false),
});

// ISO 13485:2016 & FDA 21 CFR Part 11 compliant audit logging
export const fileAuditLog = pgTable("file_audit_log", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").references(() => storageFiles.id),
  documentId: integer("document_id").references(() => documents.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // upload, download, delete, move, copy, view, share, modify
  actionDetails: json("action_details"), // Additional action-specific data
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
  geolocation: json("geolocation"), // Optional location data
  riskLevel: text("risk_level").default("low"), // low, medium, high, critical
  complianceFlags: json("compliance_flags"), // ISO 13485, FDA 21 CFR Part 11 flags
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  duration: integer("duration"), // Action duration in milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  validationStatus: text("validation_status").default("valid"), // valid, warning, violation
});

// Storage migration tracking for provider changes
export const storageMigrations = pgTable("storage_migrations", {
  id: serial("id").primaryKey(),
  migrationId: text("migration_id").notNull().unique(),
  sourceConfigId: integer("source_config_id").notNull().references(() => storageConfigs.id),
  targetConfigId: integer("target_config_id").notNull().references(() => storageConfigs.id),
  status: text("status").default("pending"), // pending, in_progress, completed, failed, cancelled
  totalFiles: integer("total_files").default(0),
  processedFiles: integer("processed_files").default(0),
  failedFiles: integer("failed_files").default(0),
  migrationLog: json("migration_log"), // Detailed migration progress and errors
  startedBy: integer("started_by").notNull().references(() => users.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // Estimated duration in minutes
  actualDuration: integer("actual_duration"), // Actual duration in minutes
});

// Storage access control - RBAC enforcement at file level
export const storageAccessControl = pgTable("storage_access_control", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => storageFiles.id),
  userId: integer("user_id").references(() => users.id),
  roleId: text("role_id"), // admin, manager, qa, viewer, or custom roles
  departmentId: integer("department_id"), // Department-level access
  permissions: json("permissions").notNull(), // read, write, delete, share, admin
  accessLevel: text("access_level").default("read"), // read, write, admin
  expirationDate: timestamp("expiration_date"),
  grantedBy: integer("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedBy: integer("revoked_by").references(() => users.id),
  revokedAt: timestamp("revoked_at"),
  isActive: boolean("is_active").default(true),
  accessReason: text("access_reason"), // Business justification for access
});

// External sharing and collaboration tracking
export const storageSharing = pgTable("storage_sharing", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => storageFiles.id),
  shareToken: text("share_token").notNull().unique(),
  shareType: text("share_type").notNull(), // link, email, download, view_only
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  expirationDate: timestamp("expiration_date"),
  downloadLimit: integer("download_limit"),
  downloadCount: integer("download_count").default(0),
  password: text("password"), // Optional password protection
  accessLog: json("access_log"), // Track who accessed the shared file
  sharedBy: integer("shared_by").notNull().references(() => users.id),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
  isActive: boolean("is_active").default(true),
  revokedAt: timestamp("revoked_at"),
  revokedBy: integer("revoked_by").references(() => users.id),
});

// Insert schemas for storage management
export const insertStorageProviderSchema = createInsertSchema(storageProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorageConfigSchema = createInsertSchema(storageConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  lastTestDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertStorageFileSchema = createInsertSchema(storageFiles).omit({
  id: true,
  uploadedAt: true,
  archivedAt: true,
});

export const insertFileAuditLogSchema = createInsertSchema(fileAuditLog).omit({
  id: true,
  timestamp: true,
});

export const insertStorageMigrationSchema = createInsertSchema(storageMigrations).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertStorageAccessControlSchema = createInsertSchema(storageAccessControl).omit({
  id: true,
  grantedAt: true,
  revokedAt: true,
}).extend({
  expirationDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertStorageSharingSchema = createInsertSchema(storageSharing).omit({
  id: true,
  sharedAt: true,
  lastAccessedAt: true,
  revokedAt: true,
}).extend({
  expirationDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

// Storage management types
export type StorageProvider = typeof storageProviders.$inferSelect;
export type InsertStorageProvider = z.infer<typeof insertStorageProviderSchema>;

export type StorageConfig = typeof storageConfigs.$inferSelect;
export type InsertStorageConfig = z.infer<typeof insertStorageConfigSchema>;

export type StorageFile = typeof storageFiles.$inferSelect;
export type InsertStorageFile = z.infer<typeof insertStorageFileSchema>;

export type FileAuditLog = typeof fileAuditLog.$inferSelect;
export type InsertFileAuditLog = z.infer<typeof insertFileAuditLogSchema>;

export type StorageMigration = typeof storageMigrations.$inferSelect;
export type InsertStorageMigration = z.infer<typeof insertStorageMigrationSchema>;

export type StorageAccessControl = typeof storageAccessControl.$inferSelect;
export type InsertStorageAccessControl = z.infer<typeof insertStorageAccessControlSchema>;

export type StorageSharing = typeof storageSharing.$inferSelect;
export type InsertStorageSharing = z.infer<typeof insertStorageSharingSchema>;

// Define relations
export const auditsRelations = relations(audits, ({ one, many }) => ({
  type: one(auditTypes, {
    fields: [audits.typeId],
    references: [auditTypes.id],
  }),
  status: one(auditStatuses, {
    fields: [audits.statusId],
    references: [auditStatuses.id],
  }),
  creator: one(users, {
    fields: [audits.createdBy],
    references: [users.id],
  }),
  checklistItems: many(auditChecklistItems),
  responses: many(auditResponses),
  findings: many(auditFindings),
  supplierCorrectiveRequests: many(supplierCorrectiveRequests),
}));

export const auditChecklistTemplatesRelations = relations(auditChecklistTemplates, ({ one, many }) => ({
  auditType: one(auditTypes, {
    fields: [auditChecklistTemplates.auditTypeId],
    references: [auditTypes.id],
  }),
  creator: one(users, {
    fields: [auditChecklistTemplates.createdBy],
    references: [users.id],
  }),
  questions: many(auditChecklistQuestions),
}));

export const auditChecklistQuestionsRelations = relations(auditChecklistQuestions, ({ one, many }) => ({
  template: one(auditChecklistTemplates, {
    fields: [auditChecklistQuestions.templateId],
    references: [auditChecklistTemplates.id],
  }),
  responses: many(auditResponses),
}));

export const auditResponsesRelations = relations(auditResponses, ({ one, many }) => ({
  audit: one(audits, {
    fields: [auditResponses.auditId],
    references: [audits.id],
  }),
  question: one(auditChecklistQuestions, {
    fields: [auditResponses.questionId],
    references: [auditChecklistQuestions.id],
  }),
  respondent: one(users, {
    fields: [auditResponses.respondedBy],
    references: [users.id],
  }),
  findings: many(auditFindings),
}));

export const auditFindingsRelations = relations(auditFindings, ({ one }) => ({
  audit: one(audits, {
    fields: [auditFindings.auditId],
    references: [audits.id],
  }),
  response: one(auditResponses, {
    fields: [auditFindings.responseId],
    references: [auditResponses.id],
  }),
  assignee: one(users, {
    fields: [auditFindings.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [auditFindings.createdBy],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [auditFindings.verifiedBy],
    references: [users.id],
  }),
}));

export const auditChecklistItemsRelations = relations(auditChecklistItems, ({ one, many }) => ({
  audit: one(audits, {
    fields: [auditChecklistItems.auditId],
    references: [audits.id],
  }),
  supplierCorrectiveRequests: many(supplierCorrectiveRequests),
}));

export const supplierCorrectiveRequestsRelations = relations(supplierCorrectiveRequests, ({ one, many }) => ({
  status: one(scrStatuses, {
    fields: [supplierCorrectiveRequests.statusId],
    references: [scrStatuses.id],
  }),
  audit: one(audits, {
    fields: [supplierCorrectiveRequests.auditId],
    references: [audits.id],
  }),
  finding: one(auditChecklistItems, {
    fields: [supplierCorrectiveRequests.findingId],
    references: [auditChecklistItems.id],
  }),
  assignedToUser: one(users, {
    fields: [supplierCorrectiveRequests.assignedTo],
    references: [users.id],
  }),
  initiatedByUser: one(users, {
    fields: [supplierCorrectiveRequests.initiatedBy],
    references: [users.id],
  }),
  attachments: many(scrAttachments),
}));

export const scrAttachmentsRelations = relations(scrAttachments, ({ one }) => ({
  scr: one(supplierCorrectiveRequests, {
    fields: [scrAttachments.scrId],
    references: [supplierCorrectiveRequests.id],
  }),
  uploadedByUser: one(users, {
    fields: [scrAttachments.uploadedBy],
    references: [users.id],
  }),
}));

// -----------------------------------------------------------
// End of existing Management Review Module - We'll enhance it later
// -----------------------------------------------------------

// -----------------------------------------------------------
// Production Module
// -----------------------------------------------------------

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productCode: text("product_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  classification: text("classification"),
  regulatoryStatus: text("regulatory_status"),
  specifications: json("specifications"), // JSON object with product specifications
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Production Batches
export const productionBatches = pgTable("production_batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull(),
  productId: integer("product_id").notNull(),
  status: text("status").notNull(), // planned, in-progress, completed, on-hold, cancelled
  batchSize: integer("batch_size").notNull(),
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  expirationDate: timestamp("expiration_date"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Process Steps for Production Batches
export const batchProcessSteps = pgTable("batch_process_steps", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  description: text("description").notNull(),
  expectedResult: text("expected_result"),
  actualResult: text("actual_result"),
  status: text("status").notNull(), // pending, in-progress, completed, deviation
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  performedBy: integer("performed_by"),
  verifiedBy: integer("verified_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Materials
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  materialCode: text("material_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // raw-material, component, packaging
  specifications: json("specifications"), // JSON object with material specifications
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deviations in Production Batches
export const batchDeviations = pgTable("batch_deviations", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, major, minor
  rootCause: text("root_cause"),
  impact: text("impact"),
  immediateActions: text("immediate_actions"),
  correctiveActions: text("corrective_actions"),
  status: text("status").notNull(), // open, in-review, approved, closed
  reportedBy: integer("reported_by").notNull(),
  reviewedBy: integer("reviewed_by"),
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quality Checks for Production Batches
export const qualityChecks = pgTable("quality_checks", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  checkType: text("check_type").notNull(), // in-process, final
  parameterName: text("parameter_name").notNull(),
  specification: text("specification").notNull(),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  result: text("result"),
  status: text("status").notNull(), // pending, passed, failed
  performedBy: integer("performed_by"),
  verifiedBy: integer("verified_by"),
  performedAt: timestamp("performed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Equipment for Production
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  equipmentCode: text("equipment_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull(), // operational, maintenance, out-of-service, calibration
  calibrationDue: timestamp("calibration_due"),
  maintenanceDue: timestamp("maintenance_due"),
  lastQualifiedDate: timestamp("last_qualified_date"),
  specifications: json("specifications"), // JSON object with equipment specifications
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Nonconforming Products Management
export const nonconformingSeverityLevels = pgTable("nonconforming_severity_levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull(),
});

export const nonconformingStatuses = pgTable("nonconforming_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull(),
});

export const nonconformingProducts = pgTable("nonconforming_products", {
  id: serial("id").primaryKey(),
  ncpId: text("ncp_id").notNull().unique(), // Nonconforming Product ID (e.g., NCP-2025-001)
  batchId: integer("batch_id").notNull(),
  productId: integer("product_id").notNull(),
  detectedAt: timestamp("detected_at").notNull(),
  detectedBy: integer("detected_by").notNull(),
  detectionStage: text("detection_stage").notNull(), // in-process, final-inspection, packaging, etc.
  description: text("description").notNull(),
  severityId: integer("severity_id").notNull(),
  statusId: integer("status_id").notNull().default(1), // Default to "identified"
  
  // For product identification
  batchNumber: text("batch_number").notNull(),
  lotNumber: text("lot_number"),
  serialNumber: text("serial_number"),
  
  // Containment and disposition
  containmentActions: text("containment_actions"),
  containmentDate: timestamp("containment_date"),
  dispositionDecision: text("disposition_decision"), // use-as-is, rework, repair, scrap, return-to-supplier
  dispositionJustification: text("disposition_justification"),
  dispositionBy: integer("disposition_by"),
  dispositionDate: timestamp("disposition_date"),
  
  // Review and closure
  reviewedBy: integer("reviewed_by"),
  reviewDate: timestamp("review_date"),
  closedBy: integer("closed_by"),
  closedDate: timestamp("closed_date"),
  
  // CAPA linkage
  capaId: integer("capa_id"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Nonconforming Product Attachments
export const nonconformingProductAttachments = pgTable("nonconforming_product_attachments", {
  id: serial("id").primaryKey(),
  ncpId: integer("ncp_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  description: text("description"),
});

// Create insert schemas for Production Module
export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertProductionBatchSchema = createInsertSchema(productionBatches).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make batchNumber optional as it will be auto-generated
  batchNumber: z.string().optional(),
  plannedStartDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  plannedEndDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  actualStartDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  actualEndDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertBatchProcessStepSchema = createInsertSchema(batchProcessSteps).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertBatchDeviationSchema = createInsertSchema(batchDeviations).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertQualityCheckSchema = createInsertSchema(qualityChecks).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertNonconformingProductSchema = createInsertSchema(nonconformingProducts).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
}).extend({
  detectedAt: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  dispositionDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  containmentDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  reviewDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  closedDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertNonconformingProductAttachmentSchema = createInsertSchema(nonconformingProductAttachments).omit({ 
  id: true, 
  uploadedAt: true,
});

// Define the types for Production Module
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductionBatch = typeof productionBatches.$inferSelect;
export type InsertProductionBatch = z.infer<typeof insertProductionBatchSchema>;

export type BatchProcessStep = typeof batchProcessSteps.$inferSelect;
export type InsertBatchProcessStep = z.infer<typeof insertBatchProcessStepSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type BatchDeviation = typeof batchDeviations.$inferSelect;
export type InsertBatchDeviation = z.infer<typeof insertBatchDeviationSchema>;

export type QualityCheck = typeof qualityChecks.$inferSelect;
export type InsertQualityCheck = z.infer<typeof insertQualityCheckSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type NonconformingProduct = typeof nonconformingProducts.$inferSelect;
export type InsertNonconformingProduct = z.infer<typeof insertNonconformingProductSchema>;

export type NonconformingProductAttachment = typeof nonconformingProductAttachments.$inferSelect;
export type InsertNonconformingProductAttachment = z.infer<typeof insertNonconformingProductAttachmentSchema>;

// Define relations for Production Module
export const productsRelations = relations(products, ({ many }) => ({
  batches: many(productionBatches),
  nonconformingProducts: many(nonconformingProducts),
}));

export const productionBatchesRelations = relations(productionBatches, ({ one, many }) => ({
  product: one(products, {
    fields: [productionBatches.productId],
    references: [products.id],
  }),
  createdByUser: one(users, {
    fields: [productionBatches.createdBy],
    references: [users.id],
  }),
  processSteps: many(batchProcessSteps),
  deviations: many(batchDeviations),
  qualityChecks: many(qualityChecks),
  nonconformingProducts: many(nonconformingProducts),
}));

export const batchProcessStepsRelations = relations(batchProcessSteps, ({ one }) => ({
  batch: one(productionBatches, {
    fields: [batchProcessSteps.batchId],
    references: [productionBatches.id],
  }),
  performedByUser: one(users, {
    fields: [batchProcessSteps.performedBy],
    references: [users.id],
  }),
  verifiedByUser: one(users, {
    fields: [batchProcessSteps.verifiedBy],
    references: [users.id],
  }),
}));

export const batchDeviationsRelations = relations(batchDeviations, ({ one }) => ({
  batch: one(productionBatches, {
    fields: [batchDeviations.batchId],
    references: [productionBatches.id],
  }),
  reportedByUser: one(users, {
    fields: [batchDeviations.reportedBy],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [batchDeviations.reviewedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [batchDeviations.approvedBy],
    references: [users.id],
  }),
}));

export const qualityChecksRelations = relations(qualityChecks, ({ one }) => ({
  batch: one(productionBatches, {
    fields: [qualityChecks.batchId],
    references: [productionBatches.id],
  }),
  performedByUser: one(users, {
    fields: [qualityChecks.performedBy],
    references: [users.id],
  }),
  verifiedByUser: one(users, {
    fields: [qualityChecks.verifiedBy],
    references: [users.id],
  }),
}));

export const nonconformingProductsRelations = relations(nonconformingProducts, ({ one, many }) => ({
  batch: one(productionBatches, {
    fields: [nonconformingProducts.batchId],
    references: [productionBatches.id],
  }),
  product: one(products, {
    fields: [nonconformingProducts.productId],
    references: [products.id],
  }),
  severity: one(nonconformingSeverityLevels, {
    fields: [nonconformingProducts.severityId],
    references: [nonconformingSeverityLevels.id],
  }),
  status: one(nonconformingStatuses, {
    fields: [nonconformingProducts.statusId],
    references: [nonconformingStatuses.id],
  }),
  detectedByUser: one(users, {
    fields: [nonconformingProducts.detectedBy],
    references: [users.id],
  }),
  dispositionByUser: one(users, {
    fields: [nonconformingProducts.dispositionBy],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [nonconformingProducts.reviewedBy],
    references: [users.id],
  }),
  closedByUser: one(users, {
    fields: [nonconformingProducts.closedBy],
    references: [users.id],
  }),
  capa: one(capas, {
    fields: [nonconformingProducts.capaId],
    references: [capas.id],
  }),
  attachments: many(nonconformingProductAttachments),
}));

export const nonconformingProductAttachmentsRelations = relations(nonconformingProductAttachments, ({ one }) => ({
  nonconformingProduct: one(nonconformingProducts, {
    fields: [nonconformingProductAttachments.ncpId],
    references: [nonconformingProducts.id],
  }),
  uploadedByUser: one(users, {
    fields: [nonconformingProductAttachments.uploadedBy],
    references: [users.id],
  }),
}));

// Measurement & Analysis Module
// Define complaint status and category enums
export const complaintStatusEnum = pgEnum('complaint_status', [
  'new', 'under_investigation', 'corrective_action', 'resolved', 'closed'
]);

export const complaintCategoryEnum = pgEnum('complaint_category', [
  'product_quality', 'adverse_event', 'packaging', 'labeling', 'shipping', 'other'
]);

// Customer Complaints
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintNumber: text("complaint_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerContact: text("customer_contact").notNull(),
  productId: integer("product_id"),
  batchNumber: text("batch_number"),
  serialNumber: text("serial_number"),
  description: text("description").notNull(),
  dateReceived: timestamp("date_received").notNull(),
  // Use defined enum type for consistency
  category: text("category").notNull().$type<typeof complaintCategoryEnum.enumValues[number]>(),
  severity: integer("severity").notNull(),
  assignedTo: integer("assigned_to"),
  investigationFindings: text("investigation_findings"),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  // Use defined enum type for consistency
  status: text("status").notNull().$type<typeof complaintStatusEnum.enumValues[number]>(),
  dueDate: timestamp("due_date"),
  closedDate: timestamp("closed_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isReportable: boolean("is_reportable"),
  reportabilityReason: text("reportability_reason"),
  regulationType: text("regulation_type"),
  capaId: integer("capa_id"),
});

// Customer Feedback
export const customerFeedback = pgTable("customer_feedback", {
  id: serial("id").primaryKey(),
  feedbackNumber: text("feedback_number").notNull().unique(), // Added for automatic number generation
  dateReceived: timestamp("date_received").notNull(),
  feedbackSource: text("feedback_source").notNull(),
  productId: integer("product_id"),
  feedbackType: text("feedback_type").notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  attachmentPath: text("attachment_path"),
  category: text("category").notNull(),
  targetResponseDays: integer("target_response_days").notNull(),
  actualResponseDate: timestamp("actual_response_date"),
  assignedTo: integer("assigned_to"),
  status: text("status").notNull(),
  dateClosed: timestamp("date_closed"),
  sentiment: text("sentiment"),
  justification: text("justification"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Calibration Assets
export const calibrationAssets = pgTable("calibration_assets", {
  id: serial("id").primaryKey(),
  assetId: varchar("asset_id").notNull(),
  name: varchar("name").notNull(),
  manufacturer: varchar("manufacturer").notNull(),
  serialNumber: varchar("serial_number").notNull(),
  model: varchar("model"),
  location: varchar("location").notNull(),
  department: varchar("department"),
  calibrationFrequency: integer("calibration_frequency").notNull(),
  lastCalibrationDate: timestamp("last_calibration_date"),
  nextCalibrationDate: timestamp("next_calibration_date"),
  status: varchar("status").notNull(),
  notes: varchar("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Calibration Records
export const calibrationRecords = pgTable("calibration_records", {
  id: serial("id").primaryKey(),
  recordId: varchar("record_id").notNull(),
  assetId: integer("asset_id").notNull(),
  calibrationDate: timestamp("calibration_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  performedBy: integer("performed_by").notNull(),
  verifiedBy: integer("verified_by"),
  status: varchar("status").notNull(),
  results: varchar("results"),
  deviation: decimal("deviation"),
  certificateNumber: varchar("certificate_number"),
  certificatePath: varchar("certificate_path"),
  notes: varchar("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schemas for Measurement & Analysis
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  capaId: true, // Will be populated when a CAPA is created from the complaint
}).extend({
  // Make complaintNumber optional as it will be auto-generated
  complaintNumber: z.string().optional(),
  dateReceived: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  dueDate: z.string().or(z.date()).optional().transform((val) => {
    if (val && typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  closedDate: z.string().or(z.date()).optional().transform((val) => {
    if (val && typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertCustomerFeedbackSchema = createInsertSchema(customerFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make feedbackNumber optional as it will be auto-generated
  feedbackNumber: z.string().optional(),
  // Handle date format for dateReceived
  dateReceived: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  // Handle date format for actualResponseDate
  actualResponseDate: z.string().or(z.date()).optional().transform((val) => {
    if (val && typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  // Handle date format for dateClosed
  dateClosed: z.string().or(z.date()).optional().transform((val) => {
    if (val && typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertCalibrationAssetSchema = createInsertSchema(calibrationAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalibrationRecordSchema = createInsertSchema(calibrationRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types for Measurement & Analysis
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = z.infer<typeof insertCustomerFeedbackSchema>;

export type CalibrationAsset = typeof calibrationAssets.$inferSelect;
export type InsertCalibrationAsset = z.infer<typeof insertCalibrationAssetSchema>;

export type CalibrationRecord = typeof calibrationRecords.$inferSelect;
export type InsertCalibrationRecord = z.infer<typeof insertCalibrationRecordSchema>;

// Define relations for Measurement & Analysis
export const complaintsRelations = relations(complaints, ({ one }) => ({
  assignedToUser: one(users, {
    fields: [complaints.assignedTo],
    references: [users.id],
  }),
  capa: one(capas, {
    fields: [complaints.capaId],
    references: [capas.id],
  }),
}));

export const customerFeedbackRelations = relations(customerFeedback, ({ one }) => ({
  assignedToUser: one(users, {
    fields: [customerFeedback.assignedTo],
    references: [users.id],
  }),
}));

export const calibrationAssetsRelations = relations(calibrationAssets, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [calibrationAssets.createdBy],
    references: [users.id],
  }),
  calibrationRecords: many(calibrationRecords),
}));

export const calibrationRecordsRelations = relations(calibrationRecords, ({ one }) => ({
  asset: one(calibrationAssets, {
    fields: [calibrationRecords.assetId],
    references: [calibrationAssets.id],
  }),
  performedByUser: one(users, {
    fields: [calibrationRecords.performedBy],
    references: [users.id],
  }),
  verifiedByUser: one(users, {
    fields: [calibrationRecords.verifiedBy],
    references: [users.id],
  }),
}));

// ========================================
// ISO 13485:7.3 & IEC 62304 DESIGN CONTROL SYSTEM
// Flow-based Project Management Implementation
// ========================================

// Enhanced Technical Documentation with Design Control Integration
export const technicalDocumentationCategories = pgTable("technical_documentation_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  requiresDesignControl: boolean("requires_design_control").default(false),
  annexReference: text("annex_reference"), // EU MDR Annex reference
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced Technical Documentation Integration with Design Control
// Using existing schema with additional linkages for design control integration

// Design Project Types (ISO 13485:7.3.2)
export const designProjectTypes = pgTable("design_project_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(), // NP, DC, SD
  description: text("description"),
  requiresSoftwareLifecycle: boolean("requires_software_lifecycle").default(false),
  defaultPhaseTemplate: text("default_phase_template"), // JSON template for phases
});

// Design Project Statuses (Flow States)
export const designProjectStatuses = pgTable("design_project_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isTerminal: boolean("is_terminal").default(false),
  allowedTransitions: text("allowed_transitions"), // JSON array of next allowed statuses
});

// Design Project Phases (ISO 13485:7.3.2 Planning)
export const designProjectPhases = pgTable("design_project_phases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  isGate: boolean("is_gate").default(false), // true for gates that require formal approval
  isoClause: text("iso_clause"), // e.g., "7.3.2", "7.3.5"
  iecClause: text("iec_clause"), // e.g., "5.1", "5.2"
  requiredDeliverables: text("required_deliverables"), // JSON array
  entryExitCriteria: text("entry_exit_criteria"), // JSON object
  isActive: boolean("is_active").default(true),
});

// Project Phase Instances (per project)
export const projectPhaseInstances = pgTable("project_phase_instances", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  phaseId: integer("phase_id").notNull().references(() => designProjectPhases.id),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, under_review, approved, completed
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  approver: integer("approver").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  completionPercentage: integer("completion_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gantt-linked Tasks (Project Management)
export const designProjectTasks: any = pgTable("design_project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  phaseInstanceId: integer("phase_instance_id"),
  taskId: text("task_id").notNull().unique(), // AUTO: TSK-DP-2025-001-001
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(), // deliverable, review, verification, validation, gate
  priority: text("priority").notNull().default("medium"), // critical, high, medium, low
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, blocked, completed, cancelled
  blockingReason: text("blocking_reason"),
  assigneeId: integer("assignee_id").references(() => users.id),
  reviewerId: integer("reviewer_id").references(() => users.id),
  parentTaskId: integer("parent_task_id"),
  dependencies: text("dependencies"), // JSON array of task IDs
  completionPercentage: integer("completion_percentage").default(0),
  isoRequirement: text("iso_requirement"), // Link to ISO 13485 clause
  iecRequirement: text("iec_requirement"), // Link to IEC 62304 clause
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Design Project Master (Enhanced) - Keeping existing definition but adding fields for Technical Documentation
export const designProjects = pgTable("design_projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(), // AUTO: DP-2025-001
  projectTypeId: integer("project_type_id").notNull().references(() => designProjectTypes.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  objective: text("objective").notNull(),
  statusId: integer("status_id").notNull().references(() => designProjectStatuses.id),
  initiatedBy: integer("initiated_by").notNull().references(() => users.id),
  riskLevel: text("risk_level").notNull(), // Low, Medium, High, Critical
  riskClass: text("risk_class"), // Class I, II, III (FDA), Class I, IIa, IIb, III (EU)
  regulatoryPathway: text("regulatory_pathway"), // 510(k), PMA, De Novo, CE Mark, etc.
  regulatoryImpact: boolean("regulatory_impact").default(false),
  hasSoftwareComponent: boolean("has_software_component").default(false),
  softwareClassification: text("software_classification"), // Class A, B, C (IEC 62304)
  responsiblePerson: integer("responsible_person").notNull().references(() => users.id),
  projectManager: integer("project_manager").references(() => users.id),
  qualityLead: integer("quality_lead").references(() => users.id),
  regulatoryLead: integer("regulatory_lead").references(() => users.id),
  clinicalLead: integer("clinical_lead").references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  targetCompletionDate: timestamp("target_completion_date").notNull(),
  actualCompletionDate: timestamp("actual_completion_date"),
  currentPhaseId: integer("current_phase_id").references(() => projectPhaseInstances.id),
  overallProgress: integer("overall_progress").default(0), // 0-100%
  budgetAllocated: decimal("budget_allocated", { precision: 12, scale: 2 }),
  budgetSpent: decimal("budget_spent", { precision: 12, scale: 2 }),
  notes: text("notes"),
  // Phase-gated Design Review Fields (ISO 13485:7.3)
  planningReviewStatus: text("planning_review_status").default("pending"), // pending, completed, approved, rejected
  planningReviewDate: timestamp("planning_review_date"),
  planningReviewOutcome: text("planning_review_outcome"), // DR-DP-2025-001-01
  inputsReviewStatus: text("inputs_review_status").default("pending"),
  inputsReviewDate: timestamp("inputs_review_date"),
  inputsReviewOutcome: text("inputs_review_outcome"), // DR-DP-2025-001-02
  outputsReviewStatus: text("outputs_review_status").default("pending"),
  outputsReviewDate: timestamp("outputs_review_date"),
  outputsReviewOutcome: text("outputs_review_outcome"), // DR-DP-2025-001-03
  verificationReviewStatus: text("verification_review_status").default("pending"),
  verificationReviewDate: timestamp("verification_review_date"),
  verificationReviewOutcome: text("verification_review_outcome"), // DR-DP-2025-001-04
  validationReviewStatus: text("validation_review_status").default("pending"),
  validationReviewDate: timestamp("validation_review_date"),
  validationReviewOutcome: text("validation_review_outcome"), // DR-DP-2025-001-05
  transferReviewStatus: text("transfer_review_status").default("pending"),
  transferReviewDate: timestamp("transfer_review_date"),
  transferReviewOutcome: text("transfer_review_outcome"), // DR-DP-2025-001-06
  isArchived: boolean("is_archived").default(false),
  archivedBy: integer("archived_by").references(() => users.id),
  archivedAt: timestamp("archived_at"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Phase-gated Design Review Outcomes (ISO 13485:7.3.4)
export const designPhaseReviewOutcomes = pgTable("design_phase_review_outcomes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  reviewId: text("review_id").notNull().unique(), // DR-DP-2025-001-01
  phase: text("phase").notNull(), // planning, inputs, outputs, verification, validation, transfer
  reviewDate: timestamp("review_date").notNull(),
  chairperson: integer("chairperson").notNull().references(() => users.id),
  outcome: text("outcome").notNull(), // approved, approved_with_conditions, rejected
  conditions: text("conditions"), // Required actions if approved with conditions
  actionItems: text("action_items"), // JSON array of action items
  participants: text("participants"), // JSON array of participant IDs
  reviewNotes: text("review_notes"),
  dhfReference: text("dhf_reference"), // Reference to DHF section
  capaRequired: boolean("capa_required").default(false),
  capaId: integer("capa_id").references(() => capas.id),
  nextReviewDate: timestamp("next_review_date"),
  reviewedBy: integer("reviewed_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ISO 13485:7.3.2 Design Planning & User Requirements
export const designPlanningPhases = pgTable("design_planning_phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  phaseId: text("phase_id").notNull().unique(), // DP-DP-2025-001-01
  phaseName: text("phase_name").notNull(), // Design Planning, User Needs Analysis, etc.
  phaseDescription: text("phase_description").notNull(),
  phaseOrder: integer("phase_order").notNull(),
  isoClause: text("iso_clause"), // 7.3.2
  cfr820Clause: text("cfr820_clause"), // 820.30(b)
  iec62304Clause: text("iec62304_clause"), // 5.1.1
  entryGate: text("entry_gate"), // Conditions to enter this phase
  exitGate: text("exit_gate"), // Conditions to exit this phase
  deliverables: text("deliverables"), // JSON array of required deliverables
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  phaseStatus: text("phase_status").default("planned"), // planned, active, completed, on_hold
  phaseLeader: integer("phase_leader").references(() => users.id),
  reviewRequired: boolean("review_required").default(true),
  reviewStatus: text("review_status").default("pending"), // pending, scheduled, completed
  reviewDate: timestamp("review_date"),
  reviewOutcome: text("review_outcome"), // approved, conditional, rejected
  reviewNotes: text("review_notes"),
  riskLevel: text("risk_level").default("medium"), // low, medium, high, critical
  regulatoryImpact: boolean("regulatory_impact").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRequirements = pgTable("user_requirements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  requirementId: text("requirement_id").notNull().unique(), // UR-DP-2025-001-001
  parentRequirementId: integer("parent_requirement_id").references(() => userRequirements.id),
  requirementType: text("requirement_type").notNull(), // functional, performance, safety, usability, regulatory
  stakeholderCategory: text("stakeholder_category").notNull(), // patient, clinician, operator, regulator, maintenance
  title: text("title").notNull(),
  description: text("description").notNull(),
  rationale: text("rationale").notNull(), // Why this requirement exists
  source: text("source").notNull(), // FDA guidance, ISO standard, user study, etc.
  sourceDocument: text("source_document"), // Reference to specific document/study
  priority: text("priority").notNull().default("medium"), // critical, high, medium, low
  riskLevel: text("risk_level").default("medium"), // low, medium, high, critical
  verificationMethod: text("verification_method"), // test, analysis, inspection, demonstration
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  assumptions: text("assumptions"), // Any assumptions made
  constraints: text("constraints"), // Technical or regulatory constraints
  hazardAnalysisRef: text("hazard_analysis_ref"), // Reference to risk analysis
  regulatoryContext: text("regulatory_context"), // FDA 510(k), CE marking, etc.
  usabilityContext: text("usability_context"), // IEC 62366 considerations
  softwareContext: text("software_context"), // IEC 62304 safety classification
  status: text("status").default("draft"), // draft, approved, implemented, verified, validated
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  implementationNotes: text("implementation_notes"),
  traceabilityStatus: text("traceability_status").default("pending"), // pending, linked, verified
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const designPlanDocuments = pgTable("design_plan_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  documentId: text("document_id").notNull().unique(), // DPD-DP-2025-001-001
  documentType: text("document_type").notNull(), // design_plan, user_needs_analysis, regulatory_strategy
  title: text("title").notNull(),
  description: text("description"),
  version: text("version").notNull().default("1.0"),
  filePath: text("file_path"),
  approvalStatus: text("approval_status").default("draft"), // draft, under_review, approved
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  effectiveDate: timestamp("effective_date"),
  reviewDate: timestamp("review_date"),
  nextReviewDate: timestamp("next_review_date"),
  isControlled: boolean("is_controlled").default(true),
  distributionList: text("distribution_list"), // JSON array of user IDs
  templateUsed: text("template_used"), // Reference to template
  regulatorySubmission: boolean("regulatory_submission").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ISO 13485:7.3.3 Design Inputs Management
export const designInputTypes = pgTable("design_input_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isoClause: text("iso_clause"), // 7.3.3
  iecClause: text("iec_clause"), // 5.2
  isRequired: boolean("is_required").default(true),
});

export const designInputs = pgTable("design_inputs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  inputId: text("input_id").notNull().unique(), // AUTO: DI-DP-2025-001-001
  title: text("title").notNull(),
  description: text("description").notNull(),
  inputTypeId: integer("input_type_id").notNull().references(() => designInputTypes.id),
  source: text("source").notNull(), // User Need, Market Research, Regulatory, Clinical, Risk Analysis
  sourceDocumentId: text("source_document_id"), // Reference to source document
  functionalRequirement: boolean("functional_requirement").default(false),
  performanceRequirement: boolean("performance_requirement").default(false),
  safetyRequirement: boolean("safety_requirement").default(false),
  usabilityRequirement: boolean("usability_requirement").default(false),
  regulatoryRequirement: boolean("regulatory_requirement").default(false),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  verificationMethod: text("verification_method"), // Test, Analysis, Inspection, Demonstration
  priority: text("priority").notNull().default("medium"), // critical, high, medium, low
  riskLevel: text("risk_level"), // High, Medium, Low
  traceabilityUpstream: text("traceability_upstream"), // JSON array of user needs/requirements
  traceabilityDownstream: text("traceability_downstream"), // JSON array of outputs/specs
  status: text("status").notNull().default("draft"), // draft, reviewed, approved, implemented, verified
  reviewerId: integer("reviewer_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  approverId: integer("approver_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  fileUploads: text("file_uploads"), // JSON array of uploaded files
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ISO 13485:7.3.4 Design Outputs Management
export const designOutputTypes = pgTable("design_output_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isoClause: text("iso_clause"), // 7.3.4
  iecClause: text("iec_clause"), // 5.3, 5.4
  isRequired: boolean("is_required").default(true),
});

export const designOutputs = pgTable("design_outputs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  outputId: text("output_id").notNull().unique(), // AUTO: DO-DP-2025-001-001
  title: text("title").notNull(),
  description: text("description").notNull(),
  outputTypeId: integer("output_type_id").notNull().references(() => designOutputTypes.id),
  documentType: text("document_type").notNull(), // Specification, Drawing, Software, Protocol, Report
  documentReference: text("document_reference"), // Document control number
  revision: text("revision").default("1.0"),
  traceabilityToInputs: text("traceability_to_inputs"), // JSON array of design input IDs
  verificationPlanned: boolean("verification_planned").default(false),
  validationPlanned: boolean("validation_planned").default(false),
  manufacturingInstructions: boolean("manufacturing_instructions").default(false),
  acceptanceCriteria: text("acceptance_criteria"),
  safetyCharacteristics: text("safety_characteristics"), // JSON array
  status: text("status").notNull().default("draft"), // draft, reviewed, approved, released, obsolete
  reviewerId: integer("reviewer_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  approverId: integer("approver_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  fileUploads: text("file_uploads"), // JSON array of uploaded files
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ISO 13485:7.3.5 Design Reviews Management
export const designReviewTypes = pgTable("design_review_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isoClause: text("iso_clause"), // 7.3.5
  iecClause: text("iec_clause"), // 5.1.4, 5.8
  isGateReview: boolean("is_gate_review").default(false),
  requiredParticipants: text("required_participants"), // JSON array of role requirements
});

export const designReviews = pgTable("design_reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  phaseInstanceId: integer("phase_instance_id").references(() => projectPhaseInstances.id),
  reviewId: text("review_id").notNull().unique(), // AUTO: DR-DP-2025-001-001
  title: text("title").notNull(),
  description: text("description"),
  reviewTypeId: integer("review_type_id").notNull().references(() => designReviewTypes.id),
  reviewScope: text("review_scope").notNull(), // JSON array of items under review
  entryExitCriteria: text("entry_exit_criteria"), // JSON object
  plannedDate: timestamp("planned_date").notNull(),
  actualDate: timestamp("actual_date"),
  duration: integer("duration"), // in minutes
  chairperson: integer("chairperson").notNull().references(() => users.id),
  secretary: integer("secretary").references(() => users.id),
  participants: text("participants"), // JSON array of user IDs
  requiredParticipants: text("required_participants"), // JSON array of required roles/users
  actualParticipants: text("actual_participants"), // JSON array who actually attended
  reviewCriteria: text("review_criteria"), // JSON array
  reviewFindings: text("review_findings"), // JSON array of findings
  actionItems: text("action_items"), // JSON array of action items
  reviewDecision: text("review_decision"), // Approved, Approved with Conditions, Rejected, More Info Needed
  decisionRationale: text("decision_rationale"),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed, cancelled
  meetingMinutes: text("meeting_minutes"),
  fileUploads: text("file_uploads"), // JSON array of uploaded files
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Design History File (DHF) Module - ISO 13485:7.3.10 Design File
export const designHistoryFiles = pgTable("design_history_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  dhfId: text("dhf_id").notNull().unique(), // AUTO: DHF-DP-2025-001
  version: text("version").notNull().default("1.0"),
  status: text("status").notNull().default("draft"), // draft, in_review, approved, locked
  compiledDate: timestamp("compiled_date").defaultNow(),
  compiledBy: integer("compiled_by").notNull().references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  lockDate: timestamp("lock_date"),
  lockedBy: integer("locked_by").references(() => users.id),
  metadata: json("metadata"), // Compilation settings, filters, etc.
  summary: text("summary"), // Executive summary of the design project
  compilationNotes: text("compilation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dhfSections = pgTable("dhf_sections", {
  id: serial("id").primaryKey(),
  dhfId: integer("dhf_id").notNull().references(() => designHistoryFiles.id),
  sectionType: text("section_type").notNull(), // plan, inputs, outputs, reviews, verification, validation, changes, risk_management, transfer
  sectionTitle: text("section_title").notNull(),
  sectionOrder: integer("section_order").notNull(),
  phase: text("phase"), // Planning, Design, Implementation, Testing, Transfer
  chronologicalOrder: integer("chronological_order"),
  itemCount: integer("item_count").default(0),
  completedItems: integer("completed_items").default(0),
  approvedItems: integer("approved_items").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  summary: text("summary"),
  keyFindings: text("key_findings"), // JSON array of key findings
  isComplete: boolean("is_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dhfItems = pgTable("dhf_items", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => dhfSections.id),
  itemType: text("item_type").notNull(), // input, output, review, verification, validation, change, risk, transfer
  sourceTable: text("source_table").notNull(), // design_inputs, design_outputs, etc.
  sourceId: integer("source_id").notNull(), // Reference to actual record
  itemId: text("item_id").notNull(), // DI-001, DO-001, etc.
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(),
  version: text("version"),
  phase: text("phase"),
  chronologicalDate: timestamp("chronological_date"),
  approvalStatus: text("approval_status"), // draft, reviewed, approved
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  documentReference: text("document_reference"), // External document reference
  hyperlink: text("hyperlink"), // Internal eQMS link
  traceabilityLinks: text("traceability_links"), // JSON array of linked items
  riskLevel: text("risk_level"), // High, Medium, Low
  regulatoryImpact: boolean("regulatory_impact").default(false),
  safetyImpact: boolean("safety_impact").default(false),
  notes: text("notes"),
  tags: text("tags"), // JSON array of tags for filtering
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dhfReports = pgTable("dhf_reports", {
  id: serial("id").primaryKey(),
  dhfId: integer("dhf_id").notNull().references(() => designHistoryFiles.id),
  reportType: text("report_type").notNull(), // pdf, excel, summary
  reportFormat: text("report_format").notNull(), // full, executive, compliance
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  generatedBy: integer("generated_by").notNull().references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  parameters: json("parameters"), // Export parameters used
  downloadCount: integer("download_count").default(0),
  lastDownloaded: timestamp("last_downloaded"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // For temporary reports
});

export const dhfTraceabilityMatrix = pgTable("dhf_traceability_matrix", {
  id: serial("id").primaryKey(),
  dhfId: integer("dhf_id").notNull().references(() => designHistoryFiles.id),
  sourceItemId: integer("source_item_id").notNull().references(() => dhfItems.id),
  targetItemId: integer("target_item_id").notNull().references(() => dhfItems.id),
  relationshipType: text("relationship_type").notNull(), // implements, verifies, validates, derives_from, impacts
  bidirectional: boolean("bidirectional").default(false),
  strength: text("strength").default("strong"), // strong, weak, informational
  verificationStatus: text("verification_status").default("pending"), // pending, verified, broken
  lastVerified: timestamp("last_verified"),
  verifiedBy: integer("verified_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dhfAuditTrail = pgTable("dhf_audit_trail", {
  id: serial("id").primaryKey(),
  dhfId: integer("dhf_id").notNull().references(() => designHistoryFiles.id),
  action: text("action").notNull(), // compiled, exported, reviewed, approved, locked
  actionDetails: text("action_details"),
  performedBy: integer("performed_by").notNull().references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  oldValue: text("old_value"), // JSON of previous state
  newValue: text("new_value"), // JSON of new state
  reasonCode: text("reason_code"), // regulatory, quality, technical, administrative
});

// Insert Schemas and Types for Design Control
export const insertDesignProjectTypeSchema = createInsertSchema(designProjectTypes);
export const insertDesignProjectStatusSchema = createInsertSchema(designProjectStatuses);
export const insertDesignProjectPhaseSchema = createInsertSchema(designProjectPhases);
export const insertProjectPhaseInstanceSchema = createInsertSchema(projectPhaseInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDesignProjectTaskSchema = createInsertSchema(designProjectTasks).omit({
  id: true,
  taskId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDesignProjectSchema = createInsertSchema(designProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  projectCode: true, // Auto-generated
  currentPhaseId: true,
  overallProgress: true,
}).extend({
  startDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  targetCompletionDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  actualCompletionDate: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional(),
  initiatedBy: z.number().default(9999), // Default to development user
  responsiblePerson: z.number().default(9999), // Default to development user
  projectManager: z.number().optional().nullable(),
  qualityLead: z.number().optional().nullable(),
  regulatoryLead: z.number().optional().nullable(),
  clinicalLead: z.number().optional().nullable(),
  createdBy: z.number().default(9999), // Default to development user
});

export const insertDesignInputSchema = createInsertSchema(designInputs).omit({
  id: true,
  inputId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDesignOutputSchema = createInsertSchema(designOutputs).omit({
  id: true,
  outputId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDesignReviewSchema = createInsertSchema(designReviews).omit({
  id: true,
  reviewId: true,
  createdAt: true,
  updatedAt: true,
});

// DHF Insert Schemas
export const insertDesignHistoryFileSchema = createInsertSchema(designHistoryFiles).omit({
  id: true,
  dhfId: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertDhfSectionSchema = createInsertSchema(dhfSections).omit({
  id: true,
  createdAt: true,
});

export const insertDhfItemSchema = createInsertSchema(dhfItems).omit({
  id: true,
  createdAt: true,
});

export const insertDhfReportSchema = createInsertSchema(dhfReports).omit({
  id: true,
  generatedAt: true,
});

export const insertDhfTraceabilityMatrixSchema = createInsertSchema(dhfTraceabilityMatrix).omit({
  id: true,
  createdAt: true,
});

export const insertDhfAuditTrailSchema = createInsertSchema(dhfAuditTrail).omit({
  id: true,
  performedAt: true,
});

// Clean up types for existing design control
export type DesignProjectType = typeof designProjectTypes.$inferSelect;
export type InsertDesignProjectType = z.infer<typeof insertDesignProjectTypeSchema>;

export type DesignProjectStatus = typeof designProjectStatuses.$inferSelect;
export type InsertDesignProjectStatus = z.infer<typeof insertDesignProjectStatusSchema>;

export type DesignProject = typeof designProjects.$inferSelect;
export type InsertDesignProject = z.infer<typeof insertDesignProjectSchema>;

// DHF Types
export type DesignHistoryFile = typeof designHistoryFiles.$inferSelect;
export type InsertDesignHistoryFile = z.infer<typeof insertDesignHistoryFileSchema>;

export type DhfSection = typeof dhfSections.$inferSelect;
export type InsertDhfSection = z.infer<typeof insertDhfSectionSchema>;

export type DhfItem = typeof dhfItems.$inferSelect;
export type InsertDhfItem = z.infer<typeof insertDhfItemSchema>;

export type DhfReport = typeof dhfReports.$inferSelect;
export type InsertDhfReport = z.infer<typeof insertDhfReportSchema>;

export type DhfTraceabilityMatrix = typeof dhfTraceabilityMatrix.$inferSelect;
export type InsertDhfTraceabilityMatrix = z.infer<typeof insertDhfTraceabilityMatrixSchema>;

export type DhfAuditTrail = typeof dhfAuditTrail.$inferSelect;
export type InsertDhfAuditTrail = z.infer<typeof insertDhfAuditTrailSchema>;

// Design Project Relations - ISO 13485:7.3 Compliant
export const designProjectsRelations = relations(designProjects, ({ one, many }) => ({
  projectType: one(designProjectTypes, {
    fields: [designProjects.projectTypeId],
    references: [designProjectTypes.id],
  }),
  status: one(designProjectStatuses, {
    fields: [designProjects.statusId],
    references: [designProjectStatuses.id],
  }),
  responsiblePerson: one(users, {
    fields: [designProjects.responsiblePerson],
    references: [users.id],
    relationName: "responsiblePerson"
  }),
  projectManager: one(users, {
    fields: [designProjects.projectManager],
    references: [users.id],
    relationName: "projectManager"
  }),
  qualityLead: one(users, {
    fields: [designProjects.qualityLead],
    references: [users.id],
    relationName: "qualityLead"
  }),
  regulatoryLead: one(users, {
    fields: [designProjects.regulatoryLead],
    references: [users.id],
    relationName: "regulatoryLead"
  }),
  clinicalLead: one(users, {
    fields: [designProjects.clinicalLead],
    references: [users.id],
    relationName: "clinicalLead"
  }),
  createdBy: one(users, {
    fields: [designProjects.createdBy],
    references: [users.id],
    relationName: "createdBy"
  }),
  documents: many(designProjectDocuments),
  designHistoryFiles: many(designHistoryFiles),
}));

// DHF Relations
export const designHistoryFilesRelations = relations(designHistoryFiles, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [designHistoryFiles.projectId],
    references: [designProjects.id],
  }),
  compiledByUser: one(users, {
    fields: [designHistoryFiles.compiledBy],
    references: [users.id],
    relationName: "compiledBy"
  }),
  reviewedByUser: one(users, {
    fields: [designHistoryFiles.reviewedBy],
    references: [users.id],
    relationName: "reviewedBy"
  }),
  approvedByUser: one(users, {
    fields: [designHistoryFiles.approvedBy],
    references: [users.id],
    relationName: "approvedBy"
  }),
  sections: many(dhfSections),
  reports: many(dhfReports),
  traceabilityMatrix: many(dhfTraceabilityMatrix),
  auditTrail: many(dhfAuditTrail),
}));

export const dhfSectionsRelations = relations(dhfSections, ({ one, many }) => ({
  dhf: one(designHistoryFiles, {
    fields: [dhfSections.dhfId],
    references: [designHistoryFiles.id],
  }),
  items: many(dhfItems),
}));

export const dhfItemsRelations = relations(dhfItems, ({ one }) => ({
  section: one(dhfSections, {
    fields: [dhfItems.sectionId],
    references: [dhfSections.id],
  }),
  approvedByUser: one(users, {
    fields: [dhfItems.approvedBy],
    references: [users.id],
  }),
}));

export const dhfReportsRelations = relations(dhfReports, ({ one }) => ({
  dhf: one(designHistoryFiles, {
    fields: [dhfReports.dhfId],
    references: [designHistoryFiles.id],
  }),
  generatedByUser: one(users, {
    fields: [dhfReports.generatedBy],
    references: [users.id],
  }),
}));

export const dhfTraceabilityMatrixRelations = relations(dhfTraceabilityMatrix, ({ one }) => ({
  dhf: one(designHistoryFiles, {
    fields: [dhfTraceabilityMatrix.dhfId],
    references: [designHistoryFiles.id],
  }),
  sourceItem: one(dhfItems, {
    fields: [dhfTraceabilityMatrix.sourceItemId],
    references: [dhfItems.id],
    relationName: "sourceItem"
  }),
  targetItem: one(dhfItems, {
    fields: [dhfTraceabilityMatrix.targetItemId],
    references: [dhfItems.id],
    relationName: "targetItem"
  }),
  verifiedByUser: one(users, {
    fields: [dhfTraceabilityMatrix.verifiedBy],
    references: [users.id],
  }),
}));

export const dhfAuditTrailRelations = relations(dhfAuditTrail, ({ one }) => ({
  dhf: one(designHistoryFiles, {
    fields: [dhfAuditTrail.dhfId],
    references: [designHistoryFiles.id],
  }),
  performedByUser: one(users, {
    fields: [dhfAuditTrail.performedBy],
    references: [users.id],
  }),
}));

export const designProjectDocumentsRelations = relations(designProjectDocuments, ({ one }) => ({
  project: one(designProjects, {
    fields: [designProjectDocuments.projectId],
    references: [designProjects.id],
  }),
  uploadedByUser: one(users, {
    fields: [designProjectDocuments.uploadedBy],
    references: [users.id],
  }),
}));

// Document relations
export const documentRevisionsRelations = relations(documentRevisions, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentRevisions.documentId],
    references: [documents.id],
  }),
  createdByUser: one(users, {
    fields: [documentRevisions.createdBy],
    references: [users.id],
  }),
  changes: many(documentRevisionChanges),
}));

export const documentRevisionChangesRelations = relations(documentRevisionChanges, ({ one }) => ({
  revision: one(documentRevisions, {
    fields: [documentRevisionChanges.revisionId],
    references: [documentRevisions.id],
  }),
}));

// Document related types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;
export type DocumentApproval = typeof documentApprovals.$inferSelect;
export type InsertDocumentApproval = typeof documentApprovals.$inferInsert;
export type DocumentRevision = typeof documentRevisions.$inferSelect;
export type InsertDocumentRevision = typeof documentRevisions.$inferInsert;
export type DocumentRevisionChange = typeof documentRevisionChanges.$inferSelect;
export type InsertDocumentRevisionChange = typeof documentRevisionChanges.$inferInsert;

// Document insert schemas for validation
export const insertDocumentSchema = createInsertSchema(documents);
export const insertDocumentVersionSchema = createInsertSchema(documentVersions);
export const insertDocumentRevisionSchema = createInsertSchema(documentRevisions).omit({
  id: true,
  createdAt: true,
  approvalStatus: true
});
export const insertDocumentRevisionChangeSchema = createInsertSchema(documentRevisionChanges).omit({
  id: true
});
export const insertDocumentApprovalSchema = createInsertSchema(documentApprovals);

// Training Module Tables
export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // Onboarding, Technical, Compliance, Process, Regulatory
  validPeriod: integer("valid_period").notNull().default(365), // In days
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trainingRecords = pgTable("training_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  assignedDate: timestamp("assigned_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  completedDate: timestamp("completed_date"),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("assigned"), // assigned, in_progress, completed, expired
  score: integer("score"), // Optional score, if applicable
  comments: text("comments"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTrainingRecordSchema = createInsertSchema(trainingRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedDate: true,
  status: true
}).extend({
  dueDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;

export const trainingModuleRelations = relations(trainingModules, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [trainingModules.createdBy],
    references: [users.id],
  }),
  records: many(trainingRecords),
}));

export const trainingRecordRelations = relations(trainingRecords, ({ one }) => ({
  user: one(users, {
    fields: [trainingRecords.userId],
    references: [users.id],
  }),
  module: one(trainingModules, {
    fields: [trainingRecords.moduleId],
    references: [trainingModules.id],
  }),
  assignedByUser: one(users, {
    fields: [trainingRecords.assignedBy],
    references: [users.id],
  }),
}));

// Supplier schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  isArchived: true,
}).extend({
  qualificationDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  requalificationDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  })
});

// Quality Manual Management Module
export const qualityManuals = pgTable("quality_manuals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  currentVersionId: integer("current_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const manualVersions = pgTable("manual_versions", {
  id: serial("id").primaryKey(),
  manualId: integer("manual_id").notNull().references(() => qualityManuals.id),
  versionNumber: text("version_number").notNull(),
  content: text("content"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  status: text("status").notNull().default("Draft"), // Draft, Under Review, Approved
});

export const manualSections = pgTable("manual_sections", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").notNull().references(() => manualVersions.id),
  title: text("title").notNull(),
  content: text("content"),
  order: integer("order").notNull(),
});

export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").notNull().references(() => manualVersions.id),
  approverId: integer("approver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("Pending"), // Pending, Approved, Rejected
  comment: text("comment"),
  actionDate: timestamp("action_date"),
});

// Define types for Quality Manual Management
export type QualityManual = typeof qualityManuals.$inferSelect;
export type InsertQualityManual = typeof qualityManuals.$inferInsert;
export type ManualVersion = typeof manualVersions.$inferSelect;
export type InsertManualVersion = typeof manualVersions.$inferInsert;
export type ManualSection = typeof manualSections.$inferSelect;
export type InsertManualSection = typeof manualSections.$inferInsert;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = typeof approvalWorkflows.$inferInsert;

// Organizational Chart Module
export const organizationalPositions = pgTable("organizational_positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  department: text("department").notNull(),
  level: integer("level").notNull(), // Hierarchical level (1 = top level, higher numbers = lower levels)
  parentPositionId: integer("parent_position_id").references(() => organizationalPositions.id),
  isActive: boolean("is_active").default(true),
  responsibilities: text("responsibilities").array(),
  requiredQualifications: text("required_qualifications").array(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationalStructure = pgTable("organizational_structure", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull().references(() => organizationalPositions.id),
  userId: integer("user_id").references(() => users.id), // Can be null if position is vacant
  reportingToId: integer("reporting_to_id").references(() => organizationalStructure.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  delegatedAuthority: text("delegated_authority").array(),
  budgetAuthority: decimal("budget_authority", { precision: 15, scale: 2 }),
  signatureAuthority: text("signature_authority").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationalApprovals = pgTable("organizational_approvals", {
  id: serial("id").primaryKey(),
  structureId: integer("structure_id").notNull().references(() => organizationalStructure.id),
  documentType: text("document_type").notNull(), // QMS documents, procedures, etc.
  approvalLevel: integer("approval_level").notNull(),
  canApprove: boolean("can_approve").default(false),
  canReview: boolean("can_review").default(false),
  canDelegate: boolean("can_delegate").default(false),
  conditions: text("conditions"), // Any special conditions for approval
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationalDelegations = pgTable("organizational_delegations", {
  id: serial("id").primaryKey(),
  delegatorId: integer("delegator_id").notNull().references(() => organizationalStructure.id),
  delegateeId: integer("delegatee_id").notNull().references(() => organizationalStructure.id),
  delegationType: text("delegation_type").notNull(), // temporary, permanent, specific-task
  authority: text("authority").array(), // What authorities are delegated
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  reason: text("reason").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationalChart = pgTable("organizational_chart", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").notNull().default("1.0"),
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  chartData: json("chart_data"), // Stores the visual layout and positioning
  complianceMapping: json("compliance_mapping"), // Maps to ISO 13485 requirements
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationalAuditTrail = pgTable("organizational_audit_trail", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // position, structure, approval, delegation, chart
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete, activate, deactivate
  fieldChanged: text("field_changed"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  reason: text("reason"),
  userId: integer("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// Storage Configuration & External Repository Integration
export const storageConfigurations = pgTable("storage_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  provider: text("provider").notNull(), // aws-s3, azure-blob, gcp-storage, sharepoint, local-sftp, local-https
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  config: json("config").notNull(), // Provider-specific configuration
  compliance: json("compliance").notNull(), // ISO 13485, 21 CFR Part 11, GDPR settings
  encryptionSettings: json("encryption_settings").notNull(), // Encryption configuration
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storageAuditLogs = pgTable("storage_audit_logs", {
  id: serial("id").primaryKey(),
  configurationId: integer("configuration_id").notNull().references(() => storageConfigurations.id),
  action: text("action").notNull(), // upload, download, delete, move, copy, test
  filePath: text("file_path"),
  fileId: text("file_id"),
  userId: integer("user_id").notNull().references(() => users.id),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  metadata: json("metadata"), // Operation-specific metadata
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Create insert schemas for Storage Configuration
export const insertStorageConfigurationSchema = createInsertSchema(storageConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  createdBy: z.number().optional()
});

export const insertStorageAuditLogSchema = createInsertSchema(storageAuditLogs).omit({
  id: true,
  timestamp: true,
});

// Insert schema for Phase-gated Design Review Outcomes
export const insertDesignPhaseReviewOutcomeSchema = createInsertSchema(designPhaseReviewOutcomes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  reviewDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  nextReviewDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

// Create insert schemas for Organizational Chart Module
export const insertOrganizationalPositionSchema = createInsertSchema(organizationalPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationalStructureSchema = createInsertSchema(organizationalStructure).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertOrganizationalApprovalSchema = createInsertSchema(organizationalApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationalDelegationSchema = createInsertSchema(organizationalDelegations).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertOrganizationalChartSchema = createInsertSchema(organizationalChart).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  effectiveDate: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  expiryDate: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  approvedAt: z.string().or(z.date()).nullable().optional().transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

// Define types for Organizational Chart Module
export type OrganizationalPosition = typeof organizationalPositions.$inferSelect;
export type InsertOrganizationalPosition = z.infer<typeof insertOrganizationalPositionSchema>;

export type OrganizationalStructure = typeof organizationalStructure.$inferSelect;
export type InsertOrganizationalStructure = z.infer<typeof insertOrganizationalStructureSchema>;

export type OrganizationalApproval = typeof organizationalApprovals.$inferSelect;
export type InsertOrganizationalApproval = z.infer<typeof insertOrganizationalApprovalSchema>;

export type OrganizationalDelegation = typeof organizationalDelegations.$inferSelect;
export type InsertOrganizationalDelegation = z.infer<typeof insertOrganizationalDelegationSchema>;

export type OrganizationalChart = typeof organizationalChart.$inferSelect;
export type InsertOrganizationalChart = z.infer<typeof insertOrganizationalChartSchema>;

export type OrganizationalAuditTrail = typeof organizationalAuditTrail.$inferSelect;

// Storage Configuration types
export type StorageConfiguration = typeof storageConfigurations.$inferSelect;
export type InsertStorageConfiguration = z.infer<typeof insertStorageConfigurationSchema>;

export type StorageAuditLog = typeof storageAuditLogs.$inferSelect;
export type InsertStorageAuditLog = z.infer<typeof insertStorageAuditLogSchema>;

// Define relations for Organizational Chart Module
export const organizationalPositionsRelations = relations(organizationalPositions, ({ one, many }) => ({
  parentPosition: one(organizationalPositions, {
    fields: [organizationalPositions.parentPositionId],
    references: [organizationalPositions.id],
  }),
  subPositions: many(organizationalPositions),
  structureAssignments: many(organizationalStructure),
  createdByUser: one(users, {
    fields: [organizationalPositions.createdBy],
    references: [users.id],
  }),
}));

export const organizationalStructureRelations = relations(organizationalStructure, ({ one, many }) => ({
  position: one(organizationalPositions, {
    fields: [organizationalStructure.positionId],
    references: [organizationalPositions.id],
  }),
  user: one(users, {
    fields: [organizationalStructure.userId],
    references: [users.id],
  }),
  reportsTo: one(organizationalStructure, {
    fields: [organizationalStructure.reportingToId],
    references: [organizationalStructure.id],
  }),
  directReports: many(organizationalStructure),
  approvals: many(organizationalApprovals),
  delegationsAsGiver: many(organizationalDelegations, { relationName: "delegator" }),
  delegationsAsReceiver: many(organizationalDelegations, { relationName: "delegatee" }),
}));

export const organizationalApprovalsRelations = relations(organizationalApprovals, ({ one }) => ({
  structure: one(organizationalStructure, {
    fields: [organizationalApprovals.structureId],
    references: [organizationalStructure.id],
  }),
}));

export const organizationalDelegationsRelations = relations(organizationalDelegations, ({ one }) => ({
  delegator: one(organizationalStructure, {
    fields: [organizationalDelegations.delegatorId],
    references: [organizationalStructure.id],
    relationName: "delegator",
  }),
  delegatee: one(organizationalStructure, {
    fields: [organizationalDelegations.delegateeId],
    references: [organizationalStructure.id],
    relationName: "delegatee",
  }),
  createdByUser: one(users, {
    fields: [organizationalDelegations.createdBy],
    references: [users.id],
  }),
}));

export const organizationalChartRelations = relations(organizationalChart, ({ one }) => ({
  createdByUser: one(users, {
    fields: [organizationalChart.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [organizationalChart.approvedBy],
    references: [users.id],
  }),
}));

