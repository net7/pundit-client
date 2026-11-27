import { PopupParameters } from './popup.interface';

export type OAuthProviderType = 'google' | 'facebook' | 'egi';
/**
 * The provider's sign-in start route of the BE API (`<authBaseUrl>login/{provider}/pundit`):
 * the BE API builds the provider's address, client id, redirect and state included.
 */
export interface OAuthParameters {
    url: string;
}
export interface OAuthProvider {
    id: OAuthProviderType;
    type: 'OAuth';
    params: OAuthParameters;
    popup: PopupParameters;
}
