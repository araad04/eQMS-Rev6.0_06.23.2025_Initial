import express from "express";
import { storage } from "./storage";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";
import { qmsDeleteOperations } from "./delete-operations";
import { 
  insertCapaSchema, insertCapaActionSchema, insertCapaWorkflowSchema, 
  insertCapaCorrectionSchema, insertCapaWorkflowHistorySchema,
  insertCapaRootCauseSchema, insertCapaEffectivenessReviewSchema
} from "@shared/schema";

const { isAuthenticated, hasRole, isAdmin, auditRequest } = authMiddleware;

export const capaRouter = express.Router();

// Get all CAPAs
capaRouter.get("/capas", isAuthenticated, async (req, res) => {
  try {
    const capas = await storage.getCapas();
    res.json(capas);
  } catch (error) {
    console.error("Error fetching CAPAs:", error);
    res.status(500).json({ error: "Failed to fetch CAPAs" });
  }
});

// Get a specific CAPA by ID
capaRouter.get("/capas/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const capa = await storage.getCapa(parseInt(id));
    
    if (!capa) {
      return res.status(404).json({ error: "CAPA not found" });
    }
    
    res.json(capa);
  } catch (error) {
    console.error(`Error fetching CAPA ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch CAPA" });
  }
});

// Create a new CAPA
capaRouter.post("/capas", isAuthenticated, async (req, res) => {
  try {
    const data = insertCapaSchema.parse(req.body);
    
    // Check if we need to use an actual user from the database
    // This solves the issue with the development user (ID 9999) not existing in the users table
    let initiatedBy = data.initiatedBy;
    let assignedToUser = data.assignedTo || data.initiatedBy;
    
    // Validate that user IDs exist in the database
    const users = await storage.getUsers();
    const validUserIds = users.map(u => u.id);
    
    if (!validUserIds.includes(initiatedBy)) {
      return res.status(400).json({ error: "Invalid initiated by user ID" });
    }
    
    if (assignedToUser && !validUserIds.includes(assignedToUser)) {
      // If assigned user doesn't exist, assign to the initiating user
      assignedToUser = initiatedBy;
    }
    
    // Implement automatic 180-day due date for Risk Priority CAPAs
    let automaticDueDate = data.dueDate;
    if (data.riskPriority === 'High' || data.riskPriority === 'Critical' || data.riskPriority === 'Risk Priority') {
      const currentDate = new Date();
      automaticDueDate = new Date(currentDate.getTime() + (180 * 24 * 60 * 60 * 1000)); // 180 days from now
      console.log(`Auto-assigned 180-day due date for Risk Priority CAPA: ${automaticDueDate.toISOString()}`);
    }
    
    // Update data with corrected assignments and automatic due date
    const updatedData = {
      ...data,
      assignedTo: assignedToUser,
      dueDate: automaticDueDate
    };
    
    const capa = await storage.createCapa(updatedData);
    
    // Create a workflow for the CAPA
    const workflow = await storage.createCapaWorkflow({
      capaId: capa.id,
      currentState: 'CORRECTION',
      assignedTo: assignedToUser,
      transitionedBy: initiatedBy,
      dueDate: automaticDueDate ? (typeof automaticDueDate === 'string' ? new Date(automaticDueDate) : automaticDueDate) : null
    });
    
    // Return the CAPA with its workflow
    res.status(201).json({ ...capa, workflow });
  } catch (error) {
    console.error("Error creating CAPA:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create CAPA" });
  }
});

// Get workflow for a specific CAPA
capaRouter.get("/capas/:id/workflow", isAuthenticated, async (req, res) => {
  try {
    const capaId = parseInt(req.params.id);
    if (isNaN(capaId)) {
      return res.status(400).json({ error: "Invalid CAPA ID" });
    }

    // Get the workflow for this CAPA
    const workflow = await storage.getCapaWorkflow(capaId);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Get the workflow history
    const history = await storage.getCapaWorkflowHistory(workflow.id);
    
    // Get user information for assigned user and transitions
    const users = await storage.getUsers();
    
    // Map user information to history items
    const historyWithUsers = history.map(item => {
      const transitionedByUser = users.find(u => u.id === item.transitionedBy);
      return {
        ...item,
        transitionedByUser: transitionedByUser ? {
          id: transitionedByUser.id,
          firstName: transitionedByUser.firstName,
          lastName: transitionedByUser.lastName,
          email: transitionedByUser.email
        } : undefined
      };
    });
    
    // Get assigned user information
    const assignedUser = users.find(u => u.id === workflow.assignedTo);

    // Return the combined data
    res.json({
      ...workflow,
      assignedUser: assignedUser ? {
        id: assignedUser.id,
        firstName: assignedUser.firstName,
        lastName: assignedUser.lastName,
        email: assignedUser.email
      } : undefined,
      history: historyWithUsers
    });
  } catch (error) {
    console.error("Error fetching CAPA workflow:", error);
    res.status(500).json({ error: "Failed to fetch workflow" });
  }
});

// Transition a CAPA workflow to a new state
capaRouter.post("/capas/:id/workflow/transition", isAuthenticated, async (req, res) => {
  try {
    const capaId = parseInt(req.params.id);
    if (isNaN(capaId)) {
      return res.status(400).json({ error: "Invalid CAPA ID" });
    }

    // Validate the request body
    const transitionSchema = z.object({
      state: z.enum(['CORRECTION', 'ROOT_CAUSE_ANALYSIS', 'CORRECTIVE_ACTION', 'EFFECTIVENESS_VERIFICATION']),
      comments: z.string().optional(),
      assignedTo: z.number().optional(),
      dueDate: z.string().optional().nullable()
    });
    
    const data = transitionSchema.parse(req.body);
    
    // Get the existing workflow
    const workflow = await storage.getCapaWorkflow(capaId);
    if (!workflow) {
      return res.status(404).json({ error: "CAPA workflow not found" });
    }
    
    // Get the current user ID for the transition
    let userId = req.user?.id;
    
    // Validate user ID exists in the database
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }
    
    const users = await storage.getUsers();
    const validUserIds = users.map(u => u.id);
    
    if (!validUserIds.includes(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Create history record for this transition
    await storage.createCapaWorkflowHistory({
      workflowId: workflow.id,
      fromState: workflow.currentState,
      toState: data.state,
      transitionDate: new Date(),
      transitionedBy: userId,
      comments: data.comments || `Transitioned from ${workflow.currentState} to ${data.state}`
    });
    
    // Update the workflow with new state
    const updatedWorkflow = await storage.updateCapaWorkflow(workflow.id, {
      currentState: data.state,
      transitionDate: new Date(),
      transitionedBy: userId,
      assignedTo: data.assignedTo || workflow.assignedTo,
      dueDate: data.dueDate ? new Date(data.dueDate) : workflow.dueDate
    });
    
    // Get updated history
    const history = await storage.getCapaWorkflowHistory(workflow.id);
    
    // Return the updated workflow with history
    res.json({
      ...updatedWorkflow,
      history
    });
  } catch (error) {
    console.error("Error transitioning CAPA workflow:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to transition workflow" });
  }
});

// Phase-specific data endpoints

// Get phase data for a specific CAPA and phase
capaRouter.get("/capas/:id/phase-data/:phase", isAuthenticated, async (req, res) => {
  try {
    const capaId = parseInt(req.params.id);
    if (isNaN(capaId)) {
      return res.status(400).json({ error: "Invalid CAPA ID" });
    }
    
    const phase = req.params.phase;
    const validPhases = ['correction', 'root-cause', 'corrective-action', 'effectiveness'];
    if (!validPhases.includes(phase)) {
      return res.status(400).json({ error: "Invalid phase" });
    }
    
    // Map phase name to database key
    const phaseMap: Record<string, string> = {
      'correction': 'CORRECTION',
      'root-cause': 'ROOT_CAUSE_ANALYSIS',
      'corrective-action': 'CORRECTIVE_ACTION',
      'effectiveness': 'EFFECTIVENESS_VERIFICATION'
    };
    
    // Get phase data
    const phaseData = await storage.getCapaPhaseData(capaId, phaseMap[phase]);
    
    res.json(phaseData ? phaseData : { data: {} });
  } catch (error) {
    console.error("Error fetching phase data:", error);
    res.status(500).json({ error: "Failed to fetch phase data" });
  }
});

// Save phase data for a specific CAPA and phase
capaRouter.post("/capas/:id/phase-data/:phase", isAuthenticated, async (req, res) => {
  try {
    const capaId = parseInt(req.params.id);
    if (isNaN(capaId)) {
      return res.status(400).json({ error: "Invalid CAPA ID" });
    }
    
    const phase = req.params.phase;
    const validPhases = ['correction', 'root-cause', 'corrective-action', 'effectiveness'];
    if (!validPhases.includes(phase)) {
      return res.status(400).json({ error: "Invalid phase" });
    }
    
    // Map phase name to database key
    const phaseMap: Record<string, string> = {
      'correction': 'CORRECTION',
      'root-cause': 'ROOT_CAUSE_ANALYSIS',
      'corrective-action': 'CORRECTIVE_ACTION',
      'effectiveness': 'EFFECTIVENESS_VERIFICATION'
    };
    
    // Get user ID for attribution
    let userId = req.user?.id;
    
    // Validate user ID exists in the database
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }
    
    const users = await storage.getUsers();
    const validUserIds = users.map(u => u.id);
    
    if (!validUserIds.includes(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Save phase data
    const phaseData = await storage.saveCapaPhaseData(
      capaId, 
      phaseMap[phase], 
      req.body,
      userId!
    );
    
    res.status(201).json(phaseData);
  } catch (error) {
    console.error("Error saving phase data:", error);
    res.status(500).json({ error: "Failed to save phase data" });
  }
});

// Update a CAPA
capaRouter.patch("/capas/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedCapa = await storage.updateCapa(parseInt(id), data);
    
    if (!updatedCapa) {
      return res.status(404).json({ error: "CAPA not found" });
    }
    
    res.json(updatedCapa);
  } catch (error) {
    console.error(`Error updating CAPA ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update CAPA" });
  }
});

