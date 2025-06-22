
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function cleanupTestData() {
  try {
    console.log('Starting test data cleanup...');
    
    // List of tables to truncate
    const tables = [
      'management_reviews',
      'management_review_inputs',
      'management_review_action_items',
      'management_review_signatures',
      'capas',
      'capa_actions',
      'capa_evidence',
      'capa_verifications',
      'capa_communications',
      'complaints',
      'customer_feedback',
      'calibration_assets',
      'calibration_records',
      'audits',
      'audit_checklist_items',
      'design_projects',
      'documents',
      'document_approvals',
      'suppliers',
      'supplier_certifications',
      'users'
    ];
    
    // Truncate each table individually using parameterized queries
    for (const table of tables) {
      console.log(`Truncating table: ${table}`);
      await db.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE`);
    }

    console.log('Successfully cleaned up test data');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

cleanupTestData().catch(console.error);
