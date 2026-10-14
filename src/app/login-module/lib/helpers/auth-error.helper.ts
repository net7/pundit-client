import { AuthErrorCode, AuthErrorResponse } from 'src/communication';
import { ResendOutcome } from '../interfaces/verify-email.interface';

/** Auth error codes the login module handles. */
const AUTH_ERROR_CODES: AuthErrorCode[] = [
  'must_verify_email',
  'verification_mail_throttled',
  'already_verified',
];

/**
 * Status and body of a failed auth request: an axios error in page,
 * or the `{ response }` object relayed by the chrome extension.
 */
const getErrorResponse = (err: any): { status?: number; data?: AuthErrorResponse } => err?.response ?? {};

export const getAuthErrorCode = (err: any): AuthErrorCode | undefined => {
  const code = getErrorResponse(err).data?.error;
  return AUTH_ERROR_CODES.find((c) => c === code);
};

export const mustVerifyEmail = (err: any): boolean => getErrorResponse(err).status === 422
  && getAuthErrorCode(err) === 'must_verify_email';

export const toResendOutcome = (err: any): ResendOutcome => {
  const { status, data } = getErrorResponse(err);
  const code = getAuthErrorCode(err);
  if (status === 429) {
    const minutes = data?.retry_after_minutes;
    return code === 'verification_mail_throttled' && typeof minutes === 'number'
      ? { kind: 'throttled', minutes }
      : { kind: 'too_many_attempts' };
  }
  if (status === 401) {
    return { kind: 'wrong_credentials' };
  }
  if (status === 409 && code === 'already_verified') {
    return { kind: 'already_verified' };
  }
  return { kind: 'error' };
};
