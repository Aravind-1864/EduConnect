import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ApiError } from '../utils/ApiError.js';

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

const ALLOWED = /\.(pdf|docx?|pptx?|xlsx?|txt|png|jpe?g|gif|zip|mp4|mp3)$/i;

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.test(file.originalname) ? cb(null, true) : cb(ApiError.badRequest('File type not allowed')),
});

export const publicUrl = (file) => `/uploads/${file.filename}`;
