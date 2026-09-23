import { CircleDashed } from "lucide-react";
import { STATUS_CONFIG } from "../../utilities/status_config";

const FALLBACK = { label: "Unknown", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: <CircleDashed size={11} /> };

export function StatusBadge({ status }: { status: string }) {
    const c = STATUS_CONFIG[status] ?? FALLBACK;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.color} ${c.bg} ${c.border}`}>
            {c.icon}{c.label}
        </span>
    );
}