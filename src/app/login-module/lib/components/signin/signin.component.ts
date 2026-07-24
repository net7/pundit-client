import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { AnalyticsModel } from 'src/common/models';
import { AnalyticsAction } from 'src/common/types';
import { EmailAuthProvider, OAuthProvider, TermsParameters } from '../../interfaces';
import { LoginConfigurationService } from '../../services/configuration.service';
import { EmailProviderService } from '../../services/email-provider.service';
import { OauthProviderService } from '../../services/oauth-provider.service';
import validationHelper from '../../helpers/validation.helper';
import { environment as env } from '../../../../../environments/environment';
import { SvgIconComponent } from '../svg-icon/svg-icon';
import { NgClass } from '@angular/common';

@Component({
    selector: 'lib-pundit-login-signin',
    templateUrl: './signin.component.html',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SvgIconComponent, FormsModule, ReactiveFormsModule, NgClass]
})
export class SignInComponent {
  private configService = inject(LoginConfigurationService);
  private emailProviderService = inject(EmailProviderService);
  private oauthProviderService = inject(OauthProviderService);
  private formBuilder = inject(UntypedFormBuilder);
  private changeDetectorRef = inject(ChangeDetectorRef);

  email!: EmailAuthProvider;

  google: OAuthProvider | undefined;

  egi: OAuthProvider | undefined;

  facebook: OAuthProvider | undefined;

  loginForm!: UntypedFormGroup;

  isLoading = false;

  serviceErrorMessage!: string | null;

  terms: TermsParameters | undefined;

  lostPasswordLink = `${env.userLink}password/reset`;

  constructor() {
    const oauth = this.configService.getOAuthProviders();
    const email = this.configService.getEmailProvider();
    this.terms = this.configService.getTermsParams();
    this.initProviders(oauth, email);
    this.emailProviderService.isLoading$.subscribe((val) => {
      this.isLoading = !!val;
      this.changeDetectorRef.markForCheck();
    });
  }

  private initProviders(oauthProviders: OAuthProvider[], emailProvider: EmailAuthProvider) {
    this.email = emailProvider;
    this.google = oauthProviders.find((provider) => provider.id === 'google');
    this.egi = oauthProviders.find((provider) => provider.id === 'egi');
    this.facebook = oauthProviders.find((provider) => provider.id === 'facebook');
    if (emailProvider) {
      this.loginForm = this.formBuilder.group({
        email: ['', [
          Validators.required,
          Validators.email,
        ]],
        password: ['', [
          Validators.required,
        ]]
      });
      // on form change clear service error
      this.loginForm.valueChanges.subscribe(() => {
        this.serviceErrorMessage = null;
        this.changeDetectorRef.markForCheck();
      });
    }
  }

  loginGoogle() {
    if (!this.google || this.isLoading) { return; }
    this.oauthProviderService.login(this.google);

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.LoginGoogleClick
    });
  }

  loginEgi() {
    if (!this.egi || this.isLoading) { return; }
    this.oauthProviderService.login(this.egi);

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.LoginEgiClick
    });
  }

  loginFacebook() {
    if (!this.facebook || this.isLoading) { return; }
    this.oauthProviderService.login(this.facebook);

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.LoginFacebookClick
    });
  }

  loginEmail() {
    if (this.isLoading) { return; }
    // check errors
    this.emailProviderService.error$.pipe(
      first(),
      switchMap(({ status }: any) => of(validationHelper.getServiceErrorMessage(status)))
    ).subscribe((errorMessage) => {
      this.serviceErrorMessage = errorMessage;
      this.changeDetectorRef.markForCheck();
    });
    this.emailProviderService.login(this.loginForm.value, this.terms);

    // analytics
    AnalyticsModel.track({
      action: AnalyticsAction.LoginEmailClick
    });
  }

  getErrorMessage = (input: string) => {
    if (!this.loginForm.get(input)!.touched) {
      return null;
    }
    return validationHelper.getErrorMessage(input, this.loginForm.get(input)!.errors);
  };
}
