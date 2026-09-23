const ENV_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  PROD: { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  TEST: { color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
  DEV: { color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  ALL: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
}; 

export function EnvBadge({ env }: { env: string }) {
  const c = ENV_CONFIG[env] ?? ENV_CONFIG.ALL;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border ${c.color} ${c.bg} ${c.border}`}>
      {env}
    </span>
  );
}