import { db } from "./db";
import { eq, desc, asc, and, isNotNull, lte } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser,
  Document, InsertDocument,
  Capa, InsertCapa,
  Audit, InsertAudit,
  TrainingModule, InsertTrainingModule,
  TrainingRecord, InsertTrainingRecord,
  RiskAssessment, InsertRiskAssessment,
  Supplier, InsertSupplier,
  CalibrationAsset, InsertCalibrationAsset,
  CalibrationRecord, InsertCalibrationRecord,
  MaintenanceAsset, InsertMaintenanceAsset,
  MaintenanceRecord, InsertMaintenanceRecord,
  Metric, InsertMetric,
  MetricValue, InsertMetricValue,
  RiskScore, InsertRiskScore
} from "@shared/schema";

const { 
  users, documents, capas, audits, trainingModules, trainingRecords,
  riskAssessments, suppliers, calibrationAssets, calibrationRecords,
  maintenanceAssets, maintenanceRecords, metrics, metricValues, riskScores
} = schema;

export class DatabaseStorage {
  // Metrics management
  async updateMetric(id: number, metric: Partial<Metric>): Promise<Metric | undefined> {
    const result = await db
      .update(metrics)
      .set({
        ...metric,
        updatedAt: new Date()
      })
      .where(eq(metrics.id, id))
      .returning();
    
    if (result.length === 0) {
      return undefined;
    }
    
    return result[0];
  }
  
