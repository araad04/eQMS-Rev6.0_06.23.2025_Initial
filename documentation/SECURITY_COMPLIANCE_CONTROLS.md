# Security and Compliance Controls Architecture
## eQMS Comprehensive Security Framework

**Document Control Information**
- Document ID: SCC-eQMS-2025-001
- Version: 1.0
- Date: June 4, 2025
- Author: Security Architecture Team
- Classification: Controlled Document

---

## 1. Security Framework Overview

### 1.1 Security Architecture Principles
The eQMS security architecture is built on defense-in-depth principles with multiple layers of protection:
- **Zero Trust Architecture**: Never trust, always verify
- **Least Privilege Access**: Minimum necessary permissions
- **Data Classification**: Appropriate protection based on sensitivity
- **Continuous Monitoring**: Real-time threat detection and response
- **Compliance by Design**: Regulatory requirements embedded in architecture

### 1.2 Threat Model

| Threat Category | Risk Level | Mitigation Strategy | Detection Method |
|----------------|------------|-------------------|------------------|
| **External Attacks** | High | WAF, DDoS protection, network segmentation | SIEM, IDS/IPS |
| **Insider Threats** | Medium | RBAC, privileged access management, audit logging | User behavior analytics |
| **Data Breaches** | High | Encryption, access controls, data loss prevention | Data classification monitoring |
| **System Vulnerabilities** | Medium | Patch management, vulnerability scanning | Automated security scanning |
| **Social Engineering** | Medium | Security awareness training, MFA | Security incident reporting |
| **Supply Chain Attacks** | Medium | Vendor security assessments, code signing | Dependency scanning |

---

## 2. Authentication and Authorization Architecture

### 2.1 Multi-Factor Authentication Implementation

#### 2.1.1 MFA Service Configuration
```typescript
// MFA Service Implementation
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class MFAService {
  private readonly totpWindow = 1; // 30-second window
  private readonly backupCodeLength = 8;
  private readonly maxFailedAttempts = 3;
  
  async generateTOTPSecret(userId: number): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    const secret = authenticator.generateSecret();
    const serviceName = 'eQMS';
    const userEmail = await this.getUserEmail(userId);
    
    const otpAuthUrl = authenticator.keyuri(
      userEmail,
      serviceName,
      secret
    );
    
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    const backupCodes = this.generateBackupCodes();
    
    // Store encrypted secret and backup codes
    await this.storeMFACredentials(userId, {
      secret: this.encryptData(secret),
      backupCodes: backupCodes.map(code => this.hashData(code)),
      createdAt: new Date()
    });
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }
  
  async verifyTOTP(userId: number, token: string): Promise<boolean> {
    const userMFA = await this.getUserMFACredentials(userId);
    if (!userMFA) return false;
    
    // Check for rate limiting
    if (userMFA.failedAttempts >= this.maxFailedAttempts) {
      throw new SecurityError('MFA temporarily locked due to failed attempts');
    }
    
    const secret = this.decryptData(userMFA.secret);
    const isValid = authenticator.verify({
      token,
      secret,
      window: this.totpWindow
    });
    
    if (isValid) {
      await this.resetFailedAttempts(userId);
      await this.logSecurityEvent(userId, 'MFA_SUCCESS', {
        timestamp: new Date(),
        method: 'TOTP'
      });
    } else {
      await this.incrementFailedAttempts(userId);
      await this.logSecurityEvent(userId, 'MFA_FAILURE', {
        timestamp: new Date(),
        method: 'TOTP',
        failedAttempts: userMFA.failedAttempts + 1
      });
    }
    
    return isValid;
  }
  
  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      crypto.randomBytes(this.backupCodeLength)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)!
        .join('-')
    );
  }
  
  private encryptData(data: string): string {
    const cipher = crypto.createCipher('aes-256-gcm', process.env.MFA_ENCRYPTION_KEY!);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  private decryptData(encryptedData: string): string {
    const decipher = crypto.createDecipher('aes-256-gcm', process.env.MFA_ENCRYPTION_KEY!);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

#### 2.1.2 Adaptive Authentication
```typescript
// Adaptive Authentication Service
export class AdaptiveAuthService {
  private riskFactors = {
    UNKNOWN_DEVICE: 30,
    UNUSUAL_LOCATION: 25,
    OFF_HOURS_ACCESS: 15,
    FAILED_ATTEMPTS_HISTORY: 20,
    VPN_ACCESS: 10,
    PRIVILEGE_ESCALATION: 35
  };
  
