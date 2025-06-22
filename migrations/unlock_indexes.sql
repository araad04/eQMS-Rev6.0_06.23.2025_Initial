
-- Comprehensive Database Index Optimization for eQMS System
-- This script creates all necessary indexes for optimal query performance

-- User Management Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users (department);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- Document Control Indexes
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents (title);
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON documents (document_number);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents (type);
CREATE INDEX IF NOT EXISTS idx_documents_effective_date ON documents (effective_date);
CREATE INDEX IF NOT EXISTS idx_documents_expiration_date ON documents (expiration_date);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents (created_by);
CREATE INDEX IF NOT EXISTS idx_documents_approved_by ON documents (approved_by);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents (department);
CREATE INDEX IF NOT EXISTS idx_documents_version ON documents (version);
CREATE INDEX IF NOT EXISTS idx_documents_is_controlled ON documents (is_controlled);
CREATE INDEX IF NOT EXISTS idx_documents_is_obsolete ON documents (is_obsolete);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents (created_at);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents (updated_at);

-- Document Versions Indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions (document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON document_versions (version);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions (created_at);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON document_versions (created_by);

-- Document Approvals Indexes
CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON document_approvals (document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_user_id ON document_approvals (user_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON document_approvals (status);
CREATE INDEX IF NOT EXISTS idx_document_approvals_signature_date ON document_approvals (signature_date);

-- CAPA Management Indexes
CREATE INDEX IF NOT EXISTS idx_capas_capa_id ON capas (capa_id);
CREATE INDEX IF NOT EXISTS idx_capas_title ON capas (title);
CREATE INDEX IF NOT EXISTS idx_capas_status_id ON capas (status_id);
CREATE INDEX IF NOT EXISTS idx_capas_type_id ON capas (type_id);
CREATE INDEX IF NOT EXISTS idx_capas_due_date ON capas (due_date);
CREATE INDEX IF NOT EXISTS idx_capas_closed_date ON capas (closed_date);
CREATE INDEX IF NOT EXISTS idx_capas_initiated_by ON capas (initiated_by);
CREATE INDEX IF NOT EXISTS idx_capas_assigned_to ON capas (assigned_to);
CREATE INDEX IF NOT EXISTS idx_capas_source ON capas (source);
CREATE INDEX IF NOT EXISTS idx_capas_risk_priority ON capas (risk_priority);
CREATE INDEX IF NOT EXISTS idx_capas_created_at ON capas (created_at);
CREATE INDEX IF NOT EXISTS idx_capas_updated_at ON capas (updated_at);

-- CAPA Actions Indexes
CREATE INDEX IF NOT EXISTS idx_capa_actions_capa_id ON capa_actions (capa_id);
CREATE INDEX IF NOT EXISTS idx_capa_actions_assigned_to ON capa_actions (assigned_to);
CREATE INDEX IF NOT EXISTS idx_capa_actions_status ON capa_actions (status);
CREATE INDEX IF NOT EXISTS idx_capa_actions_due_date ON capa_actions (due_date);
CREATE INDEX IF NOT EXISTS idx_capa_actions_created_by ON capa_actions (created_by);

-- CAPA Workflows Indexes
CREATE INDEX IF NOT EXISTS idx_capa_workflows_capa_id ON capa_workflows (capa_id);
CREATE INDEX IF NOT EXISTS idx_capa_workflows_current_state ON capa_workflows (current_state);
CREATE INDEX IF NOT EXISTS idx_capa_workflows_assigned_to ON capa_workflows (assigned_to);
CREATE INDEX IF NOT EXISTS idx_capa_workflows_due_date ON capa_workflows (due_date);
CREATE INDEX IF NOT EXISTS idx_capa_workflows_transition_date ON capa_workflows (transition_date);

-- CAPA Workflow History Indexes
CREATE INDEX IF NOT EXISTS idx_capa_workflow_history_workflow_id ON capa_workflow_history (workflow_id);
CREATE INDEX IF NOT EXISTS idx_capa_workflow_history_transition_date ON capa_workflow_history (transition_date);
CREATE INDEX IF NOT EXISTS idx_capa_workflow_history_transitioned_by ON capa_workflow_history (transitioned_by);

-- Audit Management Indexes
CREATE INDEX IF NOT EXISTS idx_audits_audit_id ON audits (audit_id);
CREATE INDEX IF NOT EXISTS idx_audits_title ON audits (title);
CREATE INDEX IF NOT EXISTS idx_audits_status_id ON audits (status_id);
CREATE INDEX IF NOT EXISTS idx_audits_type_id ON audits (type_id);
CREATE INDEX IF NOT EXISTS idx_audits_scheduled_date ON audits (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_audits_start_date ON audits (start_date);
CREATE INDEX IF NOT EXISTS idx_audits_end_date ON audits (end_date);
CREATE INDEX IF NOT EXISTS idx_audits_department_id ON audits (department_id);
CREATE INDEX IF NOT EXISTS idx_audits_supplier_id ON audits (supplier_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_by ON audits (created_by);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits (created_at);

-- Audit Checklist Items Indexes
CREATE INDEX IF NOT EXISTS idx_audit_checklist_items_audit_id ON audit_checklist_items (audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_checklist_items_category ON audit_checklist_items (category);
CREATE INDEX IF NOT EXISTS idx_audit_checklist_items_status ON audit_checklist_items (status);
CREATE INDEX IF NOT EXISTS idx_audit_checklist_items_created_at ON audit_checklist_items (created_at);

-- Supplier Management Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_id ON suppliers (supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status_id ON suppliers (status_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_category_id ON suppliers (category_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_criticality ON suppliers (criticality);
CREATE INDEX IF NOT EXISTS idx_suppliers_initial_risk_level ON suppliers (initial_risk_level);
CREATE INDEX IF NOT EXISTS idx_suppliers_current_risk_level ON suppliers (current_risk_level);
CREATE INDEX IF NOT EXISTS idx_suppliers_qualification_date ON suppliers (qualification_date);
CREATE INDEX IF NOT EXISTS idx_suppliers_requalification_date ON suppliers (requalification_date);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON suppliers (created_by);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers (created_at);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_archived ON suppliers (is_archived);

-- Supplier Assessments Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_supplier_id ON supplier_assessments (supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_assessment_type ON supplier_assessments (assessment_type);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_status ON supplier_assessments (status);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_scheduled_date ON supplier_assessments (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_conducted_date ON supplier_assessments (conducted_date);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_created_by ON supplier_assessments (created_by);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_score ON supplier_assessments (score);

-- Supplier Corrective Requests Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_corrective_requests_supplier_id ON supplier_corrective_requests (supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_corrective_requests_audit_id ON supplier_corrective_requests (audit_id);
CREATE INDEX IF NOT EXISTS idx_supplier_corrective_requests_status_id ON supplier_corrective_requests (status_id);
CREATE INDEX IF NOT EXISTS idx_supplier_corrective_requests_severity ON supplier_corrective_requests (severity);
CREATE INDEX IF NOT EXISTS idx_supplier_corrective_requests_due_date ON supplier_corrective_requests (due_date);
CREATE INDEX IF NOT EXISTS idx_supplier_corrective_requests_initiated_by ON supplier_corrective_requests (initiated_by);
CREATE INDEX IF NOT EXISTS idx_supplier_corrective_requests_created_at ON supplier_corrective_requests (created_at);

-- Management Review Indexes
CREATE INDEX IF NOT EXISTS idx_management_reviews_status ON management_reviews (status);
CREATE INDEX IF NOT EXISTS idx_management_reviews_review_type ON management_reviews (review_type);
CREATE INDEX IF NOT EXISTS idx_management_reviews_review_date ON management_reviews (review_date);
CREATE INDEX IF NOT EXISTS idx_management_reviews_created_by ON management_reviews (created_by);
CREATE INDEX IF NOT EXISTS idx_management_reviews_scheduled_by ON management_reviews (scheduled_by);
CREATE INDEX IF NOT EXISTS idx_management_reviews_created_at ON management_reviews (created_at);

-- Management Review Inputs Indexes
CREATE INDEX IF NOT EXISTS idx_management_review_inputs_review_id ON management_review_inputs (review_id);
CREATE INDEX IF NOT EXISTS idx_management_review_inputs_category ON management_review_inputs (category);
CREATE INDEX IF NOT EXISTS idx_management_review_inputs_source ON management_review_inputs (source);
CREATE INDEX IF NOT EXISTS idx_management_review_inputs_created_by ON management_review_inputs (created_by);

-- Management Review Action Items Indexes
CREATE INDEX IF NOT EXISTS idx_management_review_action_items_review_id ON management_review_action_items (review_id);
CREATE INDEX IF NOT EXISTS idx_management_review_action_items_assigned_to ON management_review_action_items (assigned_to);
CREATE INDEX IF NOT EXISTS idx_management_review_action_items_status ON management_review_action_items (status);
CREATE INDEX IF NOT EXISTS idx_management_review_action_items_priority ON management_review_action_items (priority);
CREATE INDEX IF NOT EXISTS idx_management_review_action_items_due_date ON management_review_action_items (due_date);
CREATE INDEX IF NOT EXISTS idx_management_review_action_items_completed_date ON management_review_action_items (completed_date);

-- Complaints Management Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON complaints (complaint_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints (severity);
CREATE INDEX IF NOT EXISTS idx_complaints_date_received ON complaints (date_received);
CREATE INDEX IF NOT EXISTS idx_complaints_customer_name ON complaints (customer_name);
CREATE INDEX IF NOT EXISTS idx_complaints_product_name ON complaints (product_name);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints (assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_is_reportable ON complaints (is_reportable);
CREATE INDEX IF NOT EXISTS idx_complaints_capa_id ON complaints (capa_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints (created_at);

-- Customer Feedback Indexes
CREATE INDEX IF NOT EXISTS idx_customer_feedback_feedback_number ON customer_feedback (feedback_number);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_type ON customer_feedback (type);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_status ON customer_feedback (status);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_date_received ON customer_feedback (date_received);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_customer_name ON customer_feedback (customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_product_id ON customer_feedback (product_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_assigned_to ON customer_feedback (assigned_to);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_created_at ON customer_feedback (created_at);

-- Calibration Assets Indexes
CREATE INDEX IF NOT EXISTS idx_calibration_assets_asset_id ON calibration_assets (asset_id);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_name ON calibration_assets (name);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_status ON calibration_assets (status);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_department ON calibration_assets (department);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_location ON calibration_assets (location);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_last_calibration_date ON calibration_assets (last_calibration_date);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_next_calibration_date ON calibration_assets (next_calibration_date);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_calibration_frequency ON calibration_assets (calibration_frequency);
CREATE INDEX IF NOT EXISTS idx_calibration_assets_responsible_person ON calibration_assets (responsible_person);

-- Calibration Records Indexes
CREATE INDEX IF NOT EXISTS idx_calibration_records_asset_id ON calibration_records (asset_id);
CREATE INDEX IF NOT EXISTS idx_calibration_records_record_id ON calibration_records (record_id);
CREATE INDEX IF NOT EXISTS idx_calibration_records_calibration_date ON calibration_records (calibration_date);
CREATE INDEX IF NOT EXISTS idx_calibration_records_due_date ON calibration_records (due_date);
CREATE INDEX IF NOT EXISTS idx_calibration_records_status ON calibration_records (status);
CREATE INDEX IF NOT EXISTS idx_calibration_records_performed_by ON calibration_records (performed_by);
CREATE INDEX IF NOT EXISTS idx_calibration_records_created_at ON calibration_records (created_at);

-- Production Management Indexes
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products (product_code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_classification ON products (classification);
CREATE INDEX IF NOT EXISTS idx_products_regulatory_status ON products (regulatory_status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);

-- Production Batches Indexes
CREATE INDEX IF NOT EXISTS idx_production_batches_batch_number ON production_batches (batch_number);
CREATE INDEX IF NOT EXISTS idx_production_batches_product_id ON production_batches (product_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_status ON production_batches (status);
CREATE INDEX IF NOT EXISTS idx_production_batches_start_date ON production_batches (start_date);
CREATE INDEX IF NOT EXISTS idx_production_batches_completion_date ON production_batches (completion_date);
CREATE INDEX IF NOT EXISTS idx_production_batches_expiration_date ON production_batches (expiration_date);
CREATE INDEX IF NOT EXISTS idx_production_batches_created_at ON production_batches (created_at);

-- Nonconforming Products Indexes
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_nc_number ON nonconforming_products (nc_number);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_product_id ON nonconforming_products (product_id);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_batch_id ON nonconforming_products (batch_id);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_status_id ON nonconforming_products (status_id);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_severity_id ON nonconforming_products (severity_id);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_detected_date ON nonconforming_products (detected_date);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_reported_by ON nonconforming_products (reported_by);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_assigned_to ON nonconforming_products (assigned_to);
CREATE INDEX IF NOT EXISTS idx_nonconforming_products_created_at ON nonconforming_products (created_at);

-- Design Control Indexes
CREATE INDEX IF NOT EXISTS idx_design_projects_project_number ON design_projects (project_number);
CREATE INDEX IF NOT EXISTS idx_design_projects_name ON design_projects (name);
CREATE INDEX IF NOT EXISTS idx_design_projects_status_id ON design_projects (status_id);
CREATE INDEX IF NOT EXISTS idx_design_projects_project_manager_id ON design_projects (project_manager_id);
CREATE INDEX IF NOT EXISTS idx_design_projects_created_by ON design_projects (created_by);
CREATE INDEX IF NOT EXISTS idx_design_projects_start_date ON design_projects (start_date);
CREATE INDEX IF NOT EXISTS idx_design_projects_target_completion_date ON design_projects (target_completion_date);
CREATE INDEX IF NOT EXISTS idx_design_projects_created_at ON design_projects (created_at);

-- Design User Needs Indexes
CREATE INDEX IF NOT EXISTS idx_design_user_needs_need_id ON design_user_needs (need_id);
CREATE INDEX IF NOT EXISTS idx_design_user_needs_project_id ON design_user_needs (project_id);
CREATE INDEX IF NOT EXISTS idx_design_user_needs_status ON design_user_needs (status);
CREATE INDEX IF NOT EXISTS idx_design_user_needs_priority ON design_user_needs (priority);
CREATE INDEX IF NOT EXISTS idx_design_user_needs_created_by ON design_user_needs (created_by);
CREATE INDEX IF NOT EXISTS idx_design_user_needs_created_at ON design_user_needs (created_at);

-- Design Inputs Indexes
CREATE INDEX IF NOT EXISTS idx_traceability_design_inputs_input_id ON traceability_design_inputs (input_id);
CREATE INDEX IF NOT EXISTS idx_traceability_design_inputs_project_id ON traceability_design_inputs (project_id);
CREATE INDEX IF NOT EXISTS idx_traceability_design_inputs_category ON traceability_design_inputs (category);
CREATE INDEX IF NOT EXISTS idx_traceability_design_inputs_status ON traceability_design_inputs (status);
CREATE INDEX IF NOT EXISTS idx_traceability_design_inputs_created_by ON traceability_design_inputs (created_by);
CREATE INDEX IF NOT EXISTS idx_traceability_design_inputs_created_at ON traceability_design_inputs (created_at);

-- Design Outputs Indexes
CREATE INDEX IF NOT EXISTS idx_traceability_design_outputs_output_id ON traceability_design_outputs (output_id);
CREATE INDEX IF NOT EXISTS idx_traceability_design_outputs_project_id ON traceability_design_outputs (project_id);
CREATE INDEX IF NOT EXISTS idx_traceability_design_outputs_category ON traceability_design_outputs (category);
CREATE INDEX IF NOT EXISTS idx_traceability_design_outputs_status ON traceability_design_outputs (status);
CREATE INDEX IF NOT EXISTS idx_traceability_design_outputs_created_by ON traceability_design_outputs (created_by);
CREATE INDEX IF NOT EXISTS idx_traceability_design_outputs_created_at ON traceability_design_outputs (created_at);

-- Verification Records Indexes
CREATE INDEX IF NOT EXISTS idx_verification_records_verification_id ON verification_records (verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_project_id ON verification_records (project_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_method ON verification_records (method);
CREATE INDEX IF NOT EXISTS idx_verification_records_status ON verification_records (status);
CREATE INDEX IF NOT EXISTS idx_verification_records_verification_date ON verification_records (verification_date);
CREATE INDEX IF NOT EXISTS idx_verification_records_verified_by ON verification_records (verified_by);
CREATE INDEX IF NOT EXISTS idx_verification_records_created_at ON verification_records (created_at);

-- Validation Records Indexes
CREATE INDEX IF NOT EXISTS idx_validation_records_validation_id ON validation_records (validation_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_project_id ON validation_records (project_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_method ON validation_records (method);
CREATE INDEX IF NOT EXISTS idx_validation_records_status ON validation_records (status);
CREATE INDEX IF NOT EXISTS idx_validation_records_validation_date ON validation_records (validation_date);
CREATE INDEX IF NOT EXISTS idx_validation_records_validated_by ON validation_records (validated_by);
CREATE INDEX IF NOT EXISTS idx_validation_records_created_at ON validation_records (created_at);

-- Technical Documentation Indexes
CREATE INDEX IF NOT EXISTS idx_technical_documents_document_number ON technical_documents (document_number);
CREATE INDEX IF NOT EXISTS idx_technical_documents_device_model ON technical_documents (device_model);
CREATE INDEX IF NOT EXISTS idx_technical_documents_status ON technical_documents (status);
CREATE INDEX IF NOT EXISTS idx_technical_documents_version ON technical_documents (version);
CREATE INDEX IF NOT EXISTS idx_technical_documents_design_project_id ON technical_documents (design_project_id);
CREATE INDEX IF NOT EXISTS idx_technical_documents_created_by ON technical_documents (created_by);
CREATE INDEX IF NOT EXISTS idx_technical_documents_approved_by ON technical_documents (approved_by);
CREATE INDEX IF NOT EXISTS idx_technical_documents_created_at ON technical_documents (created_at);

-- Software Projects Indexes (IEC 62304)
CREATE INDEX IF NOT EXISTS idx_software_projects_project_id ON software_projects (project_id);
CREATE INDEX IF NOT EXISTS idx_software_projects_name ON software_projects (name);
CREATE INDEX IF NOT EXISTS idx_software_projects_classification_id ON software_projects (classification_id);
CREATE INDEX IF NOT EXISTS idx_software_projects_status ON software_projects (status);
CREATE INDEX IF NOT EXISTS idx_software_projects_project_manager ON software_projects (project_manager);
CREATE INDEX IF NOT EXISTS idx_software_projects_created_by ON software_projects (created_by);
CREATE INDEX IF NOT EXISTS idx_software_projects_created_at ON software_projects (created_at);

-- Software Requirements Indexes
CREATE INDEX IF NOT EXISTS idx_software_requirements_requirement_id ON software_requirements (requirement_id);
CREATE INDEX IF NOT EXISTS idx_software_requirements_project_id ON software_requirements (project_id);
CREATE INDEX IF NOT EXISTS idx_software_requirements_type ON software_requirements (type);
CREATE INDEX IF NOT EXISTS idx_software_requirements_priority ON software_requirements (priority);
CREATE INDEX IF NOT EXISTS idx_software_requirements_status ON software_requirements (status);
CREATE INDEX IF NOT EXISTS idx_software_requirements_safety_related ON software_requirements (safety_related);
CREATE INDEX IF NOT EXISTS idx_software_requirements_security_related ON software_requirements (security_related);
CREATE INDEX IF NOT EXISTS idx_software_requirements_created_by ON software_requirements (created_by);
CREATE INDEX IF NOT EXISTS idx_software_requirements_created_at ON software_requirements (created_at);

-- Composite Indexes for Common Query Patterns
-- Document Control Composite Indexes
CREATE INDEX IF NOT EXISTS idx_documents_status_type ON documents (status, type);
CREATE INDEX IF NOT EXISTS idx_documents_department_status ON documents (department, status);
CREATE INDEX IF NOT EXISTS idx_documents_created_by_date ON documents (created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_documents_effective_expiry ON documents (effective_date, expiration_date);

-- CAPA Composite Indexes
CREATE INDEX IF NOT EXISTS idx_capas_status_priority ON capas (status_id, risk_priority);
CREATE INDEX IF NOT EXISTS idx_capas_assigned_status ON capas (assigned_to, status_id);
CREATE INDEX IF NOT EXISTS idx_capas_due_date_status ON capas (due_date, status_id);
CREATE INDEX IF NOT EXISTS idx_capas_source_status ON capas (source, status_id);

-- Audit Composite Indexes
CREATE INDEX IF NOT EXISTS idx_audits_status_type ON audits (status_id, type_id);
CREATE INDEX IF NOT EXISTS idx_audits_date_status ON audits (scheduled_date, status_id);
CREATE INDEX IF NOT EXISTS idx_audits_dept_status ON audits (department_id, status_id);

-- Supplier Composite Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_status_criticality ON suppliers (status_id, criticality);
CREATE INDEX IF NOT EXISTS idx_suppliers_category_status ON suppliers (category_id, status_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_risk_level_status ON suppliers (current_risk_level, status_id);

-- Management Review Composite Indexes
CREATE INDEX IF NOT EXISTS idx_management_reviews_date_status ON management_reviews (review_date, status);
CREATE INDEX IF NOT EXISTS idx_management_reviews_type_date ON management_reviews (review_type, review_date);

-- Complaint Composite Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_status_severity ON complaints (status, severity);
CREATE INDEX IF NOT EXISTS idx_complaints_date_status ON complaints (date_received, status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_status ON complaints (assigned_to, status);

-- Text Search Indexes (for PostgreSQL full-text search)
CREATE INDEX IF NOT EXISTS idx_documents_title_gin ON documents USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_documents_content_gin ON documents USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_capas_title_gin ON capas USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_capas_description_gin ON capas USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_suppliers_name_gin ON suppliers USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_complaints_description_gin ON complaints USING gin(to_tsvector('english', description));

-- Performance Monitoring
CREATE INDEX IF NOT EXISTS idx_created_at_daily ON documents (date_trunc('day', created_at));
CREATE INDEX IF NOT EXISTS idx_capas_created_at_daily ON capas (date_trunc('day', created_at));
CREATE INDEX IF NOT EXISTS idx_audits_created_at_daily ON audits (date_trunc('day', created_at));

-- Foreign Key Performance Indexes
CREATE INDEX IF NOT EXISTS idx_fk_document_versions_document_id ON document_versions (document_id);
CREATE INDEX IF NOT EXISTS idx_fk_capa_actions_capa_id ON capa_actions (capa_id);
CREATE INDEX IF NOT EXISTS idx_fk_audit_checklist_items_audit_id ON audit_checklist_items (audit_id);
CREATE INDEX IF NOT EXISTS idx_fk_supplier_assessments_supplier_id ON supplier_assessments (supplier_id);
CREATE INDEX IF NOT EXISTS idx_fk_management_review_inputs_review_id ON management_review_inputs (review_id);
CREATE INDEX IF NOT EXISTS idx_fk_management_review_action_items_review_id ON management_review_action_items (review_id);

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE documents;
ANALYZE document_versions;
ANALYZE document_approvals;
ANALYZE capas;
ANALYZE capa_actions;
ANALYZE capa_workflows;
ANALYZE capa_workflow_history;
ANALYZE audits;
ANALYZE audit_checklist_items;
ANALYZE suppliers;
ANALYZE supplier_assessments;
ANALYZE supplier_corrective_requests;
ANALYZE management_reviews;
ANALYZE management_review_inputs;
ANALYZE management_review_action_items;
ANALYZE complaints;
ANALYZE customer_feedback;
ANALYZE calibration_assets;
ANALYZE calibration_records;
ANALYZE products;
ANALYZE production_batches;
ANALYZE nonconforming_products;
ANALYZE design_projects;
ANALYZE design_user_needs;
ANALYZE traceability_design_inputs;
ANALYZE traceability_design_outputs;
ANALYZE verification_records;
ANALYZE validation_records;
ANALYZE technical_documents;
ANALYZE software_projects;
ANALYZE software_requirements;

-- Display index creation summary
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
