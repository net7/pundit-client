/* eslint-disable @typescript-eslint/camelcase */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
  EMPTY, Observable, of, Subject
} from 'rxjs';
import {
  catchError, map, take, takeUntil
} from 'rxjs/operators';
import { LoginResponse, EmailAuthParams } from '../interfaces';
import { TermsParameters } from '../interfaces/terms.interface';
import { AuthEventService } from './auth-event.service';
import { PopupService } from './popup.service';
import { ResponseTransformerService } from './response-transformer.service';

@Injectable({
  providedIn: 'root'
})
export class EmailProviderService implements OnDestroy {
    error$: Subject<object> = new Subject();

    isLoading$: Subject<boolean> = new Subject<boolean>();

    private destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(
        private http: HttpClient,
        private authEventService: AuthEventService,
        private responseTransformer: ResponseTransformerService,
        private popupService: PopupService
    ) { }

    ngOnDestroy(): void {
      this.destroy$.next(true);
      this.destroy$.complete();
    }

    login(
      params: EmailAuthParams,
      data: { email: string; password: string },
      terms: TermsParameters
    ) {
      this.isLoading$.next(true);
      this.http.post<any>(params.loginUrl, data, { withCredentials: true })
        .pipe(take(1),
          takeUntil(this.destroy$),
          map((res) => this.responseTransformer.fromHttpPayload(res)),
          catchError((err) => {
            if (this.mustAcceptTerms(err)) {
              this.openTermsPopup(terms);
              return EMPTY;
            }
            this.error$.next(err);
            return of(this.responseTransformer.fromHttpError(err, 'login'));
          })).subscribe((authResp: LoginResponse) => {
          if (authResp && !('error' in authResp)) {
            this.authEventService.set(authResp);
          }
          this.isLoading$.next(false);
        });
    }

    register(options: EmailAuthParams, data: {
        firstname: string;
        lastname: string;
        email: string;
        password: string;
        termsconditions: boolean;
        tracking: boolean;
    }) {
      this.isLoading$.next(true);
      this.http.post<any>(options.registerUrl, {
        first_name: data.firstname,
        last_name: data.lastname,
        email: data.email,
        password: data.password,
        terms: data.termsconditions,
        tracking: data.tracking
      }).pipe(take(1),
        takeUntil(this.destroy$),
        map((res) => this.responseTransformer.fromHttpPayload(res)),
        catchError((err) => {
          this.error$.next(err);
          return of(this.responseTransformer.fromHttpError(err, 'login'));
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
        map(this.responseTransformer.fromEvent),
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