  async calculateRiskScore(authRequest: AuthenticationRequest): Promise<number> {
    let riskScore = 0;
    
    // Device recognition
    const deviceFingerprint = this.generateDeviceFingerprint(authRequest);
    const isKnownDevice = await this.isDeviceKnown(authRequest.userId, deviceFingerprint);
    if (!isKnownDevice) {
      riskScore += this.riskFactors.UNKNOWN_DEVICE;
    }
    
    // Location analysis
    const userLocation = await this.getLocationFromIP(authRequest.ipAddress);
    const isUsualLocation = await this.isUsualLocation(authRequest.userId, userLocation);
    if (!isUsualLocation) {
      riskScore += this.riskFactors.UNUSUAL_LOCATION;
    }
    
    // Time-based analysis
    const currentHour = new Date().getHours();
    const userProfile = await this.getUserAccessProfile(authRequest.userId);
    if (!this.isWithinNormalHours(currentHour, userProfile.normalAccessHours)) {
      riskScore += this.riskFactors.OFF_HOURS_ACCESS;
    }
    
    // Failed attempts history
    const recentFailedAttempts = await this.getRecentFailedAttempts(
      authRequest.userId, 
      24 // hours
    );
    if (recentFailedAttempts > 3) {
      riskScore += this.riskFactors.FAILED_ATTEMPTS_HISTORY;
    }
    
    return Math.min(riskScore, 100); // Cap at 100
  }
  
  async determineAuthRequirements(riskScore: number): Promise<AuthRequirement[]> {
    const requirements: AuthRequirement[] = ['PASSWORD'];
    
    if (riskScore >= 20) {
      requirements.push('MFA');
    }
    
    if (riskScore >= 50) {
      requirements.push('ADMIN_APPROVAL');
    }
    
    if (riskScore >= 70) {
      requirements.push('SECURITY_REVIEW');
    }
    
    return requirements;
  }
}
```

### 2.2 Role-Based Access Control (RBAC)

#### 2.2.1 Permission Matrix Implementation
```typescript
// RBAC Permission System
export enum Permission {
  // Management Review Permissions
  MANAGEMENT_REVIEW_VIEW = 'management_review:view',
  MANAGEMENT_REVIEW_CREATE = 'management_review:create',
  MANAGEMENT_REVIEW_EDIT = 'management_review:edit',
  MANAGEMENT_REVIEW_DELETE = 'management_review:delete',
  MANAGEMENT_REVIEW_APPROVE = 'management_review:approve',
  
  // CAPA Permissions
  CAPA_VIEW = 'capa:view',
  CAPA_CREATE = 'capa:create',
  CAPA_EDIT = 'capa:edit',
  CAPA_DELETE = 'capa:delete',
  CAPA_ASSIGN = 'capa:assign',
  CAPA_CLOSE = 'capa:close',
  
  // Audit Permissions
  AUDIT_VIEW = 'audit:view',
  AUDIT_CREATE = 'audit:create',
  AUDIT_EDIT = 'audit:edit',
  AUDIT_DELETE = 'audit:delete',
  AUDIT_EXECUTE = 'audit:execute',
  
  // System Administration
  USER_MANAGEMENT = 'admin:users',
  SYSTEM_CONFIG = 'admin:config',
  SECURITY_ADMIN = 'admin:security',
  AUDIT_TRAIL_VIEW = 'admin:audit_trail'
}

export enum UserRole {
  QUALITY_MANAGER = 'quality_manager',
  QUALITY_ENGINEER = 'quality_engineer',
  AUDITOR = 'auditor',
  DOCUMENT_CONTROLLER = 'document_controller',
  SYSTEM_ADMIN = 'system_admin',
  SECURITY_ADMIN = 'security_admin'
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.QUALITY_MANAGER]: [
    Permission.MANAGEMENT_REVIEW_VIEW,
    Permission.MANAGEMENT_REVIEW_CREATE,
    Permission.MANAGEMENT_REVIEW_EDIT,
    Permission.MANAGEMENT_REVIEW_APPROVE,
    Permission.CAPA_VIEW,
    Permission.CAPA_CREATE,
    Permission.CAPA_ASSIGN,
    Permission.CAPA_CLOSE,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_CREATE
  ],
  [UserRole.QUALITY_ENGINEER]: [
    Permission.MANAGEMENT_REVIEW_VIEW,
    Permission.CAPA_VIEW,
    Permission.CAPA_CREATE,
    Permission.CAPA_EDIT,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXECUTE
  ],
  [UserRole.AUDITOR]: [
    Permission.AUDIT_VIEW,
    Permission.AUDIT_CREATE,
    Permission.AUDIT_EDIT,
    Permission.AUDIT_EXECUTE,
    Permission.CAPA_VIEW
  ],
  [UserRole.SYSTEM_ADMIN]: [
    Permission.USER_MANAGEMENT,
    Permission.SYSTEM_CONFIG,
    Permission.AUDIT_TRAIL_VIEW
  ],
  [UserRole.SECURITY_ADMIN]: [
    Permission.USER_MANAGEMENT,
    Permission.SECURITY_ADMIN,
    Permission.AUDIT_TRAIL_VIEW
  ]
};

