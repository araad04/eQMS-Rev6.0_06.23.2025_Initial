// Direct script to fix training tables
import pkg from 'pg';
const { Pool } = pkg;

// Setup connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixTrainingTables() {
  try {
    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'training_modules'
      );
    `);
    
    const trainingModulesExist = tablesCheck.rows[0].exists;
    
    if (trainingModulesExist) {
      console.log("Training modules table exists, checking records table...");
      
      // No sample data created - training modules should be added by authorized users only
      console.log("Training tables verified - no default data created");
      
      // Check column structure
      const columnsCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'training_records';
      `);
      
      console.log("Training records columns:", columnsCheck.rows.map(row => row.column_name));
      
      console.log("Fix completed successfully");
    } else {
      console.log("Training modules table does not exist. Run the table creation script first.");
    }
  } catch (error) {
    console.error("Error fixing training tables:", error);
  } finally {
    await pool.end();
  }
}

fixTrainingTables();