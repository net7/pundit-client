import { Injectable } from '@angular/core';
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

@Injectable()
export class DocumentInfoService {
  constructor(
    protected pdfService: PdfService,
    private infoPdfService: DocumentInfoPdfService,
    private infoWebpageService: DocumentInfoWebpageService,
  ) {}

  get(): Observable<DocumentInfoPdf | DocumentInfoWebpage> {
    if (this.pdfService.isActive()) {
      return this.infoPdfService.get();
    }
    return this.infoWebpageService.get();
  }
}
