# User Requirements Specification (URS)

**Document ID:** URS-EQMS-001  
**Version:** 1.0.0  
**Date:** May 15, 2025  
**Classification:** Medical Device Software – Class B

## Document Control

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Author | | | |
| Reviewer | | | |
| Approver | | | |

## 1. Introduction

### 1.1 Purpose

This User Requirements Specification (URS) document defines the requirements for an electronic Quality Management System (eQMS) designed to support medical device manufacturers in complying with regulatory requirements, including ISO 13485:2016, FDA 21 CFR Part 820, and EU MDR 2017/745.

### 1.2 Scope

The eQMS shall provide a comprehensive platform for managing quality processes throughout the medical device lifecycle, from design and development through post-market surveillance. The system shall include modules for document control, CAPA management, training records, design control, supplier management, audit management, management review, and risk management.

### 1.3 Definitions and Acronyms

- **CAPA:** Corrective Action and Preventive Action
- **DHF:** Design History File
- **DMR:** Device Master Record
- **eQMS:** Electronic Quality Management System
- **EU MDR:** European Union Medical Device Regulation
- **FMEA:** Failure Mode and Effects Analysis
- **SOP:** Standard Operating Procedure
- **UDI:** Unique Device Identifier
- **URS:** User Requirements Specification
- **V&V:** Verification and Validation

### 1.4 References

- ISO 13485:2016 Medical devices — Quality management systems — Requirements for regulatory purposes
- FDA 21 CFR Part 820 Quality System Regulation
- FDA 21 CFR Part 11 Electronic Records; Electronic Signatures
- EU MDR 2017/745 Medical Device Regulation
- IEC 62304:2006+AMD1:2015 Medical device software — Software life cycle processes
- IEC 62366-1:2015 Medical devices — Application of usability engineering to medical devices
- GDPR (General Data Protection Regulation)

## 2. General Requirements

### 2.1 System Overview

The eQMS shall be a web-based application accessible through standard web browsers. It shall provide a centralized platform for managing quality processes, with role-based access control and configurable workflows.

### 2.2 User Classes and Characteristics

The system shall support the following user classes:

| User Class | Description | Primary Functions |
|------------|-------------|-------------------|
| Administrator | System administrators responsible for configuration and maintenance | User management, system configuration, backup/restore |
| Quality Manager | Personnel responsible for overall quality management | All quality management functions, reporting, analytics |
| Document Controller | Personnel responsible for document management | Document creation, review, approval, distribution |
| Engineer | Personnel involved in product design and development | Design control, risk management, CAPA implementation |
| Regulatory Specialist | Personnel responsible for regulatory compliance | Document review, audit management, regulatory submissions |
| Auditor | Personnel conducting internal or supplier audits | Audit planning, execution, findings management |
| User | Personnel with limited access | View records, complete assigned tasks |

### 2.3 Operating Environment

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| GEN-OE-001 | The system shall be compatible with modern web browsers including Chrome, Firefox, Safari, and Edge (latest versions). | High |
| GEN-OE-002 | The system shall be responsive and functional on desktop computers, laptops, and tablets. | High |
| GEN-OE-003 | The system shall support both cloud and on-premises deployment options. | Medium |
| GEN-OE-004 | The system shall be available 24/7 with planned maintenance windows. | High |

### 2.4 Design and Implementation Constraints

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| GEN-DC-001 | The system shall be developed using current best practices for web application security. | High |
| GEN-DC-002 | The system shall use responsive design principles to ensure usability across different devices and screen sizes. | High |
| GEN-DC-003 | The system shall comply with accessibility standards (WCAG 2.1 AA) to ensure usability for users with disabilities. | Medium |
| GEN-DC-004 | The system shall support internationalization and localization. | Low |

### 2.5 User Documentation

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| GEN-UD-001 | The system shall provide comprehensive online help documentation. | High |
| GEN-UD-002 | The system shall provide context-sensitive help for each module and function. | Medium |
| GEN-UD-003 | The system shall provide user manuals, training materials, and quick reference guides. | High |
| GEN-UD-004 | The system shall provide video tutorials for key functions. | Low |

