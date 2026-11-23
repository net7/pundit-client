import axios, { AxiosError, AxiosPromise, AxiosRequestConfig } from 'axios';
import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';
import {
  DeleteRequestOptions, GetRequestOptions, PostRequestOptions, PutRequestOptions
} from '../types';
import { withoutFields } from './without-fields';

type Options =
  GetRequestOptions |
  DeleteRequestOptions |
  PostRequestOptions<any> |
  PutRequestOptions<any>;

export const CSRF_HEADER = 'X-CSRF-TOKEN';

/** The new BE API answers 419 when the CSRF token does not match the session. */
const CSRF_MISMATCH = 419;

const needsCsrf = (options: Options) => !options.anonymous
  && (options.method || 'get').toLowerCase() !== 'get';

let csrfFetch$: Promise<string> | null = null;

/**
 * Asks the BE API for a CSRF token and stores it.
 * Concurrent callers share the same in-flight request.
 */
export const fetchCsrfToken = (): Promise<string> => {
  if (!csrfFetch$) {
    csrfFetch$ = (axios({
      url: 'api/csrf',
      baseURL: CommunicationSettings.authBaseUrl,
      method: 'get',
      withCredentials: true,
      adapter: fetchAdapter,
    }) as AxiosPromise<{ csrf_token: string }>)
      .then(({ data }) => {
        CommunicationSettings.csrfToken = data.csrf_token;
        return data.csrf_token;
      })
      .finally(() => {
        csrfFetch$ = null;
      });
  }
  return csrfFetch$;
};

const csrfToken$ = (options: Options): Promise<string | null> => {
  if (!needsCsrf(options)) {
    return Promise.resolve(null);
  }
  const { csrfToken } = CommunicationSettings;
  return csrfToken ? Promise.resolve(csrfToken) : fetchCsrfToken();
};

const buildConfig = (url: string, options: Options, csrfToken: string | null): AxiosRequestConfig => {
  const axiosOptions = withoutFields(options, 'hooks', 'anonymous');
  const headers = { ...(axiosOptions.headers || {}) };
  if (csrfToken) {
    headers[CSRF_HEADER] = csrfToken;
  }
  return {
    url,
    adapter: fetchAdapter,
    ...axiosOptions,
    headers,
    withCredentials: !options.anonymous,
  };
};

const send$ = (url: string, options: Options, isRetry = false): AxiosPromise<any> => csrfToken$(options)
  .then((csrfToken) => axios(buildConfig(url, options, csrfToken)))
  .catch((err) => {
    // stale token (e.g. rotated by a sign-in elsewhere): renew and retry once
    if (!isRetry && !options.anonymous && err?.response?.status === CSRF_MISMATCH) {
      return fetchCsrfToken().then(() => send$(url, options, true));
    }
    throw err;
  });

const request$ = (
  url: string,
  options: Options,
  agent$?: Promise<any>
): AxiosPromise<any> => {
  let ssoLoading$ = ConnectionManager.ssoLoading$ || Promise.resolve();
  ssoLoading$ = ssoLoading$ === agent$ ? Promise.resolve() : ssoLoading$;
  return ssoLoading$.then(() => {
    const response = send$(url, options);
    const after = options?.hooks?.after;
    if (after) {
      return Promise.resolve(after(response));
    }
    return response;
  });
};

export const retry$ = (errorResponse: AxiosError): AxiosPromise<any> => axios(errorResponse.config);

export default request$;
