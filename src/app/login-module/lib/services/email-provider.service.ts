/* eslint-disable @typescript-eslint/camelcase */
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { LoginResponse, UserLoginRequestParams, UserSignupRequestParams } from '@pundit/communication';
import {
  EMPTY, from, Observable, of, Subject
} from 'rxjs';
import {
  catchError, map, take, takeUntil
} from 'rxjs/operators';
import { AuthModel } from 'src/common/models';
import { fromEvent, transformFromHttpError, transformFromHttpSuccess } from '../helpers/transformer.helper';
import { TermsParameters } from '../interfaces/terms.interface';
import { AuthEventService } from './auth-event.service';
import { PopupService } from './popup.service';

@Injectable({
  providedIn: 'root'
})
export class EmailProviderService implements OnDestroy {
  error$: Subject<object> = new Subject();

  isLoading$: Subject<boolean> = new Subject<boolean>();

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private authEventService: AuthEventService,
    private popupService: PopupService
  ) { }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  login(
    data: UserLoginRequestParams,
    terms: TermsParameters
  ) {
    this.isLoading$.next(true);
    // this.http.post<any>(params.loginUrl, data, { withCredentials: true })
    from(AuthModel.login(data))
      .pipe(take(1),
        takeUntil(this.destroy$),
        map((res) => transformFromHttpSuccess(res.data, 'login')),
        catchError((err) => {
          if (this.mustAcceptTerms(err)) {
            this.openTermsPopup(terms);
            return EMPTY;
          }
          this.error$.next(err);
          return of(transformFromHttpError(err, 'login'));
        })).subscribe((authResp: LoginResponse) => {
          if (authResp && !('error' in authResp)) {
            this.authEventService.set(authResp);
          }
          this.isLoading$.next(false);
        });
  }

  register(data: UserSignupRequestParams) {
    this.isLoading$.next(true);
    // this.http.post<any>(options.registerUrl, {
    //   first_name: data.firstname,
    //   last_name: data.lastname,
    //   email: data.email,
    //   password: data.password,
    //   terms: data.termsconditions,
    //   tracking: data.tracking
    // })
    from(AuthModel.signup(data))
      .pipe(take(1),
        takeUntil(this.destroy$),
        map((res) => transformFromHttpSuccess(res.data, 'login')),
        catchError((err) => {
          this.error$.next(err);
          return of(transformFromHttpError(err, 'login'));
        })).subscribe((authResp: LoginResponse) => {
          if (authResp && !('error' in authResp)) {
            this.authEventService.set(authResp);
          }
          this.isLoading$.next(false);
        });
  }

  private openTermsPopup = (params: TermsParameters) => {
    const event$ = this.popupService.open(params.url, params.popup, 'pundit-terms');
    this.listenEvent(event$);
  }

  private listenEvent(event$: Observable<MessageEvent>) {
    event$.pipe(
      takeUntil(this.destroy$),
      map(fromEvent),
      catchError((err) => of({ error: JSON.stringify(err), source: 'login' }))
    ).subscribe((authResp: LoginResponse) => {
      if (authResp) {
        this.authEventService.set(authResp);
      }
    });
  }

  private mustAcceptTerms(err: HttpErrorResponse) {
    return err instanceof HttpErrorResponse && err.status === 422 && err?.error?.error === 'must_accept_terms';
  }
}