  async deleteMetric(id: number): Promise<boolean> {
    const result = await db
      .delete(metrics)
      .where(eq(metrics.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async getMetricValues(metricId: number): Promise<MetricValue[]> {
    return await db
      .select()
      .from(metricValues)
      .where(eq(metricValues.metricId, metricId))
      .orderBy(desc(metricValues.timestamp));
  }
  
  async addMetricValue(value: InsertMetricValue): Promise<MetricValue> {
    const [result] = await db.insert(metricValues).values(value).returning();
    return result;
  }
  
  async getRiskScoresByProcess(processId: number): Promise<RiskScore[]> {
    return await db
      .select()
      .from(riskScores)
      .where(eq(riskScores.processId, processId))
      .orderBy(desc(riskScores.timestamp));
  }
  
  async addRiskScore(score: InsertRiskScore): Promise<RiskScore> {
    const [result] = await db.insert(riskScores).values(score).returning();
    return result;
  }

  // Calibration Assets
  async getCalibrationAssets(): Promise<CalibrationAsset[]> {
    return await db.select().from(calibrationAssets).orderBy(desc(calibrationAssets.updatedAt));
  }

  async getCalibrationAsset(id: number): Promise<CalibrationAsset | undefined> {
    const result = await db.select().from(calibrationAssets).where(eq(calibrationAssets.id, id));
    return result[0];
  }

  async getCalibrationAssetByAssetId(assetId: string): Promise<CalibrationAsset | undefined> {
    const result = await db.select().from(calibrationAssets).where(eq(calibrationAssets.assetId, assetId));
    return result[0];
  }

  async createCalibrationAsset(asset: InsertCalibrationAsset): Promise<CalibrationAsset> {
    const result = await db.insert(calibrationAssets).values(asset).returning();
    return result[0];
  }

  async updateCalibrationAsset(id: number, asset: Partial<CalibrationAsset>): Promise<CalibrationAsset> {
    const result = await db
      .update(calibrationAssets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(calibrationAssets.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Calibration asset with ID ${id} not found`);
    }
    
    return result[0];
  }

  async getCalibrationAssetsDueForCalibration(days: number): Promise<CalibrationAsset[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await db
      .select()
      .from(calibrationAssets)
      .where(
        and(
          isNotNull(calibrationAssets.nextCalibrationDate),
          lte(calibrationAssets.nextCalibrationDate, futureDate)
        )
      )
      .orderBy(asc(calibrationAssets.nextCalibrationDate));
  }

  // Calibration Records
  async getCalibrationRecords(assetId?: number): Promise<CalibrationRecord[]> {
    let query = db.select().from(calibrationRecords);
    
    if (assetId) {
      query = query.where(eq(calibrationRecords.calibrationAssetId, assetId));
    }
    
    return await query.orderBy(desc(calibrationRecords.calibrationDate));
  }

  async getCalibrationRecord(id: number): Promise<CalibrationRecord | undefined> {
    const result = await db.select().from(calibrationRecords).where(eq(calibrationRecords.id, id));
    return result[0];
  }

  async createCalibrationRecord(record: InsertCalibrationRecord): Promise<CalibrationRecord> {
    const result = await db.insert(calibrationRecords).values(record).returning();
    
    // Update the asset's last and next calibration dates
    if (record.nextCalibrationDate) {
      await db
        .update(calibrationAssets)
        .set({
          lastCalibrationDate: record.calibrationDate,
          nextCalibrationDate: record.nextCalibrationDate,
          updatedAt: new Date()
        })
        .where(eq(calibrationAssets.id, record.calibrationAssetId));
    }
    
    return result[0];
  }

  async updateCalibrationRecord(id: number, record: Partial<CalibrationRecord>): Promise<CalibrationRecord> {
    const existingRecord = await this.getCalibrationRecord(id);
    if (!existingRecord) {
      throw new Error(`Calibration record with ID ${id} not found`);
    }
    
    const result = await db
      .update(calibrationRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(calibrationRecords.id, id))
      .returning();
    
    // Update the asset's last and next calibration dates if changed
    if (record.nextCalibrationDate || record.calibrationDate) {
      const asset = await db.select().from(calibrationAssets).where(eq(calibrationAssets.id, existingRecord.calibrationAssetId));
      
      if (asset.length > 0) {
        const updates: Partial<CalibrationAsset> = { updatedAt: new Date() };
        
        if (record.calibrationDate) {
          updates.lastCalibrationDate = record.calibrationDate;
        }
        
        if (record.nextCalibrationDate) {
          updates.nextCalibrationDate = record.nextCalibrationDate;
        }
        
        await db
          .update(calibrationAssets)
          .set(updates)
          .where(eq(calibrationAssets.id, existingRecord.calibrationAssetId));
      }
    }
    
    return result[0];
  }

  // Maintenance Assets
  async getMaintenanceAssets(): Promise<MaintenanceAsset[]> {
    return await db.select().from(maintenanceAssets).orderBy(desc(maintenanceAssets.updatedAt));
  }

  async getMaintenanceAsset(id: number): Promise<MaintenanceAsset | undefined> {
    const result = await db.select().from(maintenanceAssets).where(eq(maintenanceAssets.id, id));
    return result[0];
  }

  async getMaintenanceAssetByAssetId(assetId: string): Promise<MaintenanceAsset | undefined> {
    const result = await db.select().from(maintenanceAssets).where(eq(maintenanceAssets.assetId, assetId));
    return result[0];
  }

  async createMaintenanceAsset(asset: InsertMaintenanceAsset): Promise<MaintenanceAsset> {
    const result = await db.insert(maintenanceAssets).values(asset).returning();
    return result[0];
  }

  async updateMaintenanceAsset(id: number, asset: Partial<MaintenanceAsset>): Promise<MaintenanceAsset> {
    const result = await db
      .update(maintenanceAssets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(maintenanceAssets.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Maintenance asset with ID ${id} not found`);
    }
    
    return result[0];
  }

  async getMaintenanceAssetsDueForMaintenance(days: number): Promise<MaintenanceAsset[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await db
      .select()
      .from(maintenanceAssets)
      .where(
        and(
          isNotNull(maintenanceAssets.nextMaintenanceDate),
          lte(maintenanceAssets.nextMaintenanceDate, futureDate)
        )
      )
      .orderBy(asc(maintenanceAssets.nextMaintenanceDate));
  }

  // Maintenance Records
  async getMaintenanceRecords(assetId?: number): Promise<MaintenanceRecord[]> {
    let query = db.select().from(maintenanceRecords);
    
    if (assetId) {
      query = query.where(eq(maintenanceRecords.maintenanceAssetId, assetId));
    }
    
    return await query.orderBy(desc(maintenanceRecords.maintenanceDate));
  }

  async getMaintenanceRecord(id: number): Promise<MaintenanceRecord | undefined> {
    const result = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id));
    return result[0];
  }

  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const result = await db.insert(maintenanceRecords).values(record).returning();
    
    // Update the asset's last and next maintenance dates
    if (record.nextMaintenanceDate) {
      await db
        .update(maintenanceAssets)
        .set({
          lastMaintenanceDate: record.maintenanceDate,
          nextMaintenanceDate: record.nextMaintenanceDate,
          updatedAt: new Date()
        })
        .where(eq(maintenanceAssets.id, record.maintenanceAssetId));
    }
    
    return result[0];
  }

