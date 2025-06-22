import { Router } from "express";
import { z } from "zod";
import { organizationalStorage } from "./storage.organizational";
import {
  insertOrganizationalPositionSchema,
  insertOrganizationalStructureSchema,
  insertOrganizationalApprovalSchema,
  insertOrganizationalDelegationSchema,
  insertOrganizationalChartSchema,
} from "@shared/schema";

const router = Router();

// Positions endpoints
router.get("/api/organizational/positions", async (req, res) => {
  try {
    const positions = await organizationalStorage.getPositions();
    res.json(positions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

router.get("/api/organizational/positions/hierarchy", async (req, res) => {
  try {
    const hierarchy = await organizationalStorage.getPositionHierarchy();
    res.json(hierarchy);
  } catch (error) {
    console.error("Error fetching position hierarchy:", error);
    res.status(500).json({ error: "Failed to fetch position hierarchy" });
  }
});

router.post("/api/organizational/positions", async (req, res) => {
  try {
    const validatedData = insertOrganizationalPositionSchema.parse(req.body);
    const position = await organizationalStorage.createPosition(validatedData);
    res.status(201).json(position);
  } catch (error) {
    console.error("Error creating position:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid position data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create position" });
  }
});

router.put("/api/organizational/positions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.body.userId || 1; // Should come from auth middleware
    const updates = req.body;
    delete updates.userId;
    
    const position = await organizationalStorage.updatePosition(id, updates, userId);
    res.json(position);
  } catch (error) {
    console.error("Error updating position:", error);
    res.status(500).json({ error: "Failed to update position" });
  }
});

router.delete("/api/organizational/positions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.body.userId || 1; // Should come from auth middleware
    
    await organizationalStorage.deletePosition(id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting position:", error);
    res.status(500).json({ error: "Failed to delete position" });
  }
});

// Organizational Structure endpoints
router.get("/api/organizational/structure", async (req, res) => {
  try {
    const structure = await organizationalStorage.getOrganizationalStructure();
    res.json(structure);
  } catch (error) {
    console.error("Error fetching organizational structure:", error);
    res.status(500).json({ error: "Failed to fetch organizational structure" });
  }
});

router.post("/api/organizational/structure", async (req, res) => {
  try {
    const validatedData = insertOrganizationalStructureSchema.parse(req.body);
    const assignment = await organizationalStorage.createStructureAssignment(validatedData);
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error creating structure assignment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid assignment data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create structure assignment" });
  }
});

router.put("/api/organizational/structure/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.body.userId || 1; // Should come from auth middleware
    const updates = req.body;
    delete updates.userId;
    
    const assignment = await organizationalStorage.updateStructureAssignment(id, updates, userId);
    res.json(assignment);
  } catch (error) {
    console.error("Error updating structure assignment:", error);
    res.status(500).json({ error: "Failed to update structure assignment" });
  }
});

router.get("/api/organizational/structure/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const structure = await organizationalStorage.getStructureByUserId(userId);
    res.json(structure);
  } catch (error) {
    console.error("Error fetching user structure:", error);
    res.status(500).json({ error: "Failed to fetch user structure" });
  }
});

// Approval Rules endpoints
router.get("/api/organizational/approvals", async (req, res) => {
  try {
    const approvals = await organizationalStorage.getApprovalRules();
    res.json(approvals);
  } catch (error) {
    console.error("Error fetching approval rules:", error);
    res.status(500).json({ error: "Failed to fetch approval rules" });
  }
});

router.post("/api/organizational/approvals", async (req, res) => {
  try {
    const validatedData = insertOrganizationalApprovalSchema.parse(req.body);
    const approval = await organizationalStorage.createApprovalRule(validatedData);
    res.status(201).json(approval);
  } catch (error) {
    console.error("Error creating approval rule:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid approval data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create approval rule" });
  }
});