export class RBACService {
  async hasPermission(userId: number, permission: Permission): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    
    for (const role of userRoles) {
      const rolePermissions = ROLE_PERMISSIONS[role];
      if (rolePermissions.includes(permission)) {
        return true;
      }
    }
    
    // Check for explicitly granted permissions
    const explicitPermissions = await this.getExplicitPermissions(userId);
    return explicitPermissions.includes(permission);
  }
  
  async checkPermission(userId: number, permission: Permission): Promise<void> {
    const hasPermission = await this.hasPermission(userId, permission);
    if (!hasPermission) {
      await this.logSecurityEvent(userId, 'PERMISSION_DENIED', {
        permission,
        timestamp: new Date()
      });
      throw new UnauthorizedError(`Access denied: ${permission}`);
    }
  }
}
```

#### 2.2.2 Dynamic Permission Evaluation
```typescript
// Context-Aware Authorization
export class ContextualAuthorizationService {
  async canAccessResource(
    userId: number, 
    resourceType: string, 
    resourceId: number, 
    action: string,
    context: AuthorizationContext
  ): Promise<boolean> {
    
    // Basic permission check
    const permission = `${resourceType}:${action}`;
    const hasBasicPermission = await this.rbacService.hasPermission(userId, permission);
    if (!hasBasicPermission) return false;
    
    // Resource-specific checks
    switch (resourceType) {
      case 'management_review':
        return await this.checkManagementReviewAccess(userId, resourceId, action, context);
      case 'capa':
        return await this.checkCAPAAccess(userId, resourceId, action, context);
      case 'audit':
        return await this.checkAuditAccess(userId, resourceId, action, context);
      default:
        return hasBasicPermission;
    }
  }
  
  private async checkManagementReviewAccess(
    userId: number, 
    reviewId: number, 
    action: string,
    context: AuthorizationContext
  ): Promise<boolean> {
    const review = await this.storage.getManagementReview(reviewId);
    if (!review) return false;
    
    // Owners can always edit their own reviews (unless approved)
    if (review.createdBy === userId && action === 'edit' && review.status === 'draft') {
      return true;
    }
    
    // Department-based access
    const userDepartment = await this.getUserDepartment(userId);
    const reviewDepartment = await this.getReviewDepartment(reviewId);
    
    if (action === 'view' && userDepartment === reviewDepartment) {
      return true;
    }
    
    // Time-based restrictions
    if (action === 'edit' && this.isReviewLocked(review)) {
      return false;
    }
    
    return true;
  }
  
