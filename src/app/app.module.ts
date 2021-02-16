import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { translate } from '@n7-frontend/core';
import { APP_BASE_HREF } from '@angular/common';
import { PunditLoginModule } from '@pundit/login';
import { environment as env } from 'src/environments/environment';
import { config } from './models/config';

import { AppComponent } from './app.component';
// SERVICES
import { UserService } from './services/user.service';
import { AnnotationService } from './services/annotation.service';
import { NotebookService } from './services/notebook.service';
import { AnchorService } from './services/anchor.service';
import { AnnotationPositionService } from './services/annotation-position.service';
import { StorageSyncService } from './services/storage-sync.service';
import { TokenService } from './services/token.service';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout';
// COMPONENTS
import { AnnotationComponent } from './components/annotation/annotation';
import { CommentModalComponent } from './components/comment-modal/comment-modal';
import { DeleteModalComponent } from './components/delete-modal/delete-modal';
import { NotebookPanelComponent } from './components/notebook-panel/notebook-panel';
import { TooltipComponent } from './components/tooltip/tooltip';
import { NotebookSelectorComponent } from './components/notebook-selector/notebook-selector';

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
    TooltipComponent,
    NotebookPanelComponent,
    NotebookSelectorComponent,
    CommentModalComponent,
    DeleteModalComponent,
  ],
  imports: [
    BrowserModule,
    PunditLoginModule,
    PunditLoginModule.forRoot(env.auth)
  ],
  providers: [
    UserService,
    AnnotationService,
    NotebookService,
    AnchorService,
    AnnotationPositionService,
    StorageSyncService,
    TokenService,
    { provide: APP_BASE_HREF, useValue: '/' }
  ],
  bootstrap: [AppComponent],
  entryComponents: [AppComponent]
})

export class AppModule {}

export default { AppModule };
