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
import { ReplyService } from './services/reply.service';
import { SocialService } from './services/social.service';
import { AnchorService } from './services/anchor.service';
import { AnnotationPositionService } from './services/annotation-position.service';
import { ToastService } from './services/toast.service';
import { StorageService } from './services/storage-service/storage.service';
import { StorageEmbedService } from './services/storage-service/storage-embed.service';
import { StorageChromeExtService } from './services/storage-service/storage-chrome-ext.service';
import { ChromeExtService } from './services/chrome-ext.service';
import { EmbedService } from './services/embed.service';
import { ImageDataService } from './services/image-data.service';
import { TagService } from './services/tag.service';
import { SemanticPredicateService } from './services/semantic-predicate.service';
import { PdfService } from './services/pdf.service';
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
import { SemanticSectionComponent } from './components/edit-modal/sections/semantic-section/semantic-section';
import { HighlightAnnotationSectionComponent } from './components/annotation/sections/highlight/highlight-annotation-section';
import { CommentAnnotationSectionComponent } from './components/annotation/sections/comment/comment-annotation-section';
import { SemanticAnnotationSectionComponent } from './components/annotation/sections/semantic/semantic-annotation-section';
import { TagAnnotationSectionComponent } from './components/annotation/sections/tag/tag-annotation-section';
import { SocialAnnotationSectionComponent } from './components/annotation/sections/social/social-annotation-section';
import { SocialActionBarComponent } from './components/annotation/sections/social/social-action-bar/social-action-bar';
import { ReplyComponent } from './components/annotation/sections/social/reply/reply';
import { HeaderAnnotationSectionComponent } from './components/annotation/sections/header/header-annotation-section';
import { MenuHeaderSectionComponent } from './components/annotation/sections/menu-header/menu-header-section';
import { TextEditorComponent } from './components/text-editor/text-editor';
import { TextEditorMenuComponent } from './components/text-editor/sections/text-editor-menu/text-editor-menu';
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

// providers config
const providers: any[] = [
  UserService,
  AnnotationService,
  NotebookService,
  TagService,
  ReplyService,
  SocialService,
  AnchorService,
  AnnotationPositionService,
  ToastService,
  StorageService,
  StorageEmbedService,
  EmbedService,
  ChromeExtService,
  StorageChromeExtService,
  ImageDataService,
  SemanticPredicateService,
  PdfService,
  { provide: APP_BASE_HREF, useValue: '/' },
];

if (env.chromeExt) {
  providers.push({
    provide: APP_INITIALIZER,
    useFactory: (
      chromeExtService: ChromeExtService
    ) => () => chromeExtService.load(),
    deps: [ChromeExtService],
    multi: true
  });
} else {
  providers.push({
    provide: APP_INITIALIZER,
    useFactory: (
      embedService: EmbedService
    ) => () => embedService.load(),
    deps: [EmbedService],
    multi: true
  });
}

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
    SemanticSectionComponent,
    HighlightAnnotationSectionComponent,
    CommentAnnotationSectionComponent,
    SemanticAnnotationSectionComponent,
    TagAnnotationSectionComponent,
    SocialAnnotationSectionComponent,
    SocialActionBarComponent,
    ReplyComponent,
    HeaderAnnotationSectionComponent,
    MenuHeaderSectionComponent,
    TextEditorComponent,
    TextEditorMenuComponent,
    // PIPES
    SortByPipe,
  ],
  imports: [
    BrowserModule,
    PunditLoginModule.forRoot(env.auth)
  ],
  providers,
  bootstrap: [AppComponent],
  entryComponents: [AppComponent]
})

export class AppModule {}

export default { AppModule };
