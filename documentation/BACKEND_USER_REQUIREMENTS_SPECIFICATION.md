# User Requirements Specification (URS) - Backend Only
## Cosmic QMS (eQMS Platform) - Backend Systems

**Document ID:** URS-BACKEND-001  
**Version:** 1.0  
**Date:** 2025-05-22  
**Standards Referenced:**
- ISO 13485:2016
- IEC 62304:2006 + A1:2015
- ISO 14971:2019

---

## 1. Backend System Scope

### 1.1 Requirements Scope
This URS applies **EXCLUSIVELY** to:
- **Backend API endpoints** and service logic
- **Database operations** and data integrity
- **Authentication/authorization** middleware
- **Process workflow engines** (CAPA, Document Control, etc.)
- **System configuration** and security controls

### 1.2 Explicitly Excluded
- User interface requirements
- Frontend client functionality
- Visual design specifications
- User experience workflows

---

## 2. Functional Requirements - Backend Services

### 2.1 CAPA Processing Engine

**URS-BACKEND-001: CAPA Creation Service**
- The backend shall validate CAPA data before database insertion
- The system shall enforce required fields: title, description, priority, assignedTo
- The API shall return 400 for invalid data with specific validation errors
- The service shall create audit trail entries for every CAPA creation

**URS-BACKEND-002: CAPA Access Control**
- The system shall restrict CAPA edit rights to Owner + QA roles only
- The API shall return 403 for unauthorized edit attempts
- The backend shall validate user permissions before any CAPA modification
- The service shall log all permission violations for security monitoring

**URS-BACKEND-003: CAPA Workflow State Management**
- The backend shall enforce valid state transitions only (Draft → Under Review → Approved → Closed)
- The system shall prevent invalid state jumps (e.g., Draft → Closed)
- The API shall validate state change permissions based on user role
- The service shall maintain complete state change history in database

### 2.2 Document Management Backend

**URS-BACKEND-004: Document Approval Engine**
- The system shall restrict document approval to authorized approvers only
- The backend shall validate document is in "Pending" status before allowing approval
- The API shall update document status to "Approved" and record approver ID
- The service shall create immutable approval audit trail entry

**URS-BACKEND-005: Document Version Control**
- The backend shall maintain complete revision history for all documents
- The system shall enforce unique version numbers per document
- The API shall prevent deletion of documents with approval history
- The service shall track all document changes with timestamps and user IDs

### 2.3 Supplier Management Backend

**URS-BACKEND-006: Supplier Risk Assessment API**
- The system shall calculate supplier risk scores based on criticality and performance
- The backend shall enforce requalification schedules: Critical (1yr), Major (2yr), Minor (4yr)
- The API shall validate supplier data completeness before allowing activation
- The service shall generate automated assessment reminders based on due dates

**URS-BACKEND-007: Supplier Audit Tracking**
- The backend shall maintain complete audit trail for all supplier assessments
- The system shall enforce audit frequency: Critical (annual), Major (3yr), Minor (optional)
- The API shall prevent modification of completed audit records
- The service shall track audit status transitions and completion dates

---

## 3. Non-Functional Requirements - Backend Systems

### 3.1 Security Requirements

**URS-BACKEND-008: Authentication Service**
- The API shall return 401 on token expiration or invalid credentials
- The system shall implement JWT token-based authentication with 8-hour expiration
- The backend shall validate token signature and claims on every protected request
- The service shall log all authentication failures for security monitoring

**URS-BACKEND-009: Authorization Middleware**
- The system shall implement role-based access control (RBAC) for all protected endpoints
- The API shall return 403 for insufficient role permissions
- The backend shall validate permissions at both endpoint and data levels
- The service shall maintain separation of duties for critical operations

### 3.2 Data Integrity Requirements

**URS-BACKEND-010: Database Transaction Management**
- The system shall use database transactions for all multi-table operations
- The backend shall implement automatic rollback on any transaction failure
- The API shall ensure atomic operations for critical business processes
- The service shall maintain referential integrity across all related tables

**URS-BACKEND-011: Audit Trail Service**
- The system shall maintain immutable audit trails for all regulatory data changes
- The backend shall capture: timestamp, user ID, action, before/after values
- The API shall prevent modification or deletion of audit trail records
- The service shall ensure audit trail completeness for compliance reporting

### 3.3 Performance Requirements

**URS-BACKEND-012: API Response Performance**
- The system shall respond to authenticated requests within 2 seconds under normal load
- The backend shall handle concurrent user sessions without data corruption
- The API shall implement proper error handling with meaningful error codes
- The service shall maintain connection pooling for database efficiency

---

## 4. Integration Requirements - Backend Only

### 4.1 Database Integration

**URS-BACKEND-013: PostgreSQL Data Layer**
- The system shall use PostgreSQL for all persistent data storage
- The backend shall implement proper connection pooling and timeout handling
- The API shall use parameterized queries to prevent SQL injection
- The service shall maintain database schema versioning and migration controls

### 4.2 External System Integration

**URS-BACKEND-014: File Storage Service**
- The system shall securely upload files to AWS S3 with proper access controls
- The backend shall validate file types and size limits before storage
- The API shall generate secure, time-limited download URLs for authorized access
- The service shall maintain file metadata and access logs

---

## 5. Compliance Requirements - Backend

### 5.1 Regulatory Data Handling

**URS-BACKEND-015: 21 CFR Part 11 Compliance**
- The system shall implement electronic signature validation for critical records
- The backend shall maintain complete change history with user identification
- The API shall prevent unauthorized alteration of signed records
- The service shall ensure data integrity through checksums and validation

**URS-BACKEND-016: ISO 13485 Process Control**
- The system shall enforce documented procedures through workflow engines
- The backend shall validate process step completion before allowing progression
- The API shall maintain traceability from requirements through implementation
- The service shall ensure corrective action closure verification

---

## 6. Validation Criteria

### 6.1 Backend Testing Requirements

Each requirement shall be validated through:
- **Unit tests** for individual service functions
- **Integration tests** for API endpoint behavior
- **Security tests** for authentication and authorization
- **Performance tests** for response time and concurrency
- **Compliance tests** for regulatory requirement adherence

### 6.2 Acceptance Criteria

All backend requirements must demonstrate:
- Proper error handling and logging
- Security control effectiveness
- Data integrity maintenance
- Audit trail completeness
- Regulatory compliance alignment

---

## 7. Traceability Matrix

| Requirement ID | Description | Risk Control | Test Case |
|----------------|-------------|--------------|-----------|
| URS-BACKEND-001 | CAPA Creation Service | RISK-005 | TC-CAPA-001 |
| URS-BACKEND-002 | CAPA Access Control | RISK-004 | TC-AUTH-002 |
| URS-BACKEND-008 | Authentication Service | RISK-003 | TC-AUTH-001 |
| URS-BACKEND-010 | Transaction Management | RISK-001 | TC-DATA-001 |
| URS-BACKEND-011 | Audit Trail Service | RISK-002 | TC-AUDIT-001 |

---

*This URS focuses exclusively on eQMS platform backend systems and excludes all user interface, user experience, and frontend considerations per regulatory scope definition.*