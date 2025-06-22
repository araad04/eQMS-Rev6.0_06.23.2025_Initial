import React from 'react';
import TestPage from './pages/test-page';

function SimpleApp() {
  const [apiStatus, setApiStatus] = React.useState<string>('Loading...');
  
  console.log('SimpleApp component rendered');
  
  React.useEffect(() => {
    console.log('SimpleApp useEffect running - attempting API health check');
    
    // Adding a delay to ensure network is ready
    setTimeout(() => {
      console.log('Executing delayed fetch to /api/health');
      
      fetch('/api/health')
        .then(response => {
          console.log('API Response received:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('API Data:', data);
          setApiStatus('Online');
        })
        .catch(error => {
          console.error('API Error:', error);
          setApiStatus('Offline: ' + error.message);
        });
    }, 2000);
  }, []);
  
  return (
    <div>
      {/* Render our comprehensive test page instead */}
      <TestPage />
      
      {/* Also display API status from this component for comparison */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#f0f9ff',
        border: '1px solid #3b82f6',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <p style={{ margin: 0, fontSize: '12px' }}>
          <strong>SimpleApp API Status:</strong> {apiStatus}
        </p>
      </div>
    </div>
  );
}

export default SimpleApp;