import { ChevronRight } from "lucide-react";
import { getRequest } from "../../api/requestsApi";
import { RequestDetail } from "../../components/request/RequestDetail";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { RequestDetails } from "../../api";
import Login from "../auth/Login";
import { useAuth } from "../../context/AuthProvider";

export function ViewRequest() {
    const { session } = useAuth();
    const [selected, setSelected] = useState<RequestDetails | null>();
    const navigate = useNavigate();
    const location = useLocation();

    if (session === null) {
        return <Login />;
    }

    // Retrieve the original route or default to home/requests
    const from = location.state?.from?.pathname || "/requests";
    const { requestId } = useParams();

    function loadRequest() {
        useEffect(() => {
            let cancelled = false;
            async function load(requestId: number) {
                try {
                    const data = await getRequest(requestId);

                    if (!cancelled) {
                        setSelected(data);
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            void load(Number(requestId));
            return () => {
                cancelled = true;
            };
        }, []);
    }

    loadRequest();

    return (
        <div className="flex flex-col h-full">
            <div className="px-5 py-3 border-b border-border bg-white flex items-center gap-3 shadow-sm">
                <button onClick={() => navigate(from, { replace: true })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60 hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted">
                    <ChevronRight size={13} className="rotate-180" /> Back to Requests
                </button>
                <span className="text-foreground/30">|</span>
                <span className="text-xs font-mono text-foreground/50">{selected?.id}</span>
                <span className="text-foreground/30">|</span>
                <span className="text-xs text-foreground/50">{selected?.employeeName ?? selected?.contractorName}</span>
                <span className="text-foreground/30">—</span>
                <span className="text-xs text-foreground/50">{selected?.userAccessType}</span>
            </div>
            <div className="flex-1 overflow-auto">
                <RequestDetail req={selected!} onClose={() => navigate(from, { replace: true })} onReload={loadRequest} />
            </div>
        </div>
    );
}