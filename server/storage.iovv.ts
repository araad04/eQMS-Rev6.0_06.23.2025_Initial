import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  iovvMatrices,
  requirements,
  specifications,
  verificationTests,
  validationTests,
  validationEvidence,
  defects,
  testExecutionLogs,
  type SelectIovvMatrix,
  type SelectRequirement,
  type SelectSpecification,
  type SelectVerificationTest,
  type SelectValidationTest,
  type SelectValidationEvidence,
  type SelectDefect,
  type SelectTestExecutionLog,
  type IovvMatrix,
  type Requirement,
  type Specification,
  type VerificationTest,
  type ValidationTest,
  type ValidationEvidence,
  type Defect,
  type TestExecutionLog,
} from "@shared/schema.iovv";
import { users } from "@shared/schema";
import { IOVVMatrix as IOVVMatrixFrontend } from "@/utils/iovv-matrix";

interface IIOVVStorage {
  // Matrix operations
  getIovvMatrix(id: number): Promise<SelectIovvMatrix | undefined>;
  getIovvMatrixByModule(module: string, version?: string): Promise<SelectIovvMatrix | undefined>;
  createIovvMatrix(matrix: IovvMatrix): Promise<SelectIovvMatrix>;
  updateIovvMatrix(id: number, matrix: Partial<IovvMatrix>): Promise<SelectIovvMatrix | undefined>;
  
  // Requirements operations
  getRequirements(matrixId: number): Promise<SelectRequirement[]>;
  createRequirement(requirement: Requirement): Promise<SelectRequirement>;
  
  // Specifications operations
  getSpecifications(matrixId: number): Promise<SelectSpecification[]>;
  createSpecification(specification: Specification): Promise<SelectSpecification>;
  
  // Verification tests operations
  getVerificationTests(matrixId: number): Promise<SelectVerificationTest[]>;
  createVerificationTest(test: VerificationTest): Promise<SelectVerificationTest>;
  updateVerificationTest(id: string, test: Partial<VerificationTest>): Promise<SelectVerificationTest | undefined>;
  
  // Validation tests operations
  getValidationTests(matrixId: number): Promise<SelectValidationTest[]>;
  createValidationTest(test: ValidationTest): Promise<SelectValidationTest>;
  updateValidationTest(id: string, test: Partial<ValidationTest>): Promise<SelectValidationTest | undefined>;
  
  // Validation evidence operations
  getValidationEvidence(testId: string): Promise<SelectValidationEvidence[]>;
  createValidationEvidence(evidence: ValidationEvidence): Promise<SelectValidationEvidence>;
  
  // Defects operations
  getDefects(matrixId: number): Promise<SelectDefect[]>;
  createDefect(defect: Defect): Promise<SelectDefect>;
  updateDefect(id: string, defect: Partial<Defect>): Promise<SelectDefect | undefined>;
  
  // Test execution operations
  createTestExecutionLog(log: TestExecutionLog): Promise<SelectTestExecutionLog>;
  getTestExecutionLogs(testId: string, testType: string): Promise<SelectTestExecutionLog[]>;
  
  // Composite operations
  getFullIovvMatrix(matrixId: number): Promise<IOVVMatrixFrontend | undefined>;
}

export class IOVVStorage implements IIOVVStorage {
  // Matrix operations
  async getIovvMatrix(id: number): Promise<SelectIovvMatrix | undefined> {
    const [matrix] = await db.select().from(iovvMatrices).where(eq(iovvMatrices.id, id));
    return matrix;
  }
  
  async getIovvMatrixByModule(module: string, version?: string): Promise<SelectIovvMatrix | undefined> {
    const query = version 
      ? and(eq(iovvMatrices.module, module), eq(iovvMatrices.version, version))
      : eq(iovvMatrices.module, module);
    
    const matrices = await db.select().from(iovvMatrices).where(query).orderBy(iovvMatrices.version);
    
    // If version is not specified, return the latest version
    if (!version && matrices.length > 0) {
      return matrices[matrices.length - 1];
    }
    
    return matrices[0];
  }
  
  async createIovvMatrix(matrix: IovvMatrix): Promise<SelectIovvMatrix> {
    const [newMatrix] = await db.insert(iovvMatrices).values(matrix).returning();
    return newMatrix;
  }
  
