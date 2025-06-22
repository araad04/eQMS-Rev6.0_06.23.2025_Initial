# Validation Test Protocols
## Cosmic QMS (eQMS Platform) - Backend Systems Validation

**Document ID:** VTP-001  
**Version:** 1.0  
**Date:** 2025-05-22  
**Standards Referenced:**
- IEC 62304:2006 + A1:2015 Section 5.7 (Software System Testing)
- ISO 13485:2016 Section 7.3.6 (Design and Development Verification)

---

## 1. Test Protocol Overview

### 1.1 Validation Scope
This validation protocol applies **EXCLUSIVELY** to:
- **Backend API security controls** and authentication systems
- **Database integrity mechanisms** and transaction management
- **CAPA workflow engine** state transitions and business logic
- **Document approval processes** and electronic signatures
- **Audit trail completeness** and regulatory compliance
- **Performance optimization** under regulatory requirements

### 1.2 Excluded from Validation
- Frontend user interface components
- Client-side validation logic
- Visual design elements and user experience

---

## 2. Authentication & Authorization Validation

### 2.1 Test Protocol: JWT Authentication Security
**Test ID:** TP-AUTH-001  
**Requirement:** URS-BACKEND-008 (Authentication Service)  
**Risk Control:** RISK-003 (Unauthorized API Access)

#### Test Procedures:
```typescript
// Test Case 1: Valid JWT Token Authentication
async function testValidJWTAuthentication() {
  const validToken = generateValidJWTToken({
    userId: 9999,
    role: 'qa',
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  });
  
  const response = await apiRequest('/api/capa', {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  
  // Validation Criteria:
  assert(response.status === 200, 'Valid token should grant access');
  assert(response.headers['x-auth-user'], 'User context should be set');
}

// Test Case 2: Expired JWT Token Rejection
async function testExpiredJWTRejection() {
  const expiredToken = generateValidJWTToken({
    userId: 9999,
    role: 'qa',
    exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
  });
  
  const response = await apiRequest('/api/capa', {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  
  // Validation Criteria:
  assert(response.status === 401, 'Expired token must be rejected');
  assert(response.body.error === 'Invalid token', 'Clear error message required');
}

// Test Case 3: Role-Based Access Control
async function testRoleBasedAccess() {
  const userToken = generateValidJWTToken({ userId: 9999, role: 'user' });
  
  const response = await apiRequest('/api/capa/1', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  
  // Validation Criteria:
  assert(response.status === 403, 'Insufficient permissions must block access');
  assert(response.body.code === 'INSUFFICIENT_PERMISSIONS', 'Proper error code required');
}
```

**Expected Results:**
- ✅ Valid tokens grant appropriate access
- ✅ Expired tokens are rejected with 401 status
- ✅ Role-based restrictions are enforced
- ✅ Security events are logged for monitoring

---

### 2.2 Test Protocol: Database Transaction Integrity
**Test ID:** TP-DATA-001  
**Requirement:** URS-BACKEND-010 (Transaction Management)  
**Risk Control:** RISK-001 (Data Loss in CAPA)

