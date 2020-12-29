import { Injectable } from '@angular/core';
import { config } from '../models/config';
import { AnchorService } from './anchor.service';

@Injectable()
export class ChromeExtService {
  constructor(
    private anchorService: AnchorService
  ) {}

  load(): Promise<void> {
    return new Promise((res) => {
      window.addEventListener('punditloaded', (ev: CustomEvent) => {
        const { id } = ev.detail;
        config.set('chromeExtId', id);
        config.set('chromeExtUrl', `chrome-extension://${id}`);
        this.listenExtensionEvents();
        res();
      }, false);
    });
  }

  private listenExtensionEvents() {
    // destroy
    window.addEventListener('punditdestroy', async (ev: CustomEvent) => {
      this.anchorService.removeAll();
      // signal callback
      ev.detail();
    }, false);
  }
}
