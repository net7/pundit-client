import { TestBed, ComponentFixture } from '@angular/core/testing';
import { translate } from '@net7/core';
import { EMPTY, of, Subject } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { LoginConfigurationService } from '../../services/configuration.service';
import { EmailProviderService } from '../../services/email-provider.service';
import { OauthProviderService } from '../../services/oauth-provider.service';
import { SignUpComponent } from './signup.component';

jest.mock('src/common/models', () => ({ AnalyticsModel: { track: jest.fn() } }));

const credentials = { email: 'user@example.org', password: 'secret-password' };
const registerForm = {
  firstname: 'Ada', lastname: 'Lovelace', ...credentials, termsconditions: true, tracking: false,
};

describe('SignUpComponent > must_verify_email', () => {
  let fixture: ComponentFixture<SignUpComponent>;
  let component: SignUpComponent;
  let mustVerifyEmail$: Subject<void>;
  let emailProviderService: any;

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent!.replace(/\s+/g, ' ');
  const resendButton = () => el().querySelector('lib-pundit-login-verify-email button') as HTMLButtonElement | null;

  const submitRegistration = () => {
    component.registerForm.setValue(registerForm);
    component.registerEmail();
    mustVerifyEmail$.next();
    fixture.detectChanges();
  };

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    translate.setLangTranslations('en', en_US);
  });

  beforeEach(() => {
    mustVerifyEmail$ = new Subject();
    emailProviderService = {
      isLoading$: new Subject<boolean>(),
      error$: new Subject(),
      mustVerifyEmail$,
      register: jest.fn(),
      resendVerificationMail: jest.fn(() => EMPTY),
      signOut: jest.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: EmailProviderService, useValue: emailProviderService },
        { provide: OauthProviderService, useValue: { login: jest.fn() } },
        {
          provide: LoginConfigurationService,
          useValue: {
            getOAuthProviders: () => [],
            getEmailProvider: () => ({ id: 'default', type: 'email', register: true }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('replaces the form with "Check your inbox"', () => {
    const verifying = jest.fn();
    component.verifyingChange.subscribe(verifying);

    submitRegistration();

    expect(emailProviderService.register).toHaveBeenCalledWith(registerForm);
    expect(text()).toContain('Check your inbox');
    expect(text()).toContain('We sent a confirmation link to user@example.org.');
    expect(text()).toContain('Open it to start using Pundit.');
    expect(verifying).toHaveBeenCalledWith(true);
    expect(resendButton()?.textContent?.trim()).toBe('Send a new link');
    expect(el().querySelector('form')).toBeNull();
    expect(component.serviceErrorMessage).toBeFalsy();
  });

  it('asks for a new link with the registration form email and password only', () => {
    submitRegistration();

    resendButton()!.click();

    expect(emailProviderService.resendVerificationMail).toHaveBeenCalledWith(credentials);
  });

  it('asks the modal for the sign-in form after "Sign out"', () => {
    const signedOut = jest.fn();
    component.signedOut.subscribe(signedOut);
    submitRegistration();

    (el().querySelector('lib-pundit-login-verify-email a') as HTMLAnchorElement).click();

    expect(emailProviderService.signOut).toHaveBeenCalledTimes(1);
    expect(component.verifyCredentials).toBeNull();
    expect(signedOut).toHaveBeenCalledTimes(1);
  });

  it('drops the credentials when the screen is destroyed', () => {
    submitRegistration();
    expect(component.verifyCredentials).toEqual(credentials);

    fixture.destroy();

    expect(component.verifyCredentials).toBeNull();
    expect((component as any).submitted).toBeNull();
  });
});