#### Test Procedures:
```typescript
// Test Case 1: Successful Transaction Commit
async function testTransactionCommit() {
  const capaData = {
    title: 'Test CAPA for Transaction Validation',
    description: 'Validation test case',
    priority: 2,
    assignedTo: 9999
  };
  
  const initialCount = await db.select({ count: count() }).from(capas);
  
  const result = await createCapaWithTransaction(capaData);
  
  const finalCount = await db.select({ count: count() }).from(capas);
  const auditEntries = await db.select().from(auditTrail)
    .where(eq(auditTrail.entityId, result.id));
  
  // Validation Criteria:
  assert(finalCount[0].count === initialCount[0].count + 1, 'CAPA record created');
  assert(auditEntries.length > 0, 'Audit trail entry created');
  assert(result.id > 0, 'Valid CAPA ID returned');
}

// Test Case 2: Transaction Rollback on Failure
async function testTransactionRollback() {
  const invalidCapaData = {
    title: null, // Invalid data to trigger failure
    description: 'This should fail',
    priority: 2,
    assignedTo: 9999
  };
  
  const initialCount = await db.select({ count: count() }).from(capas);
  
  try {
    await createCapaWithTransaction(invalidCapaData);
    assert(false, 'Transaction should have failed');
  } catch (error) {
    const finalCount = await db.select({ count: count() }).from(capas);
    
    // Validation Criteria:
    assert(finalCount[0].count === initialCount[0].count, 'No CAPA record created on failure');
    assert(error.message.includes('validation'), 'Proper error message returned');
  }
}

// Test Case 3: Concurrent Transaction Handling
async function testConcurrentTransactions() {
  const promises = Array(10).fill(0).map((_, index) => 
    createCapaWithTransaction({
      title: `Concurrent CAPA ${index}`,
      description: 'Concurrency test',
      priority: 1,
      assignedTo: 9999
    })
  );
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled');
  
  // Validation Criteria:
  assert(successful.length === 10, 'All concurrent transactions should succeed');
  
  // Verify data integrity
  const uniqueTitles = new Set(
    successful.map(r => (r as PromiseFulfilledResult<any>).value.title)
  );
  assert(uniqueTitles.size === 10, 'No data corruption in concurrent access');
}
```

**Expected Results:**
- ✅ Successful transactions commit all changes atomically
- ✅ Failed transactions rollback completely
- ✅ Concurrent transactions maintain data integrity
- ✅ Audit trails are created for all successful operations

---

## 3. CAPA Workflow Engine Validation

### 3.1 Test Protocol: State Transition Validation
**Test ID:** TP-CAPA-002  
**Requirement:** URS-BACKEND-003 (CAPA Workflow States)  
**Risk Control:** RISK-005 (CAPA Workflow Failure)

#### Test Procedures:
```typescript
// Test Case 1: Valid State Transitions
async function testValidStateTransitions() {
  // Create CAPA in Draft state
  const capa = await createCapa({
    title: 'State Transition Test CAPA',
    description: 'Testing workflow states',
    priority: 2,
    assignedTo: 9999,
    statusId: 1 // Draft
  });
  
  // Test Draft → Under Review
  const reviewResult = await updateCapaStatus(capa.id, 2, 9999); // Under Review
  assert(reviewResult.statusId === 2, 'Transition to Under Review successful');
  
  // Test Under Review → Approved
  const approvalResult = await updateCapaStatus(capa.id, 3, 9999); // Approved
  assert(approvalResult.statusId === 3, 'Transition to Approved successful');
  
  // Test Approved → Closed
  const closeResult = await updateCapaStatus(capa.id, 4, 9999); // Closed
  assert(closeResult.statusId === 4, 'Transition to Closed successful');
  
  // Verify audit trail for each transition
  const auditEntries = await db.select().from(auditTrail)
    .where(and(
      eq(auditTrail.entityType, 'capa'),
      eq(auditTrail.entityId, capa.id),
      eq(auditTrail.action, 'status_changed')
    ));
  
  assert(auditEntries.length === 3, 'All state transitions logged in audit trail');
}

// Test Case 2: Invalid State Transitions
async function testInvalidStateTransitions() {
  const capa = await createCapa({
    title: 'Invalid Transition Test',
    description: 'Testing invalid transitions',
    priority: 1,
    assignedTo: 9999,
    statusId: 1 // Draft
  });
  
  // Test Draft → Closed (invalid jump)
  try {
    await updateCapaStatus(capa.id, 4, 9999); // Closed
    assert(false, 'Invalid state transition should be rejected');
  } catch (error) {
    assert(error.message.includes('Invalid status transition'), 'Proper error for invalid transition');
  }
  
  // Verify CAPA remains in original state
  const updatedCapa = await getCapaById(capa.id);
  assert(updatedCapa.statusId === 1, 'CAPA status unchanged after invalid transition');
}

// Test Case 3: Permission-Based State Transitions
async function testPermissionBasedTransitions() {
  const capa = await createCapa({
    title: 'Permission Test CAPA',
    description: 'Testing permission controls',
    priority: 1,
    assignedTo: 9999,
    statusId: 2 // Under Review
  });
  
  // Test unauthorized approval attempt (user role trying to approve)
  try {
    await updateCapaStatus(capa.id, 3, 8888); // Different user without approval rights
    assert(false, 'Unauthorized approval should be rejected');
  } catch (error) {
    assert(error.message.includes('Insufficient permissions'), 'Permission check enforced');
  }
}
```

