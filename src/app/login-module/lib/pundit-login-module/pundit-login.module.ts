import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import {
  ErrorComponent, ModalComponent, SignInComponent, SignUpComponent, SvgIconComponent
} from '../components';
import { AuthConfig } from '../interfaces';
import { LoginConfigurationService } from '../services/configuration.service';
import { PunditLoginComponent } from './pundit-login.component';

@NgModule({
  declarations: [
    PunditLoginComponent,
    ModalComponent,
    SignInComponent,
    SignUpComponent,
    ErrorComponent,
    SvgIconComponent
  ],
  exports: [PunditLoginComponent],
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule],
  providers: [{
    provide: 'config',
    useValue: undefined
  }, provideHttpClient(withXhr(), withInterceptorsFromDi())]
})
export class PunditLoginModule {
  static forRoot(conf: AuthConfig): ModuleWithProviders<PunditLoginModule> {
    return ({
      ngModule: PunditLoginModule,
      providers: [
        LoginConfigurationService,
        {
          provide: 'config',
          useValue: conf
        }
      ]
    });
  }
}
