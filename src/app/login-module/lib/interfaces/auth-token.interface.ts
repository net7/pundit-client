export interface AuthToken {
    access_token: string;
    token_type: 'bearer';
    expire_date: string;
    refresh_token?: string;
}
