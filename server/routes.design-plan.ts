/**
 * Design Plan Phase-Gated Control System API Routes
 * DCM-001 Implementation - ISO 13485:7.3 + 21 CFR 820.30 Compliance
 */

import { Router } from "express";
import { z } from "zod";
import { 
  insertDesignPhaseSchema,
  insertDesignProjectPhaseInstanceSchema,
  insertDesignPhaseReviewSchema,
  insertDesignTraceabilityLinkSchema,
  insertDesignPlanSchema,
  insertDesignPhaseAuditTrailSchema 
} from "@shared/schema";
import { storage } from "./storage";

const router = Router();

// ========================================
// DESIGN PHASES MANAGEMENT
// ========================================

// Get all design phases (templates)
router.get("/phases", async (req, res) => {
  try {
    const phases = await storage.getDesignPhases();
    res.json(phases);
  } catch (error) {
    console.error("Error fetching design phases:", error);
    res.status(500).json({ error: "Failed to fetch design phases" });
  }
});

// Create new design phase template
router.post("/phases", async (req, res) => {
  try {
    const data = insertDesignPhaseSchema.parse(req.body);
    const phase = await storage.createDesignPhase(data);
    res.status(201).json(phase);
  } catch (error) {
    console.error("Error creating design phase:", error);
    res.status(400).json({ error: "Failed to create design phase" });
  }
});

// Update design phase
router.put("/phases/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertDesignPhaseSchema.partial().parse(req.body);
    const phase = await storage.updateDesignPhase(id, data);
    
    if (!phase) {
      return res.status(404).json({ error: "Design phase not found" });
    }
    
    res.json(phase);
  } catch (error) {
    console.error("Error updating design phase:", error);
    res.status(400).json({ error: "Failed to update design phase" });
  }
});

// ========================================
// PROJECT PHASE INSTANCES
// ========================================

// Get project phase instances for a project
router.get("/projects/:projectId/phase-instances", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const instances = await storage.getDesignProjectPhaseInstances(projectId);
    res.json(instances);
  } catch (error) {
    console.error("Error fetching project phase instances:", error);
    res.status(500).json({ error: "Failed to fetch project phase instances" });
  }
});

// Create project phase instance
router.post("/projects/:projectId/phase-instances", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const data = insertDesignProjectPhaseInstanceSchema.parse({
      ...req.body,
      projectId
    });
    
    const instance = await storage.createDesignProjectPhaseInstance(data);
    res.status(201).json(instance);
  } catch (error) {
    console.error("Error creating project phase instance:", error);
    res.status(400).json({ error: "Failed to create project phase instance" });
  }
});

// Activate a specific phase
router.post("/phase-instances/:id/activate", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id || 9999; // Development user fallback
    
    const instance = await storage.activatePhase(id, userId);
    
    if (!instance) {
      return res.status(404).json({ error: "Phase instance not found" });
    }
    
    res.json(instance);
  } catch (error) {
    console.error("Error activating phase:", error);
    res.status(400).json({ error: "Failed to activate phase" });
  }
});

// Transition phase status
router.post("/phase-instances/:id/transition", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id || 9999;
    const { newStatus, reasonCode, comments } = req.body;
    
    const instance = await storage.transitionPhase(id, newStatus, userId, reasonCode, comments);
    
    if (!instance) {
      return res.status(404).json({ error: "Phase instance not found" });
    }
    
    res.json(instance);
  } catch (error) {
    console.error("Error transitioning phase:", error);
    res.status(400).json({ error: "Failed to transition phase" });
  }
});

// ========================================
// PHASE REVIEWS & ELECTRONIC SIGNATURES
// ========================================

// Get phase reviews for a project
router.get("/projects/:projectId/reviews", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const reviews = await storage.getDesignPhaseReviews(projectId);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching phase reviews:", error);
    res.status(500).json({ error: "Failed to fetch phase reviews" });
  }
});

// Create phase review
router.post("/projects/:projectId/reviews", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id || 9999;
    
    const data = insertDesignPhaseReviewSchema.parse({
      ...req.body,
      projectId,
      createdBy: userId
    });
    
    const review = await storage.createDesignPhaseReview(data);
    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating phase review:", error);
    res.status(400).json({ error: "Failed to create phase review" });
  }
});

