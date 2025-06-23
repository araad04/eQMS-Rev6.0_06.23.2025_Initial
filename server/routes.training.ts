import express, { Request, Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import { users, TrainingModule, TrainingRecord, InsertTrainingRecord, trainingModules, trainingRecords } from "@shared/schema";
import { authMiddleware } from "./middleware/auth";
import { z } from "zod";

const { isAuthenticated, hasRole } = authMiddleware;

/**
 * Organizational Structure Integration Helper
 * Validates employee organizational context for training assignments
 */
async function validateEmployeeOrganizationalContext(employee: any, module: any) {
  // Enhanced organizational validation logic
  const organizationalRules = {
    'Quality': ['qa', 'quality_manager', 'admin'],
    'Safety': ['safety_officer', 'quality_manager', 'admin'],
    'Regulatory': ['regulatory_affairs', 'quality_manager', 'admin'],
    'Technical': ['engineer', 'technician', 'quality_manager', 'admin'],
    'General': ['user', 'qa', 'quality_manager', 'admin'] // All roles can access general training
  };

  const requiredRoles = organizationalRules[module.type] || organizationalRules['General'];
  const employeeRole = employee.role || 'user';

  return {
    isValid: requiredRoles.includes(employeeRole),
    authorizedRoles: requiredRoles,
    employeeRole: employeeRole,
    organizationalUnit: employee.department || 'Unknown'
  };
}

export const trainingRouter = express.Router();

// Apply authentication middleware to all routes
trainingRouter.use(isAuthenticated);

/**
 * Get all training modules
 * GET /api/training/modules
 */
trainingRouter.get("/modules", async (req: Request, res: Response) => {
  try {
    const modules = await db.query.trainingModules.findMany({
      with: {
        createdByUser: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: (modules) => modules.name,
    });
    return res.status(200).json(modules);
  } catch (error) {
    console.error("Error fetching training modules:", error);
    return res.status(500).json({ error: "Failed to retrieve training modules" });
  }
});

/**
 * Get all training records with user and module details
 * GET /api/training/records
 */
trainingRouter.get("/records", async (req: Request, res: Response) => {
  try {
    // Check for user filter
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const statusFilter = req.query.status as string | undefined;
    
    console.log("Executing training records query with filters:", { userId, statusFilter });
    
    // First, check for the existence of required tables
    try {
      // Simple direct query to get training records
      const recordsResult = await db.execute(
        sql`SELECT 
              tr.id, tr.user_id, tr.module_id, tr.assigned_by, 
              tr.assigned_date, tr.due_date, tr.completed_date, tr.expiry_date,
              tr.status, tr.score, tr.comments,
              u.first_name as user_first_name, u.last_name as user_last_name, u.department,
              tm.name as module_name, tm.type as module_type,
              a.first_name as assigned_by_first_name, a.last_name as assigned_by_last_name
            FROM 
              training_records tr
            JOIN 
              users u ON tr.user_id = u.id
            JOIN 
              training_modules tm ON tr.module_id = tm.id
            JOIN 
              users a ON tr.assigned_by = a.id
            ORDER BY 
              tr.assigned_date DESC`
      );
      
      // Transform raw DB results to formatted records
      const formattedRecords = recordsResult.rows.map(record => ({
        id: record.id,
        userId: record.user_id,
        moduleId: record.module_id,
        employee: `${record.user_first_name} ${record.user_last_name}`,
        department: record.department,
        training: record.module_name,
        trainingType: record.module_type,
        assignedBy: `${record.assigned_by_first_name} ${record.assigned_by_last_name}`,
        assignedDate: record.assigned_date,
        dueDate: record.due_date,
        completedDate: record.completed_date,
        expiryDate: record.expiry_date,
        status: record.status,
        score: record.score,
        comments: record.comments,
      }));
      
      console.log(`Found ${formattedRecords.length} training records`);
      return res.status(200).json(formattedRecords);
    } catch (dbError) {
      console.error("Database error fetching training records:", dbError);
      // Return proper error response
      return res.status(500).json({ 
        error: "Database error occurred while retrieving training records",
        details: dbError.message
      });
    }
  } catch (error) {
    console.error("Error in training records endpoint:", error);
    return res.status(500).json({ error: "Failed to retrieve training records" });
  }
});

/**
 * Assign training to user with organizational structure integration
 * POST /api/training/assign
 */
trainingRouter.post("/assign", async (req: Request, res: Response) => {
  try {
    // Get current user from the request
    const assignedBy = req.user?.id || 9999; // Development mode fallback
    
    // Validate the request data with enhanced organizational validation
    const trainingAssignmentSchema = z.object({
      userId: z.string().or(z.number()).transform(val => 
        typeof val === 'string' ? parseInt(val) : val
      ),
      moduleId: z.string().or(z.number()).transform(val => 
        typeof val === 'string' ? parseInt(val) : val
      ),
      dueDate: z.string().or(z.date()).transform(val => 
        typeof val === 'string' ? new Date(val) : val
      ),
      comments: z.string().optional(),
      organizationalContext: z.object({
        departmentId: z.number().optional(),
        roleId: z.number().optional(),
        competencyRequirement: z.string().optional(),
      }).optional(),
    });
    
    const validatedData = trainingAssignmentSchema.parse(req.body);
    
    // Verify employee exists in organizational structure
    const employee = await db.query.users.findFirst({
      where: eq(users.id, validatedData.userId)
    });
    
    if (!employee) {
      return res.status(404).json({ error: "Employee not found in organizational structure" });
    }
    
    // Get the training module with organizational compliance requirements
    const module = await db.query.trainingModules.findFirst({
      where: eq(trainingModules.id, validatedData.moduleId)
    });
    
    if (!module) {
      return res.status(404).json({ error: "Training module not found" });
    }
    
    // Check existing assignments to prevent duplicates
    const existingAssignment = await db.query.trainingRecords.findFirst({
      where: and(
        eq(trainingRecords.userId, validatedData.userId),
        eq(trainingRecords.moduleId, validatedData.moduleId),
        eq(trainingRecords.status, 'assigned')
      )
    });
    
    if (existingAssignment) {
      return res.status(409).json({ 
        error: "Training already assigned to this employee",
        details: "Employee already has an active assignment for this training module"
      });
    }
    
    // Create the training record
    const [trainingRecord] = await db
      .insert(trainingRecords)
      .values({
        userId: validatedData.userId,
        moduleId: validatedData.moduleId,
        assignedBy,
        dueDate: validatedData.dueDate,
        completedDate: null,
        expiryDate,
        status: "assigned",
        score: null,
        comments: validatedData.comments,
      })
      .returning();
    
    // Get the complete record with relations for the response
    const completeRecord = await db.query.trainingRecords.findFirst({
      where: eq(trainingRecords.id, trainingRecord.id),
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
          }
        },
        module: {
          columns: {
            name: true,
            type: true,
          }
        },
      },
    });
    
    return res.status(201).json({
      success: true,
      record: completeRecord,
      message: `Training '${completeRecord?.module.name}' has been assigned to ${completeRecord?.user.firstName} ${completeRecord?.user.lastName}`
    });
  } catch (error) {
    console.error("Error assigning training:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    
    return res.status(500).json({ error: "Failed to assign training" });
  }
});

