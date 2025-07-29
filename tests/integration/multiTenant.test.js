const request = require('supertest');
const app = require('../../app');
const { 
  createTestOperator, 
  createTestUser, 
  createTestBranch,
  createTestToken 
} = require('../setup');

describe('Multi-tenant Isolation Tests', () => {
  let operator1, operator2;
  let user1, user2;
  let branch1, branch2;
  let token1, token2;

  beforeEach(async () => {
    // Create two separate operators
    operator1 = await createTestOperator();
    operator2 = await createTestOperator({
      name: 'Second Operator',
      code: 'SEC',
      phone: '9876543211'
    });

    // Create users for each operator
    user1 = await createTestUser(operator1._id, { mobile: '9876543210' });
    user2 = await createTestUser(operator2._id, { mobile: '9876543211' });

    // Create branches for each operator
    branch1 = await createTestBranch(operator1._id, { name: 'Branch 1' });
    branch2 = await createTestBranch(operator2._id, { name: 'Branch 2' });

    // Generate tokens
    token1 = createTestToken(user1);
    token2 = createTestToken(user2);
  });

  describe('User Isolation', () => {
    test('Users can only see users from their own operator', async () => {
      const response1 = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const response2 = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response1.body.data.users).toHaveLength(1);
      expect(response2.body.data.users).toHaveLength(1);

      expect(response1.body.data.users[0].operatorId.toString()).toBe(operator1._id.toString());
      expect(response2.body.data.users[0].operatorId.toString()).toBe(operator2._id.toString());
    });

    test('Users cannot access users from other operators by ID', async () => {
      await request(app)
        .get(`/api/users/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      await request(app)
        .get(`/api/users/${user1._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);
    });
  });

  describe('Branch Isolation', () => {
    test('Users can only see branches from their own operator', async () => {
      const response1 = await request(app)
        .get('/api/branches')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const response2 = await request(app)
        .get('/api/branches')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response1.body.data.branches).toHaveLength(1);
      expect(response2.body.data.branches).toHaveLength(1);

      expect(response1.body.data.branches[0].operatorId.toString()).toBe(operator1._id.toString());
      expect(response2.body.data.branches[0].operatorId.toString()).toBe(operator2._id.toString());
    });
  });

  describe('Booking Isolation', () => {
    test('Users can only create bookings between branches of their own operator', async () => {
      // User 1 should be able to create booking with branch 1
      const validBooking = {
        senderName: 'Test Sender',
        senderPhone: '9876543210',
        receiverName: 'Test Receiver',
        receiverPhone: '9876543211',
        fromOffice: branch1._id,
        toOffice: branch1._id,
        weight: 10,
        quantity: 1,
        valueOfGoods: 1000
      };

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token1}`)
        .send(validBooking)
        .expect(201);

      // User 1 should not be able to create booking with branch 2
      const invalidBooking = {
        ...validBooking,
        fromOffice: branch2._id
      };

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token1}`)
        .send(invalidBooking)
        .expect(400);
    });
  });

  describe('Request Context Isolation', () => {
    test('Request context maintains operator isolation across concurrent requests', async () => {
      const promises = [
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${token1}`),
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${token2}`),
        request(app)
          .get('/api/branches')
          .set('Authorization', `Bearer ${token1}`),
        request(app)
          .get('/api/branches')
          .set('Authorization', `Bearer ${token2}`)
      ];

      const responses = await Promise.all(promises);

      // Verify each response has correct operator isolation
      expect(responses[0].body.data.users[0].operatorId.toString()).toBe(operator1._id.toString());
      expect(responses[1].body.data.users[0].operatorId.toString()).toBe(operator2._id.toString());
      expect(responses[2].body.data.branches[0].operatorId.toString()).toBe(operator1._id.toString());
      expect(responses[3].body.data.branches[0].operatorId.toString()).toBe(operator2._id.toString());
    });
  });
});

describe('Security Tests', () => {
  let operator, user, token;

  beforeEach(async () => {
    operator = await createTestOperator();
    user = await createTestUser(operator._id);
    token = createTestToken(user);
  });

  describe('Authentication', () => {
    test('Should reject requests without authentication token', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    test('Should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Input Validation', () => {
    test('Should validate user creation input', async () => {
      const invalidUser = {
        fullName: 'A', // Too short
        mobile: '123', // Invalid mobile
        password: '12345' // Too short
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.errorCode).toBe('VALIDATION_ERROR');
    });

    test('Should validate ObjectId parameters', async () => {
      await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    test('Should apply rate limiting to authentication endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid requests to exceed rate limit
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ mobile: '9876543210', password: 'wrong-password' })
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});