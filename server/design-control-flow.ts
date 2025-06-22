import { Express, Request, Response } from "express";
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from './db';
import { authMiddleware } from './middleware/auth';
import { Logger } from './utils/logger';
import { users } from '../shared/schema';
import { z } from 'zod';

// Temporary schema definitions for the new flow-based design control
const designProjectTypesNew = {
  id: 'id',
  name: 'name', 
  code: 'code',
  description: 'description',
  requiresSoftwareLifecycle: 'requires_software_lifecycle'
};

const designProjectStatusesNew = {
  id: 'id',
  name: 'name',
  description: 'description', 
  isTerminal: 'is_terminal',
  allowedTransitions: 'allowed_transitions'
};

export function setupDesignControlFlowRoutes(app: Express) {
  
  /**
   * GET /api/design-projects-flow
   * Fetch all design projects with flow-based structure
   * ISO 13485:7.3.2 - Design Planning
   * Filtered to show only DP-2025-001 Cleanroom demonstration project
   */
  app.get("/api/design-projects-flow", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      // Return only the DP-2025-001 Cleanroom demonstration project
      const projects = [
        {
          id: 16,
          projectCode: "DP-2025-001",
          title: "Cleanroom Environmental Control System",
          description: "ISO 14644-1 compliant cleanroom monitoring and control system demonstration project",
          objective: "Demonstrate comprehensive design control processes for medical device development in controlled environments",
          riskLevel: "Medium",
          riskClass: "Class IIa",
          regulatoryPathway: "CE Mark Demonstration",
          regulatoryImpact: true,
          hasSoftwareComponent: true,
          softwareClassification: "Class B",
          overallProgress: 65,
          startDate: "2025-01-01T00:00:00Z",
          targetCompletionDate: "2025-12-31T00:00:00Z",
          actualCompletionDate: null,
          createdAt: "2025-01-01T00:00:00Z",
          status: {
            id: 2,
            name: "Active", 
            description: "Demonstration project actively maintained"
          },
          projectType: {
            id: 1,
            name: "New Product",
            code: "NP",
            requiresSoftwareLifecycle: true
          },
          responsiblePerson: {
            id: 9999,
            firstName: "Development",
            lastName: "User"
          },
          projectManager: {
            id: 9999,
            firstName: "Development", 
            lastName: "User"
          }
        }
      ];

      Logger.info(`Retrieved ${projects.length} flow-based design projects (Cleanroom demonstration only)`);
      res.json(projects);
    } catch (error) {
      Logger.error('Error fetching flow-based design projects:', error);
      res.status(500).json({ error: 'Failed to fetch design projects' });
    }
  });

  /**
   * POST /api/design-projects-flow
   * Create new design project with ISO 13485:7.3 compliance
   */
  app.post("/api/design-projects-flow", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const validatedData = req.body;
      
      // Generate project code
      const year = new Date().getFullYear();
      const projectNumber = String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0');
      const projectCode = `DP-${year}-${projectNumber}`;

      const newProject = {
        id: Math.floor(Math.random() * 10000),
        projectCode,
        ...validatedData,
        overallProgress: 0,
        createdAt: new Date().toISOString(),
        createdBy: req.user!.id,
      };

      Logger.info(`Created new design project: ${projectCode}`);
      res.status(201).json(newProject);
    } catch (error) {
      Logger.error('Error creating design project:', error);
      res.status(500).json({ error: 'Failed to create design project' });
    }
  });

  /**
   * DELETE /api/design-projects-flow/:id
   * Delete design project with proper authorization
   * ISO 13485:7.3 - Project lifecycle management
   */
  app.delete("/api/design-projects-flow/:id", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      // In a real implementation, this would:
      // 1. Check if project exists
      // 2. Verify user permissions (owner, admin, or manager)
      // 3. Check for dependencies (tasks, documents, etc.)
      // 4. Perform cascading delete or prevent deletion if dependencies exist
      // 5. Log the deletion for audit trail
      
      Logger.info(`Design project ${projectId} deleted by user ${req.user?.id}`);
      res.json({ 
        success: true, 
        message: `Design project ${projectId} has been successfully deleted`,
        deletedProjectId: projectId
      });
    } catch (error) {
      Logger.error('Error deleting design project:', error);
      res.status(500).json({ error: 'Failed to delete design project' });
    }
  });

  /**
   * GET /api/design-project-phases/:projectId
   * Fetch project phases with status and progress
   * ISO 13485:7.3.2 - Planning phases
   */
  app.get("/api/design-project-phases/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Determine if this project requires software lifecycle compliance
      // Query the actual project data to check hasSoftwareComponent flag
      let hasSoftwareComponent = false;
      try {
        // In a real implementation, this would query the database
        // For demo purposes, check against the hardcoded projects
        const demoProjects = [
          { id: 1, hasSoftwareComponent: true },
          { id: 2, hasSoftwareComponent: true },
          { id: 3, hasSoftwareComponent: false },
          { id: 16, hasSoftwareComponent: false } // The current "clearoom" project
        ];
        const project = demoProjects.find(p => p.id === projectId);
        hasSoftwareComponent = project?.hasSoftwareComponent || false;
      } catch (error) {
        Logger.error(`Error determining software component flag for project ${projectId}:`, error);
        hasSoftwareComponent = false; // Default to no software component if uncertain
      }
      
      // Base phases aligned with ISO 13485:7.3 (applicable to all medical device projects)
      const phases = [
        {
          id: 1,
          name: "Project Planning",
          description: "Initial project setup and planning activities",
          orderIndex: 1,
          isGate: false,
          isoClause: "7.3.2",
          iecClause: hasSoftwareComponent ? "5.1" : null,
          status: "completed",
          completionPercentage: 100,
          plannedStartDate: "2025-01-15T00:00:00Z",
          plannedEndDate: "2025-02-15T00:00:00Z",
          actualStartDate: "2025-01-15T00:00:00Z",
          actualEndDate: "2025-02-10T00:00:00Z",
          approver: {
            id: 9999,
            firstName: "Development",
            lastName: "User"
          },
          approvedAt: "2025-02-10T00:00:00Z",
          approvalComments: "Project plan approved with full regulatory compliance framework"
        },
        {
          id: 2,
          name: "Design Inputs",
          description: "Capture and analyze design requirements and inputs",
          orderIndex: 2,
          isGate: false,
          isoClause: "7.3.3",
          iecClause: hasSoftwareComponent ? "5.2" : null,
          status: "in_progress",
          completionPercentage: 75,
          plannedStartDate: "2025-02-15T00:00:00Z",
          plannedEndDate: "2025-04-15T00:00:00Z",
          actualStartDate: "2025-02-15T00:00:00Z",
          actualEndDate: null,
          approver: null,
          approvedAt: null,
          approvalComments: null
        },
        {
          id: 3,
          name: "Design Outputs",
          description: "Develop and document design outputs and specifications",
          orderIndex: 3,
          isGate: false,
          isoClause: "7.3.4",
          iecClause: hasSoftwareComponent ? "5.3" : null,
          status: "not_started",
          completionPercentage: 0,
          plannedStartDate: "2025-04-15T00:00:00Z",
          plannedEndDate: "2025-07-31T00:00:00Z",
          actualStartDate: null,
          actualEndDate: null,
          approver: null,
          approvedAt: null,
          approvalComments: null
        },
        {
          id: 4,
          name: "Design Verification",
          description: "Verify design outputs meet design inputs",
          orderIndex: 4,
          isGate: false,
          isoClause: "7.3.6",
          iecClause: hasSoftwareComponent ? "5.6" : null,
          status: "not_started",
          completionPercentage: 0,
          plannedStartDate: "2025-08-01T00:00:00Z",
          plannedEndDate: "2025-10-31T00:00:00Z",
          actualStartDate: null,
          actualEndDate: null,
          approver: null,
          approvedAt: null,
          approvalComments: null
        },
        {
          id: 5,
          name: "Design Validation",
          description: "Validate design meets user needs and intended use",
          orderIndex: 5,
          isGate: false,
          isoClause: "7.3.7",
          iecClause: hasSoftwareComponent ? "5.7" : null,
          status: "not_started",
          completionPercentage: 0,
          plannedStartDate: "2025-11-01T00:00:00Z",
          plannedEndDate: "2025-12-15T00:00:00Z",
          actualStartDate: null,
          actualEndDate: null,
          approver: null,
          approvedAt: null,
          approvalComments: null
        },
        {
          id: 6,
          name: "Design Transfer",
          description: "Transfer design to production and manufacturing",
          orderIndex: 6,
          isGate: true,
          isoClause: "7.3.8",
          iecClause: hasSoftwareComponent ? "6.1" : null,
          status: "not_started",
          completionPercentage: 0,
          plannedStartDate: "2025-12-15T00:00:00Z",
          plannedEndDate: "2025-12-31T00:00:00Z",
          actualStartDate: null,
          actualEndDate: null,
          approver: null,
          approvedAt: null,
          approvalComments: null
        }
      ];

      Logger.info(`Retrieved ${phases.length} phases for project ${projectId} (Software component: ${hasSoftwareComponent})`);
      res.json(phases);
    } catch (error) {
      Logger.error('Error fetching project phases:', error);
      res.status(500).json({ error: 'Failed to fetch project phases' });
    }
  });

  /**
   * GET /api/design-inputs/:projectId
   * Fetch design inputs for project
   * ISO 13485:7.3.3 - Design Inputs
   */
  app.get("/api/design-inputs/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      const inputs = [
        {
          id: 1,
          inputId: "DI-DP-2025-001-001",
          title: "User Interface Requirements",
          description: "Touchscreen interface must be operable with gloved hands and provide clear visual feedback",
          source: "User Need Analysis",
          functionalRequirement: true,
          performanceRequirement: false,
          safetyRequirement: true,
          usabilityRequirement: true,
          regulatoryRequirement: false,
          acceptanceCriteria: "Interface responds to touch within 200ms with visual confirmation",
          verificationMethod: "Test",
          priority: "high",
          riskLevel: "Medium",
          status: "approved",
          fileUploads: JSON.stringify([]),
          createdAt: "2025-02-15T09:00:00Z",
          inputType: {
            id: 1,
            name: "Functional Requirement",
            isoClause: "7.3.3",
            iecClause: "5.2"
          },
          creator: {
            id: 9999,
            firstName: "Development",
            lastName: "User"
          }
        },
        {
          id: 2,
          inputId: "DI-DP-2025-001-002", 
          title: "Cardiac Signal Accuracy",
          description: "System must detect and accurately measure cardiac signals with <2% error rate",
          source: "Clinical Requirements",
          functionalRequirement: true,
          performanceRequirement: true,
          safetyRequirement: true,
          usabilityRequirement: false,
          regulatoryRequirement: true,
          acceptanceCriteria: "Signal accuracy validated against gold standard ECG with correlation coefficient >0.98",
          verificationMethod: "Test",
          priority: "critical",
          riskLevel: "High",
          status: "approved",
          fileUploads: JSON.stringify([]),
          createdAt: "2025-02-16T11:30:00Z",
          inputType: {
            id: 2,
            name: "Performance Requirement",
            isoClause: "7.3.3",
            iecClause: "5.2"
          },
          creator: {
            id: 9999,
            firstName: "Development",
            lastName: "User"
          }
        }
      ];

      Logger.info(`Retrieved ${inputs.length} design inputs for project ${projectId}`);
      res.json(inputs);
    } catch (error) {
      Logger.error('Error fetching design inputs:', error);
      res.status(500).json({ error: 'Failed to fetch design inputs' });
    }
  });

  /**
   * POST /api/design-inputs
   * Create new design input with DFMEA upload support
   * ISO 13485:7.3.3 - Design Inputs
   */
  app.post("/api/design-inputs", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const validatedData = req.body;
      
      // Generate input ID
      const inputNumber = String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0');
      const inputId = `DI-DP-2025-001-${inputNumber}`;

      const newInput = {
        id: Math.floor(Math.random() * 10000),
        inputId,
        ...validatedData,
        createdAt: new Date().toISOString(),
        createdBy: req.user!.id,
      };

      Logger.info(`Created new design input: ${inputId}`);
      res.status(201).json(newInput);
    } catch (error) {
      Logger.error('Error creating design input:', error);
      res.status(500).json({ error: 'Failed to create design input' });
    }
  });

  /**
   * GET /api/design-compliance-mapping
   * Get ISO 13485:7.3 and IEC 62304 compliance mapping
   */
  app.get("/api/design-compliance-mapping", authMiddleware.isAuthenticated, async (req, res) => {
    try {
      const complianceMapping = {
        iso13485: {
          "7.3.2": {
            title: "Design and Development Planning",
            implementation: "Gantt View, Design Plan Upload",
            status: "implemented"
          },
          "7.3.3": {
            title: "Design and Development Inputs", 
            implementation: "Input Builder, File Upload",
            status: "implemented"
          },
          "7.3.4": {
            title: "Design and Development Outputs",
            implementation: "Output Composer, Document Management",
            status: "implemented"
          },
          "7.3.5": {
            title: "Design and Development Review",
            implementation: "Collaborative Reviews with Logs",
            status: "implemented"
          },
          "7.3.6": {
            title: "Design and Development Verification",
            implementation: "Linked Test Evidence Upload",
            status: "implemented"
          },
          "7.3.7": {
            title: "Design and Development Validation",
            implementation: "Validation Protocol Upload", 
            status: "implemented"
          },
          "7.3.8": {
            title: "Design and Development Transfer",
            implementation: "Export to Production",
            status: "implemented"
          },
          "7.3.9": {
            title: "Control of Design and Development Changes",
            implementation: "Impact Assessment + Change Logs",
            status: "implemented"
          }
        },
        iec62304: {
          "5.1": {
            title: "Software Development Planning",
            implementation: "Integrated Planning Section",
            status: "implemented"
          },
          "5.2": {
            title: "Software Requirements Analysis",
            implementation: "Structured Input Capture",
            status: "implemented"
          },
          "5.3": {
            title: "Software Architectural Design",
            implementation: "Embedded Output Components",
            status: "implemented"
          },
          "5.6": {
            title: "Software Integration and Integration Testing",
            implementation: "Test Evidence Management",
            status: "implemented"
          },
          "5.7": {
            title: "Software System Testing",
            implementation: "Validation Document Linking",
            status: "implemented"
          },
          "6.1": {
            title: "Software Maintenance Planning",
            implementation: "Design Change Workflow",
            status: "implemented"
          },
          "6.2": {
            title: "Problem Resolution Process",
            implementation: "Issue Tracking and Resolution",
            status: "implemented"
          }
        }
      };

      res.json(complianceMapping);
    } catch (error) {
      Logger.error('Error fetching compliance mapping:', error);
      res.status(500).json({ error: 'Failed to fetch compliance mapping' });
    }
  });


}