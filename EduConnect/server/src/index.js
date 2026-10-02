import http from 'node:http';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { initSocket } from './socket.js';
import { seedDemoData } from './utils/seed.js';

async function main() {
  const inMemory = await connectDB();
  if (inMemory) await seedDemoData();

  const app = createApp();
  const server = http.createServer(app);
  app.set('io', initSocket(server));

  server.listen(env.port, () => console.log(`[api] listening on http://localhost:${env.port}`));

  const shutdown = async () => {
    console.log('\n[api] shutting down');
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[api] failed to start', err);
  process.exit(1);
});
