import { Router } from "express";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { Logger } from "./utils/logger";

export const designProjectTypesRouter = Router();

// Get all design project types
designProjectTypesRouter.get("/api/design-project-types", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectTypes = await db.execute(sql`
      SELECT id, name, code, description 
      FROM design_project_types 
      ORDER BY name
    `);
    
    Logger.info(`Retrieved ${projectTypes.rows.length} design project types`);
    res.json(projectTypes.rows);
  } catch (error) {
    Logger.error("Error fetching design project types:", error);
    res.status(500).json({ error: "Failed to fetch design project types" });
  }
});

// Get all design project statuses
designProjectTypesRouter.get("/api/design-project-statuses", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectStatuses = await db.execute(sql`
      SELECT id, name, description 
      FROM design_project_statuses 
      ORDER BY 
        CASE name
          WHEN 'Planning' THEN 1
          WHEN 'Active' THEN 2
          WHEN 'On Hold' THEN 3
          WHEN 'Review' THEN 4
          WHEN 'Completed' THEN 5
          WHEN 'Cancelled' THEN 6
          ELSE 7
        END
    `);
    
    Logger.info(`Retrieved ${projectStatuses.rows.length} design project statuses`);
    res.json(projectStatuses.rows);
  } catch (error) {
    Logger.error("Error fetching design project statuses:", error);
    res.status(500).json({ error: "Failed to fetch design project statuses" });
  }
});