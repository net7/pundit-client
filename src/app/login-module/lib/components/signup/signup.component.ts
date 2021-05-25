import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { EmailAuthProvider, OAuthProvider } from '../../interfaces';
import { LoginConfigurationService } from '../../services/configuration.service';
import { EmailProviderService } from '../../services/email-provider.service';
import { OauthProviderService } from '../../services/oauth-provider.service';
import validationHelper from '../../helpers/validation.helper';

@Component({
  selector: 'lib-pundit-login-signup',
  templateUrl: './signup.component.html',
  styleUrls: []
})
export class SignUpComponent {
  registerForm: FormGroup;

  email: EmailAuthProvider;

  google: OAuthProvider;

  egi: OAuthProvider;

  facebook: OAuthProvider;

  isLoading = false;

  serviceErrorMessage: string;

  constructor(
    private configService: LoginConfigurationService,
    private emailProvider: EmailProviderService,
    private oauthProviders: OauthProviderService,
    private formBuilder: FormBuilder
  ) {
    const oauth = this.configService.getOAuthProviders();
    const email = this.configService.getEmailProvider();
    this.initProviders(oauth, email);
    this.emailProvider.isLoading$.subscribe((val) => {
      this.isLoading = !!val;
    });
  }

  private initProviders(oauthProviders: OAuthProvider[], emailProvider: EmailAuthProvider) {
    this.email = emailProvider;
    this.google = oauthProviders.find((provider) => provider.id === 'google');
    this.egi = oauthProviders.find((provider) => provider.id === 'egi');
    this.facebook = oauthProviders.find((provider) => provider.id === 'facebook');
    if (emailProvider && emailProvider.register) {
      this.registerForm = this.formBuilder.group({
        firstname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(64)]],
        lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(64)]],
        email: ['', [Validators.required, Validators.maxLength(254), Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32)]],
        termsconditions: [false, Validators.requiredTrue],
        tracking: [false]
      });

      // on form change clear service error
      this.registerForm.valueChanges.subscribe(() => {
        this.serviceErrorMessage = null;
      });
    }
  }
  registerGoogle() {
    if (!this.google || this.isLoading) { return; }
    this.oauthProviders.login(this.google);
  }

  registerEgi() {
    if (!this.egi || this.isLoading) { return; }
    this.oauthProviders.login(this.egi);
  }

  registerFacebook() {
    if (!this.facebook || this.isLoading) { return; }
    this.oauthProviders.login(this.facebook);
  }

  registerEmail() {
    if (this.isLoading) { return; }
    // check errors
    this.emailProvider.error$.pipe(
      first(),
      switchMap(({ status }: any) => of(validationHelper.getServiceErrorMessage(status)))
    ).subscribe((errorMessage) => {
      this.serviceErrorMessage = errorMessage;
    });
    this.emailProvider.register(this.registerForm.value);
  }

  getErrorMessage = (input) => {
    if (!this.registerForm.get(input).touched) {
      return null;
    }
    return validationHelper.getErrorMessage(input, this.registerForm.get(input).errors);
  }
}
