import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { filter, first, switchMap } from 'rxjs/operators';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
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

  private inputTextValues: {
    [key: string]: string;
  } = {
    firstname: null,
    lastname: null,
    email: null,
    password: null
  };

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

      // on checkbox change (for analytics)
      this.registerForm.get('termsconditions').valueChanges.pipe(
        filter((value) => value)
      ).subscribe(() => {
        // analytics
        AnalyticsModel.track({
          action: AnalyticsAction.RegisterCheck1Filled,
        });
      });
      this.registerForm.get('tracking').valueChanges.pipe(
        filter((value) => value)
      ).subscribe(() => {
        // analytics
        AnalyticsModel.track({
          action: AnalyticsAction.RegisterCheck2Filled,
        });
      });
    }
  }

  onBlur() {
    let inputsFilled = true;
    let hasChanged = false;
    ['firstname', 'lastname', 'email', 'password'].forEach((input) => {
      const formInput = this.registerForm.get(input);
      if (!(formInput.value && formInput.valid)) {
        inputsFilled = false;
      }
      if (formInput.value !== this.inputTextValues[input]) {
        this.inputTextValues[input] = formInput.value;
        hasChanged = true;
      }
    });
    if (inputsFilled && hasChanged) {
      // analytics
      AnalyticsModel.track({
        action: AnalyticsAction.RegisterFormFieldsCompleted,
      });
    }
  }

  registerGoogle() {
    if (!this.google || this.isLoading) { return; }
    this.oauthProviders.login(this.google);

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.RegisterGoogleClick
    });
  }

  registerEgi() {
    if (!this.egi || this.isLoading) { return; }
    this.oauthProviders.login(this.egi);

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.RegisterEgiClick
    });
  }

  registerFacebook() {
    if (!this.facebook || this.isLoading) { return; }
    this.oauthProviders.login(this.facebook);

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.RegisterFacebookClick
    });
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

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.RegisterEmailClick
    });
  }

  getErrorMessage = (input) => {
    if (!this.registerForm.get(input).touched) {
      return null;
    }
    return validationHelper.getErrorMessage(input, this.registerForm.get(input).errors);
  }
}
