import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Always read server/.env, whichever directory the process was started from.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jitsiDomain: process.env.JITSI_DOMAIN || 'meet.jit.si',
  isProd: process.env.NODE_ENV === 'production',
};

if (env.isProd) {
  const missing = ['JWT_SECRET', 'MONGO_URI'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required environment variable(s) in production: ${missing.join(', ')}`);
}
