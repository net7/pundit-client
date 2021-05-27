import {
  Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener
} from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AppEvent } from 'src/app/event-types';
import { PunditLoginService } from 'src/app/login-module/public-api';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { AnchorService } from 'src/app/services/anchor.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { StorageService } from 'src/app/services/storage-service/storage.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserService } from 'src/app/services/user.service';
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
    private changeDetectorRef: ChangeDetectorRef,
    private loginService: PunditLoginService,
    private notebookService: NotebookService,
    private punditLoginService: PunditLoginService,
    private userService: UserService,
    private storageService: StorageService,
    public toastService: ToastService
  ) {
    super(config);
  }

  protected initPayload() {
    return {
      anchorService: this.anchorService,
      annotationService: this.annotationService,
      changeDetectorRef: this.changeDetectorRef,
      appEvent$: this.appEvent$,
      loginService: this.loginService,
      notebookService: this.notebookService,
      punditLoginService: this.punditLoginService,
      userService: this.userService,
      storageService: this.storageService,
      toastService: this.toastService,
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
