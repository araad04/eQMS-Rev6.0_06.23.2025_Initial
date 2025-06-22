import { eq, and, desc, sql, isNull, isNotNull } from "drizzle-orm";
import { db } from "./db";
import {
  organizationalPositions,
  organizationalStructure,
  organizationalApprovals,
  organizationalDelegations,
  organizationalChart,
  organizationalAuditTrail,
  users,
  type OrganizationalPosition,
  type OrganizationalStructure,
  type OrganizationalApproval,
  type OrganizationalDelegation,
  type OrganizationalChart,
  type InsertOrganizationalPosition,
  type InsertOrganizationalStructure,
  type InsertOrganizationalApproval,
  type InsertOrganizationalDelegation,
  type InsertOrganizationalChart,
} from "@shared/schema";

export class OrganizationalStorage {
  // Positions Management
  async createPosition(position: InsertOrganizationalPosition): Promise<OrganizationalPosition> {
    const [newPosition] = await db.insert(organizationalPositions).values(position).returning();
    
    // Log audit trail
    await this.logAuditTrail({
      entityType: "position",
      entityId: newPosition.id,
      action: "create",
      userId: position.createdBy,
    });
    
    return newPosition;
  }

  async getPositions(): Promise<OrganizationalPosition[]> {
    return await db
      .select()
      .from(organizationalPositions)
      .where(eq(organizationalPositions.isActive, true))
      .orderBy(organizationalPositions.level, organizationalPositions.department);
  }

  async getPositionById(id: number): Promise<OrganizationalPosition | null> {
    const [position] = await db
      .select()
      .from(organizationalPositions)
      .where(eq(organizationalPositions.id, id));
    return position || null;
  }

  async updatePosition(id: number, updates: Partial<InsertOrganizationalPosition>, userId: number): Promise<OrganizationalPosition> {
    const [updated] = await db
      .update(organizationalPositions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationalPositions.id, id))
      .returning();

    // Log audit trail for each changed field
    Object.entries(updates).forEach(async ([field, newValue]) => {
      await this.logAuditTrail({
        entityType: "position",
        entityId: id,
        action: "update",
        fieldChanged: field,
        newValue: String(newValue),
        userId,
      });
    });

