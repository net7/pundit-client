import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DvComponentsLibModule } from '@n7-frontend/components';
import { translate } from '@n7-frontend/core';
import { APP_BASE_HREF } from '@angular/common';
import { config } from './models/config';

import { AppComponent } from './app.component';
// SERVICES
import { UserService } from './services/user.service';
import { AnnotationService } from './services/annotation.service';
import { NotebookService } from './services/notebook.service';
import { AnchorService } from './services/anchor.service';
import { AnnotationPositionService } from './services/annotation-position.service';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout';
// COMPONENTS
import { TooltipComponent } from './components/tooltip/tooltip';
import { CommentModalComponent } from './components/comment-modal/comment-modal';

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
    TooltipComponent,
    CommentModalComponent
  ],
  imports: [
    BrowserModule,
    DvComponentsLibModule
  ],
  providers: [
    UserService,
    AnnotationService,
    NotebookService,
    AnchorService,
    AnnotationPositionService,
    { provide: APP_BASE_HREF, useValue: '/' }
  ],
  bootstrap: [AppComponent],
  entryComponents: [AppComponent]
})

export class AppModule {}

export default { AppModule };
