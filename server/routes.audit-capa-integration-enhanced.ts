/**
 * Enhanced Audit-CAPA Integration Routes
 * Provides proactive linking between audit findings and CAPA generation
 * Supports ISO 13485, 21 CFR Part 11, and IEC 62304 compliance
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from './db';
import { audits, auditResponses, capas, auditFindings } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
// Auth middleware is applied globally in the main server, no need to import

/**
 * Create CAPA from audit finding with automatic pre-population
 * POST /api/audit-findings/:findingId/create-capa
 */
export async function createCapaFromFinding(req: Request, res: Response) {
  try {
    const findingId = parseInt(req.params.findingId);
    
    const capaSchema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      category: z.enum(['corrective', 'preventive', 'nonconformity']).default('corrective'),
      priority: z.enum(['high', 'medium', 'low']),
      assignedTo: z.string(),
      dueDate: z.string().transform(str => new Date(str)),
      rootCauseAnalysis: z.string().optional(),
      correctiveAction: z.string().optional(),
      preventiveAction: z.string().optional()
    });

    const validatedData = capaSchema.parse(req.body);

    // Get audit finding details
    const [finding] = await db
      .select()
      .from(auditFindings)
      .where(eq(auditFindings.id, findingId));

    if (!finding) {
      return res.status(404).json({ error: 'Audit finding not found' });
    }

    if (finding.capaId) {
      return res.status(400).json({ 
        error: 'CAPA already exists for this finding',
        existingCapaId: finding.capaId 
      });
    }

    // Create CAPA with finding context
    const [createdCapa] = await db.insert(capas).values({
      title: validatedData.title,
      description: `[Audit Finding: ${finding.findingType}] ${validatedData.description}`,
      category: validatedData.category,
      priority: validatedData.priority,
      source: 'internal_audit',
      rootCauseAnalysis: validatedData.rootCauseAnalysis || '',
      correctiveAction: validatedData.correctiveAction || '',
      preventiveAction: validatedData.preventiveAction || '',
      assignedTo: validatedData.assignedTo,
      dueDate: validatedData.dueDate,
      status: 'open',
      createdBy: req.user?.id || 9999,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Link to audit context
      relatedAuditId: finding.auditId,
      regulatoryClause: finding.regulationClause || undefined
    }).returning();

    // Update finding with CAPA link
    await db.update(auditFindings)
      .set({ 
        capaId: createdCapa.id,
        updatedAt: new Date()
      })
      .where(eq(auditFindings.id, findingId));

    res.status(201).json({
      capa: createdCapa,
      findingId: findingId,
      integration: {
        auditId: finding.auditId,
        linkCreated: new Date().toISOString(),
        autoPopulated: true
      }
    });

  } catch (error) {
    console.error('Error creating CAPA from finding:', error);
    res.status(500).json({ error: 'Failed to create CAPA from audit finding' });
  }
}

/**
 * Get linked CAPAs for an audit
 * GET /api/audits/:auditId/linked-capas
 */
export async function getLinkedCapasForAudit(req: Request, res: Response) {
  try {
    const auditId = parseInt(req.params.auditId);

    // Get all CAPAs linked to this audit through findings
    const linkedCapas = await db
      .select({
        capa: capas,
        finding: auditFindings
      })
      .from(capas)
      .leftJoin(auditFindings, eq(capas.id, auditFindings.capaId))
      .where(eq(auditFindings.auditId, auditId))
      .orderBy(desc(capas.createdAt));

    res.json({
      auditId: auditId,
      linkedCapas: linkedCapas.map(item => ({
        ...item.capa,
        findingContext: {
          findingId: item.finding?.id,
          findingType: item.finding?.findingType,
          riskLevel: item.finding?.riskLevel,
          regulationClause: item.finding?.regulationClause
        }
      })),
      totalCount: linkedCapas.length
    });

  } catch (error) {
    console.error('Error fetching linked CAPAs:', error);
    res.status(500).json({ error: 'Failed to fetch linked CAPAs' });
  }
}

/**
 * Auto-generate CAPA suggestions based on audit finding type
 * POST /api/audit-findings/:findingId/suggest-capa
 */
