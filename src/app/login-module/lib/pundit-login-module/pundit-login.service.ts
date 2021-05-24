/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { AuthToken, LoginResponse, SourceType } from '../interfaces';
import { ModalService, AuthEventService } from '../services';
import { AuthModel } from '../../../../common/models';
import { getDateFromTimestamp } from '../helpers/date.helper';

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
    return this.transformer(AuthModel.verifyEmail(), 'verify');
  }

  sso() {
    return this.transformer(AuthModel.sso(), 'sso');
  }

  private transformer(request$: Promise<any>, source: SourceType) {
    return from(request$).pipe(
      map((resp) => this.transformFromHttpSuccess(resp, source)),
      catchError((err) => of(this.transformFromHttpError(err, source)))
    );
  }

  private transformFromHttpSuccess(response, source: SourceType) {
    if (response && response.error) {
      return { error: response.error as string, source };
    }
    return {
      token: {
        access_token: response.access_token,
        token_type: 'bearer',
        expire_date: getDateFromTimestamp(response.expires_in)
      } as AuthToken,
      user: typeof response.userinfo === 'string' ? JSON.parse(response.userinfo) : response.userinfo,
      source
    };
  }

  private transformFromHttpError(error, source: SourceType) {
    if (error instanceof HttpErrorResponse) {
      return { error: error?.error?.error, source };
    }
    return { error: 'Internal server error', source };
  }
}
