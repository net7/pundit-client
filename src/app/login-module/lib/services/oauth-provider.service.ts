import { Injectable } from '@angular/core';
import { LoginResponse } from '@pundit/communication';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { fromEvent } from '../helpers/transformer.helper';
import { OAuthProvider } from '../interfaces';
import { AuthEventService } from './auth-event.service';
import { PopupService } from './popup.service';

@Injectable({
  providedIn: 'root'
})
export class OauthProviderService {
    private destroy$: Subject<boolean> = new Subject<boolean>();

    private selectedProvider: OAuthProvider = null;

    constructor(
        private authEventService: AuthEventService,
        private popupService: PopupService
    ) { }

    login(provider: OAuthProvider) {
      const url = this.createOAuthURL(provider);
      const event$ = this.popupService.open(url, provider?.popup);

      // save selected provider (for analytics)
      this.selectedProvider = provider;
      this.listenEvent(event$);
    }

    private listenEvent(event$: Observable<MessageEvent>) {
      event$.pipe(
        takeUntil(this.destroy$),
        map(fromEvent),
        catchError((err) => of({ error: JSON.stringify(err) }))
      ).subscribe((authResp: LoginResponse) => {
        if ('user' in authResp) {
          this.authEventService.set(authResp);

          // analytics
          let action;
          if (this.selectedProvider.id === 'google') {
            action = AnalyticsAction.RegisterWithGoogleClicked;
          } else if (this.selectedProvider.id === 'facebook') {
            action = AnalyticsAction.RegisterWithFacebookClicked;
          } else if (this.selectedProvider.id === 'egi') {
            action = AnalyticsAction.RegisterWithEgiClicked;
          }
          AnalyticsModel.userId = authResp.user.id;
          AnalyticsModel.track({ action });
        }
      });
    }

    private createOAuthURL(provider: OAuthProvider) {
      return `${provider.params.url}?client_id=${provider.params.clientId}&redirect_uri=${provider.params.redirect}&scope=${provider.params.scope}&response_type=code`;
    }
}
