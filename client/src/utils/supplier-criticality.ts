/**
 * Supplier Criticality Utilities
 * Automatic requalification date calculation based on ISO 13485:2016 requirements
 */

export interface CriticalityConfig {
  requalificationInterval: number; // years
  auditInterval: number | null; // years, null if not required
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Supplier Criticality Configuration
 * Based on ISO 13485:2016 risk management requirements
 */
export const SUPPLIER_CRITICALITY_CONFIG: Record<string, CriticalityConfig> = {
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
    throw new Error(`Unknown criticality level: ${criticality}`);
  }

  const requalificationDate = new Date(qualificationDate);
  requalificationDate.setFullYear(requalificationDate.getFullYear() + config.requalificationInterval);
  
  return requalificationDate;
}

/**
 * Calculate next audit date based on criticality
 * ISO 13485:2016 Section 8.2.2 - Internal audit
 */
export function calculateNextAuditDate(
  lastAuditDate: Date,
  criticality: string
): Date | null {
  const config = SUPPLIER_CRITICALITY_CONFIG[criticality];
  if (!config || config.auditInterval === null) {
    return null; // No audit required for this criticality
  }

  const nextAuditDate = new Date(lastAuditDate);
  nextAuditDate.setFullYear(nextAuditDate.getFullYear() + config.auditInterval);
  
  return nextAuditDate;
}

/**
 * Get criticality configuration for a supplier
 */
export function getCriticalityConfig(criticality: string): CriticalityConfig | null {
  return SUPPLIER_CRITICALITY_CONFIG[criticality] || null;
}

/**
 * Format requalification interval for display
 */
export function formatRequalificationInterval(criticality: string): string {
  const config = SUPPLIER_CRITICALITY_CONFIG[criticality];
  if (!config) return 'Unknown';
  
  const years = config.requalificationInterval;
  return years === 1 ? '1 year' : `${years} years`;
}

/**
 * Format audit interval for display
 */
export function formatAuditInterval(criticality: string): string {
  const config = SUPPLIER_CRITICALITY_CONFIG[criticality];
  if (!config) return 'Unknown';
  
  if (config.auditInterval === null) {
    return 'Not required';
  }
  
  const years = config.auditInterval;
  return years === 1 ? '1 year' : `${years} years`;
}

/**
 * Check if requalification is due
 */
export function isRequalificationDue(requalificationDate: Date): boolean {
  return new Date() > requalificationDate;
}

/**
 * Check if audit is due
 */
export function isAuditDue(nextAuditDate: Date | null): boolean {
  if (!nextAuditDate) return false;
  return new Date() > nextAuditDate;
}

/**
 * Get days until requalification
 */
export function getDaysUntilRequalification(requalificationDate: Date): number {
  const today = new Date();
  const diffTime = requalificationDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get days until audit
 */
export function getDaysUntilAudit(nextAuditDate: Date | null): number | null {
  if (!nextAuditDate) return null;
  const today = new Date();
  const diffTime = nextAuditDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}