### 2.6 Assumptions and Dependencies

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| GEN-AD-001 | Users shall have access to computers with internet connectivity and supported web browsers. | High |
| GEN-AD-002 | The organization shall provide necessary resources for system implementation, including hardware, software, and personnel. | High |
| GEN-AD-003 | The organization shall establish procedures for system validation, backup, and disaster recovery. | High |

## 3. Functional Requirements

### 3.1 Authentication and Authorization

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| AUTH-001 | The system shall require user authentication with username and password. | High |
| AUTH-002 | The system shall support two-factor authentication. | Medium |
| AUTH-003 | The system shall enforce password complexity rules. | High |
| AUTH-004 | The system shall automatically lock accounts after a configurable number of failed login attempts. | High |
| AUTH-005 | The system shall support role-based access control. | High |
| AUTH-006 | The system shall maintain an audit trail of login attempts and access to system functions. | High |
| AUTH-007 | The system shall support single sign-on (SSO) integration with corporate identity providers. | Low |

### 3.2 Document Control Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| DOC-001 | The system shall support creation, review, approval, and distribution of documents. | High |
| DOC-002 | The system shall support document versioning and revision control. | High |
| DOC-003 | The system shall support document templates for consistent formatting. | Medium |
| DOC-004 | The system shall support document metadata including title, document number, revision, author, owner, effective date, and review date. | High |
| DOC-005 | The system shall support document workflow with configurable review and approval steps. | High |
| DOC-006 | The system shall support electronic signatures for document approval. | High |
| DOC-007 | The system shall support document distribution and acknowledgment tracking. | High |
| DOC-008 | The system shall support document obsolescence and archiving. | High |
| DOC-009 | The system shall support document search by metadata and content. | High |
| DOC-010 | The system shall support document types including policies, procedures, work instructions, forms, and records. | High |
| DOC-011 | The system shall support document links and references to related documents. | Medium |
| DOC-012 | The system shall support document access control based on user roles and permissions. | High |
| DOC-013 | The system shall support document change control with impact assessment and training requirements. | High |
| DOC-014 | The system shall support automatic notifications for document reviews, approvals, and expirations. | High |
| DOC-015 | The system shall support document comparison between versions. | Medium |

### 3.3 CAPA Management Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| CAPA-001 | The system shall support creation, investigation, implementation, and closure of CAPA records. | High |
| CAPA-002 | The system shall support categorization of CAPA records as corrective action, preventive action, or customer complaint. | High |
| CAPA-003 | The system shall support root cause analysis methodologies. | High |
| CAPA-004 | The system shall support action planning with assignees and due dates. | High |
| CAPA-005 | The system shall support effectiveness verification of implemented actions. | High |
| CAPA-006 | The system shall support CAPA workflow with configurable review and approval steps. | High |
| CAPA-007 | The system shall support CAPA risk assessment. | High |
| CAPA-008 | The system shall support CAPA metrics and trending. | High |
| CAPA-009 | The system shall support linking CAPA records to related quality records. | High |
| CAPA-010 | The system shall support automatic notifications for CAPA assignments, updates, and due dates. | High |
| CAPA-011 | The system shall support CAPA escalation for overdue actions. | High |
| CAPA-012 | The system shall support CAPA reporting for regulatory purposes. | High |
| CAPA-013 | The system shall support electronic signatures for CAPA approvals. | High |
| CAPA-014 | The system shall support attachment of supporting documentation to CAPA records. | High |
| CAPA-015 | The system shall support CAPA access control based on user roles and permissions. | High |

