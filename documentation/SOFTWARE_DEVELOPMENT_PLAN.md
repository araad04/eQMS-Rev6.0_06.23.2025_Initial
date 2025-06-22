# Software Development Plan (SDP)
## Cosmic QMS (eQMS Platform)

**Document ID:** SDP-001  
**Version:** 1.0  
**Date:** 2025-05-22  
**Standards Referenced:**
- ISO 13485:2016
- IEC 62304:2006 + A1:2015
- ISO 14971:2019
- FDA 21 CFR Part 820

---

## 1. Project Overview

### 1.1 System Description
**System Name:** Cosmic QMS (eQMS Platform)  
**Application Type:** Web-based, AWS-hosted Electronic Quality Management System  
**Safety Classification:** Class B (IEC 62304) - Non-life-threatening medical device software

### 1.2 Scope Clarification
This SDP applies strictly to:
- Backend source code and service logic
- Security mechanisms and data flow
- Regulatory-critical process control logic
- Compliance documentation and validation

**Excluded:** UI/UX, frontend visuals, customer-facing elements

---

## 2. Lifecycle Model

### 2.1 Development Approach
**Model:** Agile/V-model Hybrid
- Agile sprints for iterative development
- V-model validation gates for regulatory compliance
- Continuous integration with validation checkpoints

### 2.2 Key Deliverables
1. **User Requirements Specification (URS)**
2. **Software Design Specification (SDS)**
3. **Risk Management Documentation**
4. **Test Cases and Validation Protocols**
5. **Traceability Matrix**
6. **Configuration Management Plan**

---

## 3. Technical Ownership & Responsibilities

### 3.1 Role Assignments
- **Lead Developer:** Backend architecture and core logic
- **Security Engineer:** Authentication, authorization, data protection
- **Validation Engineer:** Test automation and compliance verification
- **QA Manager:** Regulatory alignment and process oversight

### 3.2 Backend Module Ownership
- **CAPA Engine:** Process control and workflow validation
- **Audit Tracking:** Data integrity and trail maintenance
- **Change Control:** Version management and impact analysis
- **Document Management:** Approval workflows and revision control

---

## 4. Safety Classification (IEC 62304)

### 4.1 Classification Rationale
**Class B - Non-life-threatening**
- eQMS platform manages quality processes but does not directly control medical devices
- Software failure could impact quality management but not patient safety directly
- Appropriate risk controls and validation required per IEC 62304 Section 5

### 4.2 Required Documentation
- Software requirements analysis (Section 5.2)
- Software architectural design (Section 5.3)
- Software detailed design (Section 5.4)
- Software implementation and integration (Section 5.5-5.6)
- Software system testing (Section 5.7)
- Software release (Section 5.8)

---

## 5. Development Standards

### 5.1 Technology Stack
- **Backend:** TypeScript + Node.js + Express
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** JWT with role-based access control
- **Testing:** Vitest for unit and integration tests

### 5.2 Code Quality Standards
- ESLint + Prettier for consistent formatting
- TypeScript strict mode for type safety
- 80%+ test coverage for critical backend logic
- Signed commits and peer review required

---

## 6. Regulatory Alignment

### 6.1 ISO 13485:2016 Mapping
- **Section 4.2.3:** Document Control → Document management module
- **Section 7.3:** Design and Development → Change control processes
- **Section 8.2.1:** Customer Feedback → CAPA integration
- **Section 8.5.2:** Corrective Action → CAPA workflow engine

### 6.2 IEC 62304:2006 Compliance
- Software lifecycle processes implementation
- Risk management integration per ISO 14971
- Configuration management and change control
- Verification and validation protocols

---

## 7. Configuration Management

### 7.1 Version Control Strategy
- Git-based branching with semantic versioning
- Feature branches with mandatory peer review
- Release tags for all validated versions
- Automated CI/CD with validation gates

### 7.2 Change Impact Analysis
Required for changes to:
- CAPA processing logic
- API authentication/authorization
- Database schema modifications
- File handling and storage systems

---

## 8. Review and Approval

**Prepared by:** Development Team  
**Reviewed by:** QA Manager  
**Approved by:** Quality Director  

**Next Review Date:** 2025-11-22 (6 months)

---

*This document is controlled under the Cosmic QMS document management system and requires formal change control for modifications.*