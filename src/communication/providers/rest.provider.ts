import axios, { AxiosError, AxiosPromise } from 'axios';
import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import { CommunicationSettings } from '../services';
import { ConnectionManager } from '../services/connection-manager.service';
import {
  DeleteRequestOptions, GetRequestOptions, PostRequestOptions, PutRequestOptions
} from '../types';

type Options =
  GetRequestOptions |
  DeleteRequestOptions |
  PostRequestOptions<any> |
  PutRequestOptions<any>;

const request$ = (
  url: string,
  options: Options,
  agent$?: Promise<any>
): AxiosPromise<any> => {
  let ssoLoading$ = ConnectionManager.ssoLoading$ || Promise.resolve();
  ssoLoading$ = ssoLoading$ === agent$ ? Promise.resolve() : ssoLoading$;
  return ssoLoading$.then(() => {
    let headers;
    if (CommunicationSettings.token && !options?.skipAuth) {
      headers = { Authorization: `Bearer ${CommunicationSettings.token.access_token}` };
    }
    const response = axios({
      url,
      headers,
      adapter: fetchAdapter,
      ...options,
    });
    const after = options?.hooks?.after;
    if (after) {
      return Promise.resolve(after(response));
    }
    return response;
  });
};

export const retry$ = (errorResponse: AxiosError): AxiosPromise<any> => {
  const { config } = errorResponse;
  if (CommunicationSettings.token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${CommunicationSettings.token.access_token}`
    };
  }
  return axios(config);
};

export default request$;
