
import { ChevronDown } from "lucide-react";

export function SelectField({ label, required, options, placeholder, value, onChange, error }: { label: string; required?: boolean; options: string[]; placeholder?: string; value?: string; onChange?: (value: string) => void; error?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value ?? ""}
                    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                    className={`w-full appearance-none pl-3 pr-8 py-2.5 bg-white border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer shadow-sm ${error ? "border-red-400" : "border-border"}`}>
                    <option value="">{placeholder ?? `Select ${label.toLowerCase()}...`}</option>
                    {options.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
            </div>
            {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
        </div>
    );
}