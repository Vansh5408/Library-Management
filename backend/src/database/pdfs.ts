import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDFS_DIR = path.join(__dirname, '../../pdfs');
const PDF_MANIFEST = path.join(PDFS_DIR, 'manifest.json');

interface PDFMetadata {
  id: string;
  fileName: string;
  bookId: string;
  originalName: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
}

// Initialize PDF storage
export function initializePDFStorage(): void {
  if (!fs.existsSync(PDFS_DIR)) {
    fs.mkdirSync(PDFS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(PDF_MANIFEST)) {
    fs.writeFileSync(PDF_MANIFEST, JSON.stringify([], null, 2));
  }
}

// Get PDF manifest
function getPDFManifest(): PDFMetadata[] {
  try {
    const data = fs.readFileSync(PDF_MANIFEST, 'utf-8');
    return JSON.parse(data) as PDFMetadata[];
  } catch (error) {
    console.error('Error reading PDF manifest:', error);
    return [];
  }
}

// Save PDF manifest
function savePDFManifest(manifest: PDFMetadata[]): void {
  fs.writeFileSync(PDF_MANIFEST, JSON.stringify(manifest, null, 2));
}

// Upload PDF file
export function uploadPDF(
  bookId: string,
  fileBuffer: Buffer,
  originalFileName: string
): { pdfUrl: string; pdfId: string } | null {
  try {
    const pdfId = uuidv4();
    const fileName = `${pdfId}.pdf`;
    const filePath = path.join(PDFS_DIR, fileName);
    
    // Save PDF file
    fs.writeFileSync(filePath, fileBuffer);
    
    // Update manifest
    const manifest = getPDFManifest();
    manifest.push({
      id: pdfId,
      fileName,
      bookId,
      originalName: originalFileName,
      uploadedAt: new Date().toISOString(),
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
    });
    savePDFManifest(manifest);
    
    const pdfUrl = `/api/pdfs/${pdfId}`;
    return { pdfUrl, pdfId };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }
}

// Get PDF file
export function getPDFFile(pdfId: string): Buffer | null {
  try {
    const manifest = getPDFManifest();
    const pdfMeta = manifest.find(p => p.id === pdfId);
    
    if (!pdfMeta) {
      return null;
    }
    
    const filePath = path.join(PDFS_DIR, pdfMeta.fileName);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error('Error reading PDF file:', error);
    return null;
  }
}

// Get PDF metadata by ID
export function getPDFMetadata(pdfId: string): PDFMetadata | null {
  const manifest = getPDFManifest();
  return manifest.find(p => p.id === pdfId) || null;
}

// Get PDF by book ID
export function getPDFByBookId(bookId: string): PDFMetadata | null {
  const manifest = getPDFManifest();
  return manifest.find(p => p.bookId === bookId) || null;
}

// Delete PDF
export function deletePDF(pdfId: string): boolean {
  try {
    const manifest = getPDFManifest();
    const pdfMeta = manifest.find(p => p.id === pdfId);
    
    if (!pdfMeta) {
      return false;
    }
    
    const filePath = path.join(PDFS_DIR, pdfMeta.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    const newManifest = manifest.filter(p => p.id !== pdfId);
    savePDFManifest(newManifest);
    
    return true;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
}

// List all PDFs
export function listPDFs(): PDFMetadata[] {
  return getPDFManifest();
}

// Get PDF storage stats
export function getPDFStorageStats(): {
  totalPDFs: number;
  totalSize: number;
  averageSize: number;
} {
  const manifest = getPDFManifest();
  const totalSize = manifest.reduce((sum, p) => sum + p.fileSize, 0);
  const averageSize = manifest.length > 0 ? totalSize / manifest.length : 0;
  
  return {
    totalPDFs: manifest.length,
    totalSize,
    averageSize,
  };
}
