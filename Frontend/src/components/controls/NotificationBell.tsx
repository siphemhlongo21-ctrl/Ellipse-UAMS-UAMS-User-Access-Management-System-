import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, FileText, Loader, X } from "lucide-react";
import { notificationsApi, ApiError, type AppNotificationDetails } from "../../api";

function sortLatestFirst(items: AppNotificationDetails[]): AppNotificationDetails[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.floor((now - then) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface NotificationBellProps {
  role: string | null;
  userName: string;
  onOpenRequest?: (requestNumberOrId: string) => void;
}

export function NotificationBell({ role: _role, userName: _userName, onOpenRequest }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AppNotificationDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter(n => !n.isRead).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await notificationsApi.mine(50);
      setItems(sortLatestFirst(summary.items ?? []));
    } catch (err) {
      setItems([]);
      setError(
        err instanceof ApiError
          ? `Notifications unavailable (API ${err.status})`
          : "Notifications unavailable",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  const markRead = async (id: number) => {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationsApi.markRead(id);
    } catch {
      /* keep optimistic UI */
    }
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      /* keep optimistic UI */
    }
  };

  const handleItemClick = async (n: AppNotificationDetails) => {
    if (!n.isRead) await markRead(n.id);
    const target = n.requestNumber ?? (n.requestId != null ? String(n.requestId) : null);
    if (target) {
      onOpenRequest?.(target);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative text-foreground/40 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,380px)] rounded-xl border border-border bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
            <div>
              <p className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                Notifications
              </p>
              <p className="text-[10px] text-foreground/45">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} · latest first
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-1.5 text-[10px] text-amber-700 bg-amber-50 border-b border-amber-100">
              {error}
            </div>
          )}

          <div className="max-h-[min(70vh,420px)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader className="animate-spin w-16 h-16 text-indigo-600" />
                        <p className="text-sm font-bold text-white">Loading...</p>
                    </div>
                </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-xs text-foreground/40">No notifications yet.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {items.map(n => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleItemClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex gap-3 ${
                        !n.isRead ? "bg-accent/5" : "bg-white"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                          !n.isRead ? "bg-amber-50 border-amber-200" : "bg-muted border-border"
                        }`}
                      >
                        <FileText size={14} className={!n.isRead ? "text-amber-600" : "text-foreground/40"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs leading-snug ${!n.isRead ? "font-bold text-foreground" : "font-semibold text-foreground/80"}`}>
                            {n.title ?? "Notification"}
                          </p>
                          {!n.isRead && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                        </div>
                        {n.body && (
                          <p className="text-[11px] text-foreground/55 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-foreground/40">
                          <span className="font-mono">{formatRelativeTime(n.createdAt)}</span>
                          {n.requestNumber && (
                            <>
                              <span>·</span>
                              <span className="font-mono font-semibold text-primary">{n.requestNumber}</span>
                            </>
                          )}
                          {n.category && (
                            <>
                              <span>·</span>
                              <span>{n.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.some(n => !n.isRead) === false && items.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-1.5 text-[10px] text-foreground/40">
              <Check size={11} /> All notifications read
            </div>
          )}
        </div>
      )}
    </div>
  );
}
