import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PdfService } from '../pdf.service';

export type DocumentInfoPdf = {
  title: string;
  url: string;
  fingerprint: string;
};

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
        switchMap((title: string) => {
          this.cache = {
            title,
            url: this.pdfService.getOriginalUrl(),
            fingerprint: this.pdfService.getFingerprint(),
          };
          return of(this.cache);
        })
      );
    }
    return of(this.cache);
  }
}