// Approve/reject phase review with electronic signature
router.post("/reviews/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id || 9999;
    const { outcome, comments, actionItems } = req.body;
    
    const review = await storage.approvePhaseReview(id, userId, outcome, comments, actionItems);
    
    if (!review) {
      return res.status(404).json({ error: "Phase review not found" });
    }
    
    res.json(review);
  } catch (error) {
    console.error("Error approving phase review:", error);
    res.status(400).json({ error: "Failed to approve phase review" });
  }
});

// ========================================
// TRACEABILITY LINKS
// ========================================

// Get traceability links for a project
router.get("/projects/:projectId/traceability-links", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const links = await storage.getDesignTraceabilityLinks(projectId);
    res.json(links);
  } catch (error) {
    console.error("Error fetching traceability links:", error);
    res.status(500).json({ error: "Failed to fetch traceability links" });
  }
});

// Create traceability link
router.post("/projects/:projectId/traceability-links", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id || 9999;
    
    const data = insertDesignTraceabilityLinkSchema.parse({
      ...req.body,
      projectId,
      createdBy: userId
    });
    
    const link = await storage.createDesignTraceabilityLink(data);
    res.status(201).json(link);
  } catch (error) {
    console.error("Error creating traceability link:", error);
    res.status(400).json({ error: "Failed to create traceability link" });
  }
});

// Delete traceability link
router.delete("/traceability-links/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteDesignTraceabilityLink(id);
    
    if (!success) {
      return res.status(404).json({ error: "Traceability link not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting traceability link:", error);
    res.status(400).json({ error: "Failed to delete traceability link" });
  }
});

// ========================================
// DESIGN PLANS
// ========================================

// Get all design plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await storage.getDesignPlans();
    res.json(plans);
  } catch (error) {
    console.error("Error fetching design plans:", error);
    res.status(500).json({ error: "Failed to fetch design plans" });
  }
});

// Get design plan by project ID
router.get("/projects/:projectId/plan", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const plan = await storage.getDesignPlanByProjectId(projectId);
    
    if (!plan) {
      return res.status(404).json({ error: "Design plan not found for this project" });
    }
    
    res.json(plan);
  } catch (error) {
    console.error("Error fetching design plan:", error);
    res.status(500).json({ error: "Failed to fetch design plan" });
  }
});

// Create design plan
router.post("/plans", async (req, res) => {
  try {
    const userId = req.user?.id || 9999;
    
    const data = insertDesignPlanSchema.parse({
      ...req.body,
      createdBy: userId
    });
    
    const plan = await storage.createDesignPlan(data);
    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating design plan:", error);
    res.status(400).json({ error: "Failed to create design plan" });
  }
});

// Update design plan progress
router.post("/plans/:id/progress", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { progress } = req.body;
    
    const plan = await storage.updatePlanProgress(id, progress);
    
    if (!plan) {
      return res.status(404).json({ error: "Design plan not found" });
    }
    
    res.json(plan);
  } catch (error) {
    console.error("Error updating plan progress:", error);
    res.status(400).json({ error: "Failed to update plan progress" });
  }
});

// ========================================
// PHASE GATING STATUS
// ========================================

// Get phase gating status for a project
router.get("/projects/:projectId/gating-status", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const status = await storage.getPhaseGatingStatus(projectId);
    res.json(status);
  } catch (error) {
    console.error("Error fetching phase gating status:", error);
    res.status(500).json({ error: "Failed to fetch phase gating status" });
  }
});

// Check if phase can advance
router.get("/phase-instances/:id/can-advance", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const canAdvance = await storage.canAdvanceToNextPhase(id);
    res.json({ canAdvance });
  } catch (error) {
    console.error("Error checking phase advancement:", error);
    res.status(500).json({ error: "Failed to check phase advancement" });
  }
});

// ========================================
// AUDIT TRAIL
// ========================================

// Get phase audit trail
router.get("/phase-instances/:id/audit-trail", async (req, res) => {
  try {
    const phaseInstanceId = parseInt(req.params.id);
    const trail = await storage.getDesignPhaseAuditTrail(phaseInstanceId);
    res.json(trail);
  } catch (error) {
    console.error("Error fetching phase audit trail:", error);
    res.status(500).json({ error: "Failed to fetch phase audit trail" });
  }
});

export default router;