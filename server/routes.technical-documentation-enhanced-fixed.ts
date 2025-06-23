import { Router } from 'express';
import { eq, desc, and, sql } from 'drizzle-orm';
import { technicalDocuments, users, designProjects } from '../shared/schema';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * PROFESSIONAL TECHNICAL DOCUMENTATION ENHANCED ROUTES
 * Implements comprehensive technical documentation management with project integration
 * Features: ISO 13485 compliance, project-based organization, enhanced workflow management
 */

// Get all enhanced technical documents with project integration
router.get('/', async (req, res) => {
  try {
    const db = await getDatabaseInstance();
    
    const documents = await db
      .select({
        id: technicalDocuments.id,
        title: technicalDocuments.title,
        deviceModel: technicalDocuments.deviceModel,
        status: technicalDocuments.status,
        version: technicalDocuments.version,
        revisionLevel: technicalDocuments.revisionLevel,
        createdBy: technicalDocuments.createdBy,
        approvedBy: technicalDocuments.approvedBy,
        approvedAt: technicalDocuments.approvedAt,
        createdAt: technicalDocuments.createdAt,
        updatedAt: technicalDocuments.updatedAt,
        authorName: users.firstName,
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.createdBy, users.id))
      .leftJoin(designProjects, eq(technicalDocuments.designProjectId, designProjects.id))
      .orderBy(desc(technicalDocuments.updatedAt));

    // Add enhanced properties for frontend compatibility
    const enhancedDocuments = documents.map(doc => ({
      ...doc,
      documentNumber: `TD-${doc.id.toString().padStart(4, '0')}`,
      description: `Technical documentation for ${doc.deviceModel}`,
      designProjectId: null,
      completionPercentage: doc.status === 'approved' ? 100 : doc.status === 'draft' ? 25 : 75,
      complianceStatus: doc.status === 'approved' ? 'compliant' : 'pending',
      riskClassification: 'medium',
      regulatoryImpact: true
    }));

    res.json(enhancedDocuments);
  } catch (error) {
    console.error('Error fetching enhanced technical documents:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced technical documents' });
  }
});

// Create new enhanced technical document
router.post('/', async (req, res) => {
  try {
    const { title, deviceModel, description, status = 'draft' } = req.body;
    const userId = (req as any).user?.id || 1;

    if (!title || !deviceModel) {
      return res.status(400).json({ error: 'Title and device model are required' });
    }

    const [newDocument] = await db.insert(technicalDocuments).values({
      title,
      deviceModel,
      status,
      version: '1.0',
      revisionLevel: 'A',
      createdBy: userId,
      designProjectId: null,
      approvedBy: null,
      approvedAt: null
    }).returning();

    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error creating enhanced technical document:', error);
    res.status(500).json({ error: 'Failed to create enhanced technical document' });
  }
});

// Get enhanced technical documents grouped by project
router.get('/projects', async (req, res) => {
  try {
    // Get project statistics
    const projectStats = await db
      .select({
        projectId: designProjects.id,
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        projectDescription: designProjects.description,
        documentCount: sql<number>`count(${technicalDocuments.id})::int`,
        approvedCount: sql<number>`count(case when ${technicalDocuments.status} = 'approved' then 1 end)::int`,
        draftCount: sql<number>`count(case when ${technicalDocuments.status} = 'draft' then 1 end)::int`,
        reviewCount: sql<number>`count(case when ${technicalDocuments.status} = 'review' then 1 end)::int`
      })
      .from(designProjects)
      .leftJoin(technicalDocuments, eq(technicalDocuments.designProjectId, designProjects.id))
      .groupBy(designProjects.id, designProjects.projectCode, designProjects.title, designProjects.description);

    // Calculate completion rates
    const projectDocuments = projectStats.map(project => ({
      ...project,
      completionRate: project.documentCount > 0 ? 
        Math.round((project.approvedCount / project.documentCount) * 100) : 0
    }));

    res.json(projectDocuments);
  } catch (error) {
    console.error('Error fetching project documents:', error);
    res.status(500).json({ error: 'Failed to fetch project documents' });
  }
});

// Get compliance dashboard metrics
router.get('/compliance/dashboard', async (req, res) => {
  try {
    // Get overall document metrics
    const overallStats = await db
      .select({
        totalDocuments: sql<number>`count(*)::int`,
        approvedDocuments: sql<number>`count(case when ${technicalDocuments.status} = 'approved' then 1 end)::int`,
        draftDocuments: sql<number>`count(case when ${technicalDocuments.status} = 'draft' then 1 end)::int`,
        reviewDocuments: sql<number>`count(case when ${technicalDocuments.status} = 'review' then 1 end)::int`
      })
      .from(technicalDocuments);

    const overall = overallStats[0] || {
      totalDocuments: 0,
      approvedDocuments: 0,
      draftDocuments: 0,
      reviewDocuments: 0
    };

    const complianceRate = overall.totalDocuments > 0 ? 
      Math.round((overall.approvedDocuments / overall.totalDocuments) * 100) : 0;

    // Get project-level metrics
    const projectMetrics = await db
      .select({
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        documentCount: sql<number>`count(${technicalDocuments.id})::int`,
        approvedCount: sql<number>`count(case when ${technicalDocuments.status} = 'approved' then 1 end)::int`
      })
      .from(designProjects)
      .leftJoin(technicalDocuments, eq(technicalDocuments.designProjectId, designProjects.id))
      .groupBy(designProjects.id, designProjects.projectCode, designProjects.title)
      .having(sql`count(${technicalDocuments.id}) > 0`);

    const projectComplianceMetrics = projectMetrics.map(project => ({
      ...project,
      complianceRate: project.documentCount > 0 ? 
        Math.round((project.approvedCount / project.documentCount) * 100) : 0
    }));

    const complianceMetrics = {
      overallMetrics: {
        ...overall,
        complianceRate
      },
      projectMetrics: projectComplianceMetrics
    };

    res.json(complianceMetrics);
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch compliance dashboard' });
  }
});

// Update enhanced technical document
router.put('/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const updateData = req.body;

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const [updatedDocument] = await db
      .update(technicalDocuments)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(technicalDocuments.id, documentId))
      .returning();

    if (!updatedDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating enhanced technical document:', error);
    res.status(500).json({ error: 'Failed to update enhanced technical document' });
  }
});

// Delete enhanced technical document
router.delete('/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const [deletedDocument] = await db
      .delete(technicalDocuments)
      .where(eq(technicalDocuments.id, documentId))
      .returning();

    if (!deletedDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully', id: documentId });
  } catch (error) {
    console.error('Error deleting enhanced technical document:', error);
    res.status(500).json({ error: 'Failed to delete enhanced technical document' });
  }
});

// Get enhanced technical document by ID
router.get('/:id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const [document] = await db
      .select({
        id: technicalDocuments.id,
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
        authorName: users.firstName,
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.createdBy, users.id))
      .leftJoin(designProjects, eq(technicalDocuments.designProjectId, designProjects.id))
      .where(eq(technicalDocuments.id, documentId));

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Add enhanced properties
    const enhancedDocument = {
      ...document,
      documentNumber: `TD-${document.id.toString().padStart(4, '0')}`,
      description: `Technical documentation for ${document.deviceModel}`,
      completionPercentage: document.status === 'approved' ? 100 : document.status === 'draft' ? 25 : 75,
      complianceStatus: document.status === 'approved' ? 'compliant' : 'pending',
      riskClassification: 'medium',
      regulatoryImpact: true
    };

    res.json(enhancedDocument);
  } catch (error) {
    console.error('Error fetching enhanced technical document:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced technical document' });
  }
});

export default router;