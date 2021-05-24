/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse } from '../interfaces';
import { ModalService, AuthEventService } from '../services';
import { AuthModel } from '../../../../common/models';
import { transformer } from '../helpers/transformer.helper';

@Injectable({
  providedIn: 'root'
})
export class PunditLoginService {
  constructor(
    private modalService: ModalService,
    private authEventService: AuthEventService
  ) { }

  start() {
    this.modalService.open();
  }

  stop() {
    this.modalService.close();
  }

  onAuth = (): Observable<LoginResponse> => this.authEventService.get()

  logout() {
    return AuthModel.logout();
  }

  verifyEmail() {
    return transformer(AuthModel.verifyEmail(), 'verify');
  }

  sso() {
    return transformer(AuthModel.sso(), 'sso');
  }
}