    return updated;
  }

  async deletePosition(id: number, userId: number): Promise<void> {
    await db
      .update(organizationalPositions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(organizationalPositions.id, id));

    await this.logAuditTrail({
      entityType: "position",
      entityId: id,
      action: "delete",
      userId,
    });
  }

  async getPositionHierarchy(): Promise<any[]> {
    const positions = await db
      .select({
        id: organizationalPositions.id,
        title: organizationalPositions.title,
        description: organizationalPositions.description,
        department: organizationalPositions.department,
        level: organizationalPositions.level,
        parentPositionId: organizationalPositions.parentPositionId,
        responsibilities: organizationalPositions.responsibilities,
        requiredQualifications: organizationalPositions.requiredQualifications,
      })
      .from(organizationalPositions)
      .where(eq(organizationalPositions.isActive, true))
      .orderBy(organizationalPositions.level);

    // Build hierarchical structure
    const positionMap = new Map();
    const rootPositions: any[] = [];

    positions.forEach(position => {
      positionMap.set(position.id, { ...position, children: [] });
    });

    positions.forEach(position => {
      if (position.parentPositionId) {
        const parent = positionMap.get(position.parentPositionId);
        if (parent) {
          parent.children.push(positionMap.get(position.id));
        }
      } else {
        rootPositions.push(positionMap.get(position.id));
      }
    });

    return rootPositions;
  }

  // Organizational Structure Management
  async createStructureAssignment(assignment: InsertOrganizationalStructure): Promise<OrganizationalStructure> {
    const [newAssignment] = await db.insert(organizationalStructure).values(assignment).returning();
    
    await this.logAuditTrail({
      entityType: "structure",
      entityId: newAssignment.id,
      action: "create",
      userId: assignment.userId || 0,
    });
    
    return newAssignment;
  }

  async getOrganizationalStructure(): Promise<any[]> {
    const structure = await db
      .select({
        id: organizationalStructure.id,
        positionId: organizationalStructure.positionId,
        userId: organizationalStructure.userId,
        reportingToId: organizationalStructure.reportingToId,
        startDate: organizationalStructure.startDate,
        endDate: organizationalStructure.endDate,
        isActive: organizationalStructure.isActive,
        delegatedAuthority: organizationalStructure.delegatedAuthority,
        budgetAuthority: organizationalStructure.budgetAuthority,
        signatureAuthority: organizationalStructure.signatureAuthority,
        position: {
          id: organizationalPositions.id,
          title: organizationalPositions.title,
          department: organizationalPositions.department,
          level: organizationalPositions.level,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
        },
      })
      .from(organizationalStructure)
      .leftJoin(organizationalPositions, eq(organizationalStructure.positionId, organizationalPositions.id))
      .leftJoin(users, eq(organizationalStructure.userId, users.id))
      .where(eq(organizationalStructure.isActive, true))
      .orderBy(organizationalPositions.level);

    return structure;
  }

  async getStructureByUserId(userId: number): Promise<OrganizationalStructure | null> {
    const [structure] = await db
      .select()
      .from(organizationalStructure)
      .where(
        and(
          eq(organizationalStructure.userId, userId),
          eq(organizationalStructure.isActive, true),
          isNull(organizationalStructure.endDate)
        )
      );
    return structure || null;
  }

  async updateStructureAssignment(id: number, updates: Partial<InsertOrganizationalStructure>, userId: number): Promise<OrganizationalStructure> {
    const [updated] = await db
      .update(organizationalStructure)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizationalStructure.id, id))
      .returning();

    await this.logAuditTrail({
      entityType: "structure",
      entityId: id,
      action: "update",
      userId,
    });

    return updated;
  }

  // Approval Management
  async createApprovalRule(approval: InsertOrganizationalApproval): Promise<OrganizationalApproval> {
    const [newApproval] = await db.insert(organizationalApprovals).values(approval).returning();
    
    await this.logAuditTrail({
      entityType: "approval",
      entityId: newApproval.id,
      action: "create",
      userId: approval.structureId, // Using structureId as proxy for userId
    });
    
    return newApproval;
  }

  async getApprovalRules(): Promise<any[]> {
    return await db
      .select({
        id: organizationalApprovals.id,
        structureId: organizationalApprovals.structureId,
        documentType: organizationalApprovals.documentType,
        approvalLevel: organizationalApprovals.approvalLevel,
        canApprove: organizationalApprovals.canApprove,
        canReview: organizationalApprovals.canReview,
        canDelegate: organizationalApprovals.canDelegate,
        conditions: organizationalApprovals.conditions,
        position: {
          title: organizationalPositions.title,
          department: organizationalPositions.department,
        },
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(organizationalApprovals)
      .leftJoin(organizationalStructure, eq(organizationalApprovals.structureId, organizationalStructure.id))
      .leftJoin(organizationalPositions, eq(organizationalStructure.positionId, organizationalPositions.id))
      .leftJoin(users, eq(organizationalStructure.userId, users.id))
      .orderBy(organizationalApprovals.approvalLevel);
  }

  async getApprovalRulesByUser(userId: number): Promise<OrganizationalApproval[]> {
    return await db
      .select()
      .from(organizationalApprovals)
      .leftJoin(organizationalStructure, eq(organizationalApprovals.structureId, organizationalStructure.id))
      .where(eq(organizationalStructure.userId, userId))
      .then(results => results.map(r => r.organizational_approvals));
  }

  // Delegation Management
  async createDelegation(delegation: InsertOrganizationalDelegation): Promise<OrganizationalDelegation> {
    const [newDelegation] = await db.insert(organizationalDelegations).values(delegation).returning();
    
    await this.logAuditTrail({
      entityType: "delegation",
      entityId: newDelegation.id,
      action: "create",
      userId: delegation.createdBy,
    });
    
    return newDelegation;
  }

  async getActiveDelegations(): Promise<any[]> {
    return await db
      .select({
        id: organizationalDelegations.id,
        delegationType: organizationalDelegations.delegationType,
        authority: organizationalDelegations.authority,
        startDate: organizationalDelegations.startDate,
        endDate: organizationalDelegations.endDate,
        reason: organizationalDelegations.reason,
        isActive: organizationalDelegations.isActive,
        delegator: {
          position: organizationalPositions.title,
          user: sql`${users.firstName} || ' ' || ${users.lastName}`.as('delegator_name'),
        },
        delegatee: {
          position: sql`delegatee_pos.title`.as('delegatee_position'),
          user: sql`delegatee_user.first_name || ' ' || delegatee_user.last_name`.as('delegatee_name'),
        },
      })
      .from(organizationalDelegations)
      .leftJoin(organizationalStructure, eq(organizationalDelegations.delegatorId, organizationalStructure.id))
      .leftJoin(organizationalPositions, eq(organizationalStructure.positionId, organizationalPositions.id))
      .leftJoin(users, eq(organizationalStructure.userId, users.id))
      .leftJoin(
        sql`organizational_structure delegatee_struct`,
        sql`${organizationalDelegations.delegateeId} = delegatee_struct.id`
      )
      .leftJoin(
        sql`organizational_positions delegatee_pos`,
        sql`delegatee_struct.position_id = delegatee_pos.id`
      )
      .leftJoin(
        sql`users delegatee_user`,
        sql`delegatee_struct.user_id = delegatee_user.id`
      )
      .where(
        and(
          eq(organizationalDelegations.isActive, true),
          sql`${organizationalDelegations.endDate} > NOW() OR ${organizationalDelegations.endDate} IS NULL`
        )
      );
  }

  // Organizational Chart Management
  async createChart(chart: InsertOrganizationalChart): Promise<OrganizationalChart> {
    // Deactivate previous active charts
    await db
      .update(organizationalChart)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(organizationalChart.isActive, true));

    const [newChart] = await db.insert(organizationalChart).values(chart).returning();
    
    await this.logAuditTrail({
      entityType: "chart",
      entityId: newChart.id,
      action: "create",
      userId: chart.createdBy,
    });
    
    return newChart;
  }

  async getActiveChart(): Promise<OrganizationalChart | null> {
    const [chart] = await db
      .select()
      .from(organizationalChart)
      .where(eq(organizationalChart.isActive, true))
      .orderBy(desc(organizationalChart.createdAt));
    return chart || null;
  }

  async getChartHistory(): Promise<OrganizationalChart[]> {
    return await db
      .select()
      .from(organizationalChart)
      .orderBy(desc(organizationalChart.createdAt));
  }

  async approveChart(id: number, approvedBy: number): Promise<OrganizationalChart> {
    const [updated] = await db
      .update(organizationalChart)
      .set({ 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(organizationalChart.id, id))
      .returning();

    await this.logAuditTrail({
      entityType: "chart",
      entityId: id,
      action: "approve",
      userId: approvedBy,
    });

    return updated;
  }

  // Audit Trail
  async logAuditTrail(data: {
    entityType: string;
    entityId: number;
    action: string;
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    userId: number;
    ipAddress?: string;
  }): Promise<void> {
    await db.insert(organizationalAuditTrail).values({
      ...data,
      timestamp: new Date(),
    });
  }

  async getAuditTrail(entityType?: string, entityId?: number): Promise<any[]> {
    let query = db
      .select({
        id: organizationalAuditTrail.id,
        entityType: organizationalAuditTrail.entityType,
        entityId: organizationalAuditTrail.entityId,
        action: organizationalAuditTrail.action,
        fieldChanged: organizationalAuditTrail.fieldChanged,
        oldValue: organizationalAuditTrail.oldValue,
        newValue: organizationalAuditTrail.newValue,
        reason: organizationalAuditTrail.reason,
        timestamp: organizationalAuditTrail.timestamp,
        ipAddress: organizationalAuditTrail.ipAddress,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(organizationalAuditTrail)
      .leftJoin(users, eq(organizationalAuditTrail.userId, users.id));

    if (entityType) {
      query = query.where(eq(organizationalAuditTrail.entityType, entityType));
    }

    if (entityId) {
      query = query.where(eq(organizationalAuditTrail.entityId, entityId));
    }

    return await query.orderBy(desc(organizationalAuditTrail.timestamp));
  }

  // Analytics and Reporting
  async getOrganizationalMetrics(): Promise<any> {
    const totalPositions = await db
      .select({ count: sql`count(*)` })
      .from(organizationalPositions)
      .where(eq(organizationalPositions.isActive, true));

    const filledPositions = await db
      .select({ count: sql`count(*)` })
      .from(organizationalStructure)
      .where(
        and(
          eq(organizationalStructure.isActive, true),
          isNotNull(organizationalStructure.userId)
        )
      );

    const activeDelegations = await db
      .select({ count: sql`count(*)` })
      .from(organizationalDelegations)
      .where(
        and(
          eq(organizationalDelegations.isActive, true),
          sql`${organizationalDelegations.endDate} > NOW() OR ${organizationalDelegations.endDate} IS NULL`
        )
      );

    const departmentCounts = await db
      .select({
        department: organizationalPositions.department,
        count: sql`count(*)`,
      })
      .from(organizationalPositions)
      .where(eq(organizationalPositions.isActive, true))
      .groupBy(organizationalPositions.department);

    return {
      totalPositions: totalPositions[0]?.count || 0,
      filledPositions: filledPositions[0]?.count || 0,
      vacantPositions: (totalPositions[0]?.count || 0) - (filledPositions[0]?.count || 0),
      activeDelegations: activeDelegations[0]?.count || 0,
      departmentDistribution: departmentCounts,
      utilizationRate: totalPositions[0]?.count 
        ? ((filledPositions[0]?.count || 0) / (totalPositions[0]?.count || 1)) * 100 
        : 0,
    };
  }
}

export const organizationalStorage = new OrganizationalStorage();