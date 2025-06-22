import { Express } from "express";
import { iovvStorage } from "./storage.iovv";
import { z } from "zod";
import {
  insertIovvMatrixSchema,
  insertRequirementSchema,
  insertSpecificationSchema,
  insertVerificationTestSchema,
  insertValidationTestSchema,
  insertValidationEvidenceSchema,
  insertDefectSchema,
  insertTestExecutionLogSchema,
} from "@shared/schema.iovv";
import { runAutomatedTests } from "../client/src/utils/iovv-matrix";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Configure multer for evidence uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure evidence directory exists
const evidenceDir = path.join(process.cwd(), "public", "evidence");
if (!existsSync(evidenceDir)) {
  mkdirSync(evidenceDir, { recursive: true });
}

export function registerIOVVRoutes(app: Express) {
  // Get full IOVV matrix by module and version
  app.get("/api/design-control/iovv-matrix", async (req, res) => {
    try {
      const module = req.query.module as string || "Design Control";
      const version = req.query.version as string | undefined;
      
      const matrixRecord = await iovvStorage.getIovvMatrixByModule(module, version);
      if (!matrixRecord) {
        return res.status(404).json({ error: "IOVV matrix not found" });
      }
      
      const fullMatrix = await iovvStorage.getFullIovvMatrix(matrixRecord.id);
      if (!fullMatrix) {
        return res.status(404).json({ error: "Failed to retrieve full IOVV matrix" });
      }
      
      res.json(fullMatrix);
    } catch (error) {
      console.error("Error retrieving IOVV matrix:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Create a new IOVV matrix
  app.post("/api/design-control/iovv-matrix", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const validation = insertIovvMatrixSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }
      
      const matrix = await iovvStorage.createIovvMatrix({
        ...validation.data,
        updatedBy: req.user.id,
      });
      
      res.status(201).json(matrix);
    } catch (error) {
      console.error("Error creating IOVV matrix:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update IOVV matrix status
  app.patch("/api/design-control/iovv-matrix/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const matrixId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["Draft", "In Review", "Approved", "Obsolete"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const matrix = await iovvStorage.updateIovvMatrix(matrixId, {
        status,
        updatedBy: req.user.id,
      });
      
      if (!matrix) {
        return res.status(404).json({ error: "IOVV matrix not found" });
      }
      
      res.json(matrix);
    } catch (error) {
      console.error("Error updating IOVV matrix:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Add a requirement to the matrix
  app.post("/api/design-control/iovv-matrix/:id/requirements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const matrixId = parseInt(req.params.id);
      
      const validation = insertRequirementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }
      
      const requirement = await iovvStorage.createRequirement({
        ...validation.data,
        matrixId,
      });
      
      await iovvStorage.updateIovvMatrix(matrixId, {
        updatedBy: req.user.id,
      });
      
      res.status(201).json(requirement);
    } catch (error) {
      console.error("Error adding requirement:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Add a specification to the matrix
  app.post("/api/design-control/iovv-matrix/:id/specifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const matrixId = parseInt(req.params.id);
      
      const validation = insertSpecificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }
      
      const specification = await iovvStorage.createSpecification({
        ...validation.data,
        matrixId,
      });
      
      await iovvStorage.updateIovvMatrix(matrixId, {
        updatedBy: req.user.id,
      });
      
      res.status(201).json(specification);
    } catch (error) {
      console.error("Error adding specification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Add a verification test to the matrix
  app.post("/api/design-control/iovv-matrix/:id/verification-tests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const matrixId = parseInt(req.params.id);
      
      const validation = insertVerificationTestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }
      
      const test = await iovvStorage.createVerificationTest({
        ...validation.data,
        matrixId,
      });
      
      await iovvStorage.updateIovvMatrix(matrixId, {
        updatedBy: req.user.id,
      });
      
      res.status(201).json(test);
    } catch (error) {
      console.error("Error adding verification test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Add a validation test to the matrix
  app.post("/api/design-control/iovv-matrix/:id/validation-tests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const matrixId = parseInt(req.params.id);
      
      const validation = insertValidationTestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }
      
      const test = await iovvStorage.createValidationTest({
        ...validation.data,
        matrixId,
      });
      
      await iovvStorage.updateIovvMatrix(matrixId, {
        updatedBy: req.user.id,
      });
      
      res.status(201).json(test);
    } catch (error) {
      console.error("Error adding validation test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Add a defect to the matrix
  app.post("/api/design-control/iovv-matrix/:id/defects", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const matrixId = parseInt(req.params.id);
      
      const validation = insertDefectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }
      
      const defect = await iovvStorage.createDefect({
        ...validation.data,
        matrixId,
        reportedDate: new Date(),
        reportedBy: req.user.username,
      });
      
      await iovvStorage.updateIovvMatrix(matrixId, {
        updatedBy: req.user.id,
      });
      
      res.status(201).json(defect);
    } catch (error) {
      console.error("Error adding defect:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update verification test status
  app.patch("/api/design-control/verification-tests/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const testId = req.params.id;
      const { status, actualResult } = req.body;
      
      if (!["Passed", "Failed", "Blocked", "Not Run"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const test = await iovvStorage.updateVerificationTest(testId, {
        status,
        actualResult,
        executionDate: new Date(),
        executedBy: req.user.username,
      });
      
      if (!test) {
        return res.status(404).json({ error: "Verification test not found" });
      }
      
      res.json(test);
    } catch (error) {
      console.error("Error updating verification test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update validation test status
  app.patch("/api/design-control/validation-tests/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const testId = req.params.id;
      const { status, actualResult } = req.body;
      
      if (!["Passed", "Failed", "Blocked", "Not Run"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const test = await iovvStorage.updateValidationTest(testId, {
        status,
        actualResult,
        executionDate: new Date(),
        executedBy: req.user.username,
      });
      
      if (!test) {
        return res.status(404).json({ error: "Validation test not found" });
      }
      
      res.json(test);
    } catch (error) {
      console.error("Error updating validation test:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Upload validation evidence
  app.post("/api/design-control/validation-tests/:id/evidence", upload.single("file"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const testId = req.params.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const { description, type } = req.body;
      
      if (!type || !["Screenshot", "Document", "Log", "Other"].includes(type)) {
        return res.status(400).json({ error: "Invalid evidence type" });
      }
      
      // Generate unique filename with original extension
      const originalExt = path.extname(file.originalname);
      const filename = `${uuidv4()}${originalExt}`;
      const relativePath = `/evidence/${filename}`;
      const fullPath = path.join(evidenceDir, filename);
      
      // Save file
      await writeFile(fullPath, file.buffer);
      
      // Create evidence record
      const evidence = await iovvStorage.createValidationEvidence({
        testId,
        type,
        path: relativePath,
        description: description || undefined,
        uploadedBy: req.user.id,
      });
      
      res.status(201).json(evidence);
    } catch (error) {
      console.error("Error uploading evidence:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update defect status
  app.patch("/api/design-control/defects/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const defectId = req.params.id;
      const { status, resolution } = req.body;
      
      if (!["Open", "In Progress", "Fixed", "Verified", "Closed", "Deferred"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const updates: any = { status };
      
      if (resolution) {
        updates.resolution = resolution;
      }
      
      if (status === "Fixed") {
        updates.resolvedDate = new Date();
        updates.resolvedBy = req.user.username;
      } else if (status === "Verified") {
        updates.verifiedDate = new Date();
        updates.verifiedBy = req.user.username;
      }
      
      const defect = await iovvStorage.updateDefect(defectId, updates);
      
      if (!defect) {
        return res.status(404).json({ error: "Defect not found" });
      }
      
      res.json(defect);
    } catch (error) {
      console.error("Error updating defect:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Run automated verification tests
  app.post("/api/design-control/iovv-matrix/:id/run-tests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const matrixId = parseInt(req.params.id);
      
      // Get the full matrix for automated testing
      const fullMatrix = await iovvStorage.getFullIovvMatrix(matrixId);
      if (!fullMatrix) {
        return res.status(404).json({ error: "IOVV matrix not found" });
      }
      
      // Create a log entry for the test run
      const startTime = new Date();
      let executionSuccess = true;
      let errorMessage = '';
      
      try {
        // Run the actual tests
        const updatedMatrix = await runAutomatedTests(fullMatrix, req.user.username);
        
        // Update test statuses in database
        for (const test of updatedMatrix.verificationTests) {
          if (test.executionDate && test.status !== 'Not Run') {
            await iovvStorage.updateVerificationTest(test.id, {
              status: test.status,
              actualResult: test.actualResult,
              executionDate: new Date(test.executionDate),
              executedBy: test.executedBy,
            });
          }
        }
      } catch (error) {
        executionSuccess = false;
        errorMessage = error.message;
        console.error("Error running automated tests:", error);
      }
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Log the execution
      await iovvStorage.createTestExecutionLog({
        testId: 'batch-execution',
        testType: 'Automated',
        status: executionSuccess ? 'Passed' : 'Failed',
        message: executionSuccess ? 'All tests executed successfully' : `Execution failed: ${errorMessage}`,
        startTime,
        endTime,
        duration,
        executedBy: req.user.id,
      });
      
      // Get the updated matrix
      const updatedFullMatrix = await iovvStorage.getFullIovvMatrix(matrixId);
      
      res.json({
        success: executionSuccess,
        message: executionSuccess ? 'Tests executed successfully' : `Test execution failed: ${errorMessage}`,
        matrix: updatedFullMatrix,
      });
    } catch (error) {
      console.error("Error running tests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}