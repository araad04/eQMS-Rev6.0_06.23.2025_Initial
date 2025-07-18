import express from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { traceabilityDesignOutputs, designProjects, users, designOutputTypes } from "../shared/schema";
import { authMiddleware } from "./middleware/auth";

const router = express.Router();

// Design Output Schema
const createDesignOutputSchema = z.object({
  projectId: z.number(),
  title: z.string().min(1),
  description: z.string().min(1),
  outputTypeId: z.number().default(1),
  documentType: z.string().min(1),
  documentReference: z.string().optional(),
  revision: z.string().default("1.0"),
  traceabilityToInputs: z.string().optional(),
  verificationRequired: z.boolean().default(true),
  validationRequired: z.boolean().default(false),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  riskLevel: z.enum(["high", "medium", "low"]).optional(),
});

// Get all design outputs for a project
router.get("/project/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const outputs = await db
      .select({
        id: traceabilityDesignOutputs.id,
        outputId: traceabilityDesignOutputs.outputId,
        title: traceabilityDesignOutputs.title,
        description: traceabilityDesignOutputs.description,
        documentType: traceabilityDesignOutputs.documentType,
        documentReference: traceabilityDesignOutputs.documentReference,
        revision: traceabilityDesignOutputs.revision,
        traceabilityToInputs: traceabilityDesignOutputs.traceabilityToInputs,
        verificationRequired: traceabilityDesignOutputs.verificationRequired,
        validationRequired: traceabilityDesignOutputs.validationRequired,
        priority: traceabilityDesignOutputs.priority,
        riskLevel: traceabilityDesignOutputs.riskLevel,
        status: traceabilityDesignOutputs.status,
        verificationStatus: traceabilityDesignOutputs.verificationStatus,
        validationStatus: traceabilityDesignOutputs.validationStatus,
        createdAt: traceabilityDesignOutputs.createdAt,
        updatedAt: traceabilityDesignOutputs.updatedAt,
        createdBy: users.firstName,
        reviewedAt: traceabilityDesignOutputs.reviewedAt,
        approvedAt: traceabilityDesignOutputs.approvedAt,
      })
      .from(traceabilityDesignOutputs)
      .leftJoin(users, eq(traceabilityDesignOutputs.createdBy, users.id))
      .where(eq(traceabilityDesignOutputs.projectId, projectId))
      .orderBy(desc(traceabilityDesignOutputs.createdAt));

    res.json(outputs);
  } catch (error) {
    console.error("Error fetching design outputs:", error);
    res.status(500).json({ error: "Failed to fetch design outputs" });
  }
});

// Get single design output
router.get("/:outputId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const outputId = req.params.outputId;
    
    const output = await db
      .select()
      .from(traceabilityDesignOutputs)
      .where(eq(traceabilityDesignOutputs.outputId, outputId))
      .limit(1);

    if (output.length === 0) {
      return res.status(404).json({ error: "Design output not found" });
    }

    res.json(output[0]);
  } catch (error) {
    console.error("Error fetching design output:", error);
    res.status(500).json({ error: "Failed to fetch design output" });
  }
});

// Create new design output
router.post("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const validatedData = createDesignOutputSchema.parse(req.body);
    const userId = req.user?.id || 9999;

    // Generate unique output ID
    const project = await db
      .select({ projectCode: designProjects.projectCode })
      .from(designProjects)
      .where(eq(designProjects.id, validatedData.projectId))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Count existing outputs for this project
    const existingOutputs = await db
      .select({ count: traceabilityDesignOutputs.id })
      .from(traceabilityDesignOutputs)
      .where(eq(traceabilityDesignOutputs.projectId, validatedData.projectId));

    const outputNumber = String(existingOutputs.length + 1).padStart(3, '0');
    const outputId = `DO-${project[0].projectCode.replace('-', '')}-${outputNumber}`;

    const newOutput = await db
      .insert(traceabilityDesignOutputs)
      .values({
        ...validatedData,
        outputId,
        createdBy: userId,
      })
      .returning();

    res.status(201).json(newOutput[0]);
  } catch (error) {
    console.error("Error creating design output:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create design output" });
  }
});

// Update design output
router.put("/:outputId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const outputId = req.params.outputId;
    const validatedData = createDesignOutputSchema.partial().parse(req.body);

    const updatedOutput = await db
      .update(traceabilityDesignOutputs)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(traceabilityDesignOutputs.outputId, outputId))
      .returning();

    if (updatedOutput.length === 0) {
      return res.status(404).json({ error: "Design output not found" });
    }

    res.json(updatedOutput[0]);
  } catch (error) {
    console.error("Error updating design output:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update design output" });
  }
});

// Delete design output
router.delete("/:outputId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const outputId = req.params.outputId;

    const deletedOutput = await db
      .delete(traceabilityDesignOutputs)
      .where(eq(traceabilityDesignOutputs.outputId, outputId))
      .returning();

    if (deletedOutput.length === 0) {
      return res.status(404).json({ error: "Design output not found" });
    }

    res.json({ message: "Design output deleted successfully" });
  } catch (error) {
    console.error("Error deleting design output:", error);
    res.status(500).json({ error: "Failed to delete design output" });
  }
});

// Update design output status
router.patch("/:outputId/status", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const outputId = req.params.outputId;
    const { status, verificationStatus, validationStatus, reviewComments, approvalComments } = req.body;
    const userId = req.user?.id || 9999;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (verificationStatus) updateData.verificationStatus = verificationStatus;
    if (validationStatus) updateData.validationStatus = validationStatus;

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

    const updatedOutput = await db
      .update(traceabilityDesignOutputs)
      .set(updateData)
      .where(eq(traceabilityDesignOutputs.outputId, outputId))
      .returning();

    if (updatedOutput.length === 0) {
      return res.status(404).json({ error: "Design output not found" });
    }

    res.json(updatedOutput[0]);
  } catch (error) {
    console.error("Error updating design output status:", error);
    res.status(500).json({ error: "Failed to update design output status" });
  }
});

// Get design output types
router.get("/types/all", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const types = await db
      .select()
      .from(designOutputTypes)
      .orderBy(designOutputTypes.name);

    res.json(types);
  } catch (error) {
    console.error("Error fetching design output types:", error);
    res.status(500).json({ error: "Failed to fetch design output types" });
  }
});

export default router;