  async updateMaintenanceRecord(id: number, record: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const existingRecord = await this.getMaintenanceRecord(id);
    if (!existingRecord) {
      throw new Error(`Maintenance record with ID ${id} not found`);
    }
    
    const result = await db
      .update(maintenanceRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(maintenanceRecords.id, id))
      .returning();
    
    // Update the asset's last and next maintenance dates if changed
    if (record.nextMaintenanceDate || record.maintenanceDate) {
      const asset = await db.select().from(maintenanceAssets).where(eq(maintenanceAssets.id, existingRecord.maintenanceAssetId));
      
      if (asset.length > 0) {
        const updates: Partial<MaintenanceAsset> = { updatedAt: new Date() };
        
        if (record.maintenanceDate) {
          updates.lastMaintenanceDate = record.maintenanceDate;
        }
        
        if (record.nextMaintenanceDate) {
          updates.nextMaintenanceDate = record.nextMaintenanceDate;
        }
        
        await db
          .update(maintenanceAssets)
          .set(updates)
          .where(eq(maintenanceAssets.id, existingRecord.maintenanceAssetId));
      }
    }
    
    return result[0];
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Document management
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }
  
  async getDocumentByDocumentId(documentId: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.documentId, documentId));
    return result[0];
  }
  
  async getDocumentsByStatus(statusId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.statusId, statusId));
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }
  
  async updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined> {
    const result = await db.update(documents)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return result[0];
  }

  // CAPA management
  async getCapas(): Promise<Capa[]> {
    return await db.select().from(capas);
  }
  
  async getCapa(id: number): Promise<Capa | undefined> {
    const result = await db.select().from(capas).where(eq(capas.id, id));
    return result[0];
  }
  
  async getCapasByStatus(statusId: number): Promise<Capa[]> {
    return await db.select().from(capas).where(eq(capas.statusId, statusId));
  }
  
  async createCapa(capa: InsertCapa): Promise<Capa> {
    const result = await db.insert(capas).values(capa).returning();
    return result[0];
  }
  
  async updateCapa(id: number, capa: Partial<Capa>): Promise<Capa | undefined> {
    const result = await db.update(capas)
      .set({ ...capa, updatedAt: new Date() })
      .where(eq(capas.id, id))
      .returning();
    return result[0];
  }

  // Audit management
  async getAudits(): Promise<Audit[]> {
    return await db.select().from(audits);
  }
  
  async getAudit(id: number): Promise<Audit | undefined> {
    const result = await db.select().from(audits).where(eq(audits.id, id));
    return result[0];
  }
  
  async getAuditsByStatus(statusId: number): Promise<Audit[]> {
    return await db.select().from(audits).where(eq(audits.statusId, statusId));
  }
  
  async createAudit(audit: InsertAudit): Promise<Audit> {
    const result = await db.insert(audits).values(audit).returning();
    return result[0];
  }
  
  async updateAudit(id: number, audit: Partial<Audit>): Promise<Audit | undefined> {
    const result = await db.update(audits)
      .set({ ...audit, updatedAt: new Date() })
      .where(eq(audits.id, id))
      .returning();
    return result[0];
  }

  // Training management
  async getTrainingModules(): Promise<TrainingModule[]> {
    return await db.select().from(trainingModules);
  }
  
  async getTrainingModule(id: number): Promise<TrainingModule | undefined> {
    const result = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
    return result[0];
  }
  
  async createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule> {
    const result = await db.insert(trainingModules).values(module).returning();
    return result[0];
  }
  
  async getTrainingRecords(): Promise<TrainingRecord[]> {
    return await db.select().from(trainingRecords);
  }
  
  async getTrainingRecordsForUser(userId: number): Promise<TrainingRecord[]> {
    return await db.select().from(trainingRecords).where(eq(trainingRecords.userId, userId));
  }
  
  async createTrainingRecord(record: InsertTrainingRecord): Promise<TrainingRecord> {
    const result = await db.insert(trainingRecords).values(record).returning();
    return result[0];
  }
  
  async updateTrainingRecord(id: number, record: Partial<TrainingRecord>): Promise<TrainingRecord | undefined> {
    const result = await db.update(trainingRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(trainingRecords.id, id))
      .returning();
    return result[0];
  }

  // Risk management
  async getRiskAssessments(): Promise<RiskAssessment[]> {
    return await db.select().from(riskAssessments);
  }
  
  async getRiskAssessment(id: number): Promise<RiskAssessment | undefined> {
    const result = await db.select().from(riskAssessments).where(eq(riskAssessments.id, id));
    return result[0];
  }
  
  async createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const result = await db.insert(riskAssessments).values(assessment).returning();
    return result[0];
  }
  
  async updateRiskAssessment(id: number, assessment: Partial<RiskAssessment>): Promise<RiskAssessment | undefined> {
    const result = await db.update(riskAssessments)
      .set({ ...assessment, updatedAt: new Date() })
      .where(eq(riskAssessments.id, id))
      .returning();
    return result[0];
  }

  // Supplier management
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(supplier).returning();
    return result[0];
  }
  
  async updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier | undefined> {
    const result = await db.update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  // Activity logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(log).returning();
    return result[0];
  }
  
  // Management review
  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews);
  }
  
  async getReview(id: number): Promise<Review | undefined> {
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result[0];
  }
  
  async getReviewsByStatus(statusId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.statusId, statusId));
  }
  
  // Nonconforming Product Management (ISO 13485:2016 section 8.3)
  async getNonconformingSeverityLevels(): Promise<NonconformingSeverityLevel[]> {
    return await db.select().from(nonconformingSeverityLevels);
  }

  async getNonconformingStatuses(): Promise<NonconformingStatus[]> {
    return await db.select().from(nonconformingStatuses);
  }
  
  async getNonconformingProducts(): Promise<NonconformingProduct[]> {
    return await db.select().from(nonconformingProducts)
      .orderBy(desc(nonconformingProducts.createdAt));
  }

  async getNonconformingProductsByBatch(batchId: number): Promise<NonconformingProduct[]> {
    return await db.select().from(nonconformingProducts)
      .where(eq(nonconformingProducts.batchId, batchId))
      .orderBy(desc(nonconformingProducts.createdAt));
  }

  async getNonconformingProduct(id: number): Promise<NonconformingProduct | undefined> {
    const [result] = await db.select().from(nonconformingProducts)
      .where(eq(nonconformingProducts.id, id));
    return result;
  }

  async getNonconformingProductByNcpId(ncpId: string): Promise<NonconformingProduct | undefined> {
    const [result] = await db.select().from(nonconformingProducts)
      .where(eq(nonconformingProducts.ncpId, ncpId));
    return result;
  }

  async createNonconformingProduct(product: InsertNonconformingProduct): Promise<NonconformingProduct> {
    // Generate a nonconforming product ID if not provided
    if (!product.ncpId) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const count = await db.select({ count: count() }).from(nonconformingProducts);
      const nextId = (count[0]?.count || 0) + 1;
      product.ncpId = `NCP-${currentYear}-${currentMonth.toString().padStart(2, '0')}${nextId.toString().padStart(3, '0')}`;
    }

    const [result] = await db.insert(nonconformingProducts)
      .values(product)
      .returning();
    
    return result;
  }

  async updateNonconformingProduct(id: number, product: Partial<NonconformingProduct>): Promise<NonconformingProduct | undefined> {
    const [result] = await db.update(nonconformingProducts)
      .set({
        ...product,
        updatedAt: new Date()
      })
      .where(eq(nonconformingProducts.id, id))
      .returning();
    
    return result;
  }
  
  async getNonconformingProductAttachments(ncpId: number): Promise<NonconformingProductAttachment[]> {
    return await db.select().from(nonconformingProductAttachments)
      .where(eq(nonconformingProductAttachments.ncpId, ncpId))
      .orderBy(desc(nonconformingProductAttachments.uploadedAt));
  }

  async createNonconformingProductAttachment(attachment: InsertNonconformingProductAttachment): Promise<NonconformingProductAttachment> {
    const [result] = await db.insert(nonconformingProductAttachments)
      .values(attachment)
      .returning();
    
    return result;
  }
}
