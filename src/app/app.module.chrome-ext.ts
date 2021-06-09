import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { translate } from '@n7-frontend/core';
import { APP_BASE_HREF } from '@angular/common';
import { environment as env } from 'src/environments/environment';
import { config } from './models/config';

import { AppComponent } from './app.component';
// MODULES
import { PunditLoginModule } from './login-module/public-api';
// SERVICES
import { UserService } from './services/user.service';
import { AnnotationService } from './services/annotation.service';
import { NotebookService } from './services/notebook.service';
import { AnchorService } from './services/anchor.service';
import { AnnotationPositionService } from './services/annotation-position.service';
import { ToastService } from './services/toast.service';
import { ChromeExtService } from './services/chrome-ext.service';
import { StorageService } from './services/storage-service/storage.service';
import { StorageEmbedService } from './services/storage-service/storage-embed.service';
import { StorageChromeExtService } from './services/storage-service/storage-chrome-ext.service';
import { ImageDataService } from './services/image-data.service';
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
import { ToastComponent } from './components/toast/toast';
import { SvgIconComponent } from './components/svg-icon/svg-icon';
// PIPES
import { SortByPipe } from './pipes/sortby.pipe';

import appConfig from './config';
import i18n from './config/i18n';
import { TagService } from './services/tag.service';

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
    ToastComponent,
    SvgIconComponent,
    // PIPES
    SortByPipe,
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
    TagService,
    AnchorService,
    AnnotationPositionService,
    ChromeExtService,
    ToastService,
    StorageService,
    StorageEmbedService,
    StorageChromeExtService,
    ImageDataService,
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
