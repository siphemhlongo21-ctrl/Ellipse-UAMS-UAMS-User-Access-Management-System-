import { useState, useRef, useEffect } from "react";
import { DocumentViewerModal } from "../../components/DocumentViewerModal";
import { type ViewerDocument } from "../../types/ViewerDocument";
import { submitEmployeeAccessRequest } from "../../app/apiBridge";
import { CheckCircle2, AlertCircle, Upload, Shield, Eye, UserCheck, X, Check, ArrowRight, Globe, ChevronDown, Lock, FileUp, Trash2, Loader } from "lucide-react";
import { type ReqType } from "../../types/ReqType";
import { revokeViewerDocument, fileToViewerDocument, TERMINATE_REQ_TYPES, ROLE_LABELS, formatBytes } from "../../utilities";
import { TextField } from "../../components/controls/TextField";
import { POPIAModal } from "../../components/POPIAModal";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import Login from "../auth/Login";
import { ustEmployeeApi, type UstEmployeeDetails } from "../../api/services/employees";

// ─── Employee New Request Form ────────────────────────────────────────────────

const ELLIPSE_REQUEST_TYPES: ReqType[] = [
  "New Employee",
  "Create Signon",
  "Primary Position Amendment",
  "Secondary Position Amendment",
  "Signon-Menu",
  "Temporary Position Amendment",
  "Acting Position Amendment",
  "Terminate & Delete Signon",
  "Terminate Secondary Position",
  "Update Existing Employee Record Details",
  "Other",
];

const TERMINATE_TYPES: string[] = TERMINATE_REQ_TYPES;

type FieldErrors = Record<string, string>;

function isBlank(value: string | undefined) {
  return value?.trim() === "";
}

const ACTING_TYPES: ReqType[] = ["Temporary Position Amendment", "Acting Position Amendment", "Temporary/Acting Position Amendment"];

