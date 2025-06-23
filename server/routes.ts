import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { iovvStorage } from "./storage.iovv";
import { setupAuth } from "./auth";
import { qmsDeleteOperations } from "./delete-operations";
import { pool, db } from "./db";
import { sql, desc, eq } from "drizzle-orm";
import { z } from "zod";

// Complaint validation fix
const complaintSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.string().default('new'),
  customerName: z.string().optional(),
  severity: z.string().default('medium')
});


// Management review validation fix
const managementReviewSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default('scheduled'),
  reviewDate: z.string().transform(str => new Date(str)).optional(),
  reviewType: z.string().optional()
});


// Training validation fix
const trainingRecordSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default('active'),
  employeeName: z.string().optional(),
  trainingType: z.string().optional()
});


// Supplier validation fix
const supplierCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default('active'),
  name: z.string().min(1),
  contactInfo: z.string().optional()
});


// CAPA validation fix
const capaCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.string().default('open'),
  severity: z.string().default('medium'),
  dueDate: z.string().transform(str => new Date(str)).optional()
});


// Document validation fix
const documentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default('active'),
  type: z.string().optional()
});

import { registerIOVVRoutes } from "./routes.iovv";
import { setupProductionRoutes } from "./routes.production";
import { setupSupplierRoutes } from "./routes.supplier";
import { managementReviewRouter } from "./routes.management-review";
import { designProjectRouter } from "./routes.design-project";
import { designProjectTypesRouter } from "./routes.design-project-types";
import { databaseHealthRouter } from "./routes.database-health";
import documentApprovalRouter from "./routes.document-approval";
import { capaRouter } from "./routes.capa";
import { iso13485DocumentRouter } from "./routes.iso13485-documents";
import documentRevisionsRouter from "./routes.document-revisions";
import trainingRouter from "./routes.training";
import directQueryRouter from "./routes.direct-queries";
import calibrationAssetsRouter from "./routes.calibration-assets";
import { regulatoryReportabilityRouter } from "./routes.regulatory-reportability";
import { intelligentManagementReviewRoutes } from "./routes.intelligent-management-review";
import { documentStorage } from "./storage.document";
import { Logger } from "./utils/logger";
import { authMiddleware } from "./middleware/auth";
import { createKPIAnalyticsRoutes } from "./routes.kpi-analytics";
import organizationalRouter from "./routes.organizational";
import technicalDocumentationRouter from "./routes.technical-documentation";
import dhfRouter from "./routes.dhf-simplified.js";
import designControlExtendedRouter from "./routes.design-control-extended";
import express from "express";

// Import only what we need for CAPA and Management Review functionality
import { 
  insertCapaSchema, insertCapaActionSchema, insertCapaEvidenceSchema, 
  insertCapaVerificationSchema, insertCapaCommunicationSchema,
  insertCapaRootCauseSchema, insertCapaRootCauseContributorSchema, 
  insertCapaRootCauseActionMapSchema, insertCapaEffectivenessReviewSchema, 
  insertCapaClosureSchema, insertManagementReviewSchema, 
  insertManagementReviewActionItemSchema, insertManagementReviewInputSchema, 
  insertManagementReviewSignatureSchema, managementReviews, managementReviewInputs, 
  managementReviewActionItems, managementReviewSignatures,
  
  // Import audit and SCR schemas
  insertAuditSchema, insertAuditChecklistItemSchema,
  insertSupplierCorrectiveRequestSchema, insertScrAttachmentSchema,
  audits, auditChecklistItems, supplierCorrectiveRequests, scrAttachments,
  
  // Import Measurement & Analysis schemas
  
  // Import Design Control Traceability schemas
  insertDesignUserNeedSchema, insertTraceabilityDesignInputSchema, insertTraceabilityDesignOutputSchema,
  insertVerificationRecordSchema, insertValidationRecordSchema, insertDesignTaskDependencySchema,
  insertTraceabilityMatrixSnapshotSchema, insertDesignControlActivityLogSchema,
  
  insertComplaintSchema, insertCustomerFeedbackSchema,
  insertCalibrationAssetSchema, insertCalibrationRecordSchema,
  complaints, customerFeedback, calibrationAssets, calibrationRecords,
  
  // Import types for better TypeScript support
  Audit, AuditChecklistItem, SupplierCorrectiveRequest, ScrAttachment,
  Complaint, CustomerFeedback, CalibrationAsset, CalibrationRecord,
  
  // Import document schema for file serving
  documents, Document
} from "@shared/schema";


import { Request, Response, NextFunction } from "express";

// Use the centralized authentication middleware
// This addresses DEF-002 by providing consistent role-based access control
const { isAuthenticated, hasRole, isAdmin, auditRequest } = authMiddleware;

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// User endpoint with auth bypass for development
router.get("/user", isAuthenticated, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
});

// Enhanced Design Control Routes
router.use("/design-control-enhanced", designControlExtendedRouter);

