import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { hookManager } from 'src/app/models/hook-manager';
import { PunditApiHook } from 'src/common/types';
import { PdfService } from '../pdf.service';
import { DocumentInfoPdf, DocumentInfoPdfService } from './document-info-pdf.service';
import { DocumentInfoWebpage, DocumentInfoWebpageService } from './document-info-webpage.service';

export interface DocumentInfo {
  pageTitle: string;
  pageContext: string;
  pageMetadata?: {
    key: string;
    value: string;
  }[];
}

@Injectable()
export class DocumentInfoService {
  constructor(
    protected pdfService: PdfService,
    private infoPdfService: DocumentInfoPdfService,
    private infoWebpageService: DocumentInfoWebpageService,
  ) {}

  get(): Observable<DocumentInfoPdf | DocumentInfoWebpage> {
    let info$: Observable<DocumentInfoPdf | DocumentInfoWebpage> = this.infoWebpageService.get();
    if (this.pdfService.isActive()) {
      info$ = this.infoPdfService.get();
    }
    return info$.pipe(
      switchMap((info) => {
        const context = { info };
        hookManager.trigger(PunditApiHook.DocumentInfoGet, context, () => null);
        return of(context.info);
      })
    );
  }
}
