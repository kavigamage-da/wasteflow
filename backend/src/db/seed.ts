import { pool } from './pool';
import { config } from '../config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Loads the synthetic demo data. Clearly labelled as DEMO — never real operational data. */
async function seed(): Promise<void> {
  const path = resolve(process.cwd(), config.seedPath);
  const sql = readFileSync(path, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Seeding synthetic demo data from ${path} ...`);
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log('Seed complete. NOTE: all seeded figures are SYNTHETIC.');
  await pool.end();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
