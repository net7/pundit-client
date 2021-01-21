import { Injectable } from '@angular/core';

@Injectable()
export class EmbedService {
  load(): Promise<void> {
    return new Promise((resolve) => {
      const appRoot = document.createElement('pnd-root');
      document.body.appendChild(appRoot);
      resolve();
    });
  }
}
