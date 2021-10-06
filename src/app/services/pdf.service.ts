import { Injectable } from '@angular/core';
import { from, fromEvent, Subject } from 'rxjs';
import { debounceTime, first } from 'rxjs/operators';
import { PdfViewerEvents } from '../event-types';
import { PDFViewerApplication as PDFViewerApp } from '../models/anchoring/pdf/types';

const PDF_DOCUMENT_CONTAINER_ID = 'viewer';

const PDF_SCROLL_CONTAINER_ID = 'viewerContainer';

const PDF_BODY_CLASS = 'pnd-document-is-pdf';

@Injectable()
export class PdfService {
  private pdfApp: PDFViewerApp;

  // PDF through proxy to work around CORS restrictions
  private documentUrl: string;

  private originalUrl: string;

  private allowedEvents: PdfViewerEvents[] = [
    PdfViewerEvents.PageRendered,
    PdfViewerEvents.PageChanging,
    PdfViewerEvents.Resize,
    PdfViewerEvents.ZoomIn,
    PdfViewerEvents.ZoomOut,
    PdfViewerEvents.ZoomReset,
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
      document.addEventListener('webviewerloaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('source');
        // FIXME: update proxy url
        this.documentUrl = `${source}`;
        this.originalUrl = source;
      });
      from(this.pdfApp.initializedPromise).pipe(
        first(),
      ).subscribe(() => {
        this.load();
        this.listenPdfViewer();
        this.listenScroll();
      });
    }
  }

  isActive = () => !!this.pdfApp;

  getDocumentContainer = (): HTMLElement => document.getElementById(PDF_DOCUMENT_CONTAINER_ID);

  getScrollContainer = (): HTMLElement => document.getElementById(PDF_SCROLL_CONTAINER_ID);

  private load() {
    (window as any).PDFViewerApplicationOptions.set('defaultUrl', '');
    this.pdfApp.open({
      url: this.documentUrl,
      originalUrl: this.originalUrl,
    });
  }

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
      fromEvent(scrollContainer, 'scroll').pipe(
        debounceTime(10) // symbolic delay
      ).subscribe(this.onScroll);
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
