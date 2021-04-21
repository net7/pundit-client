import { Injectable } from '@angular/core';
import { delay } from 'rxjs/operators';
import { SIDEBAR_EXPANDED_CLASS } from '../layouts/main-layout/handlers';
import { config } from '../models/config';
import { AnchorService } from './anchor.service';
import { AnnotationService } from './annotation.service';

@Injectable()
export class ChromeExtService {
  constructor(
    private anchorService: AnchorService,
    private annotationService: AnnotationService
  ) {}

  load(): Promise<void> {
    return new Promise((res) => {
      window.addEventListener('punditloaded', (ev: CustomEvent) => {
        const { id } = ev.detail;
        config.set('chromeExtId', id);
        config.set('chromeExtUrl', `chrome-extension://${id}`);
        this.listenExtensionEvents();
        this.listenAnnotationUpdates();
        res();
      }, false);
    });
  }

  private listenExtensionEvents() {
    // destroy
    window.addEventListener('punditdestroy', async () => {
      // remove all anchors
      this.anchorService.removeAll();
      // remove sidebar expanded class
      document.body.classList.remove(SIDEBAR_EXPANDED_CLASS);
    }, false);
  }

  private listenAnnotationUpdates() {
    this.annotationService.totalChanged$.pipe(
      delay(1) // symbolic delay waiting for extension load
    ).subscribe((number) => {
      // emit signal
      const signal = new CustomEvent('annotationsupdate', { detail: { total: number } });
      window.dispatchEvent(signal);
    });
  }
}
