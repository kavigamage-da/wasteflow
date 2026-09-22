import { createApp } from './app';
import { config } from './config';
import { pool } from './db/pool';

const app = createApp();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`WasteFlow backend listening on http://localhost:${config.port} (${config.env})`);
});

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}; shutting down.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
