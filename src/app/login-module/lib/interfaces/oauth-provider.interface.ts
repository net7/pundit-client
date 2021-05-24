import { PopupParameters } from './popup.interface';

export type OAuthProviderType = 'google' | 'facebook' | 'egi';
export interface OAuthParameters {
    clientId: string;
    redirect: string;
    scope: string;
    url: string;
}
export interface OAuthProvider {
    id: OAuthProviderType;
    type: 'OAuth';
    params: OAuthParameters;
    popup: PopupParameters;
}
