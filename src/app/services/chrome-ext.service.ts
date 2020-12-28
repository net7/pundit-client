import { Injectable } from '@angular/core';
import { config } from '../models/config';

@Injectable()
export class ChromeExtService {
  load(): Promise<void> {
    return new Promise((res) => {
      window.addEventListener('punditloaded', (ev: CustomEvent) => {
        const { id } = ev.detail;
        config.set('chromeExtId', id);
        config.set('chromeExtUrl', `chrome-extension://${id}`);
        res();
      }, false);
    });
  }
}
