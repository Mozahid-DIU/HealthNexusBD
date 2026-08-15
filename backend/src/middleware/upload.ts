import multer from 'multer'
import { env } from '../config/env.ts'
import { AppError } from '../utils/AppError.ts'

/**
 * In-memory single-file upload for lab report PDFs. The buffer is streamed to
 * Cloudinary and never written to local disk. Only PDFs, capped at MAX_UPLOAD_MB.
 */
export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(AppError.badRequest('Only PDF files are allowed'))
      return
    }
    cb(null, true)
  },
}).single('file')
