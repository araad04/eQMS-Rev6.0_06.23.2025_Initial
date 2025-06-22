import { Router } from "express";
import { DocumentApprovalStorage } from "./storage.document-approval";
import { authMiddleware } from "./middleware/auth";

const router = Router();
const documentApprovalStorage = new DocumentApprovalStorage();

// Initiate document approval workflow
router.post("/initiate", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { documentId, documentType, documentVersion } = req.body;
    const initiatedBy = req.user!.id;

    const workflow = await documentApprovalStorage.initiateApprovalWorkflow({
      documentId,
      documentType,
      documentVersion,
      initiatedBy
    });

    res.json(workflow);
  } catch (error) {
    console.error("Error initiating approval workflow:", error);
    res.status(500).json({ error: "Failed to initiate approval workflow" });
  }
});

// Process approval decision
router.post("/decide", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { workflowId, approvalLevel, decision, comments, rejectionReason } = req.body;
    const approvedBy = req.user!.id;

    const result = await documentApprovalStorage.processApprovalDecision({
      workflowId,
      approvalLevel,
      decision,
      approvedBy,
      comments,
      rejectionReason
    });

    res.json(result);
  } catch (error) {
    console.error("Error processing approval decision:", error);
    res.status(500).json({ error: "Failed to process approval decision" });
  }
});

// Get active workflows for current user
router.get("/active", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const workflows = await documentApprovalStorage.getActiveWorkflows(userId);
    res.json(workflows);
  } catch (error) {
    console.error("Error getting active workflows:", error);
    res.status(500).json({ error: "Failed to get active workflows" });
  }
});

// Get all active workflows (admin view)
router.get("/active/all", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const workflows = await documentApprovalStorage.getActiveWorkflows();
    res.json(workflows);
  } catch (error) {
    console.error("Error getting all active workflows:", error);
    res.status(500).json({ error: "Failed to get active workflows" });
  }
});

// Get approval history for a document
router.get("/history/:documentId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const history = await documentApprovalStorage.getDocumentApprovalHistory(documentId);
    res.json(history);
  } catch (error) {
    console.error("Error getting approval history:", error);
    res.status(500).json({ error: "Failed to get approval history" });
  }
});

// Delegate approval authority
router.post("/delegate", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { workflowId, approvalLevel, delegatedTo, reason } = req.body;
    const delegatedBy = req.user!.id;

    const result = await documentApprovalStorage.delegateApproval({
      workflowId,
      approvalLevel,
      delegatedTo,
      delegatedBy,
      reason
    });

    res.json(result);
  } catch (error) {
    console.error("Error delegating approval:", error);
    res.status(500).json({ error: "Failed to delegate approval" });
  }
});

export default router;