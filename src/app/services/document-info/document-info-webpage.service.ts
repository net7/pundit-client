import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  getDocumentCanonicalUrl,
  getDocumentFavicon,
  getDocumentHref,
  getDocumentTitle,
  getFeedThePundUrl
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
      const feedThePundUrl = getFeedThePundUrl();
      const pageMetadata = [];
      if (canonical) {
        pageMetadata.push({
          key: 'canonical',
          value: canonical
        });
      }
      if (feedThePundUrl) {
        pageMetadata.push({
          key: 'isFeedThePund',
          value: this.cache.pageContext
        });
        if (!canonical) {
          this.cache.pageContext = feedThePundUrl;
        }
      }
      if (pageMetadata.length) {
        this.cache.pageMetadata = pageMetadata;
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
