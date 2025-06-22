import express from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { verificationRecords, designProjects, users } from "../shared/schema";
import { authMiddleware } from "./middleware/auth";

const router = express.Router();

// Design Verification Plan Schema
const createVerificationPlanSchema = z.object({
  projectId: z.number(),
  planId: z.string().optional(), // Auto-generated if not provided
  title: z.string().min(1),
  description: z.string().min(1),
  verificationMethod: z.enum(["test", "analysis", "inspection", "demonstration"]),
  testType: z.string().optional(),
  linkedOutputs: z.string().optional(), // JSON array of output IDs
  acceptanceCriteria: z.string().min(1),
  testProtocol: z.string().optional(),
  plannedDate: z.string().optional(),
  assignedTo: z.number().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  riskLevel: z.enum(["high", "medium", "low"]).optional(),
  environmentConditions: z.string().optional(),
  equipment: z.string().optional(),
  personnel: z.string().optional(),
});

// Design Verification Record Schema
const createVerificationRecordSchema = z.object({
  planId: z.number(),
  recordId: z.string().optional(), // Auto-generated if not provided
  executionDate: z.string(),
  executedBy: z.number(),
  result: z.enum(["pass", "fail", "conditional"]),
  actualValues: z.string().optional(),
  deviations: z.string().optional(),
  conclusions: z.string().min(1),
  recommendations: z.string().optional(),
  attachments: z.string().optional(), // JSON array of file paths
  witnessedBy: z.number().optional(),
  capaRequired: z.boolean().default(false),
  capaId: z.number().optional(),
});

// Get all verification plans for a project
router.get("/plans/project/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const plans = await db
      .select({
        id: designVerificationPlans.id,
        planId: designVerificationPlans.planId,
        title: designVerificationPlans.title,
        description: designVerificationPlans.description,
        verificationMethod: designVerificationPlans.verificationMethod,
        testType: designVerificationPlans.testType,
        linkedOutputs: designVerificationPlans.linkedOutputs,
        acceptanceCriteria: designVerificationPlans.acceptanceCriteria,
        testProtocol: designVerificationPlans.testProtocol,
        plannedDate: designVerificationPlans.plannedDate,
        actualDate: designVerificationPlans.actualDate,
        assignedTo: designVerificationPlans.assignedTo,
        priority: designVerificationPlans.priority,
        riskLevel: designVerificationPlans.riskLevel,
        status: designVerificationPlans.status,
        executionProgress: designVerificationPlans.executionProgress,
        createdAt: designVerificationPlans.createdAt,
        updatedAt: designVerificationPlans.updatedAt,
        createdBy: users.firstName,
      })
      .from(designVerificationPlans)
      .leftJoin(users, eq(designVerificationPlans.createdBy, users.id))
      .where(eq(designVerificationPlans.projectId, projectId))
      .orderBy(desc(designVerificationPlans.createdAt));

    res.json(plans);
  } catch (error) {
    console.error("Error fetching verification plans:", error);
    res.status(500).json({ error: "Failed to fetch verification plans" });
  }
});

// Get single verification plan
router.get("/plans/:planId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const planId = req.params.planId;
    
    const plan = await db
      .select()
      .from(designVerificationPlans)
      .where(eq(designVerificationPlans.planId, planId))
      .limit(1);

    if (plan.length === 0) {
      return res.status(404).json({ error: "Verification plan not found" });
    }

    res.json(plan[0]);
  } catch (error) {
    console.error("Error fetching verification plan:", error);
    res.status(500).json({ error: "Failed to fetch verification plan" });
  }
});

// Create new verification plan
router.post("/plans", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const validatedData = createVerificationPlanSchema.parse(req.body);
    const userId = req.user?.id || 9999;

    // Generate unique plan ID if not provided
    let planId = validatedData.planId;
    if (!planId) {
      const project = await db
        .select({ projectCode: designProjects.projectCode })
        .from(designProjects)
        .where(eq(designProjects.id, validatedData.projectId))
        .limit(1);

      if (project.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Count existing plans for this project
      const existingPlans = await db
        .select({ count: designVerificationPlans.id })
        .from(designVerificationPlans)
        .where(eq(designVerificationPlans.projectId, validatedData.projectId));

      const planNumber = String(existingPlans.length + 1).padStart(3, '0');
      planId = `VP-${project[0].projectCode.replace('-', '')}-${planNumber}`;
    }

    const newPlan = await db
      .insert(designVerificationPlans)
      .values({
        ...validatedData,
        planId,
        createdBy: userId,
      })
      .returning();

    res.status(201).json(newPlan[0]);
  } catch (error) {
    console.error("Error creating verification plan:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create verification plan" });
  }
});

