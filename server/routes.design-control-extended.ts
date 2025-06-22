
import express from "express";
import { authMiddleware } from "./middleware/auth";

const router = express.Router();

// Enhanced traceability matrix endpoints for comprehensive design control

// URS Requirements endpoint
router.get("/urs-requirements", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const ursRequirements = [
      {
        requirementId: "URS-EQMS-001",
        title: "Electronic Quality Management System Framework",
        description: "System shall provide comprehensive electronic quality management capabilities compliant with ISO 13485:2016",
        requirementType: "functional",
        priority: "critical",
        riskLevel: "high",
        status: "approved",
        regulatoryRequirement: true,
        regulatoryContext: "ISO 13485:2016 Clause 4.1",
        acceptanceCriteria: "Complete QMS framework with all required processes documented and implemented",
        source: "ISO 13485:2016",
        stakeholderCategory: "quality_manager",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        owner: "Quality Manager"
      },
      {
        requirementId: "URS-EQMS-002", 
        title: "Design Control Process Management",
        description: "System shall manage complete design control lifecycle per ISO 13485:7.3 requirements",
        requirementType: "functional",
        priority: "critical",
        riskLevel: "high",
        status: "approved",
        regulatoryRequirement: true,
        regulatoryContext: "ISO 13485:7.3",
        acceptanceCriteria: "Design control process from planning through transfer with complete traceability",
        source: "ISO 13485:2016 Section 7.3",
        stakeholderCategory: "design_engineer",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        owner: "Design Control Manager"
      },
      {
        requirementId: "URS-EQMS-003",
        title: "Electronic Signatures and Records",
        description: "System shall support 21 CFR Part 11 compliant electronic signatures and records",
        requirementType: "compliance",
        priority: "critical", 
        riskLevel: "high",
        status: "approved",
        regulatoryRequirement: true,
        regulatoryContext: "21 CFR Part 11",
        acceptanceCriteria: "Electronic signatures with authentication, non-repudiation, and audit trail",
        source: "21 CFR Part 11",
        stakeholderCategory: "regulatory_affairs",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
        owner: "Regulatory Affairs"
      }
    ];
    
    res.json(ursRequirements);
  } catch (error) {
    console.error("Error fetching URS requirements:", error);
    res.status(500).json({ error: "Failed to fetch URS requirements" });
  }
});

// Design Outputs endpoint
router.get("/design-outputs", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const designOutputs = [
      {
        outputId: "DO-DP-2025-001-001",
        title: "System Architecture Specification",
        description: "Detailed system architecture defining microservices, data flow, and integration points",
        outputType: "specification",
        priority: "critical",
        riskLevel: "high",
        status: "verified",
        linkedInputs: ["DI-DP-2025-001-001", "DI-DP-2025-001-002"],
        verificationMethod: "design_review",
        verificationStatus: "verified",
        createdAt: "2025-02-20T10:00:00Z",
        verifiedAt: "2025-03-15T14:30:00Z",
        verifiedBy: "System Architect"
      },
      {
        outputId: "DO-DP-2025-001-002",
        title: "Database Schema Design",
        description: "Complete database schema with tables, relationships, and constraints for QMS data",
        outputType: "specification",
        priority: "high",
        riskLevel: "medium",
        status: "verified",
        linkedInputs: ["DI-DP-2025-001-003", "DI-DP-2025-001-004"],
        verificationMethod: "technical_review",
        verificationStatus: "verified",
        createdAt: "2025-02-25T11:00:00Z",
        verifiedAt: "2025-03-20T16:00:00Z",
        verifiedBy: "Database Architect"
      },
      {
        outputId: "DO-DP-2025-001-003",
        title: "User Interface Design Specifications",
        description: "UI/UX design specifications with wireframes, user flows, and accessibility requirements",
        outputType: "specification",
        priority: "high",
        riskLevel: "medium",
        status: "in_review",
        linkedInputs: ["DI-DP-2025-001-001"],
        verificationMethod: "usability_testing",
        verificationStatus: "pending",
        createdAt: "2025-03-01T09:00:00Z",
        verifiedAt: null,
        verifiedBy: null
      }
    ];
    
    res.json(designOutputs);
  } catch (error) {
    console.error("Error fetching design outputs:", error);
    res.status(500).json({ error: "Failed to fetch design outputs" });
  }
});

