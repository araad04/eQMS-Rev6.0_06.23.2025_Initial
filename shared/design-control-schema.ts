import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// ========================================
// ISO 13485:7.3 & IEC 62304 DESIGN CONTROL SYSTEM
// Flow-based Project Management Implementation
// ========================================

// Design Project Types (ISO 13485:7.3.2)
export const designProjectTypes = pgTable("design_project_types_new", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(), // NP, DC, SD
  description: text("description"),
  requiresSoftwareLifecycle: boolean("requires_software_lifecycle").default(false),
  defaultPhaseTemplate: text("default_phase_template"), // JSON template for phases
});

// Design Project Statuses (Flow States)
export const designProjectStatuses = pgTable("design_project_statuses_new", {
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

// Design Project Master (Enhanced)
export const designProjectsNew = pgTable("design_projects_new", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(), // AUTO: DP-2025-001
  projectTypeId: integer("project_type_id").notNull().references(() => designProjectTypes.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  objective: text("objective").notNull(),
  statusId: integer("status_id").notNull().references(() => designProjectStatuses.id),
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
  isArchived: boolean("is_archived").default(false),
  archivedBy: integer("archived_by").references(() => users.id),
  archivedAt: timestamp("archived_at"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gantt-linked Tasks (Project Management)
export const designProjectTasks = pgTable("design_project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjectsNew.id),
  phaseInstanceId: integer("phase_instance_id").references(() => projectPhaseInstances.id),
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
  parentTaskId: integer("parent_task_id").references(() => designProjectTasks.id),
  dependencies: text("dependencies"), // JSON array of task IDs
  completionPercentage: integer("completion_percentage").default(0),
  isoRequirement: text("iso_requirement"), // Link to ISO 13485 clause
  iecRequirement: text("iec_requirement"), // Link to IEC 62304 clause
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

export const designInputs = pgTable("design_inputs_new", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => designProjectsNew.id),
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

export const insertDesignProjectSchema = createInsertSchema(designProjectsNew).omit({
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
});

export const insertDesignInputSchema = createInsertSchema(designInputs).omit({
  id: true,
  inputId: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Design Control
export type DesignProjectType = typeof designProjectTypes.$inferSelect;
export type InsertDesignProjectType = z.infer<typeof insertDesignProjectTypeSchema>;

export type DesignProjectStatus = typeof designProjectStatuses.$inferSelect;
export type InsertDesignProjectStatus = z.infer<typeof insertDesignProjectStatusSchema>;

export type DesignProjectPhase = typeof designProjectPhases.$inferSelect;
export type InsertDesignProjectPhase = z.infer<typeof insertDesignProjectPhaseSchema>;

export type ProjectPhaseInstance = typeof projectPhaseInstances.$inferSelect;
export type InsertProjectPhaseInstance = z.infer<typeof insertProjectPhaseInstanceSchema>;

export type DesignProjectTask = typeof designProjectTasks.$inferSelect;
export type InsertDesignProjectTask = z.infer<typeof insertDesignProjectTaskSchema>;

export type DesignProjectNew = typeof designProjectsNew.$inferSelect;
export type InsertDesignProject = z.infer<typeof insertDesignProjectSchema>;

export type DesignInput = typeof designInputs.$inferSelect;
export type InsertDesignInput = z.infer<typeof insertDesignInputSchema>;

// Project Relations
export const designProjectsRelations = relations(designProjectsNew, ({ one, many }) => ({
  projectType: one(designProjectTypes, {
    fields: [designProjectsNew.projectTypeId],
    references: [designProjectTypes.id],
  }),
  status: one(designProjectStatuses, {
    fields: [designProjectsNew.statusId],
    references: [designProjectStatuses.id],
  }),
  responsiblePerson: one(users, {
    fields: [designProjectsNew.responsiblePerson],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [designProjectsNew.createdBy],
    references: [users.id],
  }),
  tasks: many(designProjectTasks),
  inputs: many(designInputs),
}));