// Update verification plan
router.put("/plans/:planId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const planId = req.params.planId;
    const validatedData = createVerificationPlanSchema.partial().parse(req.body);

    const updatedPlan = await db
      .update(designVerificationPlans)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(designVerificationPlans.planId, planId))
      .returning();

    if (updatedPlan.length === 0) {
      return res.status(404).json({ error: "Verification plan not found" });
    }

    res.json(updatedPlan[0]);
  } catch (error) {
    console.error("Error updating verification plan:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update verification plan" });
  }
});

// Get verification records for a plan
router.get("/records/plan/:planId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const planId = parseInt(req.params.planId);
    
    const records = await db
      .select({
        id: designVerificationRecords.id,
        recordId: designVerificationRecords.recordId,
        executionDate: designVerificationRecords.executionDate,
        result: designVerificationRecords.result,
        actualValues: designVerificationRecords.actualValues,
        deviations: designVerificationRecords.deviations,
        conclusions: designVerificationRecords.conclusions,
        recommendations: designVerificationRecords.recommendations,
        attachments: designVerificationRecords.attachments,
        capaRequired: designVerificationRecords.capaRequired,
        capaId: designVerificationRecords.capaId,
        createdAt: designVerificationRecords.createdAt,
        executedBy: users.firstName,
      })
      .from(designVerificationRecords)
      .leftJoin(users, eq(designVerificationRecords.executedBy, users.id))
      .where(eq(designVerificationRecords.planId, planId))
      .orderBy(desc(designVerificationRecords.executionDate));

    res.json(records);
  } catch (error) {
    console.error("Error fetching verification records:", error);
    res.status(500).json({ error: "Failed to fetch verification records" });
  }
});

// Create new verification record
router.post("/records", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const validatedData = createVerificationRecordSchema.parse(req.body);

    // Generate unique record ID if not provided
    let recordId = validatedData.recordId;
    if (!recordId) {
      // Get plan details
      const plan = await db
        .select({ planId: designVerificationPlans.planId })
        .from(designVerificationPlans)
        .where(eq(designVerificationPlans.id, validatedData.planId))
        .limit(1);

      if (plan.length === 0) {
        return res.status(404).json({ error: "Verification plan not found" });
      }

      // Count existing records for this plan
      const existingRecords = await db
        .select({ count: designVerificationRecords.id })
        .from(designVerificationRecords)
        .where(eq(designVerificationRecords.planId, validatedData.planId));

      const recordNumber = String(existingRecords.length + 1).padStart(3, '0');
      recordId = `VR-${plan[0].planId}-${recordNumber}`;
    }

    const newRecord = await db
      .insert(designVerificationRecords)
      .values({
        ...validatedData,
        recordId,
        executionDate: new Date(validatedData.executionDate),
      })
      .returning();

    // Update plan execution progress
    const totalRecords = await db
      .select({ count: designVerificationRecords.id })
      .from(designVerificationRecords)
      .where(eq(designVerificationRecords.planId, validatedData.planId));

    const passedRecords = await db
      .select({ count: designVerificationRecords.id })
      .from(designVerificationRecords)
      .where(and(
        eq(designVerificationRecords.planId, validatedData.planId),
        eq(designVerificationRecords.result, "pass")
      ));

    const progress = Math.round((passedRecords.length / totalRecords.length) * 100);
    const status = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "planned";

    await db
      .update(designVerificationPlans)
      .set({
        executionProgress: progress,
        status,
        actualDate: validatedData.result === "pass" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(designVerificationPlans.id, validatedData.planId));

    res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error("Error creating verification record:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create verification record" });
  }
});

// Update verification plan status
router.patch("/plans/:planId/status", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const planId = req.params.planId;
    const { status, reviewComments, approvalComments } = req.body;
    const userId = req.user?.id || 9999;

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'reviewed') {
      updateData.reviewerId = userId;
      updateData.reviewedAt = new Date();
      updateData.reviewComments = reviewComments;
    }

    if (status === 'approved') {
      updateData.approverId = userId;
      updateData.approvedAt = new Date();
      updateData.approvalComments = approvalComments;
    }

    const updatedPlan = await db
      .update(designVerificationPlans)
      .set(updateData)
      .where(eq(designVerificationPlans.planId, planId))
      .returning();

    if (updatedPlan.length === 0) {
      return res.status(404).json({ error: "Verification plan not found" });
    }

    res.json(updatedPlan[0]);
  } catch (error) {
    console.error("Error updating verification plan status:", error);
    res.status(500).json({ error: "Failed to update verification plan status" });
  }
});

export default router;