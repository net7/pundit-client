import { Injectable } from '@angular/core';
import { setTokenFromStorage } from '../../common/helpers';

@Injectable()
export class EmbedService {
  load(): Promise<void> {
    return new Promise((resolve) => {
      const appRoot = document.createElement('pnd-root');
      document.body.appendChild(appRoot);

      // set token from storage on init
      setTokenFromStorage();
      resolve();
    });
  }
}
