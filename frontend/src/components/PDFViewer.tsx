import React, { useState, useEffect } from 'react';
import '../styles/PDFViewer.css';

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
  onClose?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, title = 'PDF Viewer', onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);

  const handleScaleUp = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleScaleDown = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrintPDF = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.print();
    }
  };

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    setLoading(true);
  }, [pdfUrl]);

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-viewer-header">
        <div className="pdf-title">
          <h2>{title}</h2>
        </div>
        <div className="pdf-controls">
          <button
            className="pdf-btn pdf-btn-zoom"
            onClick={handleScaleDown}
            title="Zoom Out"
          >
            🔍-
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button
            className="pdf-btn pdf-btn-zoom"
            onClick={handleScaleUp}
            title="Zoom In"
          >
            🔍+
          </button>
          <button
            className="pdf-btn"
            onClick={handleDownloadPDF}
            title="Download PDF"
          >
            ⬇️ Download
          </button>
          <button
            className="pdf-btn"
            onClick={handlePrintPDF}
            title="Print PDF"
          >
            🖨️ Print
          </button>
          {onClose && (
            <button
              className="pdf-btn pdf-btn-close"
              onClick={onClose}
              title="Close Viewer"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      <div className="pdf-viewer-body">
        <iframe
          src={`${pdfUrl}#page=${currentPage}&zoom=${Math.round(scale * 100)}`}
          className="pdf-iframe"
          onLoad={() => setLoading(false)}
          title="PDF Viewer"
        ></iframe>
        {loading && <div className="pdf-loading">Loading PDF...</div>}
      </div>

      <div className="pdf-viewer-footer">
        <button
          className="pdf-nav-btn"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          ← Previous
        </button>
        <div className="pdf-page-info">
          <label htmlFor="page-number" className="visually-hidden">Page Number</label>
          <input
            id="page-number"
            type="number"
            value={currentPage}
            onChange={(e) => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))}
            className="page-input"
            min="1"
            title="Current page number"
            aria-label="Current page number"
          />
          <span className="page-separator">/</span>
          <span className="total-pages">{totalPages || '...'}</span>
        </div>
        <button
          className="pdf-nav-btn"
          onClick={handleNextPage}
          disabled={totalPages > 0 && currentPage === totalPages}
          title="Next Page"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;
