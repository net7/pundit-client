import { Injectable } from '@angular/core';
import { from, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { PdfViewerEvents } from '../event-types';
import { PDFViewerApplication as PDFViewerApp } from '../models/anchoring/pdf/types';

const PDF_DOCUMENT_CONTAINER_ID = 'viewer';

const PDF_SCROLL_CONTAINER_ID = 'viewerContainer';

const PDF_BODY_CLASS = 'pnd-document-is-pdf';

@Injectable()
export class PdfService {
  private pdfApp: PDFViewerApp;

  private allowedEvents: PdfViewerEvents[] = [
    PdfViewerEvents.PageRendered,
    PdfViewerEvents.PageChanging
  ];

  public events$: Subject<{
    type: PdfViewerEvents;
    payload?: any;
  }> = new Subject();

  constructor() {
    this.pdfApp = (window as any).PDFViewerApplication;
    if (this.pdfApp) {
      // add body class
      document.body.classList.add(PDF_BODY_CLASS);
      // pdf app init
      from(this.pdfApp.initializedPromise).pipe(
        first(),
      ).subscribe(() => {
        this.listenPdfViewer();
        this.listenScroll();
      });
    }
  }

  isActive = () => !!this.pdfApp;

  getDocumentContainer = (): HTMLElement => document.getElementById(PDF_DOCUMENT_CONTAINER_ID);

  getScrollContainer = (): HTMLElement => document.getElementById(PDF_SCROLL_CONTAINER_ID);

  private listenPdfViewer() {
    // pdf viewer events
    this.allowedEvents.forEach((type: PdfViewerEvents) => {
      this.pdfApp.eventBus.on(type, () => {
        this.events$.next({ type });
      });
    });
  }

  private listenScroll() {
    const scrollContainer = this.getScrollContainer();
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', this.onScroll);
    }
  }

  onScroll({ target }) {
    const { shadowRoot } = document.getElementsByTagName('pnd-root')[0];
    const sidebarAnnotationsContainer = shadowRoot.querySelector('.pnd-sidebar__content') as HTMLElement;
    const { scrollTop } = target;
    sidebarAnnotationsContainer.style.marginTop = `${-scrollTop}px`;
  }

  destroy() {
    // remove pdf events
    this.allowedEvents.forEach((type: PdfViewerEvents) => {
      this.pdfApp.eventBus.off(type, (e) => {
        // do nothing
        console.log('closed event----------------------------->', e);
      });
    });

    // remove scroll event
    const scrollContainer = this.getScrollContainer();
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', this.onScroll);
    }
  }
}
