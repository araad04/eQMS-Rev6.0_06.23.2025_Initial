# Test Protocols and Procedures
## eQMS System Comprehensive Testing Strategy

**Document Control Information**
- Document ID: TP-eQMS-2025-001
- Version: 1.0
- Date: June 4, 2025
- Author: Senior Software Development Team
- Classification: Controlled Document

---

## 1. Testing Strategy Overview

### 1.1 Testing Objectives
- Verify all functional requirements are implemented correctly
- Validate non-functional requirements meet specified criteria
- Ensure regulatory compliance (ISO 13485:2016, 21 CFR Part 11)
- Confirm system security and data integrity
- Validate user experience and accessibility standards

### 1.2 Testing Approach
- **Risk-Based Testing**: Prioritize critical functionality and high-risk areas
- **Automated Testing**: Implement comprehensive test automation for regression testing
- **Continuous Testing**: Integrate testing into CI/CD pipeline
- **Regulatory Compliance**: Follow CSV (Computer System Validation) procedures

### 1.3 Test Environment Strategy
- **Development**: Unit testing and initial integration testing
- **Staging**: Full system testing and user acceptance testing
- **Production**: Smoke testing and monitoring validation

---

## 2. Unit Testing Protocols

### 2.1 Frontend Unit Testing

#### 2.1.1 React Component Testing Protocol
```typescript
// Test Protocol: Component Rendering and Interaction
describe('ManagementReviewCard Component', () => {
  const mockReview = {
    id: 1,
    title: 'Q1 2025 Management Review',
    reviewDate: '2025-03-31T10:00:00Z',
    status: 'draft',
    createdBy: 1
  };

  beforeEach(() => {
    render(<ManagementReviewCard review={mockReview} />);
  });

  test('should render review title correctly', () => {
    expect(screen.getByText('Q1 2025 Management Review')).toBeInTheDocument();
  });

  test('should display formatted review date', () => {
    expect(screen.getByText('Mar 31, 2025')).toBeInTheDocument();
  });

  test('should show correct status badge', () => {
    const statusBadge = screen.getByText('Draft');
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  test('should handle delete button click', async () => {
    const mockOnDelete = jest.fn();
    render(<ManagementReviewCard review={mockReview} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockReview, expect.any(Object));
  });
});
```

