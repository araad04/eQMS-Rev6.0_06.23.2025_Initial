import express from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { validationRecords, designProjects, users } from "../shared/schema";
import { authMiddleware } from "./middleware/auth";

const router = express.Router();

// Design Validation Plan Schema
const createValidationPlanSchema = z.object({
  projectId: z.number(),
  planId: z.string().optional(), // Auto-generated if not provided
  title: z.string().min(1),
  description: z.string().min(1),
  validationMethod: z.enum(["clinical_evaluation", "usability_testing", "user_feedback", "field_testing", "simulation"]),
  userGroup: z.string().min(1),
  environment: z.string().min(1),
  linkedOutputs: z.string().optional(), // JSON array of output IDs
  successCriteria: z.string().min(1),
  validationProtocol: z.string().optional(),
  plannedDate: z.string().optional(),
  assignedTo: z.number().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  riskLevel: z.enum(["high", "medium", "low"]).optional(),
  participants: z.string().optional(), // JSON array of participant details
  ethicalApproval: z.boolean().default(false),
  regulatoryRequirement: z.string().optional(),
});

// Design Validation Record Schema
const createValidationRecordSchema = z.object({
  planId: z.number(),
  recordId: z.string().optional(), // Auto-generated if not provided
  executionDate: z.string(),
  executedBy: z.number(),
  result: z.enum(["pass", "fail", "conditional"]),
  userFeedback: z.string().optional(),
  performanceData: z.string().optional(),
  deviations: z.string().optional(),
  conclusions: z.string().min(1),
  recommendations: z.string().optional(),
  attachments: z.string().optional(), // JSON array of file paths
  witnessedBy: z.number().optional(),
  capaRequired: z.boolean().default(false),
  capaId: z.number().optional(),
});

// Get all validation plans for a project
router.get("/plans/project/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const plans = await db
      .select({
        id: validationRecords.id,
        planId: validationRecords.validationId,
        title: validationRecords.title,
        description: validationRecords.description,
        validationMethod: validationRecords.method,
        userGroup: validationRecords.userGroup,
        environment: validationRecords.environment,
        linkedOutputs: validationRecords.linkedOutputs,
        successCriteria: validationRecords.successCriteria,
        validationProtocol: validationRecords.validationProtocol,
        plannedDate: validationRecords.plannedDate,
        actualDate: validationRecords.actualDate,
        assignedTo: validationRecords.assignedTo,
        priority: validationRecords.priority,
        riskLevel: validationRecords.riskLevel,
        status: validationRecords.status,
        executionProgress: validationRecords.executionProgress,
        ethicalApproval: validationRecords.ethicalApproval,
        regulatoryRequirement: validationRecords.regulatoryRequirement,
        createdAt: validationRecords.createdAt,
        updatedAt: validationRecords.updatedAt,
        createdBy: users.firstName,
      })
      .from(validationRecords)
      .leftJoin(users, eq(validationRecords.createdBy, users.id))
      .where(eq(validationRecords.projectId, projectId))
      .orderBy(desc(validationRecords.createdAt));

    res.json(plans);
  } catch (error) {
    console.error("Error fetching validation plans:", error);
    res.status(500).json({ error: "Failed to fetch validation plans" });
  }
});

// Get single validation plan
router.get("/plans/:planId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const planId = req.params.planId;
    
    const plan = await db
      .select()
      .from(designValidationPlans)
      .where(eq(designValidationPlans.planId, planId))
      .limit(1);

    if (plan.length === 0) {
      return res.status(404).json({ error: "Validation plan not found" });
    }

    res.json(plan[0]);
  } catch (error) {
    console.error("Error fetching validation plan:", error);
    res.status(500).json({ error: "Failed to fetch validation plan" });
  }
});

// Create new validation plan
router.post("/plans", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const validatedData = createValidationPlanSchema.parse(req.body);
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
        .select({ count: designValidationPlans.id })
        .from(designValidationPlans)
        .where(eq(designValidationPlans.projectId, validatedData.projectId));

      const planNumber = String(existingPlans.length + 1).padStart(3, '0');
      planId = `VAL-${project[0].projectCode.replace('-', '')}-${planNumber}`;
    }

    const newPlan = await db
      .insert(designValidationPlans)
      .values({
        ...validatedData,
        planId,
        createdBy: userId,
      })
      .returning();

    res.status(201).json(newPlan[0]);
  } catch (error) {
    console.error("Error creating validation plan:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create validation plan" });
  }
});

