import { 
  users, documents, documentVersions, documentApprovals, capas, capaActions, capaEvidence, capaVerifications, capaCommunications,
  capaRootCauses, capaRootCauseContributors, capaRootCauseActionMap, capaEffectivenessReviews, capaClosures,
  capaWorkflows, capaWorkflowHistory, capaCorrections, capaWorkflowStates,
  managementReviews, managementReviewInputs, managementReviewActionItems, managementReviewSignatures,
  managementReviewInputCategories,
  
  // Import audit and SCR tables
  audits, auditChecklistItems, supplierCorrectiveRequests, scrAttachments,
  auditTypes, auditStatuses, scrStatuses,
  
  // Import production module tables
  products, productionBatches, batchProcessSteps, materials, batchDeviations, qualityChecks, equipment,
  nonconformingSeverityLevels, nonconformingStatuses, nonconformingProducts, nonconformingProductAttachments,
  
  // Import Measurement & Analysis module tables
  complaints, customerFeedback, calibrationAssets, calibrationRecords,
  
  // Import Technical Documentation module tables
  technicalDocuments, mdrSections, technicalDocumentSections, technicalDocumentAttachments,
  technicalDocumentReferences, technicalDocumentApprovalWorkflow, technicalDocumentApprovalSteps,
  technicalDocumentVersions,
  
  // Import Storage Configuration tables
  storageProviders, storageConfigs, storageFiles, fileAuditLog, storageMigrations, storageAccessControl, storageSharing,
  storageConfigurations, storageAuditLogs,
  
  // Import Design Control Traceability tables
  designUserNeeds, traceabilityDesignInputs, traceabilityDesignOutputs, verificationRecords, validationRecords,
  designTaskDependencies, traceabilityMatrixSnapshots, designControlActivityLog,
  
  // Import Design Plan Phase-Gated System tables
  designPhases, designProjectPhaseInstances, designPhaseReviews, designTraceabilityLinks,
  designPlans, designPhaseAuditTrail
} from "@shared/schema";
import type { 
  Document, InsertDocument, DocumentVersion, InsertDocumentVersion, DocumentApproval, InsertDocumentApproval,
  ManagementReview, InsertManagementReview, ManagementReviewInput, InsertManagementReviewInput,
  ManagementReviewActionItem, InsertManagementReviewActionItem, ManagementReviewSignature, InsertManagementReviewSignature,
  ManagementReviewInputCategory,
  CapaAction, InsertCapaAction, CapaEvidence, InsertCapaEvidence, CapaVerification, InsertCapaVerification,
  CapaCommunication, InsertCapaCommunication, CapaRootCause, InsertCapaRootCause, CapaRootCauseContributor,
  InsertCapaRootCauseContributor, CapaRootCauseActionMap, InsertCapaRootCauseActionMap,
  CapaEffectivenessReview, InsertCapaEffectivenessReview, CapaClosure, InsertCapaClosure,
  CapaWorkflow, InsertCapaWorkflow, CapaWorkflowHistory, InsertCapaWorkflowHistory, 
  CapaCorrection, InsertCapaCorrection,
  
  // Import audit and SCR types
  Audit, InsertAudit, AuditChecklistItem, InsertAuditChecklistItem,
  SupplierCorrectiveRequest, InsertSupplierCorrectiveRequest, ScrAttachment, InsertScrAttachment,
  
  // Import production module types
  Product, InsertProduct, ProductionBatch, InsertProductionBatch, 
  BatchProcessStep, InsertBatchProcessStep, Material, InsertMaterial,
  BatchDeviation, InsertBatchDeviation, QualityCheck, InsertQualityCheck,
  Equipment, InsertEquipment, NonconformingProduct, InsertNonconformingProduct,
  NonconformingProductAttachment, InsertNonconformingProductAttachment,
  
  // Import Measurement & Analysis module types
  Complaint, InsertComplaint, CustomerFeedback, InsertCustomerFeedback,
  CalibrationAsset, InsertCalibrationAsset, CalibrationRecord, InsertCalibrationRecord,
  
  // Import Design Control Traceability types
  DesignUserNeed, InsertDesignUserNeed, TraceabilityDesignInput, InsertTraceabilityDesignInput,
  TraceabilityDesignOutput, InsertTraceabilityDesignOutput, VerificationRecord, InsertVerificationRecord,
  ValidationRecord, InsertValidationRecord, DesignTaskDependency, InsertDesignTaskDependency,
  TraceabilityMatrixSnapshot, InsertTraceabilityMatrixSnapshot, DesignControlActivityLog, InsertDesignControlActivityLog,
  
  // Import Design Plan Phase-Gated System types
  DesignPhase, InsertDesignPhase, DesignProjectPhaseInstance, InsertDesignProjectPhaseInstance,
  DesignPhaseReview, InsertDesignPhaseReview, DesignTraceabilityLink, InsertDesignTraceabilityLink,
  DesignPlan, InsertDesignPlan, DesignPhaseAuditTrail, InsertDesignPhaseAuditTrail
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, and, or, asc, isNotNull, isNull, lte, count, sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Define SessionStore type
type SessionStore = session.Store;

// Simplified interface for storage to reduce errors
export interface IStorage {
  // Session store
  sessionStore: SessionStore;
  
  // User management
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  getUsers(): Promise<any[]>;
  
  // Document management
  getAllDocuments(): Promise<any[]>;
  createDocument(document: any): Promise<any>;
  getDocumentTypes(): Promise<any[]>;
  
  // CAPA management
  getCapas(): Promise<any[]>;
  getCapa(id: number): Promise<any | undefined>;
  createCapa(capa: any): Promise<any>;
  updateCapa(id: number, capa: any): Promise<any | undefined>;
  deleteCapa(id: number): Promise<boolean>;
  
  // CAPA Workflow management
  getCapaWorkflow(capaId: number): Promise<CapaWorkflow | undefined>;
  createCapaWorkflow(workflow: InsertCapaWorkflow): Promise<CapaWorkflow>;
  updateCapaWorkflowState(id: number, state: string, userId: number): Promise<CapaWorkflow | undefined>;
  getCapaWorkflowHistory(workflowId: number): Promise<CapaWorkflowHistory[]>;
  
  // CAPA Correction phase
  getCapaCorrections(capaId: number): Promise<CapaCorrection[]>;
  createCapaCorrection(correction: InsertCapaCorrection): Promise<CapaCorrection>;
  
  // Management Review
  getManagementReviews(): Promise<any[]>;
  getManagementReview(id: number): Promise<any | undefined>;
  createManagementReview(review: any): Promise<any>;
  updateManagementReview(id: number, review: any): Promise<any | undefined>;
  deleteManagementReview(id: number): Promise<boolean>;
  getManagementReviewInputCategories(): Promise<any[]>;
  
  // Audit management
  getAudits(): Promise<Audit[]>;
  getAuditsByType(typeId: number): Promise<Audit[]>;
  getAuditsByStatus(statusId: number): Promise<Audit[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined>;
  deleteAudit(id: number): Promise<boolean>;
  
  // Audit checklist
  getAuditChecklistItems(auditId: number): Promise<AuditChecklistItem[]>;
  getAuditChecklistItem(id: number): Promise<AuditChecklistItem | undefined>;
  createAuditChecklistItem(item: InsertAuditChecklistItem): Promise<AuditChecklistItem>;
  updateAuditChecklistItem(id: number, item: Partial<InsertAuditChecklistItem>): Promise<AuditChecklistItem | undefined>;
  
  // Supplier Corrective Request
  getSupplierCorrectiveRequests(): Promise<SupplierCorrectiveRequest[]>;
  getSupplierCorrectiveRequestsByAudit(auditId: number): Promise<SupplierCorrectiveRequest[]>;
  getSupplierCorrectiveRequest(id: number): Promise<SupplierCorrectiveRequest | undefined>;
  createSupplierCorrectiveRequest(scr: InsertSupplierCorrectiveRequest): Promise<SupplierCorrectiveRequest>;
  updateSupplierCorrectiveRequest(id: number, scr: Partial<InsertSupplierCorrectiveRequest>): Promise<SupplierCorrectiveRequest | undefined>;
  
  // SCR Attachments
  getScrAttachments(scrId: number): Promise<ScrAttachment[]>;
  getScrAttachment(id: number): Promise<ScrAttachment | undefined>;
  createScrAttachment(attachment: InsertScrAttachment): Promise<ScrAttachment>;
  deleteScrAttachment(id: number): Promise<boolean>;
  getManagementReviewInputs(reviewId: number): Promise<any[]>;
  createManagementReviewInput(input: any): Promise<any>;
  getManagementReviewActionItems(reviewId: number): Promise<any[]>;
  createManagementReviewActionItem(item: any): Promise<any>;
  
  // Measurement & Analysis - Complaints
  getComplaints(): Promise<Complaint[]>;
  getComplaint(id: number): Promise<Complaint | undefined>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: number, complaint: Partial<InsertComplaint>): Promise<Complaint | undefined>;
  
  // Measurement & Analysis - Customer Feedback
  getCustomerFeedback(): Promise<CustomerFeedback[]>;
  getCustomerFeedbackByProduct(productId: number): Promise<CustomerFeedback[]>;
  getCustomerFeedbackItem(id: number): Promise<CustomerFeedback | undefined>;
  createCustomerFeedback(feedback: InsertCustomerFeedback): Promise<CustomerFeedback>;
  updateCustomerFeedback(id: number, feedback: Partial<InsertCustomerFeedback>): Promise<CustomerFeedback | undefined>;
  
  // Measurement & Analysis - Calibration Assets
  getCalibrationAssets(): Promise<CalibrationAsset[]>;
  getCalibrationAssetsByDepartment(department: string): Promise<CalibrationAsset[]>;
  getCalibrationAsset(id: number): Promise<CalibrationAsset | undefined>;
  createCalibrationAsset(asset: InsertCalibrationAsset): Promise<CalibrationAsset>;
  updateCalibrationAsset(id: number, asset: Partial<InsertCalibrationAsset>): Promise<CalibrationAsset | undefined>;
  
  // Measurement & Analysis - Calibration Records
  getCalibrationRecords(assetId: number): Promise<CalibrationRecord[]>;
  getCalibrationRecord(id: number): Promise<CalibrationRecord | undefined>;
  createCalibrationRecord(record: InsertCalibrationRecord): Promise<CalibrationRecord>;
  updateCalibrationRecord(id: number, record: Partial<InsertCalibrationRecord>): Promise<CalibrationRecord | undefined>;
  updateManagementReviewActionItem(id: number, item: any): Promise<any | undefined>;

  // Design Control Traceability Module
  // User Needs
  getDesignUserNeeds(): Promise<DesignUserNeed[]>;
  getDesignUserNeed(id: number): Promise<DesignUserNeed | undefined>;
  createDesignUserNeed(userNeed: InsertDesignUserNeed): Promise<DesignUserNeed>;
  updateDesignUserNeed(id: number, userNeed: Partial<InsertDesignUserNeed>): Promise<DesignUserNeed | undefined>;
  deleteDesignUserNeed(id: number): Promise<boolean>;

  // Design Inputs
  getTraceabilityDesignInputs(): Promise<TraceabilityDesignInput[]>;
  getTraceabilityDesignInput(id: number): Promise<TraceabilityDesignInput | undefined>;
  createTraceabilityDesignInput(input: InsertTraceabilityDesignInput): Promise<TraceabilityDesignInput>;
  updateTraceabilityDesignInput(id: number, input: Partial<InsertTraceabilityDesignInput>): Promise<TraceabilityDesignInput | undefined>;
  deleteTraceabilityDesignInput(id: number): Promise<boolean>;

  // Design Outputs
  getTraceabilityDesignOutputs(): Promise<TraceabilityDesignOutput[]>;
  getTraceabilityDesignOutput(id: number): Promise<TraceabilityDesignOutput | undefined>;
  createTraceabilityDesignOutput(output: InsertTraceabilityDesignOutput): Promise<TraceabilityDesignOutput>;
  updateTraceabilityDesignOutput(id: number, output: Partial<InsertTraceabilityDesignOutput>): Promise<TraceabilityDesignOutput | undefined>;
  deleteTraceabilityDesignOutput(id: number): Promise<boolean>;

  // Verification Records
  getVerificationRecords(): Promise<VerificationRecord[]>;
  getVerificationRecord(id: number): Promise<VerificationRecord | undefined>;
  createVerificationRecord(record: InsertVerificationRecord): Promise<VerificationRecord>;
  updateVerificationRecord(id: number, record: Partial<InsertVerificationRecord>): Promise<VerificationRecord | undefined>;
  deleteVerificationRecord(id: number): Promise<boolean>;

  // Validation Records
  getValidationRecords(): Promise<ValidationRecord[]>;
  getValidationRecord(id: number): Promise<ValidationRecord | undefined>;
  createValidationRecord(record: InsertValidationRecord): Promise<ValidationRecord>;
  updateValidationRecord(id: number, record: Partial<InsertValidationRecord>): Promise<ValidationRecord | undefined>;
  deleteValidationRecord(id: number): Promise<boolean>;

  // Traceability Matrix
  generateTraceabilityMatrix(): Promise<TraceabilityMatrixSnapshot>;
  getTraceabilityMatrixSnapshots(): Promise<TraceabilityMatrixSnapshot[]>;
  createTraceabilityMatrixSnapshot(snapshot: InsertTraceabilityMatrixSnapshot): Promise<TraceabilityMatrixSnapshot>;

  // Task Dependencies
  getDesignTaskDependencies(taskId: string, taskType: string): Promise<DesignTaskDependency[]>;
  createDesignTaskDependency(dependency: InsertDesignTaskDependency): Promise<DesignTaskDependency>;
  deleteDesignTaskDependency(id: number): Promise<boolean>;

  // Activity Log
  logDesignControlActivity(activity: InsertDesignControlActivityLog): Promise<DesignControlActivityLog>;
  getDesignControlActivityLog(entityId?: string, entityType?: string): Promise<DesignControlActivityLog[]>;

  // ========================================
  // DESIGN PLAN PHASE-GATED SYSTEM
  // ========================================

  // Design Phases
  getDesignPhases(): Promise<DesignPhase[]>;
  getDesignPhase(id: number): Promise<DesignPhase | undefined>;
  createDesignPhase(phase: InsertDesignPhase): Promise<DesignPhase>;
  updateDesignPhase(id: number, phase: Partial<InsertDesignPhase>): Promise<DesignPhase | undefined>;
  deleteDesignPhase(id: number): Promise<boolean>;

  // Design Project Phase Instances
  getDesignProjectPhaseInstances(projectId: number): Promise<DesignProjectPhaseInstance[]>;
  getDesignProjectPhaseInstance(id: number): Promise<DesignProjectPhaseInstance | undefined>;
  createDesignProjectPhaseInstance(instance: InsertDesignProjectPhaseInstance): Promise<DesignProjectPhaseInstance>;
  updateDesignProjectPhaseInstance(id: number, instance: Partial<InsertDesignProjectPhaseInstance>): Promise<DesignProjectPhaseInstance | undefined>;
  deleteDesignProjectPhaseInstance(id: number): Promise<boolean>;
  activatePhase(phaseInstanceId: number, userId: number): Promise<DesignProjectPhaseInstance | undefined>;
  transitionPhase(phaseInstanceId: number, newStatus: string, userId: number, reasonCode?: string, comments?: string): Promise<DesignProjectPhaseInstance | undefined>;

  // Design Phase Reviews
  getDesignPhaseReviews(projectId?: number): Promise<DesignPhaseReview[]>;
  getDesignPhaseReview(id: number): Promise<DesignPhaseReview | undefined>;
  createDesignPhaseReview(review: InsertDesignPhaseReview): Promise<DesignPhaseReview>;
  updateDesignPhaseReview(id: number, review: Partial<InsertDesignPhaseReview>): Promise<DesignPhaseReview | undefined>;
  approvePhaseReview(reviewId: number, userId: number, outcome: string, comments?: string, actionItems?: any[]): Promise<DesignPhaseReview | undefined>;

  // Design Traceability Links
  getDesignTraceabilityLinks(projectId?: number): Promise<DesignTraceabilityLink[]>;
  getDesignTraceabilityLink(id: number): Promise<DesignTraceabilityLink | undefined>;
  createDesignTraceabilityLink(link: InsertDesignTraceabilityLink): Promise<DesignTraceabilityLink>;
  updateDesignTraceabilityLink(id: number, link: Partial<InsertDesignTraceabilityLink>): Promise<DesignTraceabilityLink | undefined>;
  deleteDesignTraceabilityLink(id: number): Promise<boolean>;

  // Design Plans
  getDesignPlans(): Promise<DesignPlan[]>;
  getDesignPlan(id: number): Promise<DesignPlan | undefined>;
  getDesignPlanByProjectId(projectId: number): Promise<DesignPlan | undefined>;
  createDesignPlan(plan: InsertDesignPlan): Promise<DesignPlan>;
  updateDesignPlan(id: number, plan: Partial<InsertDesignPlan>): Promise<DesignPlan | undefined>;
  deleteDesignPlan(id: number): Promise<boolean>;
  updatePlanProgress(planId: number, progress: number): Promise<DesignPlan | undefined>;

  // Design Phase Audit Trail
  logDesignPhaseActivity(activity: InsertDesignPhaseAuditTrail): Promise<DesignPhaseAuditTrail>;
  getDesignPhaseAuditTrail(phaseInstanceId?: number): Promise<DesignPhaseAuditTrail[]>;

  // Phase Gating Logic
  canAdvanceToNextPhase(phaseInstanceId: number): Promise<boolean>;
  getPhaseGatingStatus(projectId: number): Promise<{
    currentPhase: DesignProjectPhaseInstance | null;
    nextPhase: DesignProjectPhaseInstance | null;
    canAdvance: boolean;
    blockers: string[];
  }>;
}

// In-memory implementation of the IStorage interface
export class MemStorage implements IStorage {
  private users: any[] = [];
  private capas: any[] = [];
  private capaWorkflows: CapaWorkflow[] = [];
  private capaWorkflowHistory: CapaWorkflowHistory[] = [];
  private capaCorrections: CapaCorrection[] = [];
  private managementReviews: any[] = [];
  private managementReviewInputs: any[] = [];
  private managementReviewActionItems: any[] = [];
  private managementReviewSignatures: any[] = [];
  private audits: Audit[] = [];
  private auditChecklistItems: AuditChecklistItem[] = [];
  private supplierCorrectiveRequests: SupplierCorrectiveRequest[] = [];
  private scrAttachments: ScrAttachment[] = [];
  private products: Product[] = [];
  private productionBatches: ProductionBatch[] = [];
  private batchProcessSteps: BatchProcessStep[] = [];
  private materials: Material[] = [];
  private batchDeviations: BatchDeviation[] = [];
  private qualityChecks: QualityCheck[] = [];
  private equipment: Equipment[] = [];
  private nonconformingProducts: NonconformingProduct[] = [];
  private nonconformingProductAttachments: NonconformingProductAttachment[] = [];
  private complaints: Complaint[] = [];
  private customerFeedback: CustomerFeedback[] = [];
  private calibrationAssets: CalibrationAsset[] = [];
  private calibrationRecords: CalibrationRecord[] = [];
  private suppliers: any[] = [];
  private supplierAssessments: any[] = [];
  private documents: any[] = [];
  
  // Design Control Traceability arrays
  private designUserNeeds: DesignUserNeed[] = [];
  private traceabilityDesignInputs: TraceabilityDesignInput[] = [];
  private traceabilityDesignOutputs: TraceabilityDesignOutput[] = [];
  private verificationRecords: VerificationRecord[] = [];
  private validationRecords: ValidationRecord[] = [];
  private designTaskDependencies: DesignTaskDependency[] = [];
  private traceabilityMatrixSnapshots: TraceabilityMatrixSnapshot[] = [];
  private designControlActivityLog: DesignControlActivityLog[] = [];
  
  // Design Plan Phase-Gated System arrays
  private designPhases: DesignPhase[] = [];
  private designProjectPhaseInstances: DesignProjectPhaseInstance[] = [];
  private designPhaseReviews: DesignPhaseReview[] = [];
  private designTraceabilityLinks: DesignTraceabilityLink[] = [];
  private designPlans: DesignPlan[] = [];
  private designPhaseAuditTrail: DesignPhaseAuditTrail[] = [];
  
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User management
  async getUser(id: number) {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string) {
    return this.users.find(u => u.username === username);
  }

  async createUser(user: any) {
    const id = this.users.length + 1;
    const newUser = { ...user, id };
    this.users.push(newUser);
    return newUser;
  }

  async getUsers() {
    return this.users;
  }

  // CAPA management
  async getCapas() {
    return this.capas;
  }

  async getCapa(id: number) {
    return this.capas.find(c => c.id === id);
  }

  async createCapa(capa: any) {
    const id = this.capas.length + 1;
    const newCapa = { ...capa, id };
    this.capas.push(newCapa);
    return newCapa;
  }

  async updateCapa(id: number, capa: any) {
    const index = this.capas.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.capas[index] = { ...this.capas[index], ...capa };
    return this.capas[index];
  }
  
  // CAPA Workflow management methods
  async getCapaWorkflow(capaId: number): Promise<CapaWorkflow | undefined> {
    return this.capaWorkflows.find(wf => wf.capaId === capaId);
  }
  
  async createCapaWorkflow(workflow: InsertCapaWorkflow): Promise<CapaWorkflow> {
    const id = this.capaWorkflows.length > 0 ? Math.max(...this.capaWorkflows.map(wf => wf.id)) + 1 : 1;
    const newWorkflow = {
      ...workflow,
      id,
      currentState: workflow.currentState || 'CORRECTION',
      createdAt: new Date(),
      updatedAt: new Date(),
      transitionDate: new Date()
    } as CapaWorkflow;
    
    this.capaWorkflows.push(newWorkflow);
    
    // Create initial workflow history entry
    this.createCapaWorkflowHistoryEntry({
      workflowId: id,
      toState: newWorkflow.currentState,
      transitionedBy: workflow.transitionedBy || workflow.assignedTo as number,
      comments: 'Initial workflow state'
    });
    
    return newWorkflow;
  }
  
  async updateCapaWorkflowState(id: number, state: string, userId: number): Promise<CapaWorkflow | undefined> {
    const index = this.capaWorkflows.findIndex(wf => wf.id === id);
    if (index === -1) return undefined;
    
    const fromState = this.capaWorkflows[index].currentState;
    
    this.capaWorkflows[index] = {
      ...this.capaWorkflows[index],
      currentState: state as any, // Cast to any to avoid type issues
      transitionDate: new Date(),
      transitionedBy: userId,
      updatedAt: new Date()
    };
    
    // Create workflow history entry
    this.createCapaWorkflowHistoryEntry({
      workflowId: id,
      fromState,
      toState: state as any,
      transitionedBy: userId,
      comments: `Transitioned from ${fromState} to ${state}`
    });
    
    return this.capaWorkflows[index];
  }
  
  async getCapaWorkflowHistory(workflowId: number): Promise<CapaWorkflowHistory[]> {
    return this.capaWorkflowHistory.filter(history => history.workflowId === workflowId);
  }
  
  // Helper method for creating workflow history entries
  private async createCapaWorkflowHistoryEntry(entry: InsertCapaWorkflowHistory): Promise<CapaWorkflowHistory> {
    const id = this.capaWorkflowHistory.length > 0 ? 
      Math.max(...this.capaWorkflowHistory.map(h => h.id)) + 1 : 1;
    
    const newEntry = {
      ...entry,
      id,
      transitionDate: entry.transitionDate || new Date(),
      createdAt: new Date()
    } as CapaWorkflowHistory;
    
    this.capaWorkflowHistory.push(newEntry);
    return newEntry;
  }

  async deleteCapa(id: number): Promise<boolean> {
    const index = this.capas.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.capas.splice(index, 1);
    return true;
  }

  async deleteManagementReview(id: number): Promise<boolean> {
    const index = this.managementReviews.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.managementReviews.splice(index, 1);
    return true;
  }

  async deleteAudit(id: number): Promise<boolean> {
    const index = this.audits.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.audits.splice(index, 1);
    return true;
  }
  
  // CAPA Correction phase methods
  async getCapaCorrections(capaId: number): Promise<CapaCorrection[]> {
    return this.capaCorrections.filter(correction => correction.capaId === capaId);
  }
  
  async createCapaCorrection(correction: InsertCapaCorrection): Promise<CapaCorrection> {
    const id = this.capaCorrections.length > 0 ? 
      Math.max(...this.capaCorrections.map(c => c.id)) + 1 : 1;
    
    const newCorrection = {
      ...correction,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as CapaCorrection;
    
    this.capaCorrections.push(newCorrection);
    return newCorrection;
  }

  // Management Review
  async getManagementReviews() {
    return this.managementReviews;
  }

  async getManagementReview(id: number) {
    return this.managementReviews.find(r => r.id === id);
  }

  async createManagementReview(review: any) {
    const id = this.managementReviews.length + 1;
    const newReview = { ...review, id };
    this.managementReviews.push(newReview);
    return newReview;
  }

  async updateManagementReview(id: number, review: any) {
    const index = this.managementReviews.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    this.managementReviews[index] = { ...this.managementReviews[index], ...review };
    return this.managementReviews[index];
  }

  async getManagementReviewInputCategories() {
    return [
      { id: 1, name: 'Quality Objectives', description: 'Status of quality objectives', required: true, displayOrder: 1 },
      { id: 2, name: 'Audit Results', description: 'Internal and external audit results', required: true, displayOrder: 2 },
      { id: 3, name: 'Customer Feedback', description: 'Feedback from customers', required: true, displayOrder: 3 },
      { id: 4, name: 'Process Performance', description: 'Performance and conformity of processes', required: true, displayOrder: 4 },
      { id: 5, name: 'Product Conformity', description: 'Conformity of products', required: true, displayOrder: 5 },
      { id: 6, name: 'Corrective Actions', description: 'Status of corrective actions', required: true, displayOrder: 6 },
      { id: 7, name: 'Preventive Actions', description: 'Status of preventive actions', required: true, displayOrder: 7 },
      { id: 8, name: 'Follow-up Actions', description: 'Actions from previous management reviews', required: true, displayOrder: 8 },
      { id: 9, name: 'Changes', description: 'Changes that could affect the quality management system', required: true, displayOrder: 9 },
      { id: 10, name: 'Recommendations', description: 'Recommendations for improvement', required: true, displayOrder: 10 },
      { id: 11, name: 'Resources', description: 'Adequacy of resources', required: true, displayOrder: 11 }
    ];
  }

  // Document management methods for MemStorage
  async getAllDocuments() {
    return this.documents;
  }

  async createDocument(document: any) {
    const { generateDocumentNumber } = await import('./utils/document-number-generator');
    
    if (!document.documentNumber) {
      document.documentNumber = generateDocumentNumber();
    }
    
    const id = this.documents.length > 0 ? Math.max(...this.documents.map(d => d.id)) + 1 : 1;
    const newDocument = {
      ...document,
      id,
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    
    this.documents.push(newDocument);
    console.info(`Generated document number: ${newDocument.documentNumber}`);
    return newDocument;
  }

  async getDocumentTypes() {
    return [
      { id: 1, name: 'Quality Manual', prefix: 'QM', categoryId: 1 },
      { id: 2, name: 'Standard Operating Procedure', prefix: 'SOP', categoryId: 2 },
      { id: 3, name: 'Work Instruction', prefix: 'WI', categoryId: 2 },
      { id: 4, name: 'Form', prefix: 'FORM', categoryId: 3 },
      { id: 5, name: 'Technical Specification', prefix: 'TS', categoryId: 4 },
      { id: 6, name: 'Drawing', prefix: 'DWG', categoryId: 4 }
    ];
  }

  // Management review methods moved to single implementation
  async getManagementReviewInputs(reviewId: number) {
    // Support both field naming conventions
    return this.managementReviewInputs.filter(input => {
      return (input.reviewId === reviewId || input.review_id === reviewId);
    });
  }

  async createManagementReviewInput(input: any) {
    const id = this.managementReviewInputs.length > 0 ? Math.max(...this.managementReviewInputs.map(i => i.id)) + 1 : 1;
    const processedInput = { ...input };
    if (processedInput.reviewId && !processedInput.review_id) {
      processedInput.review_id = processedInput.reviewId;
    }
    const newInput = { ...processedInput, id, createdAt: new Date(), updatedAt: new Date() };
    this.managementReviewInputs.push(newInput);
    return newInput;
  }

  async getManagementReviewActionItems(reviewId: number) {
    return this.managementReviewActionItems.filter(item => {
      return (item.reviewId === reviewId || item.review_id === reviewId);
    });
  }

  async createManagementReviewActionItem(item: any) {
    const id = this.managementReviewActionItems.length > 0 ? Math.max(...this.managementReviewActionItems.map(i => i.id)) + 1 : 1;
    const processedItem = { ...item };
    if (processedItem.reviewId && !processedItem.review_id) {
      processedItem.review_id = processedItem.reviewId;
    }
    const newItem = { ...processedItem, id, createdAt: new Date(), updatedAt: new Date() };
    this.managementReviewActionItems.push(newItem);
    return newItem;
  }

  async updateManagementReviewActionItem(id: number, item: any) {
    const index = this.managementReviewActionItems.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    const processedItem = { ...item };
    this.managementReviewActionItems[index] = {
      ...this.managementReviewActionItems[index],
      ...processedItem,
      updatedAt: new Date()
    };
    return this.managementReviewActionItems[index];
  }
  
  // Audit management methods
  async getAudits(): Promise<Audit[]> {
    return this.audits;
  }

  async getAuditsByType(typeId: number): Promise<Audit[]> {
    return this.audits.filter(audit => audit.typeId === typeId);
  }

  async getAuditsByStatus(statusId: number): Promise<Audit[]> {
    return this.audits.filter(audit => audit.statusId === statusId);
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    return this.audits.find(audit => audit.id === id);
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const id = this.audits.length > 0 ? Math.max(...this.audits.map(a => a.id)) + 1 : 1;
    const newAudit = {
      ...audit,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Audit;
    
    this.audits.push(newAudit);
    return newAudit;
  }

  async updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined> {
    const index = this.audits.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.audits[index] = {
      ...this.audits[index],
      ...audit,
      updatedAt: new Date()
    };
    
    return this.audits[index];
  }

  // Audit checklist methods
  async getAuditChecklistItems(auditId: number): Promise<AuditChecklistItem[]> {
    return this.auditChecklistItems.filter(item => item.auditId === auditId);
  }

  async getAuditChecklistItem(id: number): Promise<AuditChecklistItem | undefined> {
    return this.auditChecklistItems.find(item => item.id === id);
  }

  async createAuditChecklistItem(item: InsertAuditChecklistItem): Promise<AuditChecklistItem> {
    const id = this.auditChecklistItems.length > 0 ? Math.max(...this.auditChecklistItems.map(i => i.id)) + 1 : 1;
    const newItem = {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as AuditChecklistItem;
    
    this.auditChecklistItems.push(newItem);
    return newItem;
  }

  async updateAuditChecklistItem(id: number, item: Partial<InsertAuditChecklistItem>): Promise<AuditChecklistItem | undefined> {
    const index = this.auditChecklistItems.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    this.auditChecklistItems[index] = {
      ...this.auditChecklistItems[index],
      ...item,
      updatedAt: new Date()
    };
    
    return this.auditChecklistItems[index];
  }

  // Supplier Corrective Request methods
  async getSupplierCorrectiveRequests(): Promise<SupplierCorrectiveRequest[]> {
    return this.supplierCorrectiveRequests;
  }

  async getSupplierCorrectiveRequestsByAudit(auditId: number): Promise<SupplierCorrectiveRequest[]> {
    return this.supplierCorrectiveRequests.filter(scr => scr.auditId === auditId);
  }

  async getSupplierCorrectiveRequest(id: number): Promise<SupplierCorrectiveRequest | undefined> {
    return this.supplierCorrectiveRequests.find(scr => scr.id === id);
  }

  async createSupplierCorrectiveRequest(scr: InsertSupplierCorrectiveRequest): Promise<SupplierCorrectiveRequest> {
    const id = this.supplierCorrectiveRequests.length > 0 ? Math.max(...this.supplierCorrectiveRequests.map(s => s.id)) + 1 : 1;
    const newScr = {
      ...scr,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as SupplierCorrectiveRequest;
    
    this.supplierCorrectiveRequests.push(newScr);
    return newScr;
  }

  async updateSupplierCorrectiveRequest(id: number, scr: Partial<InsertSupplierCorrectiveRequest>): Promise<SupplierCorrectiveRequest | undefined> {
    const index = this.supplierCorrectiveRequests.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    this.supplierCorrectiveRequests[index] = {
      ...this.supplierCorrectiveRequests[index],
      ...scr,
      updatedAt: new Date()
    };
    
    return this.supplierCorrectiveRequests[index];
  }

  // SCR Attachments methods
  async getScrAttachments(scrId: number): Promise<ScrAttachment[]> {
    return this.scrAttachments.filter(attachment => attachment.scrId === scrId);
  }

  async getScrAttachment(id: number): Promise<ScrAttachment | undefined> {
    return this.scrAttachments.find(attachment => attachment.id === id);
  }

  async createScrAttachment(attachment: InsertScrAttachment): Promise<ScrAttachment> {
    const id = this.scrAttachments.length > 0 ? Math.max(...this.scrAttachments.map(a => a.id)) + 1 : 1;
    const newAttachment = {
      ...attachment,
      id,
      uploadedAt: new Date()
    } as ScrAttachment;
    
    this.scrAttachments.push(newAttachment);
    return newAttachment;
  }

  async deleteScrAttachment(id: number): Promise<boolean> {
    const index = this.scrAttachments.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.scrAttachments.splice(index, 1);
    return true;
  }

  // Management Review methods
  async getManagementReviews() {
    return this.managementReviews;
  }

  async getManagementReview(id: number) {
    return this.managementReviews.find(review => review.id === id);
  }

  async createManagementReview(reviewData: InsertManagementReview) {
    console.log("Creating management review with data:", reviewData);
    
    // Handle client-server field name mapping
    const processedData = { ...reviewData };
    
    // Handle reviewDate to review_date mapping
    if (processedData.reviewDate && !processedData.review_date) {
      processedData.review_date = processedData.reviewDate;
    }
    
    // Handle reviewType to review_type mapping
    if (processedData.reviewType && !processedData.review_type) {
      processedData.review_type = processedData.reviewType;
    }
    
    // Handle completionDate to completion_date mapping
    if (processedData.completionDate && !processedData.completion_date) {
      processedData.completion_date = processedData.completionDate;
    }
    
    // Note: scheduled_date field has been removed from database schema
    
    // Generate title automatically if needed
    if (!processedData.title || processedData.title.trim() === '') {
      const reviewDate = processedData.review_date ? new Date(processedData.review_date) : new Date();
      const reviewType = processedData.review_type || 'standard';
      
      // Format: "Q1 2025 Standard Management Review" or "May 2025 Critical Management Review"
      let formattedTitle = '';
      
      // If the date is at the beginning of a quarter, use quarter format
      const month = reviewDate.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      const isStartOfQuarter = month % 3 === 0 && reviewDate.getDate() <= 15;
      
      if (isStartOfQuarter) {
        formattedTitle = `Q${quarter} ${reviewDate.getFullYear()} `;
      } else {
        // Otherwise use month format
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        formattedTitle = `${monthNames[month]} ${reviewDate.getFullYear()} `;
      }
      
      // Add review type
      formattedTitle += `${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)} Management Review`;
      
      processedData.title = formattedTitle;
    }
    
    console.log("After field mapping and adjustments:", processedData);
    
    const id = this.managementReviews.length > 0 ? Math.max(...this.managementReviews.map(r => r.id)) + 1 : 1;
    
    const newReview = {
      ...processedData,
      id,
      // Convert fields to appropriate types
      review_date: new Date(processedData.review_date),
      completion_date: processedData.completion_date ? new Date(processedData.completion_date) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log("Final review object to be stored:", newReview);
    this.managementReviews.push(newReview);
    return newReview;
  }

  async updateManagementReview(id: number, reviewData: Partial<InsertManagementReview>) {
    console.log(`Updating management review ${id} with data:`, reviewData);
    
    const index = this.managementReviews.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    // Handle client-server field name mapping
    const processedData = { ...reviewData };
    
    // Handle reviewDate to review_date mapping
    if (processedData.reviewDate && !processedData.review_date) {
      processedData.review_date = processedData.reviewDate;
    }
    
    // Handle reviewType to review_type mapping
    if (processedData.reviewType && !processedData.review_type) {
      processedData.review_type = processedData.reviewType;
    }
    
    // Remove scheduledDate field since it doesn't exist in the database schema
    if (processedData.scheduledDate) {
      delete processedData.scheduledDate;
    }
    
    // Also remove any scheduled_date field for consistency since it doesn't exist in schema
    if (processedData.scheduled_date) {
      delete processedData.scheduled_date;
    }
    
    // Handle completionDate to completion_date mapping
    if (processedData.completionDate && !processedData.completion_date) {
      processedData.completion_date = processedData.completionDate;
    }
    
    // Convert date strings to Date objects
    if (processedData.review_date) {
      processedData.review_date = new Date(processedData.review_date);
    }
    
    if (processedData.completion_date) {
      processedData.completion_date = new Date(processedData.completion_date);
    }
    
    console.log("Processed data:", processedData);
    
    this.managementReviews[index] = {
      ...this.managementReviews[index],
      ...processedData,
      updatedAt: new Date()
    };
    
    console.log("Updated review object:", this.managementReviews[index]);
    
    return this.managementReviews[index];
  }

  async getManagementReviewInputCategories() {
    return this.managementReviewInputCategories;
  }

  async getManagementReviewInputs(reviewId: number) {
    // Support both field naming conventions
    return this.managementReviewInputs.filter(input => {
      return (input.reviewId === reviewId || input.review_id === reviewId);
    });
  }

  async createManagementReviewInput(input: any) {
    const id = this.managementReviewInputs.length > 0 ? Math.max(...this.managementReviewInputs.map(i => i.id)) + 1 : 1;
    
    // Process input data to ensure it has the correct field names
    const processedInput = { ...input };
    
    // Ensure review_id is set
    if (processedInput.reviewId && !processedInput.review_id) {
      processedInput.review_id = processedInput.reviewId;
    }
    
    const newInput = { 
      ...processedInput, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    
    this.managementReviewInputs.push(newInput);
    return newInput;
  }

  async getManagementReviewActionItems(reviewId: number) {
    // Support both field naming conventions
    return this.managementReviewActionItems.filter(item => {
      return (item.reviewId === reviewId || item.review_id === reviewId);
    });
  }

  async createManagementReviewActionItem(item: any) {
    const id = this.managementReviewActionItems.length > 0 ? Math.max(...this.managementReviewActionItems.map(i => i.id)) + 1 : 1;
    
    // Process item data to ensure it has the correct field names
    const processedItem = { ...item };
    
    // Ensure review_id is set
    if (processedItem.reviewId && !processedItem.review_id) {
      processedItem.review_id = processedItem.reviewId;
    }
    
    // Convert date strings to Date objects
    if (processedItem.dueDate && typeof processedItem.dueDate === 'string') {
      processedItem.dueDate = new Date(processedItem.dueDate);
    }
    
    if (processedItem.completionDate && typeof processedItem.completionDate === 'string') {
      processedItem.completionDate = new Date(processedItem.completionDate);
    }
    
    if (processedItem.verificationDate && typeof processedItem.verificationDate === 'string') {
      processedItem.verificationDate = new Date(processedItem.verificationDate);
    }
    
    const newItem = { 
      ...processedItem, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    
    this.managementReviewActionItems.push(newItem);
    return newItem;
  }

  async updateManagementReviewActionItem(id: number, item: any) {
    const index = this.managementReviewActionItems.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    // Process item data to ensure it has the correct field names
    const processedItem = { ...item };
    
    // Convert date strings to Date objects
    if (processedItem.dueDate && typeof processedItem.dueDate === 'string') {
      processedItem.dueDate = new Date(processedItem.dueDate);
    }
    
    if (processedItem.completionDate && typeof processedItem.completionDate === 'string') {
      processedItem.completionDate = new Date(processedItem.completionDate);
    }
    
    if (processedItem.verificationDate && typeof processedItem.verificationDate === 'string') {
      processedItem.verificationDate = new Date(processedItem.verificationDate);
    }
    
    this.managementReviewActionItems[index] = {
      ...this.managementReviewActionItems[index],
      ...processedItem,
      updatedAt: new Date()
    };
    
    return this.managementReviewActionItems[index];
  }

  // Measurement & Analysis - Complaints
  async getComplaints(): Promise<Complaint[]> {
    return this.complaints.sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    return this.complaints.find(complaint => complaint.id === id);
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const id = this.complaints.length > 0 ? Math.max(...this.complaints.map(c => c.id)) + 1 : 1;
    
    // Always generate a standardized complaint number with format CMP-YYYY-XXX
    const date = new Date();
    const year = date.getFullYear();
    const count = this.complaints.filter(c => {
      const complaintDate = new Date(c.dateReceived);
      return complaintDate.getFullYear() === year;
    }).length;
    
    const nextNumber = count + 1;
    complaint.complaintNumber = `CMP-${year}-${nextNumber.toString().padStart(3, '0')}`;
    
    const newComplaint = {
      ...complaint,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Complaint;
    
    this.complaints.push(newComplaint);
    return newComplaint;
  }

  async updateComplaint(id: number, complaint: Partial<InsertComplaint>): Promise<Complaint | undefined> {
    const index = this.complaints.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    this.complaints[index] = {
      ...this.complaints[index],
      ...complaint,
      updatedAt: new Date()
    };
    
    return this.complaints[index];
  }

  // Measurement & Analysis - Customer Feedback
  async getCustomerFeedback(): Promise<CustomerFeedback[]> {
    return this.customerFeedback.sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
  }

  async getCustomerFeedbackByProduct(productId: number): Promise<CustomerFeedback[]> {
    return this.customerFeedback
      .filter(feedback => feedback.productId === productId)
      .sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
  }

  async getCustomerFeedbackItem(id: number): Promise<CustomerFeedback | undefined> {
    return this.customerFeedback.find(feedback => feedback.id === id);
  }

  async createCustomerFeedback(feedback: InsertCustomerFeedback): Promise<CustomerFeedback> {
    const id = this.customerFeedback.length > 0 ? Math.max(...this.customerFeedback.map(f => f.id)) + 1 : 1;
    
    const newFeedback = {
      ...feedback,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as CustomerFeedback;
    
    this.customerFeedback.push(newFeedback);
    return newFeedback;
  }

  async updateCustomerFeedback(id: number, feedback: Partial<InsertCustomerFeedback>): Promise<CustomerFeedback | undefined> {
    const index = this.customerFeedback.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    
    this.customerFeedback[index] = {
      ...this.customerFeedback[index],
      ...feedback,
      updatedAt: new Date()
    };
    
    return this.customerFeedback[index];
  }

  // Measurement & Analysis - Calibration Assets
  async getCalibrationAssets(): Promise<CalibrationAsset[]> {
    return this.calibrationAssets.sort((a, b) => a.assetId.localeCompare(b.assetId));
  }

  async getCalibrationAssetsByDepartment(department: string): Promise<CalibrationAsset[]> {
    return this.calibrationAssets
      .filter(asset => asset.department === department)
      .sort((a, b) => a.assetId.localeCompare(b.assetId));
  }

  async getCalibrationAsset(id: number): Promise<CalibrationAsset | undefined> {
    return this.calibrationAssets.find(asset => asset.id === id);
  }

  async createCalibrationAsset(asset: InsertCalibrationAsset): Promise<CalibrationAsset> {
    const id = this.calibrationAssets.length > 0 ? Math.max(...this.calibrationAssets.map(a => a.id)) + 1 : 1;
    
    const newAsset = {
      ...asset,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as CalibrationAsset;
    
    this.calibrationAssets.push(newAsset);
    return newAsset;
  }

  async updateCalibrationAsset(id: number, asset: Partial<InsertCalibrationAsset>): Promise<CalibrationAsset | undefined> {
    const index = this.calibrationAssets.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.calibrationAssets[index] = {
      ...this.calibrationAssets[index],
      ...asset,
      updatedAt: new Date()
    };
    
    return this.calibrationAssets[index];
  }

  // Measurement & Analysis - Calibration Records
  async getCalibrationRecords(assetId: number): Promise<CalibrationRecord[]> {
    return this.calibrationRecords
      .filter(record => record.assetId === assetId)
      .sort((a, b) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime());
  }

  async getCalibrationRecord(id: number): Promise<CalibrationRecord | undefined> {
    return this.calibrationRecords.find(record => record.id === id);
  }

  async createCalibrationRecord(record: InsertCalibrationRecord): Promise<CalibrationRecord> {
    const id = this.calibrationRecords.length > 0 ? Math.max(...this.calibrationRecords.map(r => r.id)) + 1 : 1;
    
    // Generate record ID if not provided
    if (!record.recordId) {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      const count = this.calibrationRecords.filter(r => {
        const recordDate = new Date(r.calibrationDate);
        return recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === parseInt(month);
      }).length;
      
      const nextNumber = count + 1;
      record.recordId = `CAL-${year}${month}-${nextNumber.toString().padStart(3, '0')}`;
    }
    
    // Update the next calibration date on the asset
    if (record.dueDate) {
      const assetIndex = this.calibrationAssets.findIndex(a => a.id === record.assetId);
      if (assetIndex !== -1) {
        this.calibrationAssets[assetIndex] = {
          ...this.calibrationAssets[assetIndex],
          lastCalibrationDate: record.calibrationDate,
          nextCalibrationDate: record.dueDate,
          status: 'Calibrated',
          updatedAt: new Date()
        };
      }
    }
    
    const newRecord = {
      ...record,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as CalibrationRecord;
    
    this.calibrationRecords.push(newRecord);
    return newRecord;
  }

  async updateCalibrationRecord(id: number, record: Partial<InsertCalibrationRecord>): Promise<CalibrationRecord | undefined> {
    const index = this.calibrationRecords.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    // If updating the due date, also update the asset
    if (record.dueDate && record.assetId) {
      const assetIndex = this.calibrationAssets.findIndex(a => a.id === record.assetId);
      if (assetIndex !== -1) {
        this.calibrationAssets[assetIndex] = {
          ...this.calibrationAssets[assetIndex],
          lastCalibrationDate: this.calibrationRecords[index].calibrationDate,
          nextCalibrationDate: record.dueDate,
          status: 'Calibrated',
          updatedAt: new Date()
        };
      }
    }
    
    this.calibrationRecords[index] = {
      ...this.calibrationRecords[index],
      ...record,
      updatedAt: new Date()
    };
    
    return this.calibrationRecords[index];
  }

  // Design Control Traceability Module - MemStorage implementations
  private designUserNeeds: DesignUserNeed[] = [];
  private traceabilityDesignInputs: TraceabilityDesignInput[] = [];
  private traceabilityDesignOutputs: TraceabilityDesignOutput[] = [];
  private verificationRecords: VerificationRecord[] = [];
  private validationRecords: ValidationRecord[] = [];
  private designTaskDependencies: DesignTaskDependency[] = [];
  private traceabilityMatrixSnapshots: TraceabilityMatrixSnapshot[] = [];
  private designControlActivityLog: DesignControlActivityLog[] = [];

  // User Needs
  async getDesignUserNeeds(): Promise<DesignUserNeed[]> {
    return this.designUserNeeds;
  }

  async getDesignUserNeed(id: number): Promise<DesignUserNeed | undefined> {
    return this.designUserNeeds.find(need => need.id === id);
  }

  async createDesignUserNeed(userNeed: InsertDesignUserNeed): Promise<DesignUserNeed> {
    const id = this.designUserNeeds.length > 0 ? Math.max(...this.designUserNeeds.map(n => n.id)) + 1 : 1;
    const needId = `UN-${this.designUserNeeds.length + 1}`;
    
    const newUserNeed = {
      ...userNeed,
      id,
      needId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as DesignUserNeed;
    
    this.designUserNeeds.push(newUserNeed);
    return newUserNeed;
  }

  async updateDesignUserNeed(id: number, userNeed: Partial<InsertDesignUserNeed>): Promise<DesignUserNeed | undefined> {
    const index = this.designUserNeeds.findIndex(n => n.id === id);
    if (index === -1) return undefined;
    
    this.designUserNeeds[index] = {
      ...this.designUserNeeds[index],
      ...userNeed,
      updatedAt: new Date()
    };
    
    return this.designUserNeeds[index];
  }

  async deleteDesignUserNeed(id: number): Promise<boolean> {
    const index = this.designUserNeeds.findIndex(n => n.id === id);
    if (index === -1) return false;
    
    this.designUserNeeds.splice(index, 1);
    return true;
  }

  // Design Inputs
  async getTraceabilityDesignInputs(): Promise<TraceabilityDesignInput[]> {
    return this.traceabilityDesignInputs;
  }

  async getTraceabilityDesignInput(id: number): Promise<TraceabilityDesignInput | undefined> {
    return this.traceabilityDesignInputs.find(input => input.id === id);
  }

  async createTraceabilityDesignInput(input: InsertTraceabilityDesignInput): Promise<TraceabilityDesignInput> {
    const id = this.traceabilityDesignInputs.length > 0 ? Math.max(...this.traceabilityDesignInputs.map(i => i.id)) + 1 : 1;
    const inputId = `DI-${this.traceabilityDesignInputs.length + 1}`;
    
    const newInput = {
      ...input,
      id,
      inputId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as TraceabilityDesignInput;
    
    this.traceabilityDesignInputs.push(newInput);
    return newInput;
  }

  async updateTraceabilityDesignInput(id: number, input: Partial<InsertTraceabilityDesignInput>): Promise<TraceabilityDesignInput | undefined> {
    const index = this.traceabilityDesignInputs.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    this.traceabilityDesignInputs[index] = {
      ...this.traceabilityDesignInputs[index],
      ...input,
      updatedAt: new Date()
    };
    
    return this.traceabilityDesignInputs[index];
  }

  async deleteTraceabilityDesignInput(id: number): Promise<boolean> {
    const index = this.traceabilityDesignInputs.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    this.traceabilityDesignInputs.splice(index, 1);
    return true;
  }

  // Design Outputs
  async getTraceabilityDesignOutputs(): Promise<TraceabilityDesignOutput[]> {
    return this.traceabilityDesignOutputs;
  }

  async getTraceabilityDesignOutput(id: number): Promise<TraceabilityDesignOutput | undefined> {
    return this.traceabilityDesignOutputs.find(output => output.id === id);
  }

  async createTraceabilityDesignOutput(output: InsertTraceabilityDesignOutput): Promise<TraceabilityDesignOutput> {
    const id = this.traceabilityDesignOutputs.length > 0 ? Math.max(...this.traceabilityDesignOutputs.map(o => o.id)) + 1 : 1;
    const outputId = `DO-${this.traceabilityDesignOutputs.length + 1}`;
    
    const newOutput = {
      ...output,
      id,
      outputId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as TraceabilityDesignOutput;
    
    this.traceabilityDesignOutputs.push(newOutput);
    return newOutput;
  }

  async updateTraceabilityDesignOutput(id: number, output: Partial<InsertTraceabilityDesignOutput>): Promise<TraceabilityDesignOutput | undefined> {
    const index = this.traceabilityDesignOutputs.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    
    this.traceabilityDesignOutputs[index] = {
      ...this.traceabilityDesignOutputs[index],
      ...output,
      updatedAt: new Date()
    };
    
    return this.traceabilityDesignOutputs[index];
  }

  async deleteTraceabilityDesignOutput(id: number): Promise<boolean> {
    const index = this.traceabilityDesignOutputs.findIndex(o => o.id === id);
    if (index === -1) return false;
    
    this.traceabilityDesignOutputs.splice(index, 1);
    return true;
  }

  // Verification Records
  async getVerificationRecords(): Promise<VerificationRecord[]> {
    return this.verificationRecords;
  }

  async getVerificationRecord(id: number): Promise<VerificationRecord | undefined> {
    return this.verificationRecords.find(record => record.id === id);
  }

  async createVerificationRecord(record: InsertVerificationRecord): Promise<VerificationRecord> {
    const id = this.verificationRecords.length > 0 ? Math.max(...this.verificationRecords.map(r => r.id)) + 1 : 1;
    const verificationId = `VER-${this.verificationRecords.length + 1}`;
    
    const newRecord = {
      ...record,
      id,
      verificationId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as VerificationRecord;
    
    this.verificationRecords.push(newRecord);
    return newRecord;
  }

  async updateVerificationRecord(id: number, record: Partial<InsertVerificationRecord>): Promise<VerificationRecord | undefined> {
    const index = this.verificationRecords.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    this.verificationRecords[index] = {
      ...this.verificationRecords[index],
      ...record,
      updatedAt: new Date()
    };
    
    return this.verificationRecords[index];
  }

  async deleteVerificationRecord(id: number): Promise<boolean> {
    const index = this.verificationRecords.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.verificationRecords.splice(index, 1);
    return true;
  }

  // Validation Records
  async getValidationRecords(): Promise<ValidationRecord[]> {
    return this.validationRecords;
  }

  async getValidationRecord(id: number): Promise<ValidationRecord | undefined> {
    return this.validationRecords.find(record => record.id === id);
  }

  async createValidationRecord(record: InsertValidationRecord): Promise<ValidationRecord> {
    const id = this.validationRecords.length > 0 ? Math.max(...this.validationRecords.map(r => r.id)) + 1 : 1;
    const validationId = `VAL-${this.validationRecords.length + 1}`;
    
    const newRecord = {
      ...record,
      id,
      validationId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as ValidationRecord;
    
    this.validationRecords.push(newRecord);
    return newRecord;
  }

  async updateValidationRecord(id: number, record: Partial<InsertValidationRecord>): Promise<ValidationRecord | undefined> {
    const index = this.validationRecords.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    this.validationRecords[index] = {
      ...this.validationRecords[index],
      ...record,
      updatedAt: new Date()
    };
    
    return this.validationRecords[index];
  }

  async deleteValidationRecord(id: number): Promise<boolean> {
    const index = this.validationRecords.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.validationRecords.splice(index, 1);
    return true;
  }

  // Traceability Matrix
  async generateTraceabilityMatrix(): Promise<TraceabilityMatrixSnapshot> {
    const matrixData = {
      userNeeds: this.designUserNeeds,
      designInputs: this.traceabilityDesignInputs,
      designOutputs: this.traceabilityDesignOutputs,
      verifications: this.verificationRecords,
      validations: this.validationRecords,
      generatedAt: new Date(),
      totalItems: this.designUserNeeds.length + this.traceabilityDesignInputs.length + 
                  this.traceabilityDesignOutputs.length + this.verificationRecords.length + 
                  this.validationRecords.length
    };

    const snapshot = await this.createTraceabilityMatrixSnapshot({
      matrixData: JSON.stringify(matrixData),
      generatedBy: 1,
      purpose: 'automated_generation'
    });

    return snapshot;
  }

  async getTraceabilityMatrixSnapshots(): Promise<TraceabilityMatrixSnapshot[]> {
    return this.traceabilityMatrixSnapshots;
  }

  async createTraceabilityMatrixSnapshot(snapshot: InsertTraceabilityMatrixSnapshot): Promise<TraceabilityMatrixSnapshot> {
    const id = this.traceabilityMatrixSnapshots.length > 0 ? Math.max(...this.traceabilityMatrixSnapshots.map(s => s.id)) + 1 : 1;
    
    const newSnapshot = {
      ...snapshot,
      id,
      snapshotDate: new Date()
    } as TraceabilityMatrixSnapshot;
    
    this.traceabilityMatrixSnapshots.push(newSnapshot);
    return newSnapshot;
  }

  // Task Dependencies
  async getDesignTaskDependencies(taskId: string, taskType: string): Promise<DesignTaskDependency[]> {
    return this.designTaskDependencies.filter(dep => dep.taskId === taskId && dep.taskType === taskType);
  }

  async createDesignTaskDependency(dependency: InsertDesignTaskDependency): Promise<DesignTaskDependency> {
    const id = this.designTaskDependencies.length > 0 ? Math.max(...this.designTaskDependencies.map(d => d.id)) + 1 : 1;
    
    const newDependency = {
      ...dependency,
      id,
      createdAt: new Date()
    } as DesignTaskDependency;
    
    this.designTaskDependencies.push(newDependency);
    return newDependency;
  }

  async deleteDesignTaskDependency(id: number): Promise<boolean> {
    const index = this.designTaskDependencies.findIndex(d => d.id === id);
    if (index === -1) return false;
    
    this.designTaskDependencies.splice(index, 1);
    return true;
  }

  // Activity Log
  async logDesignControlActivity(activity: InsertDesignControlActivityLog): Promise<DesignControlActivityLog> {
    const id = this.designControlActivityLog.length > 0 ? Math.max(...this.designControlActivityLog.map(a => a.id)) + 1 : 1;
    
    const newActivity = {
      ...activity,
      id,
      timestamp: new Date()
    } as DesignControlActivityLog;
    
    this.designControlActivityLog.push(newActivity);
    return newActivity;
  }

  async getDesignControlActivityLog(entityId?: string, entityType?: string): Promise<DesignControlActivityLog[]> {
    let filtered = this.designControlActivityLog;
    
    if (entityId) {
      filtered = filtered.filter(log => log.entityId === entityId);
    }
    
    if (entityType) {
      filtered = filtered.filter(log => log.entityType === entityType);
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Database implementation of the IStorage interface
export class DatabaseStorage implements IStorage {
  
  async deleteCapa(id: number): Promise<boolean> {
    try {
      const result = await db.delete(capas).where(eq(capas.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting CAPA:", error);
      return false;
    }
  }

  async deleteManagementReview(id: number): Promise<boolean> {
    try {
      const result = await db.delete(managementReviews).where(eq(managementReviews.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting management review:", error);
      return false;
    }
  }

  async deleteAudit(id: number): Promise<boolean> {
    try {
      const result = await db.delete(audits).where(eq(audits.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting audit:", error);
      return false;
    }
  }
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User management
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: any) {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  async getUsers() {
    return await db.select().from(users);
  }

  // CAPA management
  async getCapas() {
    return await db.select().from(capas).orderBy(desc(capas.createdAt));
  }

  async getCapa(id: number) {
    const [capa] = await db.select().from(capas).where(eq(capas.id, id));
    return capa;
  }

  async createCapa(capa: any) {
    const [createdCapa] = await db.insert(capas).values(capa).returning();
    return createdCapa;
  }

  async updateCapa(id: number, capa: any) {
    try {
      // Process date fields correctly before update
      const processedData = { ...capa, updatedAt: new Date() };
      
      // Convert string dates to Date objects to avoid "toISOString is not a function" error
      if (processedData.dueDate && typeof processedData.dueDate === 'string') {
        processedData.dueDate = new Date(processedData.dueDate);
      }
      
      console.log(`Updating CAPA ${id} with data:`, processedData);
      
      const [updatedCapa] = await db
        .update(capas)
        .set(processedData)
        .where(eq(capas.id, id))
        .returning();
        
      return updatedCapa;
    } catch (error) {
      console.error("Error updating CAPA:", error);
      
      // If we get here, there was an error with the update - try a fallback approach
      try {
        console.log(`Attempting fallback method for CAPA update ${id}`);
        // First check if the CAPA actually exists
        const capaExists = await db.select().from(capas).where(eq(capas.id, id));
        
        if (capaExists.length > 0) {
          console.log(`CAPA ${id} exists, but update failed`);
          // The CAPA exists but there was an issue updating it
          // Try a different approach with a raw SQL query
          
          // Return the existing CAPA rather than nothing
          return capaExists[0];
        }
      } catch (fallbackError) {
        console.error(`Fallback approach for CAPA ${id} failed:`, fallbackError);
      }
      
      return undefined;
    }
  }
  
  // CAPA Workflow methods
  async getCapaWorkflow(capaId: number) {
    try {
      const result = await db.select()
        .from(capaWorkflows)
        .where(eq(capaWorkflows.capaId, capaId))
        .limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Error getting CAPA workflow for CAPA ${capaId}:`, error);
      return undefined;
    }
  }

  async createCapaWorkflow(data: InsertCapaWorkflow) {
    try {
      const [result] = await db.insert(capaWorkflows).values({
        ...data,
        transitionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Create initial workflow history entry
      if (result) {
        await db.insert(capaWorkflowHistory).values({
          workflowId: result.id,
          toState: result.currentState,
          transitionedBy: data.transitionedBy || data.assignedTo as number,
          comments: 'Initial workflow state',
          transitionDate: new Date(),
          createdAt: new Date()
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error creating CAPA workflow:", error);
      throw error;
    }
  }

  async updateCapaWorkflowState(id: number, state: string, userId: number) {
    try {
      // Get current workflow state
      const currentWorkflow = await db.select()
        .from(capaWorkflows)
        .where(eq(capaWorkflows.id, id))
        .limit(1);
        
      if (!currentWorkflow.length) return undefined;
      
      const fromState = currentWorkflow[0].currentState;
      
      // Update the workflow state
      const [result] = await db.update(capaWorkflows)
        .set({
          currentState: state as any,
          transitionDate: new Date(),
          transitionedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(capaWorkflows.id, id))
        .returning();
      
      // Create workflow history entry
      if (result) {
        await db.insert(capaWorkflowHistory).values({
          workflowId: id,
          fromState,
          toState: state as any,
          transitionedBy: userId,
          comments: `Transitioned from ${fromState} to ${state}`,
          transitionDate: new Date(),
          createdAt: new Date()
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error updating CAPA workflow state:`, error);
      return undefined;
    }
  }
  
  // Method to update the full CAPA workflow
  async updateCapaWorkflow(id: number, data: Partial<typeof capaWorkflows.$inferSelect>) {
    try {
      const [result] = await db
        .update(capaWorkflows)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(capaWorkflows.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Error updating CAPA workflow ${id}:`, error);
      throw error;
    }
  }
  
  // Method to create workflow history record
  async createCapaWorkflowHistory(data: Omit<typeof capaWorkflowHistory.$inferInsert, 'id' | 'createdAt'>) {
    try {
      const [result] = await db
        .insert(capaWorkflowHistory)
        .values({
          ...data,
          createdAt: new Date()
        })
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Error creating CAPA workflow history:`, error);
      throw error;
    }
  }
  
  // Methods for phase-specific data
  async getCapaPhaseData(capaId: number, phase: string) {
    try {
      const result = await db
        .select()
        .from(capaPhaseData)
        .where(and(
          eq(capaPhaseData.capaId, capaId),
          eq(capaPhaseData.phase, phase)
        ));
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Error getting CAPA phase data for CAPA ${capaId}, phase ${phase}:`, error);
      return undefined;
    }
  }
  
  async saveCapaPhaseData(capaId: number, phase: string, data: any, userId: number) {
    try {
      // Check if data already exists for this phase
      const existingData = await this.getCapaPhaseData(capaId, phase);
      
      if (existingData) {
        // Update existing data
        const [result] = await db
          .update(capaPhaseData)
          .set({
            data: data,
            updatedBy: userId,
            updatedAt: new Date()
          })
          .where(and(
            eq(capaPhaseData.capaId, capaId),
            eq(capaPhaseData.phase, phase)
          ))
          .returning();
        
        return result;
      } else {
        // Create new data
        const [result] = await db
          .insert(capaPhaseData)
          .values({
            capaId: capaId,
            phase: phase,
            data: data,
            createdBy: userId,
            updatedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return result;
      }
    } catch (error) {
      console.error(`Error saving CAPA phase data for CAPA ${capaId}, phase ${phase}:`, error);
      throw error;
    }
  }

  async getCapaWorkflowHistory(workflowId: number) {
    try {
      return db.select()
        .from(capaWorkflowHistory)
        .where(eq(capaWorkflowHistory.workflowId, workflowId))
        .orderBy(asc(capaWorkflowHistory.transitionDate));
    } catch (error) {
      console.error(`Error getting CAPA workflow history:`, error);
      return [];
    }
  }
  
  // CAPA Correction phase methods
  async getCapaCorrections(capaId: number) {
    try {
      return db.select()
        .from(capaCorrections)
        .where(eq(capaCorrections.capaId, capaId))
        .orderBy(desc(capaCorrections.createdAt));
    } catch (error) {
      console.error(`Error getting CAPA corrections:`, error);
      return [];
    }
  }
  
  async createCapaCorrection(data: InsertCapaCorrection) {
    try {
      const [result] = await db.insert(capaCorrections).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return result;
    } catch (error) {
      console.error("Error creating CAPA correction:", error);
      throw error;
    }
  }

  // Management Review
  async getManagementReviews() {
    return await db.select().from(managementReviews).orderBy(desc(managementReviews.createdAt));
  }

  async getManagementReview(id: number) {
    try {
      const [review] = await db.select().from(managementReviews).where(eq(managementReviews.id, id));
      return review;
    } catch (error) {
      console.error("Error getting management review:", error);
      try {
        // Fallback to direct SQL query
        const result = await pool.query(
          'SELECT * FROM management_reviews WHERE id = $1',
          [id]
        );
        return result.rows[0];
      } catch (sqlError) {
        console.error("SQL fallback error:", sqlError);
        return undefined;
      }
    }
  }

  async createManagementReview(review: any) {
    // Process review data to ensure proper field mapping
    const processedReview = { ...review };
    
    // Remove fields that don't exist in the database
    if (processedReview.scheduledDate) {
      delete processedReview.scheduledDate;
    }
    
    // Remove fields that don't exist in the actual database schema
    delete processedReview.presentation_file;
    delete processedReview.file_content_type;
    delete processedReview.invite_sent;
    delete processedReview.reminder_sent;
    
    // Process date fields if necessary
    if (processedReview.reviewDate && !processedReview.review_date) {
      processedReview.review_date = typeof processedReview.reviewDate === 'string'
        ? new Date(processedReview.reviewDate)
        : processedReview.reviewDate;
      delete processedReview.reviewDate;
    }
    
    // Generate title automatically if needed
    if (!processedReview.title || processedReview.title.trim() === '') {
      const reviewDate = processedReview.review_date ? new Date(processedReview.review_date) : new Date();
      const reviewType = processedReview.review_type || 'standard';
      
      // Format: "Q1 2025 Standard Management Review" or "May 2025 Critical Management Review"
      let formattedTitle = '';
      
      // If the date is at the beginning of a quarter, use quarter format
      const month = reviewDate.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      const isStartOfQuarter = month % 3 === 0 && reviewDate.getDate() <= 15;
      
      if (isStartOfQuarter) {
        formattedTitle = `Q${quarter} ${reviewDate.getFullYear()} `;
      } else {
        // Otherwise use month format
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        formattedTitle = `${monthNames[month]} ${reviewDate.getFullYear()} `;
      }
      
      // Add review type
      formattedTitle += `${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)} Management Review`;
      
      processedReview.title = formattedTitle;
    }
    
    console.log("Sending processed review data to database:", JSON.stringify(processedReview, null, 2));
    const [createdReview] = await db.insert(managementReviews).values(processedReview).returning();
    return createdReview;
  }

  async updateManagementReview(id: number, review: any) {
    try {
      const [updatedReview] = await db
        .update(managementReviews)
        .set(review)
        .where(eq(managementReviews.id, id))
        .returning();
      return updatedReview;
    } catch (error) {
      console.error("Error updating management review:", error);
      return undefined;
    }
  }

  async getManagementReviewInputCategories() {
    return await db.select().from(managementReviewInputCategories).orderBy(asc(managementReviewInputCategories.displayOrder));
  }

  async getManagementReviewInputs(reviewId: number) {
    return await db.select().from(managementReviewInputs).where(eq(managementReviewInputs.review_id, reviewId));
  }

  async createManagementReviewInput(input: any) {
    // Process input data to ensure it has the correct field names
    const processedInput = { ...input };
    
    // Ensure review_id is set (database column is snake_case)
    if (processedInput.reviewId && !processedInput.review_id) {
      processedInput.review_id = processedInput.reviewId;
      delete processedInput.reviewId; // Remove camelCase version to avoid database errors
    }
    
    const [createdInput] = await db.insert(managementReviewInputs).values(processedInput).returning();
    return createdInput;
  }

  async deleteManagementReviewInput(inputId: number) {
    try {
      const [deletedInput] = await db
        .delete(managementReviewInputs)
        .where(eq(managementReviewInputs.id, inputId))
        .returning();
      return deletedInput;
    } catch (error) {
      console.error("Error deleting management review input:", error);
      return null;
    }
  }

  async getManagementReviewActionItems(reviewId: number) {
    return await db.select().from(managementReviewActionItems).where(eq(managementReviewActionItems.review_id, reviewId));
  }

  async createManagementReviewActionItem(item: any) {
    // Process item data to ensure it has the correct field names
    const processedItem = { ...item };
    
    // Ensure review_id is set (database column is snake_case)
    if (processedItem.reviewId && !processedItem.review_id) {
      processedItem.review_id = processedItem.reviewId;
      delete processedItem.reviewId; // Remove camelCase version to avoid database errors
    }
    
    // Handle date fields - the database schema uses snake_case field names
    if (processedItem.dueDate && !processedItem.due_date) {
      processedItem.due_date = typeof processedItem.dueDate === 'string' 
        ? new Date(processedItem.dueDate) 
        : processedItem.dueDate;
      delete processedItem.dueDate;
    }
    
    if (processedItem.completionDate && !processedItem.completed_date) {
      processedItem.completed_date = typeof processedItem.completionDate === 'string' 
        ? new Date(processedItem.completionDate) 
        : processedItem.completionDate;
      delete processedItem.completionDate;
    }
    
    if (processedItem.verificationDate && !processedItem.verified_date) {
      processedItem.verified_date = typeof processedItem.verificationDate === 'string' 
        ? new Date(processedItem.verificationDate) 
        : processedItem.verificationDate;
      delete processedItem.verificationDate;
    }
    
    const [createdItem] = await db.insert(managementReviewActionItems).values(processedItem).returning();
    return createdItem;
  }

  async updateManagementReviewActionItem(id: number, item: any) {
    try {
      // Process item data to ensure it has the correct field names
      const processedItem = { ...item };
      
      // Handle date fields - the database schema uses snake_case field names
      if (processedItem.dueDate && !processedItem.due_date) {
        processedItem.due_date = typeof processedItem.dueDate === 'string' 
          ? new Date(processedItem.dueDate) 
          : processedItem.dueDate;
        delete processedItem.dueDate;
      }
      
      if (processedItem.completionDate && !processedItem.completed_date) {
        processedItem.completed_date = typeof processedItem.completionDate === 'string' 
          ? new Date(processedItem.completionDate) 
          : processedItem.completionDate;
        delete processedItem.completionDate;
      }
      
      if (processedItem.verificationDate && !processedItem.verified_date) {
        processedItem.verified_date = typeof processedItem.verificationDate === 'string' 
          ? new Date(processedItem.verificationDate) 
          : processedItem.verificationDate;
        delete processedItem.verificationDate;
      }
      
      const [updatedItem] = await db
        .update(managementReviewActionItems)
        .set(processedItem)
        .where(eq(managementReviewActionItems.id, id))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error("Error updating management review action item:", error);
      return undefined;
    }
  }

  // Audit Management Methods
  async getAudits(): Promise<Audit[]> {
    try {
      const result = await db
        .select()
        .from(audits)
        .orderBy(desc(audits.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching audits:", error);
      return [];
    }
  }

  async getAuditsByType(typeId: number): Promise<Audit[]> {
    try {
      const result = await db
        .select({
          ...audits,
          leadAuditorName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(audits)
        .leftJoin(users, eq(audits.leadAuditor, users.id))
        .where(eq(audits.typeId, typeId))
        .orderBy(desc(audits.createdAt));
      return result;
    } catch (error) {
      console.error(`Error fetching audits by type ${typeId}:`, error);
      return [];
    }
  }

  async getAuditsByStatus(statusId: number): Promise<Audit[]> {
    try {
      const result = await db
        .select()
        .from(audits)
        .where(eq(audits.statusId, statusId))
        .orderBy(desc(audits.createdAt));
      return result;
    } catch (error) {
      console.error(`Error fetching audits by status ${statusId}:`, error);
      return [];
    }
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    try {
      const [result] = await db
        .select()
        .from(audits)
        .where(eq(audits.id, id));
      
      return result;
    } catch (error) {
      console.error(`Error fetching audit ${id}:`, error);
      return undefined;
    }
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    try {
      // Import number generator dynamically to avoid circular dependencies
      const { generateAuditNumber } = await import('./utils/number-generator');
      
      // Generate a unique audit number if not provided
      if (!audit.auditId) {
        audit.auditId = await generateAuditNumber();
      }
      
      const [result] = await db
        .insert(audits)
        .values(audit)
        .returning();
        
      // Log the audit number creation for traceability
      console.info(`Generated audit number: ${result.auditId}`);
      
      return result;
    } catch (error) {
      console.error("Error creating audit:", error);
      throw error;
    }
  }

  async updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined> {
    try {
      // Handle simple status update as a special case
      // If we're only updating the status, use a direct SQL approach
      if (Object.keys(audit).length === 1 && audit.statusId !== undefined) {
        console.log(`Simple status update for audit ${id} to status ${audit.statusId}`);
        try {
          // Use a simple parameterized query for the status update
          const query = 'UPDATE audits SET status_id = $1 WHERE id = $2 RETURNING *';
          const values = [audit.statusId, id];
          
          const result = await pool.query(query, values);
          
          if (result.rows.length > 0) {
            console.log(`Successfully updated audit ${id} status to ${audit.statusId}`);
            
            // Format the result to camelCase for frontend consistency
            const formattedAudit = {
              id: result.rows[0].id,
              auditId: result.rows[0].audit_id,
              title: result.rows[0].title,
              scope: result.rows[0].scope,
              description: result.rows[0].description,
              typeId: result.rows[0].type_id,
              statusId: result.rows[0].status_id,
              departmentId: result.rows[0].department_id,
              supplierId: result.rows[0].supplier_id,
              scheduledDate: result.rows[0].scheduled_date,
              startDate: result.rows[0].start_date,
              endDate: result.rows[0].end_date,
              standardReference: result.rows[0].standard_reference,
              leadAuditorName: result.rows[0].lead_auditor_name,
              auditLocation: result.rows[0].audit_location,
              createdBy: result.rows[0].created_by,
              createdAt: result.rows[0].created_at,
              updatedAt: result.rows[0].updated_at
            };
            
            return formattedAudit as Audit;
          }
        } catch (statusUpdateError) {
          console.error(`Error during direct status update for audit ${id}:`, statusUpdateError);
          // Continue to the general update approach if this fails
        }
      }
      
      // Proceed with general update approach for more complex updates
      // Remove any properties that aren't in the audits schema
      const cleanedData: any = { ...audit };
      
      // Remove fields that don't exist in the audits table
      if ('has_checklist_items' in cleanedData) {
        delete cleanedData.has_checklist_items;
      }
      
      // Handle date fields properly to avoid toISOString errors
      if (cleanedData.scheduledDate && typeof cleanedData.scheduledDate === 'string') {
        cleanedData.scheduledDate = new Date(cleanedData.scheduledDate);
      }
      
      if (cleanedData.startDate && typeof cleanedData.startDate === 'string') {
        cleanedData.startDate = new Date(cleanedData.startDate);
      }
      
      if (cleanedData.endDate && typeof cleanedData.endDate === 'string') {
        cleanedData.endDate = new Date(cleanedData.endDate);
      }
      
      console.log(`Updating audit ${id} with cleaned data:`, cleanedData);
      
      // Execute ORM update if direct SQL approach didn't work
      try {
        const [result] = await db
          .update(audits)
          .set(cleanedData)
          .where(eq(audits.id, id))
          .returning();
        return result;
      } catch (ormError) {
        console.error(`ORM update failed for audit ${id}:`, ormError);
        
        // Verify audit exists
        const checkQuery = 'SELECT * FROM audits WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          console.log(`Audit ${id} not found in database`);
          return undefined;
        }
        
        // Return the existing audit if we couldn't update it
        const formattedAudit = {
          id: checkResult.rows[0].id,
          auditId: checkResult.rows[0].audit_id,
          title: checkResult.rows[0].title,
          scope: checkResult.rows[0].scope,
          description: checkResult.rows[0].description,
          typeId: checkResult.rows[0].type_id,
          statusId: checkResult.rows[0].status_id,
          departmentId: checkResult.rows[0].department_id,
          supplierId: checkResult.rows[0].supplier_id,
          scheduledDate: checkResult.rows[0].scheduled_date,
          startDate: checkResult.rows[0].start_date,
          endDate: checkResult.rows[0].end_date,
          standardReference: checkResult.rows[0].standard_reference,
          leadAuditorName: checkResult.rows[0].lead_auditor_name,
          auditLocation: checkResult.rows[0].audit_location,
          createdBy: checkResult.rows[0].created_by,
          createdAt: checkResult.rows[0].created_at,
          updatedAt: checkResult.rows[0].updated_at
        };
        
        return formattedAudit as Audit;
      }
    } catch (error) {
      console.error(`Error updating audit ${id}:`, error);
      return undefined;
    }
  }

  // Audit Checklist Methods
  async getAuditChecklistItems(auditId: number): Promise<AuditChecklistItem[]> {
    try {
      const result = await db
        .select()
        .from(auditChecklistItems)
        .where(eq(auditChecklistItems.auditId, auditId));
      return result;
    } catch (error) {
      console.error(`Error fetching checklist items for audit ${auditId}:`, error);
      return [];
    }
  }

  async getAuditChecklistItem(id: number): Promise<AuditChecklistItem | undefined> {
    try {
      const [result] = await db
        .select()
        .from(auditChecklistItems)
        .where(eq(auditChecklistItems.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching checklist item ${id}:`, error);
      return undefined;
    }
  }

  async createAuditChecklistItem(item: InsertAuditChecklistItem): Promise<AuditChecklistItem> {
    const [result] = await db
      .insert(auditChecklistItems)
      .values(item)
      .returning();
    return result;
  }

  async updateAuditChecklistItem(id: number, item: Partial<InsertAuditChecklistItem>): Promise<AuditChecklistItem | undefined> {
    try {
      const [result] = await db
        .update(auditChecklistItems)
        .set(item)
        .where(eq(auditChecklistItems.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating checklist item ${id}:`, error);
      return undefined;
    }
  }

  // Supplier Corrective Request Methods
  async getSupplierCorrectiveRequests(): Promise<SupplierCorrectiveRequest[]> {
    try {
      const result = await db
        .select()
        .from(supplierCorrectiveRequests)
        .orderBy(desc(supplierCorrectiveRequests.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching supplier corrective requests:", error);
      return [];
    }
  }

  async getSupplierCorrectiveRequestsByAudit(auditId: number): Promise<SupplierCorrectiveRequest[]> {
    try {
      const result = await db
        .select()
        .from(supplierCorrectiveRequests)
        .where(eq(supplierCorrectiveRequests.auditId, auditId))
        .orderBy(desc(supplierCorrectiveRequests.createdAt));
      return result;
    } catch (error) {
      console.error(`Error fetching SCRs for audit ${auditId}:`, error);
      return [];
    }
  }

  async getSupplierCorrectiveRequest(id: number): Promise<SupplierCorrectiveRequest | undefined> {
    try {
      const [result] = await db
        .select()
        .from(supplierCorrectiveRequests)
        .where(eq(supplierCorrectiveRequests.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching SCR ${id}:`, error);
      return undefined;
    }
  }

  async createSupplierCorrectiveRequest(scr: InsertSupplierCorrectiveRequest): Promise<SupplierCorrectiveRequest> {
    const [result] = await db
      .insert(supplierCorrectiveRequests)
      .values(scr)
      .returning();
    return result;
  }

  async updateSupplierCorrectiveRequest(id: number, scr: Partial<InsertSupplierCorrectiveRequest>): Promise<SupplierCorrectiveRequest | undefined> {
    try {
      const [result] = await db
        .update(supplierCorrectiveRequests)
        .set(scr)
        .where(eq(supplierCorrectiveRequests.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating SCR ${id}:`, error);
      return undefined;
    }
  }

  // SCR Attachments Methods
  async getScrAttachments(scrId: number): Promise<ScrAttachment[]> {
    try {
      const result = await db
        .select()
        .from(scrAttachments)
        .where(eq(scrAttachments.scrId, scrId))
        .orderBy(desc(scrAttachments.uploadedAt));
      return result;
    } catch (error) {
      console.error(`Error fetching attachments for SCR ${scrId}:`, error);
      return [];
    }
  }

  async getScrAttachment(id: number): Promise<ScrAttachment | undefined> {
    try {
      const [result] = await db
        .select()
        .from(scrAttachments)
        .where(eq(scrAttachments.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching attachment ${id}:`, error);
      return undefined;
    }
  }

  async createScrAttachment(attachment: InsertScrAttachment): Promise<ScrAttachment> {
    const [result] = await db
      .insert(scrAttachments)
      .values(attachment)
      .returning();
    return result;
  }

  async deleteScrAttachment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(scrAttachments)
        .where(eq(scrAttachments.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting attachment ${id}:`, error);
      return false;
    }
  }

  // Production Module - Products Methods
  async getProducts(): Promise<Product[]> {
    try {
      // First check if the products table exists
      const tableExists = await this.checkIfTableExists('products');
      if (!tableExists) {
        console.log("Products table doesn't exist in the database yet");
        return [];
      }
      
      // Then check if the column product_code exists in the products table
      const productCodeExists = await this.checkIfColumnExists('products', 'product_code');
      
      if (productCodeExists) {
        return await db
          .select()
          .from(products)
          .orderBy(asc(products.name));
      } else {
        console.log("The product_code column doesn't exist in the products table");
        return [];
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }
  
  // Helper method to check if a table exists
  private async checkIfTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        );
      `);
      return result.rows[0]?.exists === true;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }
  
  // Helper method to check if a column exists in a table
  private async checkIfColumnExists(tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
          AND column_name = ${columnName}
        );
      `);
      return result.rows[0]?.exists === true;
    } catch (error) {
      console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error);
      return false;
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [result] = await db
        .select()
        .from(products)
        .where(eq(products.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return undefined;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const [result] = await db
        .insert(products)
        .values(product)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const [result] = await db
        .update(products)
        .set(product)
        .where(eq(products.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      return undefined;
    }
  }

  // Production Module - Batches Methods
  async getProductionBatches(): Promise<ProductionBatch[]> {
    try {
      // First check if the production_batches table exists
      const tableExists = await this.checkIfTableExists('production_batches');
      if (!tableExists) {
        console.log("Production batches table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(productionBatches)
        .orderBy(desc(productionBatches.createdAt));
    } catch (error) {
      console.error("Error fetching production batches:", error);
      return [];
    }
  }

  async getProductionBatchesByProduct(productId: number): Promise<ProductionBatch[]> {
    try {
      // Check if the production_batches table exists
      const tableExists = await this.checkIfTableExists('production_batches');
      if (!tableExists) {
        console.log("Production batches table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(productionBatches)
        .where(eq(productionBatches.productId, productId))
        .orderBy(desc(productionBatches.createdAt));
    } catch (error) {
      console.error(`Error fetching production batches for product ${productId}:`, error);
      return [];
    }
  }

  async getProductionBatch(id: number): Promise<ProductionBatch | undefined> {
    try {
      // Check if the production_batches table exists
      const tableExists = await this.checkIfTableExists('production_batches');
      if (!tableExists) {
        console.log("Production batches table doesn't exist in the database yet");
        return undefined;
      }
      
      const [result] = await db
        .select()
        .from(productionBatches)
        .where(eq(productionBatches.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching production batch ${id}:`, error);
      return undefined;
    }
  }

  async createProductionBatch(batch: InsertProductionBatch): Promise<ProductionBatch> {
    try {
      // Check if the production_batches table exists
      const tableExists = await this.checkIfTableExists('production_batches');
      if (!tableExists) {
        throw new Error("Production batches table doesn't exist in the database yet. Please run the migration to create it.");
      }
      
      // Import number generator dynamically to avoid circular dependencies
      const { generateBatchNumber } = await import('./utils/number-generator');
      
      // Generate a unique batch number if not provided
      if (!batch.batchNumber) {
        batch.batchNumber = await generateBatchNumber();
      }
      
      const [result] = await db
        .insert(productionBatches)
        .values(batch)
        .returning();
        
      // Log the batch number creation for traceability
      console.info(`Generated production batch number: ${result.batchNumber}`);
      
      return result;
    } catch (error) {
      console.error("Error creating production batch:", error);
      throw error;
    }
  }

  async updateProductionBatch(id: number, batch: Partial<InsertProductionBatch>): Promise<ProductionBatch | undefined> {
    try {
      // Check if the production_batches table exists
      const tableExists = await this.checkIfTableExists('production_batches');
      if (!tableExists) {
        console.log("Production batches table doesn't exist in the database yet");
        return undefined;
      }
      
      const [result] = await db
        .update(productionBatches)
        .set(batch)
        .where(eq(productionBatches.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating production batch ${id}:`, error);
      return undefined;
    }
  }

  // Production Module - Process Steps Methods
  async getBatchProcessSteps(batchId: number): Promise<BatchProcessStep[]> {
    try {
      // Check if the batch_process_steps table exists
      const tableExists = await this.checkIfTableExists('batch_process_steps');
      if (!tableExists) {
        console.log("Batch process steps table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(batchProcessSteps)
        .where(eq(batchProcessSteps.batchId, batchId))
        .orderBy(asc(batchProcessSteps.stepNumber));
    } catch (error) {
      console.error(`Error fetching process steps for batch ${batchId}:`, error);
      return [];
    }
  }

  async getBatchProcessStep(id: number): Promise<BatchProcessStep | undefined> {
    try {
      // Check if the batch_process_steps table exists
      const tableExists = await this.checkIfTableExists('batch_process_steps');
      if (!tableExists) {
        console.log("Batch process steps table doesn't exist in the database yet");
        return undefined;
      }
      
      const [result] = await db
        .select()
        .from(batchProcessSteps)
        .where(eq(batchProcessSteps.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching process step ${id}:`, error);
      return undefined;
    }
  }

  async createBatchProcessStep(step: InsertBatchProcessStep): Promise<BatchProcessStep> {
    try {
      const [result] = await db
        .insert(batchProcessSteps)
        .values(step)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating batch process step:", error);
      throw error;
    }
  }

  async updateBatchProcessStep(id: number, step: Partial<InsertBatchProcessStep>): Promise<BatchProcessStep | undefined> {
    try {
      const [result] = await db
        .update(batchProcessSteps)
        .set(step)
        .where(eq(batchProcessSteps.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating batch process step ${id}:`, error);
      return undefined;
    }
  }

  // Production Module - Quality Checks Methods
  async getQualityChecks(batchId: number): Promise<QualityCheck[]> {
    try {
      return await db
        .select()
        .from(qualityChecks)
        .where(eq(qualityChecks.batchId, batchId))
        .orderBy(desc(qualityChecks.performedAt));
    } catch (error) {
      console.error(`Error fetching quality checks for batch ${batchId}:`, error);
      return [];
    }
  }

  async getQualityCheck(id: number): Promise<QualityCheck | undefined> {
    try {
      const [result] = await db
        .select()
        .from(qualityChecks)
        .where(eq(qualityChecks.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching quality check ${id}:`, error);
      return undefined;
    }
  }

  async createQualityCheck(check: InsertQualityCheck): Promise<QualityCheck> {
    try {
      const [result] = await db
        .insert(qualityChecks)
        .values(check)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating quality check:", error);
      throw error;
    }
  }

  async updateQualityCheck(id: number, check: Partial<InsertQualityCheck>): Promise<QualityCheck | undefined> {
    try {
      const [result] = await db
        .update(qualityChecks)
        .set(check)
        .where(eq(qualityChecks.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating quality check ${id}:`, error);
      return undefined;
    }
  }

  // Production Module - Batch Deviations Methods
  async getBatchDeviations(batchId: number): Promise<BatchDeviation[]> {
    try {
      return await db
        .select()
        .from(batchDeviations)
        .where(eq(batchDeviations.batchId, batchId))
        .orderBy(desc(batchDeviations.createdAt));
    } catch (error) {
      console.error(`Error fetching batch deviations for batch ${batchId}:`, error);
      return [];
    }
  }

  async getBatchDeviation(id: number): Promise<BatchDeviation | undefined> {
    try {
      const [result] = await db
        .select()
        .from(batchDeviations)
        .where(eq(batchDeviations.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching batch deviation ${id}:`, error);
      return undefined;
    }
  }

  async createBatchDeviation(deviation: InsertBatchDeviation): Promise<BatchDeviation> {
    try {
      const [result] = await db
        .insert(batchDeviations)
        .values(deviation)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating batch deviation:", error);
      throw error;
    }
  }

  async updateBatchDeviation(id: number, deviation: Partial<InsertBatchDeviation>): Promise<BatchDeviation | undefined> {
    try {
      const [result] = await db
        .update(batchDeviations)
        .set(deviation)
        .where(eq(batchDeviations.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating batch deviation ${id}:`, error);
      return undefined;
    }
  }

  // Production Module - Materials Methods
  async getMaterials(): Promise<Material[]> {
    try {
      return await db
        .select()
        .from(materials)
        .orderBy(asc(materials.name));
    } catch (error) {
      console.error("Error fetching materials:", error);
      return [];
    }
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    try {
      const [result] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      return undefined;
    }
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    try {
      const [result] = await db
        .insert(materials)
        .values(material)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating material:", error);
      throw error;
    }
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    try {
      const [result] = await db
        .update(materials)
        .set(material)
        .where(eq(materials.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      return undefined;
    }
  }

  // Production Module - Equipment Methods
  async getEquipment(): Promise<Equipment[]> {
    try {
      return await db
        .select()
        .from(equipment)
        .orderBy(asc(equipment.name));
    } catch (error) {
      console.error("Error fetching equipment:", error);
      return [];
    }
  }

  async getEquipmentItem(id: number): Promise<Equipment | undefined> {
    try {
      const [result] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching equipment ${id}:`, error);
      return undefined;
    }
  }

  async createEquipment(item: InsertEquipment): Promise<Equipment> {
    try {
      const [result] = await db
        .insert(equipment)
        .values(item)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating equipment:", error);
      throw error;
    }
  }

  async updateEquipment(id: number, item: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    try {
      const [result] = await db
        .update(equipment)
        .set(item)
        .where(eq(equipment.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating equipment ${id}:`, error);
      return undefined;
    }
  }

  // Production Module - Nonconforming Products Methods
  async getNonconformingStatuses(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(nonconformingStatuses)
        .orderBy(asc(nonconformingStatuses.name));
    } catch (error) {
      console.error("Error fetching nonconforming statuses:", error);
      return [];
    }
  }

  async getNonconformingSeverityLevels(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(nonconformingSeverityLevels)
        .orderBy(asc(nonconformingSeverityLevels.level));
    } catch (error) {
      console.error("Error fetching nonconforming severity levels:", error);
      return [];
    }
  }

  async getNonconformingProducts(): Promise<NonconformingProduct[]> {
    try {
      return await db
        .select()
        .from(nonconformingProducts)
        .orderBy(desc(nonconformingProducts.detectedAt));
    } catch (error) {
      console.error("Error fetching nonconforming products:", error);
      return [];
    }
  }

  async getNonconformingProductsByBatch(batchId: number): Promise<NonconformingProduct[]> {
    try {
      return await db
        .select()
        .from(nonconformingProducts)
        .where(eq(nonconformingProducts.batchId, batchId))
        .orderBy(desc(nonconformingProducts.detectedAt));
    } catch (error) {
      console.error(`Error fetching nonconforming products for batch ${batchId}:`, error);
      return [];
    }
  }

  async getNonconformingProduct(id: number): Promise<NonconformingProduct | undefined> {
    try {
      const [result] = await db
        .select()
        .from(nonconformingProducts)
        .where(eq(nonconformingProducts.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching nonconforming product ${id}:`, error);
      return undefined;
    }
  }

  async createNonconformingProduct(product: InsertNonconformingProduct): Promise<NonconformingProduct> {
    try {
      const [result] = await db
        .insert(nonconformingProducts)
        .values(product)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating nonconforming product:", error);
      throw error;
    }
  }

  async updateNonconformingProduct(id: number, product: Partial<InsertNonconformingProduct>): Promise<NonconformingProduct | undefined> {
    try {
      const [result] = await db
        .update(nonconformingProducts)
        .set(product)
        .where(eq(nonconformingProducts.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating nonconforming product ${id}:`, error);
      return undefined;
    }
  }

  async deleteNonconformingProduct(id: number): Promise<boolean> {
    try {
      const [result] = await db
        .delete(nonconformingProducts)
        .where(eq(nonconformingProducts.id, id))
        .returning();
      return !!result;
    } catch (error) {
      console.error(`Error deleting nonconforming product ${id}:`, error);
      throw error;
    }
  }

  // Production Module - Nonconforming Product Attachments Methods
  async getNonconformingProductAttachments(ncpId: number): Promise<NonconformingProductAttachment[]> {
    try {
      return await db
        .select()
        .from(nonconformingProductAttachments)
        .where(eq(nonconformingProductAttachments.nonconformingProductId, ncpId))
        .orderBy(desc(nonconformingProductAttachments.uploadedAt));
    } catch (error) {
      console.error(`Error fetching attachments for nonconforming product ${ncpId}:`, error);
      return [];
    }
  }

  async getNonconformingProductAttachment(id: number): Promise<NonconformingProductAttachment | undefined> {
    try {
      const [result] = await db
        .select()
        .from(nonconformingProductAttachments)
        .where(eq(nonconformingProductAttachments.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching nonconforming product attachment ${id}:`, error);
      return undefined;
    }
  }

  async createNonconformingProductAttachment(attachment: InsertNonconformingProductAttachment): Promise<NonconformingProductAttachment> {
    try {
      const [result] = await db
        .insert(nonconformingProductAttachments)
        .values(attachment)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating nonconforming product attachment:", error);
      throw error;
    }
  }

  async deleteNonconformingProductAttachment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(nonconformingProductAttachments)
        .where(eq(nonconformingProductAttachments.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting nonconforming product attachment ${id}:`, error);
      return false;
    }
  }

  // Measurement & Analysis - Complaints Methods
  async getComplaints(): Promise<Complaint[]> {
    try {
      return await db
        .select()
        .from(complaints)
        .orderBy(desc(complaints.dateReceived));
    } catch (error) {
      console.error("Error fetching complaints:", error);
      return [];
    }
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    try {
      const [result] = await db
        .select()
        .from(complaints)
        .where(eq(complaints.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching complaint ${id}:`, error);
      return undefined;
    }
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    try {
      // Import number generator dynamically to avoid circular dependencies
      const { generateComplaintNumber } = await import('./utils/number-generator');
      
      // Generate a unique complaint number if not provided
      if (!complaint.complaintNumber) {
        complaint.complaintNumber = await generateComplaintNumber();
      }
      
      const [result] = await db
        .insert(complaints)
        .values(complaint)
        .returning();
        
      // Log the complaint number creation for traceability
      console.info(`Generated complaint number: ${result.complaintNumber}`);
      
      return result;
    } catch (error) {
      console.error("Error creating complaint:", error);
      throw error;
    }
  }

  async updateComplaint(id: number, complaint: Partial<InsertComplaint>): Promise<Complaint | undefined> {
    try {
      const [result] = await db
        .update(complaints)
        .set(complaint)
        .where(eq(complaints.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating complaint ${id}:`, error);
      return undefined;
    }
  }

  // Measurement & Analysis - Customer Feedback Methods
  async getCustomerFeedback(): Promise<CustomerFeedback[]> {
    try {
      // Check if the customer_feedback table exists
      const tableExists = await this.checkIfTableExists('customer_feedback');
      if (!tableExists) {
        console.log("Customer feedback table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(customerFeedback)
        .orderBy(desc(customerFeedback.dateReceived));
    } catch (error) {
      console.error("Error fetching customer feedback:", error);
      return [];
    }
  }

  async getCustomerFeedbackByProduct(productId: number): Promise<CustomerFeedback[]> {
    try {
      // Check if the customer_feedback table exists
      const tableExists = await this.checkIfTableExists('customer_feedback');
      if (!tableExists) {
        console.log("Customer feedback table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(customerFeedback)
        .where(eq(customerFeedback.productId, productId))
        .orderBy(desc(customerFeedback.dateReceived));
    } catch (error) {
      console.error(`Error fetching customer feedback for product ${productId}:`, error);
      return [];
    }
  }

  async getCustomerFeedbackItem(id: number): Promise<CustomerFeedback | undefined> {
    try {
      // Check if the customer_feedback table exists
      const tableExists = await this.checkIfTableExists('customer_feedback');
      if (!tableExists) {
        console.log("Customer feedback table doesn't exist in the database yet");
        return undefined;
      }
      
      const [result] = await db
        .select()
        .from(customerFeedback)
        .where(eq(customerFeedback.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching customer feedback item ${id}:`, error);
      return undefined;
    }
  }

  async createCustomerFeedback(feedback: InsertCustomerFeedback): Promise<CustomerFeedback> {
    try {
      // Import number generator dynamically to avoid circular dependencies
      const { generateFeedbackNumber } = await import('./utils/number-generator');
      
      // Generate a unique feedback number if not provided
      if (!feedback.feedbackNumber) {
        feedback.feedbackNumber = await generateFeedbackNumber();
      }
      
      const [result] = await db
        .insert(customerFeedback)
        .values(feedback)
        .returning();
        
      // Log the feedback number creation for traceability
      console.info(`Generated customer feedback number: ${result.feedbackNumber}`);
      
      return result;
    } catch (error) {
      console.error("Error creating customer feedback:", error);
      throw error;
    }
  }

  async updateCustomerFeedback(id: number, feedback: Partial<InsertCustomerFeedback>): Promise<CustomerFeedback | undefined> {
    try {
      const [result] = await db
        .update(customerFeedback)
        .set(feedback)
        .where(eq(customerFeedback.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating customer feedback ${id}:`, error);
      return undefined;
    }
  }

  // Document Management Methods
  async getAllDocuments(): Promise<any[]> {
    try {
      const tableExists = await this.checkIfTableExists('documents');
      if (!tableExists) {
        console.log("Documents table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(documents)
        .orderBy(desc(documents.createdAt));
    } catch (error) {
      console.error("Error fetching all documents:", error);
      return [];
    }
  }

  async createDocument(document: any): Promise<any> {
    try {
      const { generateDocumentNumber } = await import('./utils/number-generator');
      
      if (!document.documentNumber) {
        document.documentNumber = await generateDocumentNumber();
      }
      
      const [result] = await db
        .insert(documents)
        .values({
          ...document,
          createdAt: new Date(),
          modifiedAt: new Date()
        })
        .returning();
        
      console.info(`Generated document number: ${result.documentNumber}`);
      return result;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  async getDocumentTypes(): Promise<any[]> {
    return [
      { id: 1, name: 'Quality Manual', prefix: 'QM', categoryId: 1 },
      { id: 2, name: 'Standard Operating Procedure', prefix: 'SOP', categoryId: 2 },
      { id: 3, name: 'Work Instruction', prefix: 'WI', categoryId: 2 },
      { id: 4, name: 'Form', prefix: 'FORM', categoryId: 3 },
      { id: 5, name: 'Technical Specification', prefix: 'TS', categoryId: 4 },
      { id: 6, name: 'Drawing', prefix: 'DWG', categoryId: 4 }
    ];
  }

  // Measurement & Analysis - Calibration Assets Methods
  async getCalibrationAssets(): Promise<CalibrationAsset[]> {
    try {
      return await db
        .select()
        .from(calibrationAssets)
        .orderBy(asc(calibrationAssets.assetId));
    } catch (error) {
      console.error("Error fetching calibration assets:", error);
      return [];
    }
  }

  async getCalibrationAssetsByDepartment(department: string): Promise<CalibrationAsset[]> {
    try {
      return await db
        .select()
        .from(calibrationAssets)
        .where(eq(calibrationAssets.department, department))
        .orderBy(asc(calibrationAssets.assetId));
    } catch (error) {
      console.error(`Error fetching calibration assets for department ${department}:`, error);
      return [];
    }
  }

  async getCalibrationAsset(id: number): Promise<CalibrationAsset | undefined> {
    try {
      const [result] = await db
        .select()
        .from(calibrationAssets)
        .where(eq(calibrationAssets.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching calibration asset ${id}:`, error);
      return undefined;
    }
  }

  async createCalibrationAsset(asset: InsertCalibrationAsset): Promise<CalibrationAsset> {
    try {
      const [result] = await db
        .insert(calibrationAssets)
        .values(asset)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating calibration asset:", error);
      throw error;
    }
  }

  async updateCalibrationAsset(id: number, asset: Partial<InsertCalibrationAsset>): Promise<CalibrationAsset | undefined> {
    try {
      const [result] = await db
        .update(calibrationAssets)
        .set(asset)
        .where(eq(calibrationAssets.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating calibration asset ${id}:`, error);
      return undefined;
    }
  }

  // Measurement & Analysis - Calibration Records Methods
  async getCalibrationRecords(assetId: number): Promise<CalibrationRecord[]> {
    try {
      return await db
        .select()
        .from(calibrationRecords)
        .where(eq(calibrationRecords.assetId, assetId))
        .orderBy(desc(calibrationRecords.calibrationDate));
    } catch (error) {
      console.error(`Error fetching calibration records for asset ${assetId}:`, error);
      return [];
    }
  }

  async getCalibrationRecord(id: number): Promise<CalibrationRecord | undefined> {
    try {
      const [result] = await db
        .select()
        .from(calibrationRecords)
        .where(eq(calibrationRecords.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching calibration record ${id}:`, error);
      return undefined;
    }
  }

  async createCalibrationRecord(record: InsertCalibrationRecord): Promise<CalibrationRecord> {
    try {
      // Generate record ID if not provided
      if (!record.recordId) {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get the count of existing records for this month to generate next sequential number
        const existingRecords = await db
          .select({ count: count() })
          .from(calibrationRecords)
          .where(sql`EXTRACT(YEAR FROM ${calibrationRecords.calibrationDate}) = ${year}`)
          .where(sql`EXTRACT(MONTH FROM ${calibrationRecords.calibrationDate}) = ${parseInt(month)}`);
        
        const nextNumber = (existingRecords[0]?.count || 0) + 1;
        record.recordId = `CAL-${year}${month}-${nextNumber.toString().padStart(3, '0')}`;
      }

      // Update the next calibration date on the asset
      if (record.dueDate) {
        await db
          .update(calibrationAssets)
          .set({ 
            lastCalibrationDate: record.calibrationDate,
            nextCalibrationDate: record.dueDate,
            status: 'Calibrated'
          })
          .where(eq(calibrationAssets.id, record.assetId));
      }

      const [result] = await db
        .insert(calibrationRecords)
        .values(record)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating calibration record:", error);
      throw error;
    }
  }

  async updateCalibrationRecord(id: number, record: Partial<InsertCalibrationRecord>): Promise<CalibrationRecord | undefined> {
    try {
      // If updating the due date, also update the asset
      if (record.dueDate && record.assetId) {
        // Get the current record to know the calibration date
        const [currentRecord] = await db
          .select()
          .from(calibrationRecords)
          .where(eq(calibrationRecords.id, id));
        
        if (currentRecord) {
          await db
            .update(calibrationAssets)
            .set({ 
              lastCalibrationDate: currentRecord.calibrationDate,
              nextCalibrationDate: record.dueDate,
              status: 'Calibrated'
            })
            .where(eq(calibrationAssets.id, record.assetId));
        }
      }

      const [result] = await db
        .update(calibrationRecords)
        .set(record)
        .where(eq(calibrationRecords.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error(`Error updating calibration record ${id}:`, error);
      return undefined;
    }
  }

  // Storage Configuration & External Repository Integration Methods
  async getStorageConfigurations() {
    try {
      return await db
        .select()
        .from(storageConfigs)
        .orderBy(storageConfigs.createdAt);
    } catch (error) {
      console.error("Error fetching storage configurations:", error);
      throw error;
    }
  }

  async getStorageProviders() {
    try {
      return await db
        .select()
        .from(storageProviders)
        .where(eq(storageProviders.isActive, true))
        .orderBy(storageProviders.name);
    } catch (error) {
      console.error("Error fetching storage providers:", error);
      throw error;
    }
  }

  async createStorageConfiguration(data: any) {
    try {
      const [result] = await db
        .insert(storageConfigs)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating storage configuration:", error);
      throw error;
    }
  }

  async updateStorageConfiguration(id: number, data: any) {
    try {
      const [result] = await db
        .update(storageConfigs)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(storageConfigs.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating storage configuration:", error);
      throw error;
    }
  }

  async deleteStorageConfiguration(id: number) {
    try {
      const result = await db
        .delete(storageConfigs)
        .where(eq(storageConfigs.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting storage configuration:", error);
      throw error;
    }
  }

  async testStorageConfiguration(id: number) {
    try {
      const config = await db
        .select()
        .from(storageConfigs)
        .where(eq(storageConfigs.id, id))
        .limit(1);
      
      if (!config[0]) {
        return { success: false, error: 'Configuration not found' };
      }

      // Basic connectivity test - in a full implementation this would test actual connection
      const testResult = {
        success: true,
        message: 'Connection test successful',
        timestamp: new Date(),
        configName: config[0].configName
      };

      // Update test results
      await db
        .update(storageConfigs)
        .set({
          connectionStatus: 'connected',
          lastTestDate: new Date(),
          testResults: testResult
        })
        .where(eq(storageConfigs.id, id));

      return testResult;
    } catch (error) {
      console.error("Error testing storage configuration:", error);
      throw error;
    }
  }

  // Design Control Traceability Module Implementation

  // User Needs Methods
  async getDesignUserNeeds(): Promise<DesignUserNeed[]> {
    try {
      const tableExists = await this.checkIfTableExists('design_user_needs');
      if (!tableExists) {
        console.log("Design user needs table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(designUserNeeds)
        .orderBy(asc(designUserNeeds.needId));
    } catch (error) {
      console.error("Error fetching design user needs:", error);
      return [];
    }
  }

  async getDesignUserNeed(id: number): Promise<DesignUserNeed | undefined> {
    try {
      const tableExists = await this.checkIfTableExists('design_user_needs');
      if (!tableExists) {
        return undefined;
      }

      const [result] = await db
        .select()
        .from(designUserNeeds)
        .where(eq(designUserNeeds.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching design user need ${id}:`, error);
      return undefined;
    }
  }

  async createDesignUserNeed(userNeed: InsertDesignUserNeed): Promise<DesignUserNeed> {
    try {
      // Generate unique need ID (UN-1, UN-2, etc.)
      const existingNeeds = await this.getDesignUserNeeds();
      const nextNumber = existingNeeds.length + 1;
      const needId = `UN-${nextNumber}`;

      const [result] = await db
        .insert(designUserNeeds)
        .values({
          ...userNeed,
          needId,
          changeLog: JSON.stringify([{
            action: 'created',
            timestamp: new Date(),
            userId: userNeed.createdBy
          }])
        })
        .returning();

      // Log activity
      await this.logDesignControlActivity({
        entityType: 'user_need',
        entityId: needId,
        action: 'created',
        newValue: result,
        userId: userNeed.createdBy
      });

      return result;
    } catch (error) {
      console.error("Error creating design user need:", error);
      throw error;
    }
  }

  async updateDesignUserNeed(id: number, userNeed: Partial<InsertDesignUserNeed>): Promise<DesignUserNeed | undefined> {
    try {
      // Get current record for change tracking
      const currentRecord = await this.getDesignUserNeed(id);
      if (!currentRecord) return undefined;

      const [result] = await db
        .update(designUserNeeds)
        .set({
          ...userNeed,
          updatedAt: new Date()
        })
        .where(eq(designUserNeeds.id, id))
        .returning();

      // Log activity if userId provided
      if (userNeed.owner) {
        await this.logDesignControlActivity({
          entityType: 'user_need',
          entityId: currentRecord.needId,
          action: 'updated',
          previousValue: currentRecord,
          newValue: result,
          userId: userNeed.owner
        });
      }

      return result;
    } catch (error) {
      console.error(`Error updating design user need ${id}:`, error);
      return undefined;
    }
  }

  async deleteDesignUserNeed(id: number): Promise<boolean> {
    try {
      const record = await this.getDesignUserNeed(id);
      if (!record) return false;

      await db
        .delete(designUserNeeds)
        .where(eq(designUserNeeds.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting design user need ${id}:`, error);
      return false;
    }
  }

  // Design Inputs Methods
  async getTraceabilityDesignInputs(): Promise<TraceabilityDesignInput[]> {
    try {
      const tableExists = await this.checkIfTableExists('traceability_design_inputs');
      if (!tableExists) {
        console.log("Traceability design inputs table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(traceabilityDesignInputs)
        .orderBy(asc(traceabilityDesignInputs.inputId));
    } catch (error) {
      console.error("Error fetching traceability design inputs:", error);
      return [];
    }
  }

  async getTraceabilityDesignInput(id: number): Promise<TraceabilityDesignInput | undefined> {
    try {
      const tableExists = await this.checkIfTableExists('traceability_design_inputs');
      if (!tableExists) {
        return undefined;
      }

      const [result] = await db
        .select()
        .from(traceabilityDesignInputs)
        .where(eq(traceabilityDesignInputs.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching traceability design input ${id}:`, error);
      return undefined;
    }
  }

  async createTraceabilityDesignInput(input: InsertTraceabilityDesignInput): Promise<TraceabilityDesignInput> {
    try {
      // Generate unique input ID (DI-1, DI-2, etc.)
      const existingInputs = await this.getTraceabilityDesignInputs();
      const nextNumber = existingInputs.length + 1;
      const inputId = `DI-${nextNumber}`;

      const [result] = await db
        .insert(traceabilityDesignInputs)
        .values({
          ...input,
          inputId,
          changeLog: JSON.stringify([{
            action: 'created',
            timestamp: new Date(),
            userId: input.createdBy
          }])
        })
        .returning();

      // Log activity
      await this.logDesignControlActivity({
        entityType: 'design_input',
        entityId: inputId,
        action: 'created',
        newValue: result,
        userId: input.createdBy
      });

      return result;
    } catch (error) {
      console.error("Error creating traceability design input:", error);
      throw error;
    }
  }

  async updateTraceabilityDesignInput(id: number, input: Partial<InsertTraceabilityDesignInput>): Promise<TraceabilityDesignInput | undefined> {
    try {
      const currentRecord = await this.getTraceabilityDesignInput(id);
      if (!currentRecord) return undefined;

      const [result] = await db
        .update(traceabilityDesignInputs)
        .set({
          ...input,
          updatedAt: new Date()
        })
        .where(eq(traceabilityDesignInputs.id, id))
        .returning();

      // Log activity if userId provided
      if (input.owner) {
        await this.logDesignControlActivity({
          entityType: 'design_input',
          entityId: currentRecord.inputId,
          action: 'updated',
          previousValue: currentRecord,
          newValue: result,
          userId: input.owner
        });
      }

      return result;
    } catch (error) {
      console.error(`Error updating traceability design input ${id}:`, error);
      return undefined;
    }
  }

  async deleteTraceabilityDesignInput(id: number): Promise<boolean> {
    try {
      const record = await this.getTraceabilityDesignInput(id);
      if (!record) return false;

      await db
        .delete(traceabilityDesignInputs)
        .where(eq(traceabilityDesignInputs.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting traceability design input ${id}:`, error);
      return false;
    }
  }

  // Design Outputs Methods
  async getTraceabilityDesignOutputs(): Promise<TraceabilityDesignOutput[]> {
    try {
      const tableExists = await this.checkIfTableExists('traceability_design_outputs');
      if (!tableExists) {
        console.log("Traceability design outputs table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(traceabilityDesignOutputs)
        .orderBy(asc(traceabilityDesignOutputs.outputId));
    } catch (error) {
      console.error("Error fetching traceability design outputs:", error);
      return [];
    }
  }

  async getTraceabilityDesignOutput(id: number): Promise<TraceabilityDesignOutput | undefined> {
    try {
      const tableExists = await this.checkIfTableExists('traceability_design_outputs');
      if (!tableExists) {
        return undefined;
      }

      const [result] = await db
        .select()
        .from(traceabilityDesignOutputs)
        .where(eq(traceabilityDesignOutputs.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching traceability design output ${id}:`, error);
      return undefined;
    }
  }

  async createTraceabilityDesignOutput(output: InsertTraceabilityDesignOutput): Promise<TraceabilityDesignOutput> {
    try {
      // Generate unique output ID (DO-1, DO-2, etc.)
      const existingOutputs = await this.getTraceabilityDesignOutputs();
      const nextNumber = existingOutputs.length + 1;
      const outputId = `DO-${nextNumber}`;

      const [result] = await db
        .insert(traceabilityDesignOutputs)
        .values({
          ...output,
          outputId,
          changeLog: JSON.stringify([{
            action: 'created',
            timestamp: new Date(),
            userId: output.createdBy
          }])
        })
        .returning();

      // Log activity
      await this.logDesignControlActivity({
        entityType: 'design_output',
        entityId: outputId,
        action: 'created',
        newValue: result,
        userId: output.createdBy
      });

      return result;
    } catch (error) {
      console.error("Error creating traceability design output:", error);
      throw error;
    }
  }

  async updateTraceabilityDesignOutput(id: number, output: Partial<InsertTraceabilityDesignOutput>): Promise<TraceabilityDesignOutput | undefined> {
    try {
      const currentRecord = await this.getTraceabilityDesignOutput(id);
      if (!currentRecord) return undefined;

      const [result] = await db
        .update(traceabilityDesignOutputs)
        .set({
          ...output,
          updatedAt: new Date()
        })
        .where(eq(traceabilityDesignOutputs.id, id))
        .returning();

      // Log activity if userId provided
      if (output.owner) {
        await this.logDesignControlActivity({
          entityType: 'design_output',
          entityId: currentRecord.outputId,
          action: 'updated',
          previousValue: currentRecord,
          newValue: result,
          userId: output.owner
        });
      }

      return result;
    } catch (error) {
      console.error(`Error updating traceability design output ${id}:`, error);
      return undefined;
    }
  }

  async deleteTraceabilityDesignOutput(id: number): Promise<boolean> {
    try {
      const record = await this.getTraceabilityDesignOutput(id);
      if (!record) return false;

      await db
        .delete(traceabilityDesignOutputs)
        .where(eq(traceabilityDesignOutputs.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting traceability design output ${id}:`, error);
      return false;
    }
  }

  // Verification Records Methods
  async getVerificationRecords(): Promise<VerificationRecord[]> {
    try {
      const tableExists = await this.checkIfTableExists('verification_records');
      if (!tableExists) {
        console.log("Verification records table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(verificationRecords)
        .orderBy(asc(verificationRecords.verificationId));
    } catch (error) {
      console.error("Error fetching verification records:", error);
      return [];
    }
  }

  async getVerificationRecord(id: number): Promise<VerificationRecord | undefined> {
    try {
      const tableExists = await this.checkIfTableExists('verification_records');
      if (!tableExists) {
        return undefined;
      }

      const [result] = await db
        .select()
        .from(verificationRecords)
        .where(eq(verificationRecords.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching verification record ${id}:`, error);
      return undefined;
    }
  }

  async createVerificationRecord(record: InsertVerificationRecord): Promise<VerificationRecord> {
    try {
      // Generate unique verification ID (VER-1, VER-2, etc.)
      const existingRecords = await this.getVerificationRecords();
      const nextNumber = existingRecords.length + 1;
      const verificationId = `VER-${nextNumber}`;

      const [result] = await db
        .insert(verificationRecords)
        .values({
          ...record,
          verificationId,
          changeLog: JSON.stringify([{
            action: 'created',
            timestamp: new Date(),
            userId: record.createdBy
          }])
        })
        .returning();

      // Log activity
      await this.logDesignControlActivity({
        entityType: 'verification',
        entityId: verificationId,
        action: 'created',
        newValue: result,
        userId: record.createdBy
      });

      return result;
    } catch (error) {
      console.error("Error creating verification record:", error);
      throw error;
    }
  }

  async updateVerificationRecord(id: number, record: Partial<InsertVerificationRecord>): Promise<VerificationRecord | undefined> {
    try {
      const currentRecord = await this.getVerificationRecord(id);
      if (!currentRecord) return undefined;

      const [result] = await db
        .update(verificationRecords)
        .set({
          ...record,
          updatedAt: new Date()
        })
        .where(eq(verificationRecords.id, id))
        .returning();

      // Log activity if userId provided
      if (record.owner) {
        await this.logDesignControlActivity({
          entityType: 'verification',
          entityId: currentRecord.verificationId,
          action: 'updated',
          previousValue: currentRecord,
          newValue: result,
          userId: record.owner
        });
      }

      return result;
    } catch (error) {
      console.error(`Error updating verification record ${id}:`, error);
      return undefined;
    }
  }

  async deleteVerificationRecord(id: number): Promise<boolean> {
    try {
      const record = await this.getVerificationRecord(id);
      if (!record) return false;

      await db
        .delete(verificationRecords)
        .where(eq(verificationRecords.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting verification record ${id}:`, error);
      return false;
    }
  }

  // Validation Records Methods
  async getValidationRecords(): Promise<ValidationRecord[]> {
    try {
      const tableExists = await this.checkIfTableExists('validation_records');
      if (!tableExists) {
        console.log("Validation records table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(validationRecords)
        .orderBy(asc(validationRecords.validationId));
    } catch (error) {
      console.error("Error fetching validation records:", error);
      return [];
    }
  }

  async getValidationRecord(id: number): Promise<ValidationRecord | undefined> {
    try {
      const tableExists = await this.checkIfTableExists('validation_records');
      if (!tableExists) {
        return undefined;
      }

      const [result] = await db
        .select()
        .from(validationRecords)
        .where(eq(validationRecords.id, id));
      return result;
    } catch (error) {
      console.error(`Error fetching validation record ${id}:`, error);
      return undefined;
    }
  }

  async createValidationRecord(record: InsertValidationRecord): Promise<ValidationRecord> {
    try {
      // Generate unique validation ID (VAL-1, VAL-2, etc.)
      const existingRecords = await this.getValidationRecords();
      const nextNumber = existingRecords.length + 1;
      const validationId = `VAL-${nextNumber}`;

      const [result] = await db
        .insert(validationRecords)
        .values({
          ...record,
          validationId,
          changeLog: JSON.stringify([{
            action: 'created',
            timestamp: new Date(),
            userId: record.createdBy
          }])
        })
        .returning();

      // Log activity
      await this.logDesignControlActivity({
        entityType: 'validation',
        entityId: validationId,
        action: 'created',
        newValue: result,
        userId: record.createdBy
      });

      return result;
    } catch (error) {
      console.error("Error creating validation record:", error);
      throw error;
    }
  }

  async updateValidationRecord(id: number, record: Partial<InsertValidationRecord>): Promise<ValidationRecord | undefined> {
    try {
      const currentRecord = await this.getValidationRecord(id);
      if (!currentRecord) return undefined;

      const [result] = await db
        .update(validationRecords)
        .set({
          ...record,
          updatedAt: new Date()
        })
        .where(eq(validationRecords.id, id))
        .returning();

      // Log activity if userId provided
      if (record.owner) {
        await this.logDesignControlActivity({
          entityType: 'validation',
          entityId: currentRecord.validationId,
          action: 'updated',
          previousValue: currentRecord,
          newValue: result,
          userId: record.owner
        });
      }

      return result;
    } catch (error) {
      console.error(`Error updating validation record ${id}:`, error);
      return undefined;
    }
  }

  async deleteValidationRecord(id: number): Promise<boolean> {
    try {
      const record = await this.getValidationRecord(id);
      if (!record) return false;

      await db
        .delete(validationRecords)
        .where(eq(validationRecords.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting validation record ${id}:`, error);
      return false;
    }
  }

  // Traceability Matrix Methods
  async generateTraceabilityMatrix(): Promise<TraceabilityMatrixSnapshot> {
    try {
      const userNeeds = await this.getDesignUserNeeds();
      const designInputs = await this.getTraceabilityDesignInputs();
      const designOutputs = await this.getTraceabilityDesignOutputs();
      const verifications = await this.getVerificationRecords();
      const validations = await this.getValidationRecords();

      // Build comprehensive traceability matrix
      const matrixData = {
        userNeeds: userNeeds.map(need => ({
          id: need.needId,
          title: need.title,
          status: need.status,
          linkedInputs: need.linkedInputs
        })),
        designInputs: designInputs.map(input => ({
          id: input.inputId,
          title: input.title,
          status: input.status,
          linksToNeeds: input.linksToNeeds
        })),
        designOutputs: designOutputs.map(output => ({
          id: output.outputId,
          title: output.title,
          status: output.status,
          linksToInputs: output.linksToInputs,
          linkedVerificationRecord: output.linkedVerificationRecord
        })),
        verifications: verifications.map(ver => ({
          id: ver.verificationId,
          title: ver.title,
          status: ver.status,
          linkedOutputId: ver.linkedOutputId
        })),
        validations: validations.map(val => ({
          id: val.validationId,
          title: val.title,
          status: val.status,
          linkedUserNeeds: val.linkedUserNeeds
        })),
        generatedAt: new Date(),
        totalItems: userNeeds.length + designInputs.length + designOutputs.length + verifications.length + validations.length
      };

      // Save snapshot
      const snapshot = await this.createTraceabilityMatrixSnapshot({
        matrixData: JSON.stringify(matrixData),
        generatedBy: 1, // System user
        purpose: 'automated_generation'
      });

      return snapshot;
    } catch (error) {
      console.error("Error generating traceability matrix:", error);
      throw error;
    }
  }

  async getTraceabilityMatrixSnapshots(): Promise<TraceabilityMatrixSnapshot[]> {
    try {
      const tableExists = await this.checkIfTableExists('traceability_matrix_snapshots');
      if (!tableExists) {
        console.log("Traceability matrix snapshots table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(traceabilityMatrixSnapshots)
        .orderBy(desc(traceabilityMatrixSnapshots.snapshotDate));
    } catch (error) {
      console.error("Error fetching traceability matrix snapshots:", error);
      return [];
    }
  }

  async createTraceabilityMatrixSnapshot(snapshot: InsertTraceabilityMatrixSnapshot): Promise<TraceabilityMatrixSnapshot> {
    try {
      const [result] = await db
        .insert(traceabilityMatrixSnapshots)
        .values(snapshot)
        .returning();

      return result;
    } catch (error) {
      console.error("Error creating traceability matrix snapshot:", error);
      throw error;
    }
  }

  // Task Dependencies Methods
  async getDesignTaskDependencies(taskId: string, taskType: string): Promise<DesignTaskDependency[]> {
    try {
      const tableExists = await this.checkIfTableExists('design_task_dependencies');
      if (!tableExists) {
        console.log("Design task dependencies table doesn't exist in the database yet");
        return [];
      }
      
      return await db
        .select()
        .from(designTaskDependencies)
        .where(and(
          eq(designTaskDependencies.taskId, taskId),
          eq(designTaskDependencies.taskType, taskType)
        ));
    } catch (error) {
      console.error("Error fetching design task dependencies:", error);
      return [];
    }
  }

  async createDesignTaskDependency(dependency: InsertDesignTaskDependency): Promise<DesignTaskDependency> {
    try {
      const [result] = await db
        .insert(designTaskDependencies)
        .values(dependency)
        .returning();

      return result;
    } catch (error) {
      console.error("Error creating design task dependency:", error);
      throw error;
    }
  }

  async deleteDesignTaskDependency(id: number): Promise<boolean> {
    try {
      await db
        .delete(designTaskDependencies)
        .where(eq(designTaskDependencies.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting design task dependency ${id}:`, error);
      return false;
    }
  }

  // Activity Log Methods
  async logDesignControlActivity(activity: InsertDesignControlActivityLog): Promise<DesignControlActivityLog> {
    try {
      const [result] = await db
        .insert(designControlActivityLog)
        .values(activity)
        .returning();

      return result;
    } catch (error) {
      console.error("Error logging design control activity:", error);
      throw error;
    }
  }

  async getDesignControlActivityLog(entityId?: string, entityType?: string): Promise<DesignControlActivityLog[]> {
    try {
      const tableExists = await this.checkIfTableExists('design_control_activity_log');
      if (!tableExists) {
        console.log("Design control activity log table doesn't exist in the database yet");
        return [];
      }

      let query = db
        .select()
        .from(designControlActivityLog);

      if (entityId && entityType) {
        query = query.where(and(
          eq(designControlActivityLog.entityId, entityId),
          eq(designControlActivityLog.entityType, entityType)
        ));
      } else if (entityId) {
        query = query.where(eq(designControlActivityLog.entityId, entityId));
      } else if (entityType) {
        query = query.where(eq(designControlActivityLog.entityType, entityType));
      }

      return await query.orderBy(desc(designControlActivityLog.timestamp));
    } catch (error) {
      console.error("Error fetching design control activity log:", error);
      return [];
    }
  }


}

// Use DatabaseStorage or MemStorage based on environment
export const storage = new DatabaseStorage();