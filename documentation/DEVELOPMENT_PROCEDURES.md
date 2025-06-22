# eQMS Development Procedures

**Document Control Information**
- Document ID: DEV-PROC-eQMS-2025-001
- Version: 1.0
- Date: June 13, 2025
- Author: Senior Development Team
- Classification: Internal Development Use Only
- Approval: Development Team Lead

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Code Development Standards](#2-code-development-standards)
3. [Database Management Procedures](#3-database-management-procedures)
4. [API Development Guidelines](#4-api-development-guidelines)
5. [Frontend Development Standards](#5-frontend-development-standards)
6. [Testing Procedures](#6-testing-procedures)
7. [Security Implementation](#7-security-implementation)
8. [Version Control & Release Management](#8-version-control--release-management)
9. [Documentation Standards](#9-documentation-standards)
10. [Quality Assurance Procedures](#10-quality-assurance-procedures)
11. [Deployment Procedures](#11-deployment-procedures)
12. [Maintenance & Support](#12-maintenance--support)

---

## 1. Development Environment Setup

### 1.1 System Requirements

**Minimum Development Environment:**
- Node.js 20.x LTS
- PostgreSQL 14+
- Git 2.34+
- TypeScript 5.0+
- RAM: 16GB minimum, 32GB recommended
- Storage: 500GB SSD minimum
- Network: Stable broadband connection

**Required Development Tools:**
- VS Code with recommended extensions:
  - ESLint
  - Prettier
  - TypeScript Hero
  - PostgreSQL
  - Drizzle Kit
  - Thunder Client (for API testing)

### 1.2 Local Development Setup

**Step 1: Repository Clone and Dependencies**
```bash
git clone [repository-url]
cd eqms-system
npm install
```

**Step 2: Environment Configuration**
Create `.env.local` file with required variables:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/eqms_dev
NODE_ENV=development
JWT_SECRET=development_secret_key_min_32_chars
SESSION_SECRET=development_session_secret_key
CORS_ORIGIN=http://localhost:5173
```

**Step 3: Database Initialization**
```bash
# Create development database
createdb eqms_dev

# Push schema changes
npm run db:push

# Seed development data (if available)
npm run db:seed
```

**Step 4: Start Development Server**
```bash
npm run dev
```

### 1.3 IDE Configuration

**VS Code Settings (`.vscode/settings.json`):**
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["typescript", "typescriptreact"],
  "files.associations": {
    "*.tsx": "typescriptreact"
  }
}
```

---

## 2. Code Development Standards

### 2.1 TypeScript Standards

**File Organization:**
```
shared/
├── schema.ts              # Database schema definitions
├── schema.iovv.ts        # IOVV specific schemas
└── design-control-schema.ts # Design control schemas

client/src/
├── components/           # Reusable UI components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── types/               # TypeScript type definitions

server/
├── routes/              # API route handlers
├── storage/             # Data access layer
├── middleware/          # Express middleware
├── utils/               # Server utilities
└── __tests__/           # Server-side tests
```

**Naming Conventions:**
- Files: kebab-case (`supplier-management.tsx`)
- Components: PascalCase (`SupplierManagement`)
- Functions: camelCase (`getSupplierById`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- Database tables: snake_case (`supplier_assessments`)

**Type Safety Requirements:**
```typescript
// Always define strict types
interface SupplierAssessment {
  id: number;
  supplierId: number;
  assessmentType: 'Audit' | 'Survey' | 'Performance Review';
  scheduledDate: Date;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

// Use strict function signatures
async function createSupplierAssessment(
  data: InsertSupplierAssessment
): Promise<SupplierAssessment> {
  // Implementation
}

// Avoid 'any' types - use unknown or specific unions instead
type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};
```

### 2.2 Error Handling Standards

**Server-Side Error Handling:**
```typescript
// Standard error response format
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

// Error handling middleware pattern
const handleApiError = (error: unknown, context: string) => {
  logger.error(`${context}: ${error}`);
  
  if (error instanceof ValidationError) {
    return { success: false, error: error.message, code: 'VALIDATION_ERROR' };
  }
  
  if (error instanceof DatabaseError) {
    return { success: false, error: 'Database operation failed', code: 'DB_ERROR' };
  }
  
  return { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' };
};
```

**Client-Side Error Handling:**
```typescript
// React Query error handling
const { data, error, isError } = useQuery({
  queryKey: ['/api/suppliers'],
  onError: (error) => {
    toast({
      title: "Error",
      description: error.message || "Failed to load suppliers",
      variant: "destructive",
    });
  }
});

// Form validation error handling
const form = useForm<SupplierFormData>({
  resolver: zodResolver(supplierSchema),
  defaultValues: {
    name: "",
    contactEmail: "",
    // ... other fields
  }
});
```

### 2.3 Performance Standards

**Database Query Optimization:**
```typescript
// Use select() to limit returned fields
const suppliers = await db
  .select({
    id: suppliers.id,
    name: suppliers.name,
    status: suppliers.statusId
  })
  .from(suppliers)
  .where(eq(suppliers.isArchived, false))
  .limit(100);

// Use with() for complex queries with relationships
const suppliersWithAssessments = await db
  .select()
  .from(suppliers)
  .leftJoin(supplierAssessments, eq(suppliers.id, supplierAssessments.supplierId))
  .where(eq(suppliers.isArchived, false));
```

**Frontend Performance:**
```typescript
// Memoize expensive calculations
const expensiveCalculation = useMemo(() => {
  return processLargeDataSet(data);
}, [data]);

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Optimize re-renders with useCallback
const handleSubmit = useCallback((data: FormData) => {
  // submission logic
}, [dependency]);
```

---

## 3. Database Management Procedures

### 3.1 Schema Development

**Schema Change Process:**
1. **Planning Phase:**
   - Document the change requirement
   - Assess impact on existing data
   - Plan migration strategy
   - Review with team lead

2. **Implementation Phase:**
   - Modify `shared/schema.ts`
   - Update related type definitions
   - Create data migration scripts if needed
   - Test changes locally

3. **Validation Phase:**
   - Run `npm run db:push` in development
   - Verify schema changes
   - Test all affected API endpoints
   - Update documentation

**Schema Modification Example:**
```typescript
// Adding new column to existing table
export const suppliers = pgTable("suppliers", {
  // ... existing columns
  
  // New column addition
  lastAuditDate: timestamp("last_audit_date"),
  nextAuditDue: timestamp("next_audit_due"),
  
  // Modified column (requires migration)
  criticality: text("criticality").notNull().default("Medium"), // Changed from required
});

// Update corresponding types
export const insertSupplierSchema = createInsertSchema(suppliers)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    criticality: z.enum(["Critical", "Major", "Minor"]).default("Minor"),
  });
```

### 3.2 Data Migration Procedures

**Migration Script Template:**
```typescript
// migrations/YYYY-MM-DD-migration-name.ts
import { db } from '../server/db';
import { suppliers } from '../shared/schema';

export async function up() {
  console.log('Starting migration: Add audit date tracking');
  
  try {
    // Perform migration
    await db.transaction(async (tx) => {
      // Update existing records with default values
      await tx.update(suppliers)
        .set({ 
          lastAuditDate: new Date('2024-01-01'),
          nextAuditDue: new Date('2025-01-01')
        })
        .where(isNull(suppliers.lastAuditDate));
    });
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('Rolling back migration: Add audit date tracking');
  
  try {
    await db.transaction(async (tx) => {
      // Rollback changes
      await tx.update(suppliers)
        .set({ 
          lastAuditDate: null,
          nextAuditDue: null
        });
    });
    
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}
```

### 3.3 Database Testing

**Database Test Procedures:**
```typescript
// __tests__/database/supplier-operations.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../server/db';
import { suppliers, supplierCategories } from '../../shared/schema';

describe('Supplier Database Operations', () => {
  let testCategoryId: number;
  
  beforeEach(async () => {
    // Setup test data
    const [category] = await db.insert(supplierCategories)
      .values({ name: 'Test Category', description: 'Test' })
      .returning();
    testCategoryId = category.id;
  });
  
  afterEach(async () => {
    // Cleanup test data
    await db.delete(suppliers).where(eq(suppliers.categoryId, testCategoryId));
    await db.delete(supplierCategories).where(eq(supplierCategories.id, testCategoryId));
  });
  
  test('should create supplier with valid data', async () => {
    const supplierData = {
      supplierId: 'SUP-001',
      name: 'Test Supplier',
      description: 'Test Description',
      categoryId: testCategoryId,
      // ... other required fields
    };
    
    const [supplier] = await db.insert(suppliers)
      .values(supplierData)
      .returning();
    
    expect(supplier.name).toBe('Test Supplier');
    expect(supplier.categoryId).toBe(testCategoryId);
  });
  
  test('should enforce unique constraint on supplierId', async () => {
    const supplierData = {
      supplierId: 'SUP-DUPLICATE',
      // ... other fields
    };
    
    await db.insert(suppliers).values(supplierData);
    
    await expect(
      db.insert(suppliers).values(supplierData)
    ).rejects.toThrow();
  });
});
```

---

## 4. API Development Guidelines

### 4.1 REST API Standards

**Endpoint Naming Conventions:**
```
GET    /api/suppliers              # Get all suppliers
GET    /api/suppliers/:id          # Get supplier by ID
POST   /api/suppliers              # Create new supplier
PUT    /api/suppliers/:id          # Update entire supplier
PATCH  /api/suppliers/:id          # Partial update supplier
DELETE /api/suppliers/:id          # Delete supplier

# Resource relationships
GET    /api/suppliers/:id/assessments    # Get supplier assessments
POST   /api/suppliers/:id/assessments    # Create assessment for supplier
```

**Response Format Standards:**
```typescript
// Success response format
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Error response format
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: ValidationError[];
}

// Example API route implementation
export async function getSuppliers(req: Request, res: Response) {
  try {
    const { page = 1, limit = 50, category, status } = req.query;
    
    let query = db.select().from(suppliers);
    
    if (category) {
      query = query.where(eq(suppliers.categoryId, Number(category)));
    }
    
    if (status) {
      query = query.where(eq(suppliers.statusId, Number(status)));
    }
    
    const results = await query
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));
    
    const total = await db
      .select({ count: count() })
      .from(suppliers)
      .where(/* same conditions */);
    
    res.json({
      success: true,
      data: results,
      meta: {
        total: total[0].count,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'getSuppliers');
    res.status(500).json(errorResponse);
  }
}
```

### 4.2 Input Validation

**Zod Validation Implementation:**
```typescript
import { z } from 'zod';
import { validateRequestBody } from '../middleware/validation';

// Define validation schema
const createSupplierSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  categoryId: z.number().int().positive(),
  contactEmail: z.string().email(),
  criticality: z.enum(['Critical', 'Major', 'Minor']),
  address: z.string().min(1),
  // ... other fields
});

// Use validation middleware
app.post('/api/suppliers', 
  validateRequestBody(createSupplierSchema),
  async (req: Request, res: Response) => {
    // req.body is now typed and validated
    const supplierData = req.body;
    
    try {
      const [supplier] = await db.insert(suppliers)
        .values(supplierData)
        .returning();
      
      res.status(201).json({
        success: true,
        data: supplier
      });
    } catch (error) {
      const errorResponse = handleApiError(error, 'createSupplier');
      res.status(500).json(errorResponse);
    }
  }
);
```

### 4.3 Authentication & Authorization

**Authentication Middleware:**
```typescript
// middleware/auth.ts
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as User;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Role-based authorization
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Usage in routes
app.get('/api/suppliers', 
  requireAuth,
  requireRole(['admin', 'manager', 'qa']),
  getSuppliers
);
```

---

## 5. Frontend Development Standards

### 5.1 Component Architecture

**Component Structure Guidelines:**
```typescript
// components/supplier/SupplierManagement.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SupplierManagementProps {
  // Define props interface
  initialFilters?: SupplierFilters;
  onSupplierSelect?: (supplier: Supplier) => void;
}

export function SupplierManagement({ 
  initialFilters,
  onSupplierSelect 
}: SupplierManagementProps) {
  // Component state
  const [filters, setFilters] = useState(initialFilters || {});
  const queryClient = useQueryClient();
  
  // Data fetching
  const { 
    data: suppliers, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/suppliers', filters],
    enabled: true,
  });
  
  // Mutations
  const createSupplierMutation = useMutation({
    mutationFn: (data: CreateSupplierData) => 
      apiRequest('/api/suppliers', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      });
    },
  });
  
  // Event handlers
  const handleCreateSupplier = (data: CreateSupplierData) => {
    createSupplierMutation.mutate(data);
  };
  
  // Loading state
  if (isLoading) {
    return <SupplierSkeleton />;
  }
  
  // Error state
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  // Main render
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}

// Export types for external use
export type { SupplierManagementProps };
```

### 5.2 State Management

**React Query Implementation:**
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// API request wrapper
export async function apiRequest(url: string, options: RequestInit = {}) {
  const { method = 'GET', body, ...otherOptions } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Local': 'true', // Development auth
      ...otherOptions.headers,
    },
    ...otherOptions,
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Custom Hooks Pattern:**
```typescript
// hooks/useSuppliers.ts
export function useSuppliers(filters?: SupplierFilters) {
  return useQuery({
    queryKey: ['/api/suppliers', filters],
    queryFn: () => apiRequest('/api/suppliers?' + new URLSearchParams(filters)),
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['/api/suppliers', id],
    queryFn: () => apiRequest(`/api/suppliers/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSupplierData) =>
      apiRequest('/api/suppliers', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
    },
  });
}
```

### 5.3 Form Management

**React Hook Form with Zod:**
```typescript
// components/forms/SupplierForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const supplierFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.number().int().positive('Category is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  criticality: z.enum(['Critical', 'Major', 'Minor']),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
  initialData?: Partial<SupplierFormData>;
  onSubmit: (data: SupplierFormData) => void;
  isLoading?: boolean;
}

export function SupplierForm({ 
  initialData, 
  onSubmit, 
  isLoading 
}: SupplierFormProps) {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      description: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: '',
      country: '',
      criticality: 'Minor',
      ...initialData,
    },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter supplier name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Additional form fields */}
        
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Supplier'}
          </Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 6. Testing Procedures

### 6.1 Unit Testing Standards

**Test File Organization:**
```
__tests__/
├── components/           # Frontend component tests
├── hooks/               # Custom hook tests
├── api/                 # API endpoint tests
├── database/            # Database operation tests
├── utils/               # Utility function tests
└── integration/         # Integration tests
```

**Component Testing Template:**
```typescript
// __tests__/components/SupplierForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupplierForm } from '../../client/src/components/forms/SupplierForm';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('SupplierForm', () => {
  const mockOnSubmit = vi.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });
  
  test('renders all required fields', () => {
    renderWithQueryClient(<SupplierForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/supplier name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
  });
  
  test('validates required fields', async () => {
    renderWithQueryClient(<SupplierForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /save supplier/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  test('submits valid form data', async () => {
    renderWithQueryClient(<SupplierForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/supplier name/i), {
      target: { value: 'Test Supplier' }
    });
    
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' }
    });
    
    // Fill other required fields...
    
    fireEvent.click(screen.getByRole('button', { name: /save supplier/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Supplier',
          description: 'Test Description',
        })
      );
    });
  });
});
```

### 6.2 API Testing

**API Route Testing:**
```typescript
// __tests__/api/suppliers.test.ts
import request from 'supertest';
import { app } from '../../server/index';
import { db } from '../../server/db';
import { suppliers, supplierCategories } from '../../shared/schema';

describe('Supplier API Endpoints', () => {
  let testCategoryId: number;
  
  beforeAll(async () => {
    // Setup test data
    const [category] = await db.insert(supplierCategories)
      .values({ name: 'Test Category' })
      .returning();
    testCategoryId = category.id;
  });
  
  afterAll(async () => {
    // Cleanup test data
    await db.delete(supplierCategories)
      .where(eq(supplierCategories.id, testCategoryId));
  });
  
  describe('POST /api/suppliers', () => {
    test('creates supplier with valid data', async () => {
      const supplierData = {
        name: 'Test Supplier',
        description: 'Test Description',
        categoryId: testCategoryId,
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '123-456-7890',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        criticality: 'Minor',
      };
      
      const response = await request(app)
        .post('/api/suppliers')
        .send(supplierData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Supplier');
    });
    
    test('validates required fields', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
      };
      
      const response = await request(app)
        .post('/api/suppliers')
        .send(invalidData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });
  });
  
  describe('GET /api/suppliers', () => {
    test('returns paginated supplier list', async () => {
      const response = await request(app)
        .get('/api/suppliers?page=1&limit=10')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });
  });
});
```

### 6.3 Integration Testing

**End-to-End Testing Setup:**
```typescript
// __tests__/integration/supplier-lifecycle.test.ts
import { test, expect } from '@playwright/test';

test.describe('Supplier Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/suppliers');
    // Login if required
  });
  
  test('complete supplier creation workflow', async ({ page }) => {
    // Navigate to create supplier form
    await page.click('[data-testid="create-supplier-button"]');
    
    // Fill out form
    await page.fill('[data-testid="supplier-name"]', 'Integration Test Supplier');
    await page.fill('[data-testid="supplier-description"]', 'Test Description');
    await page.selectOption('[data-testid="supplier-category"]', '1');
    await page.fill('[data-testid="contact-name"]', 'Test Contact');
    await page.fill('[data-testid="contact-email"]', 'test@example.com');
    
    // Submit form
    await page.click('[data-testid="submit-supplier-form"]');
    
    // Verify creation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Integration Test Supplier')).toBeVisible();
  });
  
  test('supplier search and filtering', async ({ page }) => {
    // Test search functionality
    await page.fill('[data-testid="supplier-search"]', 'Test Supplier');
    await page.keyboard.press('Enter');
    
    // Verify search results
    await expect(page.locator('[data-testid="supplier-list"]')).toContainText('Test Supplier');
    
    // Test category filter
    await page.selectOption('[data-testid="category-filter"]', 'Critical');
    await expect(page.locator('[data-testid="supplier-list"]')).not.toContainText('Non-Critical Supplier');
  });
});
```

---

## 7. Security Implementation

### 7.1 Authentication Security

**JWT Token Management:**
```typescript
// utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly SALT_ROUNDS = 12;
  
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  static generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      this.JWT_SECRET,
      { 
        expiresIn: '8h',
        issuer: 'eqms-system',
        audience: 'eqms-users'
      }
    );
  }
  
  static verifyToken(token: string): User {
    return jwt.verify(token, this.JWT_SECRET, {
      issuer: 'eqms-system',
      audience: 'eqms-users'
    }) as User;
  }
}
```

### 7.2 Input Sanitization

**XSS Protection:**
```typescript
// middleware/sanitize.ts
import xss from 'xss';

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return xss(obj, {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};
```

### 7.3 Database Security

**SQL Injection Prevention:**
```typescript
// Always use parameterized queries with Drizzle
// GOOD:
const suppliers = await db
  .select()
  .from(suppliers)
  .where(eq(suppliers.name, userInput));

// BAD - Never do this:
// const suppliers = await db.execute(sql`SELECT * FROM suppliers WHERE name = '${userInput}'`);

// For complex dynamic queries, use Drizzle's SQL builders
const buildSupplierQuery = (filters: SupplierFilters) => {
  let query = db.select().from(suppliers);
  
  if (filters.category) {
    query = query.where(eq(suppliers.categoryId, filters.category));
  }
  
  if (filters.status) {
    query = query.where(eq(suppliers.statusId, filters.status));
  }
  
  if (filters.search) {
    query = query.where(
      or(
        ilike(suppliers.name, `%${filters.search}%`),
        ilike(suppliers.description, `%${filters.search}%`)
      )
    );
  }
  
  return query;
};
```

### 7.4 Audit Trail Implementation

**Comprehensive Audit Logging:**
```typescript
// middleware/audit-logger.ts
export const auditLogger = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
      const endTime = Date.now();
      
      // Log audit trail
      logAuditEvent({
        action,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        method: req.method,
        url: req.originalUrl,
        body: sanitizeLogData(req.body),
        responseStatus: res.statusCode,
        duration: endTime - startTime,
        timestamp: new Date(),
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

async function logAuditEvent(event: AuditEvent) {
  try {
    await db.insert(auditTrail).values({
      action: event.action,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: JSON.stringify(event),
      timestamp: event.timestamp,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
```

---

## 8. Version Control & Release Management

### 8.1 Git Workflow

**Branch Naming Conventions:**
```
main                     # Production-ready code
develop                  # Integration branch for features
feature/JIRA-123-description  # Feature development
bugfix/JIRA-456-description   # Bug fixes
hotfix/critical-security-fix  # Emergency fixes
release/v1.2.0               # Release preparation
```

**Commit Message Standards:**
```
type(scope): description

feat(supplier): add supplier assessment functionality
fix(auth): resolve JWT token expiration issue
docs(api): update supplier endpoint documentation
test(supplier): add unit tests for supplier creation
refactor(database): optimize supplier query performance
perf(api): improve response time for supplier list
style(ui): fix supplier form layout issues
chore(deps): update dependencies to latest versions
```

**Pull Request Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No console.log statements in production code
```

### 8.2 Release Process

**Release Checklist:**
1. **Pre-Release Testing:**
   ```bash
   # Run full test suite
   npm run test
   npm run test:integration
   npm run test:e2e
   
   # Database migration testing
   npm run db:push
   npm run db:migrate:test
   
   # Build verification
   npm run build
   npm run build:check
   ```

2. **Version Management:**
   ```bash
   # Update version number
   npm version patch|minor|major
   
   # Update changelog
   git-changelog -t keepachangelog
   
   # Tag release
   git tag -a v1.2.0 -m "Release version 1.2.0"
   ```

3. **Deployment Preparation:**
   ```bash
   # Environment-specific configuration
   cp .env.production .env
   
   # Build for production
   npm run build:production
   
   # Security audit
   npm audit --audit-level high
   ```

### 8.3 Hotfix Procedures

**Emergency Release Process:**
```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-security-fix

# Implement fix
# ... make changes

# Test fix
npm run test
npm run security:scan

# Merge to main and develop
git checkout main
git merge hotfix/critical-security-fix
git checkout develop
git merge hotfix/critical-security-fix

# Deploy immediately
npm run deploy:production:emergency
```

---

## 9. Documentation Standards

### 9.1 Code Documentation

**Function Documentation:**
```typescript
/**
 * Creates a new supplier assessment with validation and audit logging
 * 
 * @param supplierAssessment - The assessment data to create
 * @param user - The user creating the assessment
 * @returns Promise resolving to the created assessment with ID
 * 
 * @throws {ValidationError} When assessment data is invalid
 * @throws {DatabaseError} When database operation fails
 * @throws {AuthorizationError} When user lacks required permissions
 * 
 * @example
 * ```typescript
 * const assessment = await createSupplierAssessment(
 *   {
 *     supplierId: 123,
 *     assessmentType: 'Audit',
 *     scheduledDate: new Date('2025-01-15'),
 *     status: 'Scheduled'
 *   },
 *   currentUser
 * );
 * ```
 */
export async function createSupplierAssessment(
  supplierAssessment: InsertSupplierAssessment,
  user: User
): Promise<SupplierAssessment> {
  // Validate user permissions
  if (!hasPermission(user, 'supplier:assessment:create')) {
    throw new AuthorizationError('Insufficient permissions to create assessment');
  }
  
  // Validate assessment data
  const validatedData = insertSupplierAssessmentSchema.parse(supplierAssessment);
  
  try {
    const [assessment] = await db.transaction(async (tx) => {
      // Create assessment
      const [newAssessment] = await tx
        .insert(supplierAssessments)
        .values({
          ...validatedData,
          createdBy: user.id,
        })
        .returning();
      
      // Log audit trail
      await tx.insert(auditTrail).values({
        action: 'supplier_assessment_created',
        entityType: 'supplier_assessment',
        entityId: newAssessment.id,
        userId: user.id,
        details: JSON.stringify({ assessmentData: validatedData }),
        timestamp: new Date(),
      });
      
      return [newAssessment];
    });
    
    return assessment;
  } catch (error) {
    logger.error('Failed to create supplier assessment', { error, user: user.id, data: validatedData });
    throw new DatabaseError('Failed to create supplier assessment');
  }
}
```

### 9.2 API Documentation

**OpenAPI/Swagger Documentation:**
```typescript
// swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eQMS API',
      version: '1.0.0',
      description: 'Electronic Quality Management System API',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Supplier: {
          type: 'object',
          required: ['name', 'description', 'categoryId'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier',
            },
            name: {
              type: 'string',
              maxLength: 255,
              description: 'Supplier name',
            },
            description: {
              type: 'string',
              description: 'Supplier description',
            },
            categoryId: {
              type: 'integer',
              description: 'Supplier category ID',
            },
            criticality: {
              type: 'string',
              enum: ['Critical', 'Major', 'Minor'],
              description: 'Supplier criticality level',
            },
          },
        },
      },
    },
  },
  apis: ['./server/routes*.ts'],
};

export const specs = swaggerJsdoc(options);
```

**Route Documentation Example:**
```typescript
/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
```

### 9.3 Database Documentation

**Schema Documentation:**
```typescript
// shared/schema-docs.ts

/**
 * Supplier Management Schema
 * 
 * This module defines the database schema for supplier management functionality
 * including suppliers, categories, statuses, and related entities.
 * 
 * Key Relationships:
 * - Suppliers belong to Categories (many-to-one)
 * - Suppliers have Statuses (many-to-one)
 * - Suppliers can have multiple Assessments (one-to-many)
 * - Suppliers can have multiple Certifications (one-to-many)
 * 
 * Audit Trail:
 * - All supplier changes are logged in supplier_audit_trail
 * - Includes field-level change tracking
 * - Maintains user attribution and timestamps
 */

export const supplierSchemaDocumentation = {
  tables: {
    suppliers: {
      description: 'Main supplier information table',
      keyFields: {
        supplierId: 'Unique business identifier (e.g., SUP-001)',
        criticality: 'Risk classification: Critical, Major, Minor',
        currentRiskLevel: 'Dynamic risk level based on performance',
        qualificationDate: 'Date supplier was initially qualified',
        requalificationDate: 'Next required requalification date',
      },
      businessRules: [
        'supplierId must be unique across all suppliers',
        'criticality determines audit frequency requirements',
        'requalificationDate is calculated based on criticality level',
        'Contact email must be unique per supplier',
      ],
      indexes: [
        'supplierId (unique)',
        'name (for search)',
        'categoryId, statusId (for filtering)',
        'criticality, requalificationDate (for reporting)',
      ],
    },
    supplierAssessments: {
      description: 'Supplier evaluation and audit records',
      keyFields: {
        assessmentType: 'Type of evaluation: Audit, Survey, Performance Review',
        status: 'Current state: Scheduled, In Progress, Completed, Cancelled',
        score: 'Numerical score 0-100 or null',
        findings: 'Detailed assessment findings',
      },
      businessRules: [
        'Completed assessments must have conductedDate and completedBy',
        'Score is required for Performance Review type assessments',
        'Critical suppliers require annual audits',
        'Findings are required for Audit type assessments',
      ],
    },
  },
  migrations: {
    '2025-01-01_initial_supplier_schema': 'Created initial supplier tables',
    '2025-01-15_add_regulatory_reportability': 'Added regulatory reporting decision tree',
    '2025-02-01_enhance_audit_trail': 'Enhanced audit trail with field-level tracking',
  },
};
```

---

## 10. Quality Assurance Procedures

### 10.1 Code Review Guidelines

**Review Checklist:**
- [ ] **Functionality**
  - [ ] Code meets acceptance criteria
  - [ ] Edge cases are handled
  - [ ] Error handling is appropriate
  - [ ] Performance considerations addressed

- [ ] **Code Quality**
  - [ ] Code is readable and maintainable
  - [ ] Functions are appropriately sized
  - [ ] Variable names are descriptive
  - [ ] No code duplication
  - [ ] Comments explain complex logic

- [ ] **Security**
  - [ ] Input validation implemented
  - [ ] Authentication/authorization checked
  - [ ] No sensitive data exposed
  - [ ] SQL injection prevention verified

- [ ] **Testing**
  - [ ] Unit tests cover new functionality
  - [ ] Integration tests updated if needed
  - [ ] Manual testing completed
  - [ ] Test coverage maintained above 80%

- [ ] **Documentation**
  - [ ] API documentation updated
  - [ ] README updated if needed
  - [ ] Inline comments added for complex logic
  - [ ] Schema changes documented

**Review Process:**
1. **Self-Review:** Developer reviews own code before submission
2. **Peer Review:** At least one other developer reviews the code
3. **Lead Review:** Technical lead reviews for architectural compliance
4. **QA Review:** QA team reviews for testability and quality standards

### 10.2 Automated Quality Checks

**Pre-commit Hooks:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "npm run test:affected"
    ],
    "*.{md,json}": [
      "prettier --write"
    ]
  }
}
```

**CI/CD Pipeline Quality Gates:**
```yaml
# .github/workflows/quality-check.yml
name: Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint check
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Security audit
        run: npm audit --audit-level high
      
      - name: Build check
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### 10.3 Performance Monitoring

**Performance Testing:**
```typescript
// __tests__/performance/api-performance.test.ts
import { performance } from 'perf_hooks';

describe('API Performance Tests', () => {
  test('supplier list endpoint responds within 500ms', async () => {
    const start = performance.now();
    
    const response = await request(app)
      .get('/api/suppliers?limit=100')
      .expect(200);
    
    const end = performance.now();
    const duration = end - start;
    
    expect(duration).toBeLessThan(500);
    expect(response.body.data).toHaveLength(100);
  });
  
  test('supplier creation handles concurrent requests', async () => {
    const requests = Array.from({ length: 10 }, (_, i) => 
      request(app)
        .post('/api/suppliers')
        .send({
          name: `Concurrent Supplier ${i}`,
          // ... other required fields
        })
    );
    
    const start = performance.now();
    const responses = await Promise.all(requests);
    const end = performance.now();
    
    expect(responses.every(r => r.status === 201)).toBe(true);
    expect(end - start).toBeLessThan(2000); // All requests under 2 seconds
  });
});
```

**Database Performance Monitoring:**
```typescript
// middleware/performance-monitoring.ts
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    if (duration > 1000) { // Log slow requests
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent'],
      });
    }
    
    // Store metrics for monitoring dashboard
    recordMetric('api_request_duration', duration, {
      method: req.method,
      route: req.route?.path || req.originalUrl,
      status_code: res.statusCode.toString(),
    });
  });
  
  next();
};
```

---

## 11. Deployment Procedures

### 11.1 Environment Configuration

**Environment Setup:**
```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/eqms_prod
JWT_SECRET=production_jwt_secret_32_chars_minimum
SESSION_SECRET=production_session_secret_key
CORS_ORIGIN=https://eqms.company.com
LOG_LEVEL=warn
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

