import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { LoginResponse, UserLoginRequestParams, UserSignupRequestParams } from 'src/communication';
import {
  EMPTY, from, Observable, of, Subject
} from 'rxjs';
import {
  catchError, map, take, takeUntil, tap
} from 'rxjs/operators';
import { AnalyticsAction } from 'src/common/types';
import { AnalyticsModel, AuthModel } from '../../../../common/models';
import { mustVerifyEmail, toResendOutcome } from '../helpers/auth-error.helper';
import { fromEvent, transformFromHttpError, transformFromHttpSuccess } from '../helpers/transformer.helper';
import { TermsParameters } from '../interfaces/terms.interface';
import { ResendOutcome } from '../interfaces/verify-email.interface';
import { AuthEventService } from './auth-event.service';
import { LoginConfigurationService } from './configuration.service';
import { PopupService } from './popup.service';

@Injectable({
  providedIn: 'root'
})
export class EmailProviderService implements OnDestroy {
  private authEventService = inject(AuthEventService);
  private popupService = inject(PopupService);
  private configService = inject(LoginConfigurationService);

  error$: Subject<object> = new Subject();

  isLoading$: Subject<boolean> = new Subject<boolean>();

  /** The server asks to confirm the email address before the account can sign in. */
  mustVerifyEmail$: Subject<void> = new Subject<void>();

  private destroy$: Subject<boolean> = new Subject<boolean>();

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  login(
    data: UserLoginRequestParams,
    terms: TermsParameters | undefined
  ) {
    this.isLoading$.next(true);
    from(AuthModel.login(data))
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        map((res) => transformFromHttpSuccess(res.data, 'login')),
        catchError((err) => {
          if (this.mustAcceptTerms(err)) {
            this.openTermsPopup(terms!);
            return EMPTY;
          }
          if (mustVerifyEmail(err)) {
            this.onMustVerifyEmail();
            return EMPTY;
          }
          this.error$.next(err?.response);
          return of(transformFromHttpError(err, 'login'));
        })
      ).subscribe((authResp: LoginResponse) => {
        if (authResp && !('error' in authResp)) {
          this.authEventService.set(authResp);

          // analytics
          AnalyticsModel.userId = authResp.user.id;
          AnalyticsModel.track({
            action: AnalyticsAction.LoginEmailCompleted
          });
        }
        this.isLoading$.next(false);
      });
  }

  register(data: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    termsconditions: boolean;
    tracking: boolean;
  }) {
    const request: UserSignupRequestParams = {
      first_name: data.firstname,
      last_name: data.lastname,
      email: data.email,
      password: data.password,
      terms: data.termsconditions,
      tracking: data.tracking
    };
    this.isLoading$.next(true);
    from(AuthModel.signup(request))
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        map((res) => transformFromHttpSuccess(res.data, 'login')),
        catchError((err) => {
          // registration accepted: the account is created from the emailed link
          if (mustVerifyEmail(err)) {
            this.onMustVerifyEmail();
            return EMPTY;
          }
          this.error$.next(err?.response);
          return of(transformFromHttpError(err, 'login'));
        })
      ).subscribe((authResp: LoginResponse) => {
        if (authResp && !('error' in authResp)) {
          this.authEventService.set(authResp);

          // analytics
          AnalyticsModel.userId = authResp.user.id;
          AnalyticsModel.track({
            action: AnalyticsAction.RegisterEmailCompleted
          });
        }
        this.isLoading$.next(false);
      });
  }

  /**
   * Asks for a new email confirmation link. The credentials are only used for this
   * request and, when the address is already confirmed, for the login that follows.
   */
  resendVerificationMail(credentials: UserLoginRequestParams): Observable<ResendOutcome> {
    return from(AuthModel.resendVerificationMail(credentials)).pipe(
      take(1),
      takeUntil(this.destroy$),
      map((): ResendOutcome => ({ kind: 'sent' })),
      catchError((err) => of(toResendOutcome(err))),
      tap((outcome) => {
        if (outcome.kind === 'already_verified') {
          this.login(credentials, this.configService.getTermsParams());
        }
      })
    );
  }

  /**
   * Closes the web session that a sign-up or sign-in with an unconfirmed email
   * leaves open on the auth server. Completes when the request settles.
   */
  signOut(): Observable<void> {
    return from(AuthModel.logout()).pipe(
      take(1),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  private onMustVerifyEmail() {
    this.mustVerifyEmail$.next();
    this.isLoading$.next(false);
  }

  private mustAcceptTerms(err: HttpErrorResponse) {
    return err instanceof HttpErrorResponse && err.status === 422 && err?.error?.error === 'must_accept_terms';
  }

  private openTermsPopup = (params: TermsParameters) => {
    const event$ = this.popupService.open(params.url, params.popup, 'pundit-terms');
    this.listenEvent(event$);
  };

  private listenEvent(event$: Observable<MessageEvent>) {
    event$.pipe(
      takeUntil(this.destroy$),
      map(fromEvent),
      catchError((err) => of({ error: JSON.stringify(err), source: 'login' }))
    ).subscribe((authResp: any) => {
      if (authResp) {
        this.authEventService.set(authResp);
      }
    });
  }
}
