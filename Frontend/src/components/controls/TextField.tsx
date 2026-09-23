import { AlertCircle } from "lucide-react";
import type React from "react";

export function TextField({ 
    label, 
    required, 
    placeholder, 
    type = "text", 
    value, 
    onChange, 
    error, 
    readOnly,
    inputMode,
    maxLength,
    max
}: { 
    label: string; 
    required?: boolean; 
    placeholder?: string; 
    type?: string; 
    value?: string; 
    onChange?: (value: string) => void; 
    error?: string; 
    readOnly?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    maxLength?: number;
    max?: string;
}) {
    const inputCls =
        "w-full px-3 py-2.5 border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 shadow-sm";
    const borderCls = error
        ? "border-red-400 focus:ring-red-400 focus:border-red-400"
        : "border-border focus:ring-accent focus:border-accent";

    return (
        <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input 
                type={type}
                inputMode={inputMode}
                maxLength={maxLength}
                max={max}
                placeholder={placeholder}
                value={onChange ? (value ?? "") : undefined}
                onChange={onChange ? (e) => onChange?.(e.target.value) : undefined}
                readOnly={readOnly}
                className={`${inputCls} ${borderCls} ${readOnly ? "bg-muted/50 text-foreground/70 cursor-not-allowed" : "bg-white"}`}
            />
            {error && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {error}
                </p>
            )}
        </div>
    );
}