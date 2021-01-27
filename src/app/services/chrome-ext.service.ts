import { Injectable } from '@angular/core';
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
        this.addFontStyles();
        this.listenExtensionEvents();
        this.listenAnnotationUpdates();
        res();
      }, false);
    });
  }

  private addFontStyles() {
    const chromeExtUrl = config.get('chromeExtUrl');

    // add style to document
    const style = document.createElement('style');
    style.innerHTML = `@import "${chromeExtUrl}/n7-icon/style.css";`;
    document.head.appendChild(style);
  }

  private listenExtensionEvents() {
    // destroy
    window.addEventListener('punditdestroy', async () => {
      this.anchorService.removeAll();
    }, false);
  }

  private listenAnnotationUpdates() {
    this.annotationService.totalChanged$.subscribe((number) => {
      // emit signal
      const signal = new CustomEvent('annotationsupdate', { detail: { total: number } });
      window.dispatchEvent(signal);
    });
  }
}
