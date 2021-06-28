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
import { StorageService } from './services/storage-service/storage.service';
import { StorageEmbedService } from './services/storage-service/storage-embed.service';
import { StorageChromeExtService } from './services/storage-service/storage-chrome-ext.service';
import { EmbedService } from './services/embed.service';
import { ImageDataService } from './services/image-data.service';
import { TagService } from './services/tag.service';
// LAYOUTS
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { SidebarLayoutComponent } from './layouts/sidebar-layout/sidebar-layout';
// COMPONENTS
import { AnnotationComponent } from './components/annotation/annotation';
import { DeleteModalComponent } from './components/delete-modal/delete-modal';
import { NotebookPanelComponent } from './components/notebook-panel/notebook-panel';
import { TooltipComponent } from './components/tooltip/tooltip';
import { NotebookSelectorComponent } from './components/notebook-selector/notebook-selector';
import { ToastComponent } from './components/toast/toast';
import { SvgIconComponent } from './components/svg-icon/svg-icon';
import { EditModalComponent } from './components/edit-modal/edit-modal';
import { CommentSectionComponent } from './components/edit-modal/sections/comment-section/comment-section';
import { TagsSectionComponent } from './components/edit-modal/sections/tags-section/tags-section';
import { NotebookSectionComponent } from './components/edit-modal/sections/notebook-section/notebook-section';
// PIPES
import { SortByPipe } from './pipes/sortby.pipe';

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
    DeleteModalComponent,
    ToastComponent,
    SvgIconComponent,
    EditModalComponent,
    CommentSectionComponent,
    TagsSectionComponent,
    NotebookSectionComponent,
    // PIPES
    SortByPipe,
  ],
  imports: [
    BrowserModule,
    PunditLoginModule.forRoot(env.auth)
  ],
  providers: [
    UserService,
    AnnotationService,
    NotebookService,
    TagService,
    AnchorService,
    AnnotationPositionService,
    ToastService,
    StorageService,
    StorageEmbedService,
    EmbedService,
    StorageChromeExtService,
    ImageDataService,
    { provide: APP_BASE_HREF, useValue: '/' },
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