### 3.4 Training Records Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| TRN-001 | The system shall support creation and management of training courses. | High |
| TRN-002 | The system shall support different training types including procedures, competency, and regulatory. | High |
| TRN-003 | The system shall support assignment of training to individuals and groups. | High |
| TRN-004 | The system shall support training completion tracking and documentation. | High |
| TRN-005 | The system shall support training effectiveness assessment. | Medium |
| TRN-006 | The system shall support tracking of training due dates and expiration dates. | High |
| TRN-007 | The system shall support automatic notifications for training assignments and due dates. | High |
| TRN-008 | The system shall support training matrix showing training requirements by job role. | High |
| TRN-009 | The system shall support training history for each employee. | High |
| TRN-010 | The system shall support training reports including completion rates and compliance status. | High |
| TRN-011 | The system shall support automatic training assignments based on document changes. | Medium |
| TRN-012 | The system shall support electronic signatures for training completion. | High |
| TRN-013 | The system shall support attachment of training materials to training courses. | High |
| TRN-014 | The system shall support training access control based on user roles and permissions. | High |
| TRN-015 | The system shall support integration with learning management systems (LMS). | Low |

### 3.5 Design Control Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| DSN-001 | The system shall support creation and management of design projects. | High |
| DSN-002 | The system shall support design planning with phases, activities, and deliverables. | High |
| DSN-003 | The system shall support design inputs including user needs and regulatory requirements. | High |
| DSN-004 | The system shall support design outputs including specifications and drawings. | High |
| DSN-005 | The system shall support design reviews with documentation of findings and actions. | High |
| DSN-006 | The system shall support design verification and validation activities. | High |
| DSN-007 | The system shall support design changes with impact assessment and approval. | High |
| DSN-008 | The system shall support design transfer to production. | High |
| DSN-009 | The system shall support design history file (DHF) compilation. | High |
| DSN-010 | The system shall support traceability between user needs, design inputs, design outputs, and verification activities. | High |
| DSN-011 | The system shall support design risk management integration. | High |
| DSN-012 | The system shall support design review scheduling and documentation. | High |
| DSN-013 | The system shall support electronic signatures for design approvals. | High |
| DSN-014 | The system shall support attachment of supporting documentation to design records. | High |
| DSN-015 | The system shall support design access control based on user roles and permissions. | High |
| DSN-016 | The system shall support design project management including task tracking and resource allocation. | Medium |
| DSN-017 | The system shall support design collaboration with commenting and notification features. | Medium |
| DSN-018 | The system shall support design metrics and reporting. | Medium |
| DSN-019 | The system shall provide a matrix view showing relationships between design elements. | High |

### 3.6 Supplier Management Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| SUP-001 | The system shall support creation and management of supplier records. | High |
| SUP-002 | The system shall support supplier categorization by type, criticality, and risk level. | High |
| SUP-003 | The system shall support supplier qualification processes. | High |
| SUP-004 | The system shall support supplier performance monitoring with metrics and scorecards. | High |
| SUP-005 | The system shall support supplier audit planning, execution, and findings management. | High |
| SUP-006 | The system shall support supplier corrective action requests and tracking. | High |
| SUP-007 | The system shall support supplier agreements and quality requirements. | High |
| SUP-008 | The system shall support supplier change notifications and impact assessment. | High |
| SUP-009 | The system shall support critical supplier identification and monitoring. | High |
| SUP-010 | The system shall support supplier risk assessment. | High |
| SUP-011 | The system shall support supplier requalification scheduling. | Medium |
| SUP-012 | The system shall support automatic notifications for supplier qualification expirations and performance issues. | High |
| SUP-013 | The system shall support electronic signatures for supplier approvals. | High |
| SUP-014 | The system shall support attachment of supporting documentation to supplier records. | High |
| SUP-015 | The system shall support supplier access control based on user roles and permissions. | High |

