import { Logger } from "../utils/logger";
import { eq, isNull } from "drizzle-orm";
import { insertSupplierAssessmentSchema } from "@shared/schema";
import { addDays, isSameDay } from "date-fns";
import { 
  getSupplier, 
  getLatestSupplierAssessment, 
  createSupplierAssessment,
  getActiveSuppliers,
  getSupplierCount as getSupplierCountFromStorage
} from "../storage.supplier";
import { z } from 'zod';

// Define correct types
type InsertSupplierAssessment = z.infer<typeof insertSupplierAssessmentSchema>;

/**
 * Scheduler for supplier assessments based on criticality and risk level
 * Critical suppliers: Assessment annually (every 365 days)
 * Major suppliers with High risk: Assessment every 90 days
 * Others: Based on standard requalification date (typically annual)
 */
export async function scheduleSupplierAssessment(supplierId: number): Promise<boolean> {
  try {
    // Verify supplier exists and get details
    const supplier = await getSupplier(supplierId);
    if (!supplier) {
      Logger.error(`Cannot schedule assessment: Supplier with ID ${supplierId} not found`);
      return false;
    }

    // Get the latest assessment for this supplier
    const latestAssessment = await getLatestSupplierAssessment(supplierId);
    
    // Determine assessment interval based on criticality and risk level
    let assessmentIntervalDays = 365; // Default annual assessment
    let riskReason = "Standard supplier"; // For logging purposes
    
    if (supplier.criticality === "Critical") {
      assessmentIntervalDays = 365; // Critical suppliers: annually
      riskReason = "Critical supplier";
      Logger.info(`Supplier ${supplier.name} is Critical - scheduling assessment annually (${assessmentIntervalDays} days)`);
    } else if (supplier.criticality === "Major" && supplier.currentRiskLevel === "High") {
      assessmentIntervalDays = 90; // Major suppliers with High risk: every 90 days
      riskReason = "Major supplier with High risk";
      Logger.info(`Supplier ${supplier.name} is Major with High risk - scheduling assessment every ${assessmentIntervalDays} days`);
    }
    
    // Calculate the scheduled date
    const scheduledDate = latestAssessment 
      ? addDays(new Date(latestAssessment.scheduledDate), assessmentIntervalDays)
      : addDays(new Date(), 30); // If no previous assessment, schedule one in 30 days
    
    // Create a new assessment record
    const assessment: InsertSupplierAssessment = {
      supplierId,
      assessmentType: "Risk Assessment",
      scheduledDate,
      status: "Scheduled",
      createdBy: 1, // Default to system user (ID 1) - should be updated to actual admin user
      updatedBy: 1,
      findings: `Auto-scheduled based on risk profile: ${riskReason}. Assessment interval: ${assessmentIntervalDays} days.`,
      suggestions: "Please add improvement suggestions after assessment completion."
    };
    
    // Attempt to create the assessment
    try {
      await createSupplierAssessment(assessment);
      
      Logger.info(`Successfully scheduled assessment for supplier ${supplier.name} (ID: ${supplierId}) on ${scheduledDate.toISOString()}`);
      return true;
    } catch (dbError) {
      // Handle database-specific errors
      const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      Logger.error(`Database error when creating supplier assessment: ${dbErrorMessage}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Failed to schedule supplier assessment: ${errorMessage}`);
    return false;
  }
}

/**
 * Check all suppliers and schedule assessments for those that require it
 * This function would typically be called by a daily cron job
 */
/**
 * Batch processing function to check all suppliers and schedule assessments 
 * based on risk profile: Critical suppliers (60-day), Major with High risk (90-day)
 * @returns Number of successfully scheduled assessments
 */
export async function checkAndScheduleAssessments(): Promise<number> {
  try {
    // Get all active (non-archived) suppliers
    const suppliers = await getActiveSuppliers();
    
    if (!suppliers || suppliers.length === 0) {
      Logger.warn("No active suppliers found for assessment scheduling");
      return 0;
    }
    
    Logger.info(`Starting assessment scheduling for ${suppliers.length} active suppliers`);
    
    let scheduledCount = 0;
    let errorCount = 0;
    const processingErrors: string[] = [];
    
    // Process each supplier
    for (const supplier of suppliers) {
      try {
        // Check if supplier has essential data
        if (!supplier.id || !supplier.criticality) {
          Logger.warn(`Skipping supplier ID ${supplier.id}: Missing required risk data`);
          continue;
        }
        
        // Get the latest assessment for this supplier
        const latestAssessment = await getLatestSupplierAssessment(supplier.id);
        
        // Determine if a new assessment is needed
        let needsAssessment = false;
        
        if (!latestAssessment) {
          // No previous assessment exists - schedule initial assessment
          needsAssessment = true;
          Logger.info(`Supplier ${supplier.name} (ID: ${supplier.id}) has no previous assessments - scheduling initial assessment`);
        } else {
          // Calculate the threshold date based on criticality and risk
          let assessmentIntervalDays = 365; // Default annual
          
          if (supplier.criticality === "Critical") {
            assessmentIntervalDays = 365; // 365-day (annual) interval for Critical suppliers
          } else if (supplier.criticality === "Major" && supplier.currentRiskLevel === "High") {
            assessmentIntervalDays = 90; // 90-day interval for Major suppliers with High risk
          }
          
          const lastAssessmentDate = new Date(latestAssessment.scheduledDate);
          const thresholdDate = addDays(lastAssessmentDate, assessmentIntervalDays);
          
          // Determine if it's time for a new assessment (threshold date is today or in the past)
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Compare dates only (ignore time)
          
          if (thresholdDate <= today) {
            needsAssessment = true;
            Logger.info(`Supplier ${supplier.name} (ID: ${supplier.id}) requires new assessment. Last: ${lastAssessmentDate.toISOString()}, Threshold: ${thresholdDate.toISOString()}`);
          }
        }
        
        // Schedule an assessment if needed
        if (needsAssessment) {
          const scheduled = await scheduleSupplierAssessment(supplier.id);
          if (scheduled) {
            scheduledCount++;
          } else {
            errorCount++;
            processingErrors.push(`Failed to schedule assessment for supplier ${supplier.name} (ID: ${supplier.id})`);
          }
        }
      } catch (supplierError) {
        // Handle errors for individual supplier processing without stopping the entire batch
        errorCount++;
        const errorMessage = supplierError instanceof Error ? supplierError.message : String(supplierError);
        processingErrors.push(`Error processing supplier ID ${supplier.id}: ${errorMessage}`);
        Logger.error(`Error during individual supplier assessment scheduling: ${errorMessage}`);
      }
    }
    
    // Log results of batch processing
    Logger.info(`Assessment scheduling completed: ${scheduledCount} scheduled, ${errorCount} errors`);
    
    if (errorCount > 0) {
      Logger.error(`Assessment scheduling errors: ${processingErrors.join("; ")}`);
    }
    
    return scheduledCount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Failed to check and schedule supplier assessments: ${errorMessage}`);
    return 0;
  }
}

/**
 * Initialize the supplier assessment scheduler to run daily checks
 * This should be called when the server starts up
 */
export async function initializeSupplierAssessmentScheduler(): Promise<void> {
  Logger.info('Initializing supplier assessment scheduler');
  
  // First verify that we can access supplier data - validation test
  try {
    const supplierCount = await getSupplierCount();
    Logger.info(`Supplier assessment system initialized. Found ${supplierCount} suppliers in the system.`);
    
    // Only set up scheduling if suppliers exist
    if (supplierCount > 0) {
      // Check if we need to schedule assessments immediately on startup (delayed to ensure DB is ready)
      setTimeout(async () => {
        try {
          Logger.info('Running initial supplier assessment check');
          const count = await checkAndScheduleAssessments();
          Logger.info(`Initial check complete. Scheduled ${count} supplier assessments`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          Logger.error(`Error during initial assessment scheduling: ${errorMessage}`);
        }
      }, 10000); // 10 seconds after initialization
      
      // Set up daily check - runs once every 24 hours (at midnight)
      const scheduleDailyCheck = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        // Schedule the check
        setTimeout(async () => {
          try {
            Logger.info('Running daily supplier assessment check');
            await checkAndScheduleAssessments();
          } catch (schedulingError) {
            const errorMessage = schedulingError instanceof Error ? schedulingError.message : String(schedulingError);
            Logger.error(`Error during daily assessment scheduling: ${errorMessage}`);
          } finally {
            // Always schedule the next check even if this one failed
            scheduleDailyCheck();
          }
        }, timeUntilMidnight);
        
        Logger.info(`Next supplier assessment check scheduled for ${tomorrow.toISOString()}`);
      };
      
      // Start the daily schedule
      scheduleDailyCheck();
    } else {
      Logger.warn('No suppliers found in the system. Assessment scheduling will not be active.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Failed to initialize supplier assessment scheduler: ${errorMessage}`);
  }
}

/**
 * Helper function to get the number of suppliers in the system
 * Used for verification and testing
 */
async function getSupplierCount(): Promise<number> {
  const count = await getSupplierCountFromStorage();
  return typeof count === 'number' ? count : 0;
}