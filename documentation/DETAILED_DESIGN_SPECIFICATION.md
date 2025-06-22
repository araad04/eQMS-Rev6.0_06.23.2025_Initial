# Detailed Design Specification (DDS)
## eQMS Module Enhancement Framework

**Document Control Information**
- Document ID: DDS-eQMS-2025-001
- Version: 1.0
- Date: June 4, 2025
- Author: Senior Software Development Team
- Approved By: System Architect
- Classification: Controlled Document

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture
The eQMS system follows a modern microservices architecture with the following key components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  React Frontend  │  Mobile App  │  API Documentation       │
│  (TypeScript)    │  (React Native)│  (Swagger/OpenAPI)     │
└─────────────────────────────────────────────────────────────┘
                               │
                         ┌─────▼─────┐
                         │ API Gateway │
                         │ (Express.js)│
                         └─────┬─────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                 Application Services Layer                  │
├─────────────────────────────────────────────────────────────┤
│ Auth Service │ QMS Core │ Workflow │ Document │ Audit Trail │
│              │ Services │ Engine   │ Service  │ Service     │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Drizzle ORM  │  Database Pool │  Cache Layer (Redis)      │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                     Data Storage Layer                      │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL   │  File Storage  │  Backup & Archive         │
│  (Primary DB) │  (AWS S3/Local)│  (Cold Storage)           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack
- **Frontend**: React 18+ with TypeScript, Vite build system
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with refresh tokens, RBAC
- **Caching**: Redis for session and data caching
- **File Storage**: AWS S3 compatible storage
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **Monitoring**: Prometheus, Grafana, Sentry
- **Containerization**: Docker with Kubernetes orchestration

---

## 2. Component Design Specifications

### 2.1 Frontend Architecture

#### 2.1.1 Component Hierarchy
```
App
├── AuthProvider
├── QueryClientProvider
├── Router
│   ├── PublicRoutes
│   │   ├── LoginPage
│   │   └── ForgotPasswordPage
│   └── ProtectedRoutes
│       ├── DashboardPage
│       ├── QMSModules
│       │   ├── ManagementReviewModule
│       │   ├── CAPAModule
│       │   ├── AuditModule
│       │   ├── DocumentControlModule
│       │   └── SupplierManagementModule
│       └── AdminModules
│           ├── UserManagement
│           ├── SystemConfiguration
│           └── AuditReports
```

#### 2.1.2 State Management Design
```typescript
// Global State Structure
interface GlobalState {
  auth: {
    user: User | null;
    token: string | null;
    permissions: Permission[];
    isAuthenticated: boolean;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebar: {
      collapsed: boolean;
      activeModule: string;
    };
    notifications: Notification[];
    loading: LoadingState;
  };
  cache: {
    masterData: MasterDataCache;
    userPreferences: UserPreferences;
  };
}

// Module-Specific State
interface ModuleState<T> {
  data: T[];
  filters: FilterState;
  pagination: PaginationState;
  selection: SelectionState;
  editMode: EditModeState;
}
```

#### 2.1.3 API Client Design
```typescript
class APIClient {
  private baseURL: string;
  private authToken: string | null;
  
  constructor(config: APIConfig) {
    this.baseURL = config.baseURL;
    this.setupInterceptors();
  }
  
  // Generic CRUD operations
  async get<T>(endpoint: string, params?: QueryParams): Promise<T>;
  async post<T>(endpoint: string, data: any): Promise<T>;
  async put<T>(endpoint: string, data: any): Promise<T>;
  async delete(endpoint: string): Promise<void>;
  
  // Specialized methods
  async uploadFile(file: File, endpoint: string): Promise<FileUploadResponse>;
  async downloadFile(endpoint: string): Promise<Blob>;
  async streamData<T>(endpoint: string): AsyncGenerator<T>;
}
```

### 2.2 Backend Architecture

