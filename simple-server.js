import express from 'express';
import { createServer } from 'http';

const app = express();
const port = 5001; // Using a different port from main app

// Basic middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Static test HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Simple eQMS Test Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .card { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .header { background: linear-gradient(90deg, #2563eb, #3b82f6); color: white; padding: 16px; border-radius: 8px 8px 0 0; margin-bottom: 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Simple eQMS Test Server</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; padding: 16px;">
          <p>This is a simple Express server running on port ${port}.</p>
          
          <div class="card">
            <h2>Server Information</h2>
            <ul>
              <li>Server Time: ${new Date().toISOString()}</li>
              <li>Node Version: ${process.version}</li>
              <li>Environment: ${process.env.NODE_ENV || 'Not set'}</li>
            </ul>
          </div>
          
          <div class="card">
            <h2>API Test</h2>
            <button id="testBtn">Test Health Endpoint</button>
            <div id="result" style="margin-top: 10px;"></div>
          </div>
          
          <div class="card">
            <h2>Main Server Test</h2>
            <button id="mainServerBtn">Test Main Server (port 5000)</button>
            <div id="mainServerResult" style="margin-top: 10px;"></div>
          </div>
        </div>
        
        <script>
          // Test health endpoint
          document.getElementById('testBtn').addEventListener('click', async () => {
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = 'Testing...';
            
            try {
              const response = await fetch('/health');
              const data = await response.json();
              resultDiv.innerHTML = '<pre style="background: #f5f5f5; padding: 10px;">' + 
                JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
              resultDiv.textContent = 'Error: ' + error.message;
            }
          });
          
          // Test main server
          document.getElementById('mainServerBtn').addEventListener('click', async () => {
            const resultDiv = document.getElementById('mainServerResult');
            resultDiv.textContent = 'Testing main server...';
            
            try {
              const response = await fetch('http://0.0.0.0:5000/api/health');
              const data = await response.json();
              resultDiv.innerHTML = '<pre style="background: #f5f5f5; padding: 10px;">' + 
                JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
              resultDiv.textContent = 'Error: ' + error.message;
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    message: 'Simple test server is healthy'
  });
});

// Create HTTP server
const server = createServer(app);

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Simple test server running at http://0.0.0.0:${port}`);
});