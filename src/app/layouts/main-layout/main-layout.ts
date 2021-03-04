import {
  Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener
} from '@angular/core';
import { PunditLoginService } from '@pundit/login';
import { ReplaySubject } from 'rxjs';
import { AppEvent } from 'src/app/events';
import { AbstractLayout } from 'src/app/models/abstract-layout';
import { AnchorService } from 'src/app/services/anchor.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotebookService } from 'src/app/services/notebook.service';
import { ToastService } from 'src/app/services/toast.service';
import { TokenService } from 'src/app/services/token.service';
import { UserService } from 'src/app/services/user.service';
import { LayoutEvent } from 'src/app/types';
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

  public appEvent$: ReplaySubject<LayoutEvent> = new ReplaySubject();

  constructor(
    private anchorService: AnchorService,
    private annotationService: AnnotationService,
    private changeDetectorRef: ChangeDetectorRef,
    private loginService: PunditLoginService,
    private notebookService: NotebookService,
    private punditLoginService: PunditLoginService,
    private tokenService: TokenService,
    private userService: UserService,
    public toastService: ToastService,
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
      tokenService: this.tokenService,
      userService: this.userService,
      toastService: this.toastService,
    };
  }

  ngOnInit() {
    this.onInit();
  }

  ngOnDestroy() {
    this.onDestroy();
  }
}
