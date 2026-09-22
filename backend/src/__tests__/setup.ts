// Test setup file for Jest
// This file runs before all tests

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://wasteflow:wasteflow@localhost:5432/wasteflow_test';
process.env.JWT_SECRET = 'test-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
process.env.CORS_ORIGIN = 'http://localhost:5173';
