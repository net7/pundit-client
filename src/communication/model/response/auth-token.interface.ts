export interface AuthToken {
    access_token: string;
    token_type: 'bearer';
    expires_in: number;
    refresh_token?: string;
}
