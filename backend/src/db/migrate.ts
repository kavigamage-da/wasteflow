import { pool } from './pool';
import { config } from '../config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Applies the PostgreSQL schema. Idempotent enough for a prototype: it executes the
 * schema file, which uses IF NOT EXISTS where appropriate. For repeatable dev resets,
 * drop and recreate the database first.
 */
async function migrate(): Promise<void> {
  const path = resolve(process.cwd(), config.schemaPath);
  const sql = readFileSync(path, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Applying schema from ${path} ...`);
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log('Schema applied.');
  await pool.end();
}

migrate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
