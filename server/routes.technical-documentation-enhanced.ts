import express from "express";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";
import { 
  technicalDocuments, 
  technicalDocumentSections,
  mdrSections,
  users,
  designProjects
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const router = express.Router();

/**
 * Enhanced Technical Documentation API Routes
 * Professional JIRA-level functionality mirroring Design Control module
 */

// GET /api/technical-documentation - Enhanced document listing
router.get("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documents = await db
      .select({
        id: technicalDocuments.id,
        documentNumber: technicalDocuments.documentNumber,
        title: technicalDocuments.title,
        description: technicalDocuments.description,
        deviceModel: technicalDocuments.deviceModel,
        status: technicalDocuments.status,
        version: technicalDocuments.version,
        revisionLevel: technicalDocuments.revisionLevel,
        categoryId: technicalDocuments.categoryId,
        mdrSectionId: technicalDocuments.mdrSectionId,
        designProjectId: technicalDocuments.designProjectId,
        authorId: technicalDocuments.authorId,
        reviewerId: technicalDocuments.reviewerId,
        approvedBy: technicalDocuments.approvedBy,
        approvedAt: technicalDocuments.approvedAt,
        completionPercentage: sql`COALESCE(${technicalDocuments.completionPercentage}, 0)`.as('completionPercentage'),
        complianceStatus: sql`COALESCE(${technicalDocuments.complianceStatus}, 'not_started')`.as('complianceStatus'),
        lastReviewDate: technicalDocuments.lastReviewDate,
        nextReviewDate: technicalDocuments.nextReviewDate,
        riskClassification: sql`COALESCE(${technicalDocuments.riskClassification}, 'low')`.as('riskClassification'),
        regulatoryImpact: sql`COALESCE(${technicalDocuments.regulatoryImpact}, false)`.as('regulatoryImpact'),
        createdAt: technicalDocuments.createdAt,
        updatedAt: technicalDocuments.updatedAt,
        authorName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('authorName'),
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.authorId, users.id))
      .leftJoin(designProjects, eq(technicalDocuments.designProjectId, designProjects.id))
      .orderBy(desc(technicalDocuments.updatedAt));

    res.json(documents);
  } catch (error) {
    console.error("Error fetching technical documents:", error);
    res.status(500).json({ error: "Failed to fetch technical documents" });
  }
});

// POST /api/technical-documentation - Create new document
router.post("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      deviceModel,
      categoryId,
      mdrSectionId,
      designProjectId,
      riskClassification,
      regulatoryImpact
    } = req.body;

    // Generate document number
    const count = await db
      .select({ count: sql`count(*)` })
      .from(technicalDocuments);
    
    const documentNumber = `TD-${new Date().getFullYear()}-${String(count[0].count + 1).padStart(3, '0')}`;

    const [newDocument] = await db
      .insert(technicalDocuments)
      .values({
        documentNumber,
        title,
        description,
        deviceModel: deviceModel || '',
        status: 'draft',
        version: '1.0',
        revisionLevel: 'A',
        categoryId: parseInt(categoryId),
        mdrSectionId: mdrSectionId ? parseInt(mdrSectionId) : null,
        designProjectId: designProjectId ? parseInt(designProjectId) : null,
        authorId: req.user?.id || 9999,
        completionPercentage: 0,
        complianceStatus: 'not_started',
        riskClassification: riskClassification || 'low',
        regulatoryImpact: regulatoryImpact || false,
        createdBy: req.user?.id || 9999
      })
      .returning();

    res.json(newDocument);
  } catch (error) {
    console.error("Error creating technical document:", error);
    res.status(500).json({ error: "Failed to create technical document" });
  }
});

