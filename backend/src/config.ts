import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Known development secrets that should never be used in production
const DEV_SECRETS = [
  'dev-only-secret-change-me',
  'dev-only-refresh-change-me',
  'change-me-in-production',
  'change-me-too'
];

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const config = {
  env: nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? (nodeEnv === 'production' ? '' : '*'),

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL ?? '7d'
  },

  referenceCapacityMtDay: Number(process.env.REFERENCE_CAPACITY_MT_DAY ?? 40),
  enableGps: (process.env.ENABLE_GPS ?? 'false').toLowerCase() === 'true',

  schemaPath: process.env.SCHEMA_PATH ?? '../database/schema.sql',
  seedPath: process.env.SEED_PATH ?? '../database/seed.sql'
} as const;

// Security validation: reject known development secrets in production
if (config.env === 'production') {
  if (DEV_SECRETS.includes(config.jwt.secret)) {
    throw new Error('Production deployment cannot use development JWT_SECRET. Set a strong, randomly generated secret.');
  }
  if (DEV_SECRETS.includes(config.jwt.refreshSecret)) {
    throw new Error('Production deployment cannot use development JWT_REFRESH_SECRET. Set a strong, randomly generated secret.');
  }
  if (!config.corsOrigin || config.corsOrigin === '*') {
    throw new Error('Production deployment requires explicit CORS_ORIGIN. Set comma-separated allowed origins (e.g., https://dashboard.wasteflow.gov).');
  }
}

// Development warning for wildcard CORS
if (config.env === 'development' && config.corsOrigin === '*') {
  console.warn('⚠️  WARNING: Using wildcard CORS_ORIGIN in development. This is acceptable for local development but must be replaced with explicit origins for production.');
}
