import express, { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { documentRevisions, documentRevisionChanges, documents, users } from "@shared/schema";
import { authMiddleware } from "./middleware/auth";
const { isAuthenticated } = authMiddleware;

export const documentRevisionsRouter = express.Router();

// Apply authentication middleware
documentRevisionsRouter.use(isAuthenticated);

/**
 * Get all revisions for a document
 * GET /api/documents/:documentId/revisions
 */
documentRevisionsRouter.get("/:documentId/revisions", async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.documentId);
    
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }
    
    const revisions = await db.query.documentRevisions.findMany({
      where: eq(documentRevisions.documentId, documentId),
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
      orderBy: (revisions) => revisions.createdAt.desc(),
    });
    
    return res.status(200).json(revisions);
  } catch (error) {
    console.error("Error fetching document revisions:", error);
    return res.status(500).json({ error: "Failed to retrieve document revisions" });
  }
});

/**
 * Get a specific revision by ID
 * GET /api/documents/revisions/:revisionId
 */
documentRevisionsRouter.get("/revisions/:revisionId", async (req: Request, res: Response) => {
  try {
    const revisionId = parseInt(req.params.revisionId);
    
    if (isNaN(revisionId)) {
      return res.status(400).json({ error: "Invalid revision ID" });
    }
    
    const revision = await db.query.documentRevisions.findFirst({
      where: eq(documentRevisions.id, revisionId),
      with: {
        createdByUser: {
          columns: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        changes: true,
      },
    });
    
    if (!revision) {
      return res.status(404).json({ error: "Revision not found" });
    }
    
    return res.status(200).json(revision);
  } catch (error) {
    console.error("Error fetching document revision:", error);
    return res.status(500).json({ error: "Failed to retrieve document revision" });
  }
});

/**
 * Create a new document revision
 * POST /api/documents/:documentId/revisions
 */
documentRevisionsRouter.post("/:documentId/revisions", async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const userId = req.user?.id;
    
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { revisionNumber, title, content, changeDescription, changes } = req.body;
    
    if (!revisionNumber || !title || !content || !changeDescription) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Check if document exists
    const documentExists = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });
    
    if (!documentExists) {
      return res.status(404).json({ error: "Document not found" });
    }
    
    // Start a transaction to create revision and changes
    const [revision] = await db.transaction(async (tx) => {
      // Insert the revision
      const [newRevision] = await tx
        .insert(documentRevisions)
        .values({
          documentId,
          revisionNumber,
          title,
          content,
          changeDescription,
          createdBy: userId,
        })
        .returning();
      
      // If there are specific field changes, record them
      if (changes && Array.isArray(changes) && changes.length > 0) {
        for (const change of changes) {
          await tx
            .insert(documentRevisionChanges)
            .values({
              revisionId: newRevision.id,
              fieldName: change.fieldName,
              oldValue: change.oldValue,
              newValue: change.newValue,
            });
        }
      }
      
      return [newRevision];
    });
    
    // Also update the document's revision field
    await db
      .update(documents)
      .set({ revision: revisionNumber, updatedAt: new Date() })
      .where(eq(documents.id, documentId));
    
    return res.status(201).json(revision);
  } catch (error) {
    console.error("Error creating document revision:", error);
    return res.status(500).json({ error: "Failed to create document revision" });
  }
});

/**
 * Update a revision's approval status
 * PATCH /api/documents/revisions/:revisionId/status
 */
documentRevisionsRouter.patch("/revisions/:revisionId/status", async (req: Request, res: Response) => {
  try {
    const revisionId = parseInt(req.params.revisionId);
    const userId = req.user?.id;
    
    if (isNaN(revisionId)) {
      return res.status(400).json({ error: "Invalid revision ID" });
    }
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { approvalStatus } = req.body;
    
    if (!approvalStatus || !["approved", "rejected", "pending"].includes(approvalStatus)) {
      return res.status(400).json({ error: "Invalid approval status" });
    }
    
    // Check if revision exists
    const revisionExists = await db.query.documentRevisions.findFirst({
      where: eq(documentRevisions.id, revisionId),
    });
    
    if (!revisionExists) {
      return res.status(404).json({ error: "Revision not found" });
    }
    
    // Update the revision status
    const [updatedRevision] = await db
      .update(documentRevisions)
      .set({ approvalStatus })
      .where(eq(documentRevisions.id, revisionId))
      .returning();
    
    return res.status(200).json(updatedRevision);
  } catch (error) {
    console.error("Error updating revision status:", error);
    return res.status(500).json({ error: "Failed to update revision status" });
  }
});

/**
 * Get revision history comparison between two revisions
 * GET /api/documents/revisions/compare?baseId=1&compareId=2
 */
documentRevisionsRouter.get("/revisions/compare", async (req: Request, res: Response) => {
  try {
    const baseId = parseInt(req.query.baseId as string);
    const compareId = parseInt(req.query.compareId as string);
    
    if (isNaN(baseId) || isNaN(compareId)) {
      return res.status(400).json({ error: "Invalid revision IDs" });
    }
    
    // Get both revisions
    const baseRevision = await db.query.documentRevisions.findFirst({
      where: eq(documentRevisions.id, baseId),
    });
    
    const compareRevision = await db.query.documentRevisions.findFirst({
      where: eq(documentRevisions.id, compareId),
    });
    
    if (!baseRevision || !compareRevision) {
      return res.status(404).json({ error: "One or both revisions not found" });
    }
    
    // Get changes for both revisions
    const baseChanges = await db.query.documentRevisionChanges.findMany({
      where: eq(documentRevisionChanges.revisionId, baseId),
    });
    
    const compareChanges = await db.query.documentRevisionChanges.findMany({
      where: eq(documentRevisionChanges.revisionId, compareId),
    });
    
    // Return the comparison
    return res.status(200).json({
      baseRevision,
      compareRevision,
      baseChanges,
      compareChanges,
    });
  } catch (error) {
    console.error("Error comparing revisions:", error);
    return res.status(500).json({ error: "Failed to compare revisions" });
  }
});

export default documentRevisionsRouter;