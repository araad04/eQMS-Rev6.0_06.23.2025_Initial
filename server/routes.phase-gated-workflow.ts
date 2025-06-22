/**
 * Sequential Phase-Gated Design Control Workflow System
 * ISO 13485:7.3 + 21 CFR 820.30 Compliance
 * Ultra-Professional Software Development Team Implementation
 */

import { Router } from "express";
import { z } from "zod";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { 
  designProjects,
  designPhases,
  designProjectPhaseInstances,
  designPhaseReviews,
  designPhaseAuditTrail,
  users
} from "@shared/schema";

export const phaseGatedWorkflowRouter = Router();

// Phase transition validation schema
const phaseTransitionSchema = z.object({
  projectId: z.number(),
  currentPhaseId: z.number(),
  targetPhaseId: z.number(),
  reviewId: z.number().optional(),
  comments: z.string().optional(),
  overrideReason: z.string().optional(),
});

// Phase review approval schema
const phaseReviewApprovalSchema = z.object({
  reviewId: z.number(),
  outcome: z.enum(['approved', 'approved_with_conditions', 'rejected']),
  conditions: z.string().optional(),
  actionItems: z.array(z.string()).optional(),
  comments: z.string(),
  nextPhaseAllowed: z.boolean(),
});

// Get sequential phase workflow for project
phaseGatedWorkflowRouter.get("/api/phase-gated-workflow/project/:projectId/phases", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    // Get all phase instances for this project with current status
    const phaseInstances = await db
      .select({
        id: designProjectPhaseInstances.id,
        phaseId: designProjectPhaseInstances.phaseId,
        status: designProjectPhaseInstances.status,
        startedAt: designProjectPhaseInstances.startedAt,
        completedAt: designProjectPhaseInstances.completedAt,
        reviewId: designProjectPhaseInstances.reviewId,
        phaseName: designPhases.name,
        phaseDescription: designPhases.description,
        sortOrder: designPhases.sortOrder,
        entryCriteria: designPhases.entryCriteria,
        exitCriteria: designPhases.exitCriteria,
        deliverables: designPhases.deliverables,
      })
      .from(designProjectPhaseInstances)
      .innerJoin(designPhases, eq(designProjectPhaseInstances.phaseId, designPhases.id))
      .where(eq(designProjectPhaseInstances.projectId, projectId))
      .orderBy(asc(designPhases.sortOrder));

    // Calculate phase workflow status
    const phaseWorkflow = phaseInstances.map((phase, index) => {
      const previousPhase = index > 0 ? phaseInstances[index - 1] : null;
      const canStart = !previousPhase || previousPhase.status === 'approved' || previousPhase.status === 'locked';
      const isBlocked = !canStart && phase.status === 'not_started';

      return {
        ...phase,
        canStart,
        isBlocked,
        blockingPhase: isBlocked ? previousPhase?.phaseName : null,
        sequencePosition: index + 1,
        totalPhases: phaseInstances.length,
      };
    });

    res.json({
      projectId,
      phases: phaseWorkflow,
      currentPhase: phaseWorkflow.find(p => p.status === 'active'),
      nextPhase: phaseWorkflow.find(p => p.status === 'not_started' && p.canStart),
      blockedPhases: phaseWorkflow.filter(p => p.isBlocked),
    });

  } catch (error) {
    console.error("Error fetching phase workflow:", error);
    res.status(500).json({ error: "Failed to fetch phase workflow" });
  }
});

// Initialize sequential phases for new project
phaseGatedWorkflowRouter.post("/api/phase-gated-workflow/project/:projectId/initialize", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    // Get template phases in sequential order
    const templatePhases = await db
      .select()
      .from(designPhases)
      .where(eq(designPhases.isTemplate, true))
      .orderBy(asc(designPhases.sortOrder));

    if (templatePhases.length === 0) {
      return res.status(400).json({ error: "No template phases found. System setup required." });
    }

    // Create phase instances for project
    const phaseInstances = [];
    for (let i = 0; i < templatePhases.length; i++) {
      const phase = templatePhases[i];
      const status = i === 0 ? 'active' : 'not_started'; // Only first phase starts active

      const [instance] = await db
        .insert(designProjectPhaseInstances)
        .values({
          projectId,
          phaseId: phase.id,
          status,
          startedAt: i === 0 ? new Date() : null,
          assignedTo: 9999, // Default to development user
          createdBy: 9999,
        })
        .returning();

      phaseInstances.push(instance);

      // Log phase initialization
      await db.insert(designPhaseAuditTrail).values({
        phaseInstanceId: instance.id,
        action: i === 0 ? 'phase_started' : 'phase_initialized',
        fromStatus: null,
        toStatus: status,
        performedBy: 9999,
        reasonCode: 'project_initialization',
        comments: `Phase ${i + 1} of ${templatePhases.length} initialized`,
        timestamp: new Date(),
      });
    }

    res.json({
      message: "Sequential phase workflow initialized successfully",
      phaseInstances,
      totalPhases: templatePhases.length,
      currentPhase: phaseInstances[0],
    });

  } catch (error) {
    console.error("Error initializing phase workflow:", error);
    res.status(500).json({ error: "Failed to initialize phase workflow" });
  }
});