// Update validation plan
router.put("/plans/:planId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const planId = req.params.planId;
    const validatedData = createValidationPlanSchema.partial().parse(req.body);

    const updatedPlan = await db
      .update(designValidationPlans)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(designValidationPlans.planId, planId))
      .returning();

    if (updatedPlan.length === 0) {
      return res.status(404).json({ error: "Validation plan not found" });
    }

    res.json(updatedPlan[0]);
  } catch (error) {
    console.error("Error updating validation plan:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update validation plan" });
  }
});

// Get validation records for a plan
router.get("/records/plan/:planId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const planId = parseInt(req.params.planId);
    
    const records = await db
      .select({
        id: designValidationRecords.id,
        recordId: designValidationRecords.recordId,
        executionDate: designValidationRecords.executionDate,
        result: designValidationRecords.result,
        userFeedback: designValidationRecords.userFeedback,
        performanceData: designValidationRecords.performanceData,
        deviations: designValidationRecords.deviations,
        conclusions: designValidationRecords.conclusions,
        recommendations: designValidationRecords.recommendations,
        attachments: designValidationRecords.attachments,
        capaRequired: designValidationRecords.capaRequired,
        capaId: designValidationRecords.capaId,
        createdAt: designValidationRecords.createdAt,
        executedBy: users.firstName,
      })
      .from(designValidationRecords)
      .leftJoin(users, eq(designValidationRecords.executedBy, users.id))
      .where(eq(designValidationRecords.planId, planId))
      .orderBy(desc(designValidationRecords.executionDate));

    res.json(records);
  } catch (error) {
    console.error("Error fetching validation records:", error);
    res.status(500).json({ error: "Failed to fetch validation records" });
  }
});

// Create new validation record
router.post("/records", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const validatedData = createValidationRecordSchema.parse(req.body);

    // Generate unique record ID if not provided
    let recordId = validatedData.recordId;
    if (!recordId) {
      // Get plan details
      const plan = await db
        .select({ planId: designValidationPlans.planId })
        .from(designValidationPlans)
        .where(eq(designValidationPlans.id, validatedData.planId))
        .limit(1);

      if (plan.length === 0) {
        return res.status(404).json({ error: "Validation plan not found" });
      }

      // Count existing records for this plan
      const existingRecords = await db
        .select({ count: designValidationRecords.id })
        .from(designValidationRecords)
        .where(eq(designValidationRecords.planId, validatedData.planId));

      const recordNumber = String(existingRecords.length + 1).padStart(3, '0');
      recordId = `VLR-${plan[0].planId}-${recordNumber}`;
    }

    const newRecord = await db
      .insert(designValidationRecords)
      .values({
        ...validatedData,
        recordId,
        executionDate: new Date(validatedData.executionDate),
      })
      .returning();

    // Update plan execution progress
    const totalRecords = await db
      .select({ count: designValidationRecords.id })
      .from(designValidationRecords)
      .where(eq(designValidationRecords.planId, validatedData.planId));

    const passedRecords = await db
      .select({ count: designValidationRecords.id })
      .from(designValidationRecords)
      .where(and(
        eq(designValidationRecords.planId, validatedData.planId),
        eq(designValidationRecords.result, "pass")
      ));

    const progress = Math.round((passedRecords.length / totalRecords.length) * 100);
    const status = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "planned";

    await db
      .update(designValidationPlans)
      .set({
        executionProgress: progress,
        status,
        actualDate: validatedData.result === "pass" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(designValidationPlans.id, validatedData.planId));

    res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error("Error creating validation record:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create validation record" });
  }
});

// Update validation plan status
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
      .update(designValidationPlans)
      .set(updateData)
      .where(eq(designValidationPlans.planId, planId))
      .returning();

    if (updatedPlan.length === 0) {
      return res.status(404).json({ error: "Validation plan not found" });
    }

    res.json(updatedPlan[0]);
  } catch (error) {
    console.error("Error updating validation plan status:", error);
    res.status(500).json({ error: "Failed to update validation plan status" });
  }
});

export default router;