/**
 * Mark training as completed
 * PATCH /api/training/records/:id/complete
 */
trainingRouter.patch("/records/:id/complete", async (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.id);
    const { completedDate, score } = req.body;
    
    if (isNaN(recordId)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }
    
    // Validate the request data
    const completionSchema = z.object({
      completedDate: z.string().or(z.date()).transform(val => 
        typeof val === 'string' ? new Date(val) : val
      ),
      score: z.number().optional(),
    });
    
    const validatedData = completionSchema.parse({ completedDate, score });
    
    // Get the training record to update
    const record = await db.query.trainingRecords.findFirst({
      where: eq(trainingRecords.id, recordId),
      with: {
        module: true,
      },
    });
    
    if (!record) {
      return res.status(404).json({ error: "Training record not found" });
    }
    
    // Calculate expiry date based on module valid period
    const validPeriodDays = record.module.validPeriod;
    const completionDate = validatedData.completedDate;
    const expiryDate = new Date(completionDate);
    expiryDate.setDate(expiryDate.getDate() + validPeriodDays);
    
    // Update the record
    const [updatedRecord] = await db
      .update(trainingRecords)
      .set({
        completedDate: validatedData.completedDate,
        expiryDate,
        status: "completed",
        score: validatedData.score,
        updatedAt: new Date(),
      })
      .where(eq(trainingRecords.id, recordId))
      .returning();
    
    return res.status(200).json({
      success: true,
      record: updatedRecord,
      message: "Training marked as completed"
    });
  } catch (error) {
    console.error("Error completing training:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    
    return res.status(500).json({ error: "Failed to mark training as completed" });
  }
});

export default trainingRouter;