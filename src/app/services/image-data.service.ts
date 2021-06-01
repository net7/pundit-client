import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReplaySubject } from 'rxjs';
import { CommonEventType } from 'src/common/types';
import { environment as env } from '../../environments/environment';

export enum ImageDataStatus {
  Empty = 'empty',
  Pending = 'pending',
  Loaded = 'loaded',
  Error = 'error',
}

export type ImageData = {
  data: ReplaySubject<SafeUrl>;
  status: ImageDataStatus;
};

@Injectable()
export class ImageDataService {
  public images: {
    [url: string]: ImageData;
  } = {};

  constructor(
    private domSanitizer: DomSanitizer,
  ) {
    // listen to content security violation
    document.addEventListener('securitypolicyviolation', (e) => {
      if (this.isBlockedImage(e.blockedURI)) {
        this.request(e.blockedURI);
      }
    });

    // listen to image data (base64) response
    window.addEventListener(CommonEventType.ImageDataResponse, (ev: CustomEvent) => {
      const { url, data, error }: {
        url: string;
        data: string;
        error?: boolean;
      } = ev.detail;
      // update image status & data (base64 string)
      if (error) {
        this.images[url].status = ImageDataStatus.Error;
        this.images[url].data.next(null);
      } else {
        this.images[url].status = ImageDataStatus.Loaded;
        this.images[url].data.next(this.domSanitizer.bypassSecurityTrustUrl(data));
      }
    }, false);
  }

  add(url: string) {
    if (!this.images[url]) {
      this.images[url] = {
        data: new ReplaySubject(),
        status: ImageDataStatus.Empty
      };

      // skip for embed
      if (!env.chromeExt) {
        this.images[url].status = ImageDataStatus.Loaded;
        this.images[url].data.next(null);
      }
    }
  }

  request(url: string) {
    if (this.images[url]?.status === ImageDataStatus.Empty) {
      // update image data status
      this.images[url].status = ImageDataStatus.Pending;
      // emit signal to chrome-ext
      const signal = new CustomEvent(CommonEventType.ImageDataRequest, {
        detail: { url }
      });
      window.dispatchEvent(signal);
    }
  }

  isBlockedImage(uri: string) {
    return !!this.images[uri];
  }
}
