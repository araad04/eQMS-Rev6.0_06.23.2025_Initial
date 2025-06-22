/**
 * Supplier Management Module Tests
 * Tests for verifying functionality of the supplier management routes and storage
 */

const request = require('supertest');
const { app } = require('../server/index'); // Import your Express app
const { db } = require('../server/db');
const { suppliers, supplierCategories, supplierStatuses } = require('../shared/schema');
const { eq } = require('drizzle-orm');

// Mock authentication for tests
jest.mock('../server/auth', () => ({
  ...jest.requireActual('../server/auth'),
  isAuthenticated: (req, res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: 9999, username: 'testuser', role: 'admin' };
    return next();
  }
}));

describe('Supplier Management Module Tests', () => {
  let testSupplierId;

  // Setup test data before tests
  beforeAll(async () => {
    // Ensure we have categories and statuses
    await ensureTestData();
  });

  // Clean up test data after tests
  afterAll(async () => {
    // Delete test suppliers
    if (testSupplierId) {
      await db.delete(suppliers).where(eq(suppliers.id, testSupplierId));
    }
  });

  // Test supplier listing
  test('GET /api/suppliers returns all suppliers', async () => {
    const response = await request(app).get('/api/suppliers');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test supplier creation
  test('POST /api/suppliers creates a new supplier', async () => {
    const newSupplier = {
      supplierId: 'TEST-SUP-001',
      name: 'Test Supplier Inc.',
      description: 'A test supplier for API testing',
      categoryId: 1,
      statusId: 1,
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      country: 'Test Country',
      postalCode: '12345',
      contactName: 'Test Contact',
      contactEmail: 'test@testsupplier.com',
      contactPhone: '123-456-7890',
      website: 'https://testsupplier.com',
      criticality: 'Critical',
      initialRiskLevel: 'High',
      currentRiskLevel: 'High',
      createdBy: 9999
    };

    const response = await request(app)
      .post('/api/suppliers')
      .send(newSupplier);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newSupplier.name);
    
    // Save the ID for cleanup
    testSupplierId = response.body.id;
  });

  // Test getting a specific supplier
  test('GET /api/suppliers/:id returns specific supplier', async () => {
    // Skip if no test supplier was created
    if (!testSupplierId) {
      return;
    }

    const response = await request(app).get(`/api/suppliers/${testSupplierId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testSupplierId);
    expect(response.body).toHaveProperty('name', 'Test Supplier Inc.');
  });

  // Test updating a supplier
  test('PUT /api/suppliers/:id updates a supplier', async () => {
    // Skip if no test supplier was created
    if (!testSupplierId) {
      return;
    }

    const updates = {
      name: 'Updated Test Supplier',
      contactName: 'Updated Contact',
      currentRiskLevel: 'Medium'
    };

    const response = await request(app)
      .put(`/api/suppliers/${testSupplierId}`)
      .send(updates);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', updates.name);
    expect(response.body).toHaveProperty('contactName', updates.contactName);
    expect(response.body).toHaveProperty('currentRiskLevel', updates.currentRiskLevel);
  });

  // Test supplier filtering by criticality
  test('GET /api/suppliers?criticality=Critical filters suppliers by criticality', async () => {
    const response = await request(app).get('/api/suppliers?criticality=Critical');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // All returned suppliers should be critical
    response.body.forEach(supplier => {
      expect(supplier.criticality).toBe('Critical');
    });
  });

  // Test supplier filtering by risk level
  test('GET /api/suppliers?riskLevel=High filters suppliers by risk level', async () => {
    const response = await request(app).get('/api/suppliers?riskLevel=High');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // All returned suppliers should have high risk
    response.body.forEach(supplier => {
      expect(supplier.currentRiskLevel).toBe('High');
    });
  });

  // Test deleting a supplier
  test('DELETE /api/suppliers/:id deletes a supplier', async () => {
    // Skip if no test supplier was created
    if (!testSupplierId) {
      return;
    }

    const response = await request(app).delete(`/api/suppliers/${testSupplierId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // Verify the supplier is gone
    const getResponse = await request(app).get(`/api/suppliers/${testSupplierId}`);
    expect(getResponse.status).toBe(404);
    
    // Clear ID as we've deleted it
    testSupplierId = null;
  });
});

// Helper function to ensure test data exists
async function ensureTestData() {
  // Check if we have categories
  const categoryCount = await db.select({ count: db.fn.count() }).from(supplierCategories);
  if (parseInt(categoryCount[0].count) === 0) {
    // Add test categories
    await db.insert(supplierCategories).values([
      { name: 'Component Supplier', description: 'Suppliers of components and parts' },
      { name: 'Service Provider', description: 'Suppliers of services' },
      { name: 'Contract Manufacturer', description: 'Manufacturing partners' }
    ]);
  }

  // Check if we have statuses
  const statusCount = await db.select({ count: db.fn.count() }).from(supplierStatuses);
  if (parseInt(statusCount[0].count) === 0) {
    // Add test statuses
    await db.insert(supplierStatuses).values([
      { name: 'Approved', description: 'Fully approved supplier' },
      { name: 'Pending', description: 'Supplier pending approval' },
      { name: 'Suspended', description: 'Supplier temporarily suspended' },
      { name: 'Disqualified', description: 'Supplier disqualified' }
    ]);
  }
}