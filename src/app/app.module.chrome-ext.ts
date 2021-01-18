import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { DvComponentsLibModule } from '@n7-frontend/components';
import { translate } from '@n7-frontend/core';
import { APP_BASE_HREF } from '@angular/common';
import { config } from './models/config';

import { AppComponent } from './app.component';
// SERVICES
import { UserService } from './services/user.service';
import { AnnotationService } from './services/annotation.service';
import { NotebookService } from './services/notebook.service';
import { AnnotationPositionService } from './services/annotation-position.service';
import { AnchorService } from './services/anchor.service';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout';
// COMPONENTS
import { TooltipComponent } from './components/tooltip/tooltip';
import { NotebookPanelComponent } from './components/notebook-panel/notebook-panel';

import appConfig from './config';
import i18n from './config/i18n';
import { ChromeExtService } from './services/chrome-ext.service';

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
    SidebarLayoutComponent,
    // COMPONENTS
    TooltipComponent,
    NotebookPanelComponent,
  ],
  imports: [
    BrowserModule,
    DvComponentsLibModule,
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    UserService,
    AnnotationService,
    NotebookService,
    AnchorService,
    AnnotationPositionService,
    ChromeExtService,
    {
      provide: APP_INITIALIZER,
      useFactory: (
        chromeExtService: ChromeExtService
      ) => () => chromeExtService.load(),
      deps: [ChromeExtService],
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [AppComponent]
})

export class AppModule {}

export default { AppModule };
