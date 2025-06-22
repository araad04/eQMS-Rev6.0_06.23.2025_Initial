import { Router, Request, Response } from "express";
import * as qualityManualStorage from "./storage.quality-manual";
import { authMiddleware } from "./middleware/auth";

export const qualityManualRouter = Router();

// Quality Manual routes
qualityManualRouter.get("/", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const manuals = await qualityManualStorage.getQualityManuals();
    res.json(manuals);
  } catch (error) {
    console.error("Error fetching quality manuals:", error);
    res.status(500).json({ error: "Failed to fetch quality manuals" });
  }
});

qualityManualRouter.get("/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid manual ID" });
    }
    
    const manual = await qualityManualStorage.getQualityManual(id);
    if (!manual) {
      return res.status(404).json({ error: "Quality manual not found" });
    }
    
    res.json(manual);
  } catch (error) {
    console.error("Error fetching quality manual:", error);
    res.status(500).json({ error: "Failed to fetch quality manual" });
  }
});

qualityManualRouter.post("/", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = qualityManualStorage.insertQualityManualSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const manual = await qualityManualStorage.createQualityManual(result.data);
    res.status(201).json(manual);
  } catch (error) {
    console.error("Error creating quality manual:", error);
    res.status(500).json({ error: "Failed to create quality manual" });
  }
});

qualityManualRouter.put("/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid manual ID" });
    }
    
    // Validate request body
    const result = qualityManualStorage.insertQualityManualSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const manual = await qualityManualStorage.updateQualityManual(id, result.data);
    if (!manual) {
      return res.status(404).json({ error: "Quality manual not found" });
    }
    
    res.json(manual);
  } catch (error) {
    console.error("Error updating quality manual:", error);
    res.status(500).json({ error: "Failed to update quality manual" });
  }
});

// Manual Version routes
qualityManualRouter.get("/:manualId/versions", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const manualId = parseInt(req.params.manualId);
    if (isNaN(manualId)) {
      return res.status(400).json({ error: "Invalid manual ID" });
    }
    
    const versions = await qualityManualStorage.getManualVersions(manualId);
    res.json(versions);
  } catch (error) {
    console.error("Error fetching manual versions:", error);
    res.status(500).json({ error: "Failed to fetch manual versions" });
  }
});

qualityManualRouter.get("/versions/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    const version = await qualityManualStorage.getManualVersion(id);
    if (!version) {
      return res.status(404).json({ error: "Manual version not found" });
    }
    
    res.json(version);
  } catch (error) {
    console.error("Error fetching manual version:", error);
    res.status(500).json({ error: "Failed to fetch manual version" });
  }
});

qualityManualRouter.post("/:manualId/versions", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const manualId = parseInt(req.params.manualId);
    if (isNaN(manualId)) {
      return res.status(400).json({ error: "Invalid manual ID" });
    }
    
    // Add the manual ID to the request body
    const versionData = { ...req.body, manualId };
    
    // Validate request body
    const result = qualityManualStorage.insertManualVersionSchema.safeParse(versionData);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const version = await qualityManualStorage.createManualVersion(result.data);
    
    // If this is the first version, update the manual's currentVersionId
    const manual = await qualityManualStorage.getQualityManual(manualId);
    if (manual && !manual.currentVersionId) {
      await qualityManualStorage.updateQualityManualCurrentVersion(manualId, version.id);
    }
    
    res.status(201).json(version);
  } catch (error) {
    console.error("Error creating manual version:", error);
    res.status(500).json({ error: "Failed to create manual version" });
  }
});

qualityManualRouter.put("/versions/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    // Validate request body
    const result = qualityManualStorage.insertManualVersionSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const version = await qualityManualStorage.updateManualVersion(id, result.data);
    if (!version) {
      return res.status(404).json({ error: "Manual version not found" });
    }
    
    res.json(version);
  } catch (error) {
    console.error("Error updating manual version:", error);
    res.status(500).json({ error: "Failed to update manual version" });
  }
});

qualityManualRouter.put("/versions/:id/approve", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    const { approverId } = req.body;
    if (!approverId) {
      return res.status(400).json({ error: "Approver ID is required" });
    }
    
    const version = await qualityManualStorage.approveManualVersion(id, approverId);
    if (!version) {
      return res.status(404).json({ error: "Manual version not found" });
    }
    
    // Update the manual's currentVersionId to this approved version
    await qualityManualStorage.updateQualityManualCurrentVersion(version.manualId, version.id);
    
    res.json(version);
  } catch (error) {
    console.error("Error approving manual version:", error);
    res.status(500).json({ error: "Failed to approve manual version" });
  }
});

