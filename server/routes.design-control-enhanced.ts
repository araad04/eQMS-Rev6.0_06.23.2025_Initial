
import express from "express";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";
import { eq, desc, and, sql } from 'drizzle-orm';
import { designProjectsNew, designInputs, projectPhaseInstances, designProjectPhases } from '../shared/design-control-schema';
import { users } from '../shared/schema';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Project-Centric Design Control Management
router.get("/project/:projectId/design-artifacts", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const designArtifacts = {
      projectId,
      ursRequirements: [
        {
          id: 1,
          ursId: `URS-${projectId}-001`,
          title: "System Safety Requirements",
          description: "The system shall meet all applicable safety standards and regulations",
          category: "safety",
          priority: "critical",
          source: "ISO 13485:7.3.3",
          acceptanceCriteria: "System passes all safety validation tests",
          stakeholder: "Safety Engineer",
          linkedInputs: [],
          status: "approved",
          createdAt: new Date().toISOString(),
          approvedBy: "Quality Manager",
          approvedAt: new Date().toISOString()
        }
      ],
      designInputs: [
        {
          inputId: `DI-${projectId}-001`,
          title: "User Interface Safety Requirements",
          description: "Interface shall prevent accidental activation during critical procedures",
          linkedURS: [`URS-${projectId}-001`],
          linkedOutputs: [`DO-${projectId}-001`],
          verificationPlan: [`VER-${projectId}-001`],
          validationPlan: [`VAL-${projectId}-001`],
          status: "approved",
          traceabilityComplete: true,
          riskLevel: "high"
        }
      ],
      designOutputs: [
        {
          outputId: `DO-${projectId}-001`,
          title: "Safety Interface Specification",
          description: "Technical specification for safety interface implementation",
          linkedInputs: [`DI-${projectId}-001`],
          verificationStatus: "planned",
          validationStatus: "not_started"
        }
      ],
      verificationActivities: [
        {
          verificationId: `VER-${projectId}-001`,
          title: "Interface Safety Verification",
          linkedInputs: [`DI-${projectId}-001`],
          linkedOutputs: [`DO-${projectId}-001`],
          method: "testing",
          protocol: "VER-PROTOCOL-001",
          status: "planned"
        }
      ],
      validationActivities: [
        {
          validationId: `VAL-${projectId}-001`,
          title: "End-User Safety Validation",
          linkedRequirements: [`URS-${projectId}-001`],
          linkedInputs: [`DI-${projectId}-001`],
          method: "user_testing",
          protocol: "VAL-PROTOCOL-001",
          status: "planned"
        }
      ]
    };
    
    res.json(designArtifacts);
  } catch (error) {
    console.error("Error fetching project design artifacts:", error);
    res.status(500).json({ error: "Failed to fetch project design artifacts" });
  }
});

// Create URS Requirement
router.post("/urs-requirements", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      priority,
      source,
      acceptanceCriteria,
      stakeholder
    } = req.body;
    
    const ursId = `URS-${projectId}-${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`;
    
    const newURS = {
      id: Math.floor(Math.random() * 10000),
      ursId,
      title,
      description,
      category,
      priority,
      source,
      acceptanceCriteria,
      stakeholder,
      linkedInputs: [],
      status: "draft",
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 9999
    };
    
    res.status(201).json(newURS);
  } catch (error) {
    console.error("Error creating URS requirement:", error);
    res.status(500).json({ error: "Failed to create URS requirement" });
  }
});

// Project-Specific Phase Management
router.get("/project/:projectId/phases", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const projectPhases = {
      projectId,
      currentPhase: "Design Inputs",
      phases: [
        {
          id: 1,
          name: "Planning Phase",
          status: "completed",
          artifacts: ["Project Plan", "URS Requirements", "Risk Assessment"],
          gateReview: {
            reviewId: `PGR-${projectId}-001`,
            status: "completed",
            decision: "approved",
            completedDate: "2025-02-16"
          }
        },
        {
          id: 2,
          name: "Design Inputs Phase",
          status: "in_progress",
          artifacts: ["Design Inputs", "Traceability Matrix", "Input Validation"],
          gateReview: {
            reviewId: `PGR-${projectId}-002`,
            status: "in_progress",
            decision: "pending",
            scheduledDate: "2025-06-22"
          }
        },
        {
          id: 3,
          name: "Design Outputs Phase",
          status: "not_started",
          artifacts: ["Technical Specifications", "Design Drawings", "Software Code"],
          gateReview: {
            reviewId: `PGR-${projectId}-003`,
            status: "not_started",
            decision: "pending"
          }
        }
      ]
    };
    
    res.json(projectPhases);
  } catch (error) {
    console.error("Error fetching project phases:", error);
    res.status(500).json({ error: "Failed to fetch project phases" });
  }
});

