import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { AuthConfig } from '../interfaces';
import { LoginConfigurationService } from '../services/configuration.service';

export function providePunditLogin(conf: AuthConfig): Array<Provider | EnvironmentProviders> {
  return [
    LoginConfigurationService,
    {
      provide: 'config',
      useValue: conf
    },
    provideHttpClient(withXhr(), withInterceptorsFromDi())
  ];
}
