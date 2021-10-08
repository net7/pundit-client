import { takeUntil } from 'rxjs/operators';
import { AppEvent, MainLayoutEvent, PdfViewerEvents } from 'src/app/event-types';
import { LayoutHandler } from 'src/app/types';
import { MainLayoutDS } from '../main-layout.ds';
import { MainLayoutEH } from '../main-layout.eh';

export class MainLayoutPdfHandler implements LayoutHandler {
  constructor(private layoutDS: MainLayoutDS, private layoutEH: MainLayoutEH) {}

  public listen() {
    this.layoutDS.pdfService.events$.pipe(
      takeUntil(this.layoutEH.destroy$)
    ).subscribe(({ type }) => {
      switch (type) {
        case PdfViewerEvents.PageRendered:
        case PdfViewerEvents.PageChanging:
          this.layoutEH.appEvent$.next({
            type: AppEvent.PdfViewerPageChanged
          });
          break;
        case PdfViewerEvents.Resize:
        case PdfViewerEvents.ZoomIn:
        case PdfViewerEvents.ZoomOut:
        case PdfViewerEvents.ZoomReset:
          this.layoutEH.appEvent$.next({
            type: AppEvent.PdfViewerHtmlChanged
          });
          break;
        case PdfViewerEvents.TextLayerRendered:
          this.layoutEH.appEvent$.next({
            type: AppEvent.PdfViewerLoaded
          });
          break;
        default:
          break;
      }
    });

    this.layoutEH.innerEvents$.subscribe(({ type }) => {
      if (type === MainLayoutEvent.Destroy) {
        this.layoutDS.pdfService.destroy();
      }
    });
  }
}
