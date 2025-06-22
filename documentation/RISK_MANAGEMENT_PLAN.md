# Risk Management Plan (ISO 14971-Aligned)
## Cosmic QMS (eQMS Platform) - Backend Systems Only

**Document ID:** RMP-001  
**Version:** 1.0  
**Date:** 2025-05-22  
**Standards Referenced:**
- ISO 14971:2019
- IEC 62304:2006 + A1:2015
- ISO 13485:2016

---

## 1. Scope Definition

### 1.1 Risk Management Scope
This Risk Management Plan applies **EXCLUSIVELY** to:
- **Backend source code** and service logic
- **Database integrity** and data flow mechanisms
- **API security** and authentication systems
- **Process control logic** for regulatory workflows
- **System configuration** and deployment infrastructure

### 1.2 Explicitly Excluded
- User interface elements and user experience
- Frontend client-side validation
- Visual design and presentation layers
- User training or operational procedures

---

## 2. Risk Analysis Framework

### 2.1 Backend Hazard Categories

#### 2.1.1 Data Integrity Hazards
**HAZARD-001: Data Loss in CAPA System**
- **Source:** Database transaction failures, incomplete writes
- **Consequence:** Loss of regulatory compliance data, audit trail gaps
- **Risk Control:** Transaction rollback mechanisms, backup validation

**HAZARD-002: Audit Trail Corruption**
- **Source:** Concurrent write operations, timestamp inconsistencies
- **Consequence:** Regulatory non-compliance, data integrity questions
- **Risk Control:** Database-level constraints, atomic operations

#### 2.1.2 Security & Access Control Hazards
**HAZARD-003: Unauthorized API Access**
- **Source:** JWT token compromise, session hijacking
- **Consequence:** Unauthorized modification of quality records
- **Risk Control:** Token expiration, role-based validation middleware

**HAZARD-004: Privilege Escalation**
- **Source:** Flawed authorization logic in backend services
- **Consequence:** Users accessing restricted quality functions
- **Risk Control:** Multi-layer permission validation, principle of least privilege

#### 2.1.3 Process Execution Hazards
**HAZARD-005: CAPA Workflow Engine Failure**
- **Source:** Logic errors in state transitions, timeout handling
- **Consequence:** Stalled regulatory processes, compliance deadlines missed
- **Risk Control:** State validation, error recovery mechanisms

**HAZARD-006: Document Approval Process Bypass**
- **Source:** API endpoint vulnerabilities, workflow logic flaws
- **Consequence:** Unapproved documents entering controlled state
- **Risk Control:** Multi-step validation, approval state verification

---

## 3. Risk Control Measures

### 3.1 Database-Level Controls
```typescript
// Example: Transaction-based CAPA creation with rollback
export async function createCapaWithAuditTrail(capaData: InsertCapa) {
  return await db.transaction(async (tx) => {
    const capa = await tx.insert(capas).values(capaData).returning();
    await tx.insert(auditTrail).values({
      entityType: 'capa',
      entityId: capa[0].id,
      action: 'created',
      timestamp: new Date()
    });
    return capa[0];
  });
}
```

### 3.2 API Security Controls
```typescript
// Example: Multi-layer authorization middleware
export function requireCapaAccess(action: 'read' | 'write' | 'approve') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const hasPermission = validateCapaPermission(req.user, action);
    if (!hasPermission) return res.status(403).json({ error: 'Forbidden' });
    
    next();
  };
}
```

### 3.3 Process Integrity Controls
```typescript
// Example: Document approval state validation
export async function approveDocument(documentId: number, approverId: number) {
  const document = await getDocument(documentId);
  
  // Validate current state allows approval
  if (document.statusId !== PENDING_APPROVAL_STATUS) {
    throw new Error('Document not in approvable state');
  }
  
  // Validate approver has authority
  if (!hasApprovalAuthority(approverId, document.documentType)) {
    throw new Error('Insufficient approval authority');
  }
  
  return updateDocumentStatus(documentId, APPROVED_STATUS, approverId);
}
```

---

## 4. Risk Assessment Matrix

| Risk ID | Hazard | Probability | Severity | Risk Level | Controls |
|---------|--------|-------------|----------|------------|----------|
| RISK-001 | Data Loss in CAPA | Low | High | Medium | Transaction rollback, backup validation |
| RISK-002 | Audit Trail Corruption | Medium | High | High | Atomic operations, timestamp validation |
| RISK-003 | Unauthorized API Access | Medium | Medium | Medium | JWT expiration, role validation |
| RISK-004 | Privilege Escalation | Low | High | Medium | Multi-layer permissions, least privilege |
| RISK-005 | CAPA Workflow Failure | Low | Medium | Low | State validation, error recovery |
| RISK-006 | Document Approval Bypass | Low | High | Medium | Multi-step validation, state verification |

---

## 5. Risk Control Verification

### 5.1 Backend Security Testing
- **Penetration testing** of API endpoints
- **Authentication bypass** attempt scenarios
- **SQL injection** and data manipulation tests
- **Session management** security validation

### 5.2 Data Integrity Testing
- **Transaction rollback** under failure conditions
- **Concurrent access** stress testing
- **Audit trail completeness** verification
- **Backup and recovery** validation

### 5.3 Process Logic Testing
- **State transition validation** in workflows
- **Permission boundary** enforcement testing
- **Error handling** and recovery scenarios
- **Configuration drift** detection

---

## 6. Residual Risk Acceptance

### 6.1 Acceptable Risk Levels
- **Low Risk:** Acceptable with standard monitoring
- **Medium Risk:** Requires additional controls and regular review
- **High Risk:** Not acceptable, must implement additional mitigations

### 6.2 Risk Monitoring
- **Automated monitoring** of security events
- **Regular assessment** of control effectiveness
- **Incident tracking** and root cause analysis
- **Quarterly risk review** meetings

---

## 7. Risk Management Review Schedule

**Initial Risk Assessment:** Completed  
**Risk Control Implementation:** In Progress  
**Risk Control Verification:** Planned Q3 2025  
**Post-Market Surveillance:** Ongoing  
**Annual Risk Review:** December 2025

---

*This risk management plan focuses exclusively on eQMS platform backend systems and excludes all user interface, user experience, and frontend considerations per regulatory scope definition.*