// GET /api/technical-documentation/categories - Document categories
router.get("/categories", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const categories = [
      { id: 1, name: 'Design Controls', description: 'Design control documentation', required: true, mdrReference: 'Annex II' },
      { id: 2, name: 'Risk Management', description: 'Risk management files', required: true, mdrReference: 'Annex I' },
      { id: 3, name: 'Clinical Evaluation', description: 'Clinical evaluation reports', required: true, mdrReference: 'Annex XIV' },
      { id: 4, name: 'Technical Documentation', description: 'Technical documentation files', required: true, mdrReference: 'Annex II' },
      { id: 5, name: 'Quality System', description: 'Quality management system docs', required: true, mdrReference: 'Annex IX' },
      { id: 6, name: 'Post-Market Surveillance', description: 'Post-market surveillance documentation', required: true, mdrReference: 'Article 83' },
      { id: 7, name: 'Software Documentation', description: 'Software lifecycle documentation', required: false, mdrReference: 'IEC 62304' }
    ];

    res.json(categories);
  } catch (error) {
    console.error("Error fetching document categories:", error);
    res.status(500).json({ error: "Failed to fetch document categories" });
  }
});

// GET /api/technical-documentation/mdr-sections/structure - MDR sections with compliance data
router.get("/mdr-sections/structure", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const sectionsWithStats = await db
      .select({
        id: mdrSections.id,
        sectionNumber: mdrSections.sectionNumber,
        title: mdrSections.title,
        description: mdrSections.description,
        requirementLevel: mdrSections.requirementLevel,
        complianceStatus: mdrSections.complianceStatus,
        documentCount: sql`COUNT(${technicalDocuments.id})`.as('documentCount'),
        completionRate: sql`
          CASE 
            WHEN COUNT(${technicalDocuments.id}) = 0 THEN 0
            ELSE ROUND(AVG(COALESCE(${technicalDocuments.completionPercentage}, 0)))
          END
        `.as('completionRate')
      })
      .from(mdrSections)
      .leftJoin(technicalDocuments, eq(mdrSections.id, technicalDocuments.mdrSectionId))
      .groupBy(mdrSections.id, mdrSections.sectionNumber, mdrSections.title, mdrSections.description, mdrSections.requirementLevel, mdrSections.complianceStatus)
      .orderBy(mdrSections.sectionNumber);

    res.json(sectionsWithStats);
  } catch (error) {
    console.error("Error fetching MDR sections structure:", error);
    res.status(500).json({ error: "Failed to fetch MDR sections structure" });
  }
});

// POST /api/technical-documentation/reviews - Submit document review
router.post("/reviews", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const {
      documentId,
      reviewComments,
      reviewDecision,
      nextReviewDate
    } = req.body;

    // Update document with review information
    const [updatedDocument] = await db
      .update(technicalDocuments)
      .set({
        status: reviewDecision === 'approved' ? 'approved' : 
               reviewDecision === 'rejected' ? 'rejected' : 'under review',
        reviewerId: req.user?.id || 9999,
        lastReviewDate: new Date(),
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
        updatedAt: new Date()
      })
      .where(eq(technicalDocuments.id, parseInt(documentId)))
      .returning();

    // Here you could also create a review record in a separate table
    // For now, we'll just update the document

    res.json({
      success: true,
      document: updatedDocument,
      message: `Document review submitted with decision: ${reviewDecision}`
    });
  } catch (error) {
    console.error("Error submitting document review:", error);
    res.status(500).json({ error: "Failed to submit document review" });
  }
});

// GET /api/technical-documentation/workflows - Document workflows
router.get("/workflows", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    // Mock workflow data - in production this would come from a workflows table
    const workflows = [
      {
        id: 1,
        documentId: 1,
        workflowStage: 'review',
        assignedTo: 9999,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        comments: 'Initial technical review required'
      },
      {
        id: 2,
        documentId: 2,
        workflowStage: 'approval',
        assignedTo: 9999,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress',
        comments: 'Awaiting final approval signature'
      }
    ];

    res.json(workflows);
  } catch (error) {
    console.error("Error fetching document workflows:", error);
    res.status(500).json({ error: "Failed to fetch document workflows" });
  }
});