// Project Phase Gate Reviews
router.get("/project/:projectId/phase-gate-reviews", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const phaseGateReviews = [
      {
        id: 1,
        reviewId: `PGR-${projectId}-001`,
        phaseId: 1,
        phaseName: "Planning Phase Gate",
        reviewType: "Planning Completion Review",
        status: "completed",
        decision: "approved",
        exitCriteria: [
          "Project plan approved",
          "URS requirements documented",
          "Resource allocation confirmed",
          "Risk assessment completed"
        ],
        reviewers: ["Quality Manager", "Project Manager", "Regulatory Affairs"],
        reviewDate: "2025-02-15",
        approvalDate: "2025-02-16",
        findings: [
          "Project scope clearly defined",
          "URS requirements comprehensive",
          "Risk assessment thorough"
        ],
        actionItems: [],
        bottleneckResolved: true,
        nextPhaseApproved: true,
        documentationComplete: true
      },
      {
        id: 2,
        reviewId: `PGR-${projectId}-002`,
        phaseId: 2,
        phaseName: "Design Inputs Phase Gate",
        reviewType: "Inputs Completion Review",
        status: "in_progress",
        decision: "pending",
        exitCriteria: [
          "All URS requirements traced to design inputs",
          "Risk analysis updated",
          "Input validation complete",
          "Stakeholder sign-off obtained"
        ],
        reviewers: ["Quality Manager", "Design Engineer", "Clinical Specialist"],
        reviewDate: "2025-06-22",
        approvalDate: null,
        findings: [
          "URS traceability matrix complete",
          "Design inputs well-defined",
          "Minor gaps in clinical requirements"
        ],
        actionItems: [
          {
            id: 1,
            description: "Complete clinical usability requirements",
            assignee: "Clinical Specialist",
            dueDate: "2025-06-25",
            status: "open"
          }
        ],
        bottleneckResolved: false,
        nextPhaseApproved: false,
        documentationComplete: false
      }
    ];
    
    res.json(phaseGateReviews);
  } catch (error) {
    console.error("Error fetching phase gate reviews:", error);
    res.status(500).json({ error: "Failed to fetch phase gate reviews" });
  }
});

// Create Phase Gate Review
router.post("/phase-gate-reviews", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const {
      projectId,
      phaseId,
      phaseName,
      reviewType,
      exitCriteria,
      reviewers,
      reviewDate
    } = req.body;
    
    const reviewId = `PGR-${projectId}-${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`;
    
    const newReview = {
      id: Math.floor(Math.random() * 10000),
      reviewId,
      phaseId,
      phaseName,
      reviewType,
      status: "scheduled",
      decision: "pending",
      exitCriteria,
      reviewers,
      reviewDate,
      approvalDate: null,
      findings: [],
      actionItems: [],
      bottleneckResolved: false,
      nextPhaseApproved: false,
      documentationComplete: false,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 9999
    };
    
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating phase gate review:", error);
    res.status(500).json({ error: "Failed to create phase gate review" });
  }
});

// Update Phase Gate Review Decision (Bottleneck Control)
router.put("/phase-gate-reviews/:reviewId/decision", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { decision, findings, actionItems, bottleneckResolved } = req.body;
    
    // Validate decision authority
    if (!req.user || !['quality_manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient authority for phase gate decisions" });
    }
    
    const updatedReview = {
      decision,
      findings,
      actionItems,
      bottleneckResolved,
      nextPhaseApproved: decision === 'approved' && bottleneckResolved,
      status: decision === 'approved' ? 'completed' : 'requires_action',
      approvalDate: decision === 'approved' ? new Date().toISOString() : null,
      approvedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating phase gate decision:", error);
    res.status(500).json({ error: "Failed to update phase gate decision" });
  }
});

