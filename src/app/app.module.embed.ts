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
import { EmbedService } from './services/embed.service';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout';
// COMPONENTS
import { TooltipComponent } from './components/tooltip/tooltip';
import { NotebookPanelComponent } from './components/notebook-panel/notebook-panel';
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
    NotebookPanelComponent,
    CommentModalComponent
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
    EmbedService,
    {
      provide: APP_INITIALIZER,
      useFactory: (
        embedService: EmbedService
      ) => () => embedService.load(),
      deps: [EmbedService],
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [AppComponent]
})

export class AppModule {}

export default { AppModule };