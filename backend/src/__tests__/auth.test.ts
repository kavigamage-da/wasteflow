import request from 'supertest';
import { createApp } from '../app';

describe('Authentication', () => {
  const app = createApp();

  describe('POST /api/auth/login', () => {
    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject nonexistent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    // Note: This test requires the database to be seeded with test data
    // For now, we skip it as it depends on database state
    it.skip('should return tokens for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Protected Endpoints', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/trips')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Missing bearer token');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });
});
