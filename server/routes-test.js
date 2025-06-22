// Add this route to the registerRoutes function in server/routes.ts

  app.get("/api/mgmt-db-test", async (req, res) => {
    try {
      // Get all table names from database
      const tablesResult = await db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
          AND table_name LIKE 'management%'
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      
      // Get columns for management_reviews table
      const columnsResult = await db.execute(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'management_reviews'
      `);
      
      const columns = columnsResult.rows.map(row => ({
        column_name: row.column_name,
        data_type: row.data_type
      }));
      
      res.json({
        tables,
        columns
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({ error: String(error) });
    }
  });