  private async checkCAPAAccess(
    userId: number, 
    capaId: number, 
    action: string,
    context: AuthorizationContext
  ): Promise<boolean> {
    const capa = await this.storage.getCapa(capaId);
    if (!capa) return false;
    
    // Assigned users can edit
    if (capa.assignedTo === userId && ['edit', 'view'].includes(action)) {
      return true;
    }
    
    // Initiators can view
    if (capa.initiatedBy === userId && action === 'view') {
      return true;
    }
    
    // Status-based restrictions
    if (action === 'edit' && capa.status === 'closed') {
      return false;
    }
    
    return true;
  }
}
```

---

## 3. Data Encryption and Protection

### 3.1 Encryption at Rest

#### 3.1.1 Field-Level Encryption
```typescript
// Field-Level Encryption Service
export class FieldEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationSalt = process.env.ENCRYPTION_SALT!;
  
  async encryptSensitiveField(data: string, context: EncryptionContext): Promise<EncryptedField> {
    const key = await this.deriveKey(context);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    
    // Add authenticated data for integrity
    cipher.setAAD(Buffer.from(context.entityType + context.fieldName));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion: context.keyVersion || 1,
      algorithm: this.algorithm
    };
  }
  
  async decryptSensitiveField(
    encryptedField: EncryptedField, 
    context: EncryptionContext
  ): Promise<string> {
    const key = await this.deriveKey(context, encryptedField.keyVersion);
    const decipher = crypto.createDecipher(this.algorithm, key);
    
    decipher.setAuthTag(Buffer.from(encryptedField.authTag, 'hex'));
    decipher.setAAD(Buffer.from(context.entityType + context.fieldName));
    
    let decrypted = decipher.update(encryptedField.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  private async deriveKey(context: EncryptionContext, keyVersion: number = 1): Promise<Buffer> {
    const keyMaterial = process.env[`ENCRYPTION_KEY_V${keyVersion}`]!;
    return crypto.pbkdf2Sync(
      keyMaterial,
      this.keyDerivationSalt + context.entityType,
      100000,
      32,
      'sha256'
    );
  }
}

// Database Schema with Encryption
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  emailEncrypted: text('email_encrypted').notNull(),
  emailHash: varchar('email_hash', { length: 64 }).notNull().unique(),
  phoneEncrypted: text('phone_encrypted'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
});
```

#### 3.1.2 Key Management Service
```typescript
// Enterprise Key Management
export class KeyManagementService {
  private readonly keyRotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days
  
  async rotateEncryptionKeys(): Promise<void> {
    const currentKeyVersion = await this.getCurrentKeyVersion();
    const newKeyVersion = currentKeyVersion + 1;
    
    // Generate new key
    const newKey = crypto.randomBytes(32).toString('hex');
    await this.storeKey(newKeyVersion, newKey);
    
    // Mark current key for rotation
    await this.markKeyForRotation(currentKeyVersion);
    
    // Schedule background re-encryption
    await this.scheduleDataReEncryption(currentKeyVersion, newKeyVersion);
    
    // Log key rotation event
    await this.auditService.logSecurityEvent('KEY_ROTATION', {
      oldVersion: currentKeyVersion,
      newVersion: newKeyVersion,
      timestamp: new Date()
    });
  }
  
  async getEncryptionKey(version: number): Promise<string> {
    const key = await this.keyStore.getKey(version);
    if (!key) {
      throw new SecurityError(`Encryption key version ${version} not found`);
    }
    
    // Check if key is still valid
    if (await this.isKeyExpired(version)) {
      throw new SecurityError(`Encryption key version ${version} has expired`);
    }
    
    return key;
  }
  
  private async scheduleDataReEncryption(oldVersion: number, newVersion: number): Promise<void> {
    // Queue background job for re-encryption
    await this.jobQueue.add('reencrypt-data', {
      oldKeyVersion: oldVersion,
      newKeyVersion: newVersion,
      priority: 'high'
    });
  }
}
```

### 3.2 Encryption in Transit

#### 3.2.1 TLS Configuration
```typescript
// TLS Security Configuration
export const tlsConfig = {
  minVersion: 'TLSv1.3',
  maxVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ].join(':'),
  honorCipherOrder: true,
  secureProtocol: 'TLSv1_3_method',
  ecdhCurve: 'prime256v1',
  dhparam: process.env.DH_PARAMS_PATH
};

