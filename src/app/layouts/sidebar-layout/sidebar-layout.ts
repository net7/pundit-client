import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { ReplaySubject } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { AnnotationPositionService } from 'src/app/services/annotation-position.service';
import { AppEventData } from 'src/app/types';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NotebookService } from 'src/app/services/notebook.service';
import { UserService } from 'src/app/services/user.service';
import { AnchorService } from 'src/app/services/anchor.service';
import { ToastService } from 'src/app/services/toast.service';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { TagService } from 'src/app/services/tag.service';
import { PdfService } from 'src/app/services/pdf.service';
import { SidebarLayoutConfig as config } from './sidebar-layout.config';
import { NgClass, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { SvgIconComponent } from '../../components/svg-icon/svg-icon';
import { AnnotationComponent } from '../../components/annotation/annotation';
import { NotebookPanelComponent } from '../../components/notebook-panel/notebook-panel';

@Component({
    selector: 'sidebar-layout',
    templateUrl: './sidebar-layout.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, SvgIconComponent, NgTemplateOutlet, AnnotationComponent, NotebookPanelComponent, AsyncPipe]
})
export class SidebarLayoutComponent extends AbstractLayout implements OnInit, OnDestroy {
  private annotationPositionService = inject(AnnotationPositionService);
  private annotationService = inject(AnnotationService);
  private notebookService = inject(NotebookService);
  private anchorService = inject(AnchorService);
  private userService = inject(UserService);
  private punditLoginService = inject(PunditLoginService);
  private toastService = inject(ToastService);
  private tagService = inject(TagService);
  private pdfService = inject(PdfService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  @Input() appEvent$!: ReplaySubject<AppEventData>;

  public logo: SafeResourceUrl;

  constructor() {
    super(config);

    this.logo = 'https://static.thepund.it/assets/mocks/pundit-icon-48-light.png';
  }

  protected initPayload() {
    return {
      annotationPositionService: this.annotationPositionService,
      annotationService: this.annotationService,
      notebookService: this.notebookService,
      anchorService: this.anchorService,
      appEvent$: this.appEvent$,
      userService: this.userService,
      punditLoginService: this.punditLoginService,
      toastService: this.toastService,
      tagService: this.tagService,
      pdfService: this.pdfService,
      changeDetectorRef: this.changeDetectorRef,
    };
  }

  ngOnInit() {
    this.onInit();

    // add host click listener
    document.addEventListener('click', this.onDocumentClick);
  }

  ngOnDestroy() {
    this.onDestroy();

    // remove host click listener
    document.removeEventListener('click', this.onDocumentClick);
  }

  onDocumentClick = () => {
    this.lb.dataSource.userPopover.isOpen.next(false);
  };
}
