import { AuthToken } from './auth-token.interface';
import { LoginUser } from './auth-user.interface';

export type SourceType = 'login' | 'refresh' | 'storage' | 'sso' | 'verify';

export interface SuccessLoginResponse {
  token: AuthToken;
  user: LoginUser;
}

export interface SuccessVerifyEmailResponse {
  mail: string;
}

export interface ErrorResponse {
  error: string;
}

export type LoginResponse = (SuccessLoginResponse | ErrorResponse) & { source: SourceType };

export type VerifyEmailResponse = (SuccessVerifyEmailResponse | ErrorResponse)
  & { source: SourceType }
