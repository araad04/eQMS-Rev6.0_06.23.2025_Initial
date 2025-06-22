# User Requirements Specification (URS)
## Medical Device eQMS (Electronic Quality Management System)

**Document Number:** URS-MD-eQMS-001  
**Version:** 1.0  
**Date:** May 15, 2025  

## 1. Introduction

### 1.1 Purpose
This User Requirements Specification (URS) defines the requirements for an electronic Quality Management System (eQMS) designed specifically for medical device manufacturers. The system will streamline regulatory compliance through intelligent design and user-centered technology.

### 1.2 Scope
The eQMS will provide a comprehensive platform for managing quality processes across the entire product lifecycle, including document control, CAPA management, audit tracking, training, risk assessment, supplier management, design control, production management, maintenance, measurement, analysis, and management review.

### 1.3 Intended Audience
- Quality Assurance/Regulatory Affairs Teams
- Medical Device Manufacturers
- Auditors and Inspectors
- Design and Development Teams
- Production Personnel
- Management and Executive Teams

### 1.4 Glossary
- **CAPA**: Corrective Action and Preventive Action
- **DHF**: Design History File
- **DMR**: Device Master Record
- **eQMS**: Electronic Quality Management System
- **FDA**: Food and Drug Administration
- **FMEA**: Failure Mode and Effects Analysis
- **IQ/OQ/PQ**: Installation Qualification/Operational Qualification/Performance Qualification
- **ISO**: International Organization for Standardization
- **MDR**: Medical Device Regulation
- **QMS**: Quality Management System
- **RBAC**: Role-Based Access Control
- **SCR**: Supplier Corrective Request
- **SOP**: Standard Operating Procedure
- **UDI**: Unique Device Identifier

## 2. General Requirements

### 2.1 System Overview
The eQMS shall be a cloud-native web application providing a centralized platform for managing all quality-related processes and documentation for medical device manufacturers.

### 2.2 Regulatory Compliance
The system shall support compliance with:
- ISO 13485:2016 Medical Devices – Quality Management Systems
- FDA 21 CFR Part 820 Quality System Regulation
- FDA 21 CFR Part 11 Electronic Records and Signatures
- EU MDR 2017/745 Medical Device Regulation
- GDPR Data Protection Requirements
- IEC 62366 Usability Engineering for Medical Devices

### 2.3 Accessibility and Compatibility
The system shall:
- Support major web browsers (Chrome, Firefox, Safari, Edge)
- Be responsive for desktop, tablet, and mobile devices
- Comply with WCAG 2.1 AA accessibility standards
- Support internationalization and localization features

### 2.4 Performance Requirements
The system shall:
- Support up to 200 concurrent users without performance degradation
- Provide response times of less than 2 seconds for standard operations
- Maintain 99.9% uptime excluding scheduled maintenance
- Support a database of at least 1 million records per main table
- Handle document storage of up to 500GB

### 2.5 Security Requirements
The system shall implement:
- Role-based access control (RBAC) with granular permissions
- Secure authentication with multi-factor authentication option
- Data encryption at rest and in transit
- Comprehensive audit trails for all data changes
- Secure password policies and account management
- Protection against common web vulnerabilities (OWASP Top 10)

## 3. Functional Requirements

### 3.1 Core System Functionality

#### 3.1.1 User Management and Authentication
The system shall:
- Support user registration and profile management
- Implement role-based access control
- Provide password reset functionality
- Support single sign-on (SSO) integration
- Track user activity and session management
- Configure application permissions by role

#### 3.1.2 Dashboard and Reporting
The system shall:
- Provide a customizable dashboard with key metrics
- Generate standard and custom reports
- Export data in multiple formats (PDF, Excel, CSV)
- Schedule automated report generation and distribution
- Display trend analysis and statistics
- Support KPI tracking and visualization

#### 3.1.3 Notification System
The system shall:
- Send email notifications for critical events
- Provide in-application notification center
- Allow configuration of notification preferences
- Send reminders for approaching deadlines
- Alert users to items requiring their attention
- Support scheduled and ad-hoc notifications

### 3.2 Document Control Module

#### 3.2.1 Document Management
The system shall:
- Support creation, revision, and archiving of documents
- Maintain document version control
- Implement document approval workflows
- Store documents in a secure repository
- Enable document categorization and tagging
- Support document templates for standardization

#### 3.2.2 Document Lifecycle
The system shall track document status including:
- Draft
- In Review
- Approved
- Effective
- Superseded
- Obsolete

#### 3.2.3 Document Search and Retrieval
The system shall:
- Provide full-text search capabilities
- Support metadata filtering
- Enable saved searches
- Track document access history
- Allow document linking and references
- Support document check-out/check-in

