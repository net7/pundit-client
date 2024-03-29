import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalObserver$ = new BehaviorSubject<boolean>(false);

  public isRegister: boolean;

  open(isRegister = false) {
    this.isRegister = isRegister;
    this.modalObserver$.next(true);
  }

  close() {
    this.modalObserver$.next(false);
  }

  isOpen = (): Observable<boolean> => this.modalObserver$.asObservable();
}