// Express HTTPS Server
export function createSecureServer(app: Express): https.Server {
  const options = {
    key: fs.readFileSync(process.env.SSL_PRIVATE_KEY_PATH!),
    cert: fs.readFileSync(process.env.SSL_CERTIFICATE_PATH!),
    ca: fs.readFileSync(process.env.SSL_CA_PATH!),
    ...tlsConfig,
    
    // Security headers middleware
    secureHeaders: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  };
  
  return https.createServer(options, app);
}
```

---

## 4. Audit Trail and Compliance

### 4.1 Comprehensive Audit Logging

#### 4.1.1 Audit Service Implementation
```typescript
// Enhanced Audit Trail Service
export class AuditTrailService {
  async logDataChange(change: DataChangeEvent): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: change.userId,
      sessionId: change.sessionId,
      action: change.action,
      entityType: change.entityType,
      entityId: change.entityId,
      oldValues: this.sanitizeData(change.oldValues),
      newValues: this.sanitizeData(change.newValues),
      ipAddress: change.ipAddress,
      userAgent: change.userAgent,
      geolocation: await this.getGeolocation(change.ipAddress),
      riskScore: await this.calculateRiskScore(change),
      signature: await this.generateIntegritySignature(change)
    };
    
    // Store in primary audit log
    await this.storeAuditEntry(auditEntry);
    
    // Store in immutable backup (blockchain or append-only log)
    await this.storeImmutableAudit(auditEntry);
    
    // Real-time alerting for suspicious activities
    if (auditEntry.riskScore > 70) {
      await this.triggerSecurityAlert(auditEntry);
    }
  }
  
  async generateComplianceReport(
    startDate: Date, 
    endDate: Date, 
    entityTypes?: string[]
  ): Promise<ComplianceReport> {
    const auditEntries = await this.getAuditEntries({
      startDate,
      endDate,
      entityTypes
    });
    
    return {
      reportId: crypto.randomUUID(),
      generatedAt: new Date(),
      period: { startDate, endDate },
      totalEntries: auditEntries.length,
      entitiesCovered: this.getUniqueEntities(auditEntries),
      userActivity: this.analyzeUserActivity(auditEntries),
      dataChanges: this.analyzeDataChanges(auditEntries),
      securityEvents: this.analyzeSecurityEvents(auditEntries),
      complianceStatus: await this.assessComplianceStatus(auditEntries),
      integrityVerification: await this.verifyAuditIntegrity(auditEntries)
    };
  }
  
  private async generateIntegritySignature(event: DataChangeEvent): Promise<string> {
    const data = JSON.stringify({
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      oldValues: event.oldValues,
      newValues: event.newValues
    });
    
    const privateKey = await this.getAuditSigningKey();
    const signature = crypto.sign('sha256', Buffer.from(data));
    return signature.toString('hex');
  }
  
  async verifyAuditIntegrity(entries: AuditLogEntry[]): Promise<IntegrityReport> {
    const results = await Promise.all(
      entries.map(async (entry) => {
        const expectedSignature = await this.generateIntegritySignature(entry);
        return {
          entryId: entry.id,
          isValid: entry.signature === expectedSignature,
          timestamp: entry.timestamp
        };
      })
    );
    
    const invalidEntries = results.filter(r => !r.isValid);
    
    return {
      totalEntries: entries.length,
      validEntries: results.length - invalidEntries.length,
      invalidEntries: invalidEntries.length,
      integrityPercentage: ((results.length - invalidEntries.length) / results.length) * 100,
      compromisedEntries: invalidEntries
    };
  }
}
```

#### 4.1.2 21 CFR Part 11 Compliance
```typescript
// Electronic Records Compliance
export class ElectronicRecordsService {
  async createElectronicRecord(record: ElectronicRecordData): Promise<ElectronicRecord> {
    // Validate record structure according to 21 CFR Part 11
    await this.validateRecordStructure(record);
    
    const electronicRecord: ElectronicRecord = {
      id: crypto.randomUUID(),
      recordType: record.type,
      content: record.content,
      createdBy: record.createdBy,
      createdAt: new Date(),
      version: 1,
      status: 'active',
      checksumAlgorithm: 'SHA-256',
      checksum: this.calculateChecksum(record.content),
      digitalSignatures: [],
      accessLog: [],
      retentionPeriod: record.retentionPeriod || this.getDefaultRetentionPeriod(record.type),
      regulatoryRequirements: ['21CFR11', 'ISO13485']
    };
    
    // Store with versioning
    await this.storeElectronicRecord(electronicRecord);
    
    // Create audit trail entry
    await this.auditService.logRecordCreation(electronicRecord);
    
    return electronicRecord;
  }
  
  async applyElectronicSignature(
    recordId: string, 
    signatureData: ElectronicSignatureData
  ): Promise<ElectronicSignature> {
    const record = await this.getElectronicRecord(recordId);
    if (!record) {
      throw new NotFoundError('Electronic record not found');
    }
    
    // Verify user identity and authentication
    await this.verifyUserAuthentication(signatureData.userId, signatureData.authToken);
    
    // Re-authenticate for signature (21 CFR Part 11 requirement)
    await this.requireReAuthentication(signatureData.userId, signatureData.password);
    
    const signature: ElectronicSignature = {
      id: crypto.randomUUID(),
      recordId,
      userId: signatureData.userId,
      signatureMeaning: signatureData.meaning,
      signedAt: new Date(),
      ipAddress: signatureData.ipAddress,
      userAgent: signatureData.userAgent,
      geolocation: await this.getGeolocation(signatureData.ipAddress),
      biometricData: signatureData.biometricData,
      cryptographicSignature: await this.generateCryptographicSignature(record, signatureData),
      witnessSignatures: [],
      isValid: true
    };
    
    // Add signature to record
    record.digitalSignatures.push(signature);
    record.lastModifiedAt = new Date();
    record.lastModifiedBy = signatureData.userId;
    
    // Update record
    await this.updateElectronicRecord(record);
    
    // Audit trail
    await this.auditService.logElectronicSignature(signature);
    
    return signature;
  }
  
