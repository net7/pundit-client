import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Input, Output, inject
} from '@angular/core';
import { _t } from '@net7/core';
import { UserLoginRequestParams } from 'src/communication';
import { ResendOutcome } from '../../interfaces';
import { EmailProviderService } from '../../services/email-provider.service';
import validationHelper from '../../helpers/validation.helper';
import { SvgIconComponent } from '../svg-icon/svg-icon';

type ResendMessage = { text: string; isError: boolean };

const getResendMessage = (outcome: ResendOutcome, email: string): ResendMessage | null => {
  switch (outcome.kind) {
    case 'sent':
      return { text: _t('loginmodal#verify_email_resend_sent', { email }), isError: false };
    case 'throttled':
      return {
        text: _t('loginmodal#verify_email_resend_throttled', {
          email,
          minutes: outcome.minutes,
          unit: _t(outcome.minutes === 1 ? 'loginmodal#minute' : 'loginmodal#minutes'),
        }),
        isError: true,
      };
    case 'too_many_attempts':
      return { text: _t('loginmodal#verify_email_resend_too_many_attempts'), isError: true };
    case 'wrong_credentials':
      return { text: validationHelper.getServiceErrorMessage(401), isError: true };
    case 'already_verified':
      // a normal login has started
      return null;
    default:
      return { text: validationHelper.getServiceErrorMessage(), isError: true };
  }
};

/**
 * "Check your inbox": shown in place of the sign-in or sign-up form
 * while the email address of the account is not confirmed.
 */
@Component({
    selector: 'lib-pundit-login-verify-email',
    templateUrl: './verify-email.component.html',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SvgIconComponent]
})
export class VerifyEmailComponent {
  private emailProviderService = inject(EmailProviderService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  /** Email and password of the form, used only by "Send a new link". */
  @Input() credentials!: UserLoginRequestParams;

  /** Disables the actions while the parent form has a request in flight. */
  @Input() disabled = false;

  @Output() signedOut = new EventEmitter<void>();

  isSending = false;

  isSigningOut = false;

  resendMessage: ResendMessage | null = null;

  labels = {
    title: _t('loginmodal#verify_email_title'),
    sentTo: _t('loginmodal#verify_email_sent_to'),
    openLink: _t('loginmodal#verify_email_open_link'),
    resend: _t('loginmodal#verify_email_resend_action'),
    signOut: _t('loginmodal#verify_email_sign_out'),
  };

  resend() {
    if (this.isSending || this.isSigningOut || this.disabled) { return; }
    this.isSending = true;
    this.resendMessage = null;
    this.emailProviderService.resendVerificationMail(this.credentials)
      .subscribe((outcome) => {
        this.isSending = false;
        this.resendMessage = getResendMessage(outcome, this.credentials.email);
        this.changeDetectorRef.markForCheck();
      });
  }

  signOut(event: Event) {
    event.preventDefault();
    if (this.isSigningOut || this.disabled) { return; }
    this.isSigningOut = true;
    this.emailProviderService.signOut().subscribe(() => {
      this.isSigningOut = false;
      this.signedOut.emit();
      this.changeDetectorRef.markForCheck();
    });
  }
}
