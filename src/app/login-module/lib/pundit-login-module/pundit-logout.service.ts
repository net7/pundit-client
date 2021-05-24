import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpRequestOptions } from '../interfaces';
import { LoginConfigurationService } from '../services';

@Injectable({
  providedIn: 'root'
})
export class PunditLogoutService {
  constructor(private http: HttpClient, private configurationService: LoginConfigurationService) { }

  logout = (options?: HttpRequestOptions, data?: any): Promise<object> => {
    const logoutParams = this.configurationService.getLogoutParams();
    if (!logoutParams) {
      return new Promise((resolve) => resolve(undefined));
    }
    switch (logoutParams.method) {
      case 'GET':
      case 'get':
        return this.http.get(logoutParams.url, options).toPromise();
      case 'POST':
      case 'post':
        return this.http.post(logoutParams.url, data ?? null, options).toPromise();
      default:
        throw new Error('Invalid HTTP method');
    }
  }
}
