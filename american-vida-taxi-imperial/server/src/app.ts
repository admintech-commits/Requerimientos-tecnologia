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

  // Descarga de adjuntos: fuerza Content-Disposition para que el navegador
  // descargue el archivo en lugar de intentar renderizarlo inline.
  app.use(
    '/api/uploads',
    express.static(UPLOADS_DIR, {
      setHeaders(res, filePath) {
        const filename = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  // Fallback explícito para /api/uploads: si express.static no encontró el archivo
  // responde 404 en lugar de caer en el catch-all del SPA (que devolvería index.html).
  app.get('/api/uploads/:filename', (_req, res) => {
    res.status(404).json({ message: 'Archivo no encontrado' });
  });

  app.use(errorHandler);

  // Servir frontend estático en producción
  // El build de Vite queda en /app/public dentro del contenedor
  if (process.env.NODE_ENV === 'production') {
    const publicDir = path.join(__dirname, '..', 'public');
    app.use(express.static(publicDir));
    // Catch-all del SPA: solo aplica a rutas que NO sean /api/
    // Evita que descargas fallidas devuelvan index.html (archivo "dañado")
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  return app;
}
