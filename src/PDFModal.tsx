import { App, Modal } from 'obsidian';
import ReactView from './ReactView';
import { Root, createRoot } from 'react-dom/client';
import * as React from 'react';

export default class PDFModal extends Modal {
	private root: Root | null = null;

	constructor(app: App) {
		super(app);
	}

	async onOpen(): Promise<void> {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<React.StrictMode>
				<ReactView />
			</React.StrictMode>
		);
	}

	async onClose(): Promise<void> {
		if (this.root) {
		  this.root.unmount();
		}
	}
}