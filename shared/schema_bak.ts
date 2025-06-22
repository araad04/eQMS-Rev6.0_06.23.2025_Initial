import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Document Control
export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

export const documentStatuses = pgTable("document_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  documentId: text("document_id").notNull().unique(),
  typeId: integer("type_id").notNull(),
  statusId: integer("status_id").notNull(),
  revision: text("revision").notNull(),
  filePath: text("file_path"),
  createdBy: integer("created_by").notNull(),
  approvedBy: integer("approved_by"),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentApprovals = pgTable("document_approvals", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
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
  patientSafetyImpact: boolean("patient_safety_impact").default(false),
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

// Relations for CAPA Evidence
export const capaEvidenceRelations = relations(capaEvidence, ({ one }) => ({
  action: one(capaActions, {
    fields: [capaEvidence.actionId],
    references: [capaActions.id],
  }),
  capa: one(capas, {
    fields: [capaEvidence.capaId],
    references: [capas.id],
  }),
  uploadedByUser: one(users, {
    fields: [capaEvidence.uploadedBy],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [capaEvidence.reviewedBy],
    references: [users.id],
  }),
}));

// Relations for CAPA Verifications
export const capaVerificationsRelations = relations(capaVerifications, ({ one }) => ({
  action: one(capaActions, {
    fields: [capaVerifications.actionId],
    references: [capaActions.id],
  }),
  reviewer: one(users, {
    fields: [capaVerifications.reviewerId],
    references: [users.id],
  }),
}));

// Relations for CAPA Communications
export const capaCommunicationsRelations = relations(capaCommunications, ({ one }) => ({
  capa: one(capas, {
    fields: [capaCommunications.capaId],
    references: [capas.id],
  }),
  action: one(capaActions, {
    fields: [capaCommunications.actionId],
    references: [capaActions.id],
  }),
  communicatedByUser: one(users, {
    fields: [capaCommunications.communicatedBy],
    references: [users.id],
  }),
}));

// Relations for Root Causes
export const capaRootCausesRelations = relations(capaRootCauses, ({ one, many }) => ({
  capa: one(capas, {
    fields: [capaRootCauses.capaId],
    references: [capas.id],
  }),
  createdByUser: one(users, {
    fields: [capaRootCauses.createdBy],
    references: [users.id],
  }),
  responsiblePerson: one(users, {
    fields: [capaRootCauses.responsiblePerson],
    references: [users.id],
  }),
  contributors: many(capaRootCauseContributors),
  actionMappings: many(capaRootCauseActionMap),
}));

// Relations for Root Cause Contributors
export const capaRootCauseContributorsRelations = relations(capaRootCauseContributors, ({ one }) => ({
  rootCause: one(capaRootCauses, {
    fields: [capaRootCauseContributors.rootCauseId],
    references: [capaRootCauses.id],
  }),
  user: one(users, {
    fields: [capaRootCauseContributors.userId],
    references: [users.id],
  }),
}));

// Relations for Root Cause to Action Mappings
export const capaRootCauseActionMapRelations = relations(capaRootCauseActionMap, ({ one }) => ({
  rootCause: one(capaRootCauses, {
    fields: [capaRootCauseActionMap.rootCauseId],
    references: [capaRootCauses.id],
  }),
  action: one(capaActions, {
    fields: [capaRootCauseActionMap.actionId],
    references: [capaActions.id],
  }),
}));

// Relations for Effectiveness Reviews
export const capaEffectivenessReviewsRelations = relations(capaEffectivenessReviews, ({ one }) => ({
  capa: one(capas, {
    fields: [capaEffectivenessReviews.capaId],
    references: [capas.id],
  }),
  reviewer: one(users, {
    fields: [capaEffectivenessReviews.reviewerId],
    references: [users.id],
  }),
}));

// Relations for CAPA Closures
export const capaClosuresRelations = relations(capaClosures, ({ one }) => ({
  capa: one(capas, {
    fields: [capaClosures.capaId],
    references: [capas.id],
  }),
  closedByUser: one(users, {
    fields: [capaClosures.closedBy],
    references: [users.id],
  }),
}));

// Audit Management
export const auditTypes = pgTable("audit_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // internal, supplier
  description: text("description"),
});

export const auditStatuses = pgTable("audit_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // planned, in-progress, completed, cancelled
  description: text("description"),
});

// Define audit types as an enum for better type safety
export const auditTypeEnum = pgEnum('audit_type', ['internal', 'supplier']);

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  auditId: text("audit_id").notNull().unique(),
  title: text("title").notNull(),
  typeId: integer("type_id").notNull(),
  statusId: integer("status_id").notNull(),
  scope: text("scope").notNull(),
  leadAuditor: integer("lead_auditor").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  summary: text("summary"),
  // Enhanced fields for audit branching
  auditType: auditTypeEnum('audit_type').notNull().default('internal'),
  checklistTemplateId: integer("checklist_template_id"), // Link to the appropriate checklist
  // New fields for supplier audits
  supplierId: integer("supplier_id"), // Only for supplier audits
  location: text("location"), // Physical or virtual location
  auditTeam: text("audit_team"), // Comma-separated IDs of team members
  standards: text("standards"), // Comma-separated list of standards (e.g., "ISO 13485:2016,21 CFR 820")
  reportGenerationDate: timestamp("report_generation_date"),
  reportUrl: text("report_url"), // Link to generated report
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define response types enum
export const responseTypeEnum = pgEnum('response_type', ['yes', 'no', 'n_a']);

