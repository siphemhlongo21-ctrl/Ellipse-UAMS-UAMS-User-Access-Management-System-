import { useEffect, useState } from "react";
import {
  X, Download, Shield, FileText, Eye, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Check, AlertCircle,
} from "lucide-react";
import { type ViewerDocument } from "../types/ViewerDocument";
import { type DocumentAccessLogEntry } from "../types/DocumentAccessLogEntry";

interface DocumentViewerModalProps {
  document: ViewerDocument;
  requestId?: number;
  viewerName?: string;
  viewerRole?: string;
  accessLog?: DocumentAccessLogEntry[];
  onClose: () => void;
  onDownload?: (doc: ViewerDocument) => void;
  onAccessLogged?: (entry: DocumentAccessLogEntry) => void;
}

function nowStamp() {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
  };
}

function isImage(doc: ViewerDocument) {
  const t = (doc.contentType ?? "").toLowerCase();
  const n = doc.fileName.toLowerCase();
  return t.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(n);
}

function isPdf(doc: ViewerDocument) {
  const t = (doc.contentType ?? "").toLowerCase();
  const n = doc.fileName.toLowerCase();
  return t.includes("pdf") || n.endsWith(".pdf");
}

export function DocumentViewerModal({
  document: doc,
  requestId,
  viewerName = "Current User",
  viewerRole,
  accessLog = [],
  onClose,
  onDownload,
  onAccessLogged,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [log, setLog] = useState<DocumentAccessLogEntry[]>(accessLog);
  const [downloadFlash, setDownloadFlash] = useState(false);
  const totalPages = 2;

  useEffect(() => {
    const stamp = nowStamp();
    const entry: DocumentAccessLogEntry = {
      user: viewerName,
      role: viewerRole,
      action: "Viewed",
      date: stamp.date,
      time: stamp.time,
      document: doc.fileName,
    };
    setLog(prev => [entry, ...prev]);
    onAccessLogged?.(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- log once on open
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDownload = () => {
    const stamp = nowStamp();
    const entry: DocumentAccessLogEntry = {
      user: viewerName,
      role: viewerRole,
      action: "Downloaded",
      date: stamp.date,
      time: stamp.time,
      document: doc.fileName,
    };
    setLog(prev => [entry, ...prev]);
    onAccessLogged?.(entry);
    onDownload?.(doc);

    if (doc.downloadUrl) {
      const a = window.document.createElement("a");
      a.href = doc.downloadUrl;
      a.download = doc.fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    } else {
      // Demo download: generate a small text placeholder file
      const blob = new Blob(
        [`Ellipse Document — ${doc.fileName}\nRequest: ${requestId ?? "—"}\nGenerated: ${stamp.date} ${stamp.time}\n`],
        { type: "text/plain" },
      );
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.fileName.replace(/\.[^.]+$/, "") + ".txt";
      a.click();
      URL.revokeObjectURL(url);
    }

    setDownloadFlash(true);
    window.setTimeout(() => setDownloadFlash(false), 2000);
  };

  const showPdf = isPdf(doc);
  const showImage = isImage(doc);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
        aria-label="Close document viewer"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-[min(90vh,820px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0 flex items-start gap-3">
            <div
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border"
              style={{ background: "#eef1f8" }}
            >
              <FileText size={18} style={{ color: "#1a2d6e" }} />
            </div>
            <div className="min-w-0">
              <h2
                id="doc-viewer-title"
                className="truncate text-sm font-bold text-foreground sm:text-base"
                style={{ fontFamily: "Barlow, sans-serif" }}
              >
                {doc.name}
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-foreground/50 font-mono">
                {doc.fileName}
                {doc.size ? ` · ${doc.size}` : ""}
                {requestId ? ` · ${requestId}` : ""}
              </p>
              {(doc.uploadedAt || doc.uploadedBy) && (
                <p className="mt-0.5 text-[10px] text-foreground/40">
                  Uploaded{doc.uploadedAt ? ` ${doc.uploadedAt}` : ""}
                  {doc.uploadedBy ? ` by ${doc.uploadedBy}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: "#1a2d6e" }}
            >
              <Download size={13} />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* POPIA banner */}
        <div className="flex shrink-0 items-start gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 sm:px-5">
          <Shield size={12} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-[11px] text-blue-700">
            <span className="font-bold">POPIA — Access logged.</span>{" "}
            Viewing and downloading this document is recorded in the Document Access Log for audit purposes.
          </p>
          {downloadFlash && (
            <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <Check size={10} /> Download started
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Preview pane */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-100">
            {/* Toolbar */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-white/80 px-3 py-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={zoom <= 50}
                  onClick={() => setZoom(z => Math.max(50, z - 25))}
                  className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-muted disabled:opacity-30"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="min-w-[3rem] text-center font-mono text-[11px] text-foreground/60">{zoom}%</span>
                <button
                  type="button"
                  disabled={zoom >= 150}
                  onClick={() => setZoom(z => Math.min(150, z + 25))}
                  className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-muted disabled:opacity-30"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              {showPdf && !doc.previewUrl && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-muted disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-mono text-[11px] text-foreground/60">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-muted disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Canvas */}
            <div className="flex flex-1 items-start justify-center overflow-auto p-4 sm:p-6">
              {doc.previewUrl && showPdf ? (
                <iframe
                  title={doc.fileName}
                  src={doc.previewUrl}
                  className="h-full min-h-[420px] w-full max-w-3xl rounded-lg border border-border bg-white shadow-md"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                />
              ) : doc.previewUrl && showImage ? (
                <img
                  src={doc.previewUrl}
                  alt={doc.name}
                  className="max-w-full rounded-lg border border-border bg-white shadow-md"
                  style={{ width: `${zoom}%` }}
                />
              ) : showImage ? (
                <MockImagePreview name={doc.name} fileName={doc.fileName} zoom={zoom} />
              ) : (
                <MockPdfPreview
                  name={doc.name}
                  fileName={doc.fileName}
                  requestId={requestId}
                  page={page}
                  zoom={zoom}
                />
              )}
            </div>
          </div>

          {/* Access log sidebar */}
          <aside className="flex max-h-[40%] w-full shrink-0 flex-col border-t border-border bg-white lg:max-h-none lg:w-[300px] lg:border-l lg:border-t-0">
            <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <Eye size={12} className="text-foreground/50" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
                Document Access Log
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              {log.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-foreground/40">
                  <AlertCircle size={18} />
                  <p className="text-xs">No access events recorded yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {log.map((entry, i) => (
                    <li key={`${entry.date}-${entry.time}-${entry.action}-${i}`} className="px-4 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{entry.user}</p>
                          {entry.role && (
                            <p className="text-[10px] text-foreground/45">{entry.role}</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                            entry.action === "Downloaded"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : entry.action === "Uploaded"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {entry.action}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-foreground/40">
                        {entry.date} · {entry.time}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="shrink-0 border-t border-border bg-slate-50 px-4 py-2">
              <p className="text-[10px] text-foreground/40">
                {log.length} event{log.length === 1 ? "" : "s"} · Restricted access
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MockPdfPreview({
  name,
  fileName,
  requestId,
  page,
  zoom,
}: {
  name: string;
  fileName: string;
  requestId?: Number;
  page: number;
  zoom: number;
}) {
  return (
    <div
      className="w-full max-w-[520px] origin-top rounded-sm border border-slate-300 bg-white shadow-lg"
      style={{ transform: `scale(${zoom / 100})` }}
    >
      <div className="border-b border-slate-200 px-8 py-6" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)" }}>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded" style={{ background: "#1a2d6e" }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">eThekwini Municipality</p>
            <p className="text-[9px] text-slate-400">Ellipse User Access Management</p>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Barlow, sans-serif" }}>
          {name}
        </h3>
        <p className="mt-1 font-mono text-[11px] text-slate-500">{fileName}</p>
        {requestId && (
          <p className="mt-3 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-600">
            Linked request: {requestId.toString()}
          </p>
        )}
      </div>

      <div className="space-y-3 px-8 py-6">
        {page === 1 ? (
          <>
            <div className="h-2.5 w-full rounded bg-slate-100" />
            <div className="h-2.5 w-[92%] rounded bg-slate-100" />
            <div className="h-2.5 w-[88%] rounded bg-slate-100" />
            <div className="my-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 h-2 w-16 rounded bg-slate-200" />
                <div className="h-8 rounded bg-slate-50" />
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 h-2 w-20 rounded bg-slate-200" />
                <div className="h-8 rounded bg-slate-50" />
              </div>
            </div>
            <div className="h-2.5 w-full rounded bg-slate-100" />
            <div className="h-2.5 w-[75%] rounded bg-slate-100" />
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <FileText size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">Certified document preview</p>
              <p className="mt-1 text-[10px] text-slate-400">Page 1 of 2 · Demo render (wire to API file stream for live preview)</p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Certification / Annexure</div>
            <div className="h-2.5 w-full rounded bg-slate-100" />
            <div className="h-2.5 w-[85%] rounded bg-slate-100" />
            <div className="h-2.5 w-[90%] rounded bg-slate-100" />
            <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-6">
              <div>
                <div className="mb-2 h-8 w-28 rounded border border-slate-200 bg-slate-50" />
                <p className="text-[10px] text-slate-400">Authorised signature</p>
              </div>
              <div className="text-right">
                <div className="mb-1 h-10 w-10 rounded-full border-2 border-emerald-300 bg-emerald-50" />
                <p className="text-[10px] text-emerald-600 font-semibold">Verified</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-slate-200 px-8 py-3 text-[9px] text-slate-400">
        Confidential — for authorised municipal use only · POPIA protected
      </div>
    </div>
  );
}

function MockImagePreview({
  name,
  fileName,
  zoom,
}: {
  name: string;
  fileName: string;
  zoom: number;
}) {
  return (
    <div
      className="flex aspect-[3/4] w-full max-w-[360px] flex-col items-center justify-center rounded-lg border border-slate-300 bg-gradient-to-b from-slate-50 to-slate-200 shadow-lg"
      style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
    >
      <FileText size={48} className="mb-3 text-slate-400" />
      <p className="px-6 text-center text-sm font-bold text-slate-600">{name}</p>
      <p className="mt-1 font-mono text-[10px] text-slate-400">{fileName}</p>
      <p className="mt-4 text-[10px] text-slate-400">Image preview placeholder</p>
    </div>
  );
}
