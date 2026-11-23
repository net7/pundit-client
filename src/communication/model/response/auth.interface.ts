import { LoginUser } from './auth-user.interface';

export type SourceType = 'login' | 'storage' | 'sso';

/**
 * Answer of `GET api/user` and of the email login: the signed-in user and the
 * CSRF token bound to the session.
 */
export interface AuthSessionResponse {
  userinfo: LoginUser | string;
  csrf_token: string;
}

export interface SuccessLoginResponse {
  user: LoginUser;
}

export interface ErrorResponse {
  error: string;
}

export type LoginResponse = (SuccessLoginResponse | ErrorResponse) & { source: SourceType };

/**
 * Error codes of the email confirmation flow.
 */
export type AuthErrorCode =
  | 'must_verify_email'
  | 'verification_mail_throttled'
  | 'already_verified';

/**
 * Error body of the auth endpoints: `retry_after_minutes` comes
 * with `verification_mail_throttled`.
 */
export interface AuthErrorResponse {
  error: string;
  retry_after_minutes?: number;
}
