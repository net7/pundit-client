import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'lib-pundit-login-modal',
  templateUrl: './modal.component.html',
  styleUrls: []
})
export class ModalComponent implements OnDestroy {
  show: boolean;

  status: modalStateType = 'SIGNIN';

  private destroyed$ = new Subject();

  constructor(private modalService: ModalService) {
    this.status = 'SIGNIN';
    this.modalService.isOpen().pipe(
      takeUntil(this.destroyed$)
    ).subscribe((value) => {
      this.show = value;
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
