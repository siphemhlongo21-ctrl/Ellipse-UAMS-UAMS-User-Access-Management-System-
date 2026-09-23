import { useContext, createContext, type ReactNode, useState } from 'react';
import { accountApi } from '../api';
import type { UserSession } from '../types/UserSession';

interface AuthContextType {
    login: (username: string, password: string) => Promise<UserSession | null>;
    logout: () => void;
    setUserSession: (session: UserSession) => void,
    setUserToken: (token: string) => void,
    token: string | null;
    session: UserSession | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = "access_token";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);//(() => sessionStorage.getItem(TOKEN_KEY) ?? null);
    const [session, setSession] = useState<UserSession | null>(null);

    const login = async (username: string, password: string): Promise<UserSession | null> => {
        try {
            const data = await accountApi.login(username, password);

            if (!data?.user || !data.token) {
                throw new Error("Invalid login details");
            }

            sessionStorage.setItem(TOKEN_KEY, data.token);
            setToken(data.token);
            setSession(data.user);
            return data.user;
        } catch {
            return null;
        }
    };

    const setUserSession = (session: UserSession) => {
        sessionStorage.setItem("current_role", session.roles?.find(x => x !== undefined) ?? "");
        setSession(session);
    }
    const setUserToken = (token: string) => {
        sessionStorage.setItem(TOKEN_KEY, token);
        setToken(token);
    }

    const logout = () => {
        setToken("");
        setSession(null);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem("current_role");
    }

    return (
        <AuthContext.Provider value={{ login, logout, setUserSession, setUserToken, token, session }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) throw new Error("useAuth must be used within an AuthProvider");

    return context;
}