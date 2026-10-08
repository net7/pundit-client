import { AxiosPromise } from 'axios';

export * from './model';

/**
 * Rest provider
*/

export interface RequestOptions {
  baseURL?: string;
  headers?: { [key: string]: any };
  hooks?: RequestHooks;
  withCredentials?: boolean;
  skipAuth?: boolean
}

export type RequestHooks = {
  before?: (options: RequestOptions) => RequestOptions | Promise<RequestOptions>
  after?: (response: AxiosPromise) => AxiosPromise
}

export interface GetRequestOptions extends RequestOptions {
  method?: 'get'
}

export interface DeleteRequestOptions extends RequestOptions {
  method?: 'delete'
}

export interface PostRequestOptions<T> extends RequestOptions {
  method?: 'post',
  data: T;
}

export interface PutRequestOptions<T> extends RequestOptions {
  method?: 'put',
  data: T;
}