// ── Validation Functions ────────────────────────────────────────────────────
function validateEmployeeStep1(params: {
  isTerminate: boolean;
  isActing: boolean;
  firstName: string | undefined;
  surname: string | undefined;
  serviceNumber: string;
  postId: string;
  permanentPostId: string;
  actingPostId: string;
  dept: string;
  branch: string;
  designation: string;
  contactNumber: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (isBlank(params.firstName)) errors.firstName = "Please enter First Name.";
  if (isBlank(params.surname)) errors.surname = "Please enter Surname.";
  if (isBlank(params.serviceNumber)) {
    errors.serviceNumber = "Please enter Service Number.";
  }

  if (params.isTerminate) {
    return errors;
  }

  if (params.isActing) {
    if (isBlank(params.permanentPostId)) errors.permanentPostId = "Please enter Permanent Post ID.";

    if (isBlank(params.actingPostId)) errors.actingPostId = "Please enter Acting Post ID.";

  } else if (isBlank(params.postId)) {
    errors.postId = "Please enter Post ID.";
  }

  if (isBlank(params.dept)) errors.dept = "Please select Department.";
  if (params.dept && isBlank(params.branch)) errors.branch = "Please select Branch.";
  if (isBlank(params.designation)) errors.designation = "Please enter Designation.";
  if (isBlank(params.contactNumber)) {
    errors.contactNumber = "Please enter Contact Number.";
  } else if (!isTenDigitPhone(params.contactNumber)) {
    errors.contactNumber = "Contact Number must be exactly 10 digits.";
  }

  return errors;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function isTenDigitPhone(value: string) {
  return /^\d{10}$/.test(value);
}

function validateEmployeeStep2(params: {
  isTerminate: boolean;
  skipUserAccessType: boolean | undefined;
  needsEndDate: boolean;
  isPermanent: boolean;
  selectedEnvs: Array<"PROD" | "TEST" | "DEV">;
  userAccessType: string;
  ellipsePosition: string;
  startDate: string;
  endDate: string;
  terminationDate: string;
  menuAccess: string;
  businessJustification: string;
  terminationReason: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (params.selectedEnvs.length === 0) {
    errors.environment = "Please select at least one Environment.";
  }

  if (params.isTerminate) {
    if (isBlank(params.terminationDate)) errors.terminationDate = "Please enter Termination Date.";
    if (isBlank(params.terminationReason)) errors.terminationReason = "Please enter Reason for Termination.";
    return errors;
  }

  if (!params.skipUserAccessType && isBlank(params.userAccessType)) {
    errors.userAccessType = "Please select User Access Type.";
  }
  if (isBlank(params.startDate)) {
    errors.startDate = "Please enter Start Date.";
  }
  if (params.needsEndDate && !params.isPermanent && isBlank(params.endDate)) {
    errors.endDate = "Please enter End Date.";
  }
  if (params.startDate && params.endDate && params.endDate < params.startDate) {
    errors.endDate = "End Date must be on or after Start Date.";
  }
  if (isBlank(params.menuAccess)) errors.menuAccess = "Please enter Menu Access / Modules Required.";

  return errors;
}

export function NewRequestForm() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (session === null) {
    return <Login />;
  }

  // Retrieve the original route or default to home/requests
  const from = location.state?.from?.pathname || "/requests";
  const canInitiateTermination = session?.roles?.includes("LINE_MANAGER");
  const [step, setStep] = useState(1);
  const [reqType, setReqType] = useState<ReqType>(
    canInitiateTermination ? "Terminate & Delete Signon" : "New Employee",
  );
  const [env, setEnv] = useState<"PROD" | "TEST" | "DEV">("PROD");
  const [selectedEnvs, setSelectedEnvs] = useState<Array<"PROD" | "TEST" | "DEV">>(["PROD"]);
  const [dept, setDept] = useState(canInitiateTermination ? "" : session?.deptDesc ?? "");
  const [userAccessType, setUserAccessType] = useState(canInitiateTermination ? "" : "Permanent");
  const [idUploaded, setIdUploaded] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [popiaChecked, setPopiaChecked] = useState(false);
  const [showPopiaModal, setShowPopiaModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<ViewerDocument | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refNum, setRefNum] = useState(`EAM-2026-${String(Math.floor(900 + Math.random() * 99)).padStart(3, "0")}`);
  const [submittedAt, setSubmittedAt] = useState(new Date());
  const identityInputRef = useRef<HTMLInputElement | null>(null);
  const submitterRole: string | null = session?.roles?.find(x => x !== undefined) ?? null;
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const onClose = () => {
    navigate(from, { replace: true });
  }

  const previewLocalFile = (label: string, file: File | null) => {
    if (!file) return;
    revokeViewerDocument(viewingDoc);
    setViewingDoc(fileToViewerDocument(label, file, session?.displayName));
  };

  const closeLocalPreview = () => {
    revokeViewerDocument(viewingDoc);
    setViewingDoc(null);
  };

  const isTerminate = TERMINATE_TYPES.includes(reqType);
  const isActing = ACTING_TYPES.includes(reqType);
  const skipUserAccessType =
    canInitiateTermination &&
    (isActing || reqType === "Other");
  const isTemporary = userAccessType === "Temporary/Acting";
  const isPermanent = userAccessType === "Permanent";
  const primaryEnv = isTerminate
    ? (selectedEnvs.length === 3 ? "ALL" : selectedEnvs[0] ?? "PROD")
    : env;

  const needsEndDate = isActing || isTemporary || primaryEnv !== "PROD";

  // Auto-fill values from session (self-service). Termination requires the target employee details.
  const autoName = canInitiateTermination ? "" : session?.firstName;
  const autoSurname = canInitiateTermination ? "" : session?.surname;
  const autoEmail = canInitiateTermination ? "" : session?.email ?? "";
  const autoPostId = canInitiateTermination ? "" : session?.postNo ?? "";
  const autoServiceNo = canInitiateTermination ? "" : session?.serviceNumber ?? "";
  const autoDesignation = canInitiateTermination ? "" : session?.designation ?? "";

  const steps = isTerminate
    ? ["Employee Info", "Access Details"]
    : ["Employee Info", "Access Details", "Document Upload", "Review & Submit"];
  // Line Manager form: terminate types plus acting/temporary amendments and Other.
  const requestTypeOptions = canInitiateTermination
    ? TERMINATE_TYPES
    : ELLIPSE_REQUEST_TYPES.filter((t) => !TERMINATE_TYPES.includes(t));

  // User fields
  const [firstName, setFirstName] = useState(canInitiateTermination ? "" : autoName);
  const [surname, setSurname] = useState(canInitiateTermination ? "" : autoSurname);
  const [email, setEmail] = useState(canInitiateTermination ? "" : autoEmail);
  const [serviceNumber, setServiceNumber] = useState(canInitiateTermination ? "" : autoServiceNo);
  const [permanentPostId, setPermanentPostId] = useState(canInitiateTermination ? "" : session?.postNo ?? "");
  const [actingPostId, setActingPostId] = useState("");
  const [postId, setPostId] = useState(canInitiateTermination ? "" : autoPostId);
  const [branch, setBranch] = useState(canInitiateTermination ? "" : session?.branchDesc ?? "");
  const [designation, setDesignation] = useState(canInitiateTermination ? "" : autoDesignation);
  const [contactNumber, setContactNumber] = useState("");
  const [teamMembers, setTeamMembers] = useState<UstEmployeeDetails[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [adUsername, setAdUsername] = useState(canInitiateTermination ? "" : session?.userId ?? "");

  // Access details
  const [ellipsePosition, setEllipsePosition] = useState("");
  const [positionToCopy, setPositionToCopy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [terminationDate, setTerminationDate] = useState("");
  const [menuAccess, setMenuAccess] = useState("");
  const [businessJustification, setBusinessJustification] = useState("");
  const [terminationReason, setTerminationReason] = useState("");

  // Validation errros
  const [step1Errors, setStep1Errors] = useState<FieldErrors>({});
  const [step2Errors, setStep2Errors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!canInitiateTermination || !session.serviceNumber) return;
    let cancelled = false;
    ustEmployeeApi
      .getTeamByManagerServiceNumber(session.serviceNumber)
      .then((employees) => {
        if (!cancelled) setTeamMembers(employees);
      })
      .catch(() => {
        if (!cancelled) setTeamMembers([]);
      });
    return () => { cancelled = true; };
  }, [canInitiateTermination, session.serviceNumber]);

  const applyTeamMember = (employee: UstEmployeeDetails) => {
    setFirstName(employee.firstName);
    setSurname(employee.surname);
    setEmail(employee.email);
    setServiceNumber(employee.serviceNo);
    setAdUsername(employee.userId);
    setPostId(employee.postNo);
    setPermanentPostId(employee.postNo);
    setDept(employee.deptDesc);
    setBranch(employee.branchDesc);
    setDesignation(employee.designation);
    setEmployeeSearch(`${employee.firstName} ${employee.surname}`);
    if (step1Errors.firstName || step1Errors.surname || step1Errors.serviceNumber) {
      setStep1Errors((previous) => ({
        ...previous,
        firstName: "",
        surname: "",
        serviceNumber: ""
      }));
    }
  };

  const toggleEnv = (value: "PROD" | "TEST" | "DEV") => {
    setSelectedEnvs((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      return [...current, value];
    });
    if (step2Errors.environment) {
      setStep2Errors((prev) => ({ ...prev, environment: "" }));
    }
  };

  const handleContinue = () => {
    if (step === 2 && TERMINATE_TYPES.includes(reqType) && !canInitiateTermination) return;
    if (step === 3 && !idUploaded && !isTerminate) return;
    if (step === 3 && !isTerminate && !popiaChecked) return;

    if (step === 1) {
      const errors = validateEmployeeStep1({
        isTerminate,
        isActing,
        firstName,
        surname,
        serviceNumber,
        postId,
        permanentPostId,
        actingPostId,
        dept,
        branch,
        designation,
        contactNumber,
      });
      setStep1Errors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    if (step === 2) {
      const errors = validateEmployeeStep2({
        isTerminate,
        skipUserAccessType,
        needsEndDate,
        isPermanent,
        selectedEnvs: isTerminate ? selectedEnvs : [env],
        userAccessType,
        ellipsePosition,
        startDate,
        endDate,
        terminationDate,
        menuAccess,
        businessJustification,
        terminationReason,
      });
      setStep2Errors(errors);
      if (Object.keys(errors).length > 0) return;
    }

    if (step === steps.length) {
      if ((popiaChecked || isTerminate) && (idUploaded || isTerminate)) void submitToApi();
      return;
    }

    setStep((s) => s + 1);
  };

  const submitToApi = async () => {
    if (submitting) return;
    if (!isTerminate && (!popiaChecked || !idUploaded)) return;
    setSubmitting(true);
    setLoadingMessage("Submitting")
    setSubmitError(null);
    try {
      const created = await submitEmployeeAccessRequest({
        requestType: reqType,
        isTerminate,
        environments: isTerminate ? selectedEnvs : [env],
        userAccessType,
        firstName,
        surname,
        serviceNumber,
        email,
        postId,
        permanentPostId,
        actingPostId,
        department: dept,
        branch,
        designation,
        contactNumber,
        ellipsePosition,
        positionToCopy,
        menuAccess,
        businessJustification,
        startDate,
        endDate,
        terminationDate,
        terminationReason,
        identityFile,
        responsibleManager: session?.mangServNo,
        adUsername
      });
      setRefNum(created[0]?.id ?? refNum);
      setSubmittedAt(new Date());
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
      setLoadingMessage("")
    }
  };

  // ── Confirmation screen ────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-6 bg-background">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-400 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
            Request Submitted Successfully
          </h2>
          <p className="text-sm text-foreground/50 max-w-sm">
            Your Ellipse access request has been submitted and is now pending approval. You will be notified at each stage of the workflow.
          </p>
        </div>

        {/* Reference card */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 w-full max-w-sm text-left space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Request Details</span>
          </div>
          {[
            ["Request Reference", refNum],
            ["Request Type", reqType],
            ["Environment", isTerminate
              ? (selectedEnvs.length === 3 ? "All Environments (PROD + TEST + DEV)" : selectedEnvs.join(", ") || "—")
              : env],
            ["Date Submitted", submittedAt.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })],
            ["Time Submitted", submittedAt.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })],
            ["Current Status", submitterRole === "ICT_MANAGER" ? "Submitted — Awaiting ICT Manager's Line Manager Approval" : "Submitted — Awaiting Line Manager Approval"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between items-start text-xs border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <span className="text-foreground/50 font-semibold shrink-0 mr-4">{l}</span>
              <span className={`text-right font-bold ${l === "Request Reference" ? "text-primary font-mono" : "text-foreground"}`}>{v}</span>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full max-w-sm text-left">
          <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
            <AlertCircle size={12} /> What happens next?
          </p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            {submitterRole === "LINE_MANAGER" && isTerminate
              ? <li>The HC Systems Officer will implement the termination.</li>
              : <>
                {submitterRole === "ICT_MANAGER"
                  ? <li>Your Line Manager will receive a notification to review and approve this request.</li>
                  : <li>Your Line Manager will receive a notification to review and approve.</li>
                }
                {(isTerminate ? selectedEnvs.includes("PROD") : env === "PROD") && <li>The Training Centre Representative will verify training completion.</li>}
                {(isTerminate ? !selectedEnvs.includes("PROD") : env !== "PROD") && submitterRole !== "ICT_MANAGER" && <li>The ICT Manager will review the request.</li>}
                {(isTerminate ? !selectedEnvs.includes("PROD") : env !== "PROD") && submitterRole === "ICT_MANAGER" && <li>The request will continue through the standard ICT Manager workflow.</li>}
                <li>The HC Systems Officer will implement the access.</li>
              </>
            }
          </ol>
        </div>

        <button
          onClick={onClose}
          className="px-8 py-3 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          style={{ background: "#1a2d6e" }}>
          Return to Requests
        </button>
      </div>
    );
  }

  // ── Step indicator ─────────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="px-6 py-4 border-b border-border bg-white">
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all
              ${i + 1 < step ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                  : i + 1 === step ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-white text-foreground/30"}`}>
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap font-semibold ${i + 1 === step ? "text-accent" : "text-foreground/40"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 mb-4 ${i + 1 < step ? "bg-emerald-400" : "bg-border"}`} />}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto bg-background px-4 py-6 sm:px-6 lg:px-8">

      <div className="flex min-h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
        {/* Header */}
        {submitting &&
          <div className="flex flex-1 items-center justify-center py-40">
            <Loader className="animate-spin w-16 h-16 text-indigo-600" />
          </div>
        }

        {!submitting && (
          <>
            <div className="px-6 py-4 border-b border-border bg-white flex items-center justify-between shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>Ellipse Access Request</h2>
                <p className="text-[11px] text-foreground/50">eThekwini Electricity & Energy · All fields marked <span className="text-red-500">*</span> are mandatory</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-muted transition-colors"><X size={16} /></button>
            </div>

            <StepBar />

            <div className="flex-1 overflow-auto px-6 py-6">

              {/* ── Step 1: Employee Info ── */}
              {step === 1 && (
                <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-4">
                  {!isTerminate && (autoName || autoSurname || autoEmail) && (
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <UserCheck size={12} className="text-blue-600 shrink-0" />
                      <p className="text-[11px] text-blue-700">Your details have been auto-filled from your account. Read-only fields cannot be edited.</p>
                    </div>
                  )}
                  {canInitiateTermination && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle size={12} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800">Search and select the employee this request is for. Surname, service number, email and username will fill in automatically.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1.5">First Name<span className="text-red-500">*</span></label>
                      {canInitiateTermination ? (
                        <>
                          <input
                            value={employeeSearch}
                            onChange={(event) => {
                              setEmployeeSearch(event.target.value);
                              setFirstName("");
                              setSurname("");
                              setServiceNumber("");
                              setEmail("");
                              setAdUsername("");
                            }}
                            placeholder="Search by first name or surname"
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-accent shadow-sm ${step1Errors.firstName ? "border-red-400" : "border-border"
                              }`}
                          />
                          {employeeSearch.trim() && !firstName && (
                            <ul className="mt-1 max-h-40 overflow-auto border border-border rounded-lg bg-white shadow-sm">
                              {teamMembers
                                .filter((employee) => {
                                  const query = employeeSearch.trim().toLowerCase();
                                  return (
                                    employee.firstName.toLowerCase().includes(query) ||
                                    employee.surname.toLowerCase().includes(query)
                                  );
                                })
                                .slice(0, 20)
                                .map((employee) => (
                                  <li key={employee.serviceNo}>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                      onClick={() => applyTeamMember(employee)}
                                    >
                                      {employee.firstName} {employee.surname}
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <input
                          value={firstName}
                          readOnly={!!autoName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (step1Errors.firstName) setStep1Errors((pre) => ({ ...pre, firstName: "" }));
                          }}
                          placeholder="e.g Sipho"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm ${autoName
                            ? "bg-muted/50 text-foreground/70 cursor-not-allowed border-border"
                            : step1Errors.firstName
                              ? "bg-white text-foreground placeholder:text-foreground/30 border-red-400"
                              : "bg-white text-foreground placeholder:text-foreground/30 border-border"
                            }`}
                        />
                      )}
                      {step1Errors.firstName && (
                        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> {canInitiateTermination ? "Please select an employee from the list." : step1Errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Surname <span className="text-red-500">*</span></label>
                      <input
                        value={surname}
                        readOnly={canInitiateTermination || (!isTerminate && !!autoSurname)}
                        onChange={(e) => {
                          setSurname(e.target.value);
                          if (step1Errors.surname) setStep1Errors((prev) => ({ ...prev, surname: "" }));
                        }}
                        placeholder="e.g. Dlamini"
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm ${canInitiateTermination || (!isTerminate && autoSurname)
                          ? "bg-muted/50 text-foreground/70 cursor-not-allowed border-border"
                          : step1Errors.surname
                            ? "bg-white text-foreground placeholder:text-foreground/30 border-red-400"
                            : "bg-white text-foreground placeholder:text-foreground/30 border-border"
                          }`}
                      />
                      {step1Errors.surname && (
                        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> {step1Errors.surname}
                        </p>
                      )}
                    </div>

                    <TextField
                      label="Service Number"
                      readOnly={canInitiateTermination || !!autoServiceNo}
                      required
                      placeholder="e.g. EM045123"
                      value={serviceNumber}
                      onChange={(v) => {
                        setServiceNumber(v);
                        if (step1Errors.serviceNumber) {
                          setStep1Errors((e) => ({ ...e, serviceNumber: "" }));
                        }
                      }}
                      error={step1Errors.serviceNumber}
                    />

                    {!isTerminate && (isActing ? (
                      <>
                        <TextField
                          label="Permanent Post ID"
                          required
                          placeholder="Current permanent post ID"
                          value={permanentPostId}
                          readOnly={!!autoPostId || canInitiateTermination}
                          onChange={(v) => {
                            setPermanentPostId(v);
                            if (step1Errors.permanentPostId) setStep1Errors((e) => ({ ...e, permanentPostId: "" }));
                          }}
                          error={step1Errors.permanentPostId}
                        />
                        <TextField
                          label="Acting Post ID"
                          required
                          placeholder="Post ID for acting position"
                          value={actingPostId}
                          onChange={(v) => {
                            setActingPostId(v);
                            if (step1Errors.actingPostId) setStep1Errors((e) => ({ ...e, actingPostId: "" }));
                          }}
                          error={step1Errors.actingPostId}
                        />
                      </>
                    ) : (
                      <TextField
                        label="Post ID"
                        required
                        placeholder="Post identifier"
                        inputMode="text"
                        value={postId}
                        readOnly={!!autoPostId || canInitiateTermination}
                        onChange={(v) => {
                          setPostId(v);
                          if (step1Errors.postId) setStep1Errors((e) => ({ ...e, postId: "" }));
                        }}
                        error={step1Errors.postId}
                      />
                    ))}

                    {!isTerminate && (
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Department <span className="text-red-500">*</span></label>
                        <input
                          value={dept}
                          readOnly={canInitiateTermination || (isTerminate && !!dept)}
                          onChange={(e) => {
                            setDept(e.target.value);
                            if (step1Errors.dept) setStep1Errors((prev) => ({ ...prev, dept: "" }));
                          }}
                          placeholder="e.g. Electrical"
                          className={`w-full py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm ${canInitiateTermination || autoName
                            ? "bg-muted/50 text-foreground placeholder:text-foreground/70 cursor-not-allowed border-border"
                            : step1Errors.dept
                              ? "bg-white text-foreground placeholder:text-foreground/30 border-red-400"
                              : "bg-white text-foreground placeholder:text-foreground/30 border-border"
                            }`}
                        />
                        {step1Errors.dept && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {step1Errors.dept}
                          </p>
                        )}
                      </div>
                    )}

                    {!isTerminate && (
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Branch <span className="text-red-500">*</span></label>
                        <input
                          value={branch}
                          readOnly={canInitiateTermination || (!isTerminate && !!branch)}
                          onChange={(e) => {
                            setBranch(e.target.value);
                            if (step1Errors.branch) setStep1Errors((prev) => ({ ...prev, branch: "" }));
                          }}
                          placeholder="e.g. Elec"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm ${canInitiateTermination || autoName
                            ? "bg-muted/50 text-foreground/70 cursor-not-allowed border-border"
                            : step1Errors.branch
                              ? "bg-white text-foreground placeholder:text-foreground/30 border-red-400"
                              : "bg-white text-foreground placeholder:text-foreground/30 border-border"
                            }`}
                        />
                        {step1Errors.branch && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {step1Errors.branch}
                          </p>
                        )}
                      </div>
                    )}

                    {!isTerminate && (
                      <TextField
                        label="Designation"
                        required
                        readOnly={!!autoDesignation || canInitiateTermination}
                        placeholder="Job title / grade"
                        value={designation}
                        onChange={(v) => {
                          setDesignation(v);
                          if (step1Errors.designation) setStep1Errors((e) => ({ ...e, designation: "" }));
                        }}
                        error={step1Errors.designation}
                      />
                    )}
                    {!isTerminate && (
                      <TextField
                        label="Contact Number"
                        required
                        placeholder="Work phone"
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
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Email Address {!isTerminate && <span className="text-red-500">*</span>}</label>
                      <input
                        value={email}
                        readOnly={canInitiateTermination || (!isTerminate && !!autoEmail)}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Work email"
                        type="email"
                        className={`w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm ${canInitiateTermination || (!isTerminate && autoEmail)
                          ? "bg-muted/50 text-foreground/70 cursor-not-allowed"
                          : "bg-white text-foreground placeholder:text-foreground/30"
                          }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Active Directory Username {!isTerminate && <span className="text-red-500">*</span>}</label>
                      <input
                        value={adUsername}
                        readOnly
                        placeholder="AD username"
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm bg-muted/50 text-foreground/70 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Access Details (Environment as dropdown at top) ── */}
              {step === 2 && (
                <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
                      Request Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={reqType}
                        onChange={(e) => {
                          const nextType = e.target.value as ReqType;
                          setReqType(nextType);
                          if (TERMINATE_TYPES.includes(nextType)) {
                            setUserAccessType("");
                            setSelectedEnvs(["PROD"]);
                            setStep2Errors({});
                          } else {
                            const hidesAccessType =
                              canInitiateTermination &&
                              (ACTING_TYPES.includes(nextType) || nextType === "Other");
                            setUserAccessType(hidesAccessType ? "" : "Permanent");
                          }
                        }}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer shadow-sm">
                        {requestTypeOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                    </div>
                    {TERMINATE_TYPES.includes(reqType) && (
                      <p className="mt-1.5 text-[11px] text-red-600 flex items-center gap-1.5">
                        <AlertCircle size={10} /> Termination — Termination Date replaces Start/End Date.
                      </p>
                    )}
                    {TERMINATE_TYPES.includes(reqType) && !canInitiateTermination && (
                      <div className="mt-2 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                          <Lock size={14} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-800 mb-1">This request must be submitted by your Line Manager</p>
                          <p className="text-xs text-red-700 leading-relaxed">
                            In accordance with the approved BRS (3.1.2), termination requests — <strong>Terminate &amp; Delete Signon</strong> and <strong>Terminate Secondary Position</strong> — may only be initiated by a Line Manager.
                          </p>
                        </div>
                      </div>
                    )}
                    {ACTING_TYPES.includes(reqType) && (
                      <p className="mt-1.5 text-[11px] text-amber-600 flex items-center gap-1.5">
                        <AlertCircle size={10} /> Temporary/Acting — Permanent Post ID and Acting Post ID are mandatory.
                      </p>
                    )}
                  </div>
                  {/* Environment */}
                  <div>
                    <label className="block text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
                      Environment <span className="text-red-500">*</span>
                    </label>
                    {isTerminate ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-4 p-3 bg-white border border-border rounded-lg">
                          {([
                            ["PROD", "Production"],
                            ["TEST", "Test"],
                            ["DEV", "Development"],
                          ] as const).map(([value, label]) => (
                            <label key={value} className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={selectedEnvs.includes(value)}
                                onChange={() => toggleEnv(value)}
                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-foreground">{label}</span>
                            </label>
                          ))}
                        </div>
                        {selectedEnvs.length === 3 && (
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700">
                            <Globe size={14} className="shrink-0" />
                            All Environments selected — access will be removed from PROD, TEST, and DEV
                          </div>
                        )}
                        {step2Errors.environment && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {step2Errors.environment}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <select value={env} onChange={e => setEnv(e.target.value as "PROD" | "TEST" | "DEV")}
                          className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer shadow-sm">
                          <option value="PROD">Production (PROD)</option>
                          <option value="TEST">Testing (TEST)</option>
                          <option value="DEV">Development (DEV)</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-foreground/50 flex items-start gap-1.5">
                      <AlertCircle size={10} className="shrink-0 mt-0.5 text-amber-500" />
                      {isTerminate && selectedEnvs.length === 3
                        ? "All Environments: Line Manager → Training Centre Rep → ICT Manager → HC Systems Officer"
                        : primaryEnv === "PROD" || primaryEnv === "ALL"
                          ? "PROD: Line Manager → Training Centre Rep → HC Systems Officer"
                          : `${primaryEnv}: Line Manager → ICT Manager → HC Systems Officer`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    {/* Hidden for termination and LM temporary/acting/other requests. */}
                    {!isTerminate && !skipUserAccessType && (
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                          User Access Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={userAccessType}
                            onChange={e => {
                              setUserAccessType(e.target.value);
                              if (step2Errors.userAccessType) setStep2Errors((prev) => ({ ...prev, userAccessType: "" }));
                            }}
                            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer shadow-sm">
                            <option value="">Select user access type...</option>
                            <option>Permanent</option>
                            <option>Secondary</option>
                            <option>Temporary/Acting</option>
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                        </div>
                        {step2Errors.userAccessType && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {step2Errors.userAccessType}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Termination: single Termination Date replaces Start + End Date */}
                    {isTerminate && (
                      <div className="col-span-2">
                        <TextField
                          label="Termination Date"
                          required
                          type="date"
                          value={terminationDate}
                          onChange={(v) => {
                            setTerminationDate(v);
                            if (step2Errors.terminationDate) setStep2Errors((e) => ({ ...e, terminationDate: "" }));
                          }}
                          error={step2Errors.terminationDate}
                        />
                        <p className="text-[11px] text-foreground/50 mt-1">
                          Date on which the user's Ellipse access must be terminated.
                        </p>
                      </div>
                    )}

                    {!isTerminate && (
                      <>
                        {/* Ellipse Position - OPTIONAL - no required, no error */}
                        <TextField
                          label="Ellipse Position"
                          placeholder="Optional — e.g. ENG-READ-01"
                          value={ellipsePosition}
                          onChange={setEllipsePosition}
                        />

                        {/* Position to Copy - col 1 */}
                        <TextField
                          label="Position to Copy"
                          placeholder="Optional — copy from existing position"
                          value={positionToCopy}
                          onChange={setPositionToCopy}
                        />

                        {/* Start Date - col 2, RIGHT NEXT TO Position to Copy */}
                        <TextField
                          label="Start Date"
                          required
                          type="date"
                          value={startDate}
                          onChange={(v) => {
                            setStartDate(v);
                            if (step2Errors.startDate) setStep2Errors((e) => ({ ...e, startDate: "" }));
                          }}
                          error={step2Errors.startDate}
                          helperText={step2Errors.startDate ? step2Errors.startDate : "Select the date when access should begin."}
                        />

                        {/* End Date: disabled for Permanent access type; required for acting/temp or TEST/DEV */}
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                            End Date
                            {isPermanent
                              ? <span className="ml-1 text-[10px] text-foreground/40 font-normal">(not applicable — Permanent access)</span>
                              : needsEndDate ? <span className="text-red-500">*</span>
                                : <span className="text-[10px] text-foreground/40 font-normal">(not required for permanent PROD access)</span>}
                          </label>
                          <input
                            type="date"
                            disabled={isPermanent}
                            value={endDate}
                            onChange={(e) => {
                              setEndDate(e.target.value);
                              if (step2Errors.endDate) setStep2Errors((prev) => ({ ...prev, endDate: "" }));
                            }}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 shadow-sm ${step2Errors.endDate ? "border-red-400 focus:ring-red-400" : "border-border focus:ring-accent"
                              } ${isPermanent ? "bg-muted/50 text-foreground/30 cursor-not-allowed" : "bg-white"}`}
                          />
                          {step2Errors.endDate && (
                            <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={10} /> {step2Errors.endDate}
                            </p>
                          )}
                          {isPermanent && <p className="text-[11px] text-foreground/40 mt-1">End Date is not required for Permanent user access type.</p>}
                        </div>
                      </>
                    )}
                  </div>

                  {!isTerminate && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1.5">Menu Access / Modules Required <span className="text-red-500">*</span></label>
                        <textarea
                          rows={2}
                          value={menuAccess}
                          onChange={(e) => {
                            setMenuAccess(e.target.value);
                            if (step2Errors.menuAccess) setStep2Errors((prev) => ({ ...prev, menuAccess: "" }));
                          }}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none shadow-sm bg-white ${step2Errors.menuAccess ? "border-red-400" : "border-border"
                            }`}
                          placeholder="List required Ellipse modules..."
                        />
                        {step2Errors.menuAccess && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {step2Errors.menuAccess}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                          Business Justification
                        </label>
                        <textarea
                          rows={3}
                          value={businessJustification}
                          onChange={(e) => {
                            setBusinessJustification(e.target.value);
                            if (step2Errors.businessJustification) {
                              setStep2Errors((prev) => ({ ...prev, businessJustification: "" }));
                            }
                          }}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none shadow-sm bg-white ${step2Errors.businessJustification ? "border-red-400 focus:ring-red-400" : "border-border"
                            }`}
                          placeholder="Explain why this access level is required for this employee..."
                        />
                        {step2Errors.businessJustification && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {step2Errors.businessJustification}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {isTerminate && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                        Reason for Termination <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={terminationReason}
                        onChange={(e) => {
                          setTerminationReason(e.target.value);
                          if (step2Errors.terminationReason) setStep2Errors((prev) => ({ ...prev, terminationReason: "" }));
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none shadow-sm ${step2Errors.terminationReason ? "border-red-400 focus:ring-red-400" : "border-border"
                          }`}
                        placeholder="State the reason for terminating Ellipse access (e.g. resignation, contract ended, role change)..."
                      />
                      {step2Errors.terminationReason && (
                        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> {step2Errors.terminationReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Termination requests attach no documents — POPIA declaration is not required. */}

                  {/* PROD + Permanent access info box */}
                  {env === "PROD" && userAccessType === "Permanent" && !isActing && !isTerminate && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-800">
                        Permanent Production access does not require an End Date. The End Date field is optional and should only be completed if this access is temporary in nature.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Document Upload (non-termination only) ── */}
              {!isTerminate && step === 3 && (
                <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: "Barlow, sans-serif" }}>Supporting Documentation</h3>
                    <p className="text-xs text-foreground/50">The employee Identity Document is mandatory. The request cannot be submitted without it.</p>
                  </div>

                  {showPopiaModal && (
                    <POPIAModal onConfirm={() => setPopiaChecked(true)} onClose={() => setShowPopiaModal(false)} />
                  )}
                  <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 shadow-sm transition-colors ${popiaChecked ? "border-emerald-300 bg-emerald-50" : "border-blue-200 bg-blue-50"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${popiaChecked ? "bg-emerald-100 border-emerald-200" : "bg-blue-100 border-blue-200"}`}>
                        {popiaChecked ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Shield size={18} className="text-blue-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">POPIA Declaration</p>
                        <p className="text-[11px] text-foreground/50 truncate">
                          {popiaChecked ? "Declaration confirmed — you may proceed." : "You must read and confirm this declaration before proceeding."}
                        </p>
                      </div>
                    </div>
                    {popiaChecked
                      ? <button onClick={() => { setPopiaChecked(false); setShowPopiaModal(true); }}
                        className="shrink-0 text-[11px] text-emerald-700 underline hover:no-underline font-semibold">
                        Review
                      </button>
                      : <button onClick={() => setShowPopiaModal(true)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm" style={{ background: "#1a2d6e" }}>
                        <Eye size={12} /> Read &amp; Confirm
                      </button>
                    }
                  </div>
                  {!popiaChecked && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle size={12} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-700 font-semibold">Click "Read &amp; Confirm" to open and confirm the POPIA declaration before proceeding.</p>
                    </div>
                  )}

                  <div className={`rounded-xl border p-4 flex items-start gap-3 shadow-sm transition-colors ${idUploaded ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${idUploaded ? "bg-emerald-100 border-emerald-200" : "bg-white border-red-200"
                      }`}>
                      <FileUp size={18} className={idUploaded ? "text-emerald-600" : "text-red-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">Employee Identity Document</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded font-bold">MANDATORY</span>
                      </div>
                      {idUploaded
                        ? <div className="flex items-center gap-2 mt-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /><span className="text-xs text-emerald-700 font-mono">{identityFile?.name ?? "Employee_ID_Document.pdf"}</span></div>
                        : <p className="text-xs text-foreground/50 mt-1">
                          Certified copy of South African ID document or passport. Required before submission.
                        </p>
                      }
                    </div>
                    <div className="shrink-0">
                      <input
                        ref={identityInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setIdentityFile(file);
                          setIdUploaded(Boolean(file));
                          e.target.value = "";
                        }}
                      />
                      {idUploaded
                        ? <button onClick={() => { setIdUploaded(false); setIdentityFile(null); }} className="p-1.5 rounded text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                        : <button onClick={() => identityInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded text-xs font-bold hover:opacity-90 transition-opacity shadow-sm" style={{ background: "#1a2d6e" }}>
                          <Upload size={12} /> Upload
                        </button>
                      }
                    </div>
                  </div>

                  {!idUploaded && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold">
                      <AlertCircle size={13} className="shrink-0" /> Employee Identity Document must be uploaded before you can proceed to submission.
                    </div>
                  )}
                  {idUploaded && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 size={13} className="shrink-0" /> Mandatory document uploaded. You may proceed to review and submit.
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 4: Review & Submit (non-termination only) ── */}
              {!isTerminate && step === 4 && (
                <div className="w-full bg-white border border-border rounded-xl shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>Review & Submit</h3>

                  <div className="bg-muted/40 border border-border rounded-xl divide-y divide-border">
                    <div className="px-4 py-2.5 bg-muted/50"><span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Request Summary</span></div>
                    {[
                      ["Request Type", reqType],
                      ["Environment", env],
                      ...(!skipUserAccessType
                        ? [["User Access Type", userAccessType]]
                        : []),
                    ].map(([l, v]) => (
                      <div key={l} className="px-4 py-3 flex justify-between items-start text-xs gap-4">
                        <span className="text-foreground/50 font-semibold shrink-0">{l}</span>
                        <span className="text-foreground font-bold text-right">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted/40 border border-border rounded-xl divide-y divide-border">
                    <div className="px-4 py-2.5 bg-muted/50"><span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Documents</span></div>
                    <div className="px-4 py-3 flex justify-between items-center gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="text-foreground/60 font-semibold">Employee Identity Document</span>
                        {identityFile && (
                          <p className="mt-0.5 truncate font-mono text-[11px] text-emerald-700" title={identityFile.name}>
                            {identityFile.name} · {formatBytes(identityFile.size)}
                          </p>
                        )}
                      </div>
                      {idUploaded ? (
                        <div className="flex shrink-0 items-center gap-2">
                          {identityFile && (
                            <button
                              type="button"
                              onClick={() => previewLocalFile("Employee Identity Document", identityFile)}
                              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 font-semibold text-foreground/70 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                            >
                              <Eye size={12} /> Preview
                            </button>
                          )}
                          <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 size={11} /> Uploaded</span>
                        </div>
                      ) : (
                        <span className="shrink-0 text-red-500 font-bold">Missing — required</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/40 border border-border rounded-xl divide-y divide-border">
                    <div className="px-4 py-2.5 bg-muted/50"><span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">Approval Workflow</span></div>
                    <div className="px-4 py-3 text-xs text-foreground/70 space-y-1">
                      {(env === "PROD"
                        ? ["1. Line Manager", "2. Training Centre Representative", "3. HC Systems Officer (Implementation)"]
                        : ["1. Line Manager", "2. ICT Manager", "3. HC Systems Officer (Implementation)"]
                      ).map(s => (
                        <div key={s} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="px-6 py-4 border-t border-border bg-white flex items-center justify-between shadow-sm">
              <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                className="px-4 py-2 bg-muted text-foreground/70 rounded-lg text-sm font-semibold hover:bg-secondary transition-colors border border-border">
                {step === 1 ? "Cancel" : "Back"}
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground/40 font-mono">Step {step} of {steps.length}</span>
                {step < steps.length
                  ? <button
                    onClick={handleContinue}
                    disabled={
                      (step === 2 && TERMINATE_TYPES.includes(reqType) && !canInitiateTermination) ||
                      (step === 3 && !idUploaded) ||
                      (step === 3 && !popiaChecked)
                    }
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm
                ${(step === 1 && !canInitiateTermination && TERMINATE_TYPES.includes(reqType)) || (step === 2 && !isTerminate && (!isTerminate && !session?.roles?.includes("EMPLOYEE"))) || (step === 3 && !idUploaded) || (step === 3 && !popiaChecked) ? "bg-muted text-foreground/30 cursor-not-allowed border border-border" : "text-white hover:opacity-90"}`}
                    style={(step === 1 && !canInitiateTermination && TERMINATE_TYPES.includes(reqType)) || (step === 2 && !isTerminate && (!isTerminate && !session?.roles?.includes("EMPLOYEE"))) || (step === 3 && !idUploaded) || (step === 3 && !popiaChecked) ? {} : { background: "#1a2d6e" }}>
                    Continue <ArrowRight size={14} />
                  </button>
                  : <button
                    disabled={submitting || (!isTerminate && !idUploaded) || (!isTerminate && !popiaChecked)}
                    onClick={() => void submitToApi()}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm
                ${submitting || (!isTerminate && !idUploaded) || (!isTerminate && !popiaChecked) ? "bg-muted text-foreground/30 cursor-not-allowed border border-border" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
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
          </>
        )}
      </div>
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          viewerName={session?.displayName ?? "Current user"}
          viewerRole={submitterRole ? ROLE_LABELS[submitterRole] : undefined}
          onClose={closeLocalPreview}
        />
      )}
    </div>
  );
}