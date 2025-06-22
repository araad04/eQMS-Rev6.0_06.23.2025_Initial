import { createRoot } from "react-dom/client";
import App from "./App"; // Import the main App component with AuthProvider
import "./index.css";
import "./styles/print-styles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "next-themes";

// Log environment information
console.log("React Application Starting");
console.log("Environment Variables:", {
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL,
});

// Check if root element exists
const rootElement = document.getElementById("root");
console.log("Root Element Found:", !!rootElement);

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    );
    console.log("React App Successfully Rendered");
  } catch (error) {
    console.error("Error rendering React App:", error);

    // Fallback to basic content if React fails to render - Secure version
    rootElement.textContent = ''; // Clear content safely

    // Create container
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.maxWidth = '800px';
    container.style.margin = '0 auto';

    // Create heading
    const heading = document.createElement('h1');
    heading.style.color = '#2563eb';
    heading.textContent = 'eQMS Diagnostic Page';
    container.appendChild(heading);

    // Create error paragraph
    const errorPara = document.createElement('p');
    errorPara.textContent = 'A rendering error occurred in the React application.';
    container.appendChild(errorPara);

    // Create error information section
    const errorSection = document.createElement('div');
    errorSection.style.padding = '16px';
    errorSection.style.border = '1px solid #e5e7eb';
    errorSection.style.borderRadius = '8px';
    errorSection.style.margin = '20px 0';

    const errorHeading = document.createElement('h2');
    errorHeading.textContent = 'Error Information';
    errorSection.appendChild(errorHeading);

    const errorPre = document.createElement('pre');
    errorPre.style.background = '#f5f5f5';
    errorPre.style.padding = '10px';
    errorPre.style.overflow = 'auto';
    errorPre.style.borderRadius = '4px';
    errorPre.textContent = error instanceof Error ? error.message : String(error);
    errorSection.appendChild(errorPre);

    container.appendChild(errorSection);

    // Create API test section
    const apiSection = document.createElement('div');
    apiSection.style.padding = '16px';
    apiSection.style.border = '1px solid #e5e7eb';
    apiSection.style.borderRadius = '8px';
    apiSection.style.margin = '20px 0';

    const apiHeading = document.createElement('h2');
    apiHeading.textContent = 'Manual API Test';
    apiSection.appendChild(apiHeading);

    const apiPara = document.createElement('p');
    apiPara.textContent = 'Testing API connection...';
    apiSection.appendChild(apiPara);

    const apiResult = document.createElement('div');
    apiResult.id = 'api-test-result';
    apiResult.textContent = 'Loading...';
    apiSection.appendChild(apiResult);

    container.appendChild(apiSection);
    rootElement.appendChild(container);

    // Create and add script functionally instead of using innerHTML
    fetch('/api/health')
      .then(response => {
        if (!response.ok) throw new Error('API responded with: ' + response.status);
        return response.json();
      })
      .then(data => {
        const resultElement = document.getElementById('api-test-result');
        if (resultElement) {
          resultElement.textContent = '';

          const successDiv = document.createElement('div');
          successDiv.style.color = 'green';
          successDiv.textContent = '✓ API is working: ' + JSON.stringify(data);

          resultElement.appendChild(successDiv);
        }
      })
      .catch(error => {
        const resultElement = document.getElementById('api-test-result');
        if (resultElement) {
          resultElement.textContent = '';

          const errorDiv = document.createElement('div');
          errorDiv.style.color = 'red';
          errorDiv.textContent = '✗ API error: ' + error.message;

          resultElement.appendChild(errorDiv);
        }
      });
  }
} else {
  console.error("Root element not found! Adding fallback element to body");

  // Create fallback content if root element doesn't exist - Secure version
  const fallbackDiv = document.createElement('div');

  // Create container
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.maxWidth = '800px';
  container.style.margin = '0 auto';

  // Create heading
  const heading = document.createElement('h1');
  heading.style.color = '#2563eb';
  heading.textContent = 'eQMS System Error';
  container.appendChild(heading);

  // Create error paragraph
  const errorPara = document.createElement('p');
  errorPara.textContent = 'Critical error: Root element not found in the DOM.';
  container.appendChild(errorPara);

  // Create environment info section
  const envSection = document.createElement('div');
  envSection.style.padding = '16px';
  envSection.style.border = '1px solid #e5e7eb';
  envSection.style.borderRadius = '8px';
  envSection.style.margin = '20px 0';

  const envHeading = document.createElement('h2');
  envHeading.textContent = 'Environment Information';
  envSection.appendChild(envHeading);

  const envInfo = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    time: new Date().toISOString()
  };

  const envPre = document.createElement('pre');
  envPre.style.background = '#f5f5f5';
  envPre.style.padding = '10px';
  envPre.style.overflow = 'auto';
  envPre.style.borderRadius = '4px';
  envPre.textContent = JSON.stringify(envInfo, null, 2);
  envSection.appendChild(envPre);

  container.appendChild(envSection);

  // Create API test section
  const apiSection = document.createElement('div');
  apiSection.style.padding = '16px';
  apiSection.style.border = '1px solid #e5e7eb';
  apiSection.style.borderRadius = '8px';
  apiSection.style.margin = '20px 0';

  const apiHeading = document.createElement('h2');
  apiHeading.textContent = 'Manual API Test';
  apiSection.appendChild(apiHeading);

  const apiPara = document.createElement('p');
  apiPara.textContent = 'Testing API connection...';
  apiSection.appendChild(apiPara);

  const apiResultFallback = document.createElement('div');
  apiResultFallback.id = 'api-test-result-fallback'; // Use a different ID to avoid conflicts
  apiResultFallback.textContent = 'Loading...';
  apiSection.appendChild(apiResultFallback);

  container.appendChild(apiSection);
  fallbackDiv.appendChild(container);

  // Add the fallback div to the body
  document.body.appendChild(fallbackDiv);

  // Execute API fetch and update the result securely
  fetch('/api/health')
    .then(response => {
      if (!response.ok) throw new Error('API responded with: ' + response.status);
      return response.json();
    })
    .then(data => {
      const resultElement = document.getElementById('api-test-result-fallback');
      if (resultElement) {
        resultElement.textContent = '';

        const successDiv = document.createElement('div');
        successDiv.style.color = 'green';
        successDiv.textContent = '✓ API is working: ' + JSON.stringify(data);

        resultElement.appendChild(successDiv);
      }
    })
    .catch(error => {
      const resultElement = document.getElementById('api-test-result-fallback');
      if (resultElement) {
        resultElement.textContent = '';

        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = '✗ API error: ' + error.message;

        resultElement.appendChild(errorDiv);
      }
    });
}