### 3.7 Audit Management Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| AUD-001 | The system shall support creation and management of audit programs. | High |
| AUD-002 | The system shall support different audit types including internal, supplier, and regulatory. | High |
| AUD-003 | The system shall support audit planning with scope, criteria, and schedule. | High |
| AUD-004 | The system shall support audit checklists and protocols. | High |
| AUD-005 | The system shall support audit execution with findings documentation. | High |
| AUD-006 | The system shall support audit report generation. | High |
| AUD-007 | The system shall support audit finding classification and tracking. | High |
| AUD-008 | The system shall support corrective action requests and tracking for audit findings. | High |
| AUD-009 | The system shall support audit effectiveness assessment. | Medium |
| AUD-010 | The system shall support audit metrics and trending. | High |
| AUD-011 | The system shall support audit scheduling and resource allocation. | High |
| AUD-012 | The system shall support automatic notifications for audit assignments and due dates. | High |
| AUD-013 | The system shall support electronic signatures for audit approvals. | High |
| AUD-014 | The system shall support attachment of supporting documentation to audit records. | High |
| AUD-015 | The system shall support audit access control based on user roles and permissions. | High |

### 3.8 Management Review Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| MGR-001 | The system shall support creation and management of management review meetings. | High |
| MGR-002 | The system shall support management review planning with agenda and participants. | High |
| MGR-003 | The system shall support management review input preparation. | High |
| MGR-004 | The system shall support management review execution with discussion documentation. | High |
| MGR-005 | The system shall support management review output documentation including decisions and actions. | High |
| MGR-006 | The system shall support management review action tracking. | High |
| MGR-007 | The system shall support management review effectiveness assessment. | Medium |
| MGR-008 | The system shall support management review metrics and trending. | High |
| MGR-009 | The system shall support management review scheduling. | High |
| MGR-010 | The system shall support automatic notifications for management review assignments and due dates. | High |
| MGR-011 | The system shall support electronic signatures for management review approvals. | High |
| MGR-012 | The system shall support attachment of supporting documentation to management review records. | High |
| MGR-013 | The system shall support management review access control based on user roles and permissions. | High |
| MGR-014 | The system shall provide dashboard views of key metrics for management review. | Medium |

### 3.9 Risk Management Module

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| RSK-001 | The system shall support creation and management of risk assessments. | High |
| RSK-002 | The system shall support different risk assessment types including design FMEA, process FMEA, and use-related risk analysis. | High |
| RSK-003 | The system shall support risk identification with hazards, hazardous situations, and harms. | High |
| RSK-004 | The system shall support risk analysis with severity, probability, and detectability. | High |
| RSK-005 | The system shall support risk evaluation with risk priority number (RPN) calculation. | High |
| RSK-006 | The system shall support risk control measures and implementation tracking. | High |
| RSK-007 | The system shall support residual risk evaluation. | High |
| RSK-008 | The system shall support benefit-risk analysis. | High |
| RSK-009 | The system shall support risk review and approval. | High |
| RSK-010 | The system shall support risk monitoring and reporting. | High |
| RSK-011 | The system shall support automatic notifications for risk assignments and due dates. | High |
| RSK-012 | The system shall support electronic signatures for risk approvals. | High |
| RSK-013 | The system shall support attachment of supporting documentation to risk records. | High |
| RSK-014 | The system shall support risk access control based on user roles and permissions. | High |
| RSK-015 | The system shall support integration with design control and CAPA processes. | High |

### 3.10 System Health Analytics

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| SYS-001 | The system shall provide dashboards with key performance indicators (KPIs). | High |
| SYS-002 | The system shall provide compliance status monitoring by regulation or standard. | High |
| SYS-003 | The system shall provide process performance monitoring. | High |
| SYS-004 | The system shall provide trend analysis for quality metrics. | High |
| SYS-005 | The system shall provide predictive analytics for quality issues. | Medium |
| SYS-006 | The system shall provide customizable reports and charts. | High |
| SYS-007 | The system shall provide export capabilities for reports and data. | High |
| SYS-008 | The system shall provide notification and alerting for abnormal trends or values. | High |
| SYS-009 | The system shall provide access control for analytics based on user roles and permissions. | High |
| SYS-010 | The system shall provide integration with business intelligence tools. | Low |

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| PERF-001 | The system shall support at least 500 concurrent users without degradation in performance. | High |
| PERF-002 | The system shall respond to user interactions within 2 seconds under normal load. | High |
| PERF-003 | The system shall complete report generation within 10 seconds for standard reports. | High |
| PERF-004 | The system shall complete bulk data operations within 30 seconds for up to 1000 records. | Medium |
| PERF-005 | The system shall maintain performance levels with up to 1 million quality records. | High |