// Design Input Chain with URS Traceability
router.get("/design-inputs-chain/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const designInputsChain = [
      {
        inputId: `DI-${projectId}-001`,
        title: "User Interface Safety Requirements",
        description: "Interface shall prevent accidental activation during critical procedures",
        linkedURS: [`URS-${projectId}-001`],
        linkedOutputs: [`DO-${projectId}-001`],
        verificationPlan: [`VER-${projectId}-001`],
        validationPlan: [`VAL-${projectId}-001`],
        status: "approved",
        traceabilityComplete: true,
        riskLevel: "high"
      },
      {
        inputId: `DI-${projectId}-002`,
        title: "Regulatory Documentation Requirements",
        description: "System documentation shall meet FDA submission requirements",
        linkedURS: [`URS-${projectId}-002`],
        linkedOutputs: [`DO-${projectId}-002`],
        verificationPlan: [`VER-${projectId}-002`],
        validationPlan: [`VAL-${projectId}-002`],
        status: "approved",
        traceabilityComplete: true,
        riskLevel: "critical"
      }
    ];
    
    res.json(designInputsChain);
  } catch (error) {
    console.error("Error fetching design inputs chain:", error);
    res.status(500).json({ error: "Failed to fetch design inputs chain" });
  }
});

// Verification Chain
router.get("/verification-chain/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const verificationChain = [
      {
        verificationId: `VER-${projectId}-001`,
        title: "Interface Safety Verification",
        linkedInputs: [`DI-${projectId}-001`],
        linkedOutputs: [`DO-${projectId}-001`],
        method: "testing",
        protocol: "VER-PROTOCOL-001",
        status: "planned",
        testCases: [
          {
            id: "TC-001",
            description: "Verify safety lockout during critical procedures",
            expectedResult: "Interface locked during procedure",
            actualResult: null,
            status: "not_executed"
          }
        ]
      }
    ];
    
    res.json(verificationChain);
  } catch (error) {
    console.error("Error fetching verification chain:", error);
    res.status(500).json({ error: "Failed to fetch verification chain" });
  }
});

// Validation Chain
router.get("/validation-chain/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const validationChain = [
      {
        validationId: `VAL-${projectId}-001`,
        title: "End-User Safety Validation",
        linkedRequirements: [`URS-${projectId}-001`],
        linkedInputs: [`DI-${projectId}-001`],
        method: "user_testing",
        protocol: "VAL-PROTOCOL-001",
        status: "planned",
        userScenarios: [
          {
            id: "US-001",
            description: "Clinical user performs critical procedure",
            expectedOutcome: "Procedure completed safely without interface interference",
            actualOutcome: null,
            status: "not_executed"
          }
        ]
      }
    ];
    
    res.json(validationChain);
  } catch (error) {
    console.error("Error fetching validation chain:", error);
    res.status(500).json({ error: "Failed to fetch validation chain" });
  }
});