// Verification Plans endpoint
router.get("/verification-plans", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const verificationPlans = [
      {
        planId: "VER-DP-2025-001-001",
        title: "System Architecture Verification Plan",
        description: "Verification plan for system architecture against design inputs",
        verificationMethod: "design_review",
        priority: "critical",
        status: "executed",
        executionProgress: 100,
        linkedOutputs: ["DO-DP-2025-001-001"],
        testCases: ["TC-VER-001", "TC-VER-002"],
        createdAt: "2025-03-10T10:00:00Z",
        executedAt: "2025-03-15T14:30:00Z",
        executedBy: "Verification Team"
      },
      {
        planId: "VER-DP-2025-001-002",
        title: "Database Schema Verification Plan", 
        description: "Verification of database design against data requirements",
        verificationMethod: "technical_review",
        priority: "high",
        status: "executed",
        executionProgress: 100,
        linkedOutputs: ["DO-DP-2025-001-002"],
        testCases: ["TC-VER-003", "TC-VER-004"],
        createdAt: "2025-03-15T11:00:00Z",
        executedAt: "2025-03-20T16:00:00Z",
        executedBy: "Database Team"
      },
      {
        planId: "VER-DP-2025-001-003",
        title: "UI Design Verification Plan",
        description: "Verification of user interface design against usability requirements",
        verificationMethod: "usability_testing",
        priority: "high",
        status: "in_progress",
        executionProgress: 60,
        linkedOutputs: ["DO-DP-2025-001-003"],
        testCases: ["TC-VER-005", "TC-VER-006"],
        createdAt: "2025-03-20T09:00:00Z",
        executedAt: null,
        executedBy: null
      }
    ];
    
    res.json(verificationPlans);
  } catch (error) {
    console.error("Error fetching verification plans:", error);
    res.status(500).json({ error: "Failed to fetch verification plans" });
  }
});

// Validation Plans endpoint
router.get("/validation-plans", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const validationPlans = [
      {
        planId: "VAL-DP-2025-001-001",
        title: "End-User Validation Protocol",
        description: "Validation of complete system against user needs and intended use",
        validationMethod: "user_acceptance_testing",
        priority: "critical",
        status: "planned",
        executionProgress: 0,
        linkedRequirements: ["UR-DP-2025-001-001", "UR-DP-2025-001-002"],
        testScenarios: ["VAL-SCENARIO-001", "VAL-SCENARIO-002"],
        createdAt: "2025-03-25T10:00:00Z",
        scheduledDate: "2025-05-01T09:00:00Z",
        validationTeam: "Clinical Users"
      },
      {
        planId: "VAL-DP-2025-001-002",
        title: "Regulatory Compliance Validation",
        description: "Validation of regulatory compliance requirements including ISO 13485 and 21 CFR Part 11",
        validationMethod: "compliance_audit",
        priority: "critical",
        status: "planned",
        executionProgress: 0,
        linkedRequirements: ["URS-EQMS-001", "URS-EQMS-003"],
        testScenarios: ["VAL-COMPLIANCE-001", "VAL-COMPLIANCE-002"],
        createdAt: "2025-03-25T11:00:00Z",
        scheduledDate: "2025-05-15T09:00:00Z",
        validationTeam: "Quality Assurance"
      }
    ];
    
    res.json(validationPlans);
  } catch (error) {
    console.error("Error fetching validation plans:", error);
    res.status(500).json({ error: "Failed to fetch validation plans" });
  }
});

// Test Cases endpoint
router.get("/test-cases", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const testCases = [
      {
        testId: "TC-VER-001",
        title: "Architecture Component Integration Test",
        description: "Verify all system components integrate correctly per architecture specification",
        testType: "integration",
        priority: "critical",
        status: "passed",
        linkedPlan: "VER-DP-2025-001-001",
        linkedOutput: "DO-DP-2025-001-001",
        executionDate: "2025-03-15T10:00:00Z",
        result: "passed",
        createdAt: "2025-03-10T10:00:00Z"
      },
      {
        testId: "TC-VER-002",
        title: "Performance Requirements Verification",
        description: "Verify system meets performance requirements defined in architecture",
        testType: "performance",
        priority: "high",
        status: "passed",
        linkedPlan: "VER-DP-2025-001-001",
        linkedOutput: "DO-DP-2025-001-001",
        executionDate: "2025-03-15T14:00:00Z",
        result: "passed",
        createdAt: "2025-03-10T11:00:00Z"
      },
      {
        testId: "TC-VER-003",
        title: "Database Constraint Verification",
        description: "Verify all database constraints and relationships work as designed",
        testType: "functional",
        priority: "high",
        status: "passed",
        linkedPlan: "VER-DP-2025-001-002",
        linkedOutput: "DO-DP-2025-001-002",
        executionDate: "2025-03-20T11:00:00Z",
        result: "passed",
        createdAt: "2025-03-15T12:00:00Z"
      }
    ];
    
    res.json(testCases);
  } catch (error) {
    console.error("Error fetching test cases:", error);
    res.status(500).json({ error: "Failed to fetch test cases" });
  }
});

