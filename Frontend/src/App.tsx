import Login from "./pages/auth/Login";
import { type UserSession } from "./types/UserSession";
import { useState } from "react";
import { useCallback } from "react";
import { logoutApiIdentity } from "./app/apiBridge";
import { type View } from "./types/index";
import { Building2, Database, BarChart3, ChevronRight, LogIn } from "lucide-react";
import { RequestList } from "./pages/request/Requests";
import { LayoutDashboard, FileText } from "lucide-react";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { NewRequestModal } from "./components/request/NewRequestModal";
import { NotificationBell } from "./components/controls/NotificationBell";
import { AuditHistory } from "./pages/AuditHistory";
import { Reports } from "./pages/Reports";
import { DomeLogo } from "./utilities/DomeLogo";
import { ROLE_LABELS } from "./utilities";
import { NewRequestForm } from "./pages/request/NewRequestForm";
import type { RequestDetails } from "./api";
import { getEmployeeRequests, GetLineManagerRequestsByEmail, getICTManagerRequests } from "./api/requestsApi";
import UpdateRequest from "./pages/UpdateRequest";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [showReqModal, setShowReqModal] = useState(false);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [liveRequests, setLiveRequests] = useState<RequestDetails[] | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);

  const refreshRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      if (session?.roles?.includes("EMPLOYEE")) {
        const rows = await getEmployeeRequests(session.email);
        setLiveRequests(rows as RequestDetails[]);
      }

      if (session?.roles?.includes("LINE_MANAGER")) {
        const rows = await GetLineManagerRequestsByEmail(session.email);
        setLiveRequests(rows as RequestDetails[]);
      }

      if (session?.roles?.includes("ICT_MANAGER")) {
        const rows = await getICTManagerRequests();
        setLiveRequests(rows as RequestDetails[]);
        console.log(22, rows);
      }
    } catch (err) {
      setRequestsError(err instanceof Error ? err.message : "Failed to load requests");
      setLiveRequests(null);
    } finally {
      setRequestsLoading(false);
    }
  }, [session]);

  const handleLogout = () => {
    logoutApiIdentity();
    setLiveRequests(null);
    setRequestsError(null);
    setSession(null);
    setView("login");
  };

  const goToRequest = (id: string) => {
    setOpenRequestId(id);
    setView("requests");
  };

  const goToUpdateRequest = (id: string) => {
    setOpenRequestId(id);
    setView("update-request");
  };

  if (!session) return <Login />;

  const requestSource = liveRequests ?? [];

  const navItems: { id: View; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "requests" as View, label: "Requests", icon: <FileText size={16} />, badge: requestSource.filter(r => r.status === "pending" || r.status === "Training Verification Pending" || r.status === "ICT Manager Approval Pending" || r.status === "pending-hc-implementation").length },
    ...(session.roles?.includes("LINE_MANAGER")
      ? [{
        id: "contractors" as View,
        label: "Contractors",
        icon: <Building2 size={16} />,
        badge: requestSource.filter(r =>
          r.userType === "Contractor" && (r.status === "Awaiting Resubmission" || r.status === "awaiting-information"),
        ).length || undefined,
      }] : []),
    ...(["ICT_MANAGER", "HC_SYSTEMS_OFFICER", "deputy-head"].some(role => session.roles?.includes(role))
      ? [{ id: "reports" as View, label: "Reports", icon: <BarChart3 size={16} /> }] : []),
    ...(session.roles?.includes("HC_SYSTEMS_OFFICER")
      ? [{ id: "history" as View, label: "Audit & History", icon: <Database size={16} />, badge: requestSource.filter(r => r.status === "Awaiting Resubmission" || r.status === "awaiting-information").length || undefined }] : []),
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <aside className="w-56 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 mb-2">
            <DomeLogo size={34} />
            <div>
              <div className="text-xs font-bold text-white leading-tight" style={{ fontFamily: "Barlow, sans-serif" }}>eThekwini</div>
              <div className="text-[10px] text-sidebar-foreground/60 leading-tight">Electricity & Energy</div>
            </div>
          </div>
          <div className="pt-2 border-t border-sidebar-border">
            <p className="text-[9px] text-sidebar-foreground/40 font-mono tracking-widest uppercase">Ellipse UAM System</p>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left group
                ${view === item.id ? "bg-sidebar-accent text-white font-semibold" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"}`}>
              <span className={`transition-colors ${view === item.id ? "text-accent" : "text-sidebar-foreground/50 group-hover:text-accent"}`}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-primary" style={{ background: "#2ab8b0" }}>
              {session.displayName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{session.displayName}</div>
              <div className="text-[10px] text-sidebar-foreground/50 truncate">{ROLE_LABELS[session.roles?.find(x => x !== undefined) ?? ""]}</div>
            </div>
            <button onClick={handleLogout} title="Sign out" className="text-sidebar-foreground/40 hover:text-red-400 transition-colors p-1 rounded">
              <LogIn size={13} className="rotate-180" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-border flex items-center justify-between px-5 shrink-0 bg-white shadow-sm">
          <div className="flex items-center gap-2 text-xs text-foreground/40">
            <span className="font-semibold text-foreground/60">Ellipse UAM</span>
            <ChevronRight size={12} />
            <span className="text-foreground font-semibold capitalize">{view.replace(/-/g, " ")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-foreground/40 hidden sm:block">
              {new Date().toLocaleDateString("en-ZA", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
            </span>
            <NotificationBell
              role={session.roles?.find(x => x !== undefined) ?? null}
              userName={session.email}
              onOpenRequest={goToRequest}
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          {view === "dashboard" && <Dashboard session={session} requests={requestSource} onNewRequest={session.roles?.includes("LINE_MANAGER") ? () => setShowReqModal(true) : () => setView("new-request")} onGoToRequests={() => setView("requests")} onOpenRequest={goToRequest} />}
          {view === "requests" && <RequestList session={session} onNewRequest={session.roles?.includes("LINE_MANAGER") ? () => setShowReqModal(true) : () => setView("new-request")} onUpdateRequest={goToUpdateRequest} initialSelectedId={openRequestId} onClearSelected={() => setOpenRequestId(null)} liveRequests={liveRequests ?? undefined} requestsLoading={requestsLoading} requestsError={requestsError} onRefreshRequests={() => void refreshRequests()} />}
          {view === "reports" && <Reports />}
          {view === "new-request" && <NewRequestForm onClose={() => setView("dashboard")} submitterRole={session.roles?.find(x => x !== undefined)} session={session ?? undefined} onSubmitted={() => void refreshRequests()} requests={requestSource} />}
          {view === "history" && <AuditHistory requests={requestSource} />}
          {view === "update-request" && <UpdateRequest />}
        </main>

        {showReqModal && (
          <NewRequestModal
            onEmployee={() => { setShowReqModal(false); setView("new-request"); }}
            onContractor={() => { setShowReqModal(false); setView("contractors"); }}
            onClose={() => setShowReqModal(false)}
          />
        )}
      </div>
    </div>
  );
}


