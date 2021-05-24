import { HttpHeaders, HttpParams } from '@angular/common/http';
export interface HttpRequestOptions {
    headers?: HttpHeaders | {
        [header: string]: string | string[];
    };
    params?: HttpParams | {
        [param: string]: string | string[];
    };
    withCredentials?: boolean;
}
