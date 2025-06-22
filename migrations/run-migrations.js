// Migration runner script
const { createTrainingTables } = require('./create_training_tables');

async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // Run training tables migration
    const result = await createTrainingTables();
    console.log('Migration result:', result);
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();