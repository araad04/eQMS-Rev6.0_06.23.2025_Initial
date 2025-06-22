# Software Design Specification (SDS)
## Cosmic QMS (eQMS Platform) - Backend Architecture

**Document ID:** SDS-001  
**Version:** 1.0  
**Date:** 2025-05-22  
**Standards Referenced:**
- IEC 62304:2006 + A1:2015 Section 5.3 (Software Architectural Design)
- ISO 13485:2016
- ISO 14971:2019

---

## 1. Backend System Architecture

### 1.1 Design Scope
This SDS applies **EXCLUSIVELY** to:
- **Backend service architecture** and API design
- **Database schema** and data flow patterns
- **Security middleware** and authentication layers
- **Process engines** and workflow orchestration
- **Integration patterns** with external systems

### 1.2 Explicitly Excluded
- Frontend architecture and component design
- User interface layouts and interactions
- Client-side state management
- Visual design specifications

---

## 2. System Architecture Overview

### 2.1 Layered Architecture Pattern
```
┌─────────────────────────────────────┐
│         API Layer (Express.js)      │
│  ┌─────────────────────────────────┐ │
│  │    Authentication Middleware    │ │
│  │    Authorization Middleware     │ │
│  │    Validation Middleware        │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│         Service Layer               │
│  ┌─────────────┬─────────────────┐  │
│  │ CAPA Engine │ Document Engine │  │
│  │ Audit Svc   │ Supplier Engine │  │
│  │ Auth Svc    │ Workflow Engine │  │
│  └─────────────┴─────────────────┘  │
├─────────────────────────────────────┤
│         Data Layer                  │
│  ┌─────────────────────────────────┐ │
│  │     PostgreSQL Database         │ │
│  │  ┌───────────┬──────────────┐   │ │
│  │  │ Business  │ Audit Trail  │   │ │
│  │  │ Tables    │ Tables       │   │ │
│  │  └───────────┴──────────────┘   │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2.2 Technology Stack
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js with middleware architecture
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** JWT with role-based access control
- **Validation:** Zod schema validation
- **Testing:** Vitest for unit and integration testing

---

## 3. API Layer Design

### 3.1 RESTful Endpoint Architecture
```typescript
// Authentication & Authorization Middleware Stack
app.use('/api/*', authenticationMiddleware);
app.use('/api/*', authorizationMiddleware);
app.use('/api/*', validationMiddleware);