// Checklist templates for reuse across audits with support for audit type branching
export const auditChecklistTemplates = pgTable("audit_checklist_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  auditTypeId: integer("audit_type_id").notNull(), // Linked to audit_types
  auditType: auditTypeEnum('audit_type').notNull().default('internal'), // Internal or Supplier
  description: text("description"),
  standard: text("standard"), // e.g., "ISO 13485:2016"
  createdBy: integer("created_by").notNull(),
  isActive: boolean("is_active").default(true),
  sectionCount: integer("section_count").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Questions for checklist templates
export const auditChecklistQuestions = pgTable("audit_checklist_questions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(), // Link to template
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default('yes_no'), // yes_no, free_text, dropdown, file_upload
  options: text("options"), // For dropdown questions, comma-separated options
  standardReference: text("standard_reference"), // e.g., "ISO 13485:2016 7.5.6"
  sortOrder: integer("sort_order").notNull(),
  isRequired: boolean("is_required").default(true),
  sectionName: text("section_name"), // For grouping questions into sections
  commentsRequired: boolean("comments_required").default(false), // True for "No" responses
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit checklist responses - with branching logic
export const auditChecklistResponses = pgTable("audit_checklist_responses", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  questionId: integer("question_id").notNull(),
  response: responseTypeEnum('response').notNull(),
  comments: text("comments"),
  evidenceIds: text("evidence_ids"), // Comma-separated IDs of evidence files
  respondedBy: integer("responded_by").notNull(),
  respondedAt: timestamp("responded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Evidence for audit findings
export const auditEvidence = pgTable("audit_evidence", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  responseId: integer("response_id"), // Optional - may be linked to specific response
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // pdf, image, etc.
  description: text("description"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Audit findings that require CAPA or SCR
export const auditFindings = pgTable("audit_findings", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  responseId: integer("response_id").notNull(), // Link to the specific response
  findingType: text("finding_type").notNull(), // nonconformity, observation, recommendation
  description: text("description").notNull(),
  severity: text("severity").notNull().default('minor'), // critical, major, minor
  requiresCapa: boolean("requires_capa").default(false),
  requiresScr: boolean("requires_scr").default(false),
  capaId: integer("capa_id"), // Link to CAPA if created
  scrId: integer("scr_id"), // Link to SCR if created
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Linking table for Audit to SCR (Supplier Corrective Request)
export const auditToScr = pgTable("audit_to_scr", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  scrId: integer("scr_id").notNull(),
  findingId: integer("finding_id"), // Optional: link to specific finding
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SCR - Supplier Corrective Request table
export const supplierCorrectiveRequests = pgTable("supplier_corrective_requests", {
  id: serial("id").primaryKey(),
  scrId: text("scr_id").notNull().unique(), // Formatted ID like SCR-2025-0001
  supplierId: integer("supplier_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, major, minor
  statusId: integer("status_id").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  responseRequired: boolean("response_required").default(true),
  responseDueDate: timestamp("response_due_date"),
  actualResponseDate: timestamp("actual_response_date"),
  responseAccepted: boolean("response_accepted"),
  closedDate: timestamp("closed_date"),
  createdBy: integer("created_by").notNull(),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Responses for a specific audit
export const auditResponses = pgTable("audit_responses", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  questionId: integer("question_id").notNull(),
  response: text("response"), // Yes/No or free text response
  complianceStatus: text("compliance_status"), // Compliant, NC, Observation, OFI
  notes: text("notes"), // Auditor's notes
  evidenceUrls: text("evidence_urls"), // Comma-separated list of evidence file URLs
  createdBy: integer("created_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// The audit evidence table has been defined earlier
// This was a duplicate definition and has been removed

// Audit findings - enhanced from original
export const findings = pgTable("findings", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  findingId: text("finding_id").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, major, minor, observation, OFI
  standardReference: text("standard_reference"), // e.g., "ISO 13485:2016 7.5.6"
  responseId: integer("response_id"), // Link to specific checklist response
  assignedTo: integer("assigned_to"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull(), // open, in-progress, closed
  isFromSupplier: boolean("is_from_supplier").default(false),
  linkedCapaId: integer("linked_capa_id"), // If CAPA created from finding
  linkedScrId: integer("linked_scr_id"), // If SCR created from finding
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supplier Corrective Request (SCR) tables 
export const scrStatuses = pgTable("scr_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // issued, acknowledged, in-progress, implemented, verified, closed, rejected
  description: text("description"),
});

export const scrTypes = pgTable("scr_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // product, process, documentation, other
  description: text("description"),
});

// NOTE: This duplicates the earlier definition. Renamed to avoid conflicts.
export const supplierCorrectiveRequestsNew = pgTable("supplier_corrective_requests_new", {
  id: serial("id").primaryKey(),
  scrNumber: text("scr_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull(),
  auditId: integer("audit_id"),
  findingId: integer("finding_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  typeId: integer("type_id").notNull(), // References scr_types
  statusId: integer("status_id").notNull(), // References scr_statuses
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  issuedBy: integer("issued_by").notNull(),
  acknowledgedDate: timestamp("acknowledged_date"),
  acknowledgedBy: integer("acknowledged_by"),
  dueDate: timestamp("due_date"),
  supplierRootCause: text("supplier_root_cause"),
  supplierCorrectiveAction: text("supplier_corrective_action"),
  supplierPreventiveAction: text("supplier_preventive_action"),
  implementationDate: timestamp("implementation_date"),
  verificationDate: timestamp("verification_date"),
  verifiedBy: integer("verified_by"),
  closedDate: timestamp("closed_date"),
  closedBy: integer("closed_by"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// SCR Attachments for supporting evidence
export const scrAttachments = pgTable("scr_attachments", {
  id: serial("id").primaryKey(),
  scrId: integer("scr_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // image, pdf, doc, etc.
  attachmentType: text("attachment_type").notNull(), // root_cause, corrective_action, preventive_action, verification, other
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Insert schema definitions for audit entities
export const insertSupplierCorrectiveRequestSchema = createInsertSchema(supplierCorrectiveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  issuedDate: z.string().or(z.date()).default(() => new Date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  acknowledgedDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string' && val) {
      return new Date(val);
    }
    return val;
  }),
  implementationDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string' && val) {
      return new Date(val);
    }
    return val;
  }),
  verificationDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string' && val) {
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

// SCR Attachments are already defined above
// export const scrAttachments = pgTable("scr_attachments", {
//   id: serial("id").primaryKey(),
//   scrId: integer("scr_id").notNull(),
//   fileUrl: text("file_url").notNull(),
//   fileName: text("file_name").notNull(),
//   fileType: text("file_type").notNull(), // image, pdf, doc, etc.
//   uploadedBy: integer("uploaded_by").notNull(),
//   uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
//   isFromSupplier: boolean("is_from_supplier").default(false),
// });

export const insertScrAttachmentSchema = createInsertSchema(scrAttachments).omit({
  id: true,
  uploadedAt: true,
});

// Training Records
export const trainingTypes = pgTable("training_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const trainingStatuses = pgTable("training_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  moduleId: text("module_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  typeId: integer("type_id").notNull(),
  version: text("version").notNull(),
  frequency: text("frequency"), // one-time, annual, bi-annual
  durationMinutes: integer("duration_minutes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trainingRecords = pgTable("training_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  moduleId: integer("module_id").notNull(),
  statusId: integer("status_id").notNull(),
  assignedDate: timestamp("assigned_date").notNull(),
  completedDate: timestamp("completed_date"),
  expiryDate: timestamp("expiry_date"),
  score: integer("score"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Risk Assessment
export const riskCategories = pgTable("risk_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  riskId: text("risk_id").notNull().unique(),
  title: text("title").notNull(),
  categoryId: integer("category_id").notNull(),
  description: text("description").notNull(),
  initialRisk: json("initial_risk").notNull(), // {severity, probability, detectability, riskLevel}
  mitigationPlan: text("mitigation_plan"),
  residualRisk: json("residual_risk"), // {severity, probability, detectability, riskLevel}
  status: text("status").notNull(), // draft, active, closed
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  name: text("name").notNull(),
  supplierId: text("supplier_id").notNull().unique(),
  categoryId: integer("category_id").notNull(),
  statusId: integer("status_id").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  isCritical: boolean("is_critical").default(false).notNull(),
  activities: text("activities"),
  qualificationDate: timestamp("qualification_date"),
  requalificationDate: timestamp("requalification_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supplier Relations
export const supplierRelations = relations(suppliers, ({ one }) => ({
  category: one(supplierCategories, {
    fields: [suppliers.categoryId],
    references: [supplierCategories.id],
  }),
  status: one(supplierStatuses, {
    fields: [suppliers.statusId],
    references: [supplierStatuses.id],
  }),
}));

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // document, capa, audit, training, risk, supplier
  entityId: integer("entity_id").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Define the insert schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
// Define CAPA insert schema with adjustments for database schema differences
export const insertCapaSchema = createInsertSchema(capas)
  .omit({ id: true, source: true }) // Remove source field from validation to handle DB schema mismatch
  .extend({
    source: z.string().optional(), // Make source optional and not required
  });
export const insertAuditSchema = createInsertSchema(audits)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.union([z.string(), z.date()]).transform((val) => 
      val instanceof Date ? val : new Date(val)
    ),
    endDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => 
      val instanceof Date || val === null || val === undefined ? val : new Date(val)
    ),
    auditTeam: z.string().optional(),
    standards: z.string().optional(),
    supplierId: z.number().optional(),
  });

// Audit templates and checklists insert schemas
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

export const insertAuditEvidenceSchema = createInsertSchema(auditEvidence).omit({
  id: true,
  uploadedAt: true,
});

export const insertFindingSchema = createInsertSchema(findings).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

// SCR insert schemas
export const insertScrStatusSchema = createInsertSchema(scrStatuses).omit({
  id: true,
});

export const insertScrTypeSchema = createInsertSchema(scrTypes).omit({
  id: true,
});

// SCR schema has been already defined above
export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({ id: true });
export const insertTrainingRecordSchema = createInsertSchema(trainingRecords).omit({ id: true });
export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });

// Define the types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Capa = typeof capas.$inferSelect;
export type InsertCapa = z.infer<typeof insertCapaSchema>;

export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;

export type Finding = typeof findings.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;

export type AuditChecklistTemplate = typeof auditChecklistTemplates.$inferSelect;
export type InsertAuditChecklistTemplate = z.infer<typeof insertAuditChecklistTemplateSchema>;

export type AuditChecklistQuestion = typeof auditChecklistQuestions.$inferSelect;
export type InsertAuditChecklistQuestion = z.infer<typeof insertAuditChecklistQuestionSchema>;

export type AuditResponse = typeof auditResponses.$inferSelect;
export type InsertAuditResponse = z.infer<typeof insertAuditResponseSchema>;

export type AuditEvidence = typeof auditEvidence.$inferSelect;
export type InsertAuditEvidence = z.infer<typeof insertAuditEvidenceSchema>;

export type SupplierCorrectiveRequest = typeof supplierCorrectiveRequests.$inferSelect;
export type InsertSupplierCorrectiveRequest = z.infer<typeof insertSupplierCorrectiveRequestSchema>;

export type ScrAttachment = typeof scrAttachments.$inferSelect;
export type InsertScrAttachment = z.infer<typeof insertScrAttachmentSchema>;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;

export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Supplier Assessment
export const supplierAssessments = pgTable("supplier_assessments", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  supplier_name: text("supplier_name").notNull(),
  assessment_type: text("assessment_type").notNull(), // Audit, Survey, Questionnaire, etc.
  scheduled_date: timestamp("scheduled_date").notNull(),
  completed_date: timestamp("completed_date"),
  assessor_id: integer("assessor_id").notNull(),
  status: text("status").notNull().default("Pending"), // Pending, In Progress, Completed
  score: integer("score"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  next_assessment_date: timestamp("next_assessment_date"),
  attachments: text("attachments"), // JSON array of file paths or URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supplierAssessmentsRelations = relations(supplierAssessments, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierAssessments.supplierId],
    references: [suppliers.id],
  }),
  assessor: one(users, {
    fields: [supplierAssessments.assessor_id],
    references: [users.id],
  }),
}));

export const insertSupplierAssessmentSchema = createInsertSchema(supplierAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SupplierAssessment = typeof supplierAssessments.$inferSelect;
export type InsertSupplierAssessment = z.infer<typeof insertSupplierAssessmentSchema>;

// Management Review schemas
export const reviewStatuses = pgTable("review_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewId: text("review_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  statusId: integer("status_id").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  chair: integer("chair").notNull(),
  participants: text("participants").array(),
  agenda: text("agenda"),
  minutes: text("minutes"),
  actions: text("actions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reviewInputs = pgTable("review_inputs", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  inputType: text("input_type").notNull(),
  reference: text("reference").notNull(),
  summary: text("summary").notNull(),
  details: text("details"),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reviewOutcomes = pgTable("review_outcomes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  outcomeType: text("outcome_type").notNull(),
  description: text("description").notNull(),
  assignedTo: integer("assigned_to").notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull(),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true });
export const insertReviewInputSchema = createInsertSchema(reviewInputs).omit({ id: true });
export const insertReviewOutcomeSchema = createInsertSchema(reviewOutcomes).omit({ id: true });

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ReviewInput = typeof reviewInputs.$inferSelect;
export type InsertReviewInput = z.infer<typeof insertReviewInputSchema>;
export type ReviewOutcome = typeof reviewOutcomes.$inferSelect;
export type InsertReviewOutcome = z.infer<typeof insertReviewOutcomeSchema>;

// We'll move these to the end of the file after all tables are defined

// Production Management Module
export const productionBatches = pgTable("production_batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull().unique(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  uom: text("uom").notNull(), // unit of measure
  status: text("status").notNull(), // planned, in-progress, completed, on-hold, rejected
  plannedStartDate: timestamp("planned_start_date").notNull(),
  actualStartDate: timestamp("actual_start_date"),
  plannedEndDate: timestamp("planned_end_date").notNull(),
  actualEndDate: timestamp("actual_end_date"),
  batchRecordLocation: text("batch_record_location"),
  notes: text("notes"),
  initiatedBy: integer("initiated_by").notNull(),
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productCode: text("product_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  classification: text("classification"), // e.g., Class I, II, III for medical devices
  regulatoryStatus: text("regulatory_status"), // e.g., 510(k) cleared, PMA approved, etc.
  specifications: json("specifications"), // JSON object with product specifications
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const materialLots = pgTable("material_lots", {
  id: serial("id").primaryKey(),
  lotNumber: text("lot_number").notNull().unique(),
  materialId: integer("material_id").notNull(),
  supplierId: integer("supplier_id").notNull(),
  quantity: decimal("quantity").notNull(),
  uom: text("uom").notNull(), // unit of measure
  receivedDate: timestamp("received_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull(), // quarantined, released, rejected, depleted
  storageLocation: text("storage_location"),
  coaReference: text("coa_reference"), // Certificate of Analysis reference
  receivedBy: integer("received_by").notNull(),
  releasedBy: integer("released_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const batchMaterials = pgTable("batch_materials", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  materialLotId: integer("material_lot_id").notNull(),
  plannedQuantity: decimal("planned_quantity").notNull(),
  actualQuantity: decimal("actual_quantity"),
  uom: text("uom").notNull(), // unit of measure
  addedBy: integer("added_by"),
  verifiedBy: integer("verified_by"),
  addedAt: timestamp("added_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const equipmentUtilization = pgTable("equipment_utilization", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  equipmentId: integer("equipment_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  parameters: json("parameters"), // JSON object with equipment parameters
  operatedBy: integer("operated_by").notNull(),
  verifiedBy: integer("verified_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// Define the insert schemas for Production Module
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertProductionBatchSchema = createInsertSchema(productionBatches).omit({ id: true });
export const insertBatchProcessStepSchema = createInsertSchema(batchProcessSteps).omit({ id: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true });
export const insertMaterialLotSchema = createInsertSchema(materialLots).omit({ id: true });
export const insertBatchDeviationSchema = createInsertSchema(batchDeviations).omit({ id: true });
export const insertQualityCheckSchema = createInsertSchema(qualityChecks).omit({ id: true });
export const insertBatchMaterialSchema = createInsertSchema(batchMaterials).omit({ id: true });
export const insertEquipmentSchema = createInsertSchema(equipment).omit({ id: true });
export const insertEquipmentUtilizationSchema = createInsertSchema(equipmentUtilization).omit({ id: true });

// Nonconforming Product Registration Sub-Module (ISO 13485:2016 section 8.3)
export const nonconformingSeverityLevels = pgTable("nonconforming_severity_levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  riskLevel: integer("risk_level").notNull(), // 1-5 scale, 5 being highest risk
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nonconformingStatuses = pgTable("nonconforming_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // identified, under-review, disposition-pending, rework, scrap, use-as-is, return-to-supplier, closed
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  partNumber: text("part_number"),
  
  // Impact assessment
  potentialImpact: text("potential_impact"),
  safetyImpact: boolean("safety_impact").default(false),
  functionalImpact: boolean("functional_impact").default(false),
  regulatoryImpact: boolean("regulatory_impact").default(false),
  
  // Disposition details
  dispositionDecision: text("disposition_decision"), // use-as-is, rework, scrap, return-to-supplier
  dispositionJustification: text("disposition_justification"),
  dispositionBy: integer("disposition_by"),
  dispositionDate: timestamp("disposition_date"),
  
  // CAPA linkage
  capaId: integer("capa_id"),
  
  // Approval and tracking
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  closedBy: integer("closed_by"),
  closedAt: timestamp("closed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nonconformingProductAttachments = pgTable("nonconforming_product_attachments", {
  id: serial("id").primaryKey(),
  ncpId: integer("ncp_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // image, document, etc.
  description: text("description"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Insert schemas for Nonconforming Product module
export const insertNonconformingSeverityLevelSchema = createInsertSchema(nonconformingSeverityLevels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNonconformingStatusSchema = createInsertSchema(nonconformingStatuses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNonconformingProductSchema = createInsertSchema(nonconformingProducts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true
}).extend({
  detectedAt: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  dispositionDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }).optional(),
  reviewedAt: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }).optional(),
  closedAt: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }).optional(),
});
export const insertNonconformingProductAttachmentSchema = createInsertSchema(nonconformingProductAttachments).omit({ id: true, uploadedAt: true });

// Define types for Nonconforming Product module
export type NonconformingSeverityLevel = typeof nonconformingSeverityLevels.$inferSelect;
export type InsertNonconformingSeverityLevel = z.infer<typeof insertNonconformingSeverityLevelSchema>;

export type NonconformingStatus = typeof nonconformingStatuses.$inferSelect;
export type InsertNonconformingStatus = z.infer<typeof insertNonconformingStatusSchema>;

export type NonconformingProduct = typeof nonconformingProducts.$inferSelect;
export type InsertNonconformingProduct = z.infer<typeof insertNonconformingProductSchema>;

export type NonconformingProductAttachment = typeof nonconformingProductAttachments.$inferSelect;
export type InsertNonconformingProductAttachment = z.infer<typeof insertNonconformingProductAttachmentSchema>;

// Define relations for Nonconforming Product module
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

// Define the types for Production Module
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductionBatch = typeof productionBatches.$inferSelect;
export type InsertProductionBatch = z.infer<typeof insertProductionBatchSchema>;

export type BatchProcessStep = typeof batchProcessSteps.$inferSelect;
export type InsertBatchProcessStep = z.infer<typeof insertBatchProcessStepSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type MaterialLot = typeof materialLots.$inferSelect;
export type InsertMaterialLot = z.infer<typeof insertMaterialLotSchema>;

export type BatchDeviation = typeof batchDeviations.$inferSelect;
export type InsertBatchDeviation = z.infer<typeof insertBatchDeviationSchema>;

export type QualityCheck = typeof qualityChecks.$inferSelect;
export type InsertQualityCheck = z.infer<typeof insertQualityCheckSchema>;

export type BatchMaterial = typeof batchMaterials.$inferSelect;
export type InsertBatchMaterial = z.infer<typeof insertBatchMaterialSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type EquipmentUtilization = typeof equipmentUtilization.$inferSelect;
export type InsertEquipmentUtilization = z.infer<typeof insertEquipmentUtilizationSchema>;

// Measurement & Analysis Module

// Enums for feedback system
export const feedbackSourceEnum = pgEnum('feedback_source', [
  'email', 'call', 'form', 'visit', 'other'
]);

export const feedbackTypeEnum = pgEnum('feedback_type', [
  'positive', 'neutral', 'negative'
]);

export const feedbackStatusEnum = pgEnum('feedback_status', [
  'open', 'in_review', 'closed'
]);

export const feedbackCategoryEnum = pgEnum('feedback_category', [
  'complaint', 'general_feedback'
]);

// Customer Feedback table
export const customerFeedback = pgTable('customer_feedback', {
  id: serial('id').primaryKey(),
  dateReceived: timestamp('date_received').notNull().defaultNow(),
  feedbackSource: feedbackSourceEnum('feedback_source').notNull(),
  productId: integer('product_id').references(() => products.id),
  feedbackType: feedbackTypeEnum('feedback_type').notNull(),
  summary: text('summary').notNull(),
  description: text('description'),
  attachmentPath: text('attachment_path'),
  category: feedbackCategoryEnum('category').notNull(),
  targetResponseDays: integer('target_response_days').notNull(),
  actualResponseDate: timestamp('actual_response_date'),
  assignedTo: integer('assigned_to').references(() => users.id),
  status: feedbackStatusEnum('status').notNull().default('open'),
  dateClosed: timestamp('date_closed'),
  sentiment: text('sentiment').default('neutral'),
  justification: text('justification'), // Justification for not creating a complaint for negative feedback
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertCustomerFeedbackSchema = createInsertSchema(customerFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Complaint Management
export const complaintCategoryEnum = pgEnum('complaint_category', [
  'product_defect', 'service_issue', 'documentation', 'delivery', 'billing', 'other'
]);

export const complaintStatusEnum = pgEnum('complaint_status', [
  'open', 'in_progress', 'under_investigation', 'pending_corrective_action', 'resolved', 'closed'
]);

// Complaints & Customer Feedback Module
export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  complaintNumber: text('complaint_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerContact: text('customer_contact').notNull(),
  productId: integer('product_id').references(() => products.id),
  batchNumber: text('batch_number'),
  serialNumber: text('serial_number'),
  description: text('description').notNull(),
  dateReceived: timestamp('date_received').notNull().defaultNow(),
  category: complaintCategoryEnum('category').notNull(),
  severity: integer('severity').notNull(), // 1-5 scale
  assignedTo: integer('assigned_to').references(() => users.id),
  investigationFindings: text('investigation_findings'),
  rootCause: text('root_cause'),
  correctiveAction: text('corrective_action'),
  status: complaintStatusEnum('status').notNull().default('open'),
  dueDate: timestamp('due_date'),
  closedDate: timestamp('closed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Add reportability field for regulatory compliance requirements
  isReportable: boolean('is_reportable').default(false),
  reportabilityReason: text('reportability_reason'),
  regulationType: text('regulation_type'), // e.g., MDR, IVDR, FDA, etc.
  // Track if CAPA was created from this complaint
  capaId: integer('capa_id').references(() => capas.id),
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  capaId: true, // Will be populated when a CAPA is created from the complaint
});

// SPC Chart Data section removed

// Export types for the new entities
export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = z.infer<typeof insertCustomerFeedbackSchema>;

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

// System Health & Analytics Dashboard Module
export const dashboardConfigs = pgTable('dashboard_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  layout: json('layout').notNull(),
  isDefault: boolean('is_default').default(false),
  isGlobal: boolean('is_global').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dashboardWidgets = pgTable('dashboard_widgets', {
  id: serial('id').primaryKey(),
  configId: integer('config_id').references(() => dashboardConfigs.id),
  type: text('type').notNull(), // chart, metric, table, alert
  title: text('title').notNull(),
  dataSource: text('data_source').notNull(),
  settings: json('settings').notNull(),
  position: json('position').notNull(), // x, y, width, height
  refreshInterval: integer('refresh_interval').default(300), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kpiDefinitions = pgTable('kpi_definitions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  module: text('module').notNull(),
  description: text('description'),
  calculationLogic: text('calculation_logic').notNull(),
  targetValue: decimal('target_value'),
  thresholdWarning: decimal('threshold_warning'),
  thresholdCritical: decimal('threshold_critical'),
  unit: text('unit'),
  dataType: text('data_type').notNull(), // numeric, percentage, boolean
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const alertConfigurations = pgTable('alert_configurations', {
  id: serial('id').primaryKey(),
  kpiId: integer('kpi_id').references(() => kpiDefinitions.id),
  name: text('name').notNull(),
  condition: text('condition').notNull(), // above, below, equal
  threshold: decimal('threshold').notNull(),
  severity: text('severity').notNull(), // info, warning, critical
  notifyUsers: json('notify_users'), // array of user IDs
  notifyChannels: json('notify_channels'), // email, in-app, etc.
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const alertHistory = pgTable('alert_history', {
  id: serial('id').primaryKey(),
  alertConfigId: integer('alert_config_id').references(() => alertConfigurations.id),
  triggeredValue: decimal('triggered_value').notNull(),
  status: text('status').notNull(), // triggered, acknowledged, resolved
  acknowledgedBy: integer('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const healthScoreHistory = pgTable('health_score_history', {
  id: serial('id').primaryKey(),
  module: text('module').notNull(),
  score: decimal('score').notNull(),
  calculationDetails: json('calculation_details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const dashboardAuditTrail = pgTable('dashboard_audit_trail', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(), // create, update, delete, export
  entityType: text('entity_type').notNull(), // config, widget, kpi, alert
  entityId: integer('entity_id').notNull(),
  details: json('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Insert schemas
export const insertDashboardConfigSchema = createInsertSchema(dashboardConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKpiDefinitionSchema = createInsertSchema(kpiDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertConfigurationSchema = createInsertSchema(alertConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHealthScoreHistorySchema = createInsertSchema(healthScoreHistory).omit({
  id: true,
});

export const insertDashboardAuditTrailSchema = createInsertSchema(dashboardAuditTrail).omit({
  id: true,
  timestamp: true,
});

// Types for the system health & analytics
export type DashboardConfig = typeof dashboardConfigs.$inferSelect;
export type InsertDashboardConfig = z.infer<typeof insertDashboardConfigSchema>;

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;

export type KpiDefinition = typeof kpiDefinitions.$inferSelect;
export type InsertKpiDefinition = z.infer<typeof insertKpiDefinitionSchema>;

export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = z.infer<typeof insertAlertConfigurationSchema>;

export type AlertHistoryEntry = typeof alertHistory.$inferSelect;
export type HealthScoreHistoryEntry = typeof healthScoreHistory.$inferSelect;
export type InsertHealthScoreHistoryEntry = z.infer<typeof insertHealthScoreHistorySchema>;

export type DashboardAuditTrailEntry = typeof dashboardAuditTrail.$inferSelect;
export type InsertDashboardAuditTrailEntry = z.infer<typeof insertDashboardAuditTrailSchema>;

// SPC Chart Data types removed

// Preventive Maintenance & Calibration subsection (Measurement & Analysis Module)
// Calibration Assets
export const calibrationAssets = pgTable('calibration_assets', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').notNull().unique(),
  name: text('name').notNull(),
  manufacturer: text('manufacturer').notNull(),
  serialNumber: text('serial_number').notNull(),
  model: text('model'),
  location: text('location').notNull(),
  department: text('department'),
  calibrationFrequency: integer('calibration_frequency').notNull(), // in days
  lastCalibrationDate: timestamp('last_calibration_date'),
  nextCalibrationDate: timestamp('next_calibration_date'),
  status: text('status').notNull(), // active, inactive, out-of-service
  notes: text('notes'),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Calibration Records
export const calibrationRecords = pgTable('calibration_records', {
  id: serial('id').primaryKey(),
  recordId: text('record_id').notNull().unique(),
  assetId: integer('asset_id').notNull(),
  calibrationDate: timestamp('calibration_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  performedBy: integer('performed_by').notNull(),
  reviewedBy: integer('reviewed_by'),
  status: text('status').notNull(), // pass, fail, limited-pass
  certificateNumber: text('certificate_number'),
  certificateFile: text('certificate_file'),
  standard: text('standard'), // reference standard used
  environmentalConditions: json('environmental_conditions'), // temperature, humidity, etc.
  measurementMethod: text('measurement_method'),
  results: json('results'), // detailed calibration results
  outOfTolerance: boolean('out_of_tolerance').default(false),
  rootCause: text('root_cause'), // if out of tolerance
  correctiveAction: text('corrective_action'), // if out of tolerance
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Maintenance Assets
export const maintenanceAssets = pgTable('maintenance_assets', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').notNull().unique(),
  name: text('name').notNull(),
  assetType: text('asset_type').notNull(),
  manufacturer: text('manufacturer').notNull(),
  serialNumber: text('serial_number').notNull(),
  model: text('model'),
  location: text('location').notNull(),
  department: text('department'),
  riskClass: text('risk_class'), // critical, major, minor
  maintenanceFrequency: json('maintenance_frequency'), // {value: number, unit: 'days'|'hours'|'cycles'}
  lastMaintenanceDate: timestamp('last_maintenance_date'),
  nextMaintenanceDate: timestamp('next_maintenance_date'),
  procedureReference: text('procedure_reference'), // link to SOP
  status: text('status').notNull(), // active, inactive, out-of-service
  notes: text('notes'),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Maintenance Records
export const maintenanceRecords = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  recordId: text('record_id').notNull().unique(),
  assetId: integer('asset_id').notNull(),
  maintenanceDate: timestamp('maintenance_date').notNull(),
  completedDate: timestamp('completed_date'),
  dueDate: timestamp('due_date').notNull(),
  maintenanceType: text('maintenance_type').notNull(), // preventive, corrective
  performedBy: integer('performed_by').notNull(),
  verifiedBy: integer('verified_by'),
  status: text('status').notNull(), // scheduled, in-progress, completed, missed
  actions: text('actions').notNull(),
  spareParts: json('spare_parts'), // parts used
  findings: text('findings'),
  recommendations: text('recommendations'),
  serviceReport: text('service_report'), // file path
  images: text('images').array(), // file paths
  downtime: integer('downtime'), // in minutes
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Create insert schemas
export const insertCalibrationAssetSchema = createInsertSchema(calibrationAssets)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Make location optional to match client-side changes
    location: z.string().optional(),
    // Make createdBy optional to match client-side changes
    createdBy: z.number().optional(),
    // Modify the date field validators to handle string dates
    lastCalibrationDate: z.string().or(z.date()).optional().nullable(),
    nextCalibrationDate: z.string().or(z.date()).optional().nullable(),
  });

export const insertCalibrationRecordSchema = createInsertSchema(calibrationRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceAssetSchema = createInsertSchema(maintenanceAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types for Preventive Maintenance & Calibration
export type CalibrationAsset = typeof calibrationAssets.$inferSelect;
export type InsertCalibrationAsset = z.infer<typeof insertCalibrationAssetSchema>;

export type CalibrationRecord = typeof calibrationRecords.$inferSelect;
export type InsertCalibrationRecord = z.infer<typeof insertCalibrationRecordSchema>;

export type MaintenanceAsset = typeof maintenanceAssets.$inferSelect;
export type InsertMaintenanceAsset = z.infer<typeof insertMaintenanceAssetSchema>;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;

// Define relations for Preventive Maintenance & Calibration
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
  reviewedByUser: one(users, {
    fields: [calibrationRecords.reviewedBy],
    references: [users.id],
  }),
}));

export const maintenanceAssetsRelations = relations(maintenanceAssets, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [maintenanceAssets.createdBy],
    references: [users.id],
  }),
  maintenanceRecords: many(maintenanceRecords),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  asset: one(maintenanceAssets, {
    fields: [maintenanceRecords.assetId],
    references: [maintenanceAssets.id],
  }),
  performedByUser: one(users, {
    fields: [maintenanceRecords.performedBy],
    references: [users.id],
  }),
  verifiedByUser: one(users, {
    fields: [maintenanceRecords.verifiedBy],
    references: [users.id],
  }),
}));

// Relations for Risk-Based Analysis & Process Monitoring Module
export const processesRelations = relations(processes, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [processes.createdBy],
    references: [users.id],
  }),
  metrics: many(metrics),
  riskScores: many(riskScores),
}));

export const metricsRelations = relations(metrics, ({ one, many }) => ({
  process: one(processes, {
    fields: [metrics.processId],
    references: [processes.id],
  }),
  createdByUser: one(users, {
    fields: [metrics.createdBy],
    references: [users.id],
  }),
  values: many(metricValues),
  alertRules: many(alertRules),
}));

export const metricValuesRelations = relations(metricValues, ({ one }) => ({
  metric: one(metrics, {
    fields: [metricValues.metricId],
    references: [metrics.id],
  }),
  user: one(users, {
    fields: [metricValues.userId],
    references: [users.id],
  }),
}));

export const riskScoresRelations = relations(riskScores, ({ one }) => ({
  process: one(processes, {
    fields: [riskScores.processId],
    references: [processes.id],
  }),
}));

export const alertRulesRelations = relations(alertRules, ({ one, many }) => ({
  metric: one(metrics, {
    fields: [alertRules.metricId],
    references: [metrics.id],
  }),
  createdByUser: one(users, {
    fields: [alertRules.createdBy],
    references: [users.id],
  }),
  alerts: many(alerts),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  rule: one(alertRules, {
    fields: [alerts.ruleId],
    references: [alertRules.id],
  }),
  metric: one(metrics, {
    fields: [alerts.metricId],
    references: [metrics.id],
  }),
  acknowledgedByUser: one(users, {
    fields: [alerts.acknowledgedBy],
    references: [users.id],
    nullable: true
  }),
}));

// Insert schemas for Risk-Based Analysis & Process Monitoring Module
export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMetricSchema = createInsertSchema(metrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMetricValueSchema = createInsertSchema(metricValues).omit({
  id: true,
  createdAt: true,
});

export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({
  id: true,
  createdAt: true,
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  acknowledgedBy: true,
  acknowledgedAt: true,
  createdAt: true,
});

// Types for Risk-Based Analysis & Process Monitoring Module
export type Process = typeof processes.$inferSelect;
export type InsertProcess = z.infer<typeof insertProcessSchema>;

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;

export type MetricValue = typeof metricValues.$inferSelect;
export type InsertMetricValue = z.infer<typeof insertMetricValueSchema>;

export type RiskScore = typeof riskScores.$inferSelect;
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Design Control System for Medical Devices (ISO 13485:2016 + IEC 62304)

// Design project types
export const designProjectTypes = pgTable("design_project_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design project status
export const designProjectStatuses = pgTable("design_project_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design development model types (V-Model, Agile, Waterfall)
export const designModelTypes = pgTable("design_model_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Risk classification for medical devices
export const riskClassifications = pgTable("risk_classifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Class I, IIa, IIb, III
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Main design projects table
export const designProjects = pgTable("design_projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(), // Auto-generated project code
  title: text("title").notNull(),
  description: text("description"),
  typeId: integer("type_id").notNull().references(() => designProjectTypes.id),
  statusId: integer("status_id").notNull().references(() => designProjectStatuses.id),
  modelTypeId: integer("model_type_id").notNull().references(() => designModelTypes.id),
  riskClassId: integer("risk_class_id").notNull().references(() => riskClassifications.id),
  // NOTE: hasSoftwareComponent field doesn't exist in the actual database
  // hasSoftwareComponent: boolean("has_software_component").default(false),
  initiatedBy: integer("initiated_by").references(() => users.id),
  projectManager: integer("project_manager").references(() => users.id),
  startDate: timestamp("start_date"),
  targetCompletionDate: timestamp("target_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  // NOTE: approvalDate field doesn't exist in the actual database
  // approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User needs & requirements
export const userNeeds = pgTable("user_needs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  needCode: text("need_code").notNull(), // UN-001, UN-002, etc.
  description: text("description").notNull(),
  source: text("source"), // Where the user need came from
  sourceDetails: text("source_details"),
  priority: integer("priority").default(3), // 1-5 scale
  rationale: text("rationale"),
  status: text("status").default("active"), // active, removed, etc.
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design input requirements
export const designInputs = pgTable("design_inputs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  inputCode: text("input_code").notNull(), // DI-001, DI-002, etc.
  description: text("description").notNull(),
  type: text("type").notNull(), // functional, performance, interface, etc.
  priority: integer("priority").default(3), // 1-5 scale
  rationale: text("rationale"),
  verificationMethod: text("verification_method"), // test, inspection, analysis, etc.
  status: text("status").default("active"), // active, removed, etc.
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design outputs
export const designOutputs = pgTable("design_outputs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  outputCode: text("output_code").notNull(), // DO-001, DO-002, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // spec, drawing, prototype, code, etc.
  documentRef: text("document_ref"), // Reference to document in document control
  status: text("status").default("draft"), // draft, approved, etc.
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design verification plans
export const verificationPlans = pgTable("verification_plans", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  planCode: text("plan_code").notNull(), // VTP-001, VTP-002, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  method: text("method").notNull(), // test, inspection, analysis, etc.
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  status: text("status").default("draft"), // draft, approved, executed, etc.
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  executedBy: integer("executed_by").references(() => users.id),
  executionDate: timestamp("execution_date"),
  result: text("result"), // pass, fail, conditional pass
  resultNotes: text("result_notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design validation plans
export const validationPlans = pgTable("validation_plans", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  planCode: text("plan_code").notNull(), // VAL-001, VAL-002, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  method: text("method").notNull(), // clinical study, simulated use, etc.
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  status: text("status").default("draft"), // draft, approved, executed, etc.
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  executedBy: integer("executed_by").references(() => users.id),
  executionDate: timestamp("execution_date"),
  result: text("result"), // pass, fail, conditional pass
  resultNotes: text("result_notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Traceability matrix - links all design elements
export const traceabilityLinks = pgTable("traceability_links", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  sourceType: text("source_type").notNull(), // user_need, design_input, design_output, etc.
  sourceId: integer("source_id").notNull(),
  targetType: text("target_type").notNull(), // design_input, design_output, verification, etc.
  targetId: integer("target_id").notNull(),
  linkType: text("link_type").default("fulfills"), // fulfills, verifies, validates, etc.
  comments: text("comments"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design reviews
export const designReviews = pgTable("design_reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  reviewCode: text("review_code").notNull(), // DR-001, DR-002, etc.
  title: text("title").notNull(),
  phaseOrMilestone: text("phase_or_milestone").notNull(), // which project phase
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  chairperson: integer("chairperson").references(() => users.id),
  status: text("status").default("planned"), // planned, completed, cancelled
  outcome: text("outcome"), // approved, approved with conditions, rejected
  comments: text("comments"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design review participants
export const designReviewParticipants = pgTable("design_review_participants", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => designReviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // reviewer, presenter, observer, etc.
  attended: boolean("attended").default(false),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design review items
export const designReviewItems = pgTable("design_review_items", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => designReviews.id),
  itemNumber: integer("item_number").notNull(),
  description: text("description").notNull(),
  itemType: text("item_type").notNull(), // discussion, decision, action, etc.
  status: text("status").default("open"), // open, closed, deferred
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  closedDate: timestamp("closed_date"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Software specific tables (IEC 62304)
// Software requirements
export const softwareRequirements = pgTable("software_requirements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  reqCode: text("req_code").notNull(), // SRS-001, SRS-002, etc.
  description: text("description").notNull(),
  type: text("type").notNull(), // functional, performance, interface, etc.
  safetyClass: text("safety_class"), // A, B, C
  priority: integer("priority").default(3), // 1-5 scale
  rationale: text("rationale"),
  verificationMethod: text("verification_method"), // test, inspection, analysis, etc.
  status: text("status").default("active"), // active, removed, etc.
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Software architecture
export const softwareArchitecture = pgTable("software_architecture", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  architectureCode: text("architecture_code").notNull(), // ARCH-001, ARCH-002, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  version: text("version").notNull(),
  status: text("status").default("draft"), // draft, approved, etc.
  documentRef: text("document_ref"), // Reference to architecture document
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Software units/modules
export const softwareUnits = pgTable("software_units", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  architectureId: integer("architecture_id").references(() => softwareArchitecture.id),
  unitCode: text("unit_code").notNull(), // UNIT-001, UNIT-002, etc.
  name: text("name").notNull(),
  description: text("description").notNull(),
  function: text("function").notNull(),
  safetyClass: text("safety_class"), // A, B, C
  status: text("status").default("draft"), // draft, implemented, tested, etc.
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Unit tests
export const unitTests = pgTable("unit_tests", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull().references(() => softwareUnits.id),
  testCode: text("test_code").notNull(), // UT-001, UT-002, etc.
  description: text("description").notNull(),
  testMethod: text("test_method").notNull(),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  status: text("status").default("planned"), // planned, executed, etc.
  executedBy: integer("executed_by").references(() => users.id),
  executionDate: timestamp("execution_date"),
  result: text("result"), // pass, fail
  resultNotes: text("result_notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Integration tests
export const integrationTests = pgTable("integration_tests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  testCode: text("test_code").notNull(), // IT-001, IT-002, etc.
  description: text("description").notNull(),
  unitsInvolved: text("units_involved").notNull(), // Comma-separated list of unit codes
  testMethod: text("test_method").notNull(),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  status: text("status").default("planned"), // planned, executed, etc.
  executedBy: integer("executed_by").references(() => users.id),
  executionDate: timestamp("execution_date"),
  result: text("result"), // pass, fail
  resultNotes: text("result_notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Software releases
export const softwareReleases = pgTable("software_releases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  releaseCode: text("release_code").notNull(), // SR-001, SR-002, etc.
  version: text("version").notNull(),
  description: text("description").notNull(),
  releaseDate: timestamp("release_date"),
  releaseNotes: text("release_notes"),
  status: text("status").default("planned"), // planned, released, etc.
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Design file documents
export const designDocuments = pgTable("design_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjects.id),
  documentCode: text("document_code").notNull(), // DOC-001, DOC-002, etc.
  title: text("title").notNull(),
  description: text("description"),
  documentType: text("document_type").notNull(), // plan, specification, report, etc.
  version: text("version").notNull(),
  status: text("status").default("draft"), // draft, approved, etc.
  filePath: text("file_path"), // Path to the document file
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// insertDesignDocumentSchema is defined below with other insert schemas

// Insert schemas
export const insertDesignProjectTypeSchema = createInsertSchema(designProjectTypes).omit({ id: true });
export const insertDesignProjectStatusSchema = createInsertSchema(designProjectStatuses).omit({ id: true });
export const insertDesignModelTypeSchema = createInsertSchema(designModelTypes).omit({ id: true });
export const insertRiskClassificationSchema = createInsertSchema(riskClassifications).omit({ id: true });
// Create insert schema for design projects - ensure fields match actual DB columns
export const insertDesignProjectSchema = createInsertSchema(designProjects).omit({ 
  id: true,
  createdAt: true, 
  updatedAt: true
});
export const insertUserNeedSchema = createInsertSchema(userNeeds).omit({ id: true });
export const insertDesignInputSchema = createInsertSchema(designInputs).omit({ id: true });
export const insertDesignOutputSchema = createInsertSchema(designOutputs).omit({ id: true });
export const insertVerificationPlanSchema = createInsertSchema(verificationPlans).omit({ id: true });
export const insertValidationPlanSchema = createInsertSchema(validationPlans).omit({ id: true });
export const insertTraceabilityLinkSchema = createInsertSchema(traceabilityLinks).omit({ id: true });
export const insertDesignReviewSchema = createInsertSchema(designReviews).omit({ id: true });
export const insertDesignReviewParticipantSchema = createInsertSchema(designReviewParticipants).omit({ id: true });
export const insertDesignReviewItemSchema = createInsertSchema(designReviewItems).omit({ id: true });
export const insertSoftwareRequirementSchema = createInsertSchema(softwareRequirements).omit({ id: true });
export const insertSoftwareArchitectureSchema = createInsertSchema(softwareArchitecture).omit({ id: true });
export const insertSoftwareUnitSchema = createInsertSchema(softwareUnits).omit({ id: true });
export const insertUnitTestSchema = createInsertSchema(unitTests).omit({ id: true });
export const insertIntegrationTestSchema = createInsertSchema(integrationTests).omit({ id: true });
export const insertSoftwareReleaseSchema = createInsertSchema(softwareReleases).omit({ id: true });
export const insertDesignDocumentSchema = createInsertSchema(designDocuments).omit({ id: true });

// Types
export type DesignProjectType = typeof designProjectTypes.$inferSelect;
export type InsertDesignProjectType = z.infer<typeof insertDesignProjectTypeSchema>;

export type DesignProjectStatus = typeof designProjectStatuses.$inferSelect;
export type InsertDesignProjectStatus = z.infer<typeof insertDesignProjectStatusSchema>;

export type DesignModelType = typeof designModelTypes.$inferSelect;
export type InsertDesignModelType = z.infer<typeof insertDesignModelTypeSchema>;

export type RiskClassification = typeof riskClassifications.$inferSelect;
export type InsertRiskClassification = z.infer<typeof insertRiskClassificationSchema>;

export type DesignProject = typeof designProjects.$inferSelect;
export type InsertDesignProject = z.infer<typeof insertDesignProjectSchema>;

export type UserNeed = typeof userNeeds.$inferSelect;
export type InsertUserNeed = z.infer<typeof insertUserNeedSchema>;

export type DesignInput = typeof designInputs.$inferSelect;
export type InsertDesignInput = z.infer<typeof insertDesignInputSchema>;

export type DesignOutput = typeof designOutputs.$inferSelect;
export type InsertDesignOutput = z.infer<typeof insertDesignOutputSchema>;

export type VerificationPlan = typeof verificationPlans.$inferSelect;
export type InsertVerificationPlan = z.infer<typeof insertVerificationPlanSchema>;

export type ValidationPlan = typeof validationPlans.$inferSelect;
export type InsertValidationPlan = z.infer<typeof insertValidationPlanSchema>;

export type TraceabilityLink = typeof traceabilityLinks.$inferSelect;
export type InsertTraceabilityLink = z.infer<typeof insertTraceabilityLinkSchema>;

export type DesignReview = typeof designReviews.$inferSelect;
export type InsertDesignReview = z.infer<typeof insertDesignReviewSchema>;

export type DesignReviewParticipant = typeof designReviewParticipants.$inferSelect;
export type InsertDesignReviewParticipant = z.infer<typeof insertDesignReviewParticipantSchema>;

export type DesignReviewItem = typeof designReviewItems.$inferSelect;
export type InsertDesignReviewItem = z.infer<typeof insertDesignReviewItemSchema>;

export type SoftwareRequirement = typeof softwareRequirements.$inferSelect;
export type InsertSoftwareRequirement = z.infer<typeof insertSoftwareRequirementSchema>;

export type SoftwareArchitecture = typeof softwareArchitecture.$inferSelect;
export type InsertSoftwareArchitecture = z.infer<typeof insertSoftwareArchitectureSchema>;

export type SoftwareUnit = typeof softwareUnits.$inferSelect;
export type InsertSoftwareUnit = z.infer<typeof insertSoftwareUnitSchema>;

export type UnitTest = typeof unitTests.$inferSelect;
export type InsertUnitTest = z.infer<typeof insertUnitTestSchema>;

export type IntegrationTest = typeof integrationTests.$inferSelect;
export type InsertIntegrationTest = z.infer<typeof insertIntegrationTestSchema>;

export type SoftwareRelease = typeof softwareReleases.$inferSelect;
export type InsertSoftwareRelease = z.infer<typeof insertSoftwareReleaseSchema>;

export type DesignDocument = typeof designDocuments.$inferSelect;
export type InsertDesignDocument = z.infer<typeof insertDesignDocumentSchema>;

// Relations
export const designProjectRelations = relations(designProjects, ({ one, many }) => ({
  type: one(designProjectTypes, {
    fields: [designProjects.typeId],
    references: [designProjectTypes.id]
  }),
  status: one(designProjectStatuses, {
    fields: [designProjects.statusId],
    references: [designProjectStatuses.id]
  }),
  modelType: one(designModelTypes, {
    fields: [designProjects.modelTypeId],
    references: [designModelTypes.id]
  }),
  riskClass: one(riskClassifications, {
    fields: [designProjects.riskClassId],
    references: [riskClassifications.id]
  }),
  initiator: one(users, {
    fields: [designProjects.initiatedBy],
    references: [users.id]
  }),
  manager: one(users, {
    fields: [designProjects.projectManager],
    references: [users.id]
  }),
  userNeeds: many(userNeeds),
  designInputs: many(designInputs),
  designOutputs: many(designOutputs),
  verificationPlans: many(verificationPlans),
  validationPlans: many(validationPlans),
  designReviews: many(designReviews),
  softwareRequirements: many(softwareRequirements),
  softwareArchitecture: many(softwareArchitecture),
  softwareReleases: many(softwareReleases),
  designDocuments: many(designDocuments)
}));

export const userNeedsRelations = relations(userNeeds, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [userNeeds.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [userNeeds.createdBy],
    references: [users.id]
  }),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "userNeedsSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "userNeedsTargetLinks" })
}));

export const designInputsRelations = relations(designInputs, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [designInputs.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [designInputs.createdBy],
    references: [users.id]
  }),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "designInputsSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "designInputsTargetLinks" })
}));

export const designOutputsRelations = relations(designOutputs, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [designOutputs.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [designOutputs.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [designOutputs.approvedBy],
    references: [users.id]
  }),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "designOutputsSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "designOutputsTargetLinks" })
}));

export const verificationPlansRelations = relations(verificationPlans, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [verificationPlans.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [verificationPlans.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [verificationPlans.approvedBy],
    references: [users.id]
  }),
  executor: one(users, {
    fields: [verificationPlans.executedBy],
    references: [users.id]
  }),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "verificationPlansSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "verificationPlansTargetLinks" })
}));

export const validationPlansRelations = relations(validationPlans, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [validationPlans.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [validationPlans.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [validationPlans.approvedBy],
    references: [users.id]
  }),
  executor: one(users, {
    fields: [validationPlans.executedBy],
    references: [users.id]
  }),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "validationPlansSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "validationPlansTargetLinks" })
}));

export const designReviewsRelations = relations(designReviews, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [designReviews.projectId],
    references: [designProjects.id]
  }),
  chair: one(users, {
    fields: [designReviews.chairperson],
    references: [users.id]
  }),
  creator: one(users, {
    fields: [designReviews.createdBy],
    references: [users.id]
  }),
  participants: many(designReviewParticipants),
  items: many(designReviewItems)
}));

export const designReviewParticipantsRelations = relations(designReviewParticipants, ({ one }) => ({
  review: one(designReviews, {
    fields: [designReviewParticipants.reviewId],
    references: [designReviews.id]
  }),
  user: one(users, {
    fields: [designReviewParticipants.userId],
    references: [users.id]
  })
}));

export const designReviewItemsRelations = relations(designReviewItems, ({ one }) => ({
  review: one(designReviews, {
    fields: [designReviewItems.reviewId],
    references: [designReviews.id]
  }),
  assignee: one(users, {
    fields: [designReviewItems.assignedTo],
    references: [users.id]
  })
}));

export const softwareRequirementsRelations = relations(softwareRequirements, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [softwareRequirements.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [softwareRequirements.createdBy],
    references: [users.id]
  }),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "softwareRequirementsSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "softwareRequirementsTargetLinks" })
}));

export const softwareArchitectureRelations = relations(softwareArchitecture, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [softwareArchitecture.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [softwareArchitecture.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [softwareArchitecture.approvedBy],
    references: [users.id]
  }),
  units: many(softwareUnits),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "softwareArchitectureSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "softwareArchitectureTargetLinks" })
}));

export const softwareUnitsRelations = relations(softwareUnits, ({ one, many }) => ({
  project: one(designProjects, {
    fields: [softwareUnits.projectId],
    references: [designProjects.id]
  }),
  architecture: one(softwareArchitecture, {
    fields: [softwareUnits.architectureId],
    references: [softwareArchitecture.id]
  }),
  creator: one(users, {
    fields: [softwareUnits.createdBy],
    references: [users.id]
  }),
  unitTests: many(unitTests),
  traceabilitySourceLinks: many(traceabilityLinks, { relationName: "softwareUnitsSourceLinks" }),
  traceabilityTargetLinks: many(traceabilityLinks, { relationName: "softwareUnitsTargetLinks" })
}));

export const unitTestsRelations = relations(unitTests, ({ one }) => ({
  unit: one(softwareUnits, {
    fields: [unitTests.unitId],
    references: [softwareUnits.id]
  }),
  creator: one(users, {
    fields: [unitTests.createdBy],
    references: [users.id]
  }),
  executor: one(users, {
    fields: [unitTests.executedBy],
    references: [users.id]
  })
}));

export const integrationTestsRelations = relations(integrationTests, ({ one }) => ({
  project: one(designProjects, {
    fields: [integrationTests.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [integrationTests.createdBy],
    references: [users.id]
  }),
  executor: one(users, {
    fields: [integrationTests.executedBy],
    references: [users.id]
  })
}));

export const softwareReleasesRelations = relations(softwareReleases, ({ one }) => ({
  project: one(designProjects, {
    fields: [softwareReleases.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [softwareReleases.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [softwareReleases.approvedBy],
    references: [users.id]
  })
}));

export const designDocumentsRelations = relations(designDocuments, ({ one }) => ({
  project: one(designProjects, {
    fields: [designDocuments.projectId],
    references: [designProjects.id]
  }),
  creator: one(users, {
    fields: [designDocuments.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [designDocuments.approvedBy],
    references: [users.id]
  })
}));

// Management Review Module
export const managementReviews = pgTable("management_reviews", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  reviewDate: timestamp("review_date").notNull(),
  reviewType: text("review_type").notNull().default("regular"), // regular, special
  status: text("status").notNull().default("scheduled"), // scheduled, in-progress, completed, approved
  purpose: text("purpose"),
  scope: text("scope"),
  minutes: text("minutes"),
  conclusion: text("conclusion"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  scheduledBy: integer("scheduled_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const managementReviewAttendees = pgTable("management_review_attendees", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => managementReviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // chairperson, secretary, attendee, guest
  attended: boolean("attended").default(false),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const managementReviewInputs = pgTable("management_review_inputs", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => managementReviews.id),
  title: text("title").notNull(),
  category: text("category").notNull(), // audit, capa, complaint, regulatory, training, etc.
  description: text("description").notNull(),
  source: text("source"), // module reference or external source
  sourceId: integer("source_id"), // ID reference to source item if internal
  data: json("data"), // JSON data for metrics, KPIs, etc.
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const managementReviewActionItems = pgTable("management_review_action_items", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => managementReviews.id),
  description: text("description").notNull(),
  assignedTo: integer("assigned_to").notNull().references(() => users.id),
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  status: text("status").notNull().default("open"), // open, in-progress, completed, verified
  completedDate: timestamp("completed_date"),
  completedBy: integer("completed_by").references(() => users.id),
  verifiedDate: timestamp("verified_date"),
  verifiedBy: integer("verified_by").references(() => users.id),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const managementReviewSignatures = pgTable("management_review_signatures", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => managementReviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // approver, reviewer
  signatureDate: timestamp("signature_date").defaultNow().notNull(),
  meaning: text("meaning").notNull(), // "Reviewed and Approved", "Witnessed", etc.
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for insert operations
export const insertManagementReviewSchema = createInsertSchema(managementReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvalDate: true,
});

export const insertManagementReviewAttendeeSchema = createInsertSchema(managementReviewAttendees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManagementReviewInputSchema = createInsertSchema(managementReviewInputs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManagementReviewActionItemSchema = createInsertSchema(managementReviewActionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedDate: true,
  verifiedDate: true,
});

export const insertManagementReviewSignatureSchema = createInsertSchema(managementReviewSignatures).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertManagementReview = z.infer<typeof insertManagementReviewSchema>;
export type ManagementReview = typeof managementReviews.$inferSelect;

export type InsertManagementReviewAttendee = z.infer<typeof insertManagementReviewAttendeeSchema>;
export type ManagementReviewAttendee = typeof managementReviewAttendees.$inferSelect;

export type InsertManagementReviewInput = z.infer<typeof insertManagementReviewInputSchema>;
export type ManagementReviewInput = typeof managementReviewInputs.$inferSelect;

export type InsertManagementReviewActionItem = z.infer<typeof insertManagementReviewActionItemSchema>;
export type ManagementReviewActionItem = typeof managementReviewActionItems.$inferSelect;

export type InsertManagementReviewSignature = z.infer<typeof insertManagementReviewSignatureSchema>;
export type ManagementReviewSignature = typeof managementReviewSignatures.$inferSelect;

// Relations
export const managementReviewsRelations = relations(managementReviews, ({ one, many }) => ({
  creator: one(users, {
    fields: [managementReviews.createdBy],
    references: [users.id]
  }),
  scheduler: one(users, {
    fields: [managementReviews.scheduledBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [managementReviews.approvedBy],
    references: [users.id]
  }),
  attendees: many(managementReviewAttendees),
  inputs: many(managementReviewInputs),
  actionItems: many(managementReviewActionItems),
  signatures: many(managementReviewSignatures)
}));

export const managementReviewAttendeesRelations = relations(managementReviewAttendees, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewAttendees.reviewId],
    references: [managementReviews.id]
  }),
  user: one(users, {
    fields: [managementReviewAttendees.userId],
    references: [users.id]
  })
}));

export const managementReviewInputsRelations = relations(managementReviewInputs, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewInputs.reviewId],
    references: [managementReviews.id]
  }),
  creator: one(users, {
    fields: [managementReviewInputs.createdBy],
    references: [users.id]
  })
}));

export const managementReviewActionItemsRelations = relations(managementReviewActionItems, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewActionItems.reviewId],
    references: [managementReviews.id]
  }),
  assignee: one(users, {
    fields: [managementReviewActionItems.assignedTo],
    references: [users.id]
  }),
  completer: one(users, {
    fields: [managementReviewActionItems.completedBy],
    references: [users.id]
  }),
  verifier: one(users, {
    fields: [managementReviewActionItems.verifiedBy],
    references: [users.id]
  })
}));

export const managementReviewSignaturesRelations = relations(managementReviewSignatures, ({ one }) => ({
  review: one(managementReviews, {
    fields: [managementReviewSignatures.reviewId],
    references: [managementReviews.id]
  }),
  user: one(users, {
    fields: [managementReviewSignatures.userId],
    references: [users.id]
  })
}));
