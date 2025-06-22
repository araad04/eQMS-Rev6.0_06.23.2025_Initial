import express from 'express';
const app = express();
const port = 3000; // Using a different port from the main app

// Basic static HTML response
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Minimal Test Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Minimal eQMS Test Server</h1>
        <div class="status">
          <h2>Server Status</h2>
          <p>This minimal server is running correctly.</p>
          <p>Current Time: ${new Date().toLocaleString()}</p>
          <p>Environment: ${process.env.NODE_ENV || 'Not set'}</p>
        </div>
        
        <div class="status">
          <h2>Test API Connection</h2>
          <p>Click the button below to test connectivity to the main API:</p>
          <button onclick="testApi()">Test Main API</button>
          <div id="apiResult"></div>
        </div>
        
        <script>
          function testApi() {
            const resultDiv = document.getElementById('apiResult');
            resultDiv.innerHTML = 'Testing API...';
            
            fetch('http://0.0.0.0:5000/api/health')
              .then(response => {
                if (!response.ok) {
                  throw new Error('API responded with status ' + response.status);
                }
                return response.json();
              })
              .then(data => {
                resultDiv.innerHTML = '<p style="color: green;">✅ API is online!</p><pre>' + 
                  JSON.stringify(data, null, 2) + '</pre>';
              })
              .catch(error => {
                resultDiv.innerHTML = '<p style="color: red;">❌ API connection failed: ' + 
                  error.message + '</p>';
              });
          }
        </script>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health endpoint accessed');
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal test server running at http://0.0.0.0:${port}`);
});