#### 2.2.1 Service Layer Design
```typescript
// Base Service Interface
interface BaseService<T, CreateT, UpdateT> {
  findById(id: number): Promise<T | null>;
  findAll(filters?: FilterOptions): Promise<PaginatedResult<T>>;
  create(data: CreateT): Promise<T>;
  update(id: number, data: UpdateT): Promise<T>;
  delete(id: number): Promise<void>;
}

// QMS-Specific Service Example
class CAPAService extends BaseService<CAPA, CreateCAPAData, UpdateCAPAData> {
  constructor(
    private storage: IStorage,
    private auditService: AuditService,
    private workflowEngine: WorkflowEngine
  ) {}
  
  async assignCAPAToUser(capaId: number, userId: number): Promise<CAPA> {
    // Business logic implementation
    const capa = await this.findById(capaId);
    if (!capa) throw new NotFoundError('CAPA not found');
    
    const updatedCapa = await this.update(capaId, { assignedTo: userId });
    
    // Trigger workflow
    await this.workflowEngine.triggerEvent('capaAssigned', {
      capaId,
      userId,
      timestamp: new Date()
    });
    
    // Create audit trail
    await this.auditService.logAction({
      action: 'CAPA_ASSIGNED',
      entityType: 'CAPA',
      entityId: capaId,
      userId,
      changes: { assignedTo: userId }
    });
    
    return updatedCapa;
  }
}
```

#### 2.2.2 Middleware Design
```typescript
// Authentication Middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as AuthenticatedUser;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization Middleware
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Audit Trail Middleware
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Log successful operations
    if (res.statusCode < 400) {
      auditLogger.logAPICall({
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        timestamp: new Date(),
        statusCode: res.statusCode
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};
```

### 2.3 Database Design

#### 2.3.1 Schema Design Patterns
```sql
-- Audit Trail Pattern
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Soft Delete Pattern
CREATE TABLE base_entity (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by INTEGER REFERENCES users(id)
);

-- Versioning Pattern
CREATE TABLE document_versions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    version_number VARCHAR(20) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    is_current BOOLEAN DEFAULT FALSE
);
```

#### 2.3.2 Index Strategy
```sql
-- Performance Indexes
CREATE INDEX CONCURRENTLY idx_audit_log_table_record 
ON audit_log(table_name, record_id);

CREATE INDEX CONCURRENTLY idx_audit_log_timestamp 
ON audit_log(timestamp DESC);

CREATE INDEX CONCURRENTLY idx_documents_status_type 
ON documents(status_id, type_id) WHERE is_deleted = FALSE;

-- Partial Indexes for Soft Deletes
CREATE INDEX CONCURRENTLY idx_active_records 
ON base_entity(id) WHERE is_deleted = FALSE;

-- GIN Indexes for JSON Search
CREATE INDEX CONCURRENTLY idx_audit_log_changes 
ON audit_log USING GIN(new_values);
```

---

## 3. Security Architecture

### 3.1 Authentication & Authorization Design

#### 3.1.1 JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;              // User ID
  iat: number;              // Issued at
  exp: number;              // Expiration
  aud: string;              // Audience (application)
  iss: string;              // Issuer
  permissions: string[];     // User permissions
  roles: string[];          // User roles
  department: string;       // User department
  sessionId: string;        // Session identifier
}