**Docker Configuration:**
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

### 11.2 Database Migration

**Production Migration Process:**
```bash
# Pre-deployment database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations in transaction
npm run db:migrate:production

# Verify migration success
npm run db:verify

# If migration fails, rollback
npm run db:rollback
```

**Migration Safety Checks:**
```typescript
// scripts/migration-safety-check.ts
export async function preMigrationChecks() {
  console.log('Running pre-migration safety checks...');
  
  // Check database connection
  try {
    await db.select().from(users).limit(1);
    console.log('✓ Database connection verified');
  } catch (error) {
    throw new Error('Database connection failed');
  }
  
  // Check disk space
  const diskSpace = await checkDiskSpace();
  if (diskSpace < 1000) { // Less than 1GB
    throw new Error('Insufficient disk space for migration');
  }
  console.log('✓ Sufficient disk space available');
  
  // Check for active connections
  const activeConnections = await getActiveConnections();
  if (activeConnections > 10) {
    console.warn('⚠ High number of active connections detected');
  }
  
  console.log('Pre-migration checks completed successfully');
}
```

### 11.3 Deployment Monitoring

**Health Check Endpoint:**
```typescript
// routes/health.ts
export async function healthCheck(req: Request, res: Response) {
  const checks = {
    database: false,
    redis: false,
    disk_space: false,
    memory: false,
  };
  
  try {
    // Database check
    await db.select().from(users).limit(1);
    checks.database = true;
    
    // Memory check
    const memUsage = process.memoryUsage();
    checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9;
    
    // Disk space check
    const diskSpace = await checkDiskSpace();
    checks.disk_space = diskSpace > 500; // 500MB minimum
    
    const allHealthy = Object.values(checks).every(Boolean);
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      checks,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 12. Maintenance & Support

### 12.1 Monitoring & Logging

**Structured Logging:**
```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'eqms-api',
    version: process.env.npm_package_version,
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage example
logger.info('Supplier created successfully', {
  supplierId: supplier.id,
  userId: user.id,
  duration: '45ms'
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  context: 'supplier-creation'
});
```

### 12.2 Backup Procedures

**Automated Backup Strategy:**
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/eqms_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage (if configured)
if [ ! -z "$AWS_S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/backups/"
fi

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "eqms_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Backup Verification:**
```typescript
// scripts/verify-backup.ts
export async function verifyBackup(backupFile: string) {
  console.log(`Verifying backup: ${backupFile}`);
  
  // Create temporary database
  const tempDbName = `eqms_verify_${Date.now()}`;
  await createTempDatabase(tempDbName);
  
  try {
    // Restore backup to temp database
    await exec(`psql ${tempDbName} < ${backupFile}`);
    
    // Verify critical tables exist and have data
    const criticalTables = ['users', 'suppliers', 'documents'];
    for (const table of criticalTables) {
      const count = await queryTempDb(tempDbName, `SELECT COUNT(*) FROM ${table}`);
      if (count === 0 && table !== 'documents') { // documents might be empty in dev
        throw new Error(`Table ${table} is empty in backup`);
      }
    }
    
    console.log('✓ Backup verification successful');
  } finally {
    // Clean up temp database
    await dropTempDatabase(tempDbName);
  }
}
```

### 12.3 Support Procedures

**Issue Triage Process:**
1. **Critical Issues (Production Down):**
   - Immediate response required
   - Escalate to senior developer
   - Create hotfix branch
   - Deploy emergency fix

2. **High Priority Issues (Feature Broken):**
   - Response within 2 hours
   - Investigate and provide workaround
   - Schedule fix for next patch release

3. **Medium Priority Issues (Minor Bug):**
   - Response within 1 business day
   - Add to backlog for next sprint
   - Document workaround if available

4. **Low Priority Issues (Enhancement):**
   - Response within 3 business days
   - Evaluate for future roadmap
   - May be closed if out of scope

**Support Documentation Template:**
```markdown
# Issue Report: [ISSUE-ID]

