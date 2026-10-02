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
  isProd: process.env.NODE_ENV === 'production',
  // Optional: lets tutors connect Google so Meet links are created automatically.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    // Must match an "Authorized redirect URI" in Google Cloud. Defaults to this API's own callback.
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
};

env.google.enabled = Boolean(env.google.clientId && env.google.clientSecret);

if (env.isProd) {
  const missing = ['JWT_SECRET', 'MONGO_URI'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required environment variable(s) in production: ${missing.join(', ')}`);
}
