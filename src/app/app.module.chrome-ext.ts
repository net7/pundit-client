import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { PunditLoginModule } from '@pundit/login';
import { translate } from '@n7-frontend/core';
import { APP_BASE_HREF } from '@angular/common';
import { environment as env } from 'src/environments/environment';
import { config } from './models/config';

import { AppComponent } from './app.component';
// SERVICES
import { UserService } from './services/user.service';
import { AnnotationService } from './services/annotation.service';
import { NotebookService } from './services/notebook.service';
import { AnnotationPositionService } from './services/annotation-position.service';
import { AnchorService } from './services/anchor.service';
import { ChromeExtService } from './services/chrome-ext.service';
import { TokenService } from './services/token.service';
import { StorageSyncService } from './services/storage-sync.service';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout';
// COMPONENTS
import { AnnotationComponent } from './components/annotation/annotation';
import { CommentModalComponent } from './components/comment-modal/comment-modal';
import { NotebookPanelComponent } from './components/notebook-panel/notebook-panel';
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

@NgModule({
  declarations: [
    AppComponent,
    // LAYOUTS
    MainLayoutComponent,
    SidebarLayoutComponent,
    // COMPONENTS
    AnnotationComponent,
    CommentModalComponent,
    NotebookPanelComponent,
    TooltipComponent,
  ],
  imports: [
    BrowserModule,
    PunditLoginModule.forRoot(env.auth)
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    UserService,
    AnnotationService,
    NotebookService,
    AnchorService,
    AnnotationPositionService,
    ChromeExtService,
    TokenService,
    StorageSyncService,
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