  async updateIovvMatrix(id: number, matrix: Partial<IovvMatrix>): Promise<SelectIovvMatrix | undefined> {
    const [updatedMatrix] = await db
      .update(iovvMatrices)
      .set({ ...matrix, lastUpdated: new Date() })
      .where(eq(iovvMatrices.id, id))
      .returning();
    
    return updatedMatrix;
  }
  
  // Requirements operations
  async getRequirements(matrixId: number): Promise<SelectRequirement[]> {
    return db.select().from(requirements).where(eq(requirements.matrixId, matrixId));
  }
  
  async createRequirement(requirement: Requirement): Promise<SelectRequirement> {
    const [newRequirement] = await db.insert(requirements).values(requirement).returning();
    return newRequirement;
  }
  
  // Specifications operations
  async getSpecifications(matrixId: number): Promise<SelectSpecification[]> {
    return db.select().from(specifications).where(eq(specifications.matrixId, matrixId));
  }
  
  async createSpecification(specification: Specification): Promise<SelectSpecification> {
    const [newSpecification] = await db.insert(specifications).values(specification).returning();
    return newSpecification;
  }
  
  // Verification tests operations
  async getVerificationTests(matrixId: number): Promise<SelectVerificationTest[]> {
    return db.select().from(verificationTests).where(eq(verificationTests.matrixId, matrixId));
  }
  
  async createVerificationTest(test: VerificationTest): Promise<SelectVerificationTest> {
    const [newTest] = await db.insert(verificationTests).values(test).returning();
    return newTest;
  }
  
  async updateVerificationTest(id: string, test: Partial<VerificationTest>): Promise<SelectVerificationTest | undefined> {
    const [updatedTest] = await db
      .update(verificationTests)
      .set(test)
      .where(eq(verificationTests.testId, id))
      .returning();
    
    return updatedTest;
  }
  
  // Validation tests operations
  async getValidationTests(matrixId: number): Promise<SelectValidationTest[]> {
    return db.select().from(validationTests).where(eq(validationTests.matrixId, matrixId));
  }
  
  async createValidationTest(test: ValidationTest): Promise<SelectValidationTest> {
    const [newTest] = await db.insert(validationTests).values(test).returning();
    return newTest;
  }
  
  async updateValidationTest(id: string, test: Partial<ValidationTest>): Promise<SelectValidationTest | undefined> {
    const [updatedTest] = await db
      .update(validationTests)
      .set(test)
      .where(eq(validationTests.testId, id))
      .returning();
    
    return updatedTest;
  }
  
  // Validation evidence operations
  async getValidationEvidence(testId: string): Promise<SelectValidationEvidence[]> {
    return db.select().from(validationEvidence).where(eq(validationEvidence.testId, testId));
  }
  
  async createValidationEvidence(evidence: ValidationEvidence): Promise<SelectValidationEvidence> {
    const [newEvidence] = await db.insert(validationEvidence).values(evidence).returning();
    return newEvidence;
  }
  
  // Defects operations
  async getDefects(matrixId: number): Promise<SelectDefect[]> {
    return db.select().from(defects).where(eq(defects.matrixId, matrixId));
  }
  
  async createDefect(defect: Defect): Promise<SelectDefect> {
    const [newDefect] = await db.insert(defects).values(defect).returning();
    return newDefect;
  }
  
  async updateDefect(id: string, defect: Partial<Defect>): Promise<SelectDefect | undefined> {
    const [updatedDefect] = await db
      .update(defects)
      .set(defect)
      .where(eq(defects.defectId, id))
      .returning();
    
    return updatedDefect;
  }
  
  // Test execution operations
  async createTestExecutionLog(log: TestExecutionLog): Promise<SelectTestExecutionLog> {
    const [newLog] = await db.insert(testExecutionLogs).values(log).returning();
    return newLog;
  }
  
  async getTestExecutionLogs(testId: string, testType: string): Promise<SelectTestExecutionLog[]> {
    return db
      .select()
      .from(testExecutionLogs)
      .where(and(
        eq(testExecutionLogs.testId, testId),
        eq(testExecutionLogs.testType, testType)
      ))
      .orderBy(sql`${testExecutionLogs.startTime} DESC`);
  }
  