// Request phase transition (with bottleneck validation)
phaseGatedWorkflowRouter.post("/api/phase-gated-workflow/request-transition", async (req, res) => {
  try {
    const transition = phaseTransitionSchema.parse(req.body);

    // Validate current phase completion
    const currentPhaseInstance = await db
      .select()
      .from(designProjectPhaseInstances)
      .where(
        and(
          eq(designProjectPhaseInstances.projectId, transition.projectId),
          eq(designProjectPhaseInstances.id, transition.currentPhaseId)
        )
      );

    if (!currentPhaseInstance[0]) {
      return res.status(404).json({ error: "Current phase instance not found" });
    }

    const currentPhase = currentPhaseInstance[0];

    // Enforce sequential bottleneck: Current phase must be completed and reviewed
    if (currentPhase.status !== 'under_review' && currentPhase.status !== 'approved') {
      return res.status(400).json({ 
        error: "Phase transition denied. Current phase must complete review process first.",
        currentStatus: currentPhase.status,
        requiredStatus: "under_review or approved"
      });
    }

    // Check if there's an approved review for current phase
    if (currentPhase.reviewId) {
      const review = await db
        .select()
        .from(designPhaseReviews)
        .where(eq(designPhaseReviews.id, currentPhase.reviewId));

      if (!review[0] || review[0].outcome !== 'approved') {
        return res.status(400).json({ 
          error: "Phase transition denied. Current phase review must be approved first.",
          reviewStatus: review[0]?.outcome || 'not_found'
        });
      }
    }

    // Validate target phase sequence
    const targetPhaseInstance = await db
      .select()
      .from(designProjectPhaseInstances)
      .innerJoin(designPhases, eq(designProjectPhaseInstances.phaseId, designPhases.id))
      .where(
        and(
          eq(designProjectPhaseInstances.projectId, transition.projectId),
          eq(designProjectPhaseInstances.id, transition.targetPhaseId)
        )
      );

    if (!targetPhaseInstance[0]) {
      return res.status(404).json({ error: "Target phase instance not found" });
    }

    const targetPhase = targetPhaseInstance[0];

    // Enforce sequential flow: Can only transition to next phase
    const currentPhaseInfo = await db
      .select()
      .from(designPhases)
      .where(eq(designPhases.id, currentPhase.phaseId));

    if (targetPhase.design_phases.sortOrder !== currentPhaseInfo[0].sortOrder + 1) {
      return res.status(400).json({ 
        error: "Invalid phase transition. Must follow sequential order.",
        currentPhaseOrder: currentPhaseInfo[0].sortOrder,
        targetPhaseOrder: targetPhase.design_phases.sortOrder,
        expectedNextOrder: currentPhaseInfo[0].sortOrder + 1
      });
    }

    // Lock current phase and activate next phase
    await db
      .update(designProjectPhaseInstances)
      .set({ 
        status: 'locked',
        completedAt: new Date(),
      })
      .where(eq(designProjectPhaseInstances.id, transition.currentPhaseId));

    await db
      .update(designProjectPhaseInstances)
      .set({ 
        status: 'active',
        startedAt: new Date(),
      })
      .where(eq(designProjectPhaseInstances.id, transition.targetPhaseId));

    // Log phase transitions
    await db.insert(designPhaseAuditTrail).values([
      {
        phaseInstanceId: transition.currentPhaseId,
        action: 'phase_locked',
        fromStatus: currentPhase.status,
        toStatus: 'locked',
        performedBy: 9999,
        reasonCode: 'sequential_transition',
        comments: transition.comments || 'Phase completed and locked for next phase activation',
        timestamp: new Date(),
      },
      {
        phaseInstanceId: transition.targetPhaseId,
        action: 'phase_started',
        fromStatus: 'not_started',
        toStatus: 'active',
        performedBy: 9999,
        reasonCode: 'sequential_transition',
        comments: transition.comments || 'Phase activated following sequential workflow',
        timestamp: new Date(),
      }
    ]);

    res.json({
      message: "Phase transition completed successfully",
      lockedPhase: transition.currentPhaseId,
      activatedPhase: transition.targetPhaseId,
      workflow: "sequential_gated",
    });

  } catch (error) {
    console.error("Error processing phase transition:", error);
    res.status(500).json({ error: "Failed to process phase transition" });
  }
});

