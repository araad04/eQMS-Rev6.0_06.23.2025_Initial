import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// IOVV Matrix Schema

export const iovvMatrices = pgTable("iovv_matrices", {
  id: serial("id").primaryKey(),
  module: text("module").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("Draft"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  updatedBy: integer("updated_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const requirements = pgTable("iovv_requirements", {
  id: serial("id").primaryKey(),
  requirementId: text("requirement_id").notNull().unique(),
  matrixId: integer("matrix_id").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(),
  priority: text("priority").notNull(),
  riskLevel: text("risk_level").notNull(),
  regulatoryReference: jsonb("regulatory_reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const specifications = pgTable("iovv_specifications", {
  id: serial("id").primaryKey(),
  specificationId: text("specification_id").notNull().unique(),
  matrixId: integer("matrix_id").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  relatedRequirements: jsonb("related_requirements").notNull(),
  implementationLocation: jsonb("implementation_location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verificationTests = pgTable("iovv_verification_tests", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull().unique(),
  matrixId: integer("matrix_id").notNull(),
  description: text("description").notNull(),
  testType: text("test_type").notNull(),
  relatedSpecifications: jsonb("related_specifications").notNull(),
  testMethod: text("test_method").notNull(),
  testScript: jsonb("test_script"),
  expectedResult: text("expected_result").notNull(),
  actualResult: text("actual_result"),
  status: text("status").notNull().default("Not Run"),
  executionDate: timestamp("execution_date"),
  executedBy: text("executed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const validationTests = pgTable("iovv_validation_tests", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull().unique(),
  matrixId: integer("matrix_id").notNull(),
  description: text("description").notNull(),
  testType: text("test_type").notNull(),
  relatedRequirements: jsonb("related_requirements").notNull(),
  testMethod: text("test_method").notNull(),
  testScript: jsonb("test_script"),
  expectedResult: text("expected_result").notNull(),
  actualResult: text("actual_result"),
  status: text("status").notNull().default("Not Run"),
  executionDate: timestamp("execution_date"),
  executedBy: text("executed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const validationEvidence = pgTable("iovv_validation_evidence", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull(),
  type: text("type").notNull(),
  path: text("path").notNull(),
  description: text("description"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const defects = pgTable("iovv_defects", {
  id: serial("id").primaryKey(),
  defectId: text("defect_id").notNull().unique(),
  matrixId: integer("matrix_id").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("Open"),
  relatedTests: jsonb("related_tests").notNull(),
  relatedRequirements: jsonb("related_requirements").notNull(),
  resolution: text("resolution"),
  reportedDate: timestamp("reported_date").notNull(),
  reportedBy: text("reported_by").notNull(),
  assignedTo: text("assigned_to"),
  resolvedDate: timestamp("resolved_date"),
  resolvedBy: text("resolved_by"),
  verifiedDate: timestamp("verified_date"),
  verifiedBy: text("verified_by"),
  impact: jsonb("impact"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const testExecutionLogs = pgTable("iovv_test_execution_logs", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull(),
  testType: text("test_type").notNull(),
  status: text("status").notNull(),
  message: text("message"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(),
  executedBy: integer("executed_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertIovvMatrixSchema = createInsertSchema(iovvMatrices).omit({ id: true, createdAt: true });
export const insertRequirementSchema = createInsertSchema(requirements).omit({ id: true, createdAt: true });
export const insertSpecificationSchema = createInsertSchema(specifications).omit({ id: true, createdAt: true });
export const insertVerificationTestSchema = createInsertSchema(verificationTests).omit({ id: true, createdAt: true });
export const insertValidationTestSchema = createInsertSchema(validationTests).omit({ id: true, createdAt: true });
export const insertValidationEvidenceSchema = createInsertSchema(validationEvidence).omit({ id: true, uploadedAt: true });
export const insertDefectSchema = createInsertSchema(defects).omit({ id: true, createdAt: true });
export const insertTestExecutionLogSchema = createInsertSchema(testExecutionLogs).omit({ id: true, createdAt: true });

// Types
export type IovvMatrix = z.infer<typeof insertIovvMatrixSchema>;
export type Requirement = z.infer<typeof insertRequirementSchema>;
export type Specification = z.infer<typeof insertSpecificationSchema>;
export type VerificationTest = z.infer<typeof insertVerificationTestSchema>;
export type ValidationTest = z.infer<typeof insertValidationTestSchema>;
export type ValidationEvidence = z.infer<typeof insertValidationEvidenceSchema>;
export type Defect = z.infer<typeof insertDefectSchema>;
export type TestExecutionLog = z.infer<typeof insertTestExecutionLogSchema>;

// DB Select types
export type SelectIovvMatrix = typeof iovvMatrices.$inferSelect;
export type SelectRequirement = typeof requirements.$inferSelect;
export type SelectSpecification = typeof specifications.$inferSelect;
export type SelectVerificationTest = typeof verificationTests.$inferSelect;
export type SelectValidationTest = typeof validationTests.$inferSelect;
export type SelectValidationEvidence = typeof validationEvidence.$inferSelect;
export type SelectDefect = typeof defects.$inferSelect;
export type SelectTestExecutionLog = typeof testExecutionLogs.$inferSelect;