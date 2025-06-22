import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  designProjects,
  designProjectTypes,
  designProjectStatuses,
  insertDesignProjectSchema,
  type DesignProject,
  type DesignProjectType,
  type DesignProjectStatus,
  type InsertDesignProject
} from "@shared/schema";
import { generateDesignProjectCode } from "./utils/number-generator";

/**
 * Specialized storage implementation for design project functionality
 */
export class DesignProjectStorage {
  /**
   * Creates a new design project with auto-generated project code
   * @param projectData Design project data to insert
   * @returns Created design project object
   */
  async createProject(projectData: InsertDesignProject): Promise<DesignProject> {
    try {
      // Get the project type code (NP, DC, SD) to generate the project code
      const [projectType] = await db
        .select({ code: designProjectTypes.code })
        .from(designProjectTypes)
        .where(eq(designProjectTypes.id, projectData.projectTypeId));
      
      if (!projectType) {
        throw new Error(`Project type with ID ${projectData.projectTypeId} not found`);
      }
      
      // Generate the project code using DP-YYYY-XXX format (fixing DES001)
      // We no longer use the project type code prefix as per requirements
      const projectCode = await generateDesignProjectCode("DP");
      
      // Insert the project with the generated code
      const [createdProject] = await db
        .insert(designProjects)
        .values({
          ...projectData,
          projectCode,
          initiatedBy: projectData.initiatedBy || 9999, // Default to development user if not provided
          responsiblePerson: projectData.responsiblePerson || 9999, // Default to development user if not provided
          createdBy: projectData.createdBy || 9999,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return createdProject;
    } catch (error) {
      console.error("Error creating design project:", error);
      throw error;
    }
  }
  
  /**
   * Gets all design projects
   * @returns Array of design projects
   */
  async getProjects(): Promise<DesignProject[]> {
    return db.select().from(designProjects).orderBy(designProjects.createdAt);
  }
  
  /**
   * Gets a specific design project by ID
   * @param id Project ID to fetch
   * @returns Design project or undefined if not found
   */
  async getProjectById(id: number): Promise<DesignProject | undefined> {
    const [project] = await db
      .select()
      .from(designProjects)
      .where(eq(designProjects.id, id));
    
    return project;
  }
  
  /**
   * Gets projects with detailed relations
   * @returns Project objects with type, status, and user information
   */
  async getProjectsWithDetails() {
    return db.query.designProjects.findMany({
      with: {
        projectType: true,
        status: true,
        responsiblePerson: true,
        createdBy: true
      },
      orderBy: [designProjects.createdAt]
    });
  }
  
  /**
   * Gets a specific project with all related details
   * @param id Project ID to retrieve
   * @returns Project with detailed relations or undefined if not found
   */
  async getProjectWithDetails(id: number) {
    return db.query.designProjects.findFirst({
      where: eq(designProjects.id, id),
      with: {
        projectType: true,
        status: true,
        responsiblePerson: true,
        createdBy: true
      }
    });
  }
  
  /**
   * Updates a design project
   * @param id Project ID to update
   * @param projectData Updated project data
   * @returns Updated project object
   */
  async updateProject(id: number, projectData: Partial<DesignProject>): Promise<DesignProject | undefined> {
    // Convert date strings to Date objects for Drizzle
    const processedData = { ...projectData };
    
    if (processedData.startDate && typeof processedData.startDate === 'string') {
      processedData.startDate = new Date(processedData.startDate);
    }
    
    if (processedData.targetCompletionDate && typeof processedData.targetCompletionDate === 'string') {
      processedData.targetCompletionDate = new Date(processedData.targetCompletionDate);
    }
    
    if (processedData.actualCompletionDate && typeof processedData.actualCompletionDate === 'string') {
      processedData.actualCompletionDate = new Date(processedData.actualCompletionDate);
    }
    
    const [updated] = await db
      .update(designProjects)
      .set({
        ...processedData,
        updatedAt: new Date()
      })
      .where(eq(designProjects.id, id))
      .returning();
    
    return updated;
  }
  
  /**
   * Deletes a design project
   * @param id Project ID to delete
   * @returns Promise that resolves when project is deleted
   */
  async deleteProject(id: number): Promise<void> {
    await db.delete(designProjects).where(eq(designProjects.id, id));
  }
  
  /**
   * Gets all project types
   * @returns Array of project types
   */
  async getProjectTypes(): Promise<DesignProjectType[]> {
    return db.select().from(designProjectTypes).orderBy(designProjectTypes.name);
  }
  
  /**
   * Gets all project statuses
   * @returns Array of project statuses
   */
  async getProjectStatuses(): Promise<DesignProjectStatus[]> {
    return db.select().from(designProjectStatuses).orderBy(designProjectStatuses.name);
  }
}

// Create singleton instance
export const designProjectStorage = new DesignProjectStorage();