// Submit phase for review (bottleneck trigger)
phaseGatedWorkflowRouter.post("/api/phase-gated-workflow/submit-for-review", async (req, res) => {
  try {
    const { phaseInstanceId, reviewTitle, reviewScope, reviewers } = req.body;

    // Validate phase instance
    const phaseInstance = await db
      .select()
      .from(designProjectPhaseInstances)
      .innerJoin(designPhases, eq(designProjectPhaseInstances.phaseId, designPhases.id))
      .where(eq(designProjectPhaseInstances.id, phaseInstanceId));

    if (!phaseInstance[0]) {
      return res.status(404).json({ error: "Phase instance not found" });
    }

    const phase = phaseInstance[0];

    // Validate phase can be submitted for review
    if (phase.design_project_phase_instances.status !== 'active') {
      return res.status(400).json({ 
        error: "Phase must be active to submit for review",
        currentStatus: phase.design_project_phase_instances.status
      });
    }

    // Create phase review
    const [review] = await db
      .insert(designPhaseReviews)
      .values({
        phaseInstanceId,
        reviewTitle: reviewTitle || `${phase.design_phases.name} Phase Gate Review`,
        reviewScope: reviewScope || `Review of ${phase.design_phases.name} phase deliverables and exit criteria`,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for tomorrow
        chairperson: 9999,
        reviewers: reviewers || [9999],
        status: 'scheduled',
        createdBy: 9999,
      })
      .returning();

    // Update phase instance to under review
    await db
      .update(designProjectPhaseInstances)
      .set({ 
        status: 'under_review',
        reviewId: review.id,
      })
      .where(eq(designProjectPhaseInstances.id, phaseInstanceId));

    // Log review submission
    await db.insert(designPhaseAuditTrail).values({
      phaseInstanceId,
      action: 'review_requested',
      fromStatus: 'active',
      toStatus: 'under_review',
      performedBy: 9999,
      reasonCode: 'phase_completion',
      comments: `Phase submitted for gate review: ${review.reviewTitle}`,
      timestamp: new Date(),
    });

    res.json({
      message: "Phase submitted for review successfully",
      review,
      phaseStatus: "under_review",
      bottleneckActive: true,
    });

  } catch (error) {
    console.error("Error submitting phase for review:", error);
    res.status(500).json({ error: "Failed to submit phase for review" });
  }
});

// Approve/Reject phase review (bottleneck resolution)
phaseGatedWorkflowRouter.post("/api/phase-gated-workflow/complete-review", async (req, res) => {
  try {
    const approval = phaseReviewApprovalSchema.parse(req.body);

    // Update review outcome
    await db
      .update(designPhaseReviews)
      .set({
        outcome: approval.outcome,
        conditions: approval.conditions,
        actionItems: approval.actionItems,
        reviewNotes: approval.comments,
        completedDate: new Date(),
        status: 'completed',
      })
      .where(eq(designPhaseReviews.id, approval.reviewId));

    // Get phase instance for this review
    const phaseInstance = await db
      .select()
      .from(designProjectPhaseInstances)
      .where(eq(designProjectPhaseInstances.reviewId, approval.reviewId));

    if (!phaseInstance[0]) {
      return res.status(404).json({ error: "Phase instance not found for this review" });
    }

    const newStatus = approval.outcome === 'approved' ? 'approved' : 
                     approval.outcome === 'approved_with_conditions' ? 'approved' : 'active';

    // Update phase status based on review outcome
    await db
      .update(designProjectPhaseInstances)
      .set({ status: newStatus })
      .where(eq(designProjectPhaseInstances.id, phaseInstance[0].id));

    // Log review completion
    await db.insert(designPhaseAuditTrail).values({
      phaseInstanceId: phaseInstance[0].id,
      action: 'review_completed',
      fromStatus: 'under_review',
      toStatus: newStatus,
      performedBy: 9999,
      reasonCode: `review_${approval.outcome}`,
      comments: `Review ${approval.outcome}: ${approval.comments}`,
      timestamp: new Date(),
    });

    const response = {
      message: `Phase review ${approval.outcome} successfully`,
      reviewOutcome: approval.outcome,
      phaseStatus: newStatus,
      bottleneckResolved: approval.outcome === 'approved',
      nextPhaseAllowed: approval.nextPhaseAllowed && approval.outcome === 'approved',
    };

    if (approval.outcome === 'rejected') {
      response.message += ". Phase returned to active status for rework.";
    } else if (approval.outcome === 'approved_with_conditions') {
      response.message += ". Phase approved with conditions - see action items.";
    }

    res.json(response);

  } catch (error) {
    console.error("Error completing phase review:", error);
    res.status(500).json({ error: "Failed to complete phase review" });
  }
});

