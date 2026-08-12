import { Router } from 'express';
import { servePDF, getPDFMetadataHandler } from '../controllers/pdfController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Serve PDF file by ID
router.get('/:pdfId', optionalAuth, servePDF);

// Get PDF metadata
router.get('/:pdfId/metadata', optionalAuth, getPDFMetadataHandler);

export default router;
