/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { LoginResponse } from '@pundit/communication';
import { catchError, map } from 'rxjs/operators';
import { ModalService, AuthEventService } from '../services';
import { AuthModel } from '../../../../common/models';
import { responseTransformer, transformFromHttpError } from '../helpers/transformer.helper';

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
    return from(AuthModel.verifyEmail()).pipe(
      map((resp) => resp.data),
      catchError((err) => of(transformFromHttpError(err, 'verify')))
    );
  }

  sso() {
    return responseTransformer(AuthModel.sso(), 'sso');
  }
}
