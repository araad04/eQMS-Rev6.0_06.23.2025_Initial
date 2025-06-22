import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from './db';
import { audits, auditResponses, capas, auditChecklistQuestions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from './middleware/auth';
import { Logger } from './utils/logger';

const router = Router();

// Schema for audit checklist response with CAPA integration
const auditChecklistResponseSchema = z.object({
  auditId: z.number(),
  questionId: z.number(),
  response: z.string(),
  findingType: z.enum(['compliant', 'nonconformity', 'observation', 'ofi']),
  severity: z.enum(['critical', 'major', 'minor']).optional(),
  description: z.string(),
  evidenceFiles: z.array(z.string()).optional(),
  requiresCapa: z.boolean().default(false),
  capaData: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    rootCauseAnalysis: z.string().optional(),
    correctiveAction: z.string().optional(),
    assignedTo: z.string(),
    dueDate: z.string()
  }).optional()
});

const bulkChecklistSaveSchema = z.object({
  auditId: z.number(),
  auditType: z.string(),
  responses: z.array(z.object({
    questionId: z.number(),
    compliance: z.enum(['compliant', 'non-compliant', 'observation', 'not-applicable']),
    severity: z.enum(['critical', 'major', 'minor']).nullable(),
    findings: z.string(),
    evidence: z.string(),
    requiresCapa: z.boolean(),
    capaTitle: z.string().optional(),
    correctiveAction: z.string().optional()
  })),
  completedAt: z.string()
});

