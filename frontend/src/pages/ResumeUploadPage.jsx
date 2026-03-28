import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileUp, File, X, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_MIME = "application/pdf";
const MAX_SIZE_MB = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ErrorToast({ message, onDismiss }) {
  return (
    <motion.div
      key="toast"
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{   opacity: 0, y: -8, scale: 0.97  }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-enterprise w-full"
      role="alert"
    >
      <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={15} />
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 text-red-400 hover:text-red-600 border-0 bg-transparent p-0 shadow-none"
        aria-label="Dismiss error"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ─── ResumeUploadPage ─────────────────────────────────────────────────────────
export default function ResumeUploadPage({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);   // File | null
  const [dragging,     setDragging]     = useState(false);
  const [error,        setError]        = useState(null);   // string | null
  const [uploading,    setUploading]    = useState(false);

  const inputRef = useRef(null);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = useCallback((file) => {
    if (!file) return "No file detected.";
    if (file.type !== ACCEPTED_MIME)
      return "Invalid format. Please upload a PDF resume to continue.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`;
    return null;
  }, []);

  const handleFile = useCallback((file) => {
    setError(null);
    const err = validate(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }, [validate]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── File input change ────────────────────────────────────────────────────
  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected after removal
    e.target.value = "";
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    // onUploadSuccess expects the raw File object — App.jsx passes it to ProcessingPage
    onUploadSuccess(selectedFile);
    // uploading state is intentionally not reset — page will unmount on stage change
  };

  const canSubmit = !!selectedFile && !uploading;

  // ── Computed classes for drop zone ──────────────────────────────────────
  const dropZoneBase =
    "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-12 text-center cursor-pointer transition-colors duration-150 select-none";
  const dropZoneIdle   = "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50";
  const dropZoneDrag   = "border-black bg-slate-50";
  const dropZoneFilled = "border-slate-300 bg-slate-50 cursor-default";

  const dropZoneClass =
    dragging      ? `${dropZoneBase} ${dropZoneDrag}`   :
    selectedFile  ? `${dropZoneBase} ${dropZoneFilled}` :
                    `${dropZoneBase} ${dropZoneIdle}`;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Upload your resume
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            We'll extract your profile and prepare a personalised AI mock interview.
            Only <span className="font-medium text-black">PDF files</span> are accepted.
          </p>
        </div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-[#FAFAFA] p-6 shadow-enterprise space-y-5">

          {/* Error toast */}
          <AnimatePresence mode="wait">
            {error && (
              <ErrorToast
                key="error"
                message={error}
                onDismiss={() => setError(null)}
              />
            )}
          </AnimatePresence>

          {/* Drop zone */}
          <motion.div
            whileHover={!selectedFile ? { scale: 1.01 } : {}}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={dropZoneClass}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !selectedFile && inputRef.current?.click()}
            role="button"
            aria-label="Resume upload drop zone"
            tabIndex={selectedFile ? -1 : 0}
            onKeyDown={(e) => {
              if (!selectedFile && (e.key === "Enter" || e.key === " ")) {
                inputRef.current?.click();
              }
            }}
          >
            <AnimatePresence mode="wait">
              {selectedFile ? (
                /* ── File selected state ── */
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white border border-slate-200 shadow-enterprise">
                    <File size={22} className="text-black" />
                  </div>

                  <div className="space-y-0.5 max-w-xs w-full">
                    <p
                      className="text-sm font-medium text-black truncate"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 border-slate-200 hover:border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors"
                    aria-label="Remove selected file"
                  >
                    <X size={12} />
                    Remove
                  </button>
                </motion.div>
              ) : (
                /* ── Empty / idle state ── */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.div
                    animate={dragging
                      ? { scale: 1.15, rotate: -4 }
                      : { scale: 1,    rotate: 0  }
                    }
                    transition={{ type: "spring", stiffness: 340, damping: 22 }}
                    className="flex items-center justify-center w-12 h-12 rounded-lg bg-white border border-slate-200 shadow-enterprise"
                  >
                    <FileUp size={22} className={dragging ? "text-black" : "text-slate-400"} />
                  </motion.div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-black">
                      {dragging ? "Drop your resume here" : "Drag & drop your resume"}
                    </p>
                    <p className="text-xs text-slate-500">
                      or{" "}
                      <span className="text-black underline underline-offset-2 cursor-pointer">
                        browse files
                      </span>
                      {" "}· PDF only · Max {MAX_SIZE_MB} MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden native file input */}
            <input
              ref={inputRef}
              id="resume-file-input"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={onInputChange}
              tabIndex={-1}
            />
          </motion.div>

          {/* ── Primary CTA ───────────────────────────────────────────── */}
          <motion.button
            id="start-analysis-btn"
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className={[
              "w-full flex items-center justify-center gap-2",
              "rounded-lg px-5 py-2.5",
              "text-sm font-medium",
              "bg-black text-white border border-black",
              "transition-all duration-150",
              !canSubmit
                ? "opacity-40 cursor-not-allowed"
                : "hover:!bg-zinc-800 hover:!border-zinc-800 hover:!text-white active:!bg-zinc-900",
            ].join(" ")}
            aria-disabled={!canSubmit}
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Preparing interview…
              </>
            ) : (
              <>
                Start Interview
                <ArrowRight size={15} />
              </>
            )}
          </motion.button>
        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <p className="text-center text-xs text-slate-400 leading-relaxed">
          Your resume is processed locally and never stored permanently.
        </p>
      </div>
    </div>
  );
}