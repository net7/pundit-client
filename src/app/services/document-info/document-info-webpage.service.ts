import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  getDocumentCanonicalUrl,
  getDocumentFavicon,
  getDocumentHref,
  getDocumentTitle
} from 'src/app/models/annotation/html-util';

export type DocumentInfoWebpage = {
  title: string;
  favicon: string;
  url: string;
  canonicalUrl: string;
};

@Injectable()
export class DocumentInfoWebpageService {
  private cache: DocumentInfoWebpage;

  get(): Observable<DocumentInfoWebpage> {
    if (!this.cache) {
      this.cache = {
        title: getDocumentTitle(),
        favicon: getDocumentFavicon(),
        url: getDocumentHref(),
        canonicalUrl: getDocumentCanonicalUrl()
      };
    }
    return of(this.cache);
  }
}
