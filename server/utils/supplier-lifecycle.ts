/**
 * Supplier Lifecycle Management Utility
 * ISO 13485:2016 Section 7.4 - Control of Externally Provided Processes
 * IEC 62304:2006 Section 5.1.1 - Software Safety Classification
 * 
 * Automatically determines requalification and audit dates based on criticality
 */

import { addYears, format } from 'date-fns';

export interface SupplierCriticalityConfig {
  requalificationInterval: number; // years
  auditInterval: number | null; // years, null if not required
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Supplier Criticality Configuration
 * Based on ISO 13485:2016 risk management requirements
 */
export const SUPPLIER_CRITICALITY_CONFIG: Record<string, SupplierCriticalityConfig> = {
  'Critical': {
    requalificationInterval: 1,
    auditInterval: 1,
    riskLevel: 'high',
    description: 'Suppliers of components/services that directly impact product safety and efficacy'
  },
  'Major': {
    requalificationInterval: 2,
    auditInterval: 3,
    riskLevel: 'medium',
    description: 'Suppliers with significant impact on product performance or compliance'
  },
  'Minor': {
    requalificationInterval: 4,
    auditInterval: null,
    riskLevel: 'low',
    description: 'Suppliers with minimal impact on final product quality'
  }
};

/**
 * Calculate next requalification date based on criticality
 * ISO 13485:2016 Section 7.4.1 - Evaluation and re-evaluation of suppliers
 */
export function calculateRequalificationDate(
  qualificationDate: Date,
  criticality: string
): Date {
  const config = SUPPLIER_CRITICALITY_CONFIG[criticality];
  
  if (!config) {
    throw new Error(`Invalid criticality level: ${criticality}. Must be Critical, Major, or Minor.`);
  }
  
  return addYears(qualificationDate, config.requalificationInterval);
}

/**
 * Calculate next audit date based on criticality
 * ISO 13485:2016 Section 7.4.2 - Type and extent of control
 */
export function calculateNextAuditDate(
  lastAuditDate: Date,
  criticality: string
): Date | null {
  const config = SUPPLIER_CRITICALITY_CONFIG[criticality];
  
  if (!config) {
    throw new Error(`Invalid criticality level: ${criticality}. Must be Critical, Major, or Minor.`);
  }
  
  // Minor criticality suppliers don't require regular audits
  if (config.auditInterval === null) {
    return null;
  }
  
  return addYears(lastAuditDate, config.auditInterval);
}

/**
 * Determine if supplier is due for requalification
 * Returns true if requalification is due within the next 30 days
 */
export function isRequalificationDue(
  requalificationDate: Date,
  bufferDays: number = 30
): boolean {
  const today = new Date();
  const dueDate = new Date(requalificationDate);
  const bufferDate = new Date(today);
  bufferDate.setDate(today.getDate() + bufferDays);
  
  return dueDate <= bufferDate;
}

/**
 * Determine if supplier is due for audit
 * Returns true if audit is due within the next 30 days
 */
export function isAuditDue(
  nextAuditDate: Date | null,
  bufferDays: number = 30
): boolean {
  if (!nextAuditDate) {
    return false; // No audit required for this criticality level
  }
  
  const today = new Date();
  const dueDate = new Date(nextAuditDate);
  const bufferDate = new Date(today);
  bufferDate.setDate(today.getDate() + bufferDays);
  
  return dueDate <= bufferDate;
}

/**
 * Get supplier status based on current dates
 * ISO 13485:2016 Section 8.4 - Analysis and evaluation of data
 */
export function getSupplierComplianceStatus(
  qualificationDate: Date | null,
  requalificationDate: Date | null,
  lastAuditDate: Date | null,
  nextAuditDate: Date | null,
  criticality: string
): {
  status: 'compliant' | 'warning' | 'non-compliant';
  issues: string[];
  nextActions: string[];
} {
  const issues: string[] = [];
  const nextActions: string[] = [];
  
  // Check qualification status
  if (!qualificationDate) {
    issues.push('Supplier not yet qualified');
    nextActions.push('Complete initial supplier qualification');
  }
  
  // Check requalification status
  if (requalificationDate && isRequalificationDue(requalificationDate)) {
    issues.push('Requalification is due or overdue');
    nextActions.push(`Conduct ${criticality.toLowerCase()} supplier requalification`);
  }
  
  // Check audit status (if required)
  if (nextAuditDate && isAuditDue(nextAuditDate)) {
    issues.push('Audit is due or overdue');
    nextActions.push(`Schedule ${criticality.toLowerCase()} supplier audit`);
  }
  
  // Determine overall status
  let status: 'compliant' | 'warning' | 'non-compliant';
  
  if (issues.length === 0) {
    status = 'compliant';
  } else if (issues.some(issue => issue.includes('overdue') || issue.includes('not yet qualified'))) {
    status = 'non-compliant';
  } else {
    status = 'warning';
  }
  
  return { status, issues, nextActions };
}

/**
 * Generate audit trail entry for supplier lifecycle events
 * 21 CFR Part 11 - Electronic Records compliance
 */
export function generateLifecycleAuditEntry(
  supplierId: number,
  event: 'qualification' | 'requalification' | 'audit_scheduled' | 'audit_completed',
  details: Record<string, any>,
  userId: number
): {
  supplierId: number;
  action: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  userId: number;
  timestamp: Date;
  ipAddress?: string;
} {
  const timestamp = new Date();
  
  const eventMap = {
    'qualification': {
      action: 'qualified',
      field: 'qualification_status',
      newValue: 'qualified'
    },
    'requalification': {
      action: 'requalified',
      field: 'requalification_date',
      newValue: details.requalificationDate || timestamp.toISOString()
    },
    'audit_scheduled': {
      action: 'audit_scheduled',
      field: 'next_audit_date',
      newValue: details.nextAuditDate || ''
    },
    'audit_completed': {
      action: 'audit_completed',
      field: 'last_audit_date',
      newValue: details.auditDate || timestamp.toISOString()
    }
  };
  
  const eventData = eventMap[event];
  
  return {
    supplierId,
    action: eventData.action,
    field: eventData.field,
    oldValue: details.oldValue || null,
    newValue: eventData.newValue,
    userId,
    timestamp
  };
}

/**
 * Validate criticality level
 * Ensures only valid criticality levels are used
 */
export function validateCriticality(criticality: string): boolean {
  return Object.keys(SUPPLIER_CRITICALITY_CONFIG).includes(criticality);
}

/**
 * Get all suppliers due for action
 * Returns suppliers that need requalification or audit
 */
export function getSuppliersDueForAction(suppliers: any[]): {
  requalificationDue: any[];
  auditDue: any[];
  nonCompliant: any[];
} {
  const requalificationDue: any[] = [];
  const auditDue: any[] = [];
  const nonCompliant: any[] = [];
  
  suppliers.forEach(supplier => {
    const compliance = getSupplierComplianceStatus(
      supplier.qualificationDate,
      supplier.requalificationDate,
      supplier.lastAuditDate,
      supplier.nextAuditDate,
      supplier.criticality
    );
    
    if (compliance.status === 'non-compliant') {
      nonCompliant.push(supplier);
    }
    
    if (supplier.requalificationDate && isRequalificationDue(supplier.requalificationDate)) {
      requalificationDue.push(supplier);
    }
    
    if (supplier.nextAuditDate && isAuditDue(supplier.nextAuditDate)) {
      auditDue.push(supplier);
    }
  });
  
  return { requalificationDue, auditDue, nonCompliant };
}