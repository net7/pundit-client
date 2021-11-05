import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  getDocumentCanonicalUrl,
  getDocumentFavicon,
  getDocumentHref,
  getDocumentTitle
} from 'src/app/models/annotation/html-util';
import { DocumentInfo } from './document-info.service';

export interface DocumentInfoWebpage extends DocumentInfo {
  pageFavicon: string;
}

@Injectable()
export class DocumentInfoWebpageService {
  private cache: DocumentInfoWebpage;

  get(): Observable<DocumentInfoWebpage> {
    if (!this.cache) {
      this.cache = {
        pageTitle: getDocumentTitle(),
        pageFavicon: getDocumentFavicon(),
        pageContext: getDocumentHref(),
        pageMetadata: [{
          key: 'canonical',
          value: getDocumentCanonicalUrl()
        }]
      };
    }
    return of(this.cache);
  }
}
