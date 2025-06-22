# Configuration & Change Control Plan
## Cosmic QMS (eQMS Platform) - Backend Systems

**Document ID:** CCP-001  
**Version:** 1.0  
**Date:** 2025-05-22  
**Standards Referenced:**
- IEC 62304:2006 + A1:2015 Section 8 (Configuration Management)
- ISO 13485:2016 Section 4.2.3 (Document Control)

---

## 1. Change Control Scope

### 1.1 Backend Configuration Management
This plan applies **EXCLUSIVELY** to:
- **Backend source code** version control and branching
- **Database schema** changes and migrations
- **API endpoint** modifications and additions
- **Security configuration** updates
- **Environment configuration** changes
- **Deployment scripts** and infrastructure

### 1.2 Explicitly Excluded
- Frontend component changes
- UI/UX design modifications
- Client-side configuration
- User documentation updates

---

## 2. Git-Based Version Control Strategy

### 2.1 Repository Structure
```
eQMS-Backend/
├── server/                 # Backend source code
│   ├── routes/            # API endpoints (version controlled)
│   ├── middleware/        # Security middleware (version controlled)
│   ├── utils/            # Business logic utilities (version controlled)
│   └── tests/            # Backend test suites (version controlled)
├── shared/               # Shared schemas and types (version controlled)
├── migrations/           # Database migrations (version controlled)
└── documentation/        # Regulatory documentation (version controlled)
```

### 2.2 Branching Strategy
```
main (production-ready)
├── develop (integration branch)
│   ├── feature/capa-engine-enhancement
│   ├── feature/supplier-risk-assessment
│   └── hotfix/security-patch-001
└── release/v2.1.0 (release preparation)
```

### 2.3 Semantic Versioning for Backend
- **Major (X.0.0):** Breaking API changes, major architecture updates
- **Minor (X.Y.0):** New API endpoints, feature additions
- **Patch (X.Y.Z):** Bug fixes, security patches

---

## 3. Change Impact Analysis Framework

### 3.1 Critical Backend Components
| Component | Impact Level | Review Required | Testing Required |
|-----------|--------------|-----------------|------------------|
| **CAPA Processing Logic** | High | QA + Security Review | Full Regression |
| **Authentication Middleware** | Critical | Security + QA Review | Security + Integration |
| **Database Schema** | High | DBA + QA Review | Migration + Data Integrity |
| **API Controllers** | Medium | Code Review | API + Unit Tests |
| **File Handler Engines** | Medium | Security Review | File Processing Tests |

### 3.2 Change Classification Matrix
```typescript
// server/utils/change-classification.ts
export interface ChangeImpact {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  reviewersRequired: string[];
  testingRequired: string[];
  approvalRequired: boolean;
}

export function classifyChange(changeType: string, affectedComponents: string[]): ChangeImpact {
  const classifications = {
    'security-middleware': {
      riskLevel: 'Critical',
      reviewersRequired: ['Security Engineer', 'QA Manager'],
      testingRequired: ['Security Tests', 'Integration Tests'],
      approvalRequired: true
    },
    'capa-logic': {
      riskLevel: 'High',
      reviewersRequired: ['Lead Developer', 'QA Manager'],
      testingRequired: ['Unit Tests', 'Workflow Tests'],
      approvalRequired: true
    },
    'api-endpoint': {
      riskLevel: 'Medium',
      reviewersRequired: ['Lead Developer'],
      testingRequired: ['API Tests', 'Unit Tests'],
      approvalRequired: false
    }
  };
  
  return classifications[changeType] || {
    riskLevel: 'Low',
    reviewersRequired: ['Developer'],
    testingRequired: ['Unit Tests'],
    approvalRequired: false
  };
}
```

---

## 4. Database Schema Change Control

### 4.1 Migration Management
```typescript
// migrations/migration-template.ts
export interface MigrationRecord {
  id: string;
  description: string;
  author: string;
  reviewedBy: string;
  approvedBy: string;
  executedAt: Date;
  rollbackScript: string;
}

// Example: Migration for CAPA table enhancement
export async function migration_20250522_001_enhance_capa_table() {
  return {
    id: 'MIGRATE-001',
    description: 'Add priority scoring to CAPA table for risk assessment',
    up: async (db: Database) => {
      await db.schema.alterTable('capas', (table) => {
        table.integer('priority_score').defaultTo(0);
        table.timestamp('risk_assessed_at').nullable();
      });
    },
    down: async (db: Database) => {
      await db.schema.alterTable('capas', (table) => {
        table.dropColumn('priority_score');
        table.dropColumn('risk_assessed_at');
      });
    }
  };
}
```

### 4.2 Schema Validation Controls
```typescript
// server/utils/schema-validation.ts
export async function validateSchemaIntegrity(): Promise<boolean> {
  try {
    // Verify critical tables exist
    const criticalTables = ['users', 'capas', 'documents', 'audit_trail'];
    
    for (const table of criticalTables) {
      const exists = await db.schema.hasTable(table);
      if (!exists) {
        throw new Error(`Critical table missing: ${table}`);
      }
    }
    
    // Verify foreign key constraints
    const constraintChecks = [
      'SELECT COUNT(*) FROM capas WHERE assigned_to NOT IN (SELECT id FROM users)',
      'SELECT COUNT(*) FROM documents WHERE created_by NOT IN (SELECT id FROM users)'
    ];
    
    for (const check of constraintChecks) {
      const result = await db.raw(check);
      if (result.rows[0].count > 0) {
        throw new Error(`Data integrity violation detected: ${check}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Schema validation failed:', error);
    return false;
  }
}
```

---

## 5. API Change Control Process

### 5.1 API Versioning Strategy
```typescript
// server/routes/versioning.ts
export const API_VERSIONS = {
  V1: '/api/v1',
  V2: '/api/v2'
} as const;