// Risk Controls endpoint
router.get("/risk-controls", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const riskControls = [
      {
        controlId: "RC-DP-2025-001-001",
        title: "Data Backup and Recovery Control",
        description: "Automated backup system to prevent data loss",
        riskCategory: "data_integrity",
        priority: "critical",
        status: "implemented",
        implementationStatus: "implemented",
        linkedRisk: "RISK-001",
        controlType: "preventive",
        effectivenessRating: "high",
        createdAt: "2025-02-01T10:00:00Z",
        implementedAt: "2025-02-15T14:00:00Z",
        verifiedAt: "2025-02-20T10:00:00Z"
      },
      {
        controlId: "RC-DP-2025-001-002",
        title: "Access Control and Authentication",
        description: "Multi-factor authentication and role-based access control",
        riskCategory: "security",
        priority: "critical",
        status: "implemented",
        implementationStatus: "implemented",
        linkedRisk: "RISK-002",
        controlType: "preventive",
        effectivenessRating: "high",
        createdAt: "2025-02-01T11:00:00Z",
        implementedAt: "2025-02-10T16:00:00Z",
        verifiedAt: "2025-02-15T12:00:00Z"
      },
      {
        controlId: "RC-DP-2025-001-003",
        title: "Input Validation Controls",
        description: "Comprehensive input validation to prevent data corruption",
        riskCategory: "data_quality",
        priority: "high",
        status: "implemented",
        implementationStatus: "implemented",
        linkedRisk: "RISK-003",
        controlType: "preventive",
        effectivenessRating: "medium",
        createdAt: "2025-02-05T09:00:00Z",
        implementedAt: "2025-02-25T13:00:00Z",
        verifiedAt: "2025-03-01T15:00:00Z"
      }
    ];
    
    res.json(riskControls);
  } catch (error) {
    console.error("Error fetching risk controls:", error);
    res.status(500).json({ error: "Failed to fetch risk controls" });
  }
});

// Traceability Links endpoint
router.get("/traceability-links", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const traceabilityLinks = [
      {
        id: 1,
        linkId: "TL-DP-2025-001-001",
        sourceType: "user_requirement",
        sourceIdentifier: "UR-DP-2025-001-001",
        targetType: "design_input", 
        targetIdentifier: "DI-DP-2025-001-001",
        linkType: "derives",
        traceabilityStrength: "direct",
        isActive: true,
        verificationStatus: "verified",
        lastVerified: "2025-06-21T00:00:00Z",
        verificationMethod: "design_review"
      },
      {
        id: 2,
        linkId: "TL-DP-2025-001-002", 
        sourceType: "user_requirement",
        sourceIdentifier: "UR-DP-2025-001-002",
        targetType: "design_input",
        targetIdentifier: "DI-DP-2025-001-002",
        linkType: "derives",
        traceabilityStrength: "direct",
        isActive: true,
        verificationStatus: "verified",
        lastVerified: "2025-06-21T00:00:00Z",
        verificationMethod: "design_review"
      },
      {
        id: 3,
        linkId: "TL-DP-2025-001-003",
        sourceType: "design_input",
        sourceIdentifier: "DI-DP-2025-001-001",
        targetType: "design_output",
        targetIdentifier: "DO-DP-2025-001-001",
        linkType: "implements",
        traceabilityStrength: "direct",
        isActive: true,
        verificationStatus: "verified",
        lastVerified: "2025-06-21T00:00:00Z",
        verificationMethod: "technical_review"
      },
      {
        id: 4,
        linkId: "TL-DP-2025-001-004",
        sourceType: "design_input",
        sourceIdentifier: "DI-DP-2025-001-002",
        targetType: "design_output",
        targetIdentifier: "DO-DP-2025-001-002",
        linkType: "implements",
        traceabilityStrength: "direct",
        isActive: true,
        verificationStatus: "verified",
        lastVerified: "2025-06-21T00:00:00Z",
        verificationMethod: "technical_review"
      }
    ];
    
    res.json(traceabilityLinks);
  } catch (error) {
    console.error("Error fetching traceability links:", error);
    res.status(500).json({ error: "Failed to fetch traceability links" });
  }
});

