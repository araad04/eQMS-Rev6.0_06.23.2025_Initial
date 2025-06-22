import express, { Request, Response } from "express";
import { db } from "./db";
import { regulatoryReportabilityAssessments, suppliers } from "../shared/schema";
import { eq } from "drizzle-orm";

export const regulatoryReportabilityRouter = express.Router();

// Get all regulatory reportability assessments
regulatoryReportabilityRouter.get("/", async (req: Request, res: Response) => {
  try {
    const assessments = await db.select().from(regulatoryReportabilityAssessments);
    res.json(assessments);
  } catch (error) {
    console.error("Error fetching regulatory reportability assessments:", error);
    res.status(500).json({ error: "Failed to fetch regulatory reportability assessments" });
  }
});

// Get regulatory reportability assessments for a specific supplier
regulatoryReportabilityRouter.get("/supplier/:id", async (req: Request, res: Response) => {
  try {
    const supplierId = parseInt(req.params.id);
    
    // First verify the supplier exists
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);
    
    if (!supplier || supplier.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    const assessments = await db
      .select()
      .from(regulatoryReportabilityAssessments)
      .where(eq(regulatoryReportabilityAssessments.supplierId, supplierId))
      .orderBy(regulatoryReportabilityAssessments.createdAt);
    
    res.json(assessments);
  } catch (error) {
    console.error(`Error fetching regulatory reportability assessments for supplier ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch regulatory reportability assessments" });
  }
});

// Get a specific regulatory reportability assessment
regulatoryReportabilityRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);
    
    const assessment = await db
      .select()
      .from(regulatoryReportabilityAssessments)
      .where(eq(regulatoryReportabilityAssessments.id, assessmentId))
      .limit(1);
    
    if (!assessment || assessment.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    
    res.json(assessment[0]);
  } catch (error) {
    console.error(`Error fetching regulatory reportability assessment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch regulatory reportability assessment" });
  }
});

// Create a new regulatory reportability assessment
regulatoryReportabilityRouter.post("/", async (req: Request, res: Response) => {
  try {
    const {
      supplierId,
      assessmentId,
      incidentDate,
      productInvolved,
      incidentDescription,
      isFieldAction,
      isDeviceFailure,
      isAdverseEvent,
      patientHarm,
      reportabilityDecision,
      reportabilityJustification,
      decisionTreePath,
      regulatoryAuthorities,
      reportingDeadline,
      reportedDate,
      reportNumbers,
    } = req.body;

    // Use user ID from request if available, otherwise use a default
    const userId = req.user?.id || 9999; // Default to development user ID if not authenticated

    // Verify the supplier exists
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);
    
    if (!supplier || supplier.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Insert the assessment
    const [newAssessment] = await db
      .insert(regulatoryReportabilityAssessments)
      .values({
        supplierId,
        assessmentId,
        incidentDate: new Date(incidentDate),
        productInvolved,
        incidentDescription,
        isFieldAction: isFieldAction || false,
        isDeviceFailure: isDeviceFailure || false,
        isAdverseEvent: isAdverseEvent || false,
        patientHarm,
        reportabilityDecision,
        reportabilityJustification,
        decisionTreePath: decisionTreePath || [],
        regulatoryAuthorities: regulatoryAuthorities || [],
        reportingDeadline: reportingDeadline ? new Date(reportingDeadline) : null,
        reportedDate: reportedDate ? new Date(reportedDate) : null,
        reportNumbers: reportNumbers || {},
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    res.status(201).json(newAssessment);
  } catch (error) {
    console.error("Error creating regulatory reportability assessment:", error);
    res.status(500).json({ error: "Failed to create regulatory reportability assessment" });
  }
});

// Update a regulatory reportability assessment
regulatoryReportabilityRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);
    
    // Use user ID from request if available, otherwise use a default
    const userId = req.user?.id || 9999; // Default to development user ID if not authenticated
    
    // Verify the assessment exists
    const assessment = await db
      .select()
      .from(regulatoryReportabilityAssessments)
      .where(eq(regulatoryReportabilityAssessments.id, assessmentId))
      .limit(1);
    
    if (!assessment || assessment.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    
    // Update the fields that are provided in the request
    const updateData: any = {
      ...req.body,
      updatedBy: userId,
      updatedAt: new Date(),
    };
    
    // Handle date fields
    if (updateData.incidentDate) {
      updateData.incidentDate = new Date(updateData.incidentDate);
    }
    if (updateData.reportingDeadline) {
      updateData.reportingDeadline = new Date(updateData.reportingDeadline);
    }
    if (updateData.reportedDate) {
      updateData.reportedDate = new Date(updateData.reportedDate);
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    
    const [updatedAssessment] = await db
      .update(regulatoryReportabilityAssessments)
      .set(updateData)
      .where(eq(regulatoryReportabilityAssessments.id, assessmentId))
      .returning();
    
    res.json(updatedAssessment);
  } catch (error) {
    console.error(`Error updating regulatory reportability assessment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update regulatory reportability assessment" });
  }
});

// Delete a regulatory reportability assessment
regulatoryReportabilityRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);
    
    // Verify the assessment exists
    const assessment = await db
      .select()
      .from(regulatoryReportabilityAssessments)
      .where(eq(regulatoryReportabilityAssessments.id, assessmentId))
      .limit(1);
    
    if (!assessment || assessment.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    
    // Delete the assessment
    await db
      .delete(regulatoryReportabilityAssessments)
      .where(eq(regulatoryReportabilityAssessments.id, assessmentId));
    
    res.status(204).end();
  } catch (error) {
    console.error(`Error deleting regulatory reportability assessment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete regulatory reportability assessment" });
  }
});