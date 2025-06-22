import { db } from './db';
import { sql } from 'drizzle-orm';
import { Logger } from './utils/logger';

// Define the CountResult type at the top of the file to avoid reference errors
type CountResult = { count: string | number };

/**
 * Initialize database tables based on schema
 * This ensures all required tables exist when the application starts
 */
export async function initializeDatabase() {
  try {
    Logger.info('Initializing database...');
    
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as connection_test`);
    Logger.info(`Database connection successful: ${
      result && Array.isArray(result) && result.length > 0 
        ? JSON.stringify(result[0]) 
        : 'Connection verified'
    }`);
    
    // Create users table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        department TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create documents table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        document_id TEXT NOT NULL UNIQUE,
        type_id INTEGER NOT NULL,
        status_id INTEGER NOT NULL,
        revision TEXT NOT NULL,
        file_path TEXT,
        created_by INTEGER NOT NULL,
        approved_by INTEGER,
        effective_date TIMESTAMP,
        expiration_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create document_versions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_versions (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        version_number TEXT NOT NULL,
        file_path TEXT,
        created_by INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create document_approvals table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_approvals (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        comments TEXT,
        signature_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create management_reviews table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS management_reviews (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'scheduled' NOT NULL,
        review_type TEXT NOT NULL,
        review_date TIMESTAMP NOT NULL,
        approval_date TIMESTAMP,
        created_by INTEGER NOT NULL,
        scheduled_by INTEGER NOT NULL,
        purpose TEXT,
        scope TEXT,
        minutes TEXT,
        conclusion TEXT,
        creation_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    // Create management_review_inputs table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS management_review_inputs (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL,
        title TEXT,
        category TEXT,
        description TEXT,
        source TEXT,
        source_id INTEGER,
        data JSONB,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create management_review_input_categories table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS management_review_input_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        required BOOLEAN DEFAULT TRUE,
        display_order INTEGER NOT NULL
      )
    `);
    
    // Create management_review_action_items table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS management_review_action_items (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL,
        description TEXT,
        assigned_to INTEGER,
        due_date TIMESTAMP,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'medium',
        completed_by INTEGER,
        completed_date TIMESTAMP,
        verified_by INTEGER,
        verified_date TIMESTAMP,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create management_review_signatures table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS management_review_signatures (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT,
        signature_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Seed default management review input categories
    try {
      // Check if the table exists but is empty
      const categoryCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM management_review_input_categories
      `);
      
      let count = 0;
      if (Array.isArray(categoryCount) && categoryCount.length > 0) {
        const countValue = (categoryCount[0] as unknown as CountResult).count;
        count = typeof countValue === 'string' ? parseInt(countValue, 10) : (countValue as number);
      }
      
      // Only seed categories if the table is empty
      if (count === 0) {
        Logger.info('Management review categories table is empty, seeding default categories');
        
        const categories = [
          { name: 'Quality Objectives', description: 'Status of quality objectives and key performance indicators', required: true, display_order: 10 },
          { name: 'Audit Results', description: 'Results of internal and external audits', required: true, display_order: 20 },
          { name: 'Customer Feedback', description: 'Feedback, complaints, and satisfaction metrics from customers', required: true, display_order: 30 },
          { name: 'Process Performance', description: 'Performance metrics for manufacturing and quality processes', required: true, display_order: 40 },
          { name: 'CAPA Status', description: 'Status of corrective and preventive actions', required: true, display_order: 50 },
          { name: 'Follow-up Actions', description: 'Status of actions from previous management reviews', required: true, display_order: 60 },
          { name: 'Change Management', description: 'Significant changes that could affect the quality system', required: false, display_order: 70 },
          { name: 'Recommendations', description: 'Recommendations for improvement', required: false, display_order: 80 }
        ];
        
        // Insert all categories in a single transaction
        try {
          for (const category of categories) {
            await db.execute(sql`
              INSERT INTO management_review_input_categories 
              (name, description, required, display_order)
              VALUES 
              (${category.name}, ${category.description}, ${category.required}, ${category.display_order})
            `);
            Logger.info(`Created management review input category: ${category.name}`);
          }
        } catch (err) {
          Logger.warn(`Error inserting categories: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        Logger.info(`Found ${count} existing management review categories, skipping seed`);
      }
      
      Logger.info('Management review categories check completed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
      Logger.warn(`Error checking management review categories: ${errorMessage}`);
    }

    // No default users created - system requires authentic user data only
    try {
      console.log("Database initialization complete. No default users created.");
      Logger.info("Database schema initialized successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
      Logger.warn(`Error during initialization: ${errorMessage}`);
    }
    
    // Create products table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        classification TEXT,
        regulatory_status TEXT,
        specifications JSONB,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    Logger.info('Products table created or verified');
    
    // Create production_batches table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS production_batches (
        id SERIAL PRIMARY KEY,
        batch_number TEXT NOT NULL UNIQUE,
        product_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        batch_size INTEGER NOT NULL,
        start_date TIMESTAMP,
        completion_date TIMESTAMP,
        expiration_date TIMESTAMP,
        notes TEXT,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    Logger.info('Production batches table created or verified');
    
    // Create supplier_categories table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS supplier_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    Logger.info('Supplier categories table created or verified');
    
    // Create supplier_statuses table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS supplier_statuses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    Logger.info('Supplier statuses table created or verified');
    
    // Create suppliers table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        supplier_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category_id INTEGER NOT NULL,
        status_id INTEGER NOT NULL,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        postal_code TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        website TEXT,
        criticality TEXT,
        initial_risk_level TEXT,
        current_risk_level TEXT,
        qualification_date TIMESTAMP,
        requalification_date TIMESTAMP,
        has_quality_agreement BOOLEAN DEFAULT FALSE,
        has_nda BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    Logger.info('Suppliers table created or verified');
    
    Logger.info('Database initialization completed with table creation');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    Logger.error(`Database initialization error: ${errorMessage}`);
    
    // Rethrow as Error instance
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Database initialization failed');
  }
}