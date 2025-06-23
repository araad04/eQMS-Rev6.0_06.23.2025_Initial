import { Router } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  technicalDocuments, 
  users, 
  designProjects,
  technicalDocumentSections,
  mdrSections
} from "@shared/schema";
import { authMiddleware } from "./middleware/auth";
import { z } from "zod";

const router = Router();

/**
 * JIRA-Level Professional Technical Documentation Enhanced Routes
 * Implements comprehensive technical documentation management with ISO 13485 compliance
 * Features: Project-based organization, compliance tracking, enhanced document lifecycle
 */

// GET /api/technical-documentation-enhanced - Enhanced document listing with project integration
router.get("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documents = await db
      .select({
        id: technicalDocuments.id,
        documentNumber: technicalDocuments.documentNumber,
        title: technicalDocuments.title,
        description: technicalDocuments.deviceModel, // Using deviceModel as description
        deviceModel: technicalDocuments.deviceModel,
        status: technicalDocuments.status,
        version: technicalDocuments.version,
        revisionLevel: technicalDocuments.revisionLevel,
        designProjectId: technicalDocuments.designProjectId,
        authorId: technicalDocuments.createdBy,
        approvedBy: technicalDocuments.approvedBy,
        approvedAt: technicalDocuments.approvedAt,
        // Enhanced fields using SQL defaults for compatibility
        completionPercentage: sql`CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 100 WHEN ${technicalDocuments.status} = 'IN_REVIEW' THEN 75 WHEN ${technicalDocuments.status} = 'DRAFT' THEN 25 ELSE 0 END`.as('completionPercentage'),
        complianceStatus: sql`CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 'compliant' WHEN ${technicalDocuments.status} = 'IN_REVIEW' THEN 'pending' ELSE 'not_started' END`.as('complianceStatus'),
        riskClassification: sql`'medium'`.as('riskClassification'),
        regulatoryImpact: sql`true`.as('regulatoryImpact'),
        createdAt: technicalDocuments.createdAt,
        updatedAt: technicalDocuments.updatedAt,
        authorName: sql`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'Unknown')`.as('authorName'),
        projectCode: sql`COALESCE(${designProjects.projectCode}, 'UNASSIGNED')`.as('projectCode'),
        projectTitle: sql`COALESCE(${designProjects.title}, 'Unassigned Project')`.as('projectTitle')
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.createdBy, users.id))
      .leftJoin(designProjects, eq(technicalDocuments.designProjectId, designProjects.id))
      .orderBy(desc(technicalDocuments.updatedAt));

    res.json(documents);
  } catch (error) {
    console.error("Error fetching enhanced technical documents:", error);
    res.status(500).json({ error: "Failed to fetch enhanced technical documents" });
  }
});

// GET /api/technical-documentation-enhanced/projects - Get documents grouped by project
router.get("/projects", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectDocuments = await db
      .select({
        projectId: designProjects.id,
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        projectDescription: designProjects.description,
        documentCount: sql`COUNT(${technicalDocuments.id})`.as('documentCount'),
        approvedCount: sql`COUNT(CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 1 END)`.as('approvedCount'),
        draftCount: sql`COUNT(CASE WHEN ${technicalDocuments.status} = 'DRAFT' THEN 1 END)`.as('draftCount'),
        reviewCount: sql`COUNT(CASE WHEN ${technicalDocuments.status} = 'IN_REVIEW' THEN 1 END)`.as('reviewCount'),
        completionRate: sql`ROUND(COUNT(CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 1 END) * 100.0 / NULLIF(COUNT(${technicalDocuments.id}), 0), 2)`.as('completionRate')
      })
      .from(designProjects)
      .leftJoin(technicalDocuments, eq(designProjects.id, technicalDocuments.designProjectId))
      .groupBy(designProjects.id, designProjects.projectCode, designProjects.title, designProjects.description)
      .orderBy(desc(sql`COUNT(${technicalDocuments.id})`));

    res.json(projectDocuments);
  } catch (error) {
    console.error("Error fetching project documents:", error);
    res.status(500).json({ error: "Failed to fetch project documents" });
  }
});

