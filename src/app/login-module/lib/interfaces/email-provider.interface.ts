export interface EmailAuthParams {
    loginUrl: string;
    registerUrl: string;
    register: boolean;
}
export interface EmailAuthProvider {
    id: string;
    type: 'email';
    params: EmailAuthParams;
}

