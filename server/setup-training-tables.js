// A simple script to create the training tables
import { pool } from './db.js';

async function createTrainingTables() {
  console.log("Creating training tables...");

  try {
    // Check if tables already exist
    const modulesExist = await checkTableExists("training_modules");
    
    if (!modulesExist) {
      console.log("Creating training_modules table...");
      // Create the training_modules table using raw SQL
      await pool.query(`
        CREATE TABLE IF NOT EXISTS training_modules (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          valid_period INTEGER NOT NULL DEFAULT 365,
          created_by INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("training_modules table created");
    } else {
      console.log("training_modules table already exists");
    }

    // Check if training_records table exists
    const recordsExist = await checkTableExists("training_records");
    
    if (!recordsExist) {
      console.log("Creating training_records table...");
      // Create the training_records table using raw SQL
      await pool.query(`
        CREATE TABLE IF NOT EXISTS training_records (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          module_id INTEGER NOT NULL REFERENCES training_modules(id),
          assigned_by INTEGER NOT NULL REFERENCES users(id),
          assigned_date TIMESTAMP NOT NULL DEFAULT NOW(),
          due_date TIMESTAMP NOT NULL,
          completed_date TIMESTAMP,
          expiry_date TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'assigned',
          score INTEGER,
          comments TEXT,
          evidence_link TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("training_records table created");
      
      // No sample data created - training modules should be created by authorized users only
    } else {
      console.log("training_records table already exists");
    }

    return { success: true, message: "Training tables created successfully" };
  } catch (error) {
    console.error("Error creating training tables:", error);
    return { success: false, error: error };
  } finally {
    console.log("Done with setup");
  }
}

// Helper function to check if a table exists
async function checkTableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Run the setup
createTrainingTables()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error("Setup failed:", error);
    process.exit(1);
  });