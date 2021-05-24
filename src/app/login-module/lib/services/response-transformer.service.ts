import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getDateFromTimestamp } from '../helpers/date.helper';
import { AuthToken, LoginResponse, SourceType } from '../interfaces';
@Injectable({
    providedIn: 'root'
})
export class ResponseTransformerService {

    fromEvent = (message: MessageEvent): LoginResponse => {
        if (!!message.data.error) {
            return { error: message.data.error, source: 'login' };
        } else {
            return {
                token: {
                    access_token: message.data.access_token as string,
                    token_type: 'bearer',
                    expire_date: getDateFromTimestamp(message.data.expires_in)
                },
                user: typeof message.data.userinfo === 'string' ? JSON.parse(message.data.userinfo) : message.data.userinfo,
                source: 'login'
            };
        }
    }

    fromHttpPayload = (resp: any, source: SourceType = 'login'): LoginResponse => {
        if (resp && resp.error) {
            return { error: resp.error as string, source };
        } else {
            return {
                token: {
                    access_token: resp.access_token,
                    token_type: 'bearer',
                    expire_date: getDateFromTimestamp(resp.expires_in)
                } as AuthToken,
                user: typeof resp.userinfo === 'string' ? JSON.parse(resp.userinfo) : resp.userinfo,
                source
            };
        }
    }

    fromHttpError = (e: any, source: SourceType = 'login'): LoginResponse => {
        if (e instanceof HttpErrorResponse) {
            return { error: e?.error?.error, source };
        } else {
            return { error: 'Internal server error', source };
        }
    }
}