// Delete a CAPA
capaRouter.delete("/capas/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Check if CAPA exists
    const capa = await storage.getCapa(id);
    if (!capa) {
      return res.status(404).json({ error: "CAPA not found" });
    }

    const deleted = await qmsDeleteOperations.deleteCapa(id);
    
    if (!deleted) {
      return res.status(500).json({ error: "Failed to delete CAPA" });
    }

    res.json({ success: true, message: "CAPA deleted successfully" });
  } catch (error) {
    console.error(`Error deleting CAPA ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete CAPA" });
  }
});

// CAPA Workflow Routes

// Get CAPA workflow
capaRouter.get("/capas/:id/workflow", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await storage.getCapaWorkflow(parseInt(id));
    
    if (!workflow) {
      return res.status(404).json({ error: "CAPA workflow not found" });
    }
    
    // Get workflow history
    const history = await storage.getCapaWorkflowHistory(workflow.id);
    
    res.json({
      ...workflow,
      history
    });
  } catch (error) {
    console.error(`Error fetching CAPA workflow for CAPA ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch CAPA workflow" });
  }
});

// Transition CAPA workflow state
capaRouter.post("/capas/:id/workflow/transition", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { state, comments } = req.body;
    
    if (!state) {
      return res.status(400).json({ error: "Workflow state is required" });
    }
    
    // Get the current workflow
    const workflow = await storage.getCapaWorkflow(parseInt(id));
    
    if (!workflow) {
      return res.status(404).json({ error: "CAPA workflow not found" });
    }
    
    // Update the workflow state
    const updatedWorkflow = await storage.updateCapaWorkflowState(
      workflow.id, 
      state, 
      req.user!.id
    );
    
    // Get updated history
    const history = await storage.getCapaWorkflowHistory(workflow.id);
    
    res.json({
      ...updatedWorkflow,
      history
    });
  } catch (error) {
    console.error(`Error transitioning CAPA workflow for CAPA ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to transition CAPA workflow" });
  }
});

// CAPA Correction Routes

// Get all corrections for a CAPA
capaRouter.get("/capas/:id/corrections", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const corrections = await storage.getCapaCorrections(parseInt(id));
    res.json(corrections);
  } catch (error) {
    console.error(`Error fetching corrections for CAPA ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch CAPA corrections" });
  }
});

