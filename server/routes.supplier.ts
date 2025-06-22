import express, { Request, Response } from "express";
import { z } from "zod";
import { Logger } from "./utils/logger";
import { 
  getSuppliers, 
  getSupplier,
  createSupplier,
  updateSupplier,
  getSupplierAssessments,
  createSupplierAssessment,
  updateSupplierAssessment,
  getSupplierAssessment
} from "./storage.supplier";
import { scheduleSupplierAssessment, checkAndScheduleAssessments } from "./utils/supplier-assessment-scheduler";
import { insertSupplierAssessmentSchema, supplierCategories, supplierStatuses } from "@shared/schema";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";
import { regulatoryReportabilityRouter } from "./routes.regulatory-reportability";
import { 
  calculateRequalificationDate, 
  calculateNextAuditDate, 
  getSupplierComplianceStatus,
  validateCriticality,
  generateLifecycleAuditEntry,
  getSuppliersDueForAction
} from "./utils/supplier-lifecycle";
import { exportSuppliers } from "./utils/supplier-export";
import { generateCriticalSuppliersExcel, generateCriticalSuppliersPDF } from "./utils/critical-supplier-export";

export function setupSupplierRoutes(app: express.Express) {
  // Register regulatory reportability routes
  app.use('/api/suppliers/regulatory-reportability', regulatoryReportabilityRouter);
  // Sample supplier endpoint removed - eQMS uses authentic data only

  // Get all suppliers
  app.get("/api/suppliers", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const suppliers = await getSuppliers();
      res.status(200).json(suppliers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error fetching suppliers: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  // Get all supplier categories
  app.get("/api/supplier-categories", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categories = await db.select().from(supplierCategories);
      res.status(200).json(categories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error fetching supplier categories: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch supplier categories" });
    }
  });

  // Get all supplier statuses
  app.get("/api/supplier-statuses", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const statuses = await db.select().from(supplierStatuses);
      res.status(200).json(statuses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error fetching supplier statuses: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch supplier statuses" });
    }
  });
  // Get all supplier assessments
  app.get("/api/supplier-assessments", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const assessments = await getSupplierAssessments();
      
      // Enhance assessments with supplier names
      const enhancedAssessments = await Promise.all(
        assessments.map(async (assessment) => {
          const supplier = await getSupplier(assessment.supplierId);
          return {
            ...assessment,
            supplier_name: supplier ? supplier.name : "Unknown Supplier"
          };
        })
      );
      
      res.status(200).json(enhancedAssessments);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error fetching supplier assessments: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch supplier assessments" });
    }
  });

  // Get a specific supplier by ID
  app.get("/api/suppliers/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid supplier ID" });
      }

      const supplier = await getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Add compliance status information
      const compliance = getSupplierComplianceStatus(
        supplier.qualificationDate,
        supplier.requalificationDate,
        supplier.lastAuditDate,
        supplier.nextAuditDate,
        supplier.criticality
      );

      res.status(200).json({
        ...supplier,
        complianceStatus: compliance
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error fetching supplier ${req.params.id}: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  });

  // Update a supplier with automatic date calculation
  app.patch("/api/suppliers/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid supplier ID" });
      }

      // Get existing supplier
      const existingSupplier = await getSupplier(id);
      if (!existingSupplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const updateData = req.body;
      const userId = req.user?.id || 9999;

      // Validate criticality if being updated
      if (updateData.criticality && !validateCriticality(updateData.criticality)) {
        return res.status(400).json({ 
          error: "Invalid criticality level. Must be Critical, Major, or Minor." 
        });
      }

      // Auto-recalculate dates if criticality or qualification date changes
      const criticalityChanged = updateData.criticality && updateData.criticality !== existingSupplier.criticality;
      const qualificationDateChanged = updateData.qualificationDate && updateData.qualificationDate !== existingSupplier.qualificationDate;

      if (criticalityChanged || qualificationDateChanged) {
        const qualificationDate = new Date(updateData.qualificationDate || existingSupplier.qualificationDate);
        const criticality = updateData.criticality || existingSupplier.criticality;

        // Recalculate requalification date
        const requalificationDate = calculateRequalificationDate(qualificationDate, criticality);
        updateData.requalificationDate = requalificationDate;

        // Recalculate audit dates
        const lastAuditDate = existingSupplier.lastAuditDate || qualificationDate;
        const nextAuditDate = calculateNextAuditDate(lastAuditDate, criticality);
        if (nextAuditDate) {
          updateData.nextAuditDate = nextAuditDate;
        } else {
          updateData.nextAuditDate = null;
        }

        Logger.info(`Auto-recalculated dates for supplier ${id} (${criticality}): 
          Requalification: ${requalificationDate.toISOString()}
          Next Audit: ${nextAuditDate ? nextAuditDate.toISOString() : 'Not required'}`);
      }

      // Set update context
      updateData.updatedBy = userId;

      // Update supplier
      const updatedSupplier = await updateSupplier(id, updateData);

      // Generate audit trail for changes
      if (criticalityChanged || qualificationDateChanged) {
        const auditEntry = generateLifecycleAuditEntry(
          id,
          'requalification',
          {
            oldValue: existingSupplier.criticality,
            requalificationDate: updateData.requalificationDate,
            nextAuditDate: updateData.nextAuditDate,
            criticality: updateData.criticality || existingSupplier.criticality
          },
          userId
        );

        Logger.info(`Audit trail created for supplier update: ${JSON.stringify(auditEntry)}`);
      }

      res.status(200).json(updatedSupplier);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error updating supplier ${req.params.id}: ${errorMessage}`);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  // Get suppliers due for action (requalification/audit)
  app.get("/api/suppliers/due-for-action", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const allSuppliers = await getSuppliers();
      const dueForAction = getSuppliersDueForAction(allSuppliers);

      res.status(200).json({
        requalificationDue: dueForAction.requalificationDue,
        auditDue: dueForAction.auditDue,
        nonCompliant: dueForAction.nonCompliant,
        summary: {
          totalSuppliers: allSuppliers.length,
          requalificationDueCount: dueForAction.requalificationDue.length,
          auditDueCount: dueForAction.auditDue.length,
          nonCompliantCount: dueForAction.nonCompliant.length
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error fetching suppliers due for action: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch suppliers due for action" });
    }
  });

  // Get a specific supplier assessment
  app.get("/api/supplier-assessments/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid assessment ID" });
      }

      const assessment = await getSupplierAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Enhance with supplier information
      const supplier = await getSupplier(assessment.supplierId);
      
      res.status(200).json({
        ...assessment,
        supplier_name: supplier ? supplier.name : "Unknown Supplier",
        supplier_criticality: supplier?.criticality
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error fetching supplier assessment ${req.params.id}: ${errorMessage}`);
      res.status(500).json({ error: "Failed to fetch supplier assessment" });
    }
  });

  // Create a new supplier assessment
  app.post("/api/supplier-assessments", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = insertSupplierAssessmentSchema.parse(req.body);
      
      // Set the user who created the assessment
      const userId = req.user?.id || 1; // Default to system ID if not authenticated
      validatedData.createdBy = userId;
      validatedData.updatedBy = userId;
      
      // Create the assessment
      const assessment = await createSupplierAssessment(validatedData);
      
      res.status(201).json(assessment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error creating supplier assessment: ${errorMessage}`);
      res.status(400).json({ error: "Failed to create supplier assessment" });
    }
  });

  // Update a supplier assessment
  app.patch("/api/supplier-assessments/:id", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid assessment ID" });
      }

      // Validate existence of assessment
      const assessment = await getSupplierAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Create a schema for allowed update fields
      const updateSchema = z.object({
        status: z.string().optional(),
        findings: z.string().optional(),
        recommendations: z.string().optional(),
        conductedDate: z.string().or(z.date()).optional().nullable(),
        qualitySystemCertification: z.string().optional(),
        regulatoryCompliance: z.string().optional(),
        overallScore: z.number().min(0).max(100).optional(),
        attachmentUrls: z.array(z.string()).optional(),
        suggestions: z.string().optional(), // New field for improvement suggestions
      });

      // Validate update data
      const validatedData = updateSchema.parse(req.body);
      
      // Set the user who updated the assessment
      const userId = req.user?.id || 1; // Default to system ID if not authenticated
      
      // Update the assessment
      const updatedAssessment = await updateSupplierAssessment(id, {
        ...validatedData,
        updatedBy: userId
      });
      
      res.status(200).json(updatedAssessment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error updating supplier assessment ${req.params.id}: ${errorMessage}`);
      res.status(500).json({ error: "Failed to update supplier assessment" });
    }
  });

  // Trigger an assessment for a specific supplier
  app.post("/api/suppliers/:id/trigger-assessment", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const supplierId = parseInt(req.params.id);
      if (isNaN(supplierId)) {
        return res.status(400).json({ error: "Invalid supplier ID" });
      }
      
      // Get supplier details
      const supplier = await getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      
      // Schedule an assessment
      const scheduled = await scheduleSupplierAssessment(supplierId);
      
      if (scheduled) {
        res.status(200).json({
          message: "Assessment scheduled successfully",
          supplierName: supplier.name,
          supplierType: supplier.criticality
        });
      } else {
        res.status(500).json({ error: "Failed to schedule assessment" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error triggering assessment for supplier ${req.params.id}: ${errorMessage}`);
      res.status(500).json({ error: "Failed to trigger assessment" });
    }
  });
  
  // Endpoint to add a sample supplier
  app.post("/api/suppliers", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Create a new supplier
      const supplierData = req.body;
      
      // Set default values if not provided
      if (!supplierData.supplierId) {
        supplierData.supplierId = `SUP-${Date.now().toString().substring(9)}`;
      }
      
      // Ensure required fields
      if (!supplierData.name) {
        return res.status(400).json({ error: "Supplier name is required" });
      }
      
      // Set default category and status if not provided
      if (!supplierData.categoryId) {
        supplierData.categoryId = 1;
      }
      
      if (!supplierData.statusId) {
        supplierData.statusId = 1;
      }
      
      // Validate criticality level if provided
      if (supplierData.criticality && !validateCriticality(supplierData.criticality)) {
        return res.status(400).json({ 
          error: "Invalid criticality level. Must be Critical, Major, or Minor." 
        });
      }
      
      // Set default criticality if not provided
      if (!supplierData.criticality) {
        supplierData.criticality = "Major";
      }
      
      // Auto-calculate requalification and audit dates if qualification date is provided
      if (supplierData.qualificationDate) {
        const qualificationDate = new Date(supplierData.qualificationDate);
        
        // Calculate requalification date based on criticality
        const requalificationDate = calculateRequalificationDate(
          qualificationDate, 
          supplierData.criticality
        );
        supplierData.requalificationDate = requalificationDate;
        
        // Calculate next audit date based on criticality
        const nextAuditDate = calculateNextAuditDate(
          qualificationDate, 
          supplierData.criticality
        );
        if (nextAuditDate) {
          supplierData.nextAuditDate = nextAuditDate;
        }
        
        Logger.info(`Auto-calculated dates for ${supplierData.criticality} supplier: 
          Requalification: ${requalificationDate.toISOString()}
          Next Audit: ${nextAuditDate ? nextAuditDate.toISOString() : 'Not required'}`);
      }
      
      // Set user context
      const userId = req.user?.id || 9999;
      supplierData.createdBy = userId;
      supplierData.updatedBy = userId;
      
      // Create supplier
      const supplier = await createSupplier(supplierData);
      
      // Generate audit trail for qualification event
      if (supplierData.qualificationDate) {
        const auditEntry = generateLifecycleAuditEntry(
          supplier.id,
          'qualification',
          {
            qualificationDate: supplierData.qualificationDate,
            requalificationDate: supplierData.requalificationDate,
            nextAuditDate: supplierData.nextAuditDate,
            criticality: supplierData.criticality
          },
          userId
        );
        
        Logger.info(`Audit trail created for supplier qualification: ${JSON.stringify(auditEntry)}`);
      }
      
      res.status(201).json(supplier);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error creating supplier: ${errorMessage}`);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  // Admin endpoint to schedule all needed assessments
  app.post("/api/admin/supplier-assessments/schedule-all", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verify user has admin permission
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      // Run the scheduler
      const scheduledCount = await checkAndScheduleAssessments();
      
      res.status(200).json({
        message: `Scheduled ${scheduledCount} supplier assessments`,
        count: scheduledCount
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error in batch assessment scheduling: ${errorMessage}`);
      res.status(500).json({ error: "Failed to schedule assessments" });
    }
  });

  // Export suppliers endpoint
  app.post("/api/suppliers/export", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { format, columns, approvedOnly } = req.body;
      
      // Get all suppliers
      const suppliers = await getSuppliers();
      
      // Generate export file
      const buffer = await exportSuppliers(suppliers, { format, columns, approvedOnly });
      
      // Set appropriate headers
      const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="approved-suppliers.${extension}"`);
      res.send(buffer);
    } catch (error) {
      Logger.error("Error exporting suppliers:", error);
      res.status(500).json({ 
        error: "Failed to export suppliers",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Export critical suppliers in Excel format
  app.post("/api/suppliers/export/critical/excel", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      Logger.info("Generating critical suppliers Excel export");
      
      const buffer = await generateCriticalSuppliersExcel();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="critical-suppliers-report.xlsx"');
      res.send(buffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error generating critical suppliers Excel export: ${errorMessage}`);
      res.status(500).json({ 
        error: "Failed to generate critical suppliers Excel report",
        details: errorMessage
      });
    }
  });

  // Export critical suppliers in PDF format
  app.post("/api/suppliers/export/critical/pdf", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      Logger.info("Generating critical suppliers PDF export");
      
      const buffer = await generateCriticalSuppliersPDF();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="critical-suppliers-report.pdf"');
      res.send(buffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Error generating critical suppliers PDF export: ${errorMessage}`);
      res.status(500).json({ 
        error: "Failed to generate critical suppliers PDF report",
        details: errorMessage
      });
    }
  });
}