// Create new traceability link
router.post("/traceability-links", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { sourceType, sourceIdentifier, targetType, targetIdentifier, linkType, traceabilityStrength } = req.body;
    
    // Validate required fields
    if (!sourceType || !sourceIdentifier || !targetType || !targetIdentifier || !linkType) {
      return res.status(400).json({ error: "Missing required fields for link creation" });
    }
    
    // Generate unique link ID
    const linkId = `TL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const newLink = {
      id: Date.now(),
      linkId,
      sourceType,
      sourceIdentifier,
      targetType,
      targetIdentifier,
      linkType: linkType || 'derives',
      traceabilityStrength: traceabilityStrength || 'direct',
      isActive: true,
      verificationStatus: 'pending',
      lastVerified: null,
      verificationMethod: null,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || 9999
    };
    
    // In a real implementation, this would save to database
    console.log("Creating new traceability link:", newLink);
    
    res.status(201).json(newLink);
  } catch (error) {
    console.error("Error creating traceability link:", error);
    res.status(500).json({ error: "Failed to create traceability link" });
  }
});

// Delete traceability link
router.delete("/traceability-links/:linkId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { linkId } = req.params;
    
    // In a real implementation, this would delete from database
    console.log("Deleting traceability link:", linkId);
    
    res.json({ message: "Traceability link deleted successfully" });
  } catch (error) {
    console.error("Error deleting traceability link:", error);
    res.status(500).json({ error: "Failed to delete traceability link" });
  }
});

// Get available link targets for a source item
router.get("/link-targets/:sourceType/:sourceId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { sourceType, sourceId } = req.params;
    
    // Define valid downstream targets for each source type
    const linkTargets = {
      'user_requirement': ['design_input'],
      'urs_requirement': ['design_input'],
      'design_input': ['design_output'],
      'design_output': ['verification', 'test_case'],
      'verification': ['validation'],
      'test_case': ['validation'],
      'validation': ['risk_control']
    };
    
    const validTargetTypes = linkTargets[sourceType] || [];
    
    // Get all available items of valid target types
    const availableTargets = [];
    
    // This would normally query the database for available targets
    // For now, returning sample data structure
    res.json({
      sourceType,
      sourceId,
      validTargetTypes,
      availableTargets: []
    });
  } catch (error) {
    console.error("Error fetching link targets:", error);
    res.status(500).json({ error: "Failed to fetch link targets" });
  }
});

// Enhanced traceability coverage metrics
router.get("/traceability-coverage", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const coverage = {
      totalRequirements: 15,
      linkedRequirements: 13,
      coveragePercentage: 87,
      missingLinks: 2,
      partialLinks: 3,
      directLinks: 18,
      indirectLinks: 7,
      byType: {
        urs_requirement: { total: 3, linked: 3, coverage: 100 },
        user_need: { total: 2, linked: 2, coverage: 100 },
        design_input: { total: 4, linked: 4, coverage: 100 },
        design_output: { total: 3, linked: 3, coverage: 100 },
        verification: { total: 3, linked: 2, coverage: 67 },
        validation: { total: 2, linked: 1, coverage: 50 },
        test_case: { total: 3, linked: 3, coverage: 100 },
        risk_control: { total: 3, linked: 3, coverage: 100 }
      },
      complianceMetrics: {
        iso13485Coverage: 92,
        iec62304Coverage: 85,
        cfrPart11Coverage: 95,
        regulatoryRequirementsTraced: 8,
        totalRegulatoryRequirements: 9
      }
    };
    
    res.json(coverage);
  } catch (error) {
    console.error("Error fetching traceability coverage:", error);
    res.status(500).json({ error: "Failed to fetch traceability coverage" });
  }
});

export default router;