**Expected Results:**
- ✅ Valid state transitions execute successfully
- ✅ Invalid state transitions are rejected
- ✅ Permission controls prevent unauthorized changes
- ✅ Complete audit trail maintained for all attempts

---

## 4. Electronic Signature Validation (CFR Part 11)

### 4.1 Test Protocol: Electronic Signature Integrity
**Test ID:** TP-CFR-001  
**Requirement:** URS-BACKEND-015 (21 CFR Part 11 Compliance)  
**Risk Control:** RISK-002 (Audit Trail Corruption)

#### Test Procedures:
```typescript
// Test Case 1: Electronic Signature Creation
async function testElectronicSignatureCreation() {
  const document = await createTestDocument({
    title: 'Test Document for E-Signature',
    content: 'Document content for signature validation',
    statusId: 2 // Pending Approval
  });
  
  const signatureData = {
    documentId: document.id,
    userId: 9999,
    signatureReason: 'approve',
    signatureText: 'I approve this document',
    password: 'validUserPassword',
    timestamp: new Date(),
    ipAddress: '192.168.1.100'
  };
  
  const result = await CFRPart11SignatureService.createElectronicSignature(
    signatureData,
    mockRequest
  );
  
  // Validation Criteria:
  assert(result.signatureId > 0, 'Electronic signature created with valid ID');
  assert(result.documentHash.length === 64, 'Document hash generated (SHA-256)');
  
  // Verify document status updated
  const updatedDoc = await getDocumentById(document.id);
  assert(updatedDoc.statusId === 3, 'Document approved after signature');
  assert(updatedDoc.electronicSignatureId === result.signatureId, 'Signature linked to document');
}

// Test Case 2: Signature Verification and Integrity
async function testSignatureVerification() {
  // Create electronic signature
  const document = await createTestDocument({
    title: 'Verification Test Document',
    content: 'Content for verification testing'
  });
  
  const signature = await CFRPart11SignatureService.createElectronicSignature({
    documentId: document.id,
    userId: 9999,
    signatureReason: 'approve',
    signatureText: 'Approved for verification test',
    password: 'validPassword',
    timestamp: new Date(),
    ipAddress: '10.0.0.1'
  }, mockRequest);
  
  // Verify signature immediately
  const verification = await CFRPart11SignatureService.verifyElectronicSignature(
    signature.signatureId
  );
  
  // Validation Criteria:
  assert(verification.isValid === true, 'Electronic signature should be valid');
  assert(verification.integrityCheck === true, 'Document integrity maintained');
  assert(verification.details.signatureId === signature.signatureId, 'Correct signature verified');
}

// Test Case 3: Tamper Detection
async function testTamperDetection() {
  const document = await createTestDocument({
    title: 'Tamper Detection Test',
    content: 'Original content before tampering'
  });
  
  const signature = await CFRPart11SignatureService.createElectronicSignature({
    documentId: document.id,
    userId: 9999,
    signatureReason: 'approve',
    signatureText: 'Original approval',
    password: 'validPassword',
    timestamp: new Date(),
    ipAddress: '127.0.0.1'
  }, mockRequest);
  
  // Simulate document tampering
  await db.update(documents)
    .set({ content: 'TAMPERED CONTENT' })
    .where(eq(documents.id, document.id));
  
  // Verify signature after tampering
  const verification = await CFRPart11SignatureService.verifyElectronicSignature(
    signature.signatureId
  );
  
  // Validation Criteria:
  assert(verification.integrityCheck === false, 'Tampering detected through integrity check');
  assert(verification.isValid === false, 'Signature marked as invalid after tampering');
}
```

