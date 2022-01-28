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
        pageFavicon: this.getFaviconURL(),
        pageContext: getDocumentHref()
      };
      const canonical = getDocumentCanonicalUrl();
      if (canonical) {
        this.cache.pageMetadata = [{
          key: 'canonical',
          value: canonical
        }];
      }
    }
    return of(this.cache);
  }

  private getFaviconURL() {
    const faviconPath = getDocumentFavicon();
    const pageContextPath = getDocumentHref();
    const { origin, protocol } = new URL(pageContextPath);
    if (faviconPath?.startsWith('//')) {
      return `${protocol}${faviconPath}`;
    }
    try {
      const faviconURL = new URL(faviconPath, origin);
      return faviconURL.toJSON();
    } catch (error) {
      console.warn(error);
    }
    return faviconPath;
  }
}