  private async generateCryptographicSignature(
    record: ElectronicRecord, 
    signatureData: ElectronicSignatureData
  ): Promise<string> {
    const dataToSign = JSON.stringify({
      recordId: record.id,
      content: record.content,
      checksum: record.checksum,
      userId: signatureData.userId,
      timestamp: signatureData.timestamp,
      meaning: signatureData.meaning
    });
    
    const privateKey = await this.getUserPrivateKey(signatureData.userId);
    const signature = crypto.sign('RSA-SHA256', Buffer.from(dataToSign), privateKey);
    return signature.toString('base64');
  }
}
```

---

## 5. Security Monitoring and Incident Response

### 5.1 Real-Time Security Monitoring

#### 5.1.1 Security Event Detection
```typescript
// Security Monitoring Service
export class SecurityMonitoringService {
  private readonly suspiciousPatterns = {
    RAPID_LOGIN_ATTEMPTS: { threshold: 5, timeWindow: 300000 }, // 5 attempts in 5 minutes
    UNUSUAL_DATA_ACCESS: { threshold: 100, timeWindow: 3600000 }, // 100 records in 1 hour
    PRIVILEGE_ESCALATION: { threshold: 1, timeWindow: 86400000 }, // 1 attempt in 24 hours
    OFF_HOURS_ADMIN_ACCESS: { threshold: 1, timeWindow: 28800000 }, // 1 attempt in 8 hours
    BULK_DATA_EXPORT: { threshold: 1000, timeWindow: 3600000 } // 1000 records in 1 hour
  };
  
  async analyzeSecurityEvent(event: SecurityEvent): Promise<ThreatAssessment> {
    const threatLevel = await this.calculateThreatLevel(event);
    const indicators = await this.detectThreatIndicators(event);
    
    const assessment: ThreatAssessment = {
      eventId: event.id,
      threatLevel,
      indicators,
      riskScore: this.calculateRiskScore(threatLevel, indicators),
      recommendedActions: await this.getRecommendedActions(threatLevel),
      timestamp: new Date()
    };
    
    // Trigger automated response for high-risk events
    if (assessment.threatLevel >= ThreatLevel.HIGH) {
      await this.triggerAutomatedResponse(assessment);
    }
    
    return assessment;
  }
  
  private async detectThreatIndicators(event: SecurityEvent): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = [];
    
    // Check for rapid successive login attempts
    if (event.type === 'LOGIN_ATTEMPT') {
      const recentAttempts = await this.getRecentLoginAttempts(
        event.userId,
        this.suspiciousPatterns.RAPID_LOGIN_ATTEMPTS.timeWindow
      );
      
      if (recentAttempts.length >= this.suspiciousPatterns.RAPID_LOGIN_ATTEMPTS.threshold) {
        indicators.push({
          type: 'BRUTE_FORCE_ATTACK',
          severity: 'HIGH',
          description: 'Multiple failed login attempts detected',
          evidence: { attemptCount: recentAttempts.length }
        });
      }
    }
    
    // Check for unusual data access patterns
    if (event.type === 'DATA_ACCESS') {
      const userProfile = await this.getUserBehaviorProfile(event.userId);
      const isUnusualAccess = await this.isUnusualDataAccess(event, userProfile);
      
      if (isUnusualAccess) {
        indicators.push({
          type: 'ANOMALOUS_DATA_ACCESS',
          severity: 'MEDIUM',
          description: 'Access pattern deviates from user baseline',
          evidence: { deviationScore: await this.calculateDeviationScore(event, userProfile) }
        });
      }
    }
    
