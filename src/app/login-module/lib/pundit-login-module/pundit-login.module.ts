import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorComponent, ModalComponent, SignInComponent, SignUpComponent, SvgIconComponent } from '../components';
import { AuthConfig } from '../interfaces';
import { LoginConfigurationService } from '../services/configuration.service';
import { PunditLoginComponent } from './pundit-login.component';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  declarations: [
    PunditLoginComponent,
    ModalComponent,
    SignInComponent,
    SignUpComponent,
    ErrorComponent,
    SvgIconComponent
  ],
  providers: [{
    provide: 'config',
    useValue: undefined
  }],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  exports: [PunditLoginComponent]
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
