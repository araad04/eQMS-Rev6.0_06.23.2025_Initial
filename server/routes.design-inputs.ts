import express from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { designInputs, designInputTypes, designProjects, users } from "../shared/schema";
import { authMiddleware } from "./middleware/auth";

const router = express.Router();

// Design Input Schema
const createDesignInputSchema = z.object({
  projectId: z.number(),
  title: z.string().min(1),
  description: z.string().min(1),
  inputTypeId: z.number().default(1),
  source: z.string().min(1),
  functionalRequirement: z.boolean().default(false),
  performanceRequirement: z.boolean().default(false),
  safetyRequirement: z.boolean().default(false),
  usabilityRequirement: z.boolean().default(false),
  regulatoryRequirement: z.boolean().default(false),
  acceptanceCriteria: z.string().min(1),
  verificationMethod: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  riskLevel: z.enum(["high", "medium", "low"]).optional(),
});

// Get all design inputs for a project
router.get("/project/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const inputs = await db
      .select({
        id: designInputs.id,
        inputId: designInputs.inputId,
        title: designInputs.title,
        description: designInputs.description,
        source: designInputs.source,
        functionalRequirement: designInputs.functionalRequirement,
        performanceRequirement: designInputs.performanceRequirement,
        safetyRequirement: designInputs.safetyRequirement,
        usabilityRequirement: designInputs.usabilityRequirement,
        regulatoryRequirement: designInputs.regulatoryRequirement,
        acceptanceCriteria: designInputs.acceptanceCriteria,
        verificationMethod: designInputs.verificationMethod,
        priority: designInputs.priority,
        riskLevel: designInputs.riskLevel,
        status: designInputs.status,
        createdAt: designInputs.createdAt,
        updatedAt: designInputs.updatedAt,
        createdBy: users.firstName,
        reviewedAt: designInputs.reviewedAt,
        approvedAt: designInputs.approvedAt,
      })
      .from(designInputs)
      .leftJoin(users, eq(designInputs.createdBy, users.id))
      .where(eq(designInputs.projectId, projectId))
      .orderBy(desc(designInputs.createdAt));

    res.json(inputs);
  } catch (error) {
    console.error("Error fetching design inputs:", error);
    res.status(500).json({ error: "Failed to fetch design inputs" });
  }
});

// Get single design input
router.get("/:inputId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const inputId = req.params.inputId;
    
    const input = await db
      .select()
      .from(designInputs)
      .where(eq(designInputs.inputId, inputId))
      .limit(1);

    if (input.length === 0) {
      return res.status(404).json({ error: "Design input not found" });
    }

    res.json(input[0]);
  } catch (error) {
    console.error("Error fetching design input:", error);
    res.status(500).json({ error: "Failed to fetch design input" });
  }
});

// Create new design input
router.post("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const validatedData = createDesignInputSchema.parse(req.body);
    const userId = req.user?.id || 9999;

    // Generate unique input ID
    const project = await db
      .select({ projectCode: designProjects.projectCode })
      .from(designProjects)
      .where(eq(designProjects.id, validatedData.projectId))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Count existing inputs for this project
    const existingInputs = await db
      .select({ count: designInputs.id })
      .from(designInputs)
      .where(eq(designInputs.projectId, validatedData.projectId));

    const inputNumber = String(existingInputs.length + 1).padStart(3, '0');
    const inputId = `DI-${project[0].projectCode.replace('-', '')}-${inputNumber}`;

    const newInput = await db
      .insert(designInputs)
      .values({
        ...validatedData,
        inputId,
        createdBy: userId,
      })
      .returning();

    res.status(201).json(newInput[0]);
  } catch (error) {
    console.error("Error creating design input:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create design input" });
  }
});

// Update design input
router.put("/:inputId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const inputId = req.params.inputId;
    const validatedData = createDesignInputSchema.partial().parse(req.body);

    const updatedInput = await db
      .update(designInputs)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(designInputs.inputId, inputId))
      .returning();

    if (updatedInput.length === 0) {
      return res.status(404).json({ error: "Design input not found" });
    }

    res.json(updatedInput[0]);
  } catch (error) {
    console.error("Error updating design input:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update design input" });
  }
});

// Delete design input
router.delete("/:inputId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const inputId = req.params.inputId;

    const deletedInput = await db
      .delete(designInputs)
      .where(eq(designInputs.inputId, inputId))
      .returning();

    if (deletedInput.length === 0) {
      return res.status(404).json({ error: "Design input not found" });
    }

    res.json({ message: "Design input deleted successfully" });
  } catch (error) {
    console.error("Error deleting design input:", error);
    res.status(500).json({ error: "Failed to delete design input" });
  }
});

// Update design input status
router.patch("/:inputId/status", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const inputId = req.params.inputId;
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

    const updatedInput = await db
      .update(designInputs)
      .set(updateData)
      .where(eq(designInputs.inputId, inputId))
      .returning();

    if (updatedInput.length === 0) {
      return res.status(404).json({ error: "Design input not found" });
    }

    res.json(updatedInput[0]);
  } catch (error) {
    console.error("Error updating design input status:", error);
    res.status(500).json({ error: "Failed to update design input status" });
  }
});

// Get design input types
router.get("/types/all", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const types = await db
      .select()
      .from(designInputTypes)
      .orderBy(designInputTypes.name);

    res.json(types);
  } catch (error) {
    console.error("Error fetching design input types:", error);
    res.status(500).json({ error: "Failed to fetch design input types" });
  }
});

export default router;