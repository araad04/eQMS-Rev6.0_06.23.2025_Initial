import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { eq, and, sql, asc, desc } from "drizzle-orm";
import {
  documentApprovalWorkflow,
  documentApprovalSteps,
  organizationalApprovalMatrix,
  organizationalStructure,
  organizationalPositions,
  users,
  documents
} from "../shared/schema";

neonConfig.fetchConnectionCache = true;

export class DocumentApprovalStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  // Initiate document approval workflow
  async initiateApprovalWorkflow(data: {
    documentId: number;
    documentType: string;
    documentVersion: string;
    initiatedBy: number;
  }) {
    // Find applicable approval matrix rules
    const approvalRules = await this.db
      .select()
      .from(organizationalApprovalMatrix)
      .where(eq(organizationalApprovalMatrix.documentType, data.documentType))
      .orderBy(asc(organizationalApprovalMatrix.approvalLevel));

    if (approvalRules.length === 0) {
      throw new Error(`No approval matrix found for document type: ${data.documentType}`);
    }

    // Create workflow
    const [workflow] = await this.db
      .insert(documentApprovalWorkflow)
      .values({
        documentId: data.documentId,
        approvalMatrixId: approvalRules[0].id,
        currentApprovalLevel: 1,
        status: "IN_PROGRESS",
        initiatedBy: data.initiatedBy,
        documentVersion: data.documentVersion,
        workflowMetadata: { totalLevels: approvalRules.length }
      })
      .returning();

    // Create approval steps for each level
    const stepPromises = approvalRules.map((rule, index) =>
      this.db.insert(documentApprovalSteps).values({
        workflowId: workflow.id,
        approvalLevel: rule.approvalLevel,
        assignedToStructureId: rule.structureId,
        status: index === 0 ? "PENDING" : "WAITING",
        dueDate: new Date(Date.now() + rule.escalationDays * 24 * 60 * 60 * 1000)
      })
    );

    await Promise.all(stepPromises);

    return workflow;
  }

  // Process approval decision
  async processApprovalDecision(data: {
    workflowId: number;
    approvalLevel: number;
    decision: "APPROVED" | "REJECTED";
    approvedBy: number;
    comments?: string;
    rejectionReason?: string;
  }) {
    // Update the current step
    const [updatedStep] = await this.db
      .update(documentApprovalSteps)
      .set({
        status: data.decision,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        comments: data.comments,
        rejectionReason: data.rejectionReason,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(documentApprovalSteps.workflowId, data.workflowId),
          eq(documentApprovalSteps.approvalLevel, data.approvalLevel)
        )
      )
      .returning();

    if (data.decision === "REJECTED") {
      // Mark workflow as rejected
      await this.db
        .update(documentApprovalWorkflow)
        .set({
          status: "REJECTED",
          completedAt: new Date(),
          rejectionReason: data.rejectionReason
        })
        .where(eq(documentApprovalWorkflow.id, data.workflowId));
    } else {
      // Check if this was the final approval level
      const remainingSteps = await this.db
        .select()
        .from(documentApprovalSteps)
        .where(
          and(
            eq(documentApprovalSteps.workflowId, data.workflowId),
            eq(documentApprovalSteps.status, "WAITING")
          )
        );

      if (remainingSteps.length === 0) {
        // All approvals complete
        await this.db
          .update(documentApprovalWorkflow)
          .set({
            status: "APPROVED",
            completedAt: new Date()
          })
          .where(eq(documentApprovalWorkflow.id, data.workflowId));

        // Update document status to approved
        const workflow = await this.db
          .select()
          .from(documentApprovalWorkflow)
          .where(eq(documentApprovalWorkflow.id, data.workflowId))
          .limit(1);

        if (workflow.length > 0) {
          await this.db
            .update(documents)
            .set({
              status: "APPROVED",
              approvedBy: data.approvedBy,
              approvedAt: new Date()
            })
            .where(eq(documents.id, workflow[0].documentId));
        }
      } else {
        // Activate next approval level
        const nextStep = remainingSteps[0];
        await this.db
          .update(documentApprovalSteps)
          .set({
            status: "PENDING",
            updatedAt: new Date()
          })
          .where(eq(documentApprovalSteps.id, nextStep.id));

        await this.db
          .update(documentApprovalWorkflow)
          .set({
            currentApprovalLevel: nextStep.approvalLevel
          })
          .where(eq(documentApprovalWorkflow.id, data.workflowId));
      }
    }

    return updatedStep;
  }

  // Get active approval workflows
  async getActiveWorkflows(userId?: number) {
    const query = this.db
      .select({
        workflow: documentApprovalWorkflow,
        document: {
          id: documents.id,
          title: documents.title,
          documentNumber: documents.documentNumber,
          version: documents.version
        },
        currentStep: documentApprovalSteps,
        assignedPosition: organizationalPositions,
        assignedUser: users
      })
      .from(documentApprovalWorkflow)
      .leftJoin(documents, eq(documents.id, documentApprovalWorkflow.documentId))
      .leftJoin(
        documentApprovalSteps,
        and(
          eq(documentApprovalSteps.workflowId, documentApprovalWorkflow.id),
          eq(documentApprovalSteps.status, "PENDING")
        )
      )
      .leftJoin(
        organizationalStructure,
        eq(organizationalStructure.id, documentApprovalSteps.assignedToStructureId)
      )
      .leftJoin(
        organizationalPositions,
        eq(organizationalPositions.id, organizationalStructure.positionId)
      )
      .leftJoin(users, eq(users.id, organizationalStructure.userId))
      .where(eq(documentApprovalWorkflow.status, "IN_PROGRESS"));

    if (userId) {
      return query.where(eq(organizationalStructure.userId, userId));
    }

    return await query;
  }

  // Get workflow history for a document
  async getDocumentApprovalHistory(documentId: number) {
    return await this.db
      .select({
        workflow: documentApprovalWorkflow,
        steps: sql`json_agg(
          json_build_object(
            'id', ${documentApprovalSteps.id},
            'approvalLevel', ${documentApprovalSteps.approvalLevel},
            'status', ${documentApprovalSteps.status},
            'approvedBy', ${documentApprovalSteps.approvedBy},
            'approvedAt', ${documentApprovalSteps.approvedAt},
            'comments', ${documentApprovalSteps.comments},
            'position', ${organizationalPositions.title},
            'userName', CONCAT(${users.firstName}, ' ', ${users.lastName})
          ) ORDER BY ${documentApprovalSteps.approvalLevel}
        )`
      })
      .from(documentApprovalWorkflow)
      .leftJoin(
        documentApprovalSteps,
        eq(documentApprovalSteps.workflowId, documentApprovalWorkflow.id)
      )
      .leftJoin(
        organizationalStructure,
        eq(organizationalStructure.id, documentApprovalSteps.assignedToStructureId)
      )
      .leftJoin(
        organizationalPositions,
        eq(organizationalPositions.id, organizationalStructure.positionId)
      )
      .leftJoin(users, eq(users.id, documentApprovalSteps.approvedBy))
      .where(eq(documentApprovalWorkflow.documentId, documentId))
      .groupBy(documentApprovalWorkflow.id)
      .orderBy(desc(documentApprovalWorkflow.initiatedAt));
  }

  // Delegate approval authority
  async delegateApproval(data: {
    workflowId: number;
    approvalLevel: number;
    delegatedTo: number;
    delegatedBy: number;
    reason?: string;
  }) {
    return await this.db
      .update(documentApprovalSteps)
      .set({
        isDelegated: true,
        delegatedTo: data.delegatedTo,
        delegatedBy: data.delegatedBy,
        delegatedAt: new Date(),
        assignedToStructureId: data.delegatedTo,
        comments: data.reason,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(documentApprovalSteps.workflowId, data.workflowId),
          eq(documentApprovalSteps.approvalLevel, data.approvalLevel)
        )
      )
      .returning();
  }
}