export async function suggestCapaFromFinding(req: Request, res: Response) {
  try {
    const findingId = parseInt(req.params.findingId);

    const [finding] = await db
      .select()
      .from(auditFindings)
      .where(eq(auditFindings.id, findingId));

    if (!finding) {
      return res.status(404).json({ error: 'Audit finding not found' });
    }

    // Generate CAPA suggestions based on finding characteristics
    const suggestions = generateCapaSuggestions(finding);

    res.json({
      findingId: findingId,
      findingType: finding.findingType,
      suggestions: suggestions,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating CAPA suggestions:', error);
    res.status(500).json({ error: 'Failed to generate CAPA suggestions' });
  }
}

/**
 * Get audit findings requiring CAPA action
 * GET /api/audits/:auditId/findings-requiring-capa
 */
export async function getFindingsRequiringCapa(req: Request, res: Response) {
  try {
    const auditId = parseInt(req.params.auditId);

    const findingsRequiringCapa = await db
      .select()
      .from(auditFindings)
      .where(
        and(
          eq(auditFindings.auditId, auditId),
          eq(auditFindings.capaId, null) // No CAPA assigned yet
        )
      )
      .orderBy(desc(auditFindings.riskLevel));

    // Categorize by priority
    const categorized = {
      critical: findingsRequiringCapa.filter(f => f.riskLevel === 'high'),
      major: findingsRequiringCapa.filter(f => f.riskLevel === 'medium'),
      minor: findingsRequiringCapa.filter(f => f.riskLevel === 'low'),
      total: findingsRequiringCapa.length
    };

    res.json({
      auditId: auditId,
      findingsRequiringCapa: categorized,
      summary: {
        totalFindings: findingsRequiringCapa.length,
        criticalCount: categorized.critical.length,
        majorCount: categorized.major.length,
        minorCount: categorized.minor.length,
        immediateActionRequired: categorized.critical.length > 0
      }
    });

  } catch (error) {
    console.error('Error fetching findings requiring CAPA:', error);
    res.status(500).json({ error: 'Failed to fetch findings requiring CAPA' });
  }
}

/**
 * Bulk create CAPAs from multiple findings
 * POST /api/audits/:auditId/bulk-create-capas
 */
export async function bulkCreateCapasFromFindings(req: Request, res: Response) {
  try {
    const auditId = parseInt(req.params.auditId);
    
    const bulkSchema = z.object({
      findings: z.array(z.object({
        findingId: z.number(),
        capaData: z.object({
          title: z.string(),
          assignedTo: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          dueDate: z.string().transform(str => new Date(str))
        })
      }))
    });

    const { findings } = bulkSchema.parse(req.body);
    const createdCapas = [];

    for (const item of findings) {
      const [finding] = await db
        .select()
        .from(auditFindings)
        .where(eq(auditFindings.id, item.findingId));

      if (finding && !finding.capaId) {
        const [capa] = await db.insert(capas).values({
          title: item.capaData.title,
          description: `Auto-generated CAPA for audit finding: ${finding.description}`,
          category: 'corrective',
          priority: item.capaData.priority,
          source: 'internal_audit',
          assignedTo: item.capaData.assignedTo,
          dueDate: item.capaData.dueDate,
          status: 'open',
          createdBy: req.user?.id || 9999,
          createdAt: new Date(),
          updatedAt: new Date(),
          relatedAuditId: auditId
        }).returning();

        await db.update(auditFindings)
          .set({ capaId: capa.id })
          .where(eq(auditFindings.id, item.findingId));

        createdCapas.push({
          capa,
          findingId: item.findingId
        });
      }
    }

    res.status(201).json({
      auditId: auditId,
      createdCapas: createdCapas,
      totalCreated: createdCapas.length,
      bulkProcessedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error bulk creating CAPAs:', error);
    res.status(500).json({ error: 'Failed to bulk create CAPAs' });
  }
}

/**
 * Generate intelligent CAPA suggestions based on finding characteristics
 */
function generateCapaSuggestions(finding: any) {
  const suggestions = {
    title: '',
    description: '',
    priority: 'medium' as const,
    assignedTo: 'Quality Manager',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    rootCauseAnalysis: '',
    correctiveAction: '',
    preventiveAction: ''
  };

  // Customize based on finding type
  switch (finding.findingType?.toLowerCase()) {
    case 'critical':
    case 'major_nonconformance':
      suggestions.priority = 'high';
      suggestions.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      suggestions.title = `Critical CAPA: ${finding.description?.substring(0, 50)}...`;
      suggestions.correctiveAction = 'Immediate containment and investigation required';
      suggestions.preventiveAction = 'Implement systematic controls to prevent recurrence';
      break;
      
    case 'minor':
    case 'observation':
      suggestions.priority = 'low';
      suggestions.dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
      suggestions.title = `Process Improvement: ${finding.description?.substring(0, 50)}...`;
      suggestions.correctiveAction = 'Review and update procedures as needed';
      suggestions.preventiveAction = 'Enhance training and awareness programs';
      break;
      
    default:
      suggestions.title = `CAPA: ${finding.description?.substring(0, 50)}...`;
      suggestions.correctiveAction = 'Address immediate issue and investigate root cause';
      suggestions.preventiveAction = 'Implement controls to prevent similar issues';
  }

  // Customize based on regulation clause
  if (finding.regulationClause?.includes('7.6')) {
    suggestions.assignedTo = 'Calibration Manager';
    suggestions.rootCauseAnalysis = 'Investigate calibration program effectiveness';
  } else if (finding.regulationClause?.includes('4.2')) {
    suggestions.assignedTo = 'Document Control Manager';
    suggestions.rootCauseAnalysis = 'Review document control procedures';
  }

  return suggestions;
}

/**
 * Register all audit-CAPA integration routes
 * Note: Authentication middleware is applied globally in the main server
 */
export function registerAuditCapaRoutes(app: any) {
  app.post('/api/audit-findings/:findingId/create-capa', createCapaFromFinding);
  app.get('/api/audits/:auditId/linked-capas', getLinkedCapasForAudit);
  app.post('/api/audit-findings/:findingId/suggest-capa', suggestCapaFromFinding);
  app.get('/api/audits/:auditId/findings-requiring-capa', getFindingsRequiringCapa);
  app.post('/api/audits/:auditId/bulk-create-capas', bulkCreateCapasFromFindings);
}