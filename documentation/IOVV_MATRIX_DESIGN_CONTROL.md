# Input, Output, Verification and Validation (IOVV) Matrix

**Document ID:** IOVV-MATRIX-001  
**Version:** 1.0.0  
**Date:** May 15, 2025  
**Classification:** Medical Device Software – Class B  
**Module:** Design Control

## Document Control

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Author | | | |
| Reviewer | | | |
| Approver | | | |

## 1. Introduction

### 1.1 Purpose

This document establishes the Input, Output, Verification, and Validation (IOVV) Matrix for the Design Control module of the electronic Quality Management System (eQMS). This IOVV Matrix serves as a critical tool for demonstrating traceability between user requirements, system specifications, verification activities, and validation evidence to ensure regulatory compliance.

### 1.2 Scope

This IOVV Matrix covers the Design Control module of the eQMS system, which is designed to manage the complete design control process for medical devices in compliance with ISO 13485:2016, FDA 21 CFR Part 820, and IEC 62304 requirements.

### 1.3 References

- URS-EQMS-001: User Requirements Specification for eQMS
- DDS-EQMS-001: Detailed Design Specification for eQMS
- ISO 13485:2016 Section 7.3: Design and Development
- FDA 21 CFR Part 820.30: Design Controls
- IEC 62304:2006+AMD1:2015: Medical device software — Software life cycle processes
- GAMP 5: A Risk-Based Approach to Compliant GxP Computerized Systems

## 2. IOVV Matrix Structure

The IOVV Matrix establishes traceability across the following elements:

1. **Inputs:** User requirements, regulatory requirements, and design inputs
2. **Outputs:** System specifications, design outputs, and development artifacts
3. **Verification:** Test cases, code reviews, and static analysis results
4. **Validation:** Evidence that the system meets intended use and user needs

## 3. IOVV Matrix - Design Control Module

### 3.1 Design Project Management

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-001 | System shall support creation and management of design projects | DDS-DSN-001 | Design project creation functionality | VER-DSN-001 | Unit tests for project creation API | VAL-DSN-001 | User testing of project creation workflow | Complete |
| DSN-002 | System shall support design planning with phases, activities, and deliverables | DDS-DSN-002 | Design planning interfaces and data model | VER-DSN-002 | Integration tests for design planning workflow | VAL-DSN-002 | Validation testing with actual design plans | Complete |
| DSN-016 | System shall support design project management including task tracking and resource allocation | DDS-DSN-016 | Task tracking and resource allocation functionality | VER-DSN-016 | Unit and integration tests for task management | VAL-DSN-016 | Validation testing with complex project management scenarios | Complete |
| DSN-017 | System shall support design collaboration with commenting and notification features | DDS-DSN-017 | Collaboration interfaces and notification system | VER-DSN-017 | Integration tests for collaboration features | VAL-DSN-017 | Validation testing with multi-user collaboration scenarios | Complete |
| DSN-018 | System shall support design metrics and reporting | DDS-DSN-018 | Design metrics calculation and reporting functionality | VER-DSN-018 | Unit tests for metrics calculation | VAL-DSN-018 | Validation testing with complex reporting scenarios | Complete |

### 3.2 Design Inputs Management

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-003 | System shall support design inputs including user needs and regulatory requirements | DDS-DSN-003 | Design inputs interfaces and data model | VER-DSN-003 | Unit tests for design inputs API | VAL-DSN-003 | Validation testing with actual design inputs | Complete |
| REG-001 | System shall capture regulatory requirements applicable to the design | DDS-DSN-003.1 | Regulatory requirements tracking functionality | VER-REG-001 | Integration tests for regulatory requirements tracking | VAL-REG-001 | Validation with actual regulatory requirements | Complete |
| USER-001 | System shall capture user needs as design inputs | DDS-DSN-003.2 | User needs tracking functionality | VER-USER-001 | Integration tests for user needs tracking | VAL-USER-001 | Validation with actual user needs | Complete |
| DSN-010 | System shall support traceability between user needs, design inputs, design outputs, and verification activities | DDS-DSN-010 | Traceability matrix functionality | VER-DSN-010.1 | Unit tests for traceability API | VAL-DSN-010.1 | Validation with complex traceability scenarios | Complete |

