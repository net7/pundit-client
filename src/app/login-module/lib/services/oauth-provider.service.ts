import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { LoginResponse, OAuthProvider } from '../interfaces';
import { AuthEventService } from './auth-event.service';
import { PopupService } from './popup.service';
import { ResponseTransformerService } from './response-transformer.service';
@Injectable({
    providedIn: 'root'
})
export class OauthProviderService {
    private destroy$: Subject<boolean> = new Subject<boolean>();
    constructor(
        private authEventService: AuthEventService,
        private responseTransformer: ResponseTransformerService,
        private popupService: PopupService
    ) { }

    login(provider: OAuthProvider) {
        const url = this.createOAuthURL(provider);
        const event$ = this.popupService.open(url, provider?.popup);
        this.listenEvent(event$);
    }

    private listenEvent(event$: Observable<MessageEvent>) {
        event$.pipe(
            takeUntil(this.destroy$),
            map(this.responseTransformer.fromEvent),
            catchError((err) => {
                return of({ error: JSON.stringify(err) });
            })
        ).subscribe((authResp: LoginResponse) => {
            if (authResp) {
                this.authEventService.set(authResp);
            }
        });
    }

    private createOAuthURL(provider: OAuthProvider) {
        return `${provider.params.url}?client_id=${provider.params.clientId}&redirect_uri=${provider.params.redirect}&scope=${provider.params.scope}&response_type=code`;
    }
}