    // Check for privilege escalation attempts
    if (event.type === 'PERMISSION_CHANGE') {
      const escalation = await this.detectPrivilegeEscalation(event);
      if (escalation) {
        indicators.push({
          type: 'PRIVILEGE_ESCALATION',
          severity: 'CRITICAL',
          description: 'Unauthorized privilege escalation detected',
          evidence: escalation
        });
      }
    }
    
    return indicators;
  }
  
  private async triggerAutomatedResponse(assessment: ThreatAssessment): Promise<void> {
    const responses: SecurityResponse[] = [];
    
    // Account lockdown for critical threats
    if (assessment.threatLevel === ThreatLevel.CRITICAL) {
      responses.push({
        type: 'ACCOUNT_LOCKDOWN',
        userId: assessment.eventId,
        duration: 3600000, // 1 hour
        reason: 'Critical security threat detected'
      });
    }
    
    // Session termination for high threats
    if (assessment.threatLevel >= ThreatLevel.HIGH) {
      responses.push({
        type: 'SESSION_TERMINATION',
        userId: assessment.eventId,
        reason: 'High-risk activity detected'
      });
    }
    
    // Security team notification
    responses.push({
      type: 'SECURITY_ALERT',
      recipients: await this.getSecurityTeamContacts(),
      assessment
    });
    
    // Execute responses
    await Promise.all(responses.map(response => this.executeSecurityResponse(response)));
  }
}
```

#### 5.1.2 Incident Response Automation
```typescript
// Incident Response Service
export class IncidentResponseService {
  async handleSecurityIncident(incident: SecurityIncident): Promise<IncidentResponse> {
    const incidentId = crypto.randomUUID();
    const response: IncidentResponse = {
      incidentId,
      severity: incident.severity,
      category: incident.category,
      detectedAt: new Date(),
      status: 'DETECTED',
      containmentActions: [],
      investigationSteps: [],
      recoveryActions: []
    };
    
    // Immediate containment
    if (incident.severity >= IncidentSeverity.HIGH) {
      await this.executeImmediateContainment(incident, response);
    }
    
    // Start investigation
    await this.initiateInvestigation(incident, response);
    
    // Notify stakeholders
    await this.notifyStakeholders(incident, response);
    
    // Document incident
    await this.documentIncident(response);
    
    return response;
  }
  
  private async executeImmediateContainment(
    incident: SecurityIncident, 
    response: IncidentResponse
  ): Promise<void> {
    switch (incident.category) {
      case 'DATA_BREACH':
        await this.containDataBreach(incident, response);
        break;
      case 'MALWARE_DETECTION':
        await this.containMalware(incident, response);
        break;
      case 'UNAUTHORIZED_ACCESS':
        await this.containUnauthorizedAccess(incident, response);
        break;
      case 'SYSTEM_COMPROMISE':
        await this.containSystemCompromise(incident, response);
        break;
    }
  }
  
  private async containDataBreach(
    incident: SecurityIncident, 
    response: IncidentResponse
  ): Promise<void> {
    // Isolate affected systems
    const affectedSystems = incident.affectedResources;
    for (const system of affectedSystems) {
      await this.isolateSystem(system);
      response.containmentActions.push({
        action: 'SYSTEM_ISOLATION',
        target: system,
        timestamp: new Date(),
        status: 'COMPLETED'
      });
    }
    
    // Revoke access tokens
    const affectedUsers = await this.getAffectedUsers(incident);
    for (const userId of affectedUsers) {
      await this.revokeAllUserSessions(userId);
      response.containmentActions.push({
        action: 'SESSION_REVOCATION',
        target: `user:${userId}`,
        timestamp: new Date(),
        status: 'COMPLETED'
      });
    }
    
    // Enable enhanced monitoring
    await this.enableEnhancedMonitoring(incident.affectedResources);
    response.containmentActions.push({
      action: 'ENHANCED_MONITORING',
      target: 'all_systems',
      timestamp: new Date(),
      status: 'ACTIVE'
    });
  }
}
```

---

## 6. Compliance Management

### 6.1 Regulatory Compliance Framework

#### 6.1.1 ISO 13485:2016 Compliance
```typescript
// ISO 13485 Compliance Manager
export class ISO13485ComplianceManager {
  private readonly requirements = {
    DOCUMENT_CONTROL: '4.2.3',
    MANAGEMENT_RESPONSIBILITY: '5',
    RESOURCE_MANAGEMENT: '6',
    PRODUCT_REALIZATION: '7',
    MEASUREMENT_ANALYSIS: '8'
  };
  