interface RefreshTokenPayload {
  sub: string;
  tokenFamily: string;      // For token rotation
  sessionId: string;
  exp: number;
}
```

#### 3.1.2 Permission Matrix
```typescript
enum Permission {
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
  AUDIT_TRAIL_VIEW = 'admin:audit_trail'
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'quality_manager': [
    Permission.MANAGEMENT_REVIEW_VIEW,
    Permission.MANAGEMENT_REVIEW_CREATE,
    Permission.MANAGEMENT_REVIEW_EDIT,
    Permission.MANAGEMENT_REVIEW_APPROVE,
    Permission.CAPA_VIEW,
    Permission.CAPA_CREATE,
    Permission.CAPA_ASSIGN,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_CREATE
  ],
  'quality_engineer': [
    Permission.CAPA_VIEW,
    Permission.CAPA_CREATE,
    Permission.CAPA_EDIT,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXECUTE
  ],
  'admin': Object.values(Permission)
};
```

### 3.2 Data Encryption Design

#### 3.2.1 Encryption at Rest
```typescript
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;
  
  async encryptSensitiveData(data: string, context: string): Promise<EncryptedData> {
    const key = await this.deriveKey(context);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from(context));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm
    };
  }
  
  async decryptSensitiveData(
    encryptedData: EncryptedData, 
    context: string
  ): Promise<string> {
    const key = await this.deriveKey(context);
    const decipher = crypto.createDecipher(this.algorithm, key);
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    decipher.setAAD(Buffer.from(context));
    
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### 3.2.2 Database Field Encryption
```sql
-- Encrypted fields using application-level encryption
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email_encrypted TEXT NOT NULL,      -- Encrypted email
    email_hash VARCHAR(64) NOT NULL,    -- Hash for searching
    phone_encrypted TEXT,               -- Encrypted phone
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on hash for searchability
CREATE UNIQUE INDEX idx_users_email_hash ON users(email_hash);
```

---

## 4. API Design Specification

### 4.1 RESTful API Design

#### 4.1.1 URL Structure Convention
```
/api/v1/{resource}[/{id}][/{sub-resource}[/{sub-id}]]

Examples:
GET    /api/v1/management-reviews           # List all management reviews
GET    /api/v1/management-reviews/123       # Get specific management review
POST   /api/v1/management-reviews           # Create new management review
PUT    /api/v1/management-reviews/123       # Update management review
DELETE /api/v1/management-reviews/123       # Delete management review

GET    /api/v1/management-reviews/123/inputs    # Get review inputs
POST   /api/v1/management-reviews/123/approve   # Approve review
```

#### 4.1.2 Response Format Standard
```typescript
// Success Response
interface APIResponse<T> {
  success: true;
  data: T;
  metadata?: {
    pagination?: PaginationMetadata;
    timestamp: string;
    version: string;
  };
}

// Error Response
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;        // For validation errors
    timestamp: string;
  };
}

// Pagination Metadata
interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

#### 4.1.3 API Versioning Strategy
```typescript
// Version-specific controllers
abstract class BaseController {
  protected version: string;
  
  constructor(version: string) {
    this.version = version;
  }
  
  protected formatResponse<T>(data: T): APIResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.version
      }
    };
  }
}

// Version 1 Controller
class ManagementReviewControllerV1 extends BaseController {
  constructor() {
    super('1.0');
  }
  
  async getReviews(req: Request, res: Response) {
    const reviews = await this.managementReviewService.findAll();
    res.json(this.formatResponse(reviews));
  }
}

// Version 2 Controller (with breaking changes)
class ManagementReviewControllerV2 extends BaseController {
  constructor() {
    super('2.0');
  }
  
  async getReviews(req: Request, res: Response) {
    // Enhanced response format in v2
    const reviews = await this.managementReviewService.findAllEnhanced();
    res.json(this.formatResponse(reviews));
  }
}
```

### 4.2 GraphQL API Design (Optional)

#### 4.2.1 Schema Definition
```graphql
type ManagementReview {
  id: ID!
  title: String!
  reviewDate: DateTime!
  status: ReviewStatus!
  createdBy: User!
  inputs: [ReviewInput!]!
  actionItems: [ActionItem!]!
  signatures: [ElectronicSignature!]!
  auditTrail: [AuditLogEntry!]!
}

type Query {
  managementReviews(
    first: Int
    after: String
    filters: ReviewFilters
  ): ManagementReviewConnection!
  
  managementReview(id: ID!): ManagementReview
}

type Mutation {
  createManagementReview(input: CreateReviewInput!): ManagementReview!
  updateManagementReview(id: ID!, input: UpdateReviewInput!): ManagementReview!
  deleteManagementReview(id: ID!): Boolean!
  approveManagementReview(id: ID!, signature: SignatureInput!): ManagementReview!
}

type Subscription {
  reviewUpdated(reviewId: ID!): ManagementReview!
  reviewStatusChanged: ManagementReview!
}
```

---

## 5. Workflow Engine Design

### 5.1 Workflow Definition
```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'subprocess';
  config: StepConfig;
  nextSteps: string[];
  assignments: RoleAssignment[];
  deadlines: Deadline[];
}

