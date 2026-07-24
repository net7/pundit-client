import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalService } from '../../services/modal.service';
import { NgClass } from '@angular/common';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { ErrorComponent } from '../error/error.component';
import { SignInComponent } from '../signin/signin.component';
import { SignUpComponent } from '../signup/signup.component';

@Component({
    selector: 'lib-pundit-login-modal',
    templateUrl: './modal.component.html',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, SvgIconComponent, ErrorComponent, SignInComponent, SignUpComponent]
})
export class ModalComponent implements OnDestroy {
  private modalService = inject(ModalService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  show!: boolean;

  status: modalStateType = 'SIGNIN';

  private destroyed$ = new Subject<void>();

  constructor() {
    this.status = 'SIGNIN';
    this.modalService
      .isOpen()
      .pipe(takeUntil(this.destroyed$))
      .subscribe((value) => {
        this.status = this.modalService.isRegister ? 'SIGNUP' : 'SIGNIN';
        this.show = value;
        this.changeDetectorRef.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  signin(event: Event) {
    event.preventDefault();
    this.status = 'SIGNIN';
  }

  signup(event: Event) {
    event.preventDefault();
    this.status = 'SIGNUP';
  }

  onClose(target?: { className: string }) {
    if (target && target.className !== 'mr-resource-modal__overlay') {
      return;
    }
    this.modalService.close();
  }
}

export type modalStateType = 'SIGNUP' | 'SIGNIN' | 'ERROR';
