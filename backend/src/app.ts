import express from 'express';
import cors from 'cors';
import { config } from './config';
import { api } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','), credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  // Simple request log — authentication events, errors and system events only.
  // Never logs passwords or tokens.
  app.use((req, _res, next) => {
    if (req.path !== '/health') {
      // eslint-disable-next-line no-console
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    }
    next();
  });

  // Root route - helpful information for users
  app.get('/', (_req, res) => {
    res.json({
      message: 'WasteFlow Backend API',
      webDashboard: 'http://localhost:5173',
      apiHealth: '/api/health',
      apiDocs: 'See /api routes for available endpoints'
    });
  });

  // API root route - helpful information about available endpoints
  app.get('/api', (_req, res) => {
    res.json({
      message: 'WasteFlow API',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/login',
        trips: '/api/trips',
        loads: '/api/loads',
        dashboard: '/api/dashboard/summary'
      },
      documentation: 'See OpenAPI spec in /api/openapi.yaml'
    });
  });

  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