  async validateDocumentControl(): Promise<ComplianceResult> {
    const checks = [
      await this.checkDocumentApproval(),
      await this.checkDocumentRevisionControl(),
      await this.checkDocumentDistribution(),
      await this.checkObsoleteDocumentControl()
    ];
    
    return {
      requirement: this.requirements.DOCUMENT_CONTROL,
      overallCompliance: this.calculateOverallCompliance(checks),
      details: checks,
      recommendations: await this.generateRecommendations(checks)
    };
  }
  
  async validateManagementReview(): Promise<ComplianceResult> {
    const reviews = await this.getManagementReviews();
    const checks = [
      await this.checkReviewFrequency(reviews),
      await this.checkReviewInputs(reviews),
      await this.checkReviewOutputs(reviews),
      await this.checkActionItemTracking(reviews)
    ];
    
    return {
      requirement: this.requirements.MANAGEMENT_RESPONSIBILITY,
      overallCompliance: this.calculateOverallCompliance(checks),
      details: checks,
      recommendations: await this.generateRecommendations(checks)
    };
  }
  
  private async checkDocumentApproval(): Promise<ComplianceCheck> {
    const documents = await this.getControlledDocuments();
    const unapprovedDocuments = documents.filter(doc => !doc.approvedBy);
    
    return {
      checkName: 'Document Approval',
      requirement: '4.2.3.a',
      status: unapprovedDocuments.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
      score: ((documents.length - unapprovedDocuments.length) / documents.length) * 100,
      findings: unapprovedDocuments.map(doc => ({
        severity: 'MAJOR',
        description: `Document ${doc.id} lacks required approval`,
        evidence: { documentId: doc.id, status: doc.status }
      }))
    };
  }
}
```

#### 6.1.2 GDPR Compliance Implementation
```typescript
// GDPR Compliance Service
export class GDPRComplianceService {
  async processDataSubjectRequest(request: DataSubjectRequest): Promise<DataSubjectResponse> {
    const requestId = crypto.randomUUID();
    
    // Verify identity
    await this.verifyDataSubjectIdentity(request);
    
    switch (request.type) {
      case 'ACCESS':
        return await this.handleDataAccessRequest(requestId, request);
      case 'RECTIFICATION':
        return await this.handleDataRectificationRequest(requestId, request);
      case 'ERASURE':
        return await this.handleDataErasureRequest(requestId, request);
      case 'PORTABILITY':
        return await this.handleDataPortabilityRequest(requestId, request);
      case 'OBJECTION':
        return await this.handleProcessingObjectionRequest(requestId, request);
      default:
        throw new ValidationError('Invalid data subject request type');
    }
  }
  
  private async handleDataErasureRequest(
    requestId: string, 
    request: DataSubjectRequest
  ): Promise<DataSubjectResponse> {
    // Check for erasure exemptions
    const exemptions = await this.checkErasureExemptions(request.subjectId);
    if (exemptions.length > 0) {
      return {
        requestId,
        status: 'PARTIALLY_FULFILLED',
        exemptions,
        completedAt: new Date()
      };
    }
    
    // Identify all personal data
    const personalData = await this.identifyPersonalData(request.subjectId);
    
    // Perform pseudonymization or deletion
    const deletionResults = await Promise.all(
      personalData.map(async (data) => {
        if (data.requiresRetention) {
          return await this.pseudonymizeData(data);
        } else {
          return await this.deleteData(data);
        }
      })
    );
    
    // Document erasure actions
    await this.documentErasureActions(requestId, deletionResults);
    
    return {
      requestId,
      status: 'FULFILLED',
      actions: deletionResults,
      completedAt: new Date()
    };
  }
  
  async generatePrivacyImpactAssessment(
    processing: DataProcessingActivity
  ): Promise<PrivacyImpactAssessment> {
    const risks = await this.identifyPrivacyRisks(processing);
    const measures = await this.identifyMitigationMeasures(risks);
    
    return {
      id: crypto.randomUUID(),
      processingActivity: processing,
      conductedBy: processing.dataController,
      conductedAt: new Date(),
      risks,
      mitigationMeasures: measures,
      residualRisk: this.calculateResidualRisk(risks, measures),
      approval: await this.requiresDPOApproval(risks, measures)
    };
  }
}
```

This comprehensive security and compliance controls architecture provides enterprise-grade protection while ensuring regulatory compliance across multiple frameworks including ISO 13485:2016, 21 CFR Part 11, and GDPR.