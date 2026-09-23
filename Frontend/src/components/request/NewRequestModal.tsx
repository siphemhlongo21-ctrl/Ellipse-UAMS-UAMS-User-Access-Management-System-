
import { useEffect } from "react";
import { ChevronRight, UserCheck, Briefcase, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

// â”€â”€â”€ New Request Type Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface NewRequestModalProps {
    onClose: () => void;
}

export function NewRequestModal({ onClose }: NewRequestModalProps) {
    const navigate = useNavigate();

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                        New Access Request
                    </h2>
                    <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-foreground/40 hover:text-foreground hover:bg-muted transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm text-foreground/60">Choose the request you want to submit.</p>
                    <button
                        onClick={() => navigate("/requests/employee/new", { replace: false })}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-white hover:border-accent hover:bg-accent/5 transition-all text-left group shadow-sm">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#edf2fb" }}>
                            <UserCheck size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">Employee Access</p>
                            <p className="text-[11px] text-foreground/50">Request or terminate access for an employee you manage</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto text-foreground/30 group-hover:text-accent transition-colors" />
                    </button>
                    <button
                        onClick={() => navigate("/requests/contractor/new", { replace: false })}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-white hover:border-accent hover:bg-accent/5 transition-all text-left group shadow-sm">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#edf2fb" }}>
                            <Briefcase size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">Contractor Access</p>
                            <p className="text-[11px] text-foreground/50">Request or terminate contractor access on the contractor&apos;s behalf</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto text-foreground/30 group-hover:text-accent transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
}
