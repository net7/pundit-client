import { EmailAuthProvider } from './email-provider.interface';
import { OAuthProvider } from './oauth-provider.interface';
import { TermsParameters } from './terms.interface';

export interface AuthConfig {
    oauthproviders: OAuthProvider[];
    email: EmailAuthProvider;
    terms?: TermsParameters;
}
