import request from 'supertest';
import { createApp } from '../app';

describe('API Endpoints', () => {
  const app = createApp();

  describe('Health Endpoints', () => {
    it('GET /api/health should return status ok', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
    });

    it('GET /api/health/ready should check database', async () => {
      // Note: This requires database connection
      // Skip for now as it depends on database state
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
    });
  });

  describe('Master Data Endpoints', () => {
    it('GET /api/lgas should return LGAs', async () => {
      // Note: This requires seeded test data
      const response = await request(app)
        .get('/api/lgas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/facilities should return facilities', async () => {
      const response = await request(app)
        .get('/api/facilities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/vehicles should return vehicles', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/waste-categories should return categories', async () => {
      const response = await request(app)
        .get('/api/waste-categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Load Trace Endpoint', () => {
    it('GET /api/loads/:id/trace should return load trace', async () => {
      // Note: This requires seeded test data with LD-DEMO-001
      const response = await request(app)
        .get('/api/loads/LD-DEMO-001/trace')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('load');
      expect(response.body.data).toHaveProperty('steps');
      expect(response.body.data).toHaveProperty('reconciliation');
    });

    it('should return 404 for nonexistent load', async () => {
      const response = await request(app)
        .get('/api/loads/NONEXISTENT/trace')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Dashboard Endpoints', () => {
    it('GET /api/dashboard/summary should return summary', async () => {
      // Note: This requires authentication and seeded data
      const response = await request(app)
        .get('/api/dashboard/summary')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it.skip('should return summary with valid token', async () => {
      // Requires seeded test data and authentication
    });
  });
});
