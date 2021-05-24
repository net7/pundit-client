import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpRequestOptions, LoginResponse } from '../interfaces';
import { LoginConfigurationService, ResponseTransformerService } from '../services';

@Injectable({
    providedIn: 'root'
})
export class PunditSsoService {
    constructor(
        private http: HttpClient,
        private responseTransformer: ResponseTransformerService,
        private configurationService: LoginConfigurationService) { }

    sso = (options?: HttpRequestOptions, data?: any): Observable<LoginResponse> => {
        const ssoParams = this.configurationService.getSsoParams();
        if (!ssoParams) {
            return EMPTY;
        }
        switch (ssoParams.method) {
            case 'GET':
            case 'get':
                return this.http.get(ssoParams.url, options).pipe(
                    map((resp) => this.responseTransformer.fromHttpPayload(resp, 'sso')),
                    catchError((e) => of(this.responseTransformer.fromHttpError(e))));
            case 'POST':
            case 'post':
                return this.http.post(ssoParams.url, data || null, options).pipe(
                    map((resp) => this.responseTransformer.fromHttpPayload(resp, 'sso')),
                    catchError((e) => of(this.responseTransformer.fromHttpError(e))));
            default:
                throw new Error('Invalid HTTP method');
        }
    }


}
