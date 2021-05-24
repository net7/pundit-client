import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpRequestOptions, LoginResponse } from '../interfaces';
import { LoginConfigurationService } from '../services/configuration.service';
import { ResponseTransformerService } from '../services/response-transformer.service';

@Injectable({
    providedIn: 'root'
})
export class PunditRefreshTokenService {

    constructor(
        private http: HttpClient,
        private responseTransformer: ResponseTransformerService,
        private configurationService: LoginConfigurationService) { }

    refresh(options?: HttpRequestOptions, data?: any): Observable<LoginResponse> {
        const refreshParams = this.configurationService.getRefreshParams();
        if (!refreshParams) {
            return EMPTY;
        }

        switch (refreshParams.method) {
            case 'GET':
            case 'get':
                return this.http.get(refreshParams.url, options).pipe(
                    map((resp) => this.responseTransformer.fromHttpPayload(resp, 'refresh')),
                    catchError((e) => of(this.responseTransformer.fromHttpError(e, 'refresh'))));
            case 'POST':
            case 'post':
                return this.http.post(refreshParams.url, data ?? null, options).pipe(
                    map((resp) => this.responseTransformer.fromHttpPayload(resp, 'refresh')),
                    catchError((e) => of(this.responseTransformer.fromHttpError(e, 'refresh'))));
            default:
                throw new Error('Invalid HTTP method');
        }
    }

}