// Core API Routes
app.use('/api/capa', capaRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/audit', auditRoutes);
```

### 3.2 Security Middleware Design
```typescript
// JWT Authentication Middleware
export function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role-Based Authorization Middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

---

## 4. Service Layer Design

### 4.1 CAPA Processing Engine
```typescript
// CAPA Service with Transaction Management
export class CapaService {
  async createCapa(capaData: InsertCapa, userId: number): Promise<Capa> {
    return await db.transaction(async (tx) => {
      // Validate business rules
      this.validateCapaData(capaData);
      
      // Insert CAPA record
      const [capa] = await tx.insert(capas).values({
        ...capaData,
        createdBy: userId,
        createdAt: new Date(),
        statusId: CAPA_STATUS.DRAFT
      }).returning();
      
      // Create audit trail entry
      await tx.insert(auditTrail).values({
        entityType: 'capa',
        entityId: capa.id,
        action: 'created',
        userId,
        timestamp: new Date(),
        changes: JSON.stringify(capaData)
      });
      
      return capa;
    });
  }
  
  async updateCapaStatus(
    capaId: number, 
    newStatus: number, 
    userId: number
  ): Promise<void> {
    // Validate state transition
    const currentCapa = await this.getCapaById(capaId);
    if (!this.isValidStatusTransition(currentCapa.statusId, newStatus)) {
      throw new Error('Invalid status transition');
    }
    
    // Validate user permissions for this transition
    if (!this.canUserTransitionStatus(userId, currentCapa, newStatus)) {
      throw new Error('Insufficient permissions for status change');
    }
    
    await db.transaction(async (tx) => {
      await tx.update(capas)
        .set({ statusId: newStatus, updatedAt: new Date() })
        .where(eq(capas.id, capaId));
        
      await tx.insert(auditTrail).values({
        entityType: 'capa',
        entityId: capaId,
        action: 'status_changed',
        userId,
        timestamp: new Date(),
        changes: JSON.stringify({ 
          fromStatus: currentCapa.statusId, 
          toStatus: newStatus 
        })
      });
    });
  }
}
```

### 4.2 Document Management Engine
```typescript
// Document Service with Approval Workflow
export class DocumentService {
  async approveDocument(
    documentId: number, 
    approverId: number
  ): Promise<Document> {
    return await db.transaction(async (tx) => {
      // Get current document state
      const [document] = await tx.select()
        .from(documents)
        .where(eq(documents.id, documentId));
        
      // Validate approval prerequisites
      if (document.statusId !== DOCUMENT_STATUS.PENDING_APPROVAL) {
        throw new Error('Document not in approvable state');
      }
      
      // Validate approver authority
      if (!this.hasApprovalAuthority(approverId, document.documentTypeId)) {
        throw new Error('Insufficient approval authority');
      }
      
      // Update document status
      const [updatedDoc] = await tx.update(documents)
        .set({ 
          statusId: DOCUMENT_STATUS.APPROVED,
          approvedBy: approverId,
          approvedAt: new Date()
        })
        .where(eq(documents.id, documentId))
        .returning();
        
      // Create approval audit trail
      await tx.insert(auditTrail).values({
        entityType: 'document',
        entityId: documentId,
        action: 'approved',
        userId: approverId,
        timestamp: new Date(),
        changes: JSON.stringify({ approvedBy: approverId })
      });
      
      return updatedDoc;
    });
  }
}
```

---

## 5. Data Layer Design

### 5.1 Database Schema Architecture
```typescript
// Core Business Entity Tables
export const capas = pgTable('capas', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  priority: integer('priority').notNull(),
  statusId: integer('status_id').references(() => capaStatuses.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Audit Trail Table (Immutable)
export const auditTrail = pgTable('audit_trail', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  userId: integer('user_id').references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 })
});
```

### 5.2 Transaction Management Pattern
```typescript
// Standard Transaction Wrapper
export async function withTransaction<T>(
  operation: (tx: Transaction) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    try {
      return await operation(tx);
    } catch (error) {
      // Transaction automatically rolled back
      throw error;
    }
  });
}
```

---

## 6. Security Design

### 6.1 Authentication Architecture
```typescript
// JWT Token Structure
interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  department: string;
  iat: number;
  exp: number;
}

// Token Generation with Secure Claims
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      department: user.department
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '8h',
      issuer: 'cosmic-qms',
      audience: 'api-backend'
    }
  );
}
```

### 6.2 Authorization Matrix
```typescript
// Permission Validation Logic
export function validatePermission(
  user: User, 
  resource: string, 
  action: string
): boolean {
  const permissions = {
    'capa': {
      'read': ['user', 'qa', 'admin'],
      'write': ['qa', 'admin'],
      'approve': ['qa', 'admin'],
      'delete': ['admin']
    },
    'document': {
      'read': ['user', 'qa', 'admin'],
      'write': ['qa', 'admin'],
      'approve': ['qa', 'admin'],
      'delete': ['admin']
    }
  };
  
  return permissions[resource]?.[action]?.includes(user.role) || false;
}
```

---

## 7. Integration Interfaces

### 7.1 Database Connection Management
```typescript
// Connection Pool Configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database Health Check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    return !!result.rows[0];
  } catch {
    return false;
  }
}
```

---

## 8. Error Handling Architecture

### 8.1 Standardized Error Response
```typescript
// Error Response Interface
interface ApiError {
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Global Error Handler
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errorResponse: ApiError = {
    error: error.message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
  
  // Log error for monitoring
  console.error('API Error:', error);
  
  res.status(500).json(errorResponse);
}
```

---

*This SDS focuses exclusively on eQMS platform backend systems architecture and excludes all user interface, frontend components, and client-side considerations per regulatory scope definition.*