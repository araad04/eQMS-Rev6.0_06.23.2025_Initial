import { db } from "./db";
import { qualityManuals, manualVersions, manualSections, approvalWorkflows, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

// Create insert schemas
export const insertQualityManualSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const insertManualVersionSchema = z.object({
  manualId: z.number().int().positive(),
  versionNumber: z.string().min(1).max(50),
  content: z.string().optional(),
  createdBy: z.number().int().positive(),
  status: z.enum(["Draft", "Under Review", "Approved"]).default("Draft"),
});

export const insertManualSectionSchema = z.object({
  versionId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  order: z.number().int().nonnegative(),
});

export const insertApprovalWorkflowSchema = z.object({
  versionId: z.number().int().positive(),
  approverId: z.number().int().positive(),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  comment: z.string().optional(),
});

// Define types for Zod schemas
export type InsertQualityManual = z.infer<typeof insertQualityManualSchema>;
export type InsertManualVersion = z.infer<typeof insertManualVersionSchema>;
export type InsertManualSection = z.infer<typeof insertManualSectionSchema>;
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;

// Quality Manual storage functions
export async function getQualityManuals() {
  return db.select().from(qualityManuals).orderBy(desc(qualityManuals.updatedAt));
}

export async function getQualityManual(id: number) {
  const manual = await db.select().from(qualityManuals).where(eq(qualityManuals.id, id));
  return manual[0] || null;
}

export async function createQualityManual(data: InsertQualityManual) {
  const result = await db.insert(qualityManuals).values(data).returning();
  return result[0];
}

export async function updateQualityManual(id: number, data: Partial<InsertQualityManual>) {
  const result = await db.update(qualityManuals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(qualityManuals.id, id))
    .returning();
  return result[0];
}

export async function updateQualityManualCurrentVersion(manualId: number, versionId: number) {
  const result = await db.update(qualityManuals)
    .set({ 
      currentVersionId: versionId,
      updatedAt: new Date() 
    })
    .where(eq(qualityManuals.id, manualId))
    .returning();
  return result[0];
}

// Manual Version storage functions
export async function getManualVersions(manualId: number) {
  return db.select({
    ...manualVersions,
    createdByUser: {
      firstName: users.firstName,
      lastName: users.lastName
    },
    approvedByUser: {
      firstName: users.firstName,
      lastName: users.lastName
    }
  })
  .from(manualVersions)
  .leftJoin(users, eq(manualVersions.createdBy, users.id))
  .leftJoin(users, eq(manualVersions.approvedBy, users.id))
  .where(eq(manualVersions.manualId, manualId))
  .orderBy(desc(manualVersions.createdAt));
}

export async function getManualVersion(id: number) {
  const version = await db.select().from(manualVersions).where(eq(manualVersions.id, id));
  return version[0] || null;
}

export async function createManualVersion(data: InsertManualVersion) {
  const result = await db.insert(manualVersions).values(data).returning();
  return result[0];
}

export async function updateManualVersion(id: number, data: Partial<InsertManualVersion>) {
  const result = await db.update(manualVersions)
    .set(data)
    .where(eq(manualVersions.id, id))
    .returning();
  return result[0];
}

export async function approveManualVersion(id: number, approverId: number) {
  const result = await db.update(manualVersions)
    .set({ 
      status: "Approved", 
      approvedBy: approverId,
      approvedAt: new Date()
    })
    .where(eq(manualVersions.id, id))
    .returning();
  return result[0];
}

// Manual Section storage functions
export async function getManualSections(versionId: number) {
  return db.select()
    .from(manualSections)
    .where(eq(manualSections.versionId, versionId))
    .orderBy(manualSections.order);
}

export async function getManualSection(id: number) {
  const section = await db.select().from(manualSections).where(eq(manualSections.id, id));
  return section[0] || null;
}

export async function createManualSection(data: InsertManualSection) {
  const result = await db.insert(manualSections).values(data).returning();
  return result[0];
}

export async function updateManualSection(id: number, data: Partial<InsertManualSection>) {
  const result = await db.update(manualSections)
    .set(data)
    .where(eq(manualSections.id, id))
    .returning();
  return result[0];
}

export async function deleteManualSection(id: number) {
  await db.delete(manualSections).where(eq(manualSections.id, id));
  return { success: true };
}

// Approval Workflow storage functions
export async function getApprovalWorkflows(versionId: number) {
  return db.select({
    ...approvalWorkflows,
    approver: {
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email
    }
  })
  .from(approvalWorkflows)
  .leftJoin(users, eq(approvalWorkflows.approverId, users.id))
  .where(eq(approvalWorkflows.versionId, versionId));
}

export async function getApprovalWorkflow(id: number) {
  const workflow = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, id));
  return workflow[0] || null;
}

export async function createApprovalWorkflow(data: InsertApprovalWorkflow) {
  const result = await db.insert(approvalWorkflows).values(data).returning();
  return result[0];
}

export async function updateApprovalWorkflow(id: number, data: Partial<InsertApprovalWorkflow>) {
  const result = await db.update(approvalWorkflows)
    .set({ 
      ...data,
      actionDate: new Date() 
    })
    .where(eq(approvalWorkflows.id, id))
    .returning();
  return result[0];
}

export async function updateApprovalStatus(id: number, status: "Approved" | "Rejected", comment?: string) {
  const result = await db.update(approvalWorkflows)
    .set({ 
      status, 
      comment,
      actionDate: new Date() 
    })
    .where(eq(approvalWorkflows.id, id))
    .returning();
  return result[0];
}

export async function checkAllApprovals(versionId: number) {
  const approvals = await db.select()
    .from(approvalWorkflows)
    .where(eq(approvalWorkflows.versionId, versionId));
  
  const pending = approvals.some(a => a.status === "Pending");
  const rejected = approvals.some(a => a.status === "Rejected");
  
  return {
    allApproved: !pending && !rejected,
    anyRejected: rejected,
    pendingCount: approvals.filter(a => a.status === "Pending").length,
    totalCount: approvals.length
  };
}