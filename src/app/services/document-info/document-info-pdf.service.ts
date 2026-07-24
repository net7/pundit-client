/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PdfService } from '../pdf.service';
import { DocumentInfo } from './document-info.service';

export interface DocumentInfoPdf extends DocumentInfo {}

@Injectable({
  providedIn: 'root'
})
export class DocumentInfoPdfService {
  private pdfService = inject(PdfService);

  private cache!: DocumentInfoPdf;

  get(): Observable<DocumentInfoPdf> {
    if (!this.cache) {
      return this.pdfService.loaded$.pipe(
        switchMap(() => this.pdfService.getTitle$()),
        switchMap((pageTitle: string) => {
          this.cache = {
            pageTitle,
            pageContext: this.pdfService.getOriginalUrl(),
            pageMetadata: [{
              key: 'fingerprint',
              value: this.pdfService.getFingerprint()
            }]
          };
          return of(this.cache);
        })
      );
    }
    return of(this.cache);
  }
}
