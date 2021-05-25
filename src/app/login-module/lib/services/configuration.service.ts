import { Inject, Injectable } from '@angular/core';
import { AuthConfig } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class LoginConfigurationService {
  constructor(@Inject('config') private authConfig: AuthConfig) {
    if (!this.authConfig) {
      console.warn('Missing Auth config. Pass config params using PunditLoginModule.forRoot().');
      this.authConfig = {
        oauthproviders: [
          {
            id: 'google',
            type: 'OAuth',
            params: {
              clientId: '', redirect: '', url: '', scope: ''
            },
            popup: { origin: '' }
          },
          {
            id: 'facebook',
            type: 'OAuth',
            params: {
              clientId: '', redirect: '', url: '', scope: ''
            },
            popup: { origin: '' }
          },
          {
            id: 'egi',
            type: 'OAuth',
            params: {
              clientId: '', redirect: '', url: '', scope: ''
            },
            popup: { origin: '' }
          }
        ],
        email: { id: 'default',register: true , type: 'email' },
        terms: { url: 'a', popup: { origin: '' } }
      };
    }
  }

  getOAuthProviders() {
    return this.authConfig.oauthproviders;
  }

  getEmailProvider() {
    return this.authConfig.email;
  }

  getTermsParams() {
    return this.authConfig.terms;
  }
}