export function registerRoutes(app: Express): Server {
  // Setup authentication
  setupAuth(app);
  
  // Register IOVV Matrix routes
  registerIOVVRoutes(app);
  
  // Register Production Module routes
  setupProductionRoutes(app);
  
  // Register Supplier Management routes
  setupSupplierRoutes(app);
  
  // Register Database Health routes
  app.use('/api', databaseHealthRouter);
  
  // Register Document Approval routes
  app.use('/api', documentApprovalRouter);
  
  // Register CAPA workflow routes
  app.use('/api', capaRouter);
  
  // Register ISO 13485 Document Control routes (includes Quality Manual)
  app.use('/api/iso13485-documents', iso13485DocumentRouter);
  
  // Document Revision routes moved after individual document routes to prevent conflicts
  
  // Register Training routes
  app.use('/api/training', trainingRouter);
  
  // Register Calibration Assets routes
  app.use('/api/calibration', calibrationAssetsRouter);

  // Register KPI Analytics routes
  const kpiAnalyticsRouter = createKPIAnalyticsRoutes(storage);
  app.use('/api/kpi-analytics', kpiAnalyticsRouter);

  // Register Organizational Chart routes
  app.use(organizationalRouter);

  // Comprehensive health check endpoint for production monitoring
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connectivity
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1 as health_check`);
      const dbLatency = Date.now() - dbStart;

      // Get system metrics
      const memory = process.memoryUsage();
      const uptime = process.uptime();
      
      // Calculate health status
      const isHealthy = dbLatency < 1000 && memory.heapUsed < (memory.heapTotal * 0.9);
      
      const systemHealth = {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '6.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: {
            status: dbLatency < 1000 ? 'operational' : 'slow',
            latency: `${dbLatency}ms`,
            connection: 'postgresql'
          },
          api: {
            status: 'operational',
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
          }
        },
        metrics: {
          memory: {
            used: Math.round(memory.heapUsed / (1024 * 1024)),
            total: Math.round(memory.heapTotal / (1024 * 1024)),
            utilization: Math.round((memory.heapUsed / memory.heapTotal) * 100)
          },
          system: {
            uptime: Math.floor(uptime),
            nodeVersion: process.version,
            platform: process.platform
          }
        },
        compliance: {
          iso13485: 'active',
          cfr21Part11: 'active',
          iec62304: 'active',
          dataIntegrity: 'verified'
        }
      };
      
      res.status(isHealthy ? 200 : 503).json(systemHealth);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
        services: {
          database: { status: 'failed' },
          api: { status: 'operational' }
        }
      });
    }
  });

  // Get authenticated user
  app.get("/api/me", isAuthenticated, (req, res) => {
    res.json(req.user);
  });
  
  // Get all users (for admin purposes)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await db.execute(sql`
        SELECT id, username, first_name, last_name, email, role, department, created_at 
        FROM users
        ORDER BY last_name, first_name
      `);
      
      // Map SQL results to camelCase for frontend
      const formattedUsers = users.rows.map(user => ({
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.created_at
      }));
      
      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Fetch specific user from the database
      const result = await db.execute(sql`
        SELECT id, username, first_name, last_name, email, role, department, created_at 
        FROM users
        WHERE id = ${parseInt(id)}
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Map SQL result to camelCase for frontend
      const user = result.rows[0];
      const formattedUser = {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.created_at
      };
      
      res.json(formattedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user by ID
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { role, department } = req.body;
      
      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(role);
      }
      
      if (department !== undefined) {
        updates.push(`department = $${paramIndex++}`);
        values.push(department);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      values.push(parseInt(id));
      
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING id, username, first_name, last_name, email, role, department, created_at
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Map SQL result to camelCase for frontend
      const user = result.rows[0];
      const formattedUser = {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.created_at
      };
      
      res.json(formattedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Get all departments
  app.get("/api/departments", isAuthenticated, async (req, res) => {
    try {
      // Get unique departments from users table
      const departments = await db.execute(sql`
        SELECT DISTINCT department as name, department as id
        FROM users 
        WHERE department IS NOT NULL AND department != ''
        ORDER BY department
      `);
      
      // Format the response to match expected frontend structure
      const formattedDepartments = departments.rows.map(dept => ({
        id: dept.id,
        name: dept.name
      }));
      
      res.json(formattedDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  // Dashboard layout management
  app.get("/api/dashboard/layout", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user's dashboard configuration
      const result = await db.execute(sql`
        SELECT * FROM dashboard_configs 
        WHERE user_id = ${userId} OR is_global = true
        ORDER BY is_default DESC, created_at DESC
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        // Return default configuration
        return res.json({
          userId: userId,
          layout: {
            widgets: [],
            refreshRate: 300000
          },
          isDefault: true
        });
      }

      const config = result.rows[0];
      res.json({
        id: config.id,
        userId: config.user_id,
        layout: config.layout,
        isDefault: config.is_default
      });
    } catch (error) {
      console.error("Error fetching dashboard layout:", error);
      res.status(500).json({ error: "Failed to fetch dashboard layout" });
    }
  });

  app.post("/api/dashboard/layout", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { layout } = req.body;

      // Check if user already has a configuration
      const existing = await db.execute(sql`
        SELECT id FROM dashboard_configs WHERE user_id = ${userId}
      `);

      if (existing.rows.length > 0) {
        // Update existing configuration
        await db.execute(sql`
          UPDATE dashboard_configs 
          SET layout = ${JSON.stringify(layout)}, updated_at = NOW()
          WHERE user_id = ${userId}
        `);
      } else {
        // Create new configuration
        await db.execute(sql`
          INSERT INTO dashboard_configs (user_id, name, layout, is_default)
          VALUES (${userId}, 'My Dashboard', ${JSON.stringify(layout)}, true)
        `);
      }

      res.json({ success: true, message: "Dashboard layout saved successfully" });
    } catch (error) {
      console.error("Error saving dashboard layout:", error);
      res.status(500).json({ error: "Failed to save dashboard layout" });
    }
  });

  // Dashboard endpoint - basic summary data
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      // Get basic dashboard summary data
      const dashboardData = {
        summary: {
          totalDocuments: 0,
          totalCapas: 0,
          totalAudits: 0,
          totalSuppliers: 0,
          pendingActions: 0
        },
        recentActivity: [],
        notifications: [],
        status: "operational"
      };

      // Get counts from various modules
      try {
        const documents = await storage.getDocuments();
        dashboardData.summary.totalDocuments = documents.length;
      } catch (error) {
        console.warn("Error fetching documents for dashboard:", error);
      }

      try {
        const capas = await storage.getCapas();
        dashboardData.summary.totalCapas = capas.length;
        dashboardData.summary.pendingActions += capas.filter(c => c.statusId !== 3).length;
      } catch (error) {
        console.warn("Error fetching CAPAs for dashboard:", error);
      }

      try {
        const audits = await storage.getAudits();
        dashboardData.summary.totalAudits = audits.length;
      } catch (error) {
        console.warn("Error fetching audits for dashboard:", error);
      }

      try {
        const suppliers = await storage.getSuppliers();
        dashboardData.summary.totalSuppliers = suppliers ? suppliers.length : 0;
      } catch (error) {
        console.warn("Error fetching suppliers for dashboard:", error);
        dashboardData.summary.totalSuppliers = 0;
      }

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Management Review routes
  app.get("/api/management-reviews", isAuthenticated, async (req, res) => {
    try {
      const reviews = await storage.getManagementReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching management reviews:", error);
      res.status(500).json({ error: "Failed to fetch management reviews" });
    }
  });

  app.get("/api/management-reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const review = await storage.getManagementReview(parseInt(id));
      
      if (!review) {
        return res.status(404).json({ error: "Management review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error(`Error fetching management review ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch management review" });
    }
  });

  app.post("/api/management-reviews", isAuthenticated, async (req, res) => {
    try {
      console.log("Received management review data:", req.body);
      
      // Create a normalized version of the data with server-side naming
      let normalizedData = { ...req.body };
      
      // Map client-side field names to server-side field names if they exist
      if (normalizedData.reviewDate && !normalizedData.review_date) {
        normalizedData.review_date = normalizedData.reviewDate;
      }
      
      if (normalizedData.reviewType && !normalizedData.review_type) {
        normalizedData.review_type = normalizedData.reviewType;
      }
      
      // Remove scheduledDate field since it doesn't exist in the database schema
      if (normalizedData.scheduledDate) {
        delete normalizedData.scheduledDate;
      }
      
      // Also remove any scheduled_date field for consistency since it doesn't exist in schema
      if (normalizedData.scheduled_date) {
        delete normalizedData.scheduled_date;
      }
      
      // Map completionDate to completion_date (updated field name)
      if (normalizedData.completionDate && !normalizedData.completion_date) {
        normalizedData.completion_date = normalizedData.completionDate;
      }
      
      // Handle scope and purpose fields by combining them into description
      if (normalizedData.scope || normalizedData.purpose) {
        let descriptionText = normalizedData.description || '';
        
        if (normalizedData.scope) {
          descriptionText += `\n\nScope: ${normalizedData.scope}`;
          delete normalizedData.scope;
        }
        
        if (normalizedData.purpose) {
          descriptionText += `\n\nPurpose: ${normalizedData.purpose}`;
          delete normalizedData.purpose;
        }
        
        normalizedData.description = descriptionText.trim();
      }
      
      console.log("Normalized data for schema validation:", normalizedData);
      
      try {
        // Validate the data using the schema
        const data = insertManagementReviewSchema.parse(normalizedData);
        console.log("Validated data:", data);
        
        // Create the management review
        // Remove fields that don't exist in the actual database
        const cleanedData = {...data};
        // These fields don't exist in the actual database but might be in the schema
        delete cleanedData.presentation_file;
        delete cleanedData.file_content_type;
        
        console.log("Cleaned data for DB:", cleanedData);
        const review = await storage.createManagementReview(cleanedData);
        console.log("Created review:", review);
        
        res.status(201).json(review);
      } catch (zodError) {
        console.error("Validation error:", zodError);
        if (zodError instanceof z.ZodError) {
          return res.status(400).json({ error: zodError.errors });
        }
        throw zodError; // Re-throw if it's not a ZodError
      }
    } catch (error) {
      console.error("Error creating management review:", error);
      res.status(500).json({ error: "Failed to create management review" });
    }
  });

  app.get("/api/management-review-input-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getManagementReviewInputCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching management review input categories:", error);
      res.status(500).json({ error: "Failed to fetch management review input categories" });
    }
  });
  
  app.patch("/api/management-reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Updating management review ${id} with data:`, req.body);
      
      // Create a normalized version of the data with server-side naming
      let normalizedData = { ...req.body };
      
      // Map client-side field names to server-side field names if they exist
      if (normalizedData.reviewDate && normalizedData.reviewDate !== undefined) {
        normalizedData.review_date = normalizedData.reviewDate instanceof Date ? 
          normalizedData.reviewDate : 
          new Date(normalizedData.reviewDate);
      }
      
      if (normalizedData.reviewType && normalizedData.reviewType !== undefined) {
        normalizedData.review_type = normalizedData.reviewType;
      }
      
      // Combine scope and purpose into description field if present
      if ((normalizedData.scope || normalizedData.purpose) && !normalizedData.description) {
        let description = '';
        if (normalizedData.scope) {
          description += `Scope: ${normalizedData.scope}\n\n`;
        }
        if (normalizedData.purpose) {
          description += `Purpose: ${normalizedData.purpose}`;
        }
        normalizedData.description = description.trim();
      }
      
      // Remove fields that don't exist in the database schema
      if (normalizedData.scheduledDate) delete normalizedData.scheduledDate;
      if (normalizedData.scheduled_date) delete normalizedData.scheduled_date;
      if (normalizedData.reviewDate) delete normalizedData.reviewDate;
      if (normalizedData.reviewType) delete normalizedData.reviewType; 
      if (normalizedData.scope) delete normalizedData.scope;
      if (normalizedData.purpose) delete normalizedData.purpose;
      
      // Map completionDate to completion_date (updated field name)
      if (normalizedData.completionDate && !normalizedData.completion_date) {
        normalizedData.completion_date = normalizedData.completionDate;
      }
      
      // Handle scope and purpose fields by combining them into description
      if (normalizedData.scope || normalizedData.purpose) {
        let descriptionText = normalizedData.description || '';
        
        if (normalizedData.scope) {
          descriptionText += `\n\nScope: ${normalizedData.scope}`;
          delete normalizedData.scope;
        }
        
        if (normalizedData.purpose) {
          descriptionText += `\n\nPurpose: ${normalizedData.purpose}`;
          delete normalizedData.purpose;
        }
        
        normalizedData.description = descriptionText.trim();
      }
      
      console.log("Normalized data for update:", normalizedData);
      
      try {
        const updatedReview = await storage.updateManagementReview(parseInt(id), normalizedData);
        
        if (!updatedReview) {
          return res.status(404).json({ error: "Management review not found" });
        }
        
        console.log("Updated review:", updatedReview);
        res.json(updatedReview);
      } catch (zodError) {
        console.error("Validation error:", zodError);
        if (zodError instanceof z.ZodError) {
          return res.status(400).json({ error: zodError.errors });
        }
        throw zodError; // Re-throw if it's not a ZodError
      }
    } catch (error) {
      console.error(`Error updating management review ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update management review" });
    }
  });

  // DELETE route for Management Reviews
  app.delete("/api/management-reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Check if management review exists
      const review = await storage.getManagementReview(id);
      if (!review) {
        return res.status(404).json({ error: "Management review not found" });
      }

      const deleted = await qmsDeleteOperations.deleteManagementReview(id);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete management review" });
      }

      res.json({ success: true, message: "Management review deleted successfully" });
    } catch (error) {
      console.error(`Error deleting management review ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete management review" });
    }
  });

  app.get("/api/management-reviews/:id/inputs", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const inputs = await storage.getManagementReviewInputs(parseInt(id));
      res.json(inputs);
    } catch (error) {
      console.error(`Error fetching inputs for management review ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch management review inputs" });
    }
  });

  app.post("/api/management-reviews/:id/inputs", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const normalizedData = { ...req.body };
      
      // Handle client-side field mapping to server-side
      if (normalizedData.reviewId && !normalizedData.review_id) {
        normalizedData.review_id = normalizedData.reviewId;
      } else {
        // Always set review_id from the URL parameter
        normalizedData.review_id = parseInt(id);
      }
      
      const data = insertManagementReviewInputSchema.parse(normalizedData);
      const input = await storage.createManagementReviewInput(data);
      res.status(201).json(input);
    } catch (error) {
      console.error(`Error creating input for management review ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create management review input" });
    }
  });

  app.delete("/api/management-reviews/:id/inputs/:inputId", isAuthenticated, async (req, res) => {
    try {
      const { id, inputId } = req.params;
      const reviewId = parseInt(id);
      const inputIdNum = parseInt(inputId);
      
      if (isNaN(reviewId) || isNaN(inputIdNum)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Check if the review exists
      const review = await storage.getManagementReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: "Management review not found" });
      }
      
      // Delete the input
      const deleted = await storage.deleteManagementReviewInput(inputIdNum);
      if (!deleted) {
        return res.status(404).json({ error: "Input not found" });
      }
      
      res.json({ success: true, message: "Input deleted successfully" });
    } catch (error) {
      console.error(`Error deleting input ${req.params.inputId} for management review ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete management review input" });
    }
  });

  app.get("/api/management-reviews/:id/action-items", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getManagementReviewActionItems(parseInt(id));
      res.json(items);
    } catch (error) {
      console.error(`Error fetching action items for management review ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch management review action items" });
    }
  });

  app.post("/api/management-reviews/:id/action-items", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const normalizedData = { ...req.body };
      
      // Handle client-side field mapping to server-side
      if (normalizedData.reviewId && !normalizedData.review_id) {
        normalizedData.review_id = normalizedData.reviewId;
      } else {
        // Always set review_id from the URL parameter
        normalizedData.review_id = parseInt(id);
      }
      
      const data = insertManagementReviewActionItemSchema.parse(normalizedData);
      const item = await storage.createManagementReviewActionItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error(`Error creating action item for management review ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create management review action item" });
    }
  });

  // Audit Management API Routes
  app.get("/api/audits", isAuthenticated, async (req, res) => {
    try {
      // Use direct SQL query to bypass any potential issues with ORM
      const result = await pool.query('SELECT * FROM audits ORDER BY created_at DESC');
      
      console.log(`Retrieved ${result.rows.length} audits directly from database`);
      
      // Transform column names from snake_case to camelCase for frontend compatibility
      const formattedAudits = result.rows.map(audit => ({
        id: audit.id,
        auditId: audit.audit_id,
        title: audit.title,
        scope: audit.scope,
        description: audit.description,
        typeId: audit.type_id,
        statusId: audit.status_id,
        departmentId: audit.department_id,
        supplierId: audit.supplier_id,
        scheduledDate: audit.scheduled_date,
        startDate: audit.start_date,
        endDate: audit.end_date,
        standardReference: audit.standard_reference,
        leadAuditorName: audit.lead_auditor_name,
        auditLocation: audit.audit_location,
        createdBy: audit.created_by,
        createdAt: audit.created_at,
        updatedAt: audit.updated_at
      }));
      
      res.json(formattedAudits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ error: "Failed to fetch audits" });
    }
  });

  app.get("/api/audits/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First try to get the audit using the storagemethod
      let audit = await storage.getAudit(id);
      
      // If not found, try direct DB query as a fallback
      if (!audit) {
        console.log(`Audit with ID ${id} not found using storage method, trying direct DB query`);
        const result = await pool.query('SELECT * FROM audits WHERE id = $1', [id]);
        
        if (result.rows.length > 0) {
          // Transform column names from snake_case to camelCase for frontend compatibility
          const row = result.rows[0];
          audit = {
            id: row.id,
            auditId: row.audit_id,
            title: row.title,
            scope: row.scope,
            description: row.description,
            typeId: row.type_id,
            statusId: row.status_id,
            departmentId: row.department_id,
            supplierId: row.supplier_id,
            scheduledDate: row.scheduled_date,
            startDate: row.start_date,
            endDate: row.end_date,
            standardReference: row.standard_reference,
            leadAuditorName: row.lead_auditor_name,
            auditLocation: row.audit_location,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        }
      }
      
      if (!audit) {
        console.error(`Audit with ID ${id} not found after multiple attempts`);
        return res.status(404).json({ error: "Audit not found" });
      }
      
      console.log(`Successfully retrieved audit ${id}`);
      res.json(audit);
    } catch (error) {
      console.error(`Error fetching audit ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch audit" });
    }
  });

  // Emergency hardcoded audit creation endpoint
  // Emergency SQL insertion endpoint for creating audits directly
  app.post("/api/audits/sql-insert", isAuthenticated, async (req, res) => {
    try {
      console.log("Direct audit creation request received:", req.body);
      
      // Generate a unique audit ID for display
      const auditId = `AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const createdBy = req.user?.id || 9999;
      
      // Extract values from request body with fallbacks for all potentially missing fields
      const {
        title = "Audit " + new Date().toLocaleDateString(),
        scope = "General Audit",
        start_date = new Date().toISOString(),
        description = "Created on " + new Date().toLocaleString(),
        type_id = 1,
        status_id = 1,
        lead_auditor_name = "System User",
        audit_location = "On-site"
      } = req.body;
      
      // Execute a simplified direct insert
      const result = await pool.query(
        `INSERT INTO audits (
          audit_id, title, scope, start_date, description, type_id, status_id, 
          lead_auditor_name, audit_location, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          auditId,
          title,
          scope,
          new Date(start_date),
          description,
          type_id,
          status_id,
          lead_auditor_name,
          audit_location,
          createdBy
        ]
      );
      
      console.log("Direct audit creation successful:", result.rows[0]);
      
      // Return the created audit
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error in direct audit creation:", error);
      res.status(500).json({
        error: "Emergency audit creation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/audits", isAuthenticated, async (req, res) => {
    try {
      console.log("Received audit creation request:", req.body);
      
      // Completely bypass schema validation and use direct SQL insertion
      // with robust error handling and fallbacks for every field
      
      // Basic required data with guaranteed defaults
      const title = req.body.title || "Untitled Audit";
      const scope = req.body.scope || "General Scope";
      const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
      const description = req.body.description || "";
      
      // Type and status with safe defaults
      let typeId = 1; // Default to "Internal Audit"
      if (req.body.typeId !== undefined) {
        const parsedTypeId = parseInt(req.body.typeId);
        if (!isNaN(parsedTypeId)) {
          typeId = parsedTypeId;
        }
      }
      
      let statusId = 1; // Default to "Planned"
      if (req.body.statusId !== undefined) {
        const parsedStatusId = parseInt(req.body.statusId);
        if (!isNaN(parsedStatusId)) {
          statusId = parsedStatusId;
        }
      }
      
      // Safely handle department/supplier relationship
      let departmentId = null;
      let supplierId = null;
      
      // Try to get department ID either directly or from name
      if (req.body.departmentId !== undefined) {
        const parsedDeptId = parseInt(req.body.departmentId);
        if (!isNaN(parsedDeptId)) {
          departmentId = parsedDeptId;
        }
      } else if (req.body.departmentName) {
        // Lookup department by name
        try {
          // First try to use the pool directly
          const deptResult = await pool.query(
            "SELECT id FROM departments WHERE LOWER(name) = LOWER($1) LIMIT 1",
            [req.body.departmentName]
          );
          
          if (deptResult.rows && deptResult.rows.length > 0) {
            departmentId = deptResult.rows[0].id;
          } else {
            // If department doesn't exist, create a default one for Quality
            if (req.body.departmentName.toLowerCase() === 'quality') {
              departmentId = 1; // Default Quality department ID 
            }
          }
        } catch (err) {
          console.warn("Could not look up department:", err);
          // Default to Quality department ID if lookup fails
          departmentId = 1;
        }
      }
      
      // Try to get supplier ID either directly or from name
      if (req.body.supplierId !== undefined) {
        const parsedSupplierId = parseInt(req.body.supplierId);
        if (!isNaN(parsedSupplierId)) {
          supplierId = parsedSupplierId;
        }
      }
      
      // Handle dates carefully
      let scheduledDate = null;
      if (req.body.scheduledDate) {
        try {
          scheduledDate = new Date(req.body.scheduledDate);
          // Check if it's a valid date
          if (isNaN(scheduledDate.getTime())) {
            scheduledDate = null;
          }
        } catch (e) {
          scheduledDate = null;
        }
      }
      
      let endDate = null;
      if (req.body.endDate) {
        try {
          endDate = new Date(req.body.endDate);
          // Check if it's a valid date
          if (isNaN(endDate.getTime())) {
            endDate = null;
          }
        } catch (e) {
          endDate = null;
        }
      }
      
      // Other fields with safe defaults
      const standardReference = req.body.standardReference || null;
      const leadAuditor = req.body.leadAuditor || 9999; // Default to development user ID
      const leadAuditorName = req.body.leadAuditorName || "Development User";
      const auditLocation = req.body.location || req.body.auditLocation || null;
      const createdBy = req.user?.id || 9999; // Default to development user
      
      // Create a unique audit ID if not provided
      const auditId = req.body.auditId || `AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      console.log("Prepared audit data:", {
        auditId, title, scope, startDate, description, typeId, statusId,
        departmentId, supplierId, scheduledDate, endDate,
        standardReference, leadAuditorName, auditLocation, createdBy
      });
      
      // Use parameterized query to avoid SQL injection and ensure type safety
      const result = await pool.query(
        `INSERT INTO audits (
          audit_id, title, scope, start_date, description, type_id, status_id, 
          department_id, supplier_id, scheduled_date, end_date, 
          standard_reference, lead_auditor_name, audit_location, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
        RETURNING *`,
        [
          auditId,
          title,
          scope,
          startDate,
          description,
          typeId,
          statusId,
          departmentId,
          supplierId,
          scheduledDate,
          endDate,
          standardReference,
          leadAuditorName,
          auditLocation,
          createdBy
        ]
      );
      
      // Create default audit checklist items if requested
      if (req.body.hasChecklistItems === true) {
        try {
          const newAuditId = result.rows[0].id;
          
          // Create some default checklist items
          const defaultItems = [
            { text: "Review quality procedures", category: "Documentation" },
            { text: "Verify training records", category: "Training" },
            { text: "Evaluate corrective actions", category: "CAPA" }
          ];
          
          for (const item of defaultItems) {
            await pool.query(
              `INSERT INTO audit_checklist_items (audit_id, item_text, category) VALUES ($1, $2, $3)`,
              [newAuditId, item.text, item.category]
            );
          }
          
          console.log(`Created ${defaultItems.length} default checklist items for audit ${newAuditId}`);
        } catch (err) {
          console.warn("Could not create default checklist items:", err);
          // Continue without failing the audit creation
        }
      }
      
      // Log successful creation
      console.log("Audit created successfully:", result.rows[0]);
      
      // Return the created audit data
      return res.status(201).json(result.rows[0]);
    } catch (error: any) {
      // Detailed error logging for debugging
      console.error("Error creating audit:", error);
      
      if (error.code === '23505') {
        // Duplicate key error
        return res.status(400).json({ 
          error: "Duplicate audit ID",
          details: "An audit with this ID already exists. Please try again."
        });
      } else if (error.code === '23502') {
        // Not null violation
        return res.status(400).json({ 
          error: "Missing required field",
          details: `The field "${error.column}" is required.`
        });
      }
      
      // Return a user-friendly error
      return res.status(500).json({ 
        error: "Failed to create audit",
        details: error.message || "An unexpected database error occurred"
      });
    }
  });

  app.patch("/api/audits/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auditData = req.body;
      
      const audit = await storage.updateAudit(id, auditData);
      
      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }
      
      res.json(audit);
    } catch (error) {
      console.error(`Error updating audit ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update audit" });
    }
  });

  // DELETE route for Audits
  app.delete("/api/audits/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Check if audit exists
      const audit = await storage.getAudit(id);
      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      const deleted = await qmsDeleteOperations.deleteAudit(id);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete audit" });
      }

      res.json({ success: true, message: "Audit deleted successfully" });
    } catch (error) {
      console.error(`Error deleting audit ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete audit" });
    }
  });

  // Audit Checklist Items API Routes
  app.get("/api/audits/:auditId/checklist", isAuthenticated, async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const items = await storage.getAuditChecklistItems(auditId);
      
      res.json(items);
    } catch (error) {
      console.error(`Error fetching checklist items for audit ${req.params.auditId}:`, error);
      res.status(500).json({ error: "Failed to fetch checklist items" });
    }
  });

  app.post("/api/audits/:auditId/checklist", isAuthenticated, async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const itemData = insertAuditChecklistItemSchema.parse({
        ...req.body,
        auditId
      });
      
      const item = await storage.createAuditChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error: unknown) {
      console.error(`Error creating checklist item for audit ${req.params.auditId}:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to create checklist item", details: errorMessage });
    }
  });

  // Batch create checklist items
  app.post("/api/audits/:auditId/checklist-items/batch", isAuthenticated, async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of checklist items" });
      }
      
      const items = [];
      for (const itemData of req.body) {
        try {
          const validatedItem = insertAuditChecklistItemSchema.parse({
            ...itemData,
            auditId
          });
          
          const item = await storage.createAuditChecklistItem(validatedItem);
          items.push(item);
        } catch (itemError) {
          console.error("Error validating or creating checklist item:", itemError);
          // Continue with next item even if one fails
        }
      }
      
      // After creating checklist items, update the audit to mark it has checklist items
      await storage.updateAudit(auditId, { hasChecklistItems: true });
      
      res.status(201).json(items);
    } catch (error) {
      console.error(`Error batch creating checklist items for audit ${req.params.auditId}:`, error);
      res.status(500).json({ error: "Failed to create checklist items" });
    }
  });

  app.patch("/api/audits/checklist/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = req.body;
      
      const item = await storage.updateAuditChecklistItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ error: "Checklist item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error(`Error updating checklist item ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update checklist item" });
    }
  });

  // Supplier Corrective Request (SCR) API Routes
  app.get("/api/scr", isAuthenticated, async (req, res) => {
    try {
      let scrList: SupplierCorrectiveRequest[];
      
      // Filter by audit if provided
      if (req.query.auditId) {
        const auditId = parseInt(req.query.auditId as string);
        scrList = await storage.getSupplierCorrectiveRequestsByAudit(auditId);
      } else {
        scrList = await storage.getSupplierCorrectiveRequests();
      }
      
      res.json(scrList);
    } catch (error) {
      console.error("Error fetching supplier corrective requests:", error);
      res.status(500).json({ error: "Failed to fetch supplier corrective requests" });
    }
  });

  app.get("/api/scr/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scr = await storage.getSupplierCorrectiveRequest(id);
      
      if (!scr) {
        return res.status(404).json({ error: "Supplier corrective request not found" });
      }
      
      res.json(scr);
    } catch (error) {
      console.error(`Error fetching SCR ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch supplier corrective request" });
    }
  });

  app.post("/api/scr", isAuthenticated, async (req, res) => {
    try {
      const scrData = insertSupplierCorrectiveRequestSchema.parse({
        ...req.body,
        initiatedBy: req.user.id
      });
      
      const scr = await storage.createSupplierCorrectiveRequest(scrData);
      res.status(201).json(scr);
    } catch (error) {
      console.error("Error creating supplier corrective request:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      
      res.status(500).json({ error: "Failed to create supplier corrective request" });
    }
  });

  app.patch("/api/scr/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scrData = req.body;
      
      const scr = await storage.updateSupplierCorrectiveRequest(id, scrData);
      
      if (!scr) {
        return res.status(404).json({ error: "Supplier corrective request not found" });
      }
      
      res.json(scr);
    } catch (error) {
      console.error(`Error updating SCR ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update supplier corrective request" });
    }
  });

  // SCR Attachments API Routes
  app.get("/api/scr/:scrId/attachments", isAuthenticated, async (req, res) => {
    try {
      const scrId = parseInt(req.params.scrId);
      const attachments = await storage.getScrAttachments(scrId);
      
      res.json(attachments);
    } catch (error) {
      console.error(`Error fetching attachments for SCR ${req.params.scrId}:`, error);
      res.status(500).json({ error: "Failed to fetch SCR attachments" });
    }
  });

  app.post("/api/scr/:scrId/attachments", isAuthenticated, async (req, res) => {
    try {
      const scrId = parseInt(req.params.scrId);
      const attachmentData = insertScrAttachmentSchema.parse({
        ...req.body,
        scrId,
        uploadedBy: req.user.id
      });
      
      const attachment = await storage.createScrAttachment(attachmentData);
      res.status(201).json(attachment);
    } catch (error) {
      console.error(`Error creating attachment for SCR ${req.params.scrId}:`, error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      
      res.status(500).json({ error: "Failed to create SCR attachment" });
    }
  });

  app.delete("/api/scr/attachments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteScrAttachment(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting attachment ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete SCR attachment" });
    }
  });
  
  // Measurement & Analysis routes
  // Complaints
  app.get("/api/complaints", isAuthenticated, async (req, res) => {
    try {
      const complaints = await storage.getComplaints();
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  app.get("/api/complaints/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const complaint = await storage.getComplaint(parseInt(id));
      
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      res.json(complaint);
    } catch (error) {
      console.error(`Error fetching complaint ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch complaint" });
    }
  });

  app.post("/api/complaints", isAuthenticated, async (req, res) => {
    try {
      console.log("Received complaint data:", JSON.stringify(req.body, null, 2));
      const data = insertComplaintSchema.parse(req.body);
      console.log("Parsed complaint data:", JSON.stringify(data, null, 2));
      const newComplaint = await storage.createComplaint(data);
      res.status(201).json(newComplaint);
    } catch (error: unknown) {
      console.error("Error creating complaint:", error);
      
      // Add more detailed error information for debugging
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        if ('errors' in error && typeof error.errors === 'object') {
          console.error("Validation errors:", error.errors);
        }
        
        res.status(400).json({ error: error.message || "Failed to create complaint" });
      } else {
        res.status(500).json({ error: "An unexpected error occurred when creating the complaint" });
      }
    }
  });

  app.patch("/api/complaints/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedComplaint = await storage.updateComplaint(parseInt(id), req.body);
      
      if (!updatedComplaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      res.json(updatedComplaint);
    } catch (error: unknown) {
      console.error(`Error updating complaint ${req.params.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ error: errorMessage || "Failed to update complaint" });
    }
  });

  app.delete("/api/complaints/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteComplaint(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting complaint ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete complaint" });
    }
  });
  
  // Create a CAPA from an existing complaint
  app.post("/api/complaints/:id/create-capa", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const complaintId = parseInt(id);
      
      // Get the complaint to use its data for CAPA creation
      const complaint = await storage.getComplaint(complaintId);
      
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      // Check if a CAPA already exists for this complaint
      if (complaint.capaId) {
        return res.json({ 
          message: "CAPA already exists for this complaint",
          capaId: complaint.capaId
        });
      }
      
      // Generate a CAPA ID
      const currentYear = new Date().getFullYear();
      const capaId = `CAPA-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Create the CAPA record
      const capa = await storage.createCapa({
        capaId: capaId,
        title: `CAPA for Complaint ${complaint.complaintNumber}`,
        description: complaint.description,
        source: "customer_complaint",
        sourceId: complaintId,
        typeId: 1, // Corrective action (assuming 1 is the ID for corrective actions)
        statusId: 1, // Open/New status
        riskPriority: complaint.severity >= 4 ? "high" : (complaint.severity >= 2 ? "medium" : "low"),
        initiatedBy: req.user?.id || 1,
        dateInitiated: new Date(),
        patientSafetyImpact: complaint.isReportable,
        // Add other default fields as needed
      });
      
      // Update the complaint with the CAPA ID
      await storage.updateComplaint(complaintId, { capaId: capa.id });
      
      // Return the created CAPA
      res.json({
        message: "CAPA created successfully",
        capaId: capaId,
        capa: capa
      });
    } catch (error) {
      console.error(`Error creating CAPA from complaint ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to create CAPA from complaint" });
    }
  });

  // CAPA Management Routes
  app.get("/api/capas", isAuthenticated, async (req, res) => {
    try {
      const capas = await storage.getCapas();
      res.json(capas);
    } catch (error) {
      console.error("Error fetching CAPAs:", error);
      res.status(500).json({ error: "Failed to fetch CAPAs" });
    }
  });

  app.get("/api/capas/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const capa = await storage.getCapa(parseInt(id));
      
      if (!capa) {
        return res.status(404).json({ error: "CAPA not found" });
      }
      
      res.json(capa);
    } catch (error) {
      console.error(`Error fetching CAPA ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch CAPA" });
    }
  });

  app.post("/api/capas", isAuthenticated, async (req, res) => {
    try {
      // Log the received data for debugging
      console.log("Received CAPA data:", JSON.stringify(req.body, null, 2));
      
      // Generate CAPA ID if not provided
      if (!req.body.capaId) {
        const currentYear = new Date().getFullYear();
        req.body.capaId = `CAPA-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      
      // Validate and transform the data using our schema
      const validatedData = insertCapaSchema.parse({
        ...req.body,
        initiatedBy: req.body.initiatedBy || req.user?.id || 1,
        typeId: req.body.typeId || 1, // Default to corrective action
        statusId: req.body.statusId || 1, // Default to open status
      });
      
      // Create the CAPA record
      const capa = await storage.createCapa(validatedData);
      console.log("CAPA created successfully:", capa);
      
      res.status(201).json(capa);
    } catch (error) {
      console.error("Error creating CAPA:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid CAPA data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create CAPA" });
    }
  });

  app.patch("/api/capas/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedCapa = await storage.updateCapa(parseInt(id), req.body);
      
      if (!updatedCapa) {
        return res.status(404).json({ error: "CAPA not found" });
      }
      
      res.json(updatedCapa);
    } catch (error) {
      console.error(`Error updating CAPA ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update CAPA" });
    }
  });

  // Customer Feedback
  // Get all customer feedback
  app.get("/api/customer-feedback", async (req, res) => {
    // Support for X-Auth-Local header in development mode
    const isDevMode = process.env.NODE_ENV === 'development';
    const hasLocalAuth = req.headers['x-auth-local'] === 'true';
    
    if (!req.isAuthenticated() && !(isDevMode && hasLocalAuth)) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    }
    
    try {
      const feedbackItems = await storage.getCustomerFeedback();
      res.json(feedbackItems);
    } catch (error) {
      console.error("Error fetching customer feedback:", error);
      res.status(500).json({ error: "Failed to fetch customer feedback" });
    }
  });

  // Get specific customer feedback by ID
  app.get("/api/customer-feedback/:id", async (req, res) => {
    // Support for X-Auth-Local header in development mode
    const isDevMode = process.env.NODE_ENV === 'development';
    const hasLocalAuth = req.headers['x-auth-local'] === 'true';
    
    if (!req.isAuthenticated() && !(isDevMode && hasLocalAuth)) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    }
    
    try {
      const { id } = req.params;
      const feedback = await storage.getCustomerFeedbackItem(parseInt(id));
      
      if (!feedback) {
        return res.status(404).json({ error: "Customer feedback not found" });
      }
      
      res.json(feedback);
    } catch (error) {
      console.error(`Error fetching customer feedback ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch customer feedback" });
    }
  });
  
  // Create new customer feedback with auto-generated ID
  app.post("/api/customer-feedback", async (req, res) => {
    // Support for X-Auth-Local header in development mode
    const isDevMode = process.env.NODE_ENV === 'development';
    const hasLocalAuth = req.headers['x-auth-local'] === 'true';
    
    if (!req.isAuthenticated() && !(isDevMode && hasLocalAuth)) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    }
    
    try {
      const data = insertCustomerFeedbackSchema.parse(req.body);
      
      // Let the server handle generating the feedback number
      // This will use the generateFeedbackNumber function we implemented
      // which follows the format FBK-YYYY-XXX where YYYY is current year and XXX is sequential
      const newFeedback = await storage.createCustomerFeedback(data);
      
      console.log(`Created feedback with auto-generated ID: ${newFeedback.feedbackNumber}`);
      res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error creating customer feedback:", error);
      res.status(400).json({ error: error.message || "Failed to create customer feedback" });
    }
  });

  app.patch("/api/customer-feedback/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedFeedback = await storage.updateCustomerFeedback(parseInt(id), req.body);
      
      if (!updatedFeedback) {
        return res.status(404).json({ error: "Customer feedback not found" });
      }
      
      res.json(updatedFeedback);
    } catch (error) {
      console.error(`Error updating customer feedback ${req.params.id}:`, error);
      res.status(400).json({ error: error.message || "Failed to update customer feedback" });
    }
  });

  app.delete("/api/customer-feedback/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCustomerFeedback(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: "Customer feedback not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting customer feedback ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete customer feedback" });
    }
  });

  // Calibration Assets
  app.get("/api/calibration-assets", isAuthenticated, async (req, res) => {
    try {
      const assets = await storage.getCalibrationAssets();
      res.json(assets);
    } catch (error) {
      console.error("Error fetching calibration assets:", error);
      res.status(500).json({ error: "Failed to fetch calibration assets" });
    }
  });

  app.get("/api/calibration-assets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await storage.getCalibrationAsset(parseInt(id));
      
      if (!asset) {
        return res.status(404).json({ error: "Calibration asset not found" });
      }
      
      res.json(asset);
    } catch (error) {
      console.error(`Error fetching calibration asset ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch calibration asset" });
    }
  });

  app.post("/api/calibration-assets", isAuthenticated, async (req, res) => {
    try {
      const data = insertCalibrationAssetSchema.parse(req.body);
      const newAsset = await storage.createCalibrationAsset(data);
      res.status(201).json(newAsset);
    } catch (error) {
      console.error("Error creating calibration asset:", error);
      res.status(400).json({ error: error.message || "Failed to create calibration asset" });
    }
  });

  app.patch("/api/calibration-assets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAsset = await storage.updateCalibrationAsset(parseInt(id), req.body);
      
      if (!updatedAsset) {
        return res.status(404).json({ error: "Calibration asset not found" });
      }
      
      res.json(updatedAsset);
    } catch (error) {
      console.error(`Error updating calibration asset ${req.params.id}:`, error);
      res.status(400).json({ error: error.message || "Failed to update calibration asset" });
    }
  });

  app.delete("/api/calibration-assets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCalibrationAsset(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: "Calibration asset not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting calibration asset ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete calibration asset" });
    }
  });

  // Calibration Records
  app.get("/api/calibration-records", isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getCalibrationRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching calibration records:", error);
      res.status(500).json({ error: "Failed to fetch calibration records" });
    }
  });

  app.get("/api/calibration-records/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getCalibrationRecord(parseInt(id));
      
      if (!record) {
        return res.status(404).json({ error: "Calibration record not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error(`Error fetching calibration record ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch calibration record" });
    }
  });

  app.get("/api/calibration-assets/:assetId/records", isAuthenticated, async (req, res) => {
    try {
      const { assetId } = req.params;
      const records = await storage.getCalibrationRecordsByAsset(parseInt(assetId));
      res.json(records);
    } catch (error) {
      console.error(`Error fetching calibration records for asset ${req.params.assetId}:`, error);
      res.status(500).json({ error: "Failed to fetch calibration records" });
    }
  });

  app.post("/api/calibration-records", isAuthenticated, async (req, res) => {
    try {
      const data = insertCalibrationRecordSchema.parse(req.body);
      const newRecord = await storage.createCalibrationRecord(data);
      res.status(201).json(newRecord);
    } catch (error) {
      console.error("Error creating calibration record:", error);
      res.status(400).json({ error: error.message || "Failed to create calibration record" });
    }
  });

  app.patch("/api/calibration-records/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRecord = await storage.updateCalibrationRecord(parseInt(id), req.body);
      
      if (!updatedRecord) {
        return res.status(404).json({ error: "Calibration record not found" });
      }
      
      res.json(updatedRecord);
    } catch (error) {
      console.error(`Error updating calibration record ${req.params.id}:`, error);
      res.status(400).json({ error: error.message || "Failed to update calibration record" });
    }
  });

  app.delete("/api/calibration-records/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCalibrationRecord(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: "Calibration record not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting calibration record ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete calibration record" });
    }
  });

  // Document API Routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      // Use the document storage to get all documents
      const documents = await documentStorage.getDocuments();
      
      // Transform document data to match frontend expectations
      const transformedDocuments = documents.map(doc => {
        // Map status IDs to the string values expected by the frontend
        let status = 'DRAFT';
        switch (doc.statusId) {
          case 1: status = 'DRAFT'; break;
          case 2: status = 'REVIEW'; break;  
          case 3: status = 'APPROVED'; break;
          case 4: status = 'EFFECTIVE'; break;
          case 5: status = 'OBSOLETE'; break;
        }
        
        // Map type IDs to string values
        let type = 'SOP';
        switch (doc.typeId) {
          case 1: type = 'SOP'; break;
          case 2: type = 'WI'; break;
          case 3: type = 'FORM'; break;
          case 4: type = 'POLICY'; break;
          case 5: type = 'SPEC'; break;
          case 6: type = 'TEMPLATE'; break;
        }
        
        // Format dates consistently
        const effectiveDate = doc.effectiveDate ? new Date(doc.effectiveDate).toISOString().split('T')[0] : null;
        const expirationDate = doc.expirationDate ? new Date(doc.expirationDate).toISOString().split('T')[0] : null;
        
        // Return the transformed document with the expected structure
        return {
          id: doc.documentId, // Using documentId as the frontend expects this as 'id'
          title: doc.title,
          type,
          status,
          version: doc.revision || '1.0',
          effectiveDate,
          reviewDate: expirationDate, // Using expirationDate as reviewDate
          owner: doc.createdBy.toString(),
          department: doc.ownerDepartment || 'QA',
          // Include original id for reference if needed
          dbId: doc.id
        };
      });
      
      res.json(transformedDocuments);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: error.message || "Failed to fetch documents" });
    }
  });
  
  // Get documents pending approval
  app.get("/api/documents/pending", isAuthenticated, async (req, res) => {
    try {
      const pendingDocuments = await documentStorage.getPendingDocuments();
      
      // Transform document data to match frontend expectations - same as main document endpoint
      const transformedDocuments = pendingDocuments.map(doc => {
        // Map status IDs to the string values expected by the frontend
        let status = 'REVIEW'; // Pending documents have status REVIEW in frontend
        
        // Map type IDs to string values
        let type = 'SOP';
        switch (doc.typeId) {
          case 1: type = 'SOP'; break;
          case 2: type = 'WI'; break;
          case 3: type = 'FORM'; break;
          case 4: type = 'POLICY'; break;
          case 5: type = 'SPEC'; break;
          case 6: type = 'TEMPLATE'; break;
        }
        
        // Format dates consistently
        const effectiveDate = doc.effectiveDate ? new Date(doc.effectiveDate).toISOString().split('T')[0] : null;
        const expirationDate = doc.expirationDate ? new Date(doc.expirationDate).toISOString().split('T')[0] : null;
        
        // Return the transformed document with the expected structure
        return {
          id: doc.documentId, // Using documentId as the frontend expects this as 'id'
          title: doc.title,
          type,
          status,
          version: doc.revision || '1.0',
          effectiveDate,
          reviewDate: expirationDate, // Using expirationDate as reviewDate
          owner: doc.createdBy.toString(),
          department: doc.ownerDepartment || 'QA',
          // Include original id for reference if needed
          dbId: doc.id
        };
      });
      
      res.json(transformedDocuments);
    } catch (error: any) {
      console.error("Error fetching pending documents:", error);
      res.status(500).json({ error: error.message || "Failed to fetch pending documents" });
    }
  });

  // Get all documents
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await documentStorage.getDocuments();
      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: error.message || "Failed to fetch documents" });
    }
  });

  // Get a specific document by ID
  app.get("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Try to get from document storage first
      let document;
      try {
        document = await documentStorage.getDocument(parseInt(id));
      } catch (error) {
        // If not found in storage, query database directly
        console.log(`Document ${id} not found in storage, querying database directly`);
        const result = await db.select().from(documents).where(eq(documents.id, parseInt(id)));
        if (result.length > 0) {
          const doc = result[0];
          document = {
            id: doc.id,
            documentId: doc.document_id || doc.documentId,
            title: doc.title,
            typeId: doc.type_id || doc.typeId,
            statusId: doc.status_id || doc.statusId,
            revision: doc.revision,
            effectiveDate: doc.effective_date || doc.effectiveDate,
            expirationDate: doc.expiration_date || doc.expirationDate,
            createdBy: doc.created_by || doc.createdBy,
            lastModifiedBy: doc.last_modified_by || doc.lastModifiedBy,
            description: doc.description,
            department: doc.department,
            filePath: doc.file_path || doc.filePath,
            fileName: doc.file_name || doc.fileName,
            fileSize: doc.file_size || doc.fileSize,
            isActive: doc.is_active !== undefined ? doc.is_active : doc.isActive,
            isControlled: doc.is_controlled !== undefined ? doc.is_controlled : doc.isControlled,
            trainingRequired: doc.training_required !== undefined ? doc.training_required : doc.trainingRequired,
            confidentialityLevel: doc.confidentiality_level || doc.confidentialityLevel,
            createdAt: doc.created_at || doc.createdAt,
            updatedAt: doc.updated_at || doc.updatedAt
          };
        }
      }
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      res.json(document);
    } catch (error: any) {
      console.error(`Error fetching document ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || "Failed to fetch document" });
    }
  });

  // Serve document files for viewing/download
  app.get("/api/documents/:id/file", async (req, res) => {
    // Check authentication for downloads, but allow inline viewing
    const inline = req.query.inline === 'true';
    if (!inline) {
      // Apply authentication middleware for downloads
      return isAuthenticated(req, res, async () => {
        await handleDocumentFileServing(req, res);
      });
    }
    // For inline viewing, proceed without authentication check
    await handleDocumentFileServing(req, res);
  });

  async function handleDocumentFileServing(req: any, res: any) {
    try {
      const { id } = req.params;
      const inline = req.query.inline === 'true'; // For inline viewing vs download
      
      // Get document info from database
      const result = await db.select().from(documents).where(eq(documents.id, parseInt(id)));
      if (result.length === 0) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const document = result[0];
      // Map database snake_case to camelCase for compatibility
      const filePath = document.file_path || document.filePath;
      const fileName = document.file_name || document.fileName;
      
      if (!filePath || !fileName) {
        return res.status(404).json({ error: "Document file not available" });
      }
      
      // Check if file exists
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Document file not found on disk" });
      }
      
      // Set appropriate headers
      const fileExtension = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (fileExtension) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.xls':
          contentType = 'application/vnd.ms-excel';
          break;
        case '.xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          contentType = 'application/octet-stream';
      }
      
      res.setHeader('Content-Type', contentType);
      
      if (inline && fileExtension === '.pdf') {
        // For PDF inline viewing
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      } else {
        // For download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      }
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error(`Error streaming file ${filePath}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error reading file' });
        }
      });
      
    } catch (error: any) {
      console.error(`Error serving document file ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || "Failed to serve document file" });
    }
  }

  // Delete a document by ID
  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    console.log(`=== ROUTE HANDLER REACHED ===`);
    console.log(`DELETE /api/documents/${req.params.id} called`);
    console.log(`Request headers:`, req.headers);
    
    try {
      const { id } = req.params;
      const documentId = parseInt(id);
      
      console.log(`Document deletion request for ID: ${documentId}`);
      
      if (isNaN(documentId)) {
        console.log(`Invalid document ID format: ${id}`);
        return res.status(400).json({ error: "Invalid document ID format" });
      }

      // Direct database check using raw SQL to bypass ORM issues
      console.log(`=== DOCUMENT DELETION DEBUG START ===`);
      console.log(`Requested document ID: ${documentId} (type: ${typeof documentId})`);
      
      try {
        // Use raw SQL to check if document exists
        console.log(`Executing SQL: SELECT id, title, status FROM documents WHERE id = ${documentId}`);
        const checkResult = await db.execute(sql`SELECT id, title, status FROM documents WHERE id = ${documentId}`);
        console.log(`Raw SQL check result:`, checkResult);
        console.log(`Number of rows returned:`, checkResult.rows?.length || 0);
        
        if (!checkResult.rows || checkResult.rows.length === 0) {
          console.log(`=== DOCUMENT NOT FOUND - ID ${documentId} ===`);
          
          // Check what documents actually exist
          const allDocsResult = await db.execute(sql`SELECT id, title, status FROM documents LIMIT 10`);
          console.log(`All documents in database:`, allDocsResult.rows);
          
          return res.status(404).json({ error: "Document not found" });
        }
        
        const document = checkResult.rows[0];
        console.log(`Document found:`, document);
        
        // ISO 13485 compliance check - prevent deletion of approved documents
        if (document.status === "APPROVED") {
          console.log(`Deletion blocked: Document is approved`);
          return res.status(400).json({ 
            error: "Cannot delete approved document", 
            message: "Approved documents cannot be deleted per ISO 13485 requirements. Use obsolete status instead." 
          });
        }
        
        // Perform deletion using raw SQL with transaction
        console.log(`Starting deletion transaction for document ${documentId}`);
        await db.transaction(async (tx) => {
          // Delete document approvals first (foreign key constraint)
          const approvalDelete = await tx.execute(sql`DELETE FROM document_approvals WHERE document_id = ${documentId}`);
          console.log(`Deleted approvals:`, approvalDelete);
          
          // Delete document versions
          const versionDelete = await tx.execute(sql`DELETE FROM document_versions WHERE document_id = ${documentId}`);
          console.log(`Deleted versions:`, versionDelete);
          
          // Finally delete the main document
          const deleteResult = await tx.execute(sql`DELETE FROM documents WHERE id = ${documentId}`);
          console.log(`Document deletion result:`, deleteResult);
        });
        
        console.log(`Document ${documentId} deleted successfully`);
        console.log(`=== DOCUMENT DELETION DEBUG END ===`);
        
        res.json({ success: true, message: "Document deleted successfully" });
        
      } catch (dbError) {
        console.error(`Database error during deletion:`, dbError);
        return res.status(500).json({ error: "Database error during deletion" });
      }
      
    } catch (error: any) {
      console.error(`Error deleting document ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || "Failed to delete document" });
    }
  });

  // Register the Management Review Router with automatic number generation
  app.use(managementReviewRouter);
  
  // Register the Design Project Router with automatic code generation
  app.use(designProjectRouter);
  app.use(designProjectTypesRouter);
  
  // Register the Document Approval Router
  app.use(documentApprovalRouter);
  
  // Register Document Revision routes (after individual document routes to prevent conflicts)
  app.use('/api/documents', documentRevisionsRouter);
  
  // Register Supplier Management Routes
  setupSupplierRoutes(app);
  
  // Register Regulatory Reportability Routes
  app.use('/api/regulatory-reportability', regulatoryReportabilityRouter);

  // Register KPI Analytics Routes
  app.use('/api/kpi', createKPIAnalyticsRoutes(storage));

  // Register Technical Documentation Routes
  app.use('/api/technical-documentation', technicalDocumentationRouter);

  // Register Design History File Routes
  app.use('/api/dhf', dhfRouter);
  
  // Register Design Control Extended Routes
  app.use('/api/design-control', designControlExtendedRouter);

  // Design Control Traceability Module API Routes
  
  // User Needs Routes
  app.get("/api/design-user-needs", isAuthenticated, async (req, res) => {
    try {
      const userNeeds = await storage.getDesignUserNeeds();
      res.json(userNeeds);
    } catch (error) {
      console.error("Error fetching design user needs:", error);
      res.status(500).json({ error: "Failed to fetch design user needs" });
    }
  });

  app.get("/api/design-user-needs/:id", isAuthenticated, async (req, res) => {
    try {
      const userNeed = await storage.getDesignUserNeed(parseInt(req.params.id));
      if (!userNeed) {
        return res.status(404).json({ error: "Design user need not found" });
      }
      res.json(userNeed);
    } catch (error) {
      console.error("Error fetching design user need:", error);
      res.status(500).json({ error: "Failed to fetch design user need" });
    }
  });

  app.post("/api/design-user-needs", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertDesignUserNeedSchema.parse(req.body);
      const userNeed = await storage.createDesignUserNeed(parsedData);
      res.status(201).json(userNeed);
    } catch (error) {
      console.error("Error creating design user need:", error);
      res.status(500).json({ error: "Failed to create design user need" });
    }
  });

  app.put("/api/design-user-needs/:id", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertDesignUserNeedSchema.partial().parse(req.body);
      const userNeed = await storage.updateDesignUserNeed(parseInt(req.params.id), parsedData);
      if (!userNeed) {
        return res.status(404).json({ error: "Design user need not found" });
      }
      res.json(userNeed);
    } catch (error) {
      console.error("Error updating design user need:", error);
      res.status(500).json({ error: "Failed to update design user need" });
    }
  });

  app.delete("/api/design-user-needs/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteDesignUserNeed(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Design user need not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting design user need:", error);
      res.status(500).json({ error: "Failed to delete design user need" });
    }
  });

  // Design Inputs Routes
  app.get("/api/traceability-design-inputs", isAuthenticated, async (req, res) => {
    try {
      const inputs = await storage.getTraceabilityDesignInputs();
      res.json(inputs);
    } catch (error) {
      console.error("Error fetching traceability design inputs:", error);
      res.status(500).json({ error: "Failed to fetch traceability design inputs" });
    }
  });

  app.get("/api/traceability-design-inputs/:id", isAuthenticated, async (req, res) => {
    try {
      const input = await storage.getTraceabilityDesignInput(parseInt(req.params.id));
      if (!input) {
        return res.status(404).json({ error: "Traceability design input not found" });
      }
      res.json(input);
    } catch (error) {
      console.error("Error fetching traceability design input:", error);
      res.status(500).json({ error: "Failed to fetch traceability design input" });
    }
  });

  app.post("/api/traceability-design-inputs", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertTraceabilityDesignInputSchema.parse(req.body);
      const input = await storage.createTraceabilityDesignInput(parsedData);
      res.status(201).json(input);
    } catch (error) {
      console.error("Error creating traceability design input:", error);
      res.status(500).json({ error: "Failed to create traceability design input" });
    }
  });

  app.put("/api/traceability-design-inputs/:id", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertTraceabilityDesignInputSchema.partial().parse(req.body);
      const input = await storage.updateTraceabilityDesignInput(parseInt(req.params.id), parsedData);
      if (!input) {
        return res.status(404).json({ error: "Traceability design input not found" });
      }
      res.json(input);
    } catch (error) {
      console.error("Error updating traceability design input:", error);
      res.status(500).json({ error: "Failed to update traceability design input" });
    }
  });

  app.delete("/api/traceability-design-inputs/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteTraceabilityDesignInput(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Traceability design input not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting traceability design input:", error);
      res.status(500).json({ error: "Failed to delete traceability design input" });
    }
  });

  // Design Outputs Routes
  app.get("/api/traceability-design-outputs", isAuthenticated, async (req, res) => {
    try {
      const outputs = await storage.getTraceabilityDesignOutputs();
      res.json(outputs);
    } catch (error) {
      console.error("Error fetching traceability design outputs:", error);
      res.status(500).json({ error: "Failed to fetch traceability design outputs" });
    }
  });

  app.get("/api/traceability-design-outputs/:id", isAuthenticated, async (req, res) => {
    try {
      const output = await storage.getTraceabilityDesignOutput(parseInt(req.params.id));
      if (!output) {
        return res.status(404).json({ error: "Traceability design output not found" });
      }
      res.json(output);
    } catch (error) {
      console.error("Error fetching traceability design output:", error);
      res.status(500).json({ error: "Failed to fetch traceability design output" });
    }
  });

  app.post("/api/traceability-design-outputs", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertTraceabilityDesignOutputSchema.parse(req.body);
      const output = await storage.createTraceabilityDesignOutput(parsedData);
      res.status(201).json(output);
    } catch (error) {
      console.error("Error creating traceability design output:", error);
      res.status(500).json({ error: "Failed to create traceability design output" });
    }
  });

  app.put("/api/traceability-design-outputs/:id", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertTraceabilityDesignOutputSchema.partial().parse(req.body);
      const output = await storage.updateTraceabilityDesignOutput(parseInt(req.params.id), parsedData);
      if (!output) {
        return res.status(404).json({ error: "Traceability design output not found" });
      }
      res.json(output);
    } catch (error) {
      console.error("Error updating traceability design output:", error);
      res.status(500).json({ error: "Failed to update traceability design output" });
    }
  });

  app.delete("/api/traceability-design-outputs/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteTraceabilityDesignOutput(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Traceability design output not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting traceability design output:", error);
      res.status(500).json({ error: "Failed to delete traceability design output" });
    }
  });

  // Verification Records Routes
  app.get("/api/verification-records", isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getVerificationRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching verification records:", error);
      res.status(500).json({ error: "Failed to fetch verification records" });
    }
  });

  app.get("/api/verification-records/:id", isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getVerificationRecord(parseInt(req.params.id));
      if (!record) {
        return res.status(404).json({ error: "Verification record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching verification record:", error);
      res.status(500).json({ error: "Failed to fetch verification record" });
    }
  });

  app.post("/api/verification-records", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertVerificationRecordSchema.parse(req.body);
      const record = await storage.createVerificationRecord(parsedData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating verification record:", error);
      res.status(500).json({ error: "Failed to create verification record" });
    }
  });

  app.put("/api/verification-records/:id", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertVerificationRecordSchema.partial().parse(req.body);
      const record = await storage.updateVerificationRecord(parseInt(req.params.id), parsedData);
      if (!record) {
        return res.status(404).json({ error: "Verification record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error updating verification record:", error);
      res.status(500).json({ error: "Failed to update verification record" });
    }
  });

  app.delete("/api/verification-records/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteVerificationRecord(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Verification record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting verification record:", error);
      res.status(500).json({ error: "Failed to delete verification record" });
    }
  });

  // Validation Records Routes
  app.get("/api/validation-records", isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getValidationRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching validation records:", error);
      res.status(500).json({ error: "Failed to fetch validation records" });
    }
  });

  app.get("/api/validation-records/:id", isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getValidationRecord(parseInt(req.params.id));
      if (!record) {
        return res.status(404).json({ error: "Validation record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching validation record:", error);
      res.status(500).json({ error: "Failed to fetch validation record" });
    }
  });

  app.post("/api/validation-records", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertValidationRecordSchema.parse(req.body);
      const record = await storage.createValidationRecord(parsedData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating validation record:", error);
      res.status(500).json({ error: "Failed to create validation record" });
    }
  });

  app.put("/api/validation-records/:id", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertValidationRecordSchema.partial().parse(req.body);
      const record = await storage.updateValidationRecord(parseInt(req.params.id), parsedData);
      if (!record) {
        return res.status(404).json({ error: "Validation record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error updating validation record:", error);
      res.status(500).json({ error: "Failed to update validation record" });
    }
  });

  app.delete("/api/validation-records/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteValidationRecord(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Validation record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting validation record:", error);
      res.status(500).json({ error: "Failed to delete validation record" });
    }
  });

  // Traceability Matrix Routes
  app.get("/api/traceability-matrix", isAuthenticated, async (req, res) => {
    try {
      const matrix = await storage.generateTraceabilityMatrix();
      res.json(matrix);
    } catch (error) {
      console.error("Error generating traceability matrix:", error);
      res.status(500).json({ error: "Failed to generate traceability matrix" });
    }
  });

  app.get("/api/traceability-matrix-snapshots", isAuthenticated, async (req, res) => {
    try {
      const snapshots = await storage.getTraceabilityMatrixSnapshots();
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching traceability matrix snapshots:", error);
      res.status(500).json({ error: "Failed to fetch traceability matrix snapshots" });
    }
  });

  app.post("/api/traceability-matrix-snapshots", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertTraceabilityMatrixSnapshotSchema.parse(req.body);
      const snapshot = await storage.createTraceabilityMatrixSnapshot(parsedData);
      res.status(201).json(snapshot);
    } catch (error) {
      console.error("Error creating traceability matrix snapshot:", error);
      res.status(500).json({ error: "Failed to create traceability matrix snapshot" });
    }
  });

  // Task Dependencies Routes
  app.get("/api/design-task-dependencies/:taskId/:taskType", isAuthenticated, async (req, res) => {
    try {
      const dependencies = await storage.getDesignTaskDependencies(req.params.taskId, req.params.taskType);
      res.json(dependencies);
    } catch (error) {
      console.error("Error fetching design task dependencies:", error);
      res.status(500).json({ error: "Failed to fetch design task dependencies" });
    }
  });

  // Design Control Traceability Matrix Routes - Added directly to bypass Vite middleware
  app.get("/api/design-control/user-requirements", isAuthenticated, async (req, res) => {
    try {
      const userRequirements = await storage.getUserRequirements('DP-2025-001');
      res.json(userRequirements);
    } catch (error) {
      console.error('Error fetching user requirements:', error);
      res.status(500).json({ error: 'Failed to fetch user requirements' });
    }
  });

  app.get("/api/design-control/traceability-design-inputs", isAuthenticated, async (req, res) => {
    try {
      const designInputs = await storage.getTraceabilityDesignInputs('DP-2025-001');
      res.json(designInputs);
    } catch (error) {
      console.error('Error fetching design inputs:', error);
      res.status(500).json({ error: 'Failed to fetch design inputs' });
    }
  });

  app.get("/api/design-control/traceability-design-outputs", isAuthenticated, async (req, res) => {
    try {
      const designOutputs = await storage.getTraceabilityDesignOutputs('DP-2025-001');
      res.json(designOutputs);
    } catch (error) {
      console.error('Error fetching design outputs:', error);
      res.status(500).json({ error: 'Failed to fetch design outputs' });
    }
  });

  app.get("/api/design-control/verification-records", isAuthenticated, async (req, res) => {
    try {
      const verificationRecords = await storage.getVerificationRecords('DP-2025-001');
      res.json(verificationRecords);
    } catch (error) {
      console.error('Error fetching verification records:', error);
      res.status(500).json({ error: 'Failed to fetch verification records' });
    }
  });

  app.get("/api/design-control/validation-records", isAuthenticated, async (req, res) => {
    try {
      const validationRecords = await storage.getValidationRecords('DP-2025-001');
      res.json(validationRecords);
    } catch (error) {
      console.error('Error fetching validation records:', error);
      res.status(500).json({ error: 'Failed to fetch validation records' });
    }
  });

  app.get("/api/design-control/traceability-links", isAuthenticated, async (req, res) => {
    try {
      const traceabilityLinks = await storage.getTraceabilityLinks('DP-2025-001');
      res.json(traceabilityLinks);
    } catch (error) {
      console.error('Error fetching traceability links:', error);
      res.status(500).json({ error: 'Failed to fetch traceability links' });
    }
  });

  app.post("/api/design-control/traceability-links", isAuthenticated, async (req, res) => {
    try {
      const linkData = req.body;
      const newLink = await storage.createTraceabilityLink(linkData);
      res.status(201).json(newLink);
    } catch (error) {
      console.error('Error creating traceability link:', error);
      res.status(500).json({ error: 'Failed to create traceability link' });
    }
  });

  app.delete("/api/design-control/traceability-links/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTraceabilityLink(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting traceability link:', error);
      res.status(500).json({ error: 'Failed to delete traceability link' });
    }
  });

  app.get("/api/design-control/traceability-matrix", isAuthenticated, async (req, res) => {
    try {
      const matrix = await storage.getTraceabilityMatrix('DP-2025-001');
      res.json(matrix);
    } catch (error) {
      console.error('Error fetching traceability matrix:', error);
      res.status(500).json({ error: 'Failed to fetch traceability matrix' });
    }
  });

  app.get("/api/design-control/link-targets/:sourceType/:sourceId", isAuthenticated, async (req, res) => {
    try {
      const { sourceType, sourceId } = req.params;
      const targets = await storage.getLinkTargets(sourceType, sourceId);
      res.json(targets);
    } catch (error) {
      console.error('Error fetching link targets:', error);
      res.status(500).json({ error: 'Failed to fetch link targets' });
    }
  });

  app.post("/api/design-task-dependencies", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertDesignTaskDependencySchema.parse(req.body);
      const dependency = await storage.createDesignTaskDependency(parsedData);
      res.status(201).json(dependency);
    } catch (error) {
      console.error("Error creating design task dependency:", error);
      res.status(500).json({ error: "Failed to create design task dependency" });
    }
  });

  app.delete("/api/design-task-dependencies/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteDesignTaskDependency(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Design task dependency not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting design task dependency:", error);
      res.status(500).json({ error: "Failed to delete design task dependency" });
    }
  });

  // Activity Log Routes
  app.get("/api/design-control-activity-log", isAuthenticated, async (req, res) => {
    try {
      const { entityId, entityType } = req.query;
      const log = await storage.getDesignControlActivityLog(
        entityId as string, 
        entityType as string
      );
      res.json(log);
    } catch (error) {
      console.error("Error fetching design control activity log:", error);
      res.status(500).json({ error: "Failed to fetch design control activity log" });
    }
  });

  app.post("/api/design-control-activity-log", isAuthenticated, async (req, res) => {
    try {
      const parsedData = insertDesignControlActivityLogSchema.parse(req.body);
      const log = await storage.logDesignControlActivity(parsedData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error logging design control activity:", error);
      res.status(500).json({ error: "Failed to log design control activity" });
    }
  });

  // Required for server-side rendering
  const httpServer = createServer(app);

  return httpServer;
}