export function setupAuditCapaRoutes(app: any) {
  // Save audit checklist responses with automatic CAPA creation
  app.post("/api/audits/checklist/save", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = bulkChecklistSaveSchema.parse(req.body);
      const { auditId, responses } = validatedData;

      Logger.info(`Saving audit checklist for audit ${auditId} with ${responses.length} responses`);

      const savedResponses = [];
      const createdCapas = [];

      for (const response of responses) {
        // Map compliance status to finding type
        let findingType: string;
        switch (response.compliance) {
          case 'non-compliant':
            findingType = 'nonconformity';
            break;
          case 'observation':
            findingType = 'observation';
            break;
          case 'compliant':
            findingType = 'compliant';
            break;
          default:
            findingType = 'compliant';
        }

        // Save audit response
        const [savedResponse] = await db.insert(auditResponses).values({
          auditId: auditId,
          questionId: response.questionId,
          response: response.findings,
          findingType: findingType,
          severity: response.severity,
          description: response.findings,
          evidenceFiles: response.evidence ? [response.evidence] : [],
          requiresCapa: response.requiresCapa,
          respondedBy: req.user?.id || 9999, // Development user fallback
          respondedAt: new Date(),
          updatedAt: new Date()
        }).returning();

        savedResponses.push(savedResponse);

        // Create CAPA if required for non-conformance
        if (response.requiresCapa && response.compliance === 'non-compliant') {
          try {
            const capaTitle = response.capaTitle || `Non-conformance - Question ${response.questionId}`;
            const capaDescription = `Audit Finding: ${response.findings}\n\nEvidence: ${response.evidence}\n\nImmediate Action: ${response.correctiveAction || 'To be determined'}`;

            const [createdCapa] = await db.insert(capas).values({
              title: capaTitle,
              description: capaDescription,
              category: 'nonconformity',
              priority: response.severity === 'critical' ? 'high' : 
                       response.severity === 'major' ? 'medium' : 'low',
              source: 'internal_audit',
              root_cause_analysis: response.correctiveAction || '',
              assigned_to: 'Quality Team',
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              status: 'open',
              created_by: req.user?.id || 9999,
              created_at: new Date(),
              updated_at: new Date()
            }).returning();

            // Update audit response with CAPA ID
            await db.update(auditResponses)
              .set({ capaId: createdCapa.id })
              .where(eq(auditResponses.id, savedResponse.id));

            createdCapas.push(createdCapa);
            Logger.info(`Created CAPA ${createdCapa.id} for audit response ${savedResponse.id}`);
          } catch (capaError) {
            Logger.error(`Failed to create CAPA for response ${savedResponse.id}:`, capaError);
          }
        }
      }

      // Update audit status if all responses are saved
      if (savedResponses.length === responses.length) {
        await db.update(audits)
          .set({ 
            status: 'completed',
            updated_at: new Date()
          })
          .where(eq(audits.id, auditId));
      }

      res.status(200).json({
        message: 'Audit checklist saved successfully',
        savedResponses: savedResponses.length,
        createdCapas: createdCapas.length,
        capaIds: createdCapas.map(c => c.id)
      });

    } catch (error) {
      Logger.error('Error saving audit checklist:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: 'Failed to save audit checklist',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get audit responses with linked CAPAs
  app.get("/api/audits/:auditId/responses", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const auditId = parseInt(req.params.auditId);

      const responses = await db
        .select({
          id: auditResponses.id,
          questionId: auditResponses.questionId,
          response: auditResponses.response,
          findingType: auditResponses.findingType,
          severity: auditResponses.severity,
          description: auditResponses.description,
          evidenceFiles: auditResponses.evidenceFiles,
          requiresCapa: auditResponses.requiresCapa,
          capaId: auditResponses.capaId,
          respondedAt: auditResponses.respondedAt,
          // CAPA details if linked
          capaTitle: capas.title,
          capaStatus: capas.status,
          capaPriority: capas.priority,
          capaDueDate: capas.due_date
        })
        .from(auditResponses)
        .leftJoin(capas, eq(auditResponses.capaId, capas.id))
        .where(eq(auditResponses.auditId, auditId));

      res.status(200).json(responses);

    } catch (error) {
      Logger.error('Error fetching audit responses:', error);
      res.status(500).json({ 
        error: 'Failed to fetch audit responses',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create CAPA from audit finding
  app.post("/api/audits/responses/:responseId/create-capa", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const responseId = parseInt(req.params.responseId);
      
      const capaSchema = z.object({
        title: z.string(),
        description: z.string(),
        category: z.string().default('nonconformity'),
        priority: z.enum(['high', 'medium', 'low']),
        assignedTo: z.string(),
        dueDate: z.string(),
        rootCauseAnalysis: z.string().optional(),
        correctiveAction: z.string().optional()
      });

      const validatedData = capaSchema.parse(req.body);

      // Get audit response details
      const [auditResponse] = await db
        .select()
        .from(auditResponses)
        .where(eq(auditResponses.id, responseId));

      if (!auditResponse) {
        return res.status(404).json({ error: 'Audit response not found' });
      }

      if (auditResponse.capaId) {
        return res.status(400).json({ error: 'CAPA already exists for this response' });
      }

      // Create CAPA
      const [createdCapa] = await db.insert(capas).values({
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        source: 'internal_audit',
        root_cause_analysis: validatedData.rootCauseAnalysis || '',
        assigned_to: validatedData.assignedTo,
        due_date: new Date(validatedData.dueDate),
        status: 'open',
        created_by: req.user?.id || 9999,
        created_at: new Date(),
        updated_at: new Date()
      }).returning();

      // Link CAPA to audit response
      await db.update(auditResponses)
        .set({ 
          capaId: createdCapa.id,
          requiresCapa: true,
          updatedAt: new Date()
        })
        .where(eq(auditResponses.id, responseId));

      Logger.info(`CAPA ${createdCapa.id} created and linked to audit response ${responseId}`);

      res.status(201).json({
        message: 'CAPA created successfully',
        capa: createdCapa
      });

    } catch (error) {
      Logger.error('Error creating CAPA from audit response:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: 'Failed to create CAPA',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get audit metrics including CAPA generation statistics
  app.get("/api/audits/metrics", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get total audits
      const totalAudits = await db
        .select({ count: db.sql`COUNT(*)::int` })
        .from(audits);

      // Get non-conformances by severity
      const nonConformancesBySeverity = await db
        .select({ 
          severity: auditResponses.severity,
          count: db.sql`COUNT(*)::int`
        })
        .from(auditResponses)
        .where(eq(auditResponses.findingType, 'nonconformity'))
        .groupBy(auditResponses.severity);

      // Get CAPAs created from audits
      const capasFromAudits = await db
        .select({ count: db.sql`COUNT(*)::int` })
        .from(capas)
        .where(eq(capas.source, 'internal_audit'));

      // Get audit completion rate
      const completedAudits = await db
        .select({ count: db.sql`COUNT(*)::int` })
        .from(audits)
        .where(eq(audits.status, 'completed'));

      const metrics = {
        totalAudits: totalAudits[0]?.count || 0,
        completedAudits: completedAudits[0]?.count || 0,
        completionRate: totalAudits[0]?.count > 0 
          ? Math.round((completedAudits[0]?.count / totalAudits[0]?.count) * 100) 
          : 0,
        nonConformancesBySeverity: nonConformancesBySeverity.reduce((acc, item) => {
          acc[item.severity || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>),
        capasFromAudits: capasFromAudits[0]?.count || 0
      };

      res.status(200).json(metrics);

    } catch (error) {
      Logger.error('Error fetching audit metrics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch audit metrics',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

export default setupAuditCapaRoutes;