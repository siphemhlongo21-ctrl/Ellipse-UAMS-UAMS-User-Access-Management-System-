import { useState } from "react";
import { DocumentViewerModal } from "../../components/DocumentViewerModal";
import { submitContractorRequest } from "../../app/apiBridge";
import { CheckCircle2, AlertCircle, Upload, Shield, Eye, Briefcase, X, Check, ArrowRight, ChevronDown, FileUp, Trash2, Loader } from "lucide-react";
import { type ViewerDocument } from "../../types/ViewerDocument";
import { useNavigate, useLocation } from "react-router-dom";
import { TextField } from "../../components/controls";
import { EnvBadge } from "../../components/controls/EnvBadge";
import { SelectField } from "../../components/controls/SelectField";
import { POPIAModal } from "../../components/POPIAModal";
import { useAuth } from "../../context/AuthProvider";
import { revokeViewerDocument, fileToViewerDocument, formatBytes, ROLE_LABELS } from "../../utilities";
import Login from "../auth/Login";
import { BRANCHES, DEPARTMENTS } from "../../types";

// ─── Contractor Form ──────────────────────────────────────────────────────────
interface DocFile { name: string; fileName: string | null; uploaded: boolean }

function isBlank(value: string | undefined) {
    return value?.trim() === "";
}

function digitsOnly(value: string) {
    return value.replace(/\D/g, "");
}

function isTenDigitPhone(value: string) {
    return /^\d{10}$/.test(value);
}

