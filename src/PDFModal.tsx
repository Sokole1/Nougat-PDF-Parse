import { App, Modal, loadPdfJs } from "obsidian";
import ReactView from "./ReactView";
import { Root, createRoot } from "react-dom/client";
import * as React from "react";

interface PDFViewerProps {
	pdfUrl: string;
	setPageRange: (startPage: number, endPage: number) => void;
	onSubmit: (startPage: number, endPage: number) => void;
}

function PDFViewer({ pdfUrl, setPageRange, onSubmit }: PDFViewerProps) {
	let maxPages = 1;

	const [pdfDocument, setPdfDocument] = React.useState<null | any>(null);
	const [currentPage, setCurrentPage] = React.useState<number>(1);
	const [pageCount, setPageCount] = React.useState<number>(0);
	const [totalPages, setTotalPages] = React.useState<number>(0);

	const [startPage, setStartPage] = React.useState<number>(1);
	const [endPage, setEndPage] = React.useState<number>(1);

	React.useEffect(() => {
		async function loadPdf() {
			const pdfjs = await loadPdfJs();
			// Load the PDF document
			pdfjs
				.getDocument(pdfUrl)
				.promise.then((pdf: { numPages: number }) => {
					setPdfDocument(pdf);
					maxPages = pdf.numPages;
					setPageCount(maxPages);
					setEndPage(maxPages);
					setTotalPages(maxPages);
					setPageRange(1, maxPages);
				});
		}
		loadPdf();
	}, [pdfUrl]);

	const handlePageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(event.target.value, 10);
		setCurrentPage(value);
	};

	const handlePageBlur = () => {
		if (currentPage < 1) {
			setCurrentPage(1);
		} else if (currentPage > endPage) {
			setCurrentPage(endPage);
		}
	};

	const handlePageRangeChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const { name, value } = event.target;

		if (name === "startPage") {
			const newStartPage = parseInt(value, 10);
			setStartPage(newStartPage);
		} else if (name === "endPage") {
			const newEndPage = parseInt(value, 10);
			setEndPage(newEndPage);
		}
		setPageRange(startPage, endPage);
	};

	const handlePageRangeBlur = () => {
		if (startPage >= 1 && endPage <= pageCount && startPage <= endPage) {
			if (currentPage < startPage) {
				setCurrentPage(startPage);
			} else if (currentPage > endPage) {
				setCurrentPage(endPage);
			}
			setTotalPages(endPage - startPage + 1);
		} else {
			setStartPage(1);
			setEndPage(pageCount);
			setPageCount(pageCount);
			setCurrentPage(1);
			setTotalPages(pageCount);
		}
		setPageRange(startPage, endPage);
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

	const renderPage = async (pageNumber: number) => {
		if (pdfDocument) {
			const page = await pdfDocument.getPage(pageNumber);
			const scale = 1.5;
			const viewport = page.getViewport({ scale });
			const canvas = document.getElementById(
				"pdf-canvas"
			) as HTMLCanvasElement;
			const context = canvas.getContext("2d");
			canvas.style.width = "100%";
			canvas.style.height = "100%";
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			const renderContext = {
				canvasContext: context,
				viewport: viewport,
			};
			await page.render(renderContext);
		}
	};

	React.useEffect(() => {
		if (
			pdfDocument &&
			!Number.isNaN(currentPage) &&
			currentPage >= startPage &&
			currentPage <= endPage &&
			currentPage <= pageCount
		) {
			renderPage(currentPage);
		}
	}, [pdfDocument, currentPage, startPage, endPage, pageCount]);

	return (
		<div>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<div>
					<button onClick={handlePrevPage}>-</button>
					<label className="pdf-input-label">
						<input
							className="pdf-input"
							type="number"
							value={currentPage}
							onChange={handlePageChange}
							onBlur={handlePageBlur}
						/>
					</label>
					<button onClick={handleNextPage}>+</button>
					&nbsp; Total pages: {pageCount}
				</div>
				<div>
					<label>
						Range:
						<input
							className="pdf-input"
							type="number"
							name="startPage"
							value={startPage}
							onChange={handlePageRangeChange}
							onBlur={handlePageRangeBlur}
						/>
						-
						<input
							className="pdf-input"
							type="number"
							name="endPage"
							value={endPage}
							onChange={handlePageRangeChange}
							onBlur={handlePageRangeBlur}
						/>
						<span>&nbsp;{totalPages} Pages Selected</span>
					</label>
				</div>
			</div>
			<canvas id="pdf-canvas"></canvas>
			<div>
			<button onClick={() => onSubmit(startPage, endPage)}>Submit</button>
		</div>
		</div>
	);
}

export default class PDFModal extends Modal {
	private root: Root | null = null;
	pageRange: { startPage: number; endPage: number } = {
		startPage: 0,
		endPage: 0,
	}
	onSubmit: (startPage: number, endPage: number) => void;

	constructor(app: App, onSubmit: (startPage: number, endPage: number) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	setPageRange(startPage: number, endPage: number) {
		this.pageRange = { startPage, endPage };
	}

	onSubmitModal() {
		this.onSubmit(this.pageRange.startPage, this.pageRange.endPage);
		this.close();
	}

	async onOpen(): Promise<void> {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<PDFViewer pdfUrl={"https://arxiv.org/pdf/quant-ph/0410100.pdf"} setPageRange={this.setPageRange.bind(this)} onSubmit={this.onSubmitModal.bind(this)} />
		);
	}

	async onClose(): Promise<void> {
		if (this.root) {
			this.root.unmount();
		}
	}
}
