import { useState } from "react";
import { Shield, X, Check } from "lucide-react";

const POPIA_CLAUSES = [
    "I declare that all information and supporting documentation submitted as part of this Ellipse User Access Request is true, accurate and complete to the best of my knowledge. I undertake to notify the Municipality of any changes that may affect the accuracy of the information provided.",
    "I acknowledge and consent to eThekwini Municipality collecting, processing, storing and using my personal information and supporting documentation for the purpose of administering, reviewing, approving, implementing, monitoring and auditing access to the Ellipse system.",
    "I understand that my personal information and supporting documents may be accessed by authorised Municipal employees involved in the user access management process, including Line Managers, Training Verification personnel, ICT personnel, HC Systems personnel, Internal Audit, and other authorised officials who require such information to perform their duties.",
    "I acknowledge that eThekwini Municipality may disclose my personal information to authorised service providers, regulatory bodies, law enforcement agencies, auditors, or other parties where required by law, regulation, contractual obligation, or for the fulfilment of legitimate municipal business requirements.",
    "I understand that all personal information and supporting documentation will be stored and protected in accordance with the Protection of Personal Information Act (POPIA), municipal records management requirements, and applicable information security standards.",
    "I will not hold the Municipality liable for any unauthorised access, disclosure or use of information that occurs despite the implementation of reasonable security measures and is beyond the Municipality's reasonable control.",
    "I confirm that I have read, understood and agree to the processing of my personal information for the purposes of managing and administering Ellipse user access requests and related access management activities.",
];

export function POPIAModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
    const [agreed, setAgreed] = useState(false);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 bg-blue-700 rounded-t-2xl flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-white shrink-0" />
                        <p className="text-sm font-bold text-white">Protection of Personal Information Act (POPIA) Declaration</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded text-blue-200 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                {/* Scrollable clauses */}
                <div className="overflow-y-auto flex-1 px-5 py-4">
                    <ol className="text-xs text-foreground/80 space-y-3 leading-relaxed list-decimal list-inside">
                        {POPIA_CLAUSES.map((c, i) => (
                            <li key={i} className="pb-3 border-b border-border last:border-0 last:pb-0">
                                <span className="ml-1">{c}</span>
                            </li>
                        ))}
                    </ol>
                </div>
                {/* Confirmation footer */}
                <div className="px-5 py-4 border-t border-border bg-blue-50 rounded-b-2xl space-y-3 shrink-0">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={e => setAgreed(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-blue-300 accent-blue-700 cursor-pointer shrink-0"
                        />
                        <span className={`text-xs font-semibold leading-relaxed ${agreed ? "text-emerald-700" : "text-blue-900"}`}>
                            I confirm that I have read and agree to all of the above declarations.
                        </span>
                    </label>
                    <div className="flex gap-2">
                        <button
                            disabled={!agreed}
                            onClick={() => { if (agreed) { onConfirm(); onClose(); } }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${!agreed ? "bg-muted text-foreground/30 border border-border cursor-not-allowed" : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm"}`}>
                            <Check size={14} /> Confirm Declaration
                        </button>
                        <button onClick={onClose} className="px-4 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold text-foreground/60 hover:bg-muted transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
