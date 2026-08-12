import { Request, Response } from 'express';
import { getPDFFile, getPDFMetadata } from '../database/pdfs.js';
import { ApiResponse } from '../models/types.js';

// Serve PDF file
export function servePDF(req: Request, res: Response): void {
  try {
    const { pdfId } = req.params;

    if (!pdfId) {
      res.status(400).json({
        success: false,
        message: 'PDF ID is required',
        error: 'Missing PDF ID',
      } as ApiResponse<null>);
      return;
    }

    const pdfBuffer = getPDFFile(pdfId);
    if (!pdfBuffer) {
      res.status(404).json({
        success: false,
        message: 'PDF not found',
        error: `No PDF with ID ${pdfId}`,
      } as ApiResponse<null>);
      return;
    }

    const metadata = getPDFMetadata(pdfId);

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${metadata?.originalName || 'document.pdf'}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}

// Get PDF metadata
export function getPDFMetadataHandler(req: Request, res: Response): void {
  try {
    const { pdfId } = req.params;

    if (!pdfId) {
      res.status(400).json({
        success: false,
        message: 'PDF ID is required',
        error: 'Missing PDF ID',
      } as ApiResponse<null>);
      return;
    }

    const metadata = getPDFMetadata(pdfId);
    if (!metadata) {
      res.status(404).json({
        success: false,
        message: 'PDF not found',
        error: `No PDF with ID ${pdfId}`,
      } as ApiResponse<null>);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'PDF metadata retrieved',
      data: metadata,
    } as ApiResponse<typeof metadata>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve PDF metadata',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse<null>);
  }
}
