import { Router } from "express";
import { designProjectStorage } from "./storage.design-project";
import { insertDesignProjectSchema, designProjects } from "@shared/schema";
import { z, ZodError } from "zod";

// Design project validation fix
const designProjectCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default('planning'),
  projectCode: z.string().optional()
});

import { db } from "./db";
import { eq } from "drizzle-orm";

export const designProjectRouter = Router();

// Get all design project types (for form dropdowns)
designProjectRouter.get("/api/design-project-types", async (req, res) => {
  try {
    const types = await designProjectStorage.getProjectTypes();
    res.json(types);
  } catch (error) {
    console.error("Error fetching design project types:", error);
    res.status(500).json({ error: "Failed to fetch design project types" });
  }
});

// Get all design project statuses (for form dropdowns)
designProjectRouter.get("/api/design-project-statuses", async (req, res) => {
  try {
    const statuses = await designProjectStorage.getProjectStatuses();
    res.json(statuses);
  } catch (error) {
    console.error("Error fetching design project statuses:", error);
    res.status(500).json({ error: "Failed to fetch design project statuses" });
  }
});

// Get all design projects with details
designProjectRouter.get("/api/design-projects", async (req, res) => {
  try {
    // Fetch all design projects
    const projects = await db
      .select({
        id: designProjects.id,
        projectCode: designProjects.projectCode,
        title: designProjects.title,
        description: designProjects.description,
        objective: designProjects.objective,
        riskLevel: designProjects.riskLevel,
        regulatoryImpact: designProjects.regulatoryImpact,
        overallProgress: designProjects.overallProgress,
        startDate: designProjects.startDate,
        targetCompletionDate: designProjects.targetCompletionDate,
        createdAt: designProjects.createdAt,
        statusId: designProjects.statusId,
        projectTypeId: designProjects.projectTypeId
      })
      .from(designProjects)
      .orderBy(designProjects.createdAt);
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching design projects:", error);
    res.status(500).json({ error: "Failed to fetch design projects" });
  }
});

// Get a specific design project by ID with all details
designProjectRouter.get("/api/design-projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const project = await designProjectStorage.getProjectWithDetails(id);
    if (!project) {
      return res.status(404).json({ error: "Design project not found" });
    }
    
    res.json(project);
  } catch (error) {
    console.error(`Error fetching design project ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch design project" });
  }
});

// Create a new design project with auto-generated project code
designProjectRouter.post("/api/design-projects", async (req, res) => {
  try {
    // Add createdBy from authenticated user (handle development mode)
    const requestData = {
      ...req.body,
      createdBy: 9999 // Use development user ID
    };
    
    // Validate request body using the schema
    const validatedData = insertDesignProjectSchema.parse(requestData);
    
    // Create the project with auto-generated code based on project type
    const createdProject = await designProjectStorage.createProject(validatedData);
    
    res.status(201).json(createdProject);
  } catch (error) {
    console.error("Error creating design project:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Invalid design project data", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Failed to create design project" });
  }
});

// Update an existing design project
designProjectRouter.patch("/api/design-projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    // Ensure project exists
    const existingProject = await designProjectStorage.getProjectById(id);
    if (!existingProject) {
      return res.status(404).json({ error: "Design project not found" });
    }
    
    // Update the project
    const updatedProject = await designProjectStorage.updateProject(id, req.body);
    
    res.json(updatedProject);
  } catch (error) {
    console.error(`Error updating design project ${req.params.id}:`, error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Invalid design project data", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Failed to update design project" });
  }
});

// Delete a design project
designProjectRouter.delete("/api/design-projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    // Check if project exists
    const existingProject = await designProjectStorage.getProjectById(id);
    if (!existingProject) {
      return res.status(404).json({ error: "Design project not found" });
    }
    
    // Delete the project
    await designProjectStorage.deleteProject(id);
    
    res.status(204).end();
  } catch (error) {
    console.error(`Error deleting design project ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete design project" });
  }
});

// Update an existing design project (PUT route for complete updates)
designProjectRouter.put("/api/design-projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    // Ensure project exists
    const existingProject = await designProjectStorage.getProjectById(id);
    if (!existingProject) {
      return res.status(404).json({ error: "Design project not found" });
    }
    
    // Update the project
    const updatedProject = await designProjectStorage.updateProject(id, req.body);
    
    res.json(updatedProject);
  } catch (error) {
    console.error(`Error updating design project ${req.params.id}:`, error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Invalid design project data", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Failed to update design project" });
  }
});