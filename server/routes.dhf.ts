import { Router } from 'express';
import { eq, desc, and, sql, like } from 'drizzle-orm';
import { db } from './db';
import { 
  designHistoryFiles, 
  dhfSections, 
  dhfItems, 
  dhfReports,
  users,
  designProjects,
  documents,
  capas,
  audits,
  suppliers,
  designProjectDocuments,
  designProjectTasks,
  projectPhaseInstances
} from '../shared/schema';

const router = Router();

// Get all DHF records (main listing endpoint)
router.get('/', async (req, res) => {
  try {
    const dhfRecords = await db
      .select({
        id: designHistoryFiles.id,
        dhfId: designHistoryFiles.dhfId,
        version: designHistoryFiles.version,
        status: designHistoryFiles.status,
        compiledDate: designHistoryFiles.compiledDate,
        summary: designHistoryFiles.summary,
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        riskLevel: designProjects.riskLevel,
        compiledByUser: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(designHistoryFiles)
      .leftJoin(users, eq(designHistoryFiles.compiledBy, users.id))
      .leftJoin(designProjects, eq(designHistoryFiles.projectId, designProjects.id))
      .where(eq(designProjects.projectCode, 'DP-2025-001'))
      .orderBy(desc(designHistoryFiles.compiledDate));

    res.json(dhfRecords);
  } catch (error) {
    console.error('Error fetching DHF records:', error);
    res.status(500).json({ error: 'Failed to fetch DHF records' });
  }
});

// Get all DHF projects overview - filtered to show only DP-2025-001 Cleanroom project
router.get('/projects', async (req, res) => {
  try {
    const dhfProjects = await db
      .select({
        id: designHistoryFiles.id,
        dhfId: designHistoryFiles.dhfId,
        version: designHistoryFiles.version,
        status: designHistoryFiles.status,
        compiledDate: designHistoryFiles.compiledDate,
        summary: designHistoryFiles.summary,
        projectId: designHistoryFiles.projectId,
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        riskLevel: designProjects.riskLevel,
        regulatoryPathway: designProjects.regulatoryPathway,
        metadata: designHistoryFiles.metadata,
        compiledByUser: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
        reviewedByUser: sql`CASE 
          WHEN ${designHistoryFiles.reviewedBy} IS NOT NULL 
          THEN json_build_object('firstName', reviewed_user.first_name, 'lastName', reviewed_user.last_name)
          ELSE NULL 
        END`.as('reviewedByUser'),
        approvedByUser: sql`CASE 
          WHEN ${designHistoryFiles.approvedBy} IS NOT NULL 
          THEN json_build_object('firstName', approved_user.first_name, 'lastName', approved_user.last_name)
          ELSE NULL 
        END`.as('approvedByUser'),
      })
      .from(designHistoryFiles)
      .leftJoin(users, eq(designHistoryFiles.compiledBy, users.id))
      .leftJoin(designProjects, eq(designHistoryFiles.projectId, designProjects.id))
      .leftJoin(sql`users as reviewed_user`, sql`${designHistoryFiles.reviewedBy} = reviewed_user.id`)
      .leftJoin(sql`users as approved_user`, sql`${designHistoryFiles.approvedBy} = approved_user.id`)
      .where(sql`
        ${designProjects.projectCode} = 'DP-2025-001' 
        AND ${designProjects.title} ILIKE '%cleanroom%'
      `)
      .orderBy(desc(designHistoryFiles.compiledDate));

    res.json(dhfProjects);
  } catch (error) {
    console.error('Error fetching DHF data:', error);
    res.status(500).json({ error: 'Failed to fetch DHF data' });
  }
});

// Get DHF versions for a specific project
router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const dhfVersions = await db
      .select({
        id: designHistoryFiles.id,
        dhfId: designHistoryFiles.dhfId,
        version: designHistoryFiles.version,
        status: designHistoryFiles.status,
        compiledDate: designHistoryFiles.compiledDate,
        summary: designHistoryFiles.summary,
        compiledByUser: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(designHistoryFiles)
      .leftJoin(users, eq(designHistoryFiles.compiledBy, users.id))
      .where(eq(designHistoryFiles.projectId, parseInt(projectId)))
      .orderBy(desc(designHistoryFiles.compiledDate));

    res.json(dhfVersions);
  } catch (error) {
    console.error('Error fetching DHF versions:', error);
    res.status(500).json({ error: 'Failed to fetch DHF versions' });
  }
});

// Get complete DHF data
router.get('/:dhfId', async (req, res) => {
  try {
    const { dhfId } = req.params;
    
    // Get DHF main data
    const dhfData = await db
      .select({
        id: designHistoryFiles.id,
        dhfId: designHistoryFiles.dhfId,
        version: designHistoryFiles.version,
        status: designHistoryFiles.status,
        compiledDate: designHistoryFiles.compiledDate,
        summary: designHistoryFiles.summary,
        compilationNotes: designHistoryFiles.compilationNotes,
        projectCode: designProjects.projectCode,
        projectTitle: designProjects.title,
        compiledByUser: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(designHistoryFiles)
      .leftJoin(users, eq(designHistoryFiles.compiledBy, users.id))
      .leftJoin(designProjects, eq(designHistoryFiles.projectId, designProjects.id))
      .where(eq(designHistoryFiles.id, parseInt(dhfId)))
      .limit(1);

    if (!dhfData.length) {
      return res.status(404).json({ error: 'DHF not found' });
    }

    // Get DHF sections
    const sections = await db
      .select()
      .from(dhfSections)
      .where(eq(dhfSections.dhfId, parseInt(dhfId)))
      .orderBy(dhfSections.sectionOrder);

    // Get DHF items for each section
    const sectionsWithItems = await Promise.all(
      sections.map(async (section) => {
        const items = await db
          .select()
          .from(dhfItems)
          .where(eq(dhfItems.sectionId, section.id))
          .orderBy(dhfItems.chronologicalDate);

        return {
          ...section,
          items: items.map(item => ({
            ...item,
            tags: item.tags ? JSON.parse(item.tags) : []
          }))
        };
      })
    );

    const completeData = {
      ...dhfData[0],
      sections: sectionsWithItems
    };

    res.json(completeData);
  } catch (error) {
    console.error('Error fetching DHF data:', error);
    res.status(500).json({ error: 'Failed to fetch DHF data' });
  }
});

// Compile new DHF with comprehensive data aggregation
router.post('/compile', async (req, res) => {
  try {
    const {
      projectId,
      version,
      summary,
      compilationNotes,
      includeInputs = true,
      includeOutputs = true,
      includeReviews = true,
      includeVerification = true,
      includeValidation = true,
      includeChanges = true,
      includeRiskManagement = true,
      includeTransfer = true,
    } = req.body;

    // Validate project exists and is the allowed DP-2025-001 Cleanroom project
    const project = await db
      .select()
      .from(designProjects)
      .where(eq(designProjects.id, parseInt(projectId)))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({ error: 'Design project not found' });
    }

    const projectData = project[0];
    
    // Only allow DP-2025-001 Cleanroom project for DHF compilation
    if (projectData.projectCode !== 'DP-2025-001' || 
        !projectData.title?.toLowerCase().includes('cleanroom')) {
      return res.status(400).json({ 
        error: 'DHF compilation is only available for the DP-2025-001 Cleanroom demonstration project' 
      });
    }

    // Generate DHF ID with project context
    const dhfId = `DHF-${projectData.projectCode}-${version}-${String(Date.now()).slice(-6)}`;

    // Aggregate comprehensive data from various eQMS submodules for Cleanroom project
    const projectDocuments = await db
      .select({
        id: documents.id,
        title: documents.title,
        status: documents.status,
        revision: documents.revision,
        effectiveDate: documents.effectiveDate,
        documentType: sql`'general'`.as('documentType'),
        approvedBy: documents.approvedBy,
        approvedAt: documents.approvedAt,
      })
      .from(documents)
      .where(sql`${documents.title} ILIKE '%cleanroom%' OR ${documents.title} ILIKE '%environmental%' OR ${documents.title} ILIKE '%${projectData.projectCode}%'`)
      .limit(100);

    // Get project-related CAPAs
    const projectCapas = await db
      .select({
        id: capas.id,
        capaId: capas.capaId,
        title: capas.title,
        description: capas.description,
        rootCause: capas.rootCause,
        correctiveAction: capas.correctiveAction,
        preventiveAction: capas.preventiveAction,
        status: capas.status,
        createdAt: capas.createdAt,
        effectiveness: capas.effectiveness,
      })
      .from(capas)
      .where(sql`${capas.description} ILIKE '%cleanroom%' OR ${capas.description} ILIKE '%environmental%' OR ${capas.description} ILIKE '%${projectData.projectCode}%'`)
      .limit(50);

    // Get project-related audits
    const projectAudits = await db
      .select({
        id: audits.id,
        auditId: audits.auditId,
        title: audits.title,
        scope: audits.scope,
        scheduledDate: audits.scheduledDate,
        startDate: audits.startDate,
        endDate: audits.endDate,
        status: audits.status,
        auditType: audits.auditType,
      })
      .from(audits)
      .where(sql`${audits.scope} ILIKE '%cleanroom%' OR ${audits.scope} ILIKE '%environmental%' OR ${audits.scope} ILIKE '%${projectData.projectCode}%'`)
      .limit(50);

    // Get project tasks and phase instances for verification/validation data
    const projectTasks = await db
      .select({
        id: designProjectTasks.id,
        taskId: designProjectTasks.taskId,
        title: designProjectTasks.title,
        description: designProjectTasks.description,
        status: designProjectTasks.status,
        phase: designProjectTasks.phase,
        taskType: designProjectTasks.taskType,
        priority: designProjectTasks.priority,
        completedAt: designProjectTasks.completedAt,
        estimatedHours: designProjectTasks.estimatedHours,
        actualHours: designProjectTasks.actualHours,
      })
      .from(designProjectTasks)
      .where(eq(designProjectTasks.projectId, parseInt(projectId)));

    const projectPhases = await db
      .select({
        id: projectPhaseInstances.id,
        phaseId: projectPhaseInstances.phaseId,
        status: projectPhaseInstances.status,
        completionPercentage: projectPhaseInstances.completionPercentage,
        plannedStartDate: projectPhaseInstances.plannedStartDate,
        plannedEndDate: projectPhaseInstances.plannedEndDate,
        actualStartDate: projectPhaseInstances.actualStartDate,
        actualEndDate: projectPhaseInstances.actualEndDate,
      })
      .from(projectPhaseInstances)
      .where(eq(projectPhaseInstances.projectId, parseInt(projectId)));

    // Get supplier data related to cleanroom/environmental systems
    const projectSuppliers = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        supplierType: suppliers.supplierType,
        status: suppliers.status,
        riskLevel: suppliers.riskLevel,
        lastAssessmentDate: suppliers.lastAssessmentDate,
      })
      .from(suppliers)
      .where(sql`${suppliers.name} ILIKE '%environmental%' OR ${suppliers.name} ILIKE '%cleanroom%' OR ${suppliers.supplierType} ILIKE '%equipment%'`)
      .limit(25);

    // Categorize documents by type for DHF sections
    const documentsByType = {
      inputs: projectDocuments.filter(doc => 
        doc.title.toLowerCase().includes('requirement') || 
        doc.title.toLowerCase().includes('specification') ||
        doc.title.toLowerCase().includes('input')
      ),
      outputs: projectDocuments.filter(doc => 
        doc.title.toLowerCase().includes('design') || 
        doc.title.toLowerCase().includes('drawing') ||
        doc.title.toLowerCase().includes('output')
      ),
      verification: projectTasks.filter(task => 
        task.taskType?.includes('verification') || 
        task.phase?.includes('verification')
      ),
      validation: projectTasks.filter(task => 
        task.taskType?.includes('validation') || 
        task.phase?.includes('validation')
      ),
      reviews: projectTasks.filter(task => 
        task.taskType?.includes('review') || 
        task.phase?.includes('review')
      ),
    };

    // Calculate comprehensive metrics from integrated submodule data
    const dhfMetadata = {
      compilationSettings: {
        includeInputs,
        includeOutputs,
        includeReviews,
        includeVerification,
        includeValidation,
        includeChanges,
        includeRiskManagement,
        includeTransfer,
      },
      projectContext: {
        riskLevel: projectData.riskLevel,
        riskClass: projectData.riskClass,
        regulatoryPathway: projectData.regulatoryPathway,
        regulatoryImpact: projectData.regulatoryImpact,
        hasSoftwareComponent: projectData.hasSoftwareComponent,
        softwareClassification: projectData.softwareClassification,
        projectType: 'Cleanroom Demonstration',
        complianceFrameworks: ['ISO 13485:2016', 'ISO 14644-1', 'IEC 62304'],
      },
      aggregatedData: {
        documentsCount: projectDocuments.length,
        capaCount: projectCapas.length,
        auditCount: projectAudits.length,
        supplierCount: projectSuppliers.length,
        verificationRecords: documentsByType.verification.length,
        validationRecords: documentsByType.validation.length,
        projectTasks: projectTasks.length,
        projectPhases: projectPhases.length,
        inputDocuments: documentsByType.inputs.length,
        outputDocuments: documentsByType.outputs.length,
        reviewTasks: documentsByType.reviews.length,
        approvedDocuments: projectDocuments.filter(d => d.status === 'approved').length,
        completedTasks: projectTasks.filter(t => t.status === 'completed').length,
        totalEstimatedHours: projectTasks.reduce((sum, task) => sum + (parseFloat(task.estimatedHours?.toString() || '0') || 0), 0),
        totalActualHours: projectTasks.reduce((sum, task) => sum + (parseFloat(task.actualHours?.toString() || '0') || 0), 0),
      },
      dataBreakdown: {
        documentsByType: {
          inputs: documentsByType.inputs.map(d => ({ id: d.id, title: d.title, status: d.status, revision: d.revision })),
          outputs: documentsByType.outputs.map(d => ({ id: d.id, title: d.title, status: d.status, revision: d.revision })),
        },
        capasByStatus: projectCapas.reduce((acc, capa) => {
          acc[capa.status || 'open'] = (acc[capa.status || 'open'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        auditsByType: projectAudits.reduce((acc, audit) => {
          acc[audit.auditType || 'internal'] = (acc[audit.auditType || 'internal'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        tasksByPhase: projectTasks.reduce((acc, task) => {
          acc[task.phase || 'unassigned'] = (acc[task.phase || 'unassigned'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        phaseProgress: projectPhases.map(phase => ({
          phaseId: phase.phaseId,
          status: phase.status,
          completionPercentage: phase.completionPercentage,
          isOnSchedule: phase.actualEndDate ? new Date(phase.actualEndDate) <= new Date(phase.plannedEndDate || new Date()) : true
        })),
        suppliersByRisk: projectSuppliers.reduce((acc, supplier) => {
          acc[supplier.riskLevel || 'low'] = (acc[supplier.riskLevel || 'low'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        submoduleIntegration: {
          documentControl: projectDocuments.length,
          capaManagement: projectCapas.length,
          internalAudits: projectAudits.length,
          supplierManagement: projectSuppliers.length,
          designTasks: projectTasks.length,
          phaseGates: projectPhases.length,
        }
      }
    };

    // Create main DHF record with comprehensive metadata
    const [newDhf] = await db
      .insert(designHistoryFiles)
      .values({
        dhfId,
        projectId: parseInt(projectId),
        version,
        status: 'draft',
        summary: summary || `Design History File for ${projectData.title} (${projectData.projectCode})`,
        compilationNotes,
        compiledBy: 9999, // Default user ID for development
        compiledDate: new Date(),
        totalSections: 0,
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        approvalStatus: 'pending',
        metadata: dhfMetadata,
      })
      .returning();

    // Create DHF sections based on ISO 13485:7.3 requirements
    const sectionsToCreate = [];
    let sectionOrder = 1;

    if (includeInputs) {
      const inputItems = documentsByType.inputs;
      const approvedInputs = inputItems.filter(doc => doc.status === 'approved' || doc.status === 'effective');
      
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'design_inputs',
        sectionTitle: 'Design Inputs & Requirements',
        sectionOrder: sectionOrder++,
        phase: 'Planning',
        summary: `Contains ${inputItems.length} input documents including user needs, intended use, regulatory requirements, and safety requirements. ${approvedInputs.length} items are approved.`,
        keyFindings: JSON.stringify([
          `Total input documents: ${inputItems.length}`,
          `Approved documents: ${approvedInputs.length}`,
          `Regulatory pathway: ${projectData.regulatoryPathway}`,
          `Risk level: ${projectData.riskLevel}`,
        ]),
        itemCount: inputItems.length,
        completedItems: inputItems.filter(doc => doc.status !== 'draft').length,
        approvedItems: approvedInputs.length,
        isComplete: inputItems.length > 0 && approvedInputs.length === inputItems.length,
        createdAt: new Date(),
      });
    }

    if (includeOutputs) {
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'design_outputs',
        sectionTitle: 'Design Outputs & Specifications',
        sectionOrder: sectionOrder++,
        phase: 'Design',
        summary: 'Design specifications, drawings, software, labeling, and instructions',
        itemCount: 0,
        completedItems: 0,
        approvedItems: 0,
        isComplete: false,
        createdAt: new Date(),
      });
    }

    if (includeReviews) {
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'design_reviews',
        sectionTitle: 'Design Reviews & Approvals',
        sectionOrder: sectionOrder++,
        phase: 'Review',
        summary: 'Systematic reviews of design outputs and verification activities',
        itemCount: 0,
        completedItems: 0,
        approvedItems: 0,
        isComplete: false,
        createdAt: new Date(),
      });
    }

    if (includeVerification) {
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'verification_records',
        sectionTitle: 'Design Verification',
        sectionOrder: sectionOrder++,
        phase: 'Verification',
        summary: 'Verification that design outputs meet design inputs',
        itemCount: 0,
        completedItems: 0,
        approvedItems: 0,
        isComplete: false,
        createdAt: new Date(),
      });
    }

    if (includeValidation) {
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'validation_records',
        sectionTitle: 'Design Validation',
        sectionOrder: sectionOrder++,
        phase: 'Validation',
        summary: 'Validation that the device meets user needs and intended use',
        itemCount: 0,
        completedItems: 0,
        approvedItems: 0,
        isComplete: false,
        createdAt: new Date(),
      });
    }

    if (includeChanges) {
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'design_changes',
        sectionTitle: 'Design Changes & Controls',
        sectionOrder: sectionOrder++,
        phase: 'Change Control',
        summary: 'Documentation of design changes and their impact assessments',
        itemCount: 0,
        completedItems: 0,
        approvedItems: 0,
        isComplete: false,
        createdAt: new Date(),
      });
    }

    if (includeRiskManagement) {
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'risk_management',
        sectionTitle: 'Risk Management File',
        sectionOrder: sectionOrder++,
        phase: 'Risk Analysis',
        summary: 'Risk analysis, evaluation, control, and post-market surveillance',
        itemCount: 0,
        completedItems: 0,
        approvedItems: 0,
        isComplete: false,
        createdAt: new Date(),
      });
    }

    if (includeTransfer) {
      sectionsToCreate.push({
        dhfId: newDhf.id,
        sectionType: 'design_transfer',
        sectionTitle: 'Design Transfer',
        sectionOrder: sectionOrder++,
        phase: 'Transfer',
        summary: 'Transfer of design to manufacturing and production processes',
        itemCount: 0,
        completedItems: 0,
        approvedItems: 0,
        isComplete: false,
        createdAt: new Date(),
      });
    }

    // Insert sections if any were created
    if (sectionsToCreate.length > 0) {
      await db.insert(dhfSections).values(sectionsToCreate);
    }

    // Update total sections count
    await db
      .update(designHistoryFiles)
      .set({ 
        totalSections: sectionsToCreate.length,
        updatedAt: new Date(),
      })
      .where(eq(designHistoryFiles.id, newDhf.id));

    res.json({
      success: true,
      data: {
        dhfId: newDhf.dhfId,
        id: newDhf.id,
        version: newDhf.version,
        status: newDhf.status,
        projectId: newDhf.projectId,
        projectCode: projectData.projectCode,
        projectTitle: projectData.title,
        totalSections: sectionsToCreate.length,
        sectionsCreated: sectionsToCreate.map(s => s.sectionType),
      },
      message: `DHF compiled successfully for ${projectData.projectCode} with ${sectionsToCreate.length} sections`,
    });
  } catch (error) {
    console.error('Error compiling DHF:', error);
    res.status(500).json({ error: 'Failed to compile DHF' });
  }
});

// Update DHF status
router.put('/:dhfId/status', async (req, res) => {
  try {
    const { dhfId } = req.params;
    const { status, comments } = req.body;

    await db
      .update(designHistoryFiles)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(designHistoryFiles.id, parseInt(dhfId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating DHF status:', error);
    res.status(500).json({ error: 'Failed to update DHF status' });
  }
});

// Export DHF
router.post('/:dhfId/export', async (req, res) => {
  try {
    const { dhfId } = req.params;
    const { format, reportFormat, includeDetails } = req.body;

    // Create export record
    const [exportRecord] = await db
      .insert(dhfReports)
      .values({
        dhfId: parseInt(dhfId),
        reportType: reportFormat,
        format,
        generatedBy: 9999, // Default user ID
        generatedDate: new Date(),
        status: 'completed',
        downloadCount: 0,
      })
      .returning();

    // Generate download URL (placeholder for now)
    const downloadUrl = `/api/dhf/reports/${exportRecord.id}/download`;

    res.json({
      success: true,
      data: {
        reportId: exportRecord.id,
        downloadUrl,
        format,
        reportFormat,
      },
    });
  } catch (error) {
    console.error('Error exporting DHF:', error);
    res.status(500).json({ error: 'Failed to export DHF' });
  }
});

// Download DHF report
router.get('/reports/:reportId/download', async (req, res) => {
  try {
    const { reportId } = req.params;

    const reportData = await db
      .select()
      .from(dhfReports)
      .where(eq(dhfReports.id, parseInt(reportId)))
      .limit(1);

    if (!reportData.length) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update download count
    await db
      .update(dhfReports)
      .set({
        downloadCount: (reportData[0].downloadCount || 0) + 1,
        lastDownloaded: new Date(),
      })
      .where(eq(dhfReports.id, parseInt(reportId)));

    // For now, return a simple response
    res.json({
      message: 'DHF export functionality will be implemented with actual PDF/Excel generation',
      reportId,
      format: reportData[0].format,
    });
  } catch (error) {
    console.error('Error downloading DHF report:', error);
    res.status(500).json({ error: 'Failed to download DHF report' });
  }
});

export default router;