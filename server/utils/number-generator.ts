import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Generates a sequential number with leading zeros
 * @param currentNumber Current highest number
 * @param digits Number of digits to pad
 * @returns Formatted sequential number with leading zeros
 */
function formatSequentialNumber(currentNumber: number, digits: number = 3): string {
  return currentNumber.toString().padStart(digits, '0');
}

/**
 * Gets the current year as a 4-digit string
 * @returns Current year (e.g., "2025")
 */
function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Generates an automatic complaint number in the format CMP-YYYY-XXX
 * where YYYY is the current year and XXX is a sequential number padded with leading zeros
 * This ensures unique, traceable complaint identifiers for regulatory compliance
 * @returns Generated complaint number
 */
export async function generateComplaintNumber(): Promise<string> {
  try {
    const year = getCurrentYear();
    const prefix = `CMP-${year}-`;
    
    // Get highest current number for this year
    const result = await db.execute(sql`
      SELECT MAX(CAST(SUBSTRING(complaint_number FROM LENGTH(${prefix}) + 1) AS INTEGER)) as max_num
      FROM complaints
      WHERE complaint_number LIKE ${prefix + '%'}
    `);
    
    const maxNum = result.rows?.[0]?.max_num;
    const maxNumber = maxNum ? parseInt(maxNum.toString()) : 0;
    const nextNumber = maxNumber + 1;
    
    return `${prefix}${formatSequentialNumber(nextNumber)}`;
  } catch (error) {
    console.error("Error generating complaint number:", error);
    // Provide fallback in case of DB error for critical complaint recording functionality
    const year = getCurrentYear();
    const prefix = `CMP-${year}-`;
    const timestamp = Date.now().toString().slice(-5);
    return `${prefix}${timestamp}`;
  }
}

/**
 * Generates an automatic number for management reviews in the format MR-YYYY-XXX
 * where YYYY is the current year and XXX is a sequential number padded with leading zeros
 * @returns Generated management review number
 */
export async function generateManagementReviewNumber(): Promise<string> {
  try {
    const year = getCurrentYear();
    const prefix = `MR-${year}-`;
    
    // Get highest current number for this year by extracting from title
    const result = await db.execute(sql`
      SELECT MAX(CAST(SUBSTRING(title FROM '${`MR-${year}-`}(\\d+)') AS INTEGER)) as max_num
      FROM management_reviews
      WHERE title LIKE ${prefix + '%'}
    `);
    
    const maxNum = result.rows?.[0]?.max_num;
    const maxNumber = maxNum ? parseInt(maxNum.toString()) : 0;
    const nextNumber = maxNumber + 1;
    
    return `${prefix}${formatSequentialNumber(nextNumber)}`;
  } catch (error) {
    console.error("Error generating management review number:", error);
    // Provide fallback in case of error
    const year = getCurrentYear();
    const prefix = `MR-${year}-`;
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${formatSequentialNumber(randomSuffix)}`;
  }
}

/**
 * Generates a design project code based on project type (NP/DC/SD) in the format DP-YYYY-XXX
 * This matches the required format from bug DES001.
 * 
 * @param typeCode Project type code (NP, DC, SD) - Not used anymore per requirements
 * @returns Generated project code in the format DP-YYYY-XXX
 */
export async function generateDesignProjectCode(typeCode: string): Promise<string> {
  try {
    const year = getCurrentYear();
    const prefix = `DP-${year}-`;
    
    // Get highest current number for this year 
    const result = await db.execute(sql`
      SELECT MAX(CAST(SUBSTRING(project_code FROM LENGTH(${prefix}) + 1) AS INTEGER)) as max_num
      FROM design_projects
      WHERE project_code LIKE ${prefix + '%'}
    `);
    
    const maxNum = result.rows?.[0]?.max_num;
    const maxNumber = maxNum ? parseInt(maxNum.toString()) : 0;
    const nextNumber = maxNumber + 1;
    
    return `${prefix}${formatSequentialNumber(nextNumber)}`;
  } catch (error) {
    console.error(`Error generating design project code:`, error);
    // Provide fallback in case of error to ensure the function never fails
    const year = getCurrentYear();
    const timestamp = Date.now().toString().slice(-3);
    return `DP-${year}-${timestamp}`;
  }
}

/**
 * Generates a batch number for production in the format B-YYYY-XXX
 * where YYYY is the current year and XXX is a sequential number padded with leading zeros
 * @returns Generated batch number
 */
export async function generateBatchNumber(): Promise<string> {
  try {
    const year = getCurrentYear();
    const prefix = `B-${year}-`;
    
    // Get highest current number for this year
    const result = await db.execute(sql`
      SELECT MAX(CAST(SUBSTRING(batch_number FROM LENGTH(${prefix}) + 1) AS INTEGER)) as max_num
      FROM production_batches
      WHERE batch_number LIKE ${prefix + '%'}
    `);
    
    const maxNum = result.rows?.[0]?.max_num;
    const maxNumber = maxNum ? parseInt(maxNum.toString()) : 0;
    const nextNumber = maxNumber + 1;
    
    return `${prefix}${formatSequentialNumber(nextNumber)}`;
  } catch (error) {
    console.error("Error generating batch number:", error);
    throw error;
  }
}

/**
 * Generates an automatic feedback number in the format FBK-YYYY-XXX
 * where YYYY is the current year and XXX is a sequential number padded with leading zeros
 * This ensures unique, traceable feedback identifiers for regulatory compliance
 * Implementation for requirement FEE004
 * @returns Generated feedback number in format FBK-YYYY-XXX
 */
export async function generateFeedbackNumber(): Promise<string> {
  try {
    const year = getCurrentYear();
    const prefix = `FBK-${year}-`;
    
    // Get highest current number for this year
    const result = await db.execute(sql`
      SELECT MAX(CAST(SUBSTRING(feedback_number FROM LENGTH(${prefix}) + 1) AS INTEGER)) as max_num
      FROM customer_feedback
      WHERE feedback_number LIKE ${prefix + '%'}
    `);
    
    const maxNum = result.rows?.[0]?.max_num;
    const maxNumber = maxNum ? parseInt(maxNum.toString()) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format with 3 digits (e.g., FBK-2025-001, FBK-2025-002, etc.)
    return `${prefix}${formatSequentialNumber(nextNumber)}`;
  } catch (error) {
    console.error("Error generating feedback number:", error);
    // Provide fallback in case of DB error for critical feedback recording functionality
    const year = getCurrentYear();
    const prefix = `FBK-${year}-`;
    // Use current date+time components to minimize collision risk if DB is unavailable
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    return `${prefix}${day}${hour}${minute}`;
  }
}