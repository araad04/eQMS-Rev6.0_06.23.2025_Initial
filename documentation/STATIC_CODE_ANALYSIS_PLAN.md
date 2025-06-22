# Static Code Analysis & Security Plan
## Cosmic QMS (eQMS Platform) - Backend Security

**Document ID:** SCA-001  
**Version:** 1.0  
**Date:** 2025-05-22  
**Standards Referenced:**
- IEC 62304:2006 + A1:2015 Section 5.5 (Software Implementation)
- ISO 13485:2016

---

## 1. Static Analysis Scope

### 1.1 Backend Code Analysis
This plan applies **EXCLUSIVELY** to:
- **TypeScript backend source code** (`server/` directory)
- **API endpoint security** validation
- **Database query security** (SQL injection prevention)
- **Authentication/authorization** middleware
- **Configuration security** (secrets, environment variables)

### 1.2 Explicitly Excluded
- Frontend client code analysis
- UI component security scanning
- Client-side validation logic

---

## 2. Code Quality Standards

### 2.1 ESLint Configuration for Backend Security
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:security/recommended"
  ],
  "plugins": ["security", "@typescript-eslint"],
  "rules": {
    "security/detect-sql-injection": "error",
    "security/detect-object-injection": "error",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-non-literal-require": "error",
    "security/detect-possible-timing-attacks": "error",
    "security/detect-pseudoRandomBytes": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/strict-boolean-expressions": "error"
  }
}
```

### 2.2 Security-Focused TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## 3. Dependency Security Scanning

### 3.1 Package Vulnerability Assessment
```bash
# Regular security audit commands for backend dependencies
npm audit --audit-level high
npm audit fix

# Advanced vulnerability scanning
npm install -g audit-ci
audit-ci --moderate
```

### 3.2 Critical Dependencies Security Review
- **Express.js:** Web framework security headers
- **JWT:** Token security and expiration
- **PostgreSQL/Drizzle:** SQL injection prevention
- **Bcrypt:** Password hashing security
- **Helmet:** Security headers middleware

---

## 4. Secret Scanning Implementation

### 4.1 Environment Variable Security
```typescript
// server/config/security.ts - Secure configuration validation
export function validateEnvironmentSecrets(): void {
  const requiredSecrets = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET'
  ];
  
  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
  
  if (missingSecrets.length > 0) {
    throw new Error(`Missing required environment secrets: ${missingSecrets.join(', ')}`);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}
```

### 4.2 Secret Detection Patterns
```bash
# Patterns to detect in code scan
- API keys: [A-Za-z0-9]{32,}
- JWT tokens: eyJ[A-Za-z0-9_-]*
- Database URLs: postgres://.*
- AWS keys: AKIA[0-9A-Z]{16}
```

---

## 5. Backend Security Controls Implementation

### 5.1 SQL Injection Prevention
```typescript
// server/utils/database-security.ts - Parameterized query enforcement
export async function secureQuery<T>(
  query: string,
  parameters: any[] = []
): Promise<T[]> {
  // Validate query uses parameterized statements
  if (query.includes('${') || query.includes('`${')) {
    throw new Error('String interpolation detected in SQL query - use parameterized queries');
  }
  
  try {
    return await db.execute(query, parameters);
  } catch (error) {
    // Log security-relevant database errors
    console.error('Database security error:', error);
    throw error;
  }
}
```

### 5.2 Authentication Security Validation
```typescript
// server/middleware/security-validation.ts
export function validateJWTSecurity(token: string): boolean {
  try {
    const decoded = jwt.decode(token, { complete: true });
    
    // Validate token structure
    if (!decoded || !decoded.header || !decoded.payload) {
      return false;
    }
    
    // Check algorithm security
    if (decoded.header.alg !== 'HS256') {
      console.warn('Insecure JWT algorithm detected:', decoded.header.alg);
      return false;
    }
    
    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.payload.exp && decoded.payload.exp < now) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

### 5.3 Input Validation Security
```typescript
// server/middleware/input-validation.ts
export function validateAPIInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input data
      const sanitizedBody = sanitizeObject(req.body);
      
      // Validate against schema
      const validatedData = schema.parse(sanitizedBody);
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      console.error('Input validation security error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove potentially dangerous properties
    if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    sanitized[key] = typeof value === 'string' ? 
      value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : 
      value;
  }
  
  return sanitized;
}
```

---

## 6. Automated Security Testing

### 6.1 Security Test Cases
```typescript
// server/__tests__/security/authentication.test.ts
describe('Authentication Security', () => {
  test('should reject expired JWT tokens', async () => {
    const expiredToken = generateExpiredToken();
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(response.status).toBe(401);
  });
  
  test('should prevent SQL injection in CAPA queries', async () => {
    const maliciousInput = "'; DROP TABLE capas; --";
    const response = await request(app)
      .post('/api/capa')
      .send({ title: maliciousInput })
      .set('Authorization', `Bearer ${validToken}`);
    
    // Should either reject or sanitize, not execute SQL
    expect(response.status).not.toBe(500);
  });
  
  test('should enforce role-based access control', async () => {
    const userToken = generateUserToken();
    const response = await request(app)
      .delete('/api/capa/1')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

### 6.2 Performance Security Testing
```typescript
// server/__tests__/security/performance.test.ts
describe('Performance Security', () => {
  test('should handle concurrent authentication requests', async () => {
    const promises = Array(100).fill(0).map(() =>
      request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
    );
    
    const responses = await Promise.all(promises);
    
    // All should complete without timeout or crash
    responses.forEach(response => {
      expect([200, 401]).toContain(response.status);
    });
  });
  
  test('should prevent memory exhaustion in file uploads', async () => {
    const largePayload = 'x'.repeat(50 * 1024 * 1024); // 50MB
    
    const response = await request(app)
      .post('/api/documents/upload')
      .send({ data: largePayload })
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(413); // Payload too large
  });
});
```

---

## 7. CI/CD Security Pipeline

### 7.1 Automated Security Checks
```yaml
# .github/workflows/security-scan.yml
name: Backend Security Scan
on: [push, pull_request]

jobs:
  security-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint security scan
        run: npm run lint:security
        
      - name: Run dependency vulnerability scan
        run: npm audit --audit-level high
        
      - name: Run TypeScript security compilation
        run: npm run type-check
        
      - name: Run security unit tests
        run: npm run test:security
```

---

## 8. Security Monitoring & Logging

### 8.1 Security Event Logging
```typescript
// server/middleware/security-logging.ts
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const securityEvents = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.url,
    userId: req.user?.id
  };
  
  // Log authentication failures
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Security event - Authentication failure:', securityEvents);
    }
  });
  
  next();
}
```

---

*This static code analysis plan focuses exclusively on eQMS platform backend security and excludes all frontend, UI, and client-side considerations per regulatory scope definition.*