import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { requirementsRouter } from './modules/requirements/requirements.routes.js';
import { uploadsRouter, UPLOADS_DIR } from './modules/uploads/uploads.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/requirements', requirementsRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/uploads', express.static(UPLOADS_DIR)); // descarga de adjuntos

  app.use(errorHandler);

  // Servir frontend estático en producción
  // El build de Vite queda en /app/public dentro del contenedor
  if (process.env.NODE_ENV === 'production') {
    const publicDir = path.join(__dirname, '..', 'public');
    app.use(express.static(publicDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  return app;
}
