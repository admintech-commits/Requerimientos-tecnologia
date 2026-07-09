import { Router } from 'express';
import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { config } from '../../config.js';
import { requireAuth } from '../../middleware/auth.js';
import { HttpError } from '../../lib/httpError.js';

/** Carpeta de archivos junto a la base de datos (mismo volumen en Docker) */
export const UPLOADS_DIR = join(dirname(config.dbPath), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.png', '.jpg', '.jpeg', '.gif', '.txt', '.csv', '.zip',
];

function sanitize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80);
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${sanitize(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new HttpError(400, 'Tipo de archivo no permitido'));
  },
});

export const uploadsRouter = Router();

// Subir un documento: multipart/form-data con el campo "file"
uploadsRouter.post('/', requireAuth, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'No se recibió ningún archivo');
    res.status(201).json({
      url: `/api/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
});
