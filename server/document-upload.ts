import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { designProjectDocuments } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'design-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  const allowedExtensions = ['.pdf', '.xlsx', '.xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Excel files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function uploadProjectDocuments(req: Request, res: Response) {
  try {
    const projectId = parseInt(req.params.projectId);
    const { document_type, description, version } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const documentRecord = await db.insert(designProjectDocuments).values({
        projectId,
        documentType: document_type || 'DFMEA',
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: req.user?.id || 9999, // Development user fallback
        description: description || null,
        version: version || '1.0'
      }).returning();

      uploadedFiles.push({
        id: documentRecord[0].id,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        path: file.path
      });
    }

    res.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ 
      error: 'Failed to upload documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getProjectDocuments(req: Request, res: Response) {
  try {
    const projectId = parseInt(req.params.projectId);
    const documentType = req.query.type as string;

    let documents;
    
    if (documentType) {
      documents = await db.select().from(designProjectDocuments)
        .where(eq(designProjectDocuments.projectId, projectId))
        .orderBy(desc(designProjectDocuments.uploadedAt));
    } else {
      documents = await db.select().from(designProjectDocuments)
        .where(eq(designProjectDocuments.projectId, projectId))
        .orderBy(desc(designProjectDocuments.uploadedAt));
    }

    res.json(documents);
  } catch (error) {
    console.error('Error fetching project documents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function downloadDocument(req: Request, res: Response) {
  try {
    const documentId = parseInt(req.params.documentId);
    
    const document = await db.select().from(designProjectDocuments)
      .where(eq(designProjectDocuments.id, documentId))
      .limit(1);

    if (document.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = document[0];
    const filePath = doc.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ 
      error: 'Failed to download document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function deleteDocument(req: Request, res: Response) {
  try {
    const documentId = parseInt(req.params.documentId);
    
    const document = await db.select().from(designProjectDocuments)
      .where(eq(designProjectDocuments.id, documentId))
      .limit(1);

    if (document.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = document[0];
    
    // Delete file from disk
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    // Delete database record
    await db.delete(designProjectDocuments)
      .where(eq(designProjectDocuments.id, documentId));

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      error: 'Failed to delete document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}