## Summary
Brief description of the issue

## Environment
- Environment: Production/Staging/Development
- Version: v1.2.3
- Browser: Chrome 120.0.0.0
- User Role: Admin/Manager/QA/Viewer

## Steps to Reproduce
1. Navigate to...
2. Click on...
3. Enter data...
4. Observe error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Error Messages
```
Paste error messages or stack traces here
```

## Screenshots
[Attach relevant screenshots]

## Workaround
Temporary solution if available

## Investigation Notes
Developer notes during investigation

## Resolution
Final solution implemented
```

---

## Appendix A: Development Tools Configuration

### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### VS Code Extensions
- TypeScript Hero
- ESLint
- Prettier
- GitLens
- Thunder Client
- PostgreSQL
- Auto Rename Tag
- Bracket Pair Colorizer
- Path Intellisense

---

## Appendix B: Emergency Procedures

### System Recovery Checklist
1. [ ] Identify scope of outage
2. [ ] Check system health endpoints
3. [ ] Review recent deployments
4. [ ] Check database connectivity
5. [ ] Review application logs
6. [ ] Implement rollback if necessary
7. [ ] Communicate status to stakeholders
8. [ ] Document incident for post-mortem

### Contact Information
- **Development Team Lead:** [Contact Info]
- **Database Administrator:** [Contact Info]
- **DevOps Engineer:** [Contact Info]
- **Product Owner:** [Contact Info]

---

**Document Control:**
- Last Updated: June 13, 2025
- Next Review Date: September 13, 2025
- Document Owner: Development Team Lead
- Approval Required: Yes

*This document contains confidential and proprietary information. Distribution is restricted to authorized development team members only.*