**Expected Results:**
- ✅ Electronic signatures create with proper authentication
- ✅ Document integrity maintained through cryptographic hashing
- ✅ Tampering detection through signature verification
- ✅ Complete CFR Part 11 audit trail maintained

---

## 5. Performance Validation

### 5.1 Test Protocol: API Response Time Compliance
**Test ID:** TP-PERF-001  
**Requirement:** URS-BACKEND-012 (API Response Performance)  
**Risk Control:** RISK-008 (Performance Degradation)

#### Test Procedures:
```typescript
// Test Case 1: Single Request Performance
async function testSingleRequestPerformance() {
  const endpoints = [
    '/api/capa',
    '/api/documents',
    '/api/suppliers',
    '/api/audits'
  ];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const response = await apiRequest(endpoint, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    const responseTime = Date.now() - startTime;
    
    // Validation Criteria (Regulatory Requirement):
    assert(responseTime < 2000, `${endpoint} must respond within 2 seconds (${responseTime}ms)`);
    assert(response.status === 200, `${endpoint} must return successful response`);
    
    console.log(`✅ ${endpoint}: ${responseTime}ms`);
  }
}

// Test Case 2: Concurrent Load Performance
async function testConcurrentLoadPerformance() {
  const concurrentUsers = 50;
  const requestsPerUser = 5;
  
  const promises = [];
  
  for (let user = 0; user < concurrentUsers; user++) {
    for (let req = 0; req < requestsPerUser; req++) {
      promises.push(
        (async () => {
          const startTime = Date.now();
          const response = await apiRequest('/api/capa', {
            headers: { Authorization: `Bearer ${validToken}` }
          });
          const responseTime = Date.now() - startTime;
          
          return { responseTime, status: response.status };
        })()
      );
    }
  }
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value.status === 200
  ) as PromiseFulfilledResult<any>[];
  
  const averageResponseTime = successful.reduce((sum, r) => 
    sum + r.value.responseTime, 0
  ) / successful.length;
  
  // Validation Criteria:
  assert(successful.length >= promises.length * 0.95, 'At least 95% success rate under load');
  assert(averageResponseTime < 3000, 'Average response time under 3 seconds during load');
  
  console.log(`✅ Concurrent Load Test: ${successful.length}/${promises.length} requests successful`);
  console.log(`✅ Average Response Time: ${Math.round(averageResponseTime)}ms`);
}
```

**Expected Results:**
- ✅ Single requests complete within 2-second regulatory limit
- ✅ System maintains performance under concurrent load
- ✅ 95%+ success rate during stress testing
- ✅ Performance monitoring captures metrics

---

## 6. Validation Summary & Acceptance Criteria

### 6.1 Overall Validation Requirements
All test protocols must demonstrate:
- **Security Controls:** 100% pass rate for authentication/authorization tests
- **Data Integrity:** No data loss or corruption in transaction tests  
- **Workflow Compliance:** Valid state transitions with complete audit trails
- **Electronic Signatures:** CFR Part 11 compliance with tamper detection
- **Performance:** Sub-2-second response times under normal load

### 6.2 Validation Sign-off Requirements
- [ ] **Development Team:** Code implementation complete
- [ ] **QA Manager:** All test protocols executed successfully
- [ ] **Security Engineer:** Security controls validated
- [ ] **Regulatory Specialist:** Compliance requirements verified

---

*These validation test protocols focus exclusively on eQMS platform backend systems and exclude all frontend, UI, and client-side considerations per regulatory scope definition.*