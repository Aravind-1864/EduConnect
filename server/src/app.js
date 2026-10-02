import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

// Built React app (client/dist). In production the API serves it from the same origin.
const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind Render/other proxies, so rate limiting sees real client IPs
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          frameSrc: ["'self'"],
          mediaSrc: ["'self'", 'blob:', 'https:'],
        },
      },
    })
  );
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.isProd ? 'tiny' : 'dev'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
  app.use('/api', routes);

  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }));
    // SPA fallback: any non-API GET returns index.html so client-side routes work on refresh.
    app.get(/^(?!\/(api|uploads|socket\.io)\/).*/, (_req, res) => res.sendFile(`${CLIENT_DIST}/index.html`));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
