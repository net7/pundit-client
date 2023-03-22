import {
  Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener
} from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AppEvent } from 'src/app/event-types';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { AnchorService } from 'src/app/services/anchor.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnnotationPositionService } from 'src/app/services/annotation-position.service';
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

@Component({
  selector: 'main-layout',
  templateUrl: './main-layout.html'
})
export class MainLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  @HostListener('document:keyup', ['$event'])
  onKeyUp({ key }: KeyboardEvent) {
    if (key === 'Escape') {
      this.appEvent$.next({
        type: AppEvent.KeyUpEscape
      });
    }
  }

  public appEvent$: ReplaySubject<AppEventData> = new ReplaySubject();

  constructor(
    private anchorService: AnchorService,
    private annotationService: AnnotationService,
    private annotationPositionService: AnnotationPositionService,
    private changeDetectorRef: ChangeDetectorRef,
    private replyService: ReplyService,
    private loginService: PunditLoginService,
    private notebookService: NotebookService,
    private punditLoginService: PunditLoginService,
    public toastService: ToastService,
    public tagService: TagService,
    public socialService: SocialService,
    public semanticPredicateService: SemanticPredicateService,
    private userService: UserService,
    private pdfService: PdfService,
    private documentInfoService: DocumentInfoService,
  ) {
    super(config);
  }

  protected initPayload() {
    return {
      anchorService: this.anchorService,
      annotationService: this.annotationService,
      annotationPositionService: this.annotationPositionService,
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
