export interface LoginUser {
    id: string;
    username: string;
    thumb: string;
    is_verified: boolean;
    current_notebook: string;
    notifications?: {
        total?: number
    }
}
