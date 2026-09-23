import type { UserSession } from "./UserSession";

export interface AuthResponse {
    user: UserSession;
    token: string;
}
