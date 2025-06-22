import { Express, Request, Response } from "express";
import { storage } from "./storage";
import {
  designProjects,
  designProjectTypes,
  designProjectStatuses,
  designModelTypes,
  riskClassifications,
  userNeeds,
  designInputs,
  designOutputs,
  verificationPlans,
  validationPlans,
  traceabilityLinks,
  designReviews,
  softwareRequirements,
  softwareArchitecture,
  softwareUnits,
  designDocuments,
  insertDesignProjectSchema,
  insertUserNeedSchema,
  insertDesignInputSchema,
  insertDesignOutputSchema,
  insertVerificationPlanSchema,
  insertValidationPlanSchema,
  insertDesignDocumentSchema
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";

export function setupDesignControlRoutes(app: Express) {
  // Design Project Types (lookup)
  app.get("/api/design/project-types", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const types = await storage.getDesignProjectTypes();
      return res.json(types);
    } catch (error) {
      console.error("Error fetching design project types:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Design Project Statuses (lookup)
  app.get("/api/design/project-statuses", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const statuses = await storage.getDesignProjectStatuses();
      return res.json(statuses);
    } catch (error) {
      console.error("Error fetching design project statuses:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Design Model Types (lookup)
  app.get("/api/design/model-types", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const modelTypes = await storage.getDesignModelTypes();
      return res.json(modelTypes);
    } catch (error) {
      console.error("Error fetching design model types:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Risk Classifications (lookup)
  app.get("/api/design/risk-classifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const classifications = await storage.getRiskClassifications();
      return res.json(classifications);
    } catch (error) {
      console.error("Error fetching risk classifications:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Design Projects
  app.get("/api/design/projects", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projects = await storage.getDesignProjects();
      return res.json(projects);
    } catch (error) {
      console.error("Error fetching design projects:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/design/projects/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getDesignProject(id);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      return res.json(project);
    } catch (error) {
      console.error("Error fetching design project:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/design/projects", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const parseResult = insertDesignProjectSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid project data", errors: parseResult.error.errors });
      }

      // Add project code if not provided
      if (!parseResult.data.projectCode) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Get count of existing projects for this year to generate a unique ID
        const existingProjects = await db
          .select({ count: db.fn.count() })
          .from(designProjects)
          .where(eq(designProjects.projectCode, `DEV-${year}-%`));
        
        const count = parseInt(existingProjects[0]?.count as string || '0') + 1;
        const projectCode = `DEV-${year}-${String(count).padStart(3, '0')}`;
        parseResult.data.projectCode = projectCode;
      }
      
      // Add current user as initiator if not provided
      if (!parseResult.data.initiatedBy) {
        parseResult.data.initiatedBy = req.user.id;
      }
      
      const project = await storage.createDesignProject(parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Created",
        entityType: "design_project",
        entityId: project.id,
        details: `Design project ${project.title} (${project.projectCode}) was created`,
        timestamp: new Date()
      });
      
      return res.status(201).json(project);
    } catch (error) {
      console.error("Error creating design project:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/design/projects/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const existingProject = await storage.getDesignProject(id);
      if (!existingProject) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Validate update data
      const updateSchema = insertDesignProjectSchema.partial();
      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid project data", errors: parseResult.error.errors });
      }
      
      const updatedProject = await storage.updateDesignProject(id, parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Updated",
        entityType: "design_project",
        entityId: id,
        details: `Design project ${updatedProject.title} (${updatedProject.projectCode}) was updated`,
        timestamp: new Date()
      });
      
      return res.json(updatedProject);
    } catch (error) {
      console.error("Error updating design project:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Needs
  app.get("/api/design/projects/:projectId/user-needs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const needs = await storage.getUserNeeds(projectId);
      return res.json(needs);
    } catch (error) {
      console.error("Error fetching user needs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/design/projects/:projectId/user-needs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Validate user need data
      const parseResult = insertUserNeedSchema.safeParse({
        ...req.body,
        projectId,
        createdBy: req.user.id
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid user need data", errors: parseResult.error.errors });
      }
      
      // Generate need code if not provided
      if (!parseResult.data.needCode) {
        // Get count of existing needs for this project to generate a unique ID
        const existingNeeds = await db
          .select({ count: db.fn.count() })
          .from(userNeeds)
          .where(eq(userNeeds.projectId, projectId));
        
        const count = parseInt(existingNeeds[0]?.count as string || '0') + 1;
        const needCode = `UN-${String(count).padStart(3, '0')}`;
        parseResult.data.needCode = needCode;
      }
      
      const userNeed = await storage.createUserNeed(parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Created",
        entityType: "user_need",
        entityId: userNeed.id,
        details: `User need ${userNeed.needCode} was created for project ${project.projectCode}`,
        timestamp: new Date()
      });
      
      return res.status(201).json(userNeed);
    } catch (error) {
      console.error("Error creating user need:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Design Inputs
  app.get("/api/design/projects/:projectId/design-inputs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const inputs = await storage.getDesignInputs(projectId);
      return res.json(inputs);
    } catch (error) {
      console.error("Error fetching design inputs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/design/projects/:projectId/design-inputs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Validate design input data
      const parseResult = insertDesignInputSchema.safeParse({
        ...req.body,
        projectId,
        createdBy: req.user.id
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid design input data", errors: parseResult.error.errors });
      }
      
      // Generate input code if not provided
      if (!parseResult.data.inputCode) {
        // Get count of existing inputs for this project to generate a unique ID
        const existingInputs = await db
          .select({ count: db.fn.count() })
          .from(designInputs)
          .where(eq(designInputs.projectId, projectId));
        
        const count = parseInt(existingInputs[0]?.count as string || '0') + 1;
        const inputCode = `DI-${String(count).padStart(3, '0')}`;
        parseResult.data.inputCode = inputCode;
      }
      
      const designInput = await storage.createDesignInput(parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Created",
        entityType: "design_input",
        entityId: designInput.id,
        details: `Design input ${designInput.inputCode} was created for project ${project.projectCode}`,
        timestamp: new Date()
      });
      
      return res.status(201).json(designInput);
    } catch (error) {
      console.error("Error creating design input:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Design Outputs
  app.get("/api/design/projects/:projectId/design-outputs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const outputs = await storage.getDesignOutputs(projectId);
      return res.json(outputs);
    } catch (error) {
      console.error("Error fetching design outputs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/design/projects/:projectId/design-outputs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Validate design output data
      const parseResult = insertDesignOutputSchema.safeParse({
        ...req.body,
        projectId,
        createdBy: req.user.id
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid design output data", errors: parseResult.error.errors });
      }
      
      // Generate output code if not provided
      if (!parseResult.data.outputCode) {
        // Get count of existing outputs for this project to generate a unique ID
        const existingOutputs = await db
          .select({ count: db.fn.count() })
          .from(designOutputs)
          .where(eq(designOutputs.projectId, projectId));
        
        const count = parseInt(existingOutputs[0]?.count as string || '0') + 1;
        const outputCode = `DO-${String(count).padStart(3, '0')}`;
        parseResult.data.outputCode = outputCode;
      }
      
      const designOutput = await storage.createDesignOutput(parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Created",
        entityType: "design_output",
        entityId: designOutput.id,
        details: `Design output ${designOutput.outputCode} was created for project ${project.projectCode}`,
        timestamp: new Date()
      });
      
      return res.status(201).json(designOutput);
    } catch (error) {
      console.error("Error creating design output:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verification Plans
  app.get("/api/design/projects/:projectId/verification-plans", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const plans = await storage.getVerificationPlans(projectId);
      return res.json(plans);
    } catch (error) {
      console.error("Error fetching verification plans:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/design/projects/:projectId/verification-plans", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Validate verification plan data
      const parseResult = insertVerificationPlanSchema.safeParse({
        ...req.body,
        projectId,
        createdBy: req.user.id
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid verification plan data", errors: parseResult.error.errors });
      }
      
      // Generate plan code if not provided
      if (!parseResult.data.planCode) {
        // Get count of existing plans for this project to generate a unique ID
        const existingPlans = await db
          .select({ count: db.fn.count() })
          .from(verificationPlans)
          .where(eq(verificationPlans.projectId, projectId));
        
        const count = parseInt(existingPlans[0]?.count as string || '0') + 1;
        const planCode = `VTP-${String(count).padStart(3, '0')}`;
        parseResult.data.planCode = planCode;
      }
      
      const plan = await storage.createVerificationPlan(parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Created",
        entityType: "verification_plan",
        entityId: plan.id,
        details: `Verification plan ${plan.planCode} was created for project ${project.projectCode}`,
        timestamp: new Date()
      });
      
      return res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating verification plan:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Validation Plans
  app.get("/api/design/projects/:projectId/validation-plans", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const plans = await storage.getValidationPlans(projectId);
      return res.json(plans);
    } catch (error) {
      console.error("Error fetching validation plans:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/design/projects/:projectId/validation-plans", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Validate validation plan data
      const parseResult = insertValidationPlanSchema.safeParse({
        ...req.body,
        projectId,
        createdBy: req.user.id
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid validation plan data", errors: parseResult.error.errors });
      }
      
      // Generate plan code if not provided
      if (!parseResult.data.planCode) {
        // Get count of existing plans for this project to generate a unique ID
        const existingPlans = await db
          .select({ count: db.fn.count() })
          .from(validationPlans)
          .where(eq(validationPlans.projectId, projectId));
        
        const count = parseInt(existingPlans[0]?.count as string || '0') + 1;
        const planCode = `VAL-${String(count).padStart(3, '0')}`;
        parseResult.data.planCode = planCode;
      }
      
      const plan = await storage.createValidationPlan(parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Created",
        entityType: "validation_plan",
        entityId: plan.id,
        details: `Validation plan ${plan.planCode} was created for project ${project.projectCode}`,
        timestamp: new Date()
      });
      
      return res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating validation plan:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Traceability Matrix
  app.get("/api/design/projects/:projectId/traceability", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const links = await storage.getTraceabilityLinks(projectId);
      return res.json(links);
    } catch (error) {
      console.error("Error fetching traceability links:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Project Statistics
  app.get("/api/design/projects/:projectId/statistics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Get counts of various entities related to this project
      const userNeedsCount = await db
        .select({ count: db.fn.count() })
        .from(userNeeds)
        .where(eq(userNeeds.projectId, projectId));
      
      const designInputsCount = await db
        .select({ count: db.fn.count() })
        .from(designInputs)
        .where(eq(designInputs.projectId, projectId));
      
      const designOutputsCount = await db
        .select({ count: db.fn.count() })
        .from(designOutputs)
        .where(eq(designOutputs.projectId, projectId));
      
      const verificationPlansCount = await db
        .select({ count: db.fn.count() })
        .from(verificationPlans)
        .where(eq(verificationPlans.projectId, projectId));
      
      const validationPlansCount = await db
        .select({ count: db.fn.count() })
        .from(validationPlans)
        .where(eq(validationPlans.projectId, projectId));
      
      const designReviewsCount = await db
        .select({ count: db.fn.count() })
        .from(designReviews)
        .where(eq(designReviews.projectId, projectId));
      
      const softwareReqCount = project.hasSoftwareComponent ? 
        await db
          .select({ count: db.fn.count() })
          .from(softwareRequirements)
          .where(eq(softwareRequirements.projectId, projectId)) : 
        [{ count: 0 }];
      
      const architectureCount = project.hasSoftwareComponent ? 
        await db
          .select({ count: db.fn.count() })
          .from(softwareArchitecture)
          .where(eq(softwareArchitecture.projectId, projectId)) : 
        [{ count: 0 }];
      
      const unitsCount = project.hasSoftwareComponent ? 
        await db
          .select({ count: db.fn.count() })
          .from(softwareUnits)
          .where(eq(softwareUnits.projectId, projectId)) : 
        [{ count: 0 }];
      
      const documentsCount = await db
        .select({ count: db.fn.count() })
        .from(designDocuments)
        .where(eq(designDocuments.projectId, projectId));
      
      // Calculate completion percentage based on project phase
      let completionPercentage = 0;
      const totalPhases = 5; // Planning, Design Input, Design Output, Verification, Validation
      
      switch (project.statusId) {
        case 1: // Planning
          completionPercentage = 10;
          break;
        case 2: // Design Input
          completionPercentage = 30;
          break;
        case 3: // Design Output
          completionPercentage = 50;
          break;
        case 4: // Verification
          completionPercentage = 70;
          break;
        case 5: // Validation
          completionPercentage = 90;
          break;
        case 6: // Completed
          completionPercentage = 100;
          break;
        default:
          completionPercentage = 0;
      }
      
      return res.json({
        userNeedsCount: parseInt(userNeedsCount[0]?.count as string || '0'),
        designInputsCount: parseInt(designInputsCount[0]?.count as string || '0'),
        designOutputsCount: parseInt(designOutputsCount[0]?.count as string || '0'),
        verificationPlansCount: parseInt(verificationPlansCount[0]?.count as string || '0'),
        validationPlansCount: parseInt(validationPlansCount[0]?.count as string || '0'),
        designReviewsCount: parseInt(designReviewsCount[0]?.count as string || '0'),
        softwareRequirementsCount: parseInt(softwareReqCount[0]?.count as string || '0'),
        softwareArchitectureCount: parseInt(architectureCount[0]?.count as string || '0'),
        softwareUnitsCount: parseInt(unitsCount[0]?.count as string || '0'),
        documentsCount: parseInt(documentsCount[0]?.count as string || '0'),
        completionPercentage
      });
    } catch (error) {
      console.error("Error fetching project statistics:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Design Documents
  app.get("/api/design/projects/:projectId/documents", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const documents = await storage.getDesignDocuments(projectId);
      return res.json(documents);
    } catch (error) {
      console.error("Error fetching design documents:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/design/documents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDesignDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Design document not found" });
      }
      
      return res.json(document);
    } catch (error) {
      console.error("Error fetching design document:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/design/projects/:projectId/documents", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }
      
      // Generate a document code if not provided
      let documentData = req.body;
      if (!documentData.documentCode) {
        const existingDocs = await storage.getDesignDocuments(projectId);
        const docNumber = existingDocs.length + 1;
        documentData.documentCode = `DOC-${project.projectCode}-${String(docNumber).padStart(3, '0')}`;
      }
      
      // Validate design document data
      const parseResult = insertDesignDocumentSchema.safeParse({
        ...documentData,
        projectId,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: parseResult.error.errors 
        });
      }
      
      const document = await storage.createDesignDocument(parseResult.data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "Created",
        entityType: "design_document",
        entityId: document.id,
        details: `Design document ${document.title} (${document.documentCode}) was created`,
        timestamp: new Date()
      });
      
      return res.status(201).json(document);
    } catch (error) {
      console.error("Error creating design document:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}