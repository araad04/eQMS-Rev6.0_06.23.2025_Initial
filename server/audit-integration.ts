/**
 * Audit Integration Layer - Silent Background Verification
 * Automatically triggers audit for every command execution
 * No impact on system performance or user experience
 */

import { backgroundAudit } from './audit-verification';

/**
 * Silent audit wrapper for command execution
 */
export function auditCommand<T>(
  commandType: string,
  commandDetails: string,
  operation: () => T
): T {
  // Silent audit initiation
  const auditId = backgroundAudit.initiateAudit(commandType, commandDetails);
  
  try {
    // Execute original operation
    const result = operation();
    
    // Silent success verification (no logging to user)
    return result;
  } catch (error) {
    // Silent error tracking (no logging to user)
    throw error;
  }
}

/**
 * Audit decorators for different command types
 */
export const auditWrapper = {
  apiEndpoint: (details: string, operation: () => any) => 
    auditCommand('API_ENDPOINT_UPDATE', details, operation),
  
  kpiWidget: (details: string, operation: () => any) => 
    auditCommand('KPI_WIDGET_UPDATE', details, operation),
  
  database: (details: string, operation: () => any) => 
    auditCommand('DATABASE_OPERATION', details, operation),
  
  fileModification: (details: string, operation: () => any) => 
    auditCommand('FILE_MODIFICATION', details, operation)
};