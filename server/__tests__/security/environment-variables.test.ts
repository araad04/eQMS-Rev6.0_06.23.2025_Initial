/**
 * Environment Variables Security Test Suite
 * Compliant with IEC 62304:2006+AMD1:2015 and 21 CFR Part 11
 * 
 * This test suite verifies that the application correctly uses environment
 * variables for sensitive configuration and does not hard-code credentials.
 * 
 * Test IDs: TEST-SEC-ENV-001 through TEST-SEC-ENV-003
 * Version: 1.0.0
 * Last Updated: 2025-05-16
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const SERVER_DIR = path.join(PROJECT_ROOT, 'server');
const CLIENT_DIR = path.join(PROJECT_ROOT, 'client');

// Patterns that could indicate hard-coded secrets
const CREDENTIAL_PATTERNS = [
  // Password patterns
  /const\s+password\s*=\s*['"].*?['"]/g,
  /let\s+password\s*=\s*['"].*?['"]/g,
  /var\s+password\s*=\s*['"].*?['"]/g,
  /password:\s*['"].*?['"]/g,
  
  // Token patterns
  /const\s+token\s*=\s*['"].*?['"]/g,
  /let\s+token\s*=\s*['"].*?['"]/g,
  /var\s+token\s*=\s*['"].*?['"]/g,
  /token:\s*['"].*?['"]/g,
  
  // API key patterns
  /const\s+apiKey\s*=\s*['"].*?['"]/g,
  /let\s+apiKey\s*=\s*['"].*?['"]/g,
  /var\s+apiKey\s*=\s*['"].*?['"]/g,
  /apiKey:\s*['"].*?['"]/g,
  
  // Secret patterns
  /const\s+secret\s*=\s*['"].*?['"]/g,
  /let\s+secret\s*=\s*['"].*?['"]/g,
  /var\s+secret\s*=\s*['"].*?['"]/g,
  /secret:\s*['"].*?['"]/g
];

// Allow list for test files that can contain test credentials
const TEST_FILE_PATTERNS = [
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /__tests__/,
  /__mocks__/
];

// Function to check if a file path is in the allow list (test files)
function isTestFile(filePath: string): boolean {
  return TEST_FILE_PATTERNS.some(pattern => pattern.test(filePath));
}

describe('Environment Variables Security', () => {
  // Store findings for reporting
  const securityFindings: {
    file: string;
    line: string;
    lineNumber: number;
  }[] = [];
  
  // Test ID: TEST-SEC-ENV-001
  it('should use environment variables for JWT secrets', async () => {
    // Check the Auth middleware for proper usage of environment variables
    const serverAuthFiles = [
      path.join(SERVER_DIR, 'middleware/auth.ts'),
      path.join(SERVER_DIR, 'auth.ts')
    ];
    
    let foundEnvUsage = false;
    
    for (const filePath of serverAuthFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for environment variable usage
        if (content.includes('process.env.JWT_SECRET') || 
            content.includes('process.env.SESSION_SECRET')) {
          foundEnvUsage = true;
          break;
        }
      }
    }
    
    expect(foundEnvUsage).toBe(true);
  });
  
  // Test ID: TEST-SEC-ENV-002
  it('should not have hard-coded credentials in server files (excluding tests)', async () => {
    // Get all JS/TS files in the server directory (non-test files)
    const { stdout } = await execAsync('find ' + SERVER_DIR + ' -name "*.ts" -o -name "*.js"');
    const files = stdout.split('\n').filter(file => file.trim() !== '');
    
    // Check each file
    for (const file of files) {
      // Skip test files which are allowed to have test credentials
      if (isTestFile(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      // Check each line against credential patterns
      lines.forEach((line, index) => {
        CREDENTIAL_PATTERNS.forEach(pattern => {
          if (pattern.test(line)) {
            // Ignore commented lines
            if (!line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
              securityFindings.push({
                file,
                line: line.trim(),
                lineNumber: index + 1
              });
            }
          }
        });
      });
    }
    
    // Report findings
    if (securityFindings.length > 0) {
      console.warn('Security findings:', securityFindings);
    }
    
    expect(securityFindings.length).toBe(0);
  });
  
  // Test ID: TEST-SEC-ENV-003
  it('should not expose sensitive environment variables to the client', async () => {
    // Check main.tsx for env variable exposure
    const mainTsxPath = path.join(CLIENT_DIR, 'src/main.tsx');
    
    let exposesEnv = false;
    
    if (fs.existsSync(mainTsxPath)) {
      const content = fs.readFileSync(mainTsxPath, 'utf8');
      
      // Check for environment variable logging
      if (content.includes('console.log') && 
         (content.includes('process.env') || content.includes('import.meta.env'))) {
        
        // Check that only safe variables are logged
        const safeEnvVars = [
          'NODE_ENV',
          'DEV',
          'PROD',
          'MODE',
          'BASE_URL'
        ];
        
        // Look for lines that log environment variables
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.includes('console.log') && 
             (line.includes('process.env') || line.includes('import.meta.env'))) {
            
            // Check if any unsafe variables are logged
            const isSafe = safeEnvVars.some(safeVar => 
              line.includes(`process.env.${safeVar}`) || 
              line.includes(`import.meta.env.${safeVar}`)
            );
            
            if (!isSafe) {
              exposesEnv = true;
              securityFindings.push({
                file: mainTsxPath,
                line: line.trim(),
                lineNumber: lines.indexOf(line) + 1
              });
            }
          }
        }
      }
    }
    
    expect(exposesEnv).toBe(false);
  });
});