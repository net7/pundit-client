import { TestBed, ComponentFixture } from '@angular/core/testing';
import { translate } from '@net7/core';
import { Subject } from 'rxjs';
import en_US from 'src/app/config/i18n/en_US';
import { ResendOutcome } from '../../interfaces';
import { EmailProviderService } from '../../services/email-provider.service';
import { VerifyEmailComponent } from './verify-email.component';

const credentials = { email: 'user@example.org', password: 'secret-password' };

describe('VerifyEmailComponent', () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let outcome$: Subject<ResendOutcome>;
  let signOut$: Subject<void>;
  let emailProviderService: { resendVerificationMail: jest.Mock; signOut: jest.Mock };

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent!.replace(/\s+/g, ' ');
  const button = () => el().querySelector('button') as HTMLButtonElement;
  const signOutLink = () => el().querySelector('a') as HTMLAnchorElement;

  const render = (disabled = false) => {
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.componentRef.setInput('credentials', credentials);
    fixture.componentRef.setInput('disabled', disabled);
    fixture.detectChanges();
  };

  const resendWith = (outcome: ResendOutcome) => {
    button().click();
    outcome$.next(outcome);
    fixture.detectChanges();
  };

  beforeAll(() => {
    translate.setDefaultLang('en');
    translate.setCurrentLang('en');
    translate.setLangTranslations('en', en_US);
  });

  beforeEach(() => {
    outcome$ = new Subject();
    signOut$ = new Subject();
    emailProviderService = {
      resendVerificationMail: jest.fn(() => outcome$),
      signOut: jest.fn(() => signOut$),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: EmailProviderService, useValue: emailProviderService }],
    });
  });

  it('asks to open the link sent to the address', () => {
    render();

    expect(el().querySelector('h1')!.textContent!.trim()).toBe('Check your inbox');
    expect(text()).toContain('We sent a confirmation link to user@example.org.');
    expect(text()).toContain('Open it to start using Pundit.');
    expect(el().querySelector('strong')!.textContent).toBe('user@example.org');
    expect(button().textContent!.trim()).toBe('Send a new link');
    expect(signOutLink().textContent!.trim()).toBe('Sign out');
  });

  it('asks for a new link with the form credentials and disables the button meanwhile', () => {
    render();

    button().click();
    fixture.detectChanges();

    expect(emailProviderService.resendVerificationMail).toHaveBeenCalledWith(credentials);
    expect(button().disabled).toBe(true);
    button().click();
    expect(emailProviderService.resendVerificationMail).toHaveBeenCalledTimes(1);

    outcome$.next({ kind: 'sent' });
    fixture.detectChanges();
    expect(button().disabled).toBe(false);
  });

  it('is disabled while the form has a request in flight', () => {
    render(true);

    expect(button().disabled).toBe(true);
  });

  it.each<[ResendOutcome, string]>([
    [{ kind: 'sent' }, 'We sent a new link to user@example.org.'],
    [
      { kind: 'throttled', minutes: 15 },
      'We already sent a link to user@example.org: check your inbox, also the spam folder. '
        + 'You can ask for a new one in 15 minutes.',
    ],
    [
      { kind: 'throttled', minutes: 1 },
      'You can ask for a new one in 1 minute.',
    ],
    [{ kind: 'too_many_attempts' }, 'Too many attempts: try again in a few minutes.'],
    [{ kind: 'wrong_credentials' }, 'These credentials do not match our records.'],
  ])('shows the message for %j', (outcome, message) => {
    render();

    resendWith(outcome);

    expect(text()).toContain(message);
  });

  it('shows no message when the email is already verified (a login starts)', () => {
    render();

    resendWith({ kind: 'already_verified' });

    expect(el().querySelectorAll('p')).toHaveLength(2);
  });

  it('signs out, then tells the form', () => {
    render();
    const signedOut = jest.fn();
    fixture.componentInstance.signedOut.subscribe(signedOut);

    signOutLink().click();

    expect(emailProviderService.signOut).toHaveBeenCalledTimes(1);
    expect(signedOut).not.toHaveBeenCalled();
    signOut$.next();
    expect(signedOut).toHaveBeenCalledTimes(1);
  });
});