### 4.2 Security Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| SEC-001 | The system shall encrypt all data in transit using TLS 1.2 or higher. | High |
| SEC-002 | The system shall encrypt all sensitive data at rest. | High |
| SEC-003 | The system shall implement defense against common security threats including SQL injection, cross-site scripting (XSS), and cross-site request forgery (CSRF). | High |
| SEC-004 | The system shall implement secure coding practices according to OWASP guidelines. | High |
| SEC-005 | The system shall undergo regular security assessments including vulnerability scanning and penetration testing. | High |
| SEC-006 | The system shall maintain a comprehensive audit trail of all system activities. | High |
| SEC-007 | The system shall implement data loss prevention controls. | High |
| SEC-008 | The system shall support IP-based access restrictions. | Medium |
| SEC-009 | The system shall enforce session timeout after a configurable period of inactivity. | High |
| SEC-010 | The system shall support secure file uploads with virus scanning. | High |

### 4.3 Compliance Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| COMP-001 | The system shall comply with 21 CFR Part 11 for electronic records and signatures. | High |
| COMP-002 | The system shall comply with ISO 13485:2016 for quality management systems. | High |
| COMP-003 | The system shall comply with EU MDR 2017/745 for medical device quality systems. | High |
| COMP-004 | The system shall comply with GDPR and other applicable data protection regulations. | High |
| COMP-005 | The system shall comply with IEC 62304 for medical device software development. | High |
| COMP-006 | The system shall comply with IEC 62366-1 for usability engineering. | High |
| COMP-007 | The system shall maintain compliance documentation and evidence. | High |
| COMP-008 | The system shall support validation activities according to GAMP 5 guidelines. | High |

### 4.4 Reliability Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| REL-001 | The system shall be available 99.9% of the time, excluding scheduled maintenance. | High |
| REL-002 | The system shall implement fault tolerance to prevent data loss. | High |
| REL-003 | The system shall implement automated backup processes. | High |
| REL-004 | The system shall implement disaster recovery capabilities with a recovery time objective (RTO) of 4 hours. | High |
| REL-005 | The system shall implement monitoring and alerting for system health. | High |
| REL-006 | The system shall recover automatically from common failure conditions. | High |
| REL-007 | The system shall provide mechanisms to prevent and recover from data corruption. | High |

### 4.5 Usability Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| USA-001 | The system shall implement a consistent and intuitive user interface. | High |
| USA-002 | The system shall provide clear error messages and recovery options. | High |
| USA-003 | The system shall provide help text and tooltips for complex functions. | Medium |
| USA-004 | The system shall support keyboard shortcuts for common actions. | Low |
| USA-005 | The system shall support user interface customization. | Medium |
| USA-006 | The system shall minimize the number of steps required to complete common tasks. | High |
| USA-007 | The system shall provide progress indicators for long-running operations. | Medium |
| USA-008 | The system shall support undo/redo functionality where appropriate. | Low |
| USA-009 | The system shall implement responsive design for different screen sizes. | High |
| USA-010 | The system shall support dark mode and high contrast themes for accessibility. | Medium |

### 4.6 Maintainability Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| MAIN-001 | The system shall implement modular architecture to facilitate maintenance and upgrades. | High |
| MAIN-002 | The system shall support configuration without programming for common customizations. | High |
| MAIN-003 | The system shall provide administrative tools for system maintenance. | High |
| MAIN-004 | The system shall provide diagnostic tools for troubleshooting. | Medium |
| MAIN-005 | The system shall maintain comprehensive system documentation. | High |
| MAIN-006 | The system shall support seamless upgrades with minimal downtime. | High |
| MAIN-007 | The system shall support rollback of failed upgrades. | High |
| MAIN-008 | The system shall implement configuration management for system settings. | High |
| MAIN-009 | The system shall provide an API for integration with other systems. | Medium |
| MAIN-010 | The system shall support automated testing for system validation. | High |