// Create a correction for a CAPA
capaRouter.post("/capas/:id/corrections", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const capaId = parseInt(id);
    
    // Verify CAPA exists
    const capa = await storage.getCapa(capaId);
    if (!capa) {
      return res.status(404).json({ error: "CAPA not found" });
    }
    
    // Validate user authentication
    if (!req.user?.id) {
      return res.status(401).json({ error: "User authentication required" });
    }
    
    // Prepare correction data
    const correctionData = {
      ...req.body,
      capaId,
      createdBy: req.user.id,
    };
    
    // Validate and create the correction
    const data = insertCapaCorrectionSchema.parse(correctionData);
    const correction = await storage.createCapaCorrection(data);
    
    // Get the workflow
    const workflow = await storage.getCapaWorkflow(capaId);
    
    // If in CORRECTION state, check if we can move to ROOT_CAUSE_ANALYSIS
    if (workflow && workflow.currentState === 'CORRECTION') {
      // Optionally transition to next state automatically
      // Uncomment to enable automatic transition
      /*
      await storage.updateCapaWorkflowState(
        workflow.id,
        'ROOT_CAUSE_ANALYSIS',
        req.user.id
      );
      */
    }
    
    res.status(201).json(correction);
  } catch (error) {
    console.error(`Error creating correction for CAPA ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create CAPA correction" });
  }
});

// Add more routes for the remaining phases (RCA, Actions, Effectiveness) as needed