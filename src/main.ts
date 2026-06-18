import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import * as api from './pundit-api';


import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

if (environment.production) {
  enableProdMode();
}

// pundit public api
api.init();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