// Get phase bottleneck status
phaseGatedWorkflowRouter.get("/api/phase-gated-workflow/project/:projectId/bottlenecks", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    // Find phases under review (active bottlenecks)
    const bottlenecks = await db
      .select({
        phaseInstanceId: designProjectPhaseInstances.id,
        phaseName: designPhases.name,
        status: designProjectPhaseInstances.status,
        reviewId: designProjectPhaseInstances.reviewId,
        reviewTitle: designPhaseReviews.reviewTitle,
        scheduledDate: designPhaseReviews.scheduledDate,
        reviewStatus: designPhaseReviews.status,
        daysSinceSubmitted: db.$count(), // Will calculate in application
      })
      .from(designProjectPhaseInstances)
      .innerJoin(designPhases, eq(designProjectPhaseInstances.phaseId, designPhases.id))
      .leftJoin(designPhaseReviews, eq(designProjectPhaseInstances.reviewId, designPhaseReviews.id))
      .where(
        and(
          eq(designProjectPhaseInstances.projectId, projectId),
          eq(designProjectPhaseInstances.status, 'under_review')
        )
      );

    // Get blocked phases (waiting for bottleneck resolution)
    const blockedPhases = await db
      .select({
        phaseInstanceId: designProjectPhaseInstances.id,
        phaseName: designPhases.name,
        sortOrder: designPhases.sortOrder,
        status: designProjectPhaseInstances.status,
      })
      .from(designProjectPhaseInstances)
      .innerJoin(designPhases, eq(designProjectPhaseInstances.phaseId, designPhases.id))
      .where(
        and(
          eq(designProjectPhaseInstances.projectId, projectId),
          eq(designProjectPhaseInstances.status, 'not_started')
        )
      )
      .orderBy(asc(designPhases.sortOrder));

    res.json({
      projectId,
      activeBottlenecks: bottlenecks.length,
      bottleneckPhases: bottlenecks,
      blockedPhases: blockedPhases,
      workflowBlocked: bottlenecks.length > 0,
    });

  } catch (error) {
    console.error("Error fetching bottleneck status:", error);
    res.status(500).json({ error: "Failed to fetch bottleneck status" });
  }
});

// Override phase transition (emergency use only)
phaseGatedWorkflowRouter.post("/api/phase-gated-workflow/emergency-override", async (req, res) => {
  try {
    const { phaseInstanceId, targetStatus, overrideReason, approvedBy } = req.body;

    if (!overrideReason || overrideReason.length < 10) {
      return res.status(400).json({ error: "Override reason must be at least 10 characters" });
    }

    // Get current phase instance
    const phaseInstance = await db
      .select()
      .from(designProjectPhaseInstances)
      .where(eq(designProjectPhaseInstances.id, phaseInstanceId));

    if (!phaseInstance[0]) {
      return res.status(404).json({ error: "Phase instance not found" });
    }

    const currentStatus = phaseInstance[0].status;

    // Update phase status with override
    await db
      .update(designProjectPhaseInstances)
      .set({ status: targetStatus })
      .where(eq(designProjectPhaseInstances.id, phaseInstanceId));

    // Log emergency override
    await db.insert(designPhaseAuditTrail).values({
      phaseInstanceId,
      action: 'emergency_override',
      fromStatus: currentStatus,
      toStatus: targetStatus,
      performedBy: approvedBy || 9999,
      reasonCode: 'emergency_override',
      comments: `EMERGENCY OVERRIDE: ${overrideReason}`,
      timestamp: new Date(),
    });

    res.json({
      message: "Emergency override applied successfully",
      warning: "This action bypasses normal phase-gated controls and should only be used in exceptional circumstances",
      phaseInstanceId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      overrideReason,
    });

  } catch (error) {
    console.error("Error applying emergency override:", error);
    res.status(500).json({ error: "Failed to apply emergency override" });
  }
});