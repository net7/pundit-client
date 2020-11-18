import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DvComponentsLibModule } from '@n7-frontend/components';
import { translate } from '@n7-frontend/core';
import { config } from './models/config';

import { AppComponent } from './app.component';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
// COMPONENTS

import appConfig from './config';
import i18n from './config/i18n';

const LANG_CODE = 'en_US';

// load translations
translate.init({
  defaultLang: LANG_CODE,
  translations: i18n
});

// load configuration
config.init(appConfig);

@NgModule({
  declarations: [
    AppComponent,
    // LAYOUTS
    MainLayoutComponent,
    // COMPONENTS
  ],
  imports: [
    BrowserModule,
    DvComponentsLibModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
