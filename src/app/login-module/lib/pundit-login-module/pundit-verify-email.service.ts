import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  HttpRequestOptions, VerifyEmailResponse, ErrorResponse, SourceType
} from '../interfaces';
import { LoginConfigurationService } from '../services';

@Injectable({
  providedIn: 'root'
})
export class PunditVerifyEmailService {
  constructor(
        private http: HttpClient,
        private configurationService: LoginConfigurationService
  ) { }

  verify = (options?: HttpRequestOptions): Observable<VerifyEmailResponse> => {
    const verifyParams = this.configurationService.getVerifyEmailParams();
    if (!verifyParams) {
      return EMPTY;
    }
    switch (verifyParams.method) {
      case 'GET':
      case 'get':
        return this.http.get(verifyParams.url, options).pipe(
          map((resp: VerifyEmailResponse): VerifyEmailResponse => {
            if ('mail' in resp) {
              return {
                source: 'verify',
                mail: resp.mail,
              };
            }
            return {
              source: 'verify',
              error: resp.error,
            };
          }),
          catchError((e): Observable<ErrorResponse & { source: SourceType }> => {
            if (e instanceof HttpErrorResponse) {
              return of({ error: e?.error?.error, source: 'verify' as SourceType });
            }
            return of({ error: 'Internal server error', source: 'verify' as SourceType });
          })
        );
      default:
        throw new Error('Invalid HTTP method');
    }
  }
}