#### 2.1.2 Hook Testing Protocol
```typescript
// Test Protocol: Custom Hooks
describe('useManagementReviews Hook', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  beforeEach(() => {
    queryClient.clear();
  });

  test('should fetch management reviews successfully', async () => {
    const mockReviews = [mockReview];
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, data: mockReviews }));

    const { result } = renderHook(() => useManagementReviews(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockReviews);
  });

  test('should handle error states correctly', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    const { result } = renderHook(() => useManagementReviews(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### 2.2 Backend Unit Testing

#### 2.2.1 Service Layer Testing Protocol
```typescript
// Test Protocol: Service Layer
describe('ManagementReviewService', () => {
  let service: ManagementReviewService;
  let mockStorage: jest.Mocked<IStorage>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    mockStorage = {
      getManagementReviews: jest.fn(),
      createManagementReview: jest.fn(),
      updateManagementReview: jest.fn(),
      deleteManagementReview: jest.fn()
    } as any;

    mockAuditService = {
      logAction: jest.fn()
    } as any;

    service = new ManagementReviewService(mockStorage, mockAuditService);
  });

  describe('createReview', () => {
    test('should create review and log audit trail', async () => {
      const createData = {
        title: 'Test Review',
        reviewDate: new Date('2025-03-31'),
        reviewType: 'quarterly'
      };

      const createdReview = { id: 1, ...createData };
      mockStorage.createManagementReview.mockResolvedValue(createdReview);

      const result = await service.createReview(createData, 1);

      expect(mockStorage.createManagementReview).toHaveBeenCalledWith({
        ...createData,
        createdBy: 1,
        status: 'draft'
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        action: 'MANAGEMENT_REVIEW_CREATED',
        entityType: 'MANAGEMENT_REVIEW',
        entityId: 1,
        userId: 1,
        changes: createData
      });

      expect(result).toEqual(createdReview);
    });

    test('should validate required fields', async () => {
      const invalidData = { title: '' }; // Missing required fields

      await expect(service.createReview(invalidData as any, 1))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('deleteReview', () => {
    test('should delete review and create audit trail', async () => {
      const reviewId = 1;
      const existingReview = { id: 1, title: 'Test Review' };
      
      mockStorage.getManagementReview.mockResolvedValue(existingReview);
      mockStorage.deleteManagementReview.mockResolvedValue();

      await service.deleteReview(reviewId, 1);

      expect(mockStorage.deleteManagementReview).toHaveBeenCalledWith(reviewId);
      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        action: 'MANAGEMENT_REVIEW_DELETED',
        entityType: 'MANAGEMENT_REVIEW',
        entityId: reviewId,
        userId: 1,
        changes: { deleted: true }
      });
    });

    test('should throw error when review not found', async () => {
      mockStorage.getManagementReview.mockResolvedValue(null);

      await expect(service.deleteReview(999, 1))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

#### 2.2.2 Database Layer Testing Protocol
```typescript
// Test Protocol: Database Operations
describe('ManagementReviewRepository', () => {
  let repository: ManagementReviewRepository;
  let testDb: Database;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    repository = new ManagementReviewRepository(testDb);
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await testDb.delete(managementReviews).execute();
    await testDb.delete(users).execute();
    
    // Insert test user
    await testDb.insert(users).values({
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    }).execute();
  });

  test('should create management review with correct data', async () => {
    const reviewData = {
      title: 'Test Review',
      reviewDate: new Date('2025-03-31'),
      reviewType: 'quarterly',
      createdBy: 1
    };

    const created = await repository.create(reviewData);

    expect(created.id).toBeDefined();
    expect(created.title).toBe(reviewData.title);
    expect(created.reviewDate).toEqual(reviewData.reviewDate);
    expect(created.createdBy).toBe(reviewData.createdBy);
  });

  test('should enforce unique constraints', async () => {
    const reviewData = {
      title: 'Duplicate Review',
      reviewDate: new Date('2025-03-31'),
      reviewType: 'quarterly',
      createdBy: 1
    };

    await repository.create(reviewData);

    // Attempt to create duplicate
    await expect(repository.create(reviewData))
      .rejects
      .toThrow(/unique constraint/i);
  });

  test('should retrieve reviews with pagination', async () => {
    // Create 15 test reviews
    for (let i = 1; i <= 15; i++) {
      await repository.create({
        title: `Review ${i}`,
        reviewDate: new Date('2025-03-31'),
        reviewType: 'quarterly',
        createdBy: 1
      });
    }

    const page1 = await repository.findAll({ limit: 10, offset: 0 });
    const page2 = await repository.findAll({ limit: 10, offset: 10 });

    expect(page1.length).toBe(10);
    expect(page2.length).toBe(5);
  });
});
```

---

## 3. Integration Testing Protocols

### 3.1 API Integration Testing

#### 3.1.1 REST API Testing Protocol
```typescript
// Test Protocol: API Endpoints
describe('Management Review API Integration', () => {
  let app: Express;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await createTestUser();
    authToken = await getAuthToken(testUser.username);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/v1/management-reviews', () => {
    test('should create management review with valid data', async () => {
      const reviewData = {
        title: 'Q1 2025 Management Review',
        reviewDate: '2025-03-31T10:00:00Z',
        reviewType: 'quarterly'
      };

      const response = await request(app)
        .post('/api/v1/management-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: reviewData.title,
        reviewType: reviewData.reviewType,
        status: 'draft'
      });

      // Verify database state
      const dbReview = await getReviewFromDatabase(response.body.data.id);
      expect(dbReview).toBeTruthy();
      expect(dbReview.title).toBe(reviewData.title);
    });

    test('should return 400 for invalid data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        reviewDate: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/v1/management-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 401 without authentication', async () => {
      const reviewData = {
        title: 'Unauthorized Review',
        reviewDate: '2025-03-31T10:00:00Z',
        reviewType: 'quarterly'
      };

      await request(app)
        .post('/api/v1/management-reviews')
        .send(reviewData)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/management-reviews/:id', () => {
    test('should delete existing review', async () => {
      // Create review first
      const review = await createTestReview(testUser.id);

      const response = await request(app)
        .delete(`/api/v1/management-reviews/${review.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify review is deleted
      const deletedReview = await getReviewFromDatabase(review.id);
      expect(deletedReview).toBeNull();

      // Verify audit trail
      const auditEntries = await getAuditTrail('MANAGEMENT_REVIEW', review.id);
      expect(auditEntries).toContainEqual(
        expect.objectContaining({
          action: 'MANAGEMENT_REVIEW_DELETED'
        })
      );
    });

    test('should return 404 for non-existent review', async () => {
      await request(app)
        .delete('/api/v1/management-reviews/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### 3.2 Database Integration Testing

#### 3.2.1 Transaction Testing Protocol
```typescript
// Test Protocol: Database Transactions
describe('Transaction Integrity Tests', () => {
  test('should rollback on constraint violation', async () => {
    const db = await getTestDatabase();
    
    await db.transaction(async (tx) => {
      // Create valid review
      const review = await tx.insert(managementReviews).values({
        title: 'Valid Review',
        reviewDate: new Date(),
        reviewType: 'quarterly',
        createdBy: 1
      }).returning();

      // Create invalid input (should cause rollback)
      try {
        await tx.insert(managementReviewInputs).values({
          reviewId: review[0].id,
          categoryId: 999, // Invalid foreign key
          inputData: 'Test data'
        });
      } catch (error) {
        throw error; // This should cause rollback
      }
    }).catch(() => {
      // Expected to fail
    });

    // Verify rollback - review should not exist
    const reviews = await db.select().from(managementReviews);
    expect(reviews).toHaveLength(0);
  });

  test('should maintain data consistency under concurrent operations', async () => {
    const db = await getTestDatabase();
    
    // Create base review
    const review = await db.insert(managementReviews).values({
      title: 'Concurrent Test Review',
      reviewDate: new Date(),
      reviewType: 'quarterly',
      createdBy: 1
    }).returning();

    // Simulate concurrent updates
    const promises = Array.from({ length: 10 }, (_, i) =>
      db.update(managementReviews)
        .set({ title: `Updated Title ${i}` })
        .where(eq(managementReviews.id, review[0].id))
    );

    await Promise.all(promises);

    // Verify final state is consistent
    const finalReview = await db.select()
      .from(managementReviews)
      .where(eq(managementReviews.id, review[0].id));

    expect(finalReview).toHaveLength(1);
    expect(finalReview[0].title).toMatch(/^Updated Title \d$/);
  });
});
```

---

## 4. Performance Testing Protocols

### 4.1 Load Testing Protocol

#### 4.1.1 API Load Testing
```typescript
// Test Protocol: Load Testing Configuration
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export function setup() {
  // Get authentication token
  const loginResponse = http.post(`${__ENV.BASE_URL}/api/auth/login`, {
    username: 'testuser',
    password: 'testpass'
  });
  
  return { token: loginResponse.json('token') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  };

  // Test GET /api/v1/management-reviews
  const getResponse = http.get(
    `${__ENV.BASE_URL}/api/v1/management-reviews`,
    { headers }
  );
  
  check(getResponse, {
    'GET status is 200': (r) => r.status === 200,
    'GET response time < 2s': (r) => r.timings.duration < 2000,
    'GET response has data': (r) => r.json('data') !== undefined,
  });

  // Test POST /api/v1/management-reviews
  const createData = {
    title: `Load Test Review ${Math.random()}`,
    reviewDate: new Date().toISOString(),
    reviewType: 'quarterly'
  };

  const postResponse = http.post(
    `${__ENV.BASE_URL}/api/v1/management-reviews`,
    JSON.stringify(createData),
    { headers }
  );

  check(postResponse, {
    'POST status is 201': (r) => r.status === 201,
    'POST response time < 3s': (r) => r.timings.duration < 3000,
    'POST creates valid resource': (r) => r.json('data.id') !== undefined,
  });

  // Clean up created resource
  if (postResponse.status === 201) {
    const reviewId = postResponse.json('data.id');
    http.del(
      `${__ENV.BASE_URL}/api/v1/management-reviews/${reviewId}`,
      null,
      { headers }
    );
  }
}
```

#### 4.1.2 Database Performance Testing
```sql
-- Test Protocol: Database Performance Queries

-- Test 1: Query Performance with Large Datasets
EXPLAIN ANALYZE
SELECT mr.*, u.first_name, u.last_name,
       COUNT(mri.id) as input_count,
       COUNT(mrai.id) as action_item_count
FROM management_reviews mr
LEFT JOIN users u ON mr.created_by = u.id
LEFT JOIN management_review_inputs mri ON mr.id = mri.review_id
LEFT JOIN management_review_action_items mrai ON mr.id = mrai.review_id
WHERE mr.created_at >= NOW() - INTERVAL '1 year'
GROUP BY mr.id, u.id
ORDER BY mr.created_at DESC
LIMIT 50;

-- Test 2: Index Effectiveness
EXPLAIN ANALYZE
SELECT * FROM audit_log
WHERE table_name = 'management_reviews'
  AND timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- Test 3: Concurrent Access Simulation
BEGIN;
SELECT * FROM management_reviews WHERE id = 1 FOR UPDATE;
-- Simulate processing time
SELECT pg_sleep(0.1);
UPDATE management_reviews SET updated_at = NOW() WHERE id = 1;
COMMIT;
```

### 4.2 Stress Testing Protocol

#### 4.2.1 Memory Stress Testing
```typescript
// Test Protocol: Memory Usage Under Stress
describe('Memory Stress Tests', () => {
  test('should handle large dataset processing without memory leaks', async () => {
    const initialMemory = process.memoryUsage();
    
    // Process large number of records
    for (let i = 0; i < 10000; i++) {
      const review = {
        id: i,
        title: `Stress Test Review ${i}`,
        reviewDate: new Date(),
        reviewType: 'quarterly',
        createdBy: 1
      };
      
      // Process review data
      await processReviewData(review);
      
      // Force garbage collection every 1000 iterations
      if (i % 1000 === 0) {
        if (global.gc) {
          global.gc();
        }
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });

  test('should handle concurrent requests without memory exhaustion', async () => {
    const concurrentRequests = 100;
    const requests = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        request(app)
          .get('/api/v1/management-reviews')
          .set('Authorization', `Bearer ${authToken}`)
      );
    }
    
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    // Check memory usage after concurrent requests
    const memoryUsage = process.memoryUsage();
    expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
  });
});
```

---

## 5. Security Testing Protocols

### 5.1 Authentication Testing Protocol

#### 5.1.1 JWT Security Testing
```typescript
// Test Protocol: JWT Token Security
describe('JWT Security Tests', () => {
  test('should reject expired tokens', async () => {
    const expiredToken = jwt.sign(
      { sub: '1', iat: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_SECRET!,
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('should reject malformed tokens', async () => {
    const malformedToken = 'invalid.token.format';

    await request(app)
      .get('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${malformedToken}`)
      .expect(401);
  });

  test('should reject tokens with invalid signature', async () => {
    const invalidToken = jwt.sign(
      { sub: '1', iat: Math.floor(Date.now() / 1000) },
      'wrong-secret'
    );

    await request(app)
      .get('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
  });

  test('should validate token permissions', async () => {
    const limitedToken = jwt.sign(
      { 
        sub: '1', 
        permissions: ['management_review:view'],
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Should allow viewing
    await request(app)
      .get('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(200);

    // Should reject creation (requires management_review:create)
    await request(app)
      .post('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({ title: 'Test', reviewDate: new Date(), reviewType: 'quarterly' })
      .expect(403);
  });
});
```

### 5.2 Input Validation Testing Protocol

#### 5.2.1 SQL Injection Testing
```typescript
// Test Protocol: SQL Injection Prevention
describe('SQL Injection Security Tests', () => {
  test('should prevent SQL injection in search queries', async () => {
    const maliciousInput = "'; DROP TABLE management_reviews; --";

    const response = await request(app)
      .get('/api/v1/management-reviews')
      .query({ search: maliciousInput })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify table still exists by making another request
    const verifyResponse = await request(app)
      .get('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(verifyResponse.body.success).toBe(true);
  });

  test('should sanitize input data', async () => {
    const maliciousData = {
      title: "<script>alert('XSS')</script>",
      reviewType: "quarterly'; DROP TABLE users; --"
    };

    const response = await request(app)
      .post('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ...maliciousData,
        reviewDate: new Date().toISOString()
      })
      .expect(201);

    const createdReview = response.body.data;
    
    // Verify data is sanitized
    expect(createdReview.title).not.toContain('<script>');
    expect(createdReview.reviewType).toBe('quarterly');
  });
});
```

### 5.3 Access Control Testing Protocol

#### 5.3.1 RBAC Testing
```typescript
// Test Protocol: Role-Based Access Control
describe('RBAC Security Tests', () => {
  let qualityManagerToken: string;
  let qualityEngineerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    qualityManagerToken = await getTokenForRole('quality_manager');
    qualityEngineerToken = await getTokenForRole('quality_engineer');
    adminToken = await getTokenForRole('admin');
  });

  test('quality manager should have full management review access', async () => {
    // Can create
    await request(app)
      .post('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${qualityManagerToken}`)
      .send(validReviewData)
      .expect(201);

    // Can view
    await request(app)
      .get('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${qualityManagerToken}`)
      .expect(200);

    // Can approve
    const review = await createTestReview();
    await request(app)
      .post(`/api/v1/management-reviews/${review.id}/approve`)
      .set('Authorization', `Bearer ${qualityManagerToken}`)
      .send({ signature: 'digital_signature_data' })
      .expect(200);
  });

  test('quality engineer should have limited access', async () => {
    // Can view
    await request(app)
      .get('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${qualityEngineerToken}`)
      .expect(200);

    // Cannot create
    await request(app)
      .post('/api/v1/management-reviews')
      .set('Authorization', `Bearer ${qualityEngineerToken}`)
      .send(validReviewData)
      .expect(403);

    // Cannot approve
    const review = await createTestReview();
    await request(app)
      .post(`/api/v1/management-reviews/${review.id}/approve`)
      .set('Authorization', `Bearer ${qualityEngineerToken}`)
      .send({ signature: 'digital_signature_data' })
      .expect(403);
  });

  test('admin should have system-wide access', async () => {
    // Can access user management
    await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Can access audit trail
    await request(app)
      .get('/api/v1/admin/audit-trail')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Can access system configuration
    await request(app)
      .get('/api/v1/admin/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
```

---

## 6. Compliance Testing Protocols

### 6.1 ISO 13485:2016 Compliance Testing

#### 6.1.1 Document Control Testing
```typescript
// Test Protocol: ISO 13485 Document Control Requirements
describe('ISO 13485 Document Control Compliance', () => {
  test('should maintain document version control', async () => {
    const document = await createTestDocument();
    
    // Update document
    const updatedDoc = await request(app)
      .put(`/api/v1/documents/${document.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Document',
        content: 'Updated content'
      })
      .expect(200);

    // Verify version tracking
    expect(updatedDoc.body.data.version).toBe('1.1');
    
    // Verify previous version is archived
    const versions = await request(app)
      .get(`/api/v1/documents/${document.id}/versions`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(versions.body.data).toHaveLength(2);
    expect(versions.body.data[0].is_current).toBe(false);
    expect(versions.body.data[1].is_current).toBe(true);
  });

  test('should require approval for controlled documents', async () => {
    const controlledDoc = await createControlledDocument();
    
    // Attempt to publish without approval
    await request(app)
      .post(`/api/v1/documents/${controlledDoc.id}/publish`)
      .set('Authorization', `Bearer ${qualityEngineerToken}`)
      .expect(403);

    // Approve with proper authority
    await request(app)
      .post(`/api/v1/documents/${controlledDoc.id}/approve`)
      .set('Authorization', `Bearer ${qualityManagerToken}`)
      .send({ signature: 'approval_signature' })
      .expect(200);

    // Now publishing should work
    await request(app)
      .post(`/api/v1/documents/${controlledDoc.id}/publish`)
      .set('Authorization', `Bearer ${qualityManagerToken}`)
      .expect(200);
  });
});
```

### 6.2 21 CFR Part 11 Compliant Testing

#### 6.2.1 Electronic Signature Testing
```typescript
// Test Protocol: 21 CFR Part 11 Compliant Electronic Signatures
describe('21 CFR Part 11 Compliant Electronic Signature', () => {
  test('should capture complete signature information', async () => {
    const review = await createTestReview();
    
    const signatureData = {
      meaning: 'Approved by Quality Manager',
      signedAt: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)'
    };

    const response = await request(app)
      .post(`/api/v1/management-reviews/${review.id}/sign`)
      .set('Authorization', `Bearer ${qualityManagerToken}`)
      .set('X-Forwarded-For', signatureData.ipAddress)
      .set('User-Agent', signatureData.userAgent)
      .send({
        meaning: signatureData.meaning,
        password: 'user_password' // Re-authentication required
      })
      .expect(200);

    // Verify signature was recorded
    const signatures = await request(app)
      .get(`/api/v1/management-reviews/${review.id}/signatures`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const signature = signatures.body.data[0];
    expect(signature).toMatchObject({
      meaning: signatureData.meaning,
      ip_address: signatureData.ipAddress,
      user_agent: signatureData.userAgent,
      is_valid: true
    });
  });

  test('should maintain audit trail for electronic records', async () => {
    const review = await createTestReview();
    
    // Update review
    await request(app)
      .put(`/api/v1/management-reviews/${review.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title' })
      .expect(200);

    // Verify audit trail
    const auditTrail = await request(app)
      .get(`/api/v1/audit-trail/management-reviews/${review.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const auditEntry = auditTrail.body.data[0];
    expect(auditEntry).toMatchObject({
      action: 'UPDATE',
      table_name: 'management_reviews',
      record_id: review.id,
      old_values: expect.objectContaining({ title: 'Original Title' }),
      new_values: expect.objectContaining({ title: 'Updated Title' }),
      user_id: expect.any(Number),
      timestamp: expect.any(String),
      ip_address: expect.any(String)
    });
  });

  test('should prevent unauthorized modification of electronic records', async () => {
    const review = await createAndSignReview();
    
    // Attempt to modify signed record
    await request(app)
      .put(`/api/v1/management-reviews/${review.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Unauthorized Change' })
      .expect(403);

    expect(await getReviewFromDatabase(review.id))
      .toMatchObject({ title: review.title }); // Unchanged
  });
});
```

---

## 7. User Acceptance Testing Protocols

### 7.1 UAT Test Scenarios

#### 7.1.1 Management Review Workflow UAT
```
Test Scenario: Complete Management Review Lifecycle
Prerequisites: 
- User with Quality Manager role
- Test environment with sample data

Steps:
1. Login to eQMS system
   Expected: Dashboard displays with management review section

2. Navigate to Management Review module
   Expected: Management review list page loads with existing reviews

3. Click "Create New Review" button
   Expected: Review creation form displays

4. Fill in review details:
   - Title: "Q2 2025 Management Review"
   - Review Date: Current date + 30 days
   - Review Type: "Quarterly"
   Expected: Form accepts valid input without errors

5. Submit review creation
   Expected: Review created successfully, redirected to review detail page

6. Add review inputs for each category
   Expected: Input forms accept data, save successfully

7. Assign action items to team members
   Expected: Action items created with proper assignments

8. Submit review for approval
   Expected: Review status changes to "Pending Approval"

9. Approve review with electronic signature
   Expected: Review status changes to "Approved", signature recorded

10. Verify audit trail
    Expected: Complete history of review lifecycle visible

Acceptance Criteria:
- All steps complete without system errors
- Response times under 3 seconds for each action
- Audit trail captures all changes
- Electronic signature meets regulatory requirements
```

#### 7.1.2 CAPA Management UAT
```
Test Scenario: CAPA Creation and Assignment
Prerequisites:
- User with appropriate CAPA permissions
- Existing audit finding requiring CAPA

Steps:
1. Navigate to CAPA Management module
   Expected: CAPA dashboard displays current CAPAs

2. Create new CAPA from audit finding
   Expected: CAPA form pre-populated with finding details

3. Complete CAPA details:
   - Root cause analysis
   - Corrective actions
   - Preventive actions
   - Due dates
   Expected: Form validation prevents submission of incomplete data

4. Assign CAPA to responsible person
   Expected: Assignment notification sent, CAPA status updated

5. Track CAPA progress through workflow
   Expected: Status updates reflect progress accurately

6. Complete effectiveness review
   Expected: CAPA closure process initiated

7. Close CAPA with final approval
   Expected: CAPA marked as closed, effectiveness verified

Acceptance Criteria:
- CAPA workflow follows defined business process
- Notifications sent at appropriate milestones
- Effectiveness tracking maintained throughout process
- Integration with audit findings seamless
```

### 7.2 Usability Testing Protocol

#### 7.2.1 Task-Based Usability Testing
```
Test Protocol: User Task Performance
Participants: 5 users from each role (Quality Manager, Engineer, Admin)
Tasks:
1. Complete management review creation (Target: <10 minutes)
2. Find and update existing CAPA (Target: <5 minutes)
3. Generate compliance report (Target: <3 minutes)

Metrics Collected:
- Task completion time
- Error rate
- Number of clicks/steps
- User satisfaction rating (1-10)
- Areas of confusion or difficulty

Success Criteria:
- 90% task completion rate
- Average satisfaction rating >7
- Task completion within target times
- Error rate <5%
```

---

## 8. Regression Testing Protocols

### 8.1 Automated Regression Testing

#### 8.1.1 CI/CD Pipeline Integration
```yaml
# Test Protocol: Automated Regression Pipeline
name: Regression Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  regression-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Test Database
      run: |
        docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:14
        sleep 10
        npm run db:setup:test
    
    - name: Run Unit Tests
      run: npm run test:unit
      
    - name: Run Integration Tests
      run: npm run test:integration
      
    - name: Run API Tests
      run: npm run test:api
      
    - name: Run Security Tests
      run: npm run test:security
      
    - name: Performance Regression Tests
      run: npm run test:performance:regression
      
    - name: Generate Test Report
      uses: dorny/test-reporter@v1
      with:
        name: Regression Test Results
        path: test-results/**/*.xml
        reporter: jest-junit
```

### 8.2 Critical Path Testing

#### 8.2.1 Core Functionality Verification
```typescript
// Test Protocol: Critical Path Regression
describe('Critical Path Regression Tests', () => {
  const criticalPaths = [
    'User Authentication',
    'Management Review Creation',
    'CAPA Workflow',
    'Audit Trail Generation',
    'Electronic Signatures',
    'Data Export',
    'System Backup'
  ];

  criticalPaths.forEach(path => {
    test(`${path} critical path should function correctly`, async () => {
      const testResult = await executeCriticalPath(path);
      expect(testResult.success).toBe(true);
      expect(testResult.errors).toHaveLength(0);
      expect(testResult.performanceMetrics.responseTime).toBeLessThan(2000);
    });
  });
});
```

This comprehensive test protocol documentation ensures thorough testing coverage across all layers of the eQMS system, maintaining high quality standards and regulatory compliance.