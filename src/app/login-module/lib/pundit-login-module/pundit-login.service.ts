/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalService, AuthEventService } from '../services';
import { AuthModel } from '../../../../common/models';
import { responseTransformer } from '../helpers/transformer.helper';
import { LoginResponse } from '@pundit/communication';

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
    return responseTransformer(AuthModel.verifyEmail(), 'verify');
  }

  sso() {
    return responseTransformer(AuthModel.sso(), 'sso');
  }
}
