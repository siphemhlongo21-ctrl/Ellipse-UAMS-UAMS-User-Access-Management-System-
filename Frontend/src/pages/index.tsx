import { ChevronRight, Loader } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../layout";
import Login from "./auth/Login";
import { useAuth } from "../context/AuthProvider";
import { accountApi } from "../api";
import { useEffect, useState } from "react";

export default function Index() {
    const { session, setUserToken, setUserSession } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(session === null);

    useEffect(() => {
        if (session === null) {

            const token = sessionStorage.getItem("access_token");
            const currentRole = sessionStorage.getItem("current_role");

            if (!token || !currentRole) {
                navigate("/login", { replace: true });
                setLoading(false);
            }

            accountApi.validateToken().then(data => {

                if (data === undefined || data === null) {
                    navigate("/login", { replace: true });
                    setLoading(false);
                    return <Login />;
                }

                if (data) {

                    const roleExist = data.user.roles?.find(x => x === currentRole);

                    if (!roleExist) {
                        navigate("/login", { replace: true });
                        setLoading(false);
                        return <Login />;
                    }

                    setUserSession({ ...data.user, roles: [currentRole ?? ''] });
                    setUserToken(data.token);
                }
            }).finally(() => setLoading(false))

        }
    }, []);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>

            {loading &&
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader className="animate-spin w-16 h-16 text-indigo-600" />
                        <p className="text-sm font-bold text-white">Loading...</p>
                    </div>
                </div>
            }
            {!loading &&
                <>
                    {/* Sidebar */}
                    <Sidebar />
                    {/* Main */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <header className="h-12 border-b border-border flex items-center justify-between px-5 shrink-0 bg-white shadow-sm">
                            <div className="flex items-center gap-2 text-xs text-foreground/40">
                                <span className="font-semibold text-foreground/60">Ellipse User Access Management System</span>
                                <ChevronRight size={12} />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-foreground/40 hidden sm:block">
                                    {new Date().toLocaleDateString("en-ZA", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                                </span>
                                {/* <NotificationBell /> */}
                            </div>
                        </header>

                        <main className="flex-1 overflow-auto bg-background">
                            <Outlet />
                        </main>
                    </div>
                </>
            }

        </div>
    );
}