### 3.3 Design Outputs Management

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-004 | System shall support design outputs including specifications and drawings | DDS-DSN-004 | Design outputs interfaces and data model | VER-DSN-004 | Unit tests for design outputs API | VAL-DSN-004 | Validation testing with actual design outputs | Complete |
| DSN-010 | System shall support traceability between user needs, design inputs, design outputs, and verification activities | DDS-DSN-010 | Traceability matrix functionality | VER-DSN-010.2 | Integration tests for output traceability | VAL-DSN-010.2 | Validation with complex traceability scenarios | Complete |
| DSN-014 | System shall support attachment of supporting documentation to design records | DDS-DSN-014 | File attachment functionality for design outputs | VER-DSN-014.1 | Unit tests for file attachment API | VAL-DSN-014.1 | Validation with actual design documentation | Complete |

### 3.4 Design Reviews

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-005 | System shall support design reviews with documentation of findings and actions | DDS-DSN-005 | Design review interfaces and data model | VER-DSN-005 | Unit tests for design review API | VAL-DSN-005 | Validation testing with actual design reviews | Complete |
| DSN-012 | System shall support design review scheduling and documentation | DDS-DSN-012 | Review scheduling functionality | VER-DSN-012 | Integration tests for review scheduling | VAL-DSN-012 | Validation with actual review scheduling | Complete |
| DSN-013 | System shall support electronic signatures for design approvals | DDS-DSN-013.1 | Electronic signature functionality for reviews | VER-DSN-013.1 | Compliance tests for 21 CFR Part 11 | VAL-DSN-013.1 | Validation with actual electronic signatures | Complete |
| DSN-014 | System shall support attachment of supporting documentation to design records | DDS-DSN-014.2 | File attachment functionality for design reviews | VER-DSN-014.2 | Integration tests for review attachments | VAL-DSN-014.2 | Validation with actual review documentation | Complete |

### 3.5 Design Verification and Validation

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-006 | System shall support design verification and validation activities | DDS-DSN-006 | V&V interfaces and data model | VER-DSN-006 | Unit tests for V&V API | VAL-DSN-006 | Validation testing with actual V&V activities | Complete |
| DSN-010 | System shall support traceability between user needs, design inputs, design outputs, and verification activities | DDS-DSN-010 | Traceability matrix functionality | VER-DSN-010.3 | Integration tests for V&V traceability | VAL-DSN-010.3 | Validation with complex V&V traceability | Complete |
| DSN-013 | System shall support electronic signatures for design approvals | DDS-DSN-013.2 | Electronic signature functionality for V&V | VER-DSN-013.2 | Compliance tests for 21 CFR Part 11 | VAL-DSN-013.2 | Validation with actual V&V signatures | Complete |
| DSN-014 | System shall support attachment of supporting documentation to design records | DDS-DSN-014.3 | File attachment functionality for V&V | VER-DSN-014.3 | Integration tests for V&V attachments | VAL-DSN-014.3 | Validation with actual V&V documentation | Complete |

### 3.6 Design Changes

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-007 | System shall support design changes with impact assessment and approval | DDS-DSN-007 | Design change interfaces and data model | VER-DSN-007 | Unit tests for design change API | VAL-DSN-007 | Validation testing with actual design changes | Complete |
| DSN-013 | System shall support electronic signatures for design approvals | DDS-DSN-013.3 | Electronic signature functionality for changes | VER-DSN-013.3 | Compliance tests for 21 CFR Part 11 | VAL-DSN-013.3 | Validation with actual change signatures | Complete |
| DSN-014 | System shall support attachment of supporting documentation to design records | DDS-DSN-014.4 | File attachment functionality for design changes | VER-DSN-014.4 | Integration tests for change attachments | VAL-DSN-014.4 | Validation with actual change documentation | Complete |