export function ContractorForm() {
    const { session } = useAuth();
    const navigate = useNavigate();

    const location = useLocation();
    // Retrieve the original route or default to home/requests
    const from = location.state?.from?.pathname || "/requests";

    const [step, setStep] = useState(1);
    const [requestKind, setRequestKind] = useState<"access" | "termination">("access");
    const [env, setEnv] = useState<"PROD" | "TEST" | "DEV">("TEST");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submittedRef, setSubmittedRef] = useState("EAM-2026-009");
    const [dept, setDept] = useState("");
    const [terminationDate, setTerminationDate] = useState("");
    const [terminationReason, setTerminationReason] = useState("");
    const [firstName, setFirstName] = useState("");
    const [surname, setSurname] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [identificationNumber, setIdentificationNumber] = useState("");
    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [contractStartDate, setContractStartDate] = useState("");
    const [contractEndDate, setContractEndDate] = useState("");
    const [businessJustification, setBusinessJustification] = useState("");
    const [userAccessType, setUserAccessType] = useState("Temporary/Acting");
    const [requestType, setRequestType] = useState("New User");
    const [ellipsePosition, setEllipsePosition] = useState("");
    const [positionToCopy, setPositionToCopy] = useState("");
    const [menuAccess, setMenuAccess] = useState("");
    const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
    const [docs, setDocs] = useState<DocFile[]>([
        { name: "Identity Document or Passport", fileName: null, uploaded: false },
        { name: "Contractor Identification Card", fileName: null, uploaded: false },
        { name: "Contract Documentation", fileName: null, uploaded: false },
    ]);
    const [docFiles, setDocFiles] = useState<Array<File | null>>([null, null, null]);
    const [viewingDoc, setViewingDoc] = useState<ViewerDocument | null>(null);

    const previewLocalFile = (label: string, file: File | null) => {
        if (!file) return;
        revokeViewerDocument(viewingDoc);
        setViewingDoc(fileToViewerDocument(label, file, session?.displayName));
    };

    const closeLocalPreview = () => {
        revokeViewerDocument(viewingDoc);
        setViewingDoc(null);
    };
    // Document verification fields — Verified By auto-filled from logged-in user
    const [docsVerified, setDocsVerified] = useState("");
    const [verifiedBy, setVerifiedBy] = useState(session?.displayName ?? "");
    const verifiedDate = new Date().toISOString().slice(0, 10);
    const [branch, setBranch] = useState("");
    const branchOptions = dept ? (BRANCHES[dept] ?? []) : [];

    const simulateUpload = (i: number) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.jpg,.jpeg,.png";
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            setDocFiles(prev => prev.map((f, idx) => (idx === i ? file : f)));
            setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, fileName: file.name, uploaded: true } : d));
        };
        input.click();
    };
    const removeDoc = (i: number) => {
        setDocFiles(prev => prev.map((f, idx) => (idx === i ? null : f)));
        setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, fileName: null, uploaded: false } : d));
    };
    const [contractorPopiaChecked, setContractorPopiaChecked] = useState(false);
    const [showContractorPopiaModal, setShowContractorPopiaModal] = useState(false);
    const isContractTermination = requestKind === "termination";
    const requiredOk = isContractTermination
        ? Boolean(terminationDate && terminationReason.trim())
        : Boolean(docs[0].uploaded && docs[1].uploaded && docsVerified && verifiedBy && verifiedDate && contractorPopiaChecked);

    const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

    // IMPORTANT: this early return must come AFTER all hooks (React rules of hooks).
    // Having it before the hooks previously broke state updates in the form.
    if (session === null) {
        return <Login />;
    }


    // Helper function for email validation
    function isValidEmail(email: string | undefined): boolean {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    // Helper function for SA ID validation (exactly 13 digits, numbers only)
    function isThirteenDigitId(id: string | undefined): boolean {
        if (!id) return false;
        return /^\d{13}$/.test(id);
    }

    // Enhanced validation for Contractor Step 1
    function validateContractorStep1(): Record<string, string> {
        const errors: Record<string, string> = {};

        // First Name — Required
        if (isBlank(firstName)) {
            errors.firstName = "Please enter First Name.";
        }

        // Surname — Required
        if (isBlank(surname)) {
            errors.surname = "Please enter Surname.";
        }

        // Company Name — Required
        if (isBlank(companyName)) {
            errors.companyName = "Please enter Contractor Company Name.";
        }

        // ID / Passport Number — Required + exactly 13 digits
        if (isBlank(identificationNumber)) {
            errors.identificationNumber = "Please enter ID / Passport Number.";
        } else if (!isThirteenDigitId(identificationNumber)) {
            errors.identificationNumber = "ID number must contain exactly 13 digits (numbers only).";
        }

        // Email — Required + valid format
        if (isBlank(email)) {
            errors.email = "Please enter Email Address.";
        } else if (!isValidEmail(email)) {
            errors.email = "Please enter a valid email address.";
        }

        // Contact Number — Required + 10 digits
        if (isBlank(contactNumber)) {
            errors.contactNumber = "Please enter Contact Number.";
        } else if (!isTenDigitPhone(contactNumber)) {
            errors.contactNumber = "Contact Number must be exactly 10 digits.";
        }

        // For termination requests, only the above fields are required
        if (isContractTermination) {
            return errors;
        }

        // Access request specific validations
        // (Access Level Type, Request Type and Menu Access live on Step 2 — validated there, not here)

        // Contract Start/End dates — required + end after start
        if (isBlank(contractStartDate)) errors.contractStartDate = "Please enter Contract Start Date.";
        if (isBlank(contractEndDate)) {
            errors.contractEndDate = "Please enter Contract End Date.";
        } else if (contractStartDate && new Date(contractEndDate) < new Date(contractStartDate)) {
            errors.contractEndDate = "Contract End Date must be on or after Start Date.";
        }

        // Department — Required
        if (isBlank(dept)) {
            errors.dept = "Please select Department.";
        }

        // Branch — Required if department is selected
        if (dept && isBlank(branch)) {
            errors.branch = "Please select Branch.";
        }

        // Business Justification — Required
        if (isBlank(businessJustification)) errors.businessJustification = "Please enter Business Justification.";

        return errors;
    }

    function validateContractorStep2(): Record<string, string> {
        if (isContractTermination) {
            const errors: Record<string, string> = {};
            if (isBlank(terminationDate)) errors.terminationDate = "Please enter Termination Date.";
            if (isBlank(terminationReason)) errors.terminationReason = "Please enter the reason for termination.";
            return errors;
        }
        // Access Requirements step — these fields live on step 2
        const errors: Record<string, string> = {};
        if (isBlank(userAccessType)) errors.userAccessType = "Please select Access Level Type.";
        if (isBlank(requestType)) errors.requestType = "Please select Request Type.";
        if (isBlank(menuAccess)) errors.menuAccess = "Please enter Menu Access / Modules.";
        return errors;
    }

    const steps = isContractTermination
        ? ["Contractor Details", "Termination Details", "Review & Submit"]
        : ["Personal Info", "Access Requirements", "Documents & Verification", "Review & Submit"];

    const submitContractorToApi = async () => {
        const errors = validateContractorStep1();
        if (Object.keys(errors).length > 0) {
            setStep1Errors(errors);
            setStep(1);
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const created = await submitContractorRequest({
                isTermination: isContractTermination,
                environment: env,
                firstName,
                surname,
                companyName,
                identificationNumber,
                email,
                contactNumber,
                department: dept,
                branch: branch,
                responsibleManager: session?.displayName ?? verifiedBy,
                businessJustification,
                contractStartDate,
                contractEndDate,
                terminationDate,
                terminationReason,
                ellipsePosition,
                menuAccess,
                userAccessType,
                positionToCopy,
                requestType,
                identityFile: docFiles[0],
                contractorCardFile: docFiles[1],
                contractFile: docFiles[2],
            });
            setSubmittedRef(created.id);
            setSubmitted(true);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Failed to submit contractor request");
        } finally {
            setSubmitting(false);
        }
    };

    const onClose = () => {
        navigate(from, { replace: true });
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-5 bg-background">
                <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                        {isContractTermination ? "Contract Termination Submitted" : "Request Submitted"}
                    </h2>
                    <p className="text-sm text-foreground/50 mt-2 max-w-sm">
                        {isContractTermination
                            ? "The contractor termination request has been submitted for implementation."
                            : "Your access request has been submitted. Your responsible manager will be notified to begin the approval workflow."}
                    </p>
                </div>
                <div className="bg-white border border-border rounded-xl px-6 py-4 text-left space-y-2 w-full max-w-sm shadow-sm">
                    {[
                        ["Request ID", submittedRef],
                        ["Request Type", isContractTermination ? "Terminate Contractor Access" : "Contractor Access"],
                        ["Next Step", isContractTermination ? "HC Systems Implementation" : "Responsible Manager Approval"],
                    ].map(([l, v]) => (
                        <div key={l} className="flex justify-between text-xs">
                            <span className="text-foreground/50 font-semibold">{l}</span>
                            <span className="font-mono font-bold text-primary">{v}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-foreground/50 font-semibold">Environment</span>
                        <EnvBadge env={env} />
                    </div>
                </div>
                <button onClick={() => navigate("/requests", { replace: true })} className="px-6 py-2.5 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm" style={{ background: "#1a2d6e" }}>
                    Return to Requests
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-background px-4 py-6 sm:px-6 lg:px-8">
            {submitting &&
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader className="animate-spin w-16 h-16 text-indigo-600" />
                        <p className="text-sm font-bold text-white">Submitting...</p>
                    </div>
                </div>}

            {!submitting && (
                <div className="flex min-h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
                    <div className="px-6 py-4 border-b border-border bg-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#edf2fb" }}>
                                <Briefcase size={16} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                                    {isContractTermination ? "Contractor Access Termination" : "Contractor Access Request"}
                                </h2>
                                <p className="text-[11px] text-foreground/50">
                                    {isContractTermination
                                        ? "Ellipse EAM — Contract termination by Line Manager"
                                        : "Ellipse EAM — Temporary Access Application"}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-muted transition-colors"><X size={16} /></button>
                    </div>

                    <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                        <Shield size={12} className="text-blue-600 shrink-0" />
                        <p className="text-[11px] text-blue-700">Your personal information is collected in accordance with POPIA. Documents are stored securely and access is restricted to authorised personnel.</p>
                    </div>

                    <div className="px-6 py-4 border-b border-border bg-white">
                        <div className="flex items-center">
                            {steps.map((s, i) => (
                                <div key={s} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all
                  ${i + 1 < step ? "border-emerald-500 bg-emerald-50 text-emerald-600" : i + 1 === step ? "border-accent bg-accent/10 text-accent" : "border-border bg-white text-foreground/30"}`}>
                                            {i + 1 < step ? <Check size={12} /> : i + 1}
                                        </div>
                                        <span className={`text-[10px] mt-1 whitespace-nowrap font-semibold ${i + 1 === step ? "text-accent" : "text-foreground/40"}`}>{s}</span>
                                    </div>
                                    {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 mb-4 ${i + 1 < step ? "bg-emerald-400" : "bg-border"}`} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto px-6 py-6">
                        {step === 1 && (
                            <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
                                        Request Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={requestKind}
                                            onChange={(e) => {
                                                setRequestKind(e.target.value as "access" | "termination");
                                                setStep(1);
                                            }}
                                            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer shadow-sm"
                                        >
                                            <option value="access">Request Contractor Access</option>
                                            <option value="termination">Terminate Contractor Access / Contract</option>
                                        </select>
                                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-foreground/50">
                                        The Line Manager submits contractor access and termination requests on the contractor&apos;s behalf.
                                    </p>
                                </div>

                                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                                    {isContractTermination ? "Contractor Details" : "Contractor Personal Information"}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <TextField label="First Name" required placeholder="e.g. Marcus" value={firstName} onChange={(v) => { setFirstName(v); if (step1Errors.firstName) setStep1Errors(e => ({ ...e, firstName: "" })); }} error={step1Errors.firstName} />
                                    <TextField label="Surname" required placeholder="e.g. Van Der Berg" value={surname} onChange={(v) => { setSurname(v); if (step1Errors.surname) setStep1Errors(e => ({ ...e, surname: "" })); }} error={step1Errors.surname} />
                                    <TextField label="Contractor Company Name" required placeholder="e.g. Siemens SA" value={companyName} onChange={(v) => { setCompanyName(v); if (step1Errors.companyName) setStep1Errors(e => ({ ...e, companyName: "" })); }} error={step1Errors.companyName} />
                                    <TextField
                                        label="ID / Passport Number"
                                        required
                                        placeholder="e.g. 8901125678091"
                                        inputMode="numeric"
                                        maxLength={13}
                                        value={identificationNumber}
                                        onChange={(v) => {
                                            setIdentificationNumber(digitsOnly(v).slice(0, 13));
                                            if (step1Errors.identificationNumber) setStep1Errors(e => ({ ...e, identificationNumber: "" }));
                                        }}
                                        error={step1Errors.identificationNumber}
                                    />
                                    <TextField label="Email Address" required placeholder="contractor@company.co.za" type="email" value={email} onChange={(v) => { setEmail(v); if (step1Errors.email) setStep1Errors(e => ({ ...e, email: "" })); }} error={step1Errors.email} />

                                    <TextField
                                        label="Contact Number"
                                        required placeholder="e.g. 031 311 2345"
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        value={contactNumber}
                                        onChange={(v) => {
                                            setContactNumber(digitsOnly(v).slice(0, 10));
                                            if (step1Errors.contactNumber) setStep1Errors((e) => ({ ...e, contactNumber: "" }));
                                        }}
                                        error={step1Errors.contactNumber}
                                    />
                                    {!isContractTermination ? (
                                        <>
                                            <TextField label="Contract Start Date" required type="date" value={contractStartDate} onChange={setContractStartDate} />
                                            <TextField label="Contract End Date" required type="date" value={contractEndDate} onChange={setContractEndDate} />
                                        </>
                                    ) : null}
                                </div>
                                {!isContractTermination ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Department — dropdown */}
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <select value={dept} onChange={e => {
                                                setDept(e.target.value);
                                                setBranch("");
                                                if (step1Errors.dept) setStep1Errors(x => ({ ...x, dept: "" }));
                                                if (step1Errors.branch) setStep1Errors(x => ({ ...x, branch: "" }));
                                            }}
                                                className="w-full appearance-none pl-3 pr-8 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                                                <option value="">Select department...</option>
                                                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                        {step1Errors.dept && <p className="text-[11px] text-red-600 mt-1">{step1Errors.dept}</p>}
                                    </div>

                                    {/* Branch — dropdown, dependent on department */}
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Branch <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <select disabled={!dept} onChange={e => {
                                                setBranch(e.target.value);
                                                if (step1Errors.branch) setStep1Errors(x => ({ ...x, branch: "" }));
                                            }}
                                                className="w-full appearance-none pl-3 pr-8 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                                <option value="">{dept ? "Select branch..." : "Select department first"}</option>
                                                {branchOptions.map(b => <option key={b}>{b}</option>)}
                                            </select>
                                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        </div>
                                        {step1Errors.branch && <p className="text-[11px] text-red-600 mt-1">{step1Errors.branch}</p>}
                                    </div>
                                </div> : null}
                                <div>
                                    <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Responsible Manager <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        defaultValue={session?.displayName ?? ""}
                                        readOnly={!!session?.displayName}
                                        placeholder="Full name of responsible eThekwini manager"
                                        className={`w-full px-3 py-2.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent shadow-sm ${session?.displayName ? "bg-muted/50 text-foreground/70 cursor-not-allowed" : "bg-white placeholder:text-foreground/30"}`}
                                    />
                                    {session?.displayName && <p className="text-[11px] text-foreground/40 mt-1">Auto-filled from your account. You are the responsible manager for this contractor request.</p>}
                                </div>
                                {!isContractTermination ? <div>
                                    <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                                        Business Justification <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={businessJustification}
                                        onChange={(e) => {
                                            setBusinessJustification(e.target.value);
                                            if (step1Errors.businessJustification) setStep1Errors(x => ({ ...x, businessJustification: "" }));
                                        }}
                                        placeholder="Business reason why access is required..."
                                        className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none shadow-sm ${step1Errors.businessJustification ? "border-red-400" : "border-border"}`}
                                    />
                                    {step1Errors.businessJustification && <p className="text-[11px] text-red-600 mt-1">{step1Errors.businessJustification}</p>}
                                </div> : null}
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800">
                                        {isContractTermination
                                            ? "Termination removes the contractor's Ellipse access for the selected environment."
                                            : <>Contractor access is <strong>always temporary</strong> and is automatically expired on the contract end date.</>}
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-5">
                                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
                                    {isContractTermination ? "Contract Termination Details" : "Ellipse Access Requirements"}
                                </h3>
                                {/* Environment — dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">Environment <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select value={env} onChange={e => setEnv(e.target.value as "PROD" | "TEST" | "DEV")}
                                            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer shadow-sm">
                                            <option value="PROD">Production (PROD)</option>
                                            <option value="TEST">Testing (TEST)</option>
                                            <option value="DEV">Development (DEV)</option>
                                        </select>
                                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-foreground/50 flex items-start gap-1.5">
                                        <AlertCircle size={10} className="shrink-0 mt-0.5 text-amber-500" />
                                        {env === "PROD" ? "PROD: Line Manager → Training Centre Rep → HC Systems Officer" : `${env}: Line Manager → ICT Manager → HC Systems Officer`}
                                    </p>
                                </div>
                                {isContractTermination ? (
                                    <>
                                        <TextField
                                            label="Termination Date"
                                            required
                                            type="date"
                                            value={terminationDate}
                                            onChange={setTerminationDate}
                                        />
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                                                Reason for Contract Termination <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={terminationReason}
                                                onChange={(e) => setTerminationReason(e.target.value)}
                                                placeholder="State why the contractor's Ellipse access must be terminated..."
                                                className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none shadow-sm"
                                            />
                                        </div>
                                        {!requiredOk ? (
                                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-semibold">
                                                <AlertCircle size={13} className="shrink-0" /> Complete the termination date and reason before continuing.
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <SelectField
                                                label="Access Level Type"
                                                required
                                                options={["Temporary/Acting"]}
                                                value={userAccessType}
                                                onChange={setUserAccessType}
                                                error={step2Errors.userAccessType}
                                            />
                                            <SelectField
                                                label="Request Type"
                                                required
                                                options={["New User", "Amendment"]}
                                                value={requestType}
                                                onChange={setRequestType}
                                                error={step2Errors.requestType}
                                            />
                                            <TextField label="Ellipse Position" placeholder="e.g. ENG-READ-01" value={ellipsePosition} onChange={setEllipsePosition} />
                                            <TextField label="Position to Copy" placeholder="Optional" value={positionToCopy} onChange={setPositionToCopy} />
                                            <TextField label="Access Start Date" required type="date" value={contractStartDate} onChange={setContractStartDate} />
                                            <TextField label="Access End Date" required type="date" value={contractEndDate} onChange={setContractEndDate} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Menu Access / Modules <span className="text-red-500">*</span></label>
                                            <textarea rows={2} placeholder="e.g. Work Orders, Asset Register..." value={menuAccess}
                                                onChange={(e) => setMenuAccess(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none shadow-sm" />
                                            {step2Errors.menuAccess && <p className="text-[11px] text-red-600 mt-1">{step2Errors.menuAccess}</p>}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {!isContractTermination && step === 3 && (
                            <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-5">
                                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>Mandatory Supporting Documentation</h3>
                                {showContractorPopiaModal && (
                                    <POPIAModal onConfirm={() => setContractorPopiaChecked(true)} onClose={() => setShowContractorPopiaModal(false)} />
                                )}
                                <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 shadow-sm transition-colors ${contractorPopiaChecked ? "border-emerald-300 bg-emerald-50" : "border-blue-200 bg-blue-50"}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${contractorPopiaChecked ? "bg-emerald-100 border-emerald-200" : "bg-blue-100 border-blue-200"}`}>
                                            {contractorPopiaChecked ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Shield size={18} className="text-blue-600" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground">POPIA Declaration</p>
                                            <p className="text-[11px] text-foreground/50 truncate">
                                                {contractorPopiaChecked ? "Declaration confirmed — you may proceed." : "You must read and confirm this declaration before proceeding."}
                                            </p>
                                        </div>
                                    </div>
                                    {contractorPopiaChecked
                                        ? <button onClick={() => { setContractorPopiaChecked(false); setShowContractorPopiaModal(true); }}
                                            className="shrink-0 text-[11px] text-emerald-700 underline hover:no-underline font-semibold">
                                            Review
                                        </button>
                                        : <button onClick={() => setShowContractorPopiaModal(true)}
                                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm" style={{ background: "#1a2d6e" }}>
                                            <Eye size={12} /> Read &amp; Confirm
                                        </button>
                                    }
                                </div>
                                {!contractorPopiaChecked && (
                                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                        <AlertCircle size={12} className="text-amber-600 shrink-0" />
                                        <p className="text-[11px] text-amber-700 font-semibold">Click "Read &amp; Confirm" to open and confirm the POPIA declaration before proceeding.</p>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {docs.map((doc, i) => (
                                        <div key={doc.name} className={`rounded-xl border transition-colors ${doc.uploaded ? "border-emerald-300 bg-emerald-50" : i < 2 ? "border-red-200 bg-red-50" : "border-border bg-white"} shadow-sm`}>
                                            <div className="p-4 flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${doc.uploaded ? "bg-emerald-100 border-emerald-200" : "bg-muted border-border"}`}>
                                                    <FileUp size={18} className={doc.uploaded ? "text-emerald-600" : "text-foreground/30"} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-foreground">{doc.name}</span>
                                                        {i < 2 && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded font-bold">REQUIRED</span>}
                                                        {i === 2 && <span className="text-[10px] px-1.5 py-0.5 bg-muted text-foreground/40 border border-border rounded font-bold">if applicable</span>}
                                                    </div>
                                                    {doc.uploaded && doc.fileName
                                                        ? <div className="flex items-center gap-2 mt-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /><span className="text-xs text-emerald-700 font-mono">{doc.fileName}</span></div>
                                                        : <p className="text-xs text-foreground/40 mt-1">{i === 0 ? "Certified SA ID or passport copy" : i === 1 ? "Company-issued contractor ID card" : "Signed contract or SLA"}</p>
                                                    }
                                                </div>
                                                <div className="shrink-0">
                                                    {doc.uploaded
                                                        ? <button onClick={() => removeDoc(i)} className="p-1.5 rounded text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                                                        : <button onClick={() => simulateUpload(i)} className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded text-xs font-bold hover:opacity-90 transition-opacity shadow-sm" style={{ background: "#1a2d6e" }}><Upload size={12} /> Upload</button>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Document Verification — mandatory for Line Manager */}
                                <div className="border border-violet-200 rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-violet-50 border-b border-violet-200">
                                        <span className="text-xs font-bold text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Shield size={12} /> Document Verification
                                        </span>
                                        <p className="text-[11px] text-violet-600 mt-0.5">The Line Manager must verify all contractor documents before submission. All fields are mandatory.</p>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-foreground/70 mb-1.5">Documents Verified <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select value={docsVerified} onChange={e => setDocsVerified(e.target.value)}
                                                    className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer shadow-sm">
                                                    <option value="">Select verification status...</option>
                                                    <option value="All documents verified and accepted">All documents verified and accepted</option>
                                                    <option value="Documents verified — minor discrepancy noted">Documents verified — minor discrepancy noted</option>
                                                    <option value="Partial — awaiting re-submission">Partial — awaiting re-submission</option>
                                                </select>
                                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-foreground/70 mb-1.5">Verified By <span className="text-red-500">*</span></label>
                                                <input type="text" value={verifiedBy} onChange={e => setVerifiedBy(e.target.value)}
                                                    readOnly={!!session?.displayName}
                                                    placeholder="Full name of verifier"
                                                    className={`w-full px-3 py-2.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm ${session?.displayName ? "bg-muted/50 text-foreground/70 cursor-not-allowed" : "bg-white placeholder:text-foreground/30"}`} />
                                                {session?.displayName && <p className="text-[11px] text-foreground/40 mt-1">Auto-filled from your account.</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-foreground/70 mb-1.5">
                                                    Verified Date <span className="text-red-500">*</span>
                                                    <span className="ml-1 text-[9px] text-violet-500 font-normal">(auto-filled)</span>
                                                </label>
                                                <input type="date" value={verifiedDate} readOnly
                                                    className="w-full px-3 py-2.5 bg-violet-50/60 border border-border rounded-lg text-sm text-foreground/70 cursor-default shadow-sm" />
                                                <p className="text-[11px] text-foreground/40 mt-1">Set to today's date automatically.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!docs[0].uploaded || !docs[1].uploaded
                                    ? <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold"><AlertCircle size={13} className="shrink-0" /> Identity Document and Contractor ID Card must be uploaded before proceeding.</div>
                                    : !docsVerified || !verifiedBy || !verifiedDate
                                        ? <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700 font-semibold"><AlertCircle size={13} className="shrink-0" /> Complete all Document Verification fields to proceed.</div>
                                        : <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold"><CheckCircle2 size={13} className="shrink-0" /> Documents uploaded and verified. You may proceed to review.</div>
                                }
                            </div>
                        )}

                        {isContractTermination && step === 3 && (
                            <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>Review & Submit</h3>
                                <div className="bg-muted/40 border border-border rounded-xl divide-y divide-border">
                                    <div className="px-4 py-2.5 bg-muted/50">
                                        <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Contract Termination</span>
                                    </div>
                                    {[
                                        ["Request Type", "Terminate Contractor Access / Contract"],
                                        ["Environment", <EnvBadge env={env} />],
                                        ["Termination Date", terminationDate],
                                        ["Responsible Manager", session?.displayName ?? "Line Manager"],
                                    ].map(([label, value]) => (
                                        <div key={String(label)} className="px-4 py-2.5 flex justify-between items-center text-xs">
                                            <span className="text-foreground/50 font-semibold">{label}</span>
                                            <span className="text-foreground font-bold">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-red-800 mb-1">Reason for termination</p>
                                    <p className="text-xs text-red-700">{terminationReason}</p>
                                </div>
                            </div>
                        )}

                        {!isContractTermination && step === 4 && (
                            <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>Review & Submit</h3>
                                <div className="bg-muted/40 border border-border rounded-xl divide-y divide-border">
                                    <div className="px-4 py-2.5 bg-muted/50"><span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Access Details</span></div>
                                    {[["Environment", <EnvBadge env={env} />], ["Access Level", "Read Only"], ["Request Type", "New User"]].map(([l, v]) => (
                                        <div key={String(l)} className="px-4 py-2.5 flex justify-between items-center text-xs">
                                            <span className="text-foreground/50 font-semibold">{l}</span>
                                            <span className="text-foreground font-bold">{v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-muted/40 border border-border rounded-xl divide-y divide-border">
                                    <div className="px-4 py-2.5 bg-muted/50"><span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Documents</span></div>
                                    {docs.map((d, i) => (
                                        <div key={d.name} className="px-4 py-3 flex justify-between items-center gap-3 text-xs">
                                            <div className="min-w-0">
                                                <span className="text-foreground/60 font-semibold">{d.name}</span>
                                                {d.uploaded && d.fileName && (
                                                    <p className="mt-0.5 truncate font-mono text-[11px] text-emerald-700" title={d.fileName}>
                                                        {d.fileName}
                                                        {docFiles[i] ? ` · ${formatBytes(docFiles[i]!.size)}` : ""}
                                                    </p>
                                                )}
                                            </div>
                                            {d.uploaded ? (
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {docFiles[i] && (
                                                        <button
                                                            type="button"
                                                            onClick={() => previewLocalFile(d.name, docFiles[i])}
                                                            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 font-semibold text-foreground/70 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                                                        >
                                                            <Eye size={12} /> Preview
                                                        </button>
                                                    )}
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 size={11} /> Uploaded</span>
                                                </div>
                                            ) : (
                                                <span className="shrink-0 text-foreground/30">Not uploaded</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-border bg-white flex items-center justify-between shadow-sm">
                        <button onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
                            className="px-4 py-2 bg-muted text-foreground/70 rounded-lg text-sm font-semibold hover:bg-secondary transition-colors border border-border">
                            {step === 1 ? "Cancel" : "Back"}
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-foreground/40 font-mono">Step {step} of {steps.length}</span>
                            {step < steps.length
                                ? <button
                                    onClick={() => {
                                        if (step === 1) {
                                            const errors = validateContractorStep1();
                                            setStep1Errors(errors);
                                            if (Object.keys(errors).length > 0) return;
                                        }
                                        if (step === 2) {
                                            const errors = validateContractorStep2();
                                            setStep2Errors(errors);
                                            if (Object.keys(errors).length > 0) return;
                                        }
                                        if (((isContractTermination && step === 2) || (!isContractTermination && step === 3)) && !requiredOk) {
                                            return;
                                        }
                                        setStep((s) => s + 1);
                                    }}
                                    disabled={((isContractTermination && step === 2) || (!isContractTermination && step === 3)) && !requiredOk}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${((isContractTermination && step === 2) || (!isContractTermination && step === 3)) && !requiredOk
                                        ? "bg-muted text-foreground/30 cursor-not-allowed border border-border"
                                        : "text-white hover:opacity-90"
                                        }`}
                                    style={
                                        ((isContractTermination && step === 2) || (!isContractTermination && step === 3)) && !requiredOk
                                            ? {}
                                            : { background: "#1a2d6e" }
                                    }>
                                    Continue <ArrowRight size={14} />
                                </button>
                                : <button
                                    disabled={submitting}
                                    onClick={() => void submitContractorToApi()}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm ${submitting ? "bg-muted text-foreground/30 cursor-not-allowed border border-border" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                                    <Check size={14} /> {submitting ? "Submitting…" : "Submit Request"}
                                </button>
                            }
                        </div>
                    </div>
                    {submitError && (
                        <div className="px-6 pb-4 bg-white">
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                <AlertCircle size={13} className="shrink-0" /> {submitError}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {viewingDoc && (
                <DocumentViewerModal
                    document={viewingDoc}
                    viewerName={session?.displayName ?? "Current user"}
                    viewerRole={ROLE_LABELS["LINE_MANAGER"]}
                    onClose={closeLocalPreview}
                />
            )}
        </div>
    );
}