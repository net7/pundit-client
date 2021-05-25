/* eslint-disable @typescript-eslint/camelcase */
import { from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { getDateFromTimestamp } from './date.helper';
import { AuthToken, LoginResponse, SourceType } from '@pundit/communication';
import axios, { AxiosError } from 'axios';

export const fromEvent = (message: MessageEvent): LoginResponse => {
  if (message.data.error) {
    return { error: message.data.error, source: 'login' };
  }
  return {
    token: {
      access_token: message.data.access_token as string,
      token_type: 'bearer',
      expire_date: getDateFromTimestamp(message.data.expires_in)
    },
    user: typeof message.data.userinfo === 'string' ?
       JSON.parse(message.data.userinfo) : message.data.userinfo,
    source: 'login'
  };
};

export const transformFromHttpSuccess = (response, source: SourceType) => {
  if (response?.error) {
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
};

export const transformFromHttpError = (error:AxiosError, source: SourceType) => {
  if (axios.isAxiosError(error)) {
    return { error: error?.response?.data?.error, source };
  }
  return { error: 'Internal server error', source };
};

export const responseTransformer = (request$: Promise<any>, source: SourceType) => from(request$).pipe(
  map((resp) => transformFromHttpSuccess(resp.data, source)),
  catchError((err) => of(transformFromHttpError(err, source)))
);
