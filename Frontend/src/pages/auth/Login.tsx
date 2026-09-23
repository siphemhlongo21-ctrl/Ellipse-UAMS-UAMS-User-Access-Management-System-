import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import { DomeLogo } from "../../utilities/DomeLogo";
import { AlertCircle, Eye, Lock, User, EyeOff, ChevronRight, Shield } from "lucide-react";
import { ROLE_LABELS } from "../../utilities";
import { ROLE_DESCRIPTIONS } from "../../utilities/role_descriptions";
import type { UserSession } from "../../types/UserSession";

export default function Login() {
    const [showRolePicker, setShowRolePicker] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve the original route or default to home/dashboard
    const from = location.state?.from?.pathname || "/dashboard";
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const { login, session, setUserSession } = useAuth();

    useEffect(() => {
        const remembered = sessionStorage.getItem("remember_ad_username");
        if (remembered) {
            setUsername(remembered);
            setRemember(true);
        }
    }, []);

    const DURBAN_BG = "https://images.unsplash.com/photo-1682065936841-6bb7f68207b7?w=900&h=1200&fit=crop&auto=format";

    const handleLoginAs = async (user: UserSession, roles: string[]) => {

        let updatedUser = user;
        updatedUser.roles = roles;

        setUserSession(updatedUser);
        navigate(from, { replace: true });
    };

    const handleCancel = () => {
        setShowRolePicker(false);
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("current_role");
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) { setError("Please enter your email."); return; }
        if (!password.trim()) { setError("Please enter your password."); return; }

        setBusy(true);
        setError("");
        try {

            const user = await login(username, password);

            if (!user) {
                setError("Invalid login details");
                return;
            }

            if (user.roles?.length === 1 && user.roles?.includes("EMPLOYEE")) {

                setUserSession(user);
                navigate(from, { replace: true });
                return;
            }
            setShowRolePicker(true);

            if (remember) {
                sessionStorage.setItem("remember_ad_username", username.trim());
            } else {
                sessionStorage.removeItem("remember_ad_username");
            }
        } catch (err) {
            const aborted = err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError");
            const message = err instanceof Error ? err.message : "Login failed";
            if (aborted || /failed to fetch|networkerror|load failed/i.test(message)) {
                setError("Cannot reach the API. Start the backend on http://localhost:5190, then try again.");
                return;
            }
            setError(message.replace(/^"|"$/g, ""));
        } finally {
            setBusy(false);
        }
    };

    /* shared input style — matches the reference: white bg, light gray border, rounded-xl */
    const inputCls = "w-full bg-white border border-[#d8dde6] rounded-xl text-sm text-[#1a2040] placeholder:text-[#b0b8c8] focus:outline-none focus:ring-2 focus:ring-[#1a3fb5] focus:border-[#1a3fb5] transition-colors";


    return (
        <div className="min-h-screen flex" style={{ fontFamily: "Inter, sans-serif" }}>

            {/* ── LEFT: Durban photo + branding ── */}
            <div className="hidden lg:flex lg:w-[46%] relative flex-col items-center justify-center overflow-hidden">
                {/* City photo */}
                <img
                    src={DURBAN_BG}
                    alt="Durban city aerial view"
                    decoding="async"
                    fetchPriority="low"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Deep-blue overlay matching the reference */}
                <div className="absolute inset-0" style={{ background: "rgba(10,28,90,0.70)" }} />

                {/* Branding content */}
                <div className="relative z-10 flex flex-col items-center text-center px-12 select-none">
                    <DomeLogo size={180} />
                    <div className="mt-8 mb-6 w-14 h-[2px] bg-white/30 rounded-full" />
                    <h2 className="text-white font-bold text-[19px] leading-snug mb-3"
                        style={{ fontFamily: "Barlow, sans-serif" }}>
                        Welcome to eThekwini Municipality
                    </h2>
                    <p className="text-white/65 text-[13.5px] leading-relaxed max-w-[260px]">
                        Sign in to access municipal services,<br />manage your account and more.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col" style={{ background: "#edf0f5" }}>

                {/* Mobile-only top bar */}
                <div className="lg:hidden flex items-center gap-3 px-5 py-3.5 bg-white border-b border-[#e0e4ec]">
                    <DomeLogo size={34} />
                    <div>
                        <p className="text-sm font-bold text-[#1a2040]" style={{ fontFamily: "Barlow, sans-serif" }}>eThekwini Municipality</p>
                        <p className="text-[10px] text-[#8a94a6]">Ellipse Access Management</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-6 py-10">
                    <div className="w-full max-w-[420px]">

                        {/* ── White card ── */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.10)] px-8 pt-8 pb-7">

                            {/* Title */}
                            <h1 className="text-[32px] font-bold text-[#1a2040] leading-none mb-1"
                                style={{ fontFamily: "Barlow, sans-serif" }}>Login</h1>
                            <p className="text-[13.5px] text-[#8a94a6] mb-6">Please enter your credentials to continue.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Username / Email */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-[#1a2040] mb-1.5">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0b8c8]" />
                                        <input
                                            type="email"
                                            value={username}
                                            onChange={e => { setUsername(e.target.value); setError(""); }}
                                            placeholder="e.g. admin.demo@ethekwini.gov.za"
                                            className={`${inputCls} pl-10 pr-4 py-3.5`}
                                            autoComplete="email"
                                            disabled={busy}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-[#1a2040] mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0b8c8]" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setError(""); }}
                                            placeholder="Enter your password"
                                            className={`${inputCls} pl-10 pr-11 py-3.5`}
                                            autoComplete="current-password"
                                            disabled={busy}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b8c8] hover:text-[#1a2040]"
                                            tabIndex={-1}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember me + Forgot password */}
                                <div className="flex items-center justify-between pt-0.5">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={e => setRemember(e.target.checked)}
                                            className="w-4 h-4 rounded border-[#d8dde6] accent-[#1a3fb5] cursor-pointer"
                                        />
                                        <span className="text-[13px] text-[#3a4760]">Remember me</span>
                                    </label>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                                        <AlertCircle size={13} className="shrink-0" /> {error}
                                    </div>
                                )}

                                {/* Login button */}
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white tracking-wide transition-all hover:brightness-110 active:scale-[0.98] shadow-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{ background: "#1a3fb5" }}
                                >
                                    {busy ? "Signing in…" : "Login"}
                                </button>

                            </form>
                        </div>

                        {/* Below-card footer */}
                        <p className="text-center text-[12px] text-[#8a94a6] mt-5 leading-relaxed">
                            By logging in, you agree to our{" "}
                            <span className="text-[#1a3fb5] font-semibold cursor-pointer hover:underline">Terms of Use</span>
                            {" "}and{" "}
                            <span className="text-[#1a3fb5] font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
                        </p>
                    </div>
                </div>
            </div>

            {
                showRolePicker && session && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#d8dde6] overflow-hidden">

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-[#e8edf5]" style={{ background: "#f6f8fc" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "#1a2d6e" }}>
                                        {session?.displayName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-[#1a2040]">{session?.displayName}</p>
                                        <p className="text-[11px] text-[#8a94a6]">{session?.email}</p>
                                    </div>
                                </div>
                                <p className="text-[12.5px] text-[#6b7a99] mt-3">
                                    Select how you are logging in for this session.
                                </p>
                            </div>

                            {/* All options in one list */}
                            <div className="px-6 py-4 space-y-2 max-h-[55vh] overflow-y-auto">

                                {session?.roles && (
                                    <div>
                                        <div className="space-y-2">
                                            {session?.roles?.map(r => (
                                                <button key={r}
                                                    onClick={() => {
                                                        handleLoginAs(session, [r]);
                                                        setShowRolePicker(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 border-[#e8edf5] hover:border-[#1a3fb5] hover:bg-[#f0f4ff] transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#1a3fb5] transition-colors"
                                                            style={{ background: "#eef1f8" }}>
                                                            <Shield size={16} className="text-[#1a2d6e] group-hover:text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[13px] font-bold text-[#1a2040]">{ROLE_LABELS[r]}</p>
                                                            </div>
                                                            <p className="text-[11px] text-[#8a94a6] mt-0.5">{ROLE_DESCRIPTIONS[r]}</p>
                                                        </div>
                                                        <ChevronRight size={15} className="text-[#c0c8d8] group-hover:text-[#1a3fb5] shrink-0 transition-colors" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-[#e8edf5] bg-[#f6f8fc] flex justify-end">
                                <button onClick={handleCancel}
                                    className="px-4 py-2 text-xs font-semibold text-[#6b7a99] hover:text-[#1a2040] transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