// Manual Section routes
qualityManualRouter.get("/versions/:versionId/sections", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const versionId = parseInt(req.params.versionId);
    if (isNaN(versionId)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    const sections = await qualityManualStorage.getManualSections(versionId);
    res.json(sections);
  } catch (error) {
    console.error("Error fetching manual sections:", error);
    res.status(500).json({ error: "Failed to fetch manual sections" });
  }
});

qualityManualRouter.post("/versions/:versionId/sections", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const versionId = parseInt(req.params.versionId);
    if (isNaN(versionId)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    // Add the version ID to the request body
    const sectionData = { ...req.body, versionId };
    
    // Validate request body
    const result = qualityManualStorage.insertManualSectionSchema.safeParse(sectionData);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const section = await qualityManualStorage.createManualSection(result.data);
    res.status(201).json(section);
  } catch (error) {
    console.error("Error creating manual section:", error);
    res.status(500).json({ error: "Failed to create manual section" });
  }
});

qualityManualRouter.put("/sections/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid section ID" });
    }
    
    // Validate request body
    const result = qualityManualStorage.insertManualSectionSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const section = await qualityManualStorage.updateManualSection(id, result.data);
    if (!section) {
      return res.status(404).json({ error: "Manual section not found" });
    }
    
    res.json(section);
  } catch (error) {
    console.error("Error updating manual section:", error);
    res.status(500).json({ error: "Failed to update manual section" });
  }
});

qualityManualRouter.delete("/sections/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid section ID" });
    }
    
    await qualityManualStorage.deleteManualSection(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting manual section:", error);
    res.status(500).json({ error: "Failed to delete manual section" });
  }
});

// Approval Workflow routes
qualityManualRouter.get("/versions/:versionId/approvals", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const versionId = parseInt(req.params.versionId);
    if (isNaN(versionId)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    const approvals = await qualityManualStorage.getApprovalWorkflows(versionId);
    res.json(approvals);
  } catch (error) {
    console.error("Error fetching approval workflows:", error);
    res.status(500).json({ error: "Failed to fetch approval workflows" });
  }
});

qualityManualRouter.post("/versions/:versionId/approvals", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const versionId = parseInt(req.params.versionId);
    if (isNaN(versionId)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    // Add the version ID to the request body
    const approvalData = { ...req.body, versionId };
    
    // Validate request body
    const result = qualityManualStorage.insertApprovalWorkflowSchema.safeParse(approvalData);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const approval = await qualityManualStorage.createApprovalWorkflow(result.data);
    res.status(201).json(approval);
  } catch (error) {
    console.error("Error creating approval workflow:", error);
    res.status(500).json({ error: "Failed to create approval workflow" });
  }
});

qualityManualRouter.put("/approvals/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid approval ID" });
    }
    
    // Validate request body
    const result = qualityManualStorage.insertApprovalWorkflowSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid data", details: result.error.format() });
    }
    
    const approval = await qualityManualStorage.updateApprovalWorkflow(id, result.data);
    if (!approval) {
      return res.status(404).json({ error: "Approval workflow not found" });
    }
    
    res.json(approval);
  } catch (error) {
    console.error("Error updating approval workflow:", error);
    res.status(500).json({ error: "Failed to update approval workflow" });
  }
});

qualityManualRouter.put("/approvals/:id/status", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid approval ID" });
    }
    
    const { status, comment } = req.body;
    if (!status || (status !== "Approved" && status !== "Rejected")) {
      return res.status(400).json({ error: "Valid status (Approved or Rejected) is required" });
    }
    
    const approval = await qualityManualStorage.updateApprovalStatus(id, status, comment);
    if (!approval) {
      return res.status(404).json({ error: "Approval workflow not found" });
    }
    
    // Check if all approvals are complete and update the version status accordingly
    const approvalStatus = await qualityManualStorage.checkAllApprovals(approval.versionId);
    if (approvalStatus.allApproved) {
      // If all approvals are complete, get the user ID of the last approver
      const version = await qualityManualStorage.getManualVersion(approval.versionId);
      if (version) {
        await qualityManualStorage.approveManualVersion(version.id, req.body.userId || approval.approverId);
        // Update the manual's currentVersionId to this approved version
        await qualityManualStorage.updateQualityManualCurrentVersion(version.manualId, version.id);
      }
    }
    
    res.json({ approval, approvalStatus });
  } catch (error) {
    console.error("Error updating approval status:", error);
    res.status(500).json({ error: "Failed to update approval status" });
  }
});

// Check approval status
qualityManualRouter.get("/versions/:versionId/approval-status", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const versionId = parseInt(req.params.versionId);
    if (isNaN(versionId)) {
      return res.status(400).json({ error: "Invalid version ID" });
    }
    
    const status = await qualityManualStorage.checkAllApprovals(versionId);
    res.json(status);
  } catch (error) {
    console.error("Error checking approval status:", error);
    res.status(500).json({ error: "Failed to check approval status" });
  }
});