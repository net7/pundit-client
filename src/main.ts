import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as api from './pundit-api';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'zone.js/dist/zone';

if (environment.production) {
  enableProdMode();
}

// pundit public api
api.init();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch((err) => console.error(err));
