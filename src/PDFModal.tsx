import { App, Modal, loadPdfJs } from 'obsidian';
import ReactView from './ReactView';
import { Root, createRoot } from 'react-dom/client';
import * as React from 'react';

interface PDFViewerProps {
  pdfUrl: string;
}

function PDFViewer(props: PDFViewerProps) {
  const { pdfUrl } = props;
  const [pdfDocument, setPdfDocument] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(0);

  const [startPage, setStartPage] = React.useState(1);
  const [endPage, setEndPage] = React.useState(1);

  React.useEffect(() => {
    async function loadPdf() {
      // Load a sample PDF document for demonstration
      const pdfjs = await loadPdfJs();
      // Load the PDF document
      pdfjs.getDocument(pdfUrl).promise.then((pdf) => {
        setPdfDocument(pdf);
        setPageCount(pdf.numPages);
        setEndPage(pdf.numPages);
      });
    }
    loadPdf();
  }, []);

  const handlePageChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= startPage && value <= endPage && value <= pageCount) {
      setCurrentPage(value);
    }
  };

  const handlePageRangeChange = (event) => {
    const { name, value } = event.target;

    if (value === '') {
      return;
    }

    if (name === 'startPage') {
      const newStartPage = parseInt(value, 10);
      if (!isNaN(newStartPage)) {
        setStartPage(newStartPage);
      }
    } else if (name === 'endPage') {
      const newEndPage = parseInt(value, 10);
      if (!isNaN(newEndPage)) {
        setEndPage(newEndPage);
      }
    }
  };

  const handlePageRangeBlur = () => {
    if (startPage >= 1 && endPage <= pageCount && startPage <= endPage) {
      setPageCount(endPage - startPage + 1);
      if (currentPage < startPage) {
        setCurrentPage(startPage);
      } else if (currentPage > endPage) {
        setCurrentPage(endPage);
      }
    } else {
      setStartPage(1);
      setEndPage(pageCount);
      setPageCount(pageCount);
      setCurrentPage(1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < endPage && currentPage < pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > startPage && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderPage = async (pageNumber) => {
    const page = await pdfDocument.getPage(pageNumber);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    const canvas = document.getElementById('pdf-canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext);
  };

  React.useEffect(() => {
    if (pdfDocument) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage]);

  return (
    <div>
      <canvas id="pdf-canvas"></canvas>
      <div>
        <button onClick={handlePrevPage}>Prev</button>
        <label>
          Page:
          <input type="number" value={currentPage} onChange={handlePageChange} />
          / {pageCount}
        </label>
        <button onClick={handleNextPage}>Next</button>
      </div>
      <div>
        <label>
          Page range:
          <input type="number" name="startPage" value={startPage} onChange={handlePageRangeChange} onBlur={handlePageRangeBlur} />
          -
          <input type="number" name="endPage" value={endPage} onChange={handlePageRangeChange} onBlur={handlePageRangeBlur} />
        </label>
      </div>
    </div>
  );
}


export default class PDFModal extends Modal {
  private root: Root | null = null;

  constructor(app: App) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.contentEl);
    this.root.render(<PDFViewer pdfUrl={'https://arxiv.org/pdf/quant-ph/0410100.pdf'} />);
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
    }
  }
}