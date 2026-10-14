import { TestBed, ComponentFixture } from '@angular/core/testing';
import { translate } from '@net7/core';
import { EMPTY, of, Subject } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { LoginConfigurationService } from '../../services/configuration.service';
import { EmailProviderService } from '../../services/email-provider.service';
import { OauthProviderService } from '../../services/oauth-provider.service';
import { SignInComponent } from './signin.component';

jest.mock('src/common/models', () => ({ AnalyticsModel: { track: jest.fn() } }));

const credentials = { email: 'user@example.org', password: 'secret-password' };
const terms = { url: 'http://terms', popup: { origin: '' } };

const storedValues = (storage: Storage) => Array.from({ length: storage.length })
  .map((_, i) => storage.getItem(storage.key(i)!));

describe('SignInComponent > must_verify_email', () => {
  let fixture: ComponentFixture<SignInComponent>;
  let component: SignInComponent;
  let mustVerifyEmail$: Subject<void>;
  let emailProviderService: any;

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent!.replace(/\s+/g, ' ');
  const resendButton = () => el().querySelector('lib-pundit-login-verify-email button') as HTMLButtonElement | null;

  const submitLogin = () => {
    component.loginForm.setValue(credentials);
    component.loginEmail();
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
      login: jest.fn(),
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
            getEmailProvider: () => ({ id: 'default', type: 'email' }),
            getTermsParams: () => terms,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('replaces the form with "Check your inbox"', () => {
    const verifying = jest.fn();
    component.verifyingChange.subscribe(verifying);

    submitLogin();

    expect(emailProviderService.login).toHaveBeenCalledWith(credentials, terms);
    expect(text()).toContain('Check your inbox');
    expect(text()).toContain('We sent a confirmation link to user@example.org.');
    expect(text()).toContain('Open it to start using Pundit.');
    expect(resendButton()?.textContent?.trim()).toBe('Send a new link');
    expect(el().querySelector('form')).toBeNull();
    expect(component.serviceErrorMessage).toBeFalsy();
    expect(verifying).toHaveBeenCalledWith(true);
  });

  it('asks for a new link with the login form credentials', () => {
    submitLogin();

    resendButton()!.click();

    expect(emailProviderService.resendVerificationMail).toHaveBeenCalledWith(credentials);
  });

  it('ignores must_verify_email when this form did not submit', () => {
    mustVerifyEmail$.next();
    fixture.detectChanges();

    expect(resendButton()).toBeNull();
  });

  it('drops the submitted credentials once the login settles', () => {
    component.loginForm.setValue(credentials);
    component.loginEmail();
    expect((component as any).submitted).toEqual(credentials);

    emailProviderService.isLoading$.next(false);

    expect((component as any).submitted).toBeNull();
  });

  it('goes back to the form without the password after "Sign out"', () => {
    const verifying = jest.fn();
    component.verifyingChange.subscribe(verifying);
    submitLogin();

    (el().querySelector('lib-pundit-login-verify-email a') as HTMLAnchorElement).click();
    fixture.detectChanges();

    expect(emailProviderService.signOut).toHaveBeenCalledTimes(1);
    expect(component.verifyCredentials).toBeNull();
    expect(resendButton()).toBeNull();
    expect(el().querySelector('form')).not.toBeNull();
    expect(component.loginForm.value).toEqual({ email: credentials.email, password: '' });
    expect(verifying).toHaveBeenLastCalledWith(false);
  });

  it('drops the credentials when the screen is destroyed', () => {
    submitLogin();
    expect(component.verifyCredentials).toEqual(credentials);

    fixture.destroy();

    expect(component.verifyCredentials).toBeNull();
    expect((component as any).submitted).toBeNull();
  });

  it('does not store or log the credentials', () => {
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const)
      .map((method) => jest.spyOn(console, method).mockImplementation(() => undefined));

    submitLogin();
    resendButton()!.click();

    expect(storedValues(localStorage).join()).not.toContain(credentials.password);
    expect(storedValues(sessionStorage).join()).not.toContain(credentials.password);
    expect(document.cookie).not.toContain(credentials.password);
    consoleSpies.forEach((spy) => {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(credentials.password);
      spy.mockRestore();
    });
  });
});