interface WorkflowInstance {
  id: string;
  definitionId: string;
  entityType: string;
  entityId: number;
  status: 'active' | 'completed' | 'cancelled' | 'error';
  currentStep: string;
  variables: Record<string, any>;
  history: WorkflowHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Workflow Engine Implementation
```typescript
class WorkflowEngine {
  constructor(
    private storage: IStorage,
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}
  
  async startWorkflow(
    definitionId: string,
    entityType: string,
    entityId: number,
    initiatedBy: number,
    variables: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    const definition = await this.getWorkflowDefinition(definitionId);
    const instance = await this.createWorkflowInstance({
      definitionId,
      entityType,
      entityId,
      status: 'active',
      currentStep: definition.steps[0].id,
      variables,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await this.executeStep(instance.id, definition.steps[0]);
    return instance;
  }
  
  async completeTask(
    instanceId: string,
    stepId: string,
    userId: number,
    data: any
  ): Promise<void> {
    const instance = await this.getWorkflowInstance(instanceId);
    const definition = await this.getWorkflowDefinition(instance.definitionId);
    const currentStep = definition.steps.find(s => s.id === stepId);
    
    if (!currentStep) {
      throw new Error(`Step ${stepId} not found`);
    }
    
    // Record task completion
    await this.recordStepCompletion(instanceId, stepId, userId, data);
    
    // Determine next steps
    const nextSteps = await this.evaluateNextSteps(instance, currentStep, data);
    
    if (nextSteps.length === 0) {
      // Workflow complete
      await this.completeWorkflow(instanceId);
    } else {
      // Execute next steps
      for (const nextStep of nextSteps) {
        await this.executeStep(instanceId, nextStep);
      }
    }
  }
}
```

---

## 6. Performance Optimization

### 6.1 Database Optimization

#### 6.1.1 Query Optimization Patterns
```typescript
// Repository pattern with optimized queries
class ManagementReviewRepository {
  async findWithRelations(filters: ReviewFilters): Promise<ManagementReview[]> {
    return await this.db
      .select({
        review: managementReviews,
        createdBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName
        },
        inputCount: sql<number>`count(${reviewInputs.id})`.as('inputCount'),
        actionItemCount: sql<number>`count(${actionItems.id})`.as('actionItemCount')
      })
      .from(managementReviews)
      .leftJoin(users, eq(managementReviews.createdBy, users.id))
      .leftJoin(reviewInputs, eq(managementReviews.id, reviewInputs.reviewId))
      .leftJoin(actionItems, eq(managementReviews.id, actionItems.reviewId))
      .where(this.buildWhereClause(filters))
      .groupBy(managementReviews.id, users.id)
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
  }
  
  // Prepared statement for frequently used queries
  private findByIdPrepared = this.db
    .select()
    .from(managementReviews)
    .where(eq(managementReviews.id, placeholder('id')))
    .prepare();
    
  async findById(id: number): Promise<ManagementReview | null> {
    const result = await this.findByIdPrepared.execute({ id });
    return result[0] || null;
  }
}
```

#### 6.1.2 Connection Pooling Configuration
```typescript
// Database connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool settings
  max: 20,                    // Maximum pool size
  min: 5,                     // Minimum pool size
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
  
  // Performance settings
  statement_timeout: 10000,   // 10 second query timeout
  query_timeout: 10000,
  
  // SSL configuration
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};
```

### 6.2 Caching Strategy

#### 6.2.1 Redis Caching Implementation
```typescript
class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
  
  // Cache decorators
  @Cacheable('user_permissions', 300) // 5 minute TTL
  async getUserPermissions(userId: number): Promise<Permission[]> {
    // Implementation
  }
  
  @CacheEvict(['user_permissions:*'])
  async updateUserRole(userId: number, role: UserRole): Promise<void> {
    // Implementation that invalidates related cache
  }
}
```

---

## 7. Error Handling and Logging

### 7.1 Error Handling Architecture

#### 7.1.1 Custom Error Classes
```typescript
abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly isOperational: boolean;
  
  constructor(message: string, public readonly context?: any) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly isOperational = true;
  
  constructor(message: string, public readonly field: string) {
    super(message);
  }
}

class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
  readonly isOperational = true;
}

class UnauthorizedError extends BaseError {
  readonly statusCode = 401;
  readonly errorCode = 'UNAUTHORIZED';
  readonly isOperational = true;
}

class BusinessRuleViolationError extends BaseError {
  readonly statusCode = 422;
  readonly errorCode = 'BUSINESS_RULE_VIOLATION';
  readonly isOperational = true;
}
```

#### 7.1.2 Global Error Handler
```typescript
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  
  if (error instanceof BaseError) {
    statusCode = error.statusCode;
    errorCode = error.errorCode;
    message = error.message;
    
    // Log operational errors at info level
    logger.info('Operational error', {
      error: errorCode,
      message,
      context: error.context,
      userId: req.user?.id,
      path: req.path
    });
  } else {
    // Log programming errors at error level
    logger.error('Programming error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      path: req.path
    });
    
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
    }
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString()
    }
  });
};
```

### 7.2 Structured Logging

#### 7.2.1 Logger Configuration
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'eqms-api',
    version: process.env.APP_VERSION
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Add structured logging methods
export const auditLogger = {
  logAPICall: (data: APICallLog) => {
    logger.info('API call', { type: 'api_call', ...data });
  },
  
  logUserAction: (data: UserActionLog) => {
    logger.info('User action', { type: 'user_action', ...data });
  },
  
  logDataChange: (data: DataChangeLog) => {
    logger.info('Data change', { type: 'data_change', ...data });
  },
  
  logSecurityEvent: (data: SecurityEventLog) => {
    logger.warn('Security event', { type: 'security_event', ...data });
  }
};
```

---

## 8. Testing Strategy

### 8.1 Unit Testing Framework

#### 8.1.1 Service Testing Pattern
```typescript
describe('CAPAService', () => {
  let capaService: CAPAService;
  let mockStorage: jest.Mocked<IStorage>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockWorkflowEngine: jest.Mocked<WorkflowEngine>;
  
  beforeEach(() => {
    mockStorage = createMockStorage();
    mockAuditService = createMockAuditService();
    mockWorkflowEngine = createMockWorkflowEngine();
    
    capaService = new CAPAService(
      mockStorage,
      mockAuditService,
      mockWorkflowEngine
    );
  });
  
  describe('assignCAPAToUser', () => {
    it('should assign CAPA to user and trigger workflow', async () => {
      // Arrange
      const capaId = 1;
      const userId = 2;
      const mockCapa = createMockCapa({ id: capaId });
      
      mockStorage.getCapa.mockResolvedValue(mockCapa);
      mockStorage.updateCapa.mockResolvedValue({
        ...mockCapa,
        assignedTo: userId
      });
      
      // Act
      const result = await capaService.assignCAPAToUser(capaId, userId);
      
      // Assert
      expect(result.assignedTo).toBe(userId);
      expect(mockWorkflowEngine.triggerEvent).toHaveBeenCalledWith(
        'capaAssigned',
        expect.objectContaining({ capaId, userId })
      );
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPA_ASSIGNED',
          entityId: capaId
        })
      );
    });
    
    it('should throw NotFoundError when CAPA does not exist', async () => {
      // Arrange
      mockStorage.getCapa.mockResolvedValue(null);
      
      // Act & Assert
      await expect(capaService.assignCAPAToUser(1, 2))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

### 8.2 Integration Testing

#### 8.2.1 API Integration Tests
```typescript
describe('Management Review API', () => {
  let app: Express;
  let authToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken('test_user');
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });
  
  describe('POST /api/v1/management-reviews', () => {
    it('should create a new management review', async () => {
      // Arrange
      const reviewData = {
        title: 'Q1 2025 Management Review',
        reviewDate: '2025-03-31T10:00:00Z',
        reviewType: 'quarterly'
      };
      
      // Act
      const response = await request(app)
        .post('/api/v1/management-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: reviewData.title,
        reviewDate: reviewData.reviewDate,
        status: 'draft'
      });
      
      // Verify database state
      const createdReview = await getManagementReviewFromDB(response.body.data.id);
      expect(createdReview).toBeTruthy();
    });
    
    it('should return validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        title: '', // Invalid: empty title
        reviewDate: 'invalid-date'
      };
      
      // Act
      const response = await request(app)
        .post('/api/v1/management-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      
      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

This detailed design specification provides the foundation for implementing a robust, scalable, and compliant eQMS system. The next document will contain the architectural diagrams and traceability matrix.