export interface LoginUser {
    id: string;
    username: string;
    thumb: string;
    is_verified: boolean;
    current_notebook: string;
    notifications?: {
        total?: number
    }
    /** Whether the user has an active AI API key; older backends don't send it. */
    has_active_ai_key?: boolean;
}