  // Composite operations
  async getFullIovvMatrix(matrixId: number): Promise<IOVVMatrixFrontend | undefined> {
    // Get the matrix
    const matrix = await this.getIovvMatrix(matrixId);
    if (!matrix) return undefined;
    
    // Get all related data
    const [
      matrixRequirements,
      matrixSpecifications,
      matrixVerificationTests,
      matrixValidationTests,
      matrixDefects,
      user
    ] = await Promise.all([
      this.getRequirements(matrixId),
      this.getSpecifications(matrixId),
      this.getVerificationTests(matrixId),
      this.getValidationTests(matrixId),
      this.getDefects(matrixId),
      db.select().from(users).where(eq(users.id, matrix.updatedBy))
    ]);
    
    // Get all validation evidence
    const validationTestIds = matrixValidationTests.map(test => test.testId);
    const allEvidence = await db
      .select()
      .from(validationEvidence)
      .where(inArray(validationEvidence.testId, validationTestIds));
    
    // Map evidence to tests
    const evidenceMap = new Map<string, SelectValidationEvidence[]>();
    allEvidence.forEach(evidence => {
      const testId = evidence.testId;
      if (!evidenceMap.has(testId)) {
        evidenceMap.set(testId, []);
      }
      evidenceMap.get(testId)!.push(evidence);
    });
    
    // Transform to frontend model
    const frontendMatrix: IOVVMatrixFrontend = {
      module: matrix.module,
      version: matrix.version,
      status: matrix.status as any,
      lastUpdated: matrix.lastUpdated.toISOString(),
      updatedBy: user?.[0]?.username || 'system',
      requirements: matrixRequirements.map(req => ({
        id: req.requirementId,
        description: req.description,
        source: req.source as any,
        priority: req.priority as any,
        riskLevel: req.riskLevel as any,
        regulatoryReference: req.regulatoryReference as any
      })),
      specifications: matrixSpecifications.map(spec => ({
        id: spec.specificationId,
        description: spec.description,
        type: spec.type as any,
        relatedRequirements: spec.relatedRequirements as any,
        implementationLocation: spec.implementationLocation as any
      })),
      verificationTests: matrixVerificationTests.map(test => ({
        id: test.testId,
        description: test.description,
        testType: test.testType as any,
        relatedSpecifications: test.relatedSpecifications as any,
        testMethod: test.testMethod,
        testScript: test.testScript as any,
        expectedResult: test.expectedResult,
        actualResult: test.actualResult || undefined,
        status: test.status as any,
        executionDate: test.executionDate?.toISOString(),
        executedBy: test.executedBy
      })),
      validationTests: matrixValidationTests.map(test => {
        const evidence = evidenceMap.get(test.testId) || [];
        return {
          id: test.testId,
          description: test.description,
          testType: test.testType as any,
          relatedRequirements: test.relatedRequirements as any,
          testMethod: test.testMethod,
          testScript: test.testScript as any,
          expectedResult: test.expectedResult,
          actualResult: test.actualResult || undefined,
          status: test.status as any,
          executionDate: test.executionDate?.toISOString(),
          executedBy: test.executedBy,
          evidence: evidence.map(e => ({
            type: e.type as any,
            path: e.path
          }))
        };
      }),
      defects: matrixDefects.map(defect => ({
        id: defect.defectId,
        description: defect.description,
        severity: defect.severity as any,
        status: defect.status as any,
        relatedTests: defect.relatedTests as any,
        relatedRequirements: defect.relatedRequirements as any,
        resolution: defect.resolution,
        reportedDate: defect.reportedDate.toISOString(),
        reportedBy: defect.reportedBy,
        assignedTo: defect.assignedTo,
        resolvedDate: defect.resolvedDate?.toISOString(),
        resolvedBy: defect.resolvedBy,
        verifiedDate: defect.verifiedDate?.toISOString(),
        verifiedBy: defect.verifiedBy,
        impact: defect.impact as any
      }))
    };
    
    return frontendMatrix;
  }
}

export const iovvStorage = new IOVVStorage();