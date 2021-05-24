import { EmailAuthProvider } from './email-provider.interface';
import { LogoutParameters } from './logout-params.interfaces';
import { OAuthProvider } from './oauth-provider.interface';
import { RefreshTokenParameters } from './refresh-token-params.interface';
import { SsoParameters } from './sso-params.interface';
import { TermsParameters } from './terms.interface';
import { VerifyEmailParameters } from './verify-email-params.interface';

export interface AuthConfig {
    oauthproviders: OAuthProvider[];
    email: EmailAuthProvider;
    logout?: LogoutParameters;
    refresh?: RefreshTokenParameters;
    terms?: TermsParameters;
    sso?: SsoParameters;
    verify?: VerifyEmailParameters;
}