## 5. System Interfaces

### 5.1 User Interfaces

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| UI-001 | The system shall provide a web-based user interface accessible through standard web browsers. | High |
| UI-002 | The system shall provide a responsive dashboard for system overview. | High |
| UI-003 | The system shall provide search functionality across all modules. | High |
| UI-004 | The system shall provide filtering and sorting capabilities for list views. | High |
| UI-005 | The system shall provide calendar views for scheduled activities. | Medium |
| UI-006 | The system shall provide form-based interfaces for data entry. | High |
| UI-007 | The system shall provide wizards for complex processes. | Medium |
| UI-008 | The system shall provide customizable report views. | High |
| UI-009 | The system shall provide graphical visualizations for analytics and metrics. | High |
| UI-010 | The system shall provide a mobile-friendly interface for key functions. | Medium |

### 5.2 Software Interfaces

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| SI-001 | The system shall provide REST APIs for integration with other systems. | High |
| SI-002 | The system shall support integration with email systems for notifications. | High |
| SI-003 | The system shall support integration with directory services (LDAP, Active Directory) for authentication. | Medium |
| SI-004 | The system shall support integration with document management systems. | Medium |
| SI-005 | The system shall support integration with learning management systems. | Low |
| SI-006 | The system shall support integration with enterprise resource planning (ERP) systems. | Medium |
| SI-007 | The system shall support integration with product lifecycle management (PLM) systems. | Medium |
| SI-008 | The system shall support integration with manufacturing execution systems (MES). | Medium |
| SI-009 | The system shall support integration with business intelligence tools. | Medium |
| SI-010 | The system shall support integration with regulatory submission systems. | Low |

### 5.3 Hardware Interfaces

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| HI-001 | The system shall support integration with barcode scanners for inventory management. | Low |
| HI-002 | The system shall support integration with label printers. | Low |
| HI-003 | The system shall support integration with electronic signature pads. | Low |
| HI-004 | The system shall support integration with RFID readers for asset tracking. | Low |
| HI-005 | The system shall support integration with laboratory instruments for data acquisition. | Low |

### 5.4 Communication Interfaces

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| CI-001 | The system shall support HTTPS for secure communication. | High |
| CI-002 | The system shall support SMTP for email notifications. | High |
| CI-003 | The system shall support LDAP for directory service integration. | Medium |
| CI-004 | The system shall support WebDAV for document management integration. | Low |
| CI-005 | The system shall support FTP/SFTP for file transfers. | Medium |

## 6. Verification and Validation Requirements

| Requirement ID | Description | Priority |
|----------------|-------------|----------|
| VV-001 | The system shall undergo validation according to GAMP 5 guidelines. | High |
| VV-002 | The system shall support installation qualification (IQ) procedures. | High |
| VV-003 | The system shall support operational qualification (OQ) procedures. | High |
| VV-004 | The system shall support performance qualification (PQ) procedures. | High |
| VV-005 | The system shall support validation documentation including validation plans, protocols, and reports. | High |
| VV-006 | The system shall support test environments for validation activities. | High |
| VV-007 | The system shall support automated testing for regression testing. | High |
| VV-008 | The system shall support user acceptance testing (UAT). | High |
| VV-009 | The system shall support validation of system upgrades. | High |
| VV-010 | The system shall maintain traceability between requirements and validation tests. | High |

## Appendices

### Appendix A: Revision History

| Version | Date | Description | Author |
|---------|------|-------------|--------|
| 1.0.0 | 2025-05-15 | Initial release | |

### Appendix B: Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Quality Manager | | | |
| Regulatory Affairs | | | |
| IT Manager | | | |
| Executive Sponsor | | | |