import { db } from "./db";
import { Logger } from "./utils/logger";
import { 
  suppliers, 
  supplierCategories, 
  supplierStatuses,
  supplierAssessments,
  users,
  insertSupplierAssessmentSchema
} from "@shared/schema";
import { eq, desc, and, isNull, ne } from "drizzle-orm";
import { z } from "zod";

// Define the supplier assessment type
type InsertSupplierAssessment = z.infer<typeof insertSupplierAssessmentSchema>;

// Get all suppliers
export async function getSuppliers() {
  try {
    return await db.select().from(suppliers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error fetching suppliers: ${errorMessage}`);
    throw error;
  }
}

// Get active (non-archived) suppliers
export async function getActiveSuppliers() {
  try {
    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isArchived, false));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error fetching active suppliers: ${errorMessage}`);
    throw error;
  }
}

// Get a supplier by ID
export async function getSupplier(id: number) {
  try {
    const results = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id));
    
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error fetching supplier ${id}: ${errorMessage}`);
    throw error;
  }
}

// Get all supplier assessments
export async function getSupplierAssessments() {
  try {
    return await db
      .select()
      .from(supplierAssessments)
      .orderBy(desc(supplierAssessments.createdAt));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error fetching supplier assessments: ${errorMessage}`);
    throw error;
  }
}

// Get a specific supplier assessment by ID
// Create a new supplier
export async function createSupplier(supplierData: any) {
  try {
    const result = await db.insert(suppliers).values(supplierData).returning();
    return result[0];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error creating supplier: ${errorMessage}`);
    throw error;
  }
}

// Update a supplier
export async function updateSupplier(id: number, supplierData: any) {
  try {
    const result = await db
      .update(suppliers)
      .set({
        ...supplierData,
        updatedAt: new Date()
      })
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error updating supplier: ${errorMessage}`);
    throw error;
  }
}

export async function getSupplierAssessment(id: number) {
  try {
    const results = await db
      .select()
      .from(supplierAssessments)
      .where(eq(supplierAssessments.id, id));
    
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error fetching supplier assessment ${id}: ${errorMessage}`);
    throw error;
  }
}

// Get the latest assessment for a supplier
export async function getLatestSupplierAssessment(supplierId: number) {
  try {
    const results = await db
      .select()
      .from(supplierAssessments)
      .where(eq(supplierAssessments.supplierId, supplierId))
      .orderBy(desc(supplierAssessments.scheduledDate))
      .limit(1);
    
    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error getting latest assessment for supplier ${supplierId}: ${errorMessage}`);
    return null;
  }
}

// Create a new supplier assessment
export async function createSupplierAssessment(assessment: InsertSupplierAssessment) {
  try {
    const [result] = await db
      .insert(supplierAssessments)
      .values({
        ...assessment,
        attachmentUrls: assessment.attachmentUrls || []
      } as any)
      .returning();
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error creating supplier assessment: ${errorMessage}`);
    throw error;
  }
}

// Update a supplier assessment
export async function updateSupplierAssessment(id: number, data: Partial<InsertSupplierAssessment>) {
  try {
    // Handle date conversion if needed
    let updateData = { ...data };
    
    if (data.conductedDate && typeof data.conductedDate === 'string') {
      updateData.conductedDate = new Date(data.conductedDate);
    }

    // Execute the update
    const [updated] = await db
      .update(supplierAssessments)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(supplierAssessments.id, id))
      .returning();
    
    return updated;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error updating supplier assessment ${id}: ${errorMessage}`);
    throw error;
  }
}

// Get count of suppliers
export async function getSupplierCount() {
  try {
    const result = await db
      .select({ count: count(suppliers.id) })
      .from(suppliers)
      .where(eq(suppliers.isArchived, false));
    
    return result[0].count;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Error counting suppliers: ${errorMessage}`);
    return 0;
  }
}

// Helper function for counting records
function count(column: any) {
  return sql`count(${column})`;
}

// Import sql helper for complex queries
import { sql } from "drizzle-orm";