### 3.3 CAPA Management Module

#### 3.3.1 CAPA Initiation and Classification
The system shall:
- Support creation of new CAPAs with unique identifiers
- Classify CAPAs as corrective actions, preventive actions, or customer complaints
- Allow linking to other quality system records
- Capture source information and descriptions
- Assess and assign risk classifications
- Assign ownership and due dates

#### 3.3.2 Root Cause Analysis
The system shall:
- Document root cause analysis methods
- Support multiple root causes per CAPA
- Track root cause investigation progress
- Link evidence to root causes
- Provide templates for common analysis methods
- Allow mapping of corrective actions to specific root causes

#### 3.3.3 Action Implementation and Verification
The system shall:
- Track action plan development
- Assign responsibilities for action items
- Monitor implementation progress
- Document verification activities
- Track completion dates and status
- Support electronic signature for verification

#### 3.3.4 Effectiveness Review and Closure
The system shall:
- Schedule effectiveness reviews
- Document effectiveness assessment
- Track CAPA closure criteria
- Require management approval for closure
- Generate CAPA summary reports
- Maintain complete CAPA history

### 3.4 Audit Management Module

#### 3.4.1 Audit Planning and Scheduling
The system shall:
- Create and maintain audit schedules
- Define audit scope and objectives
- Assign audit team members and responsibilities
- Track audit preparation activities
- Manage audit resources and logistics
- Support both internal and supplier audits

#### 3.4.2 Audit Checklist Creation
The system shall:
- Create comprehensive audit checklists
- Link checklist items to regulatory requirements
- Support multiple response types (Yes/No, text, file upload)
- Provide guidance notes for auditors
- Allow batch creation of checklist items
- Save checklist templates for reuse

#### 3.4.3 Audit Execution
The system shall:
- Record audit findings and observations
- Capture evidence (documents, photos)
- Document nonconformities
- Track audit progress against checklist
- Support real-time data entry during audits
- Allow multiple auditors to collaborate

#### 3.4.4 Supplier Corrective Requests (SCR)
The system shall:
- Issue SCRs to suppliers based on audit findings
- Track SCR response status and due dates
- Evaluate supplier responses
- Link SCRs to supplier records
- Escalate overdue SCRs
- Generate SCR summary reports

#### 3.4.5 Audit Reporting
The system shall:
- Generate comprehensive audit reports
- Support customizable report templates
- Include findings, nonconformities, and observations
- Track audit report distribution
- Maintain audit history
- Link audit findings to CAPAs

### 3.5 Training Records Module

#### 3.5.1 Training Requirements Management
The system shall:
- Define training requirements by role, department, or individual
- Set training frequency and recertification periods
- Specify training content and objectives
- Link training to documents and procedures
- Set competency assessment criteria
- Track regulatory training requirements

#### 3.5.2 Training Assignment and Notification
The system shall:
- Assign training to individuals or groups
- Automatically identify training needs based on roles
- Notify users of assigned training
- Send reminders for upcoming training deadlines
- Escalate overdue training notifications
- Track training completion status

#### 3.5.3 Training Record Management
The system shall:
- Maintain comprehensive training records
- Document training completion dates
- Store assessment results and scores
- Track training effectiveness
- Support electronic signatures for training completion
- Generate training completion certificates

#### 3.5.4 Training Effectiveness and Reporting
The system shall:
- Assess training effectiveness
- Track competency levels
- Generate training status reports
- Identify training gaps
- Calculate training compliance metrics
- Support regulatory inspection of training records

### 3.6 Risk Assessment Module

#### 3.6.1 Risk Management Planning
The system shall:
- Create risk management plans
- Define risk assessment scope
- Establish risk acceptance criteria
- Assign responsibilities for risk activities
- Link to relevant standards and regulations
- Track risk management lifecycle

#### 3.6.2 Risk Analysis
The system shall:
- Support both Design FMEA and Process FMEA
- Identify potential failure modes and hazards
- Assess severity, occurrence, and detection
- Calculate Risk Priority Numbers (RPNs)
- Evaluate risk acceptability
- Track residual risk levels

#### 3.6.3 Risk Control and Mitigation
The system shall:
- Document risk control measures
- Assign responsibility for implementation
- Track implementation status
- Reassess risk after controls
- Verify effectiveness of controls
- Link risk controls to design or process changes

#### 3.6.4 Risk Review and Reporting
The system shall:
- Schedule periodic risk reviews
- Generate risk assessment reports
- Support risk management file compilation
- Track changes to risk assessments
- Provide risk trend analysis
- Support benefit-risk analysis

