import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class DocumentInfoService {
  protected pdfService = inject(PdfService);
  private infoPdfService = inject(DocumentInfoPdfService);
  private infoWebpageService = inject(DocumentInfoWebpageService);


  get(): Observable<DocumentInfoPdf | DocumentInfoWebpage> {
    if (this.pdfService.isActive()) {
      return this.infoPdfService.get();
    }
    return this.infoWebpageService.get();
  }
}
