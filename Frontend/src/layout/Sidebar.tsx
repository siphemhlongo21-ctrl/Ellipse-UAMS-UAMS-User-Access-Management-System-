import { useNavigate } from "react-router-dom";
import { IconLogout } from "../components/controls/icons";
import styles from "./Sidebar.module.css";
import { useAuth } from "../context/AuthProvider";
import { ROLE_LABELS } from "../utilities";
import { DomeLogo } from "../utilities/DomeLogo";
import { LayoutDashboard, FileText, BarChart3, Shield, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const [view, setView] = useState<string>("dashboard");
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const roles = session?.roles ?? [];
  const isHcSystems = roles.includes("HC_SYSTEMS_OFFICER");
  const isSystemAdmin = roles.includes("SYSTEM_ADMIN");

  const navItems: { id: string; label: string; icon: React.ReactNode; path: string; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/dashboard" },
    { id: "requests", label: "Requests", icon: <FileText size={16} />, path: "/requests" },
    ...(isHcSystems
      ? [{ id: "reports", label: "Reports", icon: <BarChart3 size={16} />, path: "/reports" }]
      : []),
    //To be implemented in phase 2
    // ...(isHcSystems
    //   ? [{ id: "history", label: "Audit & History", icon: <Database size={16} />, path: "/history" }]
    //   : []),
    ...(isSystemAdmin
      ? [{ id: "users", label: "Users", icon: <Users size={16} />, path: "/admin/users" }]
      : []),
    ...(isSystemAdmin
      ? [{ id: "roles", label: "Role management", icon: <Shield size={16} />, path: "/admin/roles" }]
      : []),
    ...(isSystemAdmin
      ? [{ id: "role-permissions", label: "Role Permissions management", icon: <Shield size={16} />, path: "/admin/role-permissions" }]
      : []),
    ...(isSystemAdmin
      ? [{ id: "permissions", label: "Permission Management", icon: <ShieldCheck size={16} />, path: "/admin/permissions" }]
      : []),
  ];

  return (
    <aside className="w-56 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="p-4 border-b border-sidebar-border" style={{ color: "#ffffff" }}>
        <div className="flex items-center gap-2.5 mb-2">
          <DomeLogo size={34} />
          <div>
            <div className="text-xs font-bold text-white leading-tight" style={{ fontFamily: "Barlow, sans-serif" }}>
              eThekwini
            </div>
            <div className="text-[10px] text-sidebar-foreground/60 leading-tight">Electricity and Energy</div>
          </div>
        </div>
        <div className="pt-2 border-t border-sidebar-border">
          <p className="text-[9px] text-sidebar-foreground/40 font-mono tracking-widest uppercase">
            Ellipse User Access Management System
          </p>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id);
              navigate(item.path, { replace: true });
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left group
                ${view === item.id
                ? "bg-sidebar-accent text-white font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
              }`}
          >
            <span
              className={`transition-colors ${view === item.id
                  ? "text-accent"
                  : "text-sidebar-foreground/50 group-hover:text-accent"
                }`}
            >
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-primary"
            style={{ background: "#2ab8b0" }}
          >
            {session?.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{session?.displayName}</div>
            <div className="text-[10px] text-sidebar-foreground/50 truncate">
              {ROLE_LABELS[session?.roles?.find((x) => x !== undefined) ?? ""]}
            </div>
          </div>
          <button
            type="button"
            className={styles.logout}
            aria-label="Sign out"
            title="Log out"
            onClick={handleLogout}
          >
            <IconLogout width={18} height={18} color="#ffffff" />
          </button>
        </div>
      </div>
    </aside>
  );
}