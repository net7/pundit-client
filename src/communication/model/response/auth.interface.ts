import { AuthToken } from './auth-token.interface';
import { LoginUser } from './auth-user.interface';

export type SourceType = 'login' | 'refresh' | 'storage' | 'sso';

export interface SuccessLoginResponse {
  token: AuthToken;
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