router.get("/api/organizational/approvals/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const approvals = await organizationalStorage.getApprovalRulesByUser(userId);
    res.json(approvals);
  } catch (error) {
    console.error("Error fetching user approvals:", error);
    res.status(500).json({ error: "Failed to fetch user approvals" });
  }
});

// Delegations endpoints
router.get("/api/organizational/delegations", async (req, res) => {
  try {
    const delegations = await organizationalStorage.getActiveDelegations();
    res.json(delegations);
  } catch (error) {
    console.error("Error fetching delegations:", error);
    res.status(500).json({ error: "Failed to fetch delegations" });
  }
});

router.post("/api/organizational/delegations", async (req, res) => {
  try {
    const validatedData = insertOrganizationalDelegationSchema.parse(req.body);
    const delegation = await organizationalStorage.createDelegation(validatedData);
    res.status(201).json(delegation);
  } catch (error) {
    console.error("Error creating delegation:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid delegation data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create delegation" });
  }
});

// Organizational Chart endpoints
router.get("/api/organizational/chart", async (req, res) => {
  try {
    const chart = await organizationalStorage.getActiveChart();
    res.json(chart);
  } catch (error) {
    console.error("Error fetching active chart:", error);
    res.status(500).json({ error: "Failed to fetch active chart" });
  }
});

router.get("/api/organizational/chart/history", async (req, res) => {
  try {
    const history = await organizationalStorage.getChartHistory();
    res.json(history);
  } catch (error) {
    console.error("Error fetching chart history:", error);
    res.status(500).json({ error: "Failed to fetch chart history" });
  }
});

router.post("/api/organizational/chart", async (req, res) => {
  try {
    const validatedData = insertOrganizationalChartSchema.parse(req.body);
    const chart = await organizationalStorage.createChart(validatedData);
    res.status(201).json(chart);
  } catch (error) {
    console.error("Error creating chart:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid chart data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create chart" });
  }
});

router.post("/api/organizational/chart/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const approvedBy = req.body.approvedBy || 1; // Should come from auth middleware
    
    const chart = await organizationalStorage.approveChart(id, approvedBy);
    res.json(chart);
  } catch (error) {
    console.error("Error approving chart:", error);
    res.status(500).json({ error: "Failed to approve chart" });
  }
});

// Analytics endpoints
router.get("/api/organizational/metrics", async (req, res) => {
  try {
    const metrics = await organizationalStorage.getOrganizationalMetrics();
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching organizational metrics:", error);
    res.status(500).json({ error: "Failed to fetch organizational metrics" });
  }
});

// Audit Trail endpoints
router.get("/api/organizational/audit-trail", async (req, res) => {
  try {
    const { entityType, entityId } = req.query;
    const auditTrail = await organizationalStorage.getAuditTrail(
      entityType as string,
      entityId ? parseInt(entityId as string) : undefined
    );
    res.json(auditTrail);
  } catch (error) {
    console.error("Error fetching audit trail:", error);
    res.status(500).json({ error: "Failed to fetch audit trail" });
  }
});

// Utility endpoints for dropdowns and selects
router.get("/api/organizational/departments", async (req, res) => {
  try {
    const positions = await organizationalStorage.getPositions();
    const departments = [...new Set(positions.map(p => p.department))].sort();
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

router.get("/api/organizational/document-types", async (req, res) => {
  try {
    // Common QMS document types for ISO 13485
    const documentTypes = [
      "Quality Manual",
      "Procedures",
      "Work Instructions",
      "Forms",
      "Design Controls",
      "Risk Management",
      "Clinical Evaluation",
      "Post-Market Surveillance",
      "Management Review",
      "CAPA",
      "Supplier Management",
      "Training Records",
      "Audit Reports",
      "Complaint Handling",
      "Regulatory Submissions"
    ];
    res.json(documentTypes);
  } catch (error) {
    console.error("Error fetching document types:", error);
    res.status(500).json({ error: "Failed to fetch document types" });
  }
});

export default router;