// PDF Generation for Phase Documentation
router.post("/generate-phase-pdf/:projectId/:phaseId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { projectId, phaseId } = req.params;
    const { includeURS, includeInputs, includeReviews, includeTraceability } = req.body;
    
    const doc = new PDFDocument();
    const filename = `Phase-${phaseId}-Documentation-${projectId}-${Date.now()}.pdf`;
    const filepath = path.join('uploads/documents', filename);
    
    // Ensure directory exists
    const uploadDir = path.dirname(filepath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // Header
    doc.fontSize(20).text('Design Control Phase Documentation', { align: 'center' });
    doc.fontSize(14).text(`Project ID: ${projectId}`, { align: 'center' });
    doc.fontSize(14).text(`Phase ID: ${phaseId}`, { align: 'center' });
    doc.moveDown();
    
    // Phase Information
    doc.fontSize(16).text('Phase Information', { underline: true });
    doc.fontSize(12).text(`Phase Name: Design Phase ${phaseId}`);
    doc.text(`Status: In Progress`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.text(`Generated By: ${req.user?.firstName} ${req.user?.lastName}`);
    doc.moveDown();
    
    if (includeURS) {
      doc.fontSize(16).text('URS Requirements', { underline: true });
      doc.fontSize(12).text('URS-001: System Safety Requirements');
      doc.text('Description: The system shall meet all applicable safety standards');
      doc.text('Status: Approved');
      doc.moveDown();
    }
    
    if (includeInputs) {
      doc.fontSize(16).text('Design Inputs', { underline: true });
      doc.fontSize(12).text('DI-001: User Interface Safety Requirements');
      doc.text('Description: Interface shall prevent accidental activation');
      doc.text('Status: Approved');
      doc.moveDown();
    }
    
    if (includeReviews) {
      doc.fontSize(16).text('Phase Gate Reviews', { underline: true });
      doc.fontSize(12).text('Review Status: Completed');
      doc.text('Decision: Approved');
      doc.text('Bottleneck Resolved: Yes');
      doc.text('Next Phase Approved: Yes');
      doc.moveDown();
    }
    
    if (includeTraceability) {
      doc.fontSize(16).text('Traceability Matrix', { underline: true });
      doc.fontSize(12).text('URS-001 → DI-001 → DO-001 → VER-001 → VAL-001');
      doc.text('Traceability Status: Complete');
      doc.moveDown();
    }
    
    // Audit Trail
    doc.fontSize(16).text('Audit Information', { underline: true });
    doc.fontSize(12).text(`Document Generated: ${new Date().toISOString()}`);
    doc.text(`Generated By: User ID ${req.user?.id}`);
    doc.text(`Purpose: Audit Documentation`);
    doc.text(`Version: 1.0`);
    
    doc.end();
    
    res.json({
      success: true,
      filename,
      filepath: `/api/documents/download/${filename}`,
      message: "Phase documentation PDF generated successfully"
    });
    
  } catch (error) {
    console.error("Error generating phase PDF:", error);
    res.status(500).json({ error: "Failed to generate phase PDF" });
  }
});

// Design Control Steering Dashboard
router.get("/steering-dashboard/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const dashboard = {
      projectId,
      currentPhase: "Design Inputs",
      phaseProgress: 75,
      bottlenecks: [
        {
          phaseId: 2,
          phaseName: "Design Inputs",
          issue: "Clinical requirements incomplete",
          severity: "medium",
          blocking: true,
          actionRequired: "Complete clinical usability analysis"
        }
      ],
      phaseGateStatus: {
        total: 6,
        completed: 1,
        inProgress: 1,
        pending: 4,
        blocked: 1
      },
      traceabilityStatus: {
        ursToInputs: 85,
        inputsToOutputs: 60,
        outputsToVerification: 40,
        verificationToValidation: 30,
        overallCompleteness: 54
      },
      auditReadiness: {
        documentationComplete: 65,
        signOffsComplete: 40,
        traceabilityComplete: 54,
        overallReadiness: 53
      },
      nextMilestones: [
        {
          milestone: "Design Inputs Phase Gate Review",
          dueDate: "2025-06-25",
          status: "at_risk",
          dependencies: ["Clinical requirements", "Risk analysis update"]
        }
      ]
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error("Error fetching steering dashboard:", error);
    res.status(500).json({ error: "Failed to fetch steering dashboard" });
  }
});

// Bottleneck Resolution
router.post("/resolve-bottleneck/:projectId/:phaseId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { projectId, phaseId } = req.params;
    const { resolution, evidence, approver } = req.body;
    
    const bottleneckResolution = {
      id: Math.floor(Math.random() * 10000),
      projectId: parseInt(projectId),
      phaseId: parseInt(phaseId),
      resolution,
      evidence,
      resolvedBy: req.user?.id || 9999,
      approver,
      resolvedAt: new Date().toISOString(),
      status: "resolved",
      auditTrail: {
        action: "bottleneck_resolved",
        timestamp: new Date().toISOString(),
        user: req.user?.id || 9999
      }
    };
    
    res.status(201).json(bottleneckResolution);
  } catch (error) {
    console.error("Error resolving bottleneck:", error);
    res.status(500).json({ error: "Failed to resolve bottleneck" });
  }
});

export default router;
