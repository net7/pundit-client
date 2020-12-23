import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
// import { Injector } from '@angular/core';
// import { createCustomElement } from '@angular/elements';
import { DvComponentsLibModule } from '@n7-frontend/components';
import { translate } from '@n7-frontend/core';
// import { Routes, RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { config } from './models/config';

import { AppComponent } from './app.component';
// SERVICES
import { UserService } from './services/user.service';
import { AnnotationService } from './services/annotation.service';
import { NotebookService } from './services/notebook.service';
import { AnchorService } from './services/anchor.service';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout';
// COMPONENTS
import { TooltipComponent } from './components/tooltip/tooltip';

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

// update config with extension info
window.addEventListener('punditloaded', (ev: CustomEvent) => {
  const { id } = ev.detail;
  config.set('chromeExtId', id);
  config.set('chromeExtUrl', `chrome-extension://${id}`);
}, false);

// const appRoutes: Routes = [];

@NgModule({
  declarations: [
    AppComponent,
    // LAYOUTS
    MainLayoutComponent,
    SidebarLayoutComponent,
    // COMPONENTS
    TooltipComponent
  ],
  imports: [
    BrowserModule,
    DvComponentsLibModule,
    // RouterModule.forRoot(
    //   appRoutes,
    //   { enableTracing: false }, // <-- debugging purposes only
    // ),
  ],
  providers: [
    UserService,
    AnnotationService,
    NotebookService,
    AnchorService,
    { provide: APP_BASE_HREF, useValue: '/' }
  ],
  bootstrap: [AppComponent],
  entryComponents: [AppComponent]
})

export class AppModule {
  // constructor(private injector: Injector) {
  //   const appElement = createCustomElement(AppComponent, {
  //     injector: this.injector
  //   });

  //   customElements.define('pnd-root', appElement);
  // }

  // ngDoBootstrap() {
  //   // do nothing
  // }
}

export default { AppModule };
