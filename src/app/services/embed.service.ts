import { Injectable } from '@angular/core';
import { initCommunicationSettings } from '../../common/helpers';

@Injectable()
export class EmbedService {
  load(): Promise<void> {
    return new Promise((resolve) => {
      // add pundit element
      if (!document.querySelector('pnd-root')) {
        const appRoot = document.createElement('pnd-root');
        document.body.appendChild(appRoot);
      }
      // init communication settings
      initCommunicationSettings();
      // api onload hook
      (window as any).Pundit_API.onLoad();
      resolve();
    });
  }
}
