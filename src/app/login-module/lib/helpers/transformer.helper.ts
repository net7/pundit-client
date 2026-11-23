import { _t } from '@net7/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoginResponse, SourceType } from 'src/communication';
import { AxiosError } from 'axios';
import { AuthModel } from '../../../../common/models';

/** `source` of the message the BE API's sign-in popup posts to its opener. */
export const POPUP_MESSAGE_SOURCE = 'pundit-login';

/** Outcome message posted by the sign-in popup before it closes. */
export interface PopupOutcomeMessage {
  source: typeof POPUP_MESSAGE_SOURCE;
  status: 'ok' | 'error';
  error?: string;
}

/** Error codes shown with the generic "sign-in failed" text. */
const GENERIC_LOGIN_ERRORS = ['provider_failed', 'Unauthorized', 'General error'];

/**
 * Text of the "sign-in failed" toast: known codes and missing values get the
 * generic text, anything else is a sentence chosen by the backend.
 */
export const loginErrorText = (error?: string): string => (
  !error || GENERIC_LOGIN_ERRORS.includes(error) ? _t('toast#login_error_text') : error
);

const readUser = (userinfo: unknown) => (
  typeof userinfo === 'string' ? JSON.parse(userinfo) : userinfo
);

export const transformFromHttpSuccess = (response: any, source: SourceType) => {
  if (response?.error) {
    return { error: response.error as string, source };
  }
  return {
    user: readUser(response.userinfo),
    source
  };
};

export const transformFromHttpError = (error: AxiosError, source: SourceType) => {
  const errorData = error?.response?.data as { error?: string } | undefined;
  if (errorData) {
    return { error: errorData?.error as string, source };
  }
  return { error: 'Internal server error', source };
};

export const responseTransformer = (
  request$: Promise<any>,
  source: SourceType
): Observable<LoginResponse> => from(request$)
  .pipe(
    map((resp) => transformFromHttpSuccess(resp.data, source)),
    catchError((err) => of(transformFromHttpError(err, source)))
  );

/**
 * Turns the popup's outcome message into a login response. The popup hands
 * over no token: on success the session cookie tells who signed in.
 */
export const fromPopupOutcome = (message: MessageEvent): Observable<LoginResponse> => {
  const { status, error } = (message.data || {}) as PopupOutcomeMessage;
  if (status === 'ok') {
    return responseTransformer(AuthModel.sso(), 'login').pipe(
      map((resp): LoginResponse => ('user' in resp
        ? resp
        : { error: loginErrorText(), source: 'login' }))
    );
  }
  return of({ error: loginErrorText(error), source: 'login' });
};