### 3.7 Supplier Management Module

#### 3.7.1 Supplier Information Management
The system shall:
- Maintain supplier profiles and contact information
- Categorize suppliers by product/service type
- Track supplier qualifications and certifications
- Document supplier activities and capabilities
- Store supplier agreements and contracts
- Flag critical suppliers for enhanced monitoring

#### 3.7.2 Supplier Qualification and Assessment
The system shall:
- Define supplier qualification criteria
- Track qualification status
- Schedule supplier assessments and audits
- Record assessment results
- Generate supplier scorecards
- Track supplier quality metrics

#### 3.7.3 Supplier Performance Monitoring
The system shall:
- Track supplier performance metrics
- Record nonconformities and issues
- Monitor supplier corrective actions
- Schedule supplier reviews
- Compare performance against targets
- Generate supplier performance reports

#### 3.7.4 Critical Supplier Management
The system shall:
- Identify and track critical suppliers
- Apply enhanced monitoring for critical suppliers
- Schedule more frequent assessments
- Track risk mitigation strategies
- Monitor supply chain vulnerabilities
- Support contingency planning

### 3.8 Design Control Module

#### 3.8.1 Design Projects Management
The system shall:
- Create and track design projects
- Define project phases and milestones
- Assign project team members and responsibilities
- Track project status and progress
- Integrate with risk management
- Support software component tracking

#### 3.8.2 Design Inputs Management
The system shall:
- Capture user needs and design inputs
- Link inputs to regulatory requirements
- Define acceptance criteria
- Track approval status
- Maintain revision history
- Support design input review

#### 3.8.3 Design Outputs Management
The system shall:
- Document design outputs
- Link outputs to corresponding inputs
- Track verification status
- Maintain revision history
- Support design output review
- Generate design output reports

#### 3.8.4 Design Verification and Validation
The system shall:
- Plan verification and validation activities
- Track V&V execution and results
- Document test protocols and reports
- Link V&V to risk controls
- Track design changes during V&V
- Support design transfer activities

#### 3.8.5 Design Changes and Reviews
The system shall:
- Track design changes
- Implement design change control process
- Schedule and document design reviews
- Track review findings and actions
- Support electronic signatures for approvals
- Maintain design history file

#### 3.8.6 Design Traceability Matrix
The system shall:
- Generate a traceability matrix linking:
  - User needs
  - Design inputs
  - Design outputs
  - Verification/validation activities
  - Risk controls
- Identify gaps in traceability
- Support regulatory submissions
- Update automatically with changes

### 3.9 Production Module

#### 3.9.1 Product Definition and Specifications
The system shall:
- Maintain product specifications
- Link to design outputs
- Track product configurations and variants
- Manage bill of materials
- Store production requirements
- Support device master record (DMR) compilation

#### 3.9.2 Production Process Management
The system shall:
- Document production processes
- Create and manage work instructions
- Track process validations
- Monitor process parameters
- Support process change control
- Link production to design control

#### 3.9.3 Batch/Lot Record Management
The system shall:
- Create and track batch/lot records
- Document production activities
- Record material usage and traceability
- Capture in-process quality checks
- Support electronic batch record review
- Generate batch release documentation

#### 3.9.4 Nonconforming Product Management
The system shall:
- Record nonconforming products
- Document nonconformity details
- Determine and track disposition (use-as-is, rework, scrap)
- Require justification for disposition decisions
- Link to CAPA for systemic issues
- Generate nonconforming product reports

#### 3.9.5 Equipment Maintenance and Calibration
The system shall:
- Track equipment inventory
- Schedule preventive maintenance activities
- Record calibration requirements and results
- Monitor equipment status
- Generate maintenance/calibration certificates
- Provide equipment history reports

### 3.10 Measurement & Analysis Module

#### 3.10.1 Customer Feedback Management
The system shall:
- Capture and categorize customer feedback
- Analyze feedback for trends
- Track response actions
- Measure customer satisfaction
- Integrate with complaint handling
- Generate customer feedback reports

#### 3.10.2 Complaint Handling
The system shall:
- Record customer complaints
- Assess complaint severity and risk
- Evaluate regulatory reportability
- Track investigation and response
- Link complaints to CAPAs
- Generate complaint trend reports

#### 3.10.3 Quality Metrics and KPIs
The system shall:
- Define and track quality objectives
- Calculate key performance indicators
- Display metric trends over time
- Compare performance against targets
- Support root cause analysis for missed targets
- Generate quality performance reports

#### 3.10.4 Data Analysis and Trending
The system shall:
- Collect and analyze quality data
- Identify trends and patterns
- Provide statistical analysis tools
- Generate control charts
- Support predictive analytics
- Create custom analysis dashboards

