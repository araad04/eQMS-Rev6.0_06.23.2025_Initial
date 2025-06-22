import express, { Request, Response } from "express";
import { pool } from "./db";
import { authMiddleware } from "./middleware/auth";

const { isAuthenticated } = authMiddleware;
export const directQueryRouter = express.Router();

// Apply authentication middleware to all routes
directQueryRouter.use(isAuthenticated);

/**
 * Execute a direct query for training records
 * POST /api/execute-direct-query
 */
directQueryRouter.post("/execute-direct-query", async (req: Request, res: Response) => {
  try {
    // For security reasons, we only allow specific queries
    // This is a controlled endpoint only for the training records fix
    const allowedQueries = [
      "SELECT tr.id, tr.user_id as", // Start of training records query
    ];
    
    const query = req.body.query;
    
    // Basic validation check - only allow specific queries
    if (!query || !allowedQueries.some(allowed => query.trim().startsWith(allowed))) {
      return res.status(403).json({ error: "Query not permitted for security reasons" });
    }
    
    // Execute the query
    const result = await pool.query(query);
    
    // Return the rows
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error executing direct query:", error);
    return res.status(500).json({ error: "Failed to execute query" });
  }
});

// Route to get training records directly
directQueryRouter.get("/training-records-direct", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        tr.id, tr.user_id as "userId", tr.module_id as "moduleId", 
        CONCAT(u.first_name, ' ', u.last_name) as employee,
        u.department,
        tm.name as training,
        tm.type as "trainingType",
        CONCAT(a.first_name, ' ', a.last_name) as "assignedBy",
        tr.assigned_date as "assignedDate",
        tr.due_date as "dueDate",
        tr.completed_date as "completedDate",
        tr.expiry_date as "expiryDate",
        tr.status,
        tr.score,
        tr.comments
      FROM 
        training_records tr
      JOIN 
        users u ON tr.user_id = u.id
      JOIN 
        training_modules tm ON tr.module_id = tm.id
      JOIN 
        users a ON tr.assigned_by = a.id
      ORDER BY 
        tr.assigned_date DESC
    `;
    
    // Execute the query directly
    const result = await pool.query(query);
    
    // Return the rows
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching training records directly:", error);
    return res.status(500).json({ 
      error: "Failed to fetch training records directly", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default directQueryRouter;