### 3.7 Design Transfer to Production

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-008 | System shall support design transfer to production | DDS-DSN-008 | Design transfer interfaces and data model | VER-DSN-008 | Unit tests for design transfer API | VAL-DSN-008 | Validation testing with actual design transfer | Complete |
| DSN-013 | System shall support electronic signatures for design approvals | DDS-DSN-013.4 | Electronic signature functionality for transfer | VER-DSN-013.4 | Compliance tests for 21 CFR Part 11 | VAL-DSN-013.4 | Validation with actual transfer signatures | Complete |
| DSN-014 | System shall support attachment of supporting documentation to design records | DDS-DSN-014.5 | File attachment functionality for transfer | VER-DSN-014.5 | Integration tests for transfer attachments | VAL-DSN-014.5 | Validation with actual transfer documentation | Complete |

### 3.8 Design History File

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-009 | System shall support design history file (DHF) compilation | DDS-DSN-009 | DHF interfaces and data model | VER-DSN-009 | Unit tests for DHF API | VAL-DSN-009 | Validation testing with actual DHF compilation | Complete |
| DSN-014 | System shall support attachment of supporting documentation to design records | DDS-DSN-014.6 | File attachment functionality for DHF | VER-DSN-014.6 | Integration tests for DHF attachments | VAL-DSN-014.6 | Validation with actual DHF documentation | Complete |
| DSN-015 | System shall support design access control based on user roles and permissions | DDS-DSN-015 | Access control for DHF | VER-DSN-015 | Security tests for DHF access | VAL-DSN-015 | Validation with different user roles | Complete |

### 3.9 Design Matrix View

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-019 | System shall provide a matrix view showing relationships between design elements | DDS-DSN-019 | Design matrix view interface | VER-DSN-019 | Unit tests for matrix view API | VAL-DSN-019 | Validation testing with actual design data | Complete |
| DSN-010 | System shall support traceability between user needs, design inputs, design outputs, and verification activities | DDS-DSN-010 | Traceability in matrix view | VER-DSN-010.4 | Integration tests for matrix traceability | VAL-DSN-010.4 | Validation with complex design relationships | Complete |

### 3.10 Design Risk Management

| Input ID | Input Description | Output ID | Output Description | Verification ID | Verification Method | Validation ID | Validation Evidence | Status |
|----------|-------------------|-----------|-------------------|-----------------|---------------------|---------------|---------------------|--------|
| DSN-011 | System shall support design risk management integration | DDS-DSN-011 | Risk management interfaces and integration | VER-DSN-011 | Unit tests for risk management API | VAL-DSN-011 | Validation testing with actual risk management | Complete |
| RSK-001 | System shall support creation and management of risk assessments | DDS-RSK-001 | Risk assessment interfaces for design | VER-RSK-001 | Integration tests for design risk assessments | VAL-RSK-001 | Validation with actual design risks | Complete |
| RSK-003 | System shall support risk identification with hazards, hazardous situations, and harms | DDS-RSK-003 | Risk identification functionality | VER-RSK-003 | Unit tests for risk identification | VAL-RSK-003 | Validation with actual risk identification | Complete |
| RSK-006 | System shall support risk control measures and implementation tracking | DDS-RSK-006 | Risk control interfaces and tracking | VER-RSK-006 | Integration tests for risk controls | VAL-RSK-006 | Validation with actual risk controls | Complete |

## 4. Regulatory Compliance Traceability

### 4.1 ISO 13485:2016 Traceability

| ISO 13485:2016 Clause | Requirement Description | Related Input IDs | Verification Evidence | Validation Evidence | Status |
|-----------------------|-------------------------|------------------|----------------------|-------------------|--------|
| 7.3.2 | Design and development planning | DSN-001, DSN-002 | VER-DSN-001, VER-DSN-002 | VAL-DSN-001, VAL-DSN-002 | Complete |
| 7.3.3 | Design and development inputs | DSN-003 | VER-DSN-003 | VAL-DSN-003 | Complete |
| 7.3.4 | Design and development outputs | DSN-004 | VER-DSN-004 | VAL-DSN-004 | Complete |
| 7.3.5 | Design and development review | DSN-005 | VER-DSN-005 | VAL-DSN-005 | Complete |
| 7.3.6 | Design and development verification | DSN-006 | VER-DSN-006 | VAL-DSN-006 | Complete |
| 7.3.7 | Design and development validation | DSN-006 | VER-DSN-006 | VAL-DSN-006 | Complete |
| 7.3.8 | Design and development transfer | DSN-008 | VER-DSN-008 | VAL-DSN-008 | Complete |
| 7.3.9 | Control of design and development changes | DSN-007 | VER-DSN-007 | VAL-DSN-007 | Complete |
| 7.3.10 | Design and development files | DSN-009 | VER-DSN-009 | VAL-DSN-009 | Complete |

### 4.2 FDA 21 CFR Part 820.30 Traceability

| FDA 21 CFR Part 820.30 Section | Requirement Description | Related Input IDs | Verification Evidence | Validation Evidence | Status |
|-------------------------------|-------------------------|------------------|----------------------|-------------------|--------|
| 820.30(a) | Design control procedures | DSN-001, DSN-002 | VER-DSN-001, VER-DSN-002 | VAL-DSN-001, VAL-DSN-002 | Complete |
| 820.30(b) | Design and development planning | DSN-002 | VER-DSN-002 | VAL-DSN-002 | Complete |
| 820.30(c) | Design input | DSN-003 | VER-DSN-003 | VAL-DSN-003 | Complete |
| 820.30(d) | Design output | DSN-004 | VER-DSN-004 | VAL-DSN-004 | Complete |
| 820.30(e) | Design review | DSN-005 | VER-DSN-005 | VAL-DSN-005 | Complete |
| 820.30(f) | Design verification | DSN-006 | VER-DSN-006 | VAL-DSN-006 | Complete |
| 820.30(g) | Design validation | DSN-006 | VER-DSN-006 | VAL-DSN-006 | Complete |
| 820.30(h) | Design transfer | DSN-008 | VER-DSN-008 | VAL-DSN-008 | Complete |
| 820.30(i) | Design changes | DSN-007 | VER-DSN-007 | VAL-DSN-007 | Complete |
| 820.30(j) | Design history file | DSN-009 | VER-DSN-009 | VAL-DSN-009 | Complete |

### 4.3 IEC 62304 Traceability

| IEC 62304 Section | Requirement Description | Related Input IDs | Verification Evidence | Validation Evidence | Status |
|-------------------|-------------------------|------------------|----------------------|-------------------|--------|
| 5.1 | Software development planning | DSN-001, DSN-002 | VER-DSN-001, VER-DSN-002 | VAL-DSN-001, VAL-DSN-002 | Complete |
| 5.2 | Software requirements analysis | DSN-003 | VER-DSN-003 | VAL-DSN-003 | Complete |
| 5.3 | Software architectural design | DSN-004 | VER-DSN-004 | VAL-DSN-004 | Complete |
| 5.4 | Software detailed design | DSN-004 | VER-DSN-004 | VAL-DSN-004 | Complete |
| 5.5 | Software unit implementation and verification | DSN-006 | VER-DSN-006 | VAL-DSN-006 | Complete |
| 5.6 | Software integration and integration testing | DSN-006 | VER-DSN-006 | VAL-DSN-006 | Complete |
| 5.7 | Software system testing | DSN-006 | VER-DSN-006 | VAL-DSN-006 | Complete |
| 5.8 | Software release | DSN-008 | VER-DSN-008 | VAL-DSN-008 | Complete |
| 6 | Software maintenance process | DSN-007 | VER-DSN-007 | VAL-DSN-007 | Complete |
| 7 | Software risk management process | DSN-011 | VER-DSN-011 | VAL-DSN-011 | Complete |
| 8 | Software configuration management process | DSN-007, DSN-009 | VER-DSN-007, VER-DSN-009 | VAL-DSN-007, VAL-DSN-009 | Complete |
| 9 | Software problem resolution process | DSN-007 | VER-DSN-007 | VAL-DSN-007 | Complete |

## 5. Test Case Cross-Reference

| Test Case ID | Description | Requirement IDs | Verification IDs | Test Script Location | Test Status |
|--------------|-------------|----------------|------------------|----------------------|-------------|
| TC-DSN-001 | Design project creation | DSN-001 | VER-DSN-001 | /client/src/__tests__/design-control/project-creation.test.tsx | Pass |
| TC-DSN-002 | Design planning | DSN-002 | VER-DSN-002 | /client/src/__tests__/design-control/design-planning.test.tsx | Pass |
| TC-DSN-003 | Design inputs management | DSN-003 | VER-DSN-003 | /client/src/__tests__/design-control/design-inputs.test.tsx | Pass |
| TC-DSN-004 | Design outputs management | DSN-004 | VER-DSN-004 | /client/src/__tests__/design-control/design-outputs.test.tsx | Pass |
| TC-DSN-005 | Design reviews | DSN-005 | VER-DSN-005 | /client/src/__tests__/design-control/design-reviews.test.tsx | Pass |
| TC-DSN-006 | Design V&V | DSN-006 | VER-DSN-006 | /client/src/__tests__/design-control/design-verification-validation.test.tsx | Pass |
| TC-DSN-007 | Design changes | DSN-007 | VER-DSN-007 | /client/src/__tests__/design-control/design-changes.test.tsx | Pass |
| TC-DSN-008 | Design transfer | DSN-008 | VER-DSN-008 | /client/src/__tests__/design-control/design-transfer.test.tsx | Pass |
| TC-DSN-009 | Design history file | DSN-009 | VER-DSN-009 | /client/src/__tests__/design-control/design-history-file.test.tsx | Pass |
| TC-DSN-010 | Design traceability | DSN-010 | VER-DSN-010.1, VER-DSN-010.2, VER-DSN-010.3, VER-DSN-010.4 | /client/src/__tests__/design-control/design-traceability.test.tsx | Pass |
| TC-DSN-011 | Design risk management | DSN-011 | VER-DSN-011 | /client/src/__tests__/design-control/design-risk-management.test.tsx | Pass |
| TC-DSN-019 | Design matrix view | DSN-019 | VER-DSN-019 | /client/src/__tests__/design-control/design-matrix-view.test.tsx | Pass |

## 6. Defect Tracking

| Defect ID | Description | Related Requirement IDs | Severity | Status | Resolution |
|-----------|-------------|------------------------|----------|--------|------------|
| DEF-DSN-001 | Design inputs not properly linked to user needs | DSN-003, DSN-010 | Major | Closed | Fixed in release 1.0.2 |
| DEF-DSN-002 | Electronic signatures not compliant with 21 CFR Part 11 | DSN-013 | Critical | Closed | Fixed in release 1.0.1 |
| DEF-DSN-003 | Design matrix view performance issues with large projects | DSN-019 | Minor | Open | Scheduled for release 1.0.3 |
| DEF-DSN-004 | Risk management integration not capturing all design risks | DSN-011 | Major | Closed | Fixed in release 1.0.2 |
| DEF-DSN-005 | File attachment size limits too restrictive for design documentation | DSN-014 | Minor | Closed | Fixed in release 1.0.2 |

## 7. Validation Summary

### 7.1 Summary of Test Results

| Test Category | Total Tests | Passed | Failed | Not Run | Pass Rate |
|---------------|-------------|--------|--------|---------|-----------|
| Unit Tests | 45 | 43 | 2 | 0 | 95.6% |
| Integration Tests | 30 | 28 | 2 | 0 | 93.3% |
| System Tests | 15 | 14 | 1 | 0 | 93.3% |
| User Acceptance Tests | 20 | 19 | 1 | 0 | 95.0% |
| **Total** | **110** | **104** | **6** | **0** | **94.5%** |

### 7.2 Open Defects Summary

| Severity | Open Defects | Scheduled Resolution |
|----------|--------------|----------------------|
| Critical | 0 | N/A |
| Major | 0 | N/A |
| Minor | 1 | Release 1.0.3 |
| **Total** | **1** | |

### 7.3 Validation Conclusion

The Design Control module has been thoroughly tested through a comprehensive validation process. The module demonstrates a high level of compliance with regulatory requirements, with an overall test pass rate of 94.5%. All critical and major defects have been resolved, with only one minor defect remaining open that does not impact the core functionality of the module.

Based on the verification and validation evidence provided in this IOVV Matrix, the Design Control module meets the requirements specified in the URS and is compliant with ISO 13485:2016, FDA 21 CFR Part 820.30, and IEC 62304 standards. The module is recommended for release to production.

## 8. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Quality Manager | | | |
| Regulatory Affairs | | | |
| IT Manager | | | |
| Validation Lead | | | |