### 3.11 Management Review Module

#### 3.11.1 Management Review Planning
The system shall:
- Schedule management reviews
- Define review agenda and participants
- Assign input preparation responsibilities
- Track preparation status
- Send reminders and notifications
- Maintain review schedule history

#### 3.11.2 Management Review Inputs
The system shall capture and prepare review inputs including:
- Status of actions from previous reviews
- Changes affecting the QMS
- Quality objectives and monitoring
- Process performance and product conformity
- Customer feedback and complaints
- Audit results and nonconformities
- CAPA status and effectiveness
- Risk management activities
- Supplier performance
- Resource adequacy
- New or revised regulatory requirements

#### 3.11.3 Management Review Execution
The system shall:
- Record meeting attendance
- Document discussion of inputs
- Capture decisions and conclusions
- Record improvement opportunities
- Track action items and assignments
- Generate meeting minutes

#### 3.11.4 Management Review Follow-up
The system shall:
- Track action item progress
- Send action item reminders
- Verify action completion
- Link completed actions to quality improvements
- Include action status in subsequent reviews
- Measure effectiveness of review process

## 4. Non-functional Requirements

### 4.1 Usability Requirements
The system shall:
- Provide an intuitive, user-friendly interface
- Implement consistent navigation and design patterns
- Support helpful error messages and guidance
- Include comprehensive help documentation
- Minimize clicks for common operations
- Support keyboard navigation and shortcuts

### 4.2 Data Integrity Requirements
The system shall:
- Prevent data loss through regular backups
- Validate data inputs to ensure accuracy
- Support data import/export functionality
- Maintain data relationships and referential integrity
- Implement data archiving and retention policies
- Prevent unauthorized data modification

### 4.3 Audit Trail Requirements
The system shall track:
- All data creation, modification, and deletion
- User actions and system events
- Date and time of changes
- Before and after values for changes
- Reason for change when appropriate
- Change approval where required

### 4.4 Electronic Signature Requirements
The system shall:
- Comply with 21 CFR Part 11 requirements
- Capture signature meaning (reviewed, approved, etc.)
- Record date, time, and user identity
- Require password re-entry for critical signatures
- Prevent signature forgery or repudiation
- Generate signature manifestation in records

### 4.5 Integration Requirements
The system shall provide:
- REST API for external system integration
- Data import/export capabilities
- Document exchange with external systems
- Single Sign-On (SSO) integration
- Email system integration
- ERP/MRP system integration capabilities

### 4.6 Validation and Compliance Requirements
The system shall:
- Support computer system validation
- Provide validation documentation
- Support IQ/OQ/PQ validation approach
- Maintain validation state through controlled changes
- Track compliance with applicable regulations
- Generate compliance reports for audits

## 5. System Constraints and Assumptions

### 5.1 Technical Constraints
- Must be accessible via standard web browsers
- Must support cloud-based deployment
- Must be scalable to accommodate business growth
- Must operate within reasonable network bandwidth limitations
- Must support standard integration technologies

### 5.2 Business Constraints
- Must align with established quality management processes
- Must support transition from existing paper-based systems
- Must minimize disruption to ongoing operations
- Must provide demonstrable return on investment
- Must support organizational security policies

### 5.3 Assumptions
- Users will have basic computer literacy
- Organization will provide necessary training resources
- Appropriate IT infrastructure will be available
- Subject matter experts will be available during implementation
- Regular system maintenance will be performed

## 6. Acceptance Criteria

The system will be considered accepted when:
1. All high-priority requirements have been implemented and verified
2. The system passes user acceptance testing
3. The system supports compliance with applicable regulations
4. System performance meets or exceeds specified requirements
5. Data migration from legacy systems is complete and accurate
6. Users have been trained and can effectively use the system
7. System documentation is complete and accurate

## 7. Appendices

### 7.1 Related Standards and Regulations
- ISO 13485:2016 Medical Devices — Quality Management Systems
- FDA 21 CFR Part 820 Quality System Regulation
- FDA 21 CFR Part 11 Electronic Records and Signatures
- EU MDR 2017/745 Medical Device Regulation
- GDPR General Data Protection Regulation
- IEC 62366 Usability Engineering for Medical Devices
- ISO 14971 Risk Management for Medical Devices

### 7.2 Glossary of Terms
[Comprehensive glossary of terms and abbreviations]

### 7.3 Reference Documents
[List of reference documents, including standards, regulations, and internal procedures]

## Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Quality Manager | | | |
| IT Director | | | |
| Regulatory Affairs | | | |
| Operations Manager | | | |
| Authorized Representative | | | |

---

**Document End**