import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

let memoryServer;

/**
 * Connects to MongoDB. When no MONGO_URI is configured, an in-memory
 * instance is started so the app runs out of the box for local development.
 * Returns true when the in-memory database was used (caller may seed it).
 */
export async function connectDB() {
  let uri = env.mongoUri;
  let inMemory = false;

  if (!uri) {
    // Cache the mongod binary inside server/ regardless of the directory the process is started from.
    process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL('../../node_modules/.cache/mongodb-memory-server', import.meta.url));
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('educonnect');
    inMemory = true;
    console.log('[db] MONGO_URI not set - using in-memory MongoDB (data resets on restart)');
  }

  await mongoose.connect(uri);
  console.log('[db] connected');
  return inMemory;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
