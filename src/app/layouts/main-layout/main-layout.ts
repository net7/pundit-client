import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ChangeDetectionStrategy, NgZone, inject } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AppEvent } from 'src/app/event-types';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { AnchorService } from 'src/app/services/anchor.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { ReplyService } from 'src/app/services/reply.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { SemanticPredicateService } from 'src/app/services/semantic-predicate.service';
import { SocialService } from 'src/app/services/social.service';
import { TagService } from 'src/app/services/tag.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserService } from 'src/app/services/user.service';
import { PdfService } from 'src/app/services/pdf.service';
import { DocumentInfoService } from 'src/app/services/document-info/document-info.service';
import { AppEventData } from 'src/app/types';
import { MainLayoutConfig as config } from './main-layout.config';
import { SidebarLayoutComponent } from '../sidebar-layout/sidebar-layout';
import { TooltipComponent } from '../../components/tooltip/tooltip';
import { EditModalComponent } from '../../components/edit-modal/edit-modal';
import { DeleteModalComponent } from '../../components/delete-modal/delete-modal';
import { PdfErrorModalComponent } from '../../components/pdf-error-modal/pdf-error-modal';
import { NotebookShareModalComponent } from '../../components/notebook-share-modal/notebook-share-modal';
import { ToastComponent } from '../../components/toast/toast';
import { PunditLoginComponent } from '../../login-module/lib/pundit-login-module/pundit-login.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'main-layout',
    templateUrl: './main-layout.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SidebarLayoutComponent, TooltipComponent, EditModalComponent, DeleteModalComponent, PdfErrorModalComponent, NotebookShareModalComponent, ToastComponent, PunditLoginComponent, AsyncPipe]
})
export class MainLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  private anchorService = inject(AnchorService);
  private annotationService = inject(AnnotationService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private replyService = inject(ReplyService);
  private loginService = inject(PunditLoginService);
  private notebookService = inject(NotebookService);
  private punditLoginService = inject(PunditLoginService);
  toastService = inject(ToastService);
  tagService = inject(TagService);
  socialService = inject(SocialService);
  semanticPredicateService = inject(SemanticPredicateService);
  private userService = inject(UserService);
  private pdfService = inject(PdfService);
  private documentInfoService = inject(DocumentInfoService);
  private ngZone = inject(NgZone);

  @HostListener('document:keyup', ['$event'])
  onKeyUp({ key }: KeyboardEvent) {
    if (key === 'Escape') {
      this.appEvent$.next({
        type: AppEvent.KeyUpEscape
      });
    }
  }

  public appEvent$: ReplaySubject<AppEventData> = new ReplaySubject();

  constructor() {
    super(config);
  }

  protected initPayload() {
    return {
      anchorService: this.anchorService,
      annotationService: this.annotationService,
      changeDetectorRef: this.changeDetectorRef,
      replyService: this.replyService,
      appEvent$: this.appEvent$,
      loginService: this.loginService,
      notebookService: this.notebookService,
      punditLoginService: this.punditLoginService,
      userService: this.userService,
      toastService: this.toastService,
      tagService: this.tagService,
      socialService: this.socialService,
      semanticPredicateService: this.semanticPredicateService,
      pdfService: this.pdfService,
      documentInfoService: this.documentInfoService,
      ngZone: this.ngZone,
    };
  }

  ngOnInit() {
    // attach change detector to toast service
    ToastService.changeDetectorRef = this.changeDetectorRef;
    this.onInit();
  }

  ngOnDestroy() {
    this.onDestroy();
  }
}