// GET /api/technical-documentation/analytics - Documentation analytics
router.get("/analytics", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    // Get document statistics
    const totalDocs = await db
      .select({ count: sql`count(*)` })
      .from(technicalDocuments);

    const statusStats = await db
      .select({
        status: technicalDocuments.status,
        count: sql`count(*)`
      })
      .from(technicalDocuments)
      .groupBy(technicalDocuments.status);

    const categoryStats = await db
      .select({
        categoryId: technicalDocuments.categoryId,
        count: sql`count(*)`
      })
      .from(technicalDocuments)
      .groupBy(technicalDocuments.categoryId);

    const complianceOverview = await db
      .select({
        avgCompletion: sql`AVG(COALESCE(${technicalDocuments.completionPercentage}, 0))`,
        approvedCount: sql`SUM(CASE WHEN ${technicalDocuments.status} = 'approved' THEN 1 ELSE 0 END)`,
        overdueCount: sql`SUM(CASE WHEN ${technicalDocuments.nextReviewDate} < NOW() THEN 1 ELSE 0 END)`
      })
      .from(technicalDocuments);

    res.json({
      totalDocuments: totalDocs[0].count,
      statusBreakdown: statusStats,
      categoryBreakdown: categoryStats,
      compliance: {
        averageCompletion: Math.round(complianceOverview[0].avgCompletion || 0),
        approvedDocuments: complianceOverview[0].approvedCount || 0,
        overdueReviews: complianceOverview[0].overdueCount || 0
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET /api/technical-documentation/templates - Document templates
router.get("/templates", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        name: 'Risk Management File Template',
        description: 'ISO 14971 compliant risk management documentation template',
        category: 'Risk Management',
        mdrReference: 'Annex I, Section 3',
        templateType: 'structured',
        sections: [
          'Risk Management Plan',
          'Risk Analysis',
          'Risk Evaluation',
          'Risk Control',
          'Risk Management Report'
        ]
      },
      {
        id: 2,
        name: 'Design Control Plan Template',
        description: 'ISO 13485:7.3 design control planning template',
        category: 'Design Controls',
        mdrReference: 'Annex II, Section 2',
        templateType: 'structured',
        sections: [
          'Design Planning',
          'Design Inputs',
          'Design Outputs',
          'Design Review',
          'Design Verification',
          'Design Validation',
          'Design Transfer'
        ]
      },
      {
        id: 3,
        name: 'Clinical Evaluation Report Template',
        description: 'MEDDEV 2.7/1 rev 4 clinical evaluation template',
        category: 'Clinical Evaluation',
        mdrReference: 'Annex XIV',
        templateType: 'document',
        sections: [
          'Executive Summary',
          'Device Description',
          'Clinical Background',
          'Clinical Data',
          'Clinical Evaluation Conclusions'
        ]
      },
      {
        id: 4,
        name: 'Technical Documentation File Template',
        description: 'Complete technical file structure for MDR compliance',
        category: 'Technical Documentation',
        mdrReference: 'Annex II',
        templateType: 'structure',
        sections: [
          'Device Description and Specification',
          'Information to be Supplied by Manufacturer',
          'Design and Manufacturing Information',
          'General Safety and Performance Requirements',
          'Benefit-Risk Analysis and Risk Management',
          'Product Verification and Validation'
        ]
      },
      {
        id: 5,
        name: 'Software Lifecycle Plan Template',
        description: 'IEC 62304 software lifecycle documentation template',
        category: 'Software Documentation',
        mdrReference: 'IEC 62304',
        templateType: 'structured',
        sections: [
          'Software Development Planning',
          'Software Requirements Analysis',
          'Software Architectural Design',
          'Software Detailed Design',
          'Software Implementation',
          'Software Integration and Testing',
          'Software System Testing',
          'Software Release'
        ]
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// GET /api/technical-documentation/:id - Get specific document
router.get("/:id", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    const document = await db
      .select({
        id: technicalDocuments.id,
        documentNumber: technicalDocuments.documentNumber,
        title: technicalDocuments.title,
        description: technicalDocuments.description,
        deviceModel: technicalDocuments.deviceModel,
        status: technicalDocuments.status,
        version: technicalDocuments.version,
        revisionLevel: technicalDocuments.revisionLevel,
        categoryId: technicalDocuments.categoryId,
        mdrSectionId: technicalDocuments.mdrSectionId,
        designProjectId: technicalDocuments.designProjectId,
        authorId: technicalDocuments.authorId,
        reviewerId: technicalDocuments.reviewerId,
        approvedBy: technicalDocuments.approvedBy,
        approvedAt: technicalDocuments.approvedAt,
        completionPercentage: technicalDocuments.completionPercentage,
        complianceStatus: technicalDocuments.complianceStatus,
        lastReviewDate: technicalDocuments.lastReviewDate,
        nextReviewDate: technicalDocuments.nextReviewDate,
        riskClassification: technicalDocuments.riskClassification,
        regulatoryImpact: technicalDocuments.regulatoryImpact,
        createdAt: technicalDocuments.createdAt,
        updatedAt: technicalDocuments.updatedAt,
        authorName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('authorName'),
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        mdrSectionNumber: mdrSections.sectionNumber,
        mdrSectionTitle: mdrSections.title
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.authorId, users.id))
      .leftJoin(designProjects, eq(technicalDocuments.designProjectId, designProjects.id))
      .leftJoin(mdrSections, eq(technicalDocuments.mdrSectionId, mdrSections.id))
      .where(eq(technicalDocuments.id, documentId))
      .limit(1);

    if (!document.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get document sections
    const sections = await db
      .select()
      .from(technicalDocumentSections)
      .where(eq(technicalDocumentSections.techDocId, documentId))
      .orderBy(technicalDocumentSections.sectionNumber);

    res.json({
      ...document[0],
      sections
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// PUT /api/technical-documentation/:id - Update document
router.put("/:id", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const updateData = req.body;

    const [updatedDocument] = await db
      .update(technicalDocuments)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(technicalDocuments.id, documentId))
      .returning();

    if (!updatedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// DELETE /api/technical-documentation/:id - Delete document
router.delete("/:id", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    // Delete document sections first
    await db
      .delete(technicalDocumentSections)
      .where(eq(technicalDocumentSections.techDocId, documentId));

    // Delete the document
    const [deletedDocument] = await db
      .delete(technicalDocuments)
      .where(eq(technicalDocuments.id, documentId))
      .returning();

    if (!deletedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// GET /api/technical-documentation/design-integration/:projectId - Integration with design projects
router.get("/design-integration/:projectId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    const documentsForProject = await db
      .select({
        id: technicalDocuments.id,
        documentNumber: technicalDocuments.documentNumber,
        title: technicalDocuments.title,
        description: technicalDocuments.description,
        status: technicalDocuments.status,
        version: technicalDocuments.version,
        completionPercentage: technicalDocuments.completionPercentage,
        lastReviewDate: technicalDocuments.lastReviewDate,
        nextReviewDate: technicalDocuments.nextReviewDate,
        authorName: sql`${users.firstName} || ' ' || ${users.lastName}`.as('authorName'),
        mdrSectionNumber: mdrSections.sectionNumber,
        mdrSectionTitle: mdrSections.title
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.authorId, users.id))
      .leftJoin(mdrSections, eq(technicalDocuments.mdrSectionId, mdrSections.id))
      .where(eq(technicalDocuments.designProjectId, projectId))
      .orderBy(desc(technicalDocuments.updatedAt));

    // Get project details
    const project = await db
      .select()
      .from(designProjects)
      .where(eq(designProjects.id, projectId))
      .limit(1);

    res.json({
      project: project[0] || null,
      documents: documentsForProject,
      summary: {
        totalDocuments: documentsForProject.length,
        completedDocuments: documentsForProject.filter(d => d.status === 'approved').length,
        averageCompletion: documentsForProject.length > 0 
          ? Math.round(documentsForProject.reduce((sum, d) => sum + (d.completionPercentage || 0), 0) / documentsForProject.length)
          : 0
      }
    });
  } catch (error) {
    console.error("Error fetching design integration data:", error);
    res.status(500).json({ error: "Failed to fetch design integration data" });
  }
});

export default router;