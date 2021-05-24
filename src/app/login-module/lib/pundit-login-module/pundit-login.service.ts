import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse } from '../interfaces';
import { ModalService, AuthEventService } from '../services';
@Injectable({
  providedIn: 'root'
})
export class PunditLoginService {
  constructor(
    private modalService: ModalService,
    private authEventService: AuthEventService) { }
  start() {
    this.modalService.open();
  }
  stop() {
    this.modalService.close();
  }
  onAuth = (): Observable<LoginResponse> => {
    return this.authEventService.get();
  }
}
