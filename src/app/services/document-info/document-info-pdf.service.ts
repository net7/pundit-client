/* eslint-disable @typescript-eslint/no-empty-interface */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PdfService } from '../pdf.service';
import { DocumentInfo } from './document-info.service';

export interface DocumentInfoPdf extends DocumentInfo {}

@Injectable()
export class DocumentInfoPdfService {
  private cache: DocumentInfoPdf;

  constructor(
    private pdfService: PdfService
  ) {}

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