// Backward compatibility maintenance
export function setupAPIVersioning(app: Express) {
  // V1 endpoints (legacy support)
  app.use('/api/v1/capa', legacyCapaRoutes);
  
  // V2 endpoints (current)
  app.use('/api/v2/capa', currentCapaRoutes);
  
  // Default to current version
  app.use('/api/capa', currentCapaRoutes);
}
```

### 5.2 Breaking Change Documentation
```typescript
// server/utils/api-deprecation.ts
export interface APIDeprecation {
  endpoint: string;
  version: string;
  deprecatedSince: string;
  removalDate: string;
  replacement: string;
  reason: string;
}

export const deprecatedEndpoints: APIDeprecation[] = [
  {
    endpoint: '/api/v1/capa/create',
    version: 'v1',
    deprecatedSince: '2025-01-01',
    removalDate: '2025-07-01',
    replacement: '/api/v2/capa',
    reason: 'Enhanced validation and security controls'
  }
];
```

---

## 6. Release Management Process

### 6.1 Release Validation Pipeline
```yaml
# Release validation checklist
name: Backend Release Validation
stages:
  pre-release:
    - security_scan: "Run static security analysis"
    - dependency_audit: "Check for vulnerable dependencies" 
    - schema_validation: "Verify database schema integrity"
    - api_compatibility: "Test API backward compatibility"
    
  testing:
    - unit_tests: "Execute all backend unit tests"
    - integration_tests: "Run API integration test suite"
    - security_tests: "Perform authentication/authorization tests"
    - performance_tests: "Validate response time requirements"
    
  validation:
    - regulatory_compliance: "Verify IEC 62304 documentation"
    - traceability_check: "Confirm requirement traceability"
    - audit_trail_test: "Validate audit trail completeness"
    
  approval:
    - qa_signoff: "Quality assurance approval"
    - security_signoff: "Security review approval"
    - regulatory_signoff: "Regulatory compliance approval"
```

### 6.2 Rollback Procedures
```typescript
// server/utils/rollback-manager.ts
export interface RollbackPlan {
  version: string;
  components: string[];
  dataBackupRequired: boolean;
  rollbackSteps: string[];
  validationTests: string[];
}

export async function executeRollback(plan: RollbackPlan): Promise<boolean> {
  try {
    console.log(`Initiating rollback to version ${plan.version}`);
    
    // 1. Stop backend services
    await stopBackendServices();
    
    // 2. Restore database if needed
    if (plan.dataBackupRequired) {
      await restoreDatabase(plan.version);
    }
    
    // 3. Deploy previous code version
    await deployCodeVersion(plan.version);
    
    // 4. Run validation tests
    const validationResults = await runValidationTests(plan.validationTests);
    
    if (validationResults.passed) {
      console.log('Rollback completed successfully');
      return true;
    } else {
      throw new Error('Rollback validation failed');
    }
  } catch (error) {
    console.error('Rollback failed:', error);
    return false;
  }
}
```

---

## 7. Environment Configuration Control

### 7.1 Environment-Specific Configurations
```typescript
// server/config/environment.ts
export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  database: {
    url: string;
    poolSize: number;
    timeout: number;
  };
  security: {
    jwtExpiration: string;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    auditEnabled: boolean;
  };
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV as EnvironmentConfig['environment'];
  
  const configs = {
    development: {
      environment: 'development' as const,
      database: { poolSize: 5, timeout: 5000 },
      security: { jwtExpiration: '8h' },
      logging: { level: 'debug' as const, auditEnabled: true }
    },
    production: {
      environment: 'production' as const,
      database: { poolSize: 20, timeout: 2000 },
      security: { jwtExpiration: '4h' },
      logging: { level: 'warn' as const, auditEnabled: true }
    }
  };
  
  return configs[env] || configs.development;
}
```

---

## 8. Audit Trail for Configuration Changes

### 8.1 Change Tracking
```typescript
// server/utils/configuration-audit.ts
export interface ConfigurationChange {
  id: string;
  timestamp: Date;
  component: string;
  changeType: 'code' | 'schema' | 'config' | 'deployment';
  description: string;
  changedBy: string;
  reviewedBy: string;
  approvedBy: string;
  riskAssessment: string;
  rollbackPlan: string;
}

export async function logConfigurationChange(change: ConfigurationChange): Promise<void> {
  // Store in immutable audit table
  await db.insert(configurationAuditTrail).values({
    ...change,
    createdAt: new Date()
  });
  
  // Generate compliance report entry
  console.log(`Configuration change logged: ${change.id} - ${change.description}`);
}
```

---

## 9. Compliance Verification

### 9.1 IEC 62304 Configuration Management Requirements
- **Section 8.1:** Configuration identification of software items
- **Section 8.2:** Change control procedures for software modifications  
- **Section 8.3:** Configuration status accounting and reporting

### 9.2 Verification Checklist
- [ ] All backend changes tracked in version control
- [ ] Change impact analysis completed for critical modifications
- [ ] Required reviews and approvals obtained
- [ ] Testing completed per change classification
- [ ] Audit trail maintained for all configuration changes
- [ ] Rollback procedures tested and documented

---

*This configuration and change control plan focuses exclusively on eQMS platform backend systems and excludes all frontend, UI, and client-side considerations per regulatory scope definition.*