// POST /api/technical-documentation-enhanced - Create enhanced document
router.post("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentSchema = z.object({
      title: z.string().min(1, "Title is required"),
      deviceModel: z.string().min(1, "Device model is required"),
      designProjectId: z.number().optional(),
      version: z.string().default("1.0"),
      status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "SUPERSEDED"]).default("DRAFT")
    });

    const validatedData = documentSchema.parse(req.body);
    const userId = (req.user as any)?.id || 9999; // Development fallback

    // Generate document number
    const documentNumber = `TD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const [document] = await db
      .insert(technicalDocuments)
      .values({
        title: validatedData.title,
        deviceModel: validatedData.deviceModel,
        documentNumber,
        status: validatedData.status,
        version: validatedData.version,
        designProjectId: validatedData.designProjectId,
        createdBy: userId,
      })
      .returning();

    res.status(201).json({
      success: true,
      document,
      message: "Enhanced technical document created successfully"
    });
  } catch (error) {
    console.error("Error creating enhanced technical document:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create enhanced technical document" });
  }
});

// GET /api/technical-documentation-enhanced/:id - Get specific document with enhanced details
router.get("/:id", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const document = await db
      .select({
        id: technicalDocuments.id,
        documentNumber: technicalDocuments.documentNumber,
        title: technicalDocuments.title,
        deviceModel: technicalDocuments.deviceModel,
        status: technicalDocuments.status,
        version: technicalDocuments.version,
        revisionLevel: technicalDocuments.revisionLevel,
        designProjectId: technicalDocuments.designProjectId,
        createdBy: technicalDocuments.createdBy,
        approvedBy: technicalDocuments.approvedBy,
        approvedAt: technicalDocuments.approvedAt,
        createdAt: technicalDocuments.createdAt,
        updatedAt: technicalDocuments.updatedAt,
        authorName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('authorName'),
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.createdBy, users.id))
      .leftJoin(designProjects, eq(technicalDocuments.designProjectId, designProjects.id))
      .where(eq(technicalDocuments.id, documentId))
      .limit(1);

    if (!document.length) {
      return res.status(404).json({ error: "Enhanced technical document not found" });
    }

    res.json(document[0]);
  } catch (error) {
    console.error("Error fetching enhanced technical document:", error);
    res.status(500).json({ error: "Failed to fetch enhanced technical document" });
  }
});

// PUT /api/technical-documentation-enhanced/:id - Update document
router.put("/:id", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const updateSchema = z.object({
      title: z.string().min(1).optional(),
      deviceModel: z.string().min(1).optional(),
      status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "SUPERSEDED"]).optional(),
      version: z.string().optional(),
      designProjectId: z.number().optional()
    });

    const validatedData = updateSchema.parse(req.body);

    const [updatedDocument] = await db
      .update(technicalDocuments)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(technicalDocuments.id, documentId))
      .returning();

    if (!updatedDocument) {
      return res.status(404).json({ error: "Enhanced technical document not found" });
    }

    res.json({
      success: true,
      document: updatedDocument,
      message: "Enhanced technical document updated successfully"
    });
  } catch (error) {
    console.error("Error updating enhanced technical document:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update enhanced technical document" });
  }
});

// DELETE /api/technical-documentation-enhanced/:id - Delete document
router.delete("/:id", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const [deletedDocument] = await db
      .delete(technicalDocuments)
      .where(eq(technicalDocuments.id, documentId))
      .returning();

    if (!deletedDocument) {
      return res.status(404).json({ error: "Enhanced technical document not found" });
    }

    res.json({
      success: true,
      message: "Enhanced technical document deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting enhanced technical document:", error);
    res.status(500).json({ error: "Failed to delete enhanced technical document" });
  }
});

// GET /api/technical-documentation-enhanced/compliance/dashboard - Compliance dashboard
router.get("/compliance/dashboard", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const complianceMetrics = await db
      .select({
        totalDocuments: sql`COUNT(*)`.as('totalDocuments'),
        approvedDocuments: sql`COUNT(CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 1 END)`.as('approvedDocuments'),
        draftDocuments: sql`COUNT(CASE WHEN ${technicalDocuments.status} = 'DRAFT' THEN 1 END)`.as('draftDocuments'),
        reviewDocuments: sql`COUNT(CASE WHEN ${technicalDocuments.status} = 'IN_REVIEW' THEN 1 END)`.as('reviewDocuments'),
        complianceRate: sql`ROUND(COUNT(CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2)`.as('complianceRate')
      })
      .from(technicalDocuments);

    const projectMetrics = await db
      .select({
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        documentCount: sql`COUNT(${technicalDocuments.id})`.as('documentCount'),
        approvedCount: sql`COUNT(CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 1 END)`.as('approvedCount'),
        complianceRate: sql`ROUND(COUNT(CASE WHEN ${technicalDocuments.status} = 'APPROVED' THEN 1 END) * 100.0 / NULLIF(COUNT(${technicalDocuments.id}), 0), 2)`.as('complianceRate')
      })
      .from(designProjects)
      .leftJoin(technicalDocuments, eq(designProjects.id, technicalDocuments.designProjectId))
      .groupBy(designProjects.id, designProjects.projectCode, designProjects.title)
      .having(sql`COUNT(${technicalDocuments.id}) > 0`)
      .orderBy(desc(sql`COUNT(${technicalDocuments.id})`));

    res.json({
      overallMetrics: complianceMetrics[0] || {
        totalDocuments: 0,
        approvedDocuments: 0,
        draftDocuments: 0,
        reviewDocuments: 0,
        complianceRate: 0
      },
      projectMetrics
    });
  } catch (error) {
    console.error("Error fetching compliance dashboard:", error);
    res.status(500).json({ error: "Failed to fetch compliance dashboard" });
  }
});

export { router as technicalDocumentationEnhancedRouter };