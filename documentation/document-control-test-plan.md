# Document Control Module Test Plan

## Test ID: DCT-001 - Pending Documents Page
**Objective**: Verify that the "Pending Approval" page works correctly

### Test Steps:
1. Log in to the system with valid credentials
2. Navigate to Document Control module
3. Click on "Pending Approval" tab/link
4. Observe the page that loads

### Expected Results:
- Page loads without errors (no 404)
- The page displays a list of documents with "Pending Approval" status
- If no pending documents exist, a proper "No pending documents" message is displayed
- The correct document metadata (ID, title, type, department) appears for each document
- Action buttons (View, Review) are displayed and functional

### Test Data:
- At least one document should be in "Pending Approval" status (statusId = 2)

---

## Test ID: DCT-002 - Document Approval Process
**Objective**: Verify that the document approval process functions properly

### Test Steps:
1. Log in as a user with approval permissions
2. Navigate to Document Control > Pending Approval
3. Select a document and click "Review"
4. View document details
5. Click "Approve" button
6. Complete the electronic signature form:
   - Enter comments/reason for approval
   - Check "I understand this is the legal equivalent of my handwritten signature"
   - Click "Sign and Approve"

### Expected Results:
- Electronic signature form appears correctly
- After approval, a success message is displayed
- Document status changes from "Pending Approval" to "Approved"
- Document no longer appears in the Pending Approval list
- A record of the approval action is created in the database
- The document appears in the main Document Control page with "Approved" status

### Test Data:
- User with approval permissions (QA role or admin)
- Document in "Pending Approval" status (statusId = 2)

---

## Test ID: DCT-003 - Approved Documents Display
**Objective**: Verify that approved documents appear in the main Document Control view

### Test Steps:
1. Log in to the system
2. Navigate to Document Control module
3. Verify that the All Documents view includes documents with "Approved" status
4. Filter by "Approved" status if applicable
5. Select an approved document and view its details

### Expected Results:
- Approved documents display in the main list with "Approved" status indicator
- Document details show the correct approval information
- Approval history/audit trail is accessible and displays correct information
- Document metadata (ID, title, department, etc.) is displayed correctly

### Test Data:
- At least one document with "Approved" status (statusId = 3)

---

## Test ID: DCT-004 - Document Creation Form
**Objective**: Verify department options and security level settings in document creation form

### Test Steps:
1. Log in to the system
2. Navigate to Document Control module
3. Click "Create Document" button
4. Examine the "Owner Department" dropdown options
5. Examine the "Security Level" field

### Expected Results:
- The "Owner Department" dropdown does NOT contain "Information Technology" or "Research & Development" departments
- Security Level is set to a fixed standard value and is not selectable
- Document creation completes successfully when the form is filled out and submitted

### Test Data:
- User with document creation permissions

---

## Traceability Matrix

| Requirement ID | Test Case ID | Description |
|---------------|-------------|-------------|
| DOC001 | DCT-003 | Documents appear in document list after creation |
| DOC002 | DCT-001 | Pending Approval page exists and functions correctly |
| DOC003 | DCT-002 | Document approval process works correctly |
| DOC004 | DCT-004 | Department options and security level modified as required |
| DOC005 | DCT-003 | Approved documents appear in document control view |