import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, RefreshCw, CheckCircle2, AlertCircle,
  Star, TrendingUp, Eye, MessageSquare, Mic, ChevronDown,
} from "lucide-react";

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const staggerSlow = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } };

// ─── Circular Score Ring ──────────────────────────────────────────────────────
function ScoreRing({ score = 0, size = 152, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;     /** Math.max((score, 0), 100 / 100) */
  const offset = circ - (Math.min(Math.max(score, 0), 10) / 10) * circ;
  const color = score >= 8 ? "#16a34a" : score >= 6 ? "#0f172a" : "#dc2626";
                       /** 80 ? ... : 60 ? ... : 0*/

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.35 }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <motion.span className="text-[32px] font-bold tracking-tight text-black tabular-nums leading-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          {Math.round(score)}
        </motion.span>
        <span className="text-[10px] text-slate-400 tracking-[0.1em] uppercase mt-1">/ 10</span>
      </div>
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ value = 0, outOf = 10 }) {
  const filled = Math.round((value / outOf) * 5);
  return (
    <div className="flex gap-0.5 mt-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={15}
          className={i <= filled ? "text-black fill-black" : "text-slate-200 fill-slate-200"} />
      ))}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ icon, label, children }) {
  return (
    <motion.div variants={fadeUp}
      className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col gap-4 hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">{label}</span>
      </div>
      {children}
    </motion.div>
  );
}

// ─── InsightItem ──────────────────────────────────────────────────────────────
function InsightItem({ text, type }) {
  return (
    <motion.li variants={fadeUp} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      {type === "strength"
        ? <CheckCircle2 size={14} className="text-green-500 mt-[3px] flex-shrink-0" />
        : <AlertCircle  size={14} className="text-amber-500 mt-[3px] flex-shrink-0" />
      }
      <span className="text-[13px] text-slate-700 leading-relaxed">{text}</span>
    </motion.li>
  );
}

// ─── TranscriptItem ───────────────────────────────────────────────────────────
function TranscriptItem({ msg, index, query }) {
  const [open, setOpen] = useState(false);
  const isCandidate = msg.role === "candidate";

  const badge =
    isCandidate && (msg.responseDelayMs ?? 0) > 3000
      ? { label: "Hesitation", cls: "bg-amber-50 text-amber-600 border-amber-200" }
      : isCandidate && (msg.wordCount ?? 0) > 50
      ? { label: "Detailed",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : isCandidate && (msg.wordCount ?? 0) <= 2 && msg.wordCount != null
      ? { label: "Brief",      cls: "bg-slate-100 text-slate-500 border-slate-200" }
      : null;

  // Highlight search query
  const highlight = (text = "") => {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.split(re).map((part, i) =>
      re.test(part) ? <mark key={i} className="bg-yellow-100 text-black rounded px-0.5">{part}</mark> : part
    );
  };

  return (
    <motion.div variants={fadeUp} className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-4 py-3.5 px-1 text-left !bg-transparent !border-0 !shadow-none cursor-pointer hover:!bg-slate-50 rounded-lg transition-colors">
        <span className={`text-[10px] font-semibold tracking-[0.1em] uppercase pt-0.5 w-14 flex-shrink-0 ${
          isCandidate ? "text-black" : "text-slate-400"}`}>
          {isCandidate ? "You" : "AI"}
        </span>
        <span className="flex-1 text-[13px] text-slate-700 leading-relaxed line-clamp-2">
          {highlight(msg.text)}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          <ChevronDown size={13} className={`text-slate-300 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="mx-1 mb-3 px-5 py-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[13px] text-slate-600 leading-relaxed">
              {highlight(msg.text)}
              {isCandidate && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  {msg.wordCount != null && <span>{msg.wordCount} words</span>}
                  {msg.responseDelayMs != null && (
                    <span>{(msg.responseDelayMs / 1000).toFixed(1)}s delay</span>
                  )}
                  {msg.mode && <span className="capitalize">{msg.mode} mode</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div className={`bg-slate-100 rounded-lg animate-pulse ${className}`} />
  );
}

// ─── ResultPage ───────────────────────────────────────────────────────────────
export default function ResultPage({ evaluationResult, evaluationPayload, interviewData, onRestart }) {
  const [txSearch, setTxSearch] = useState("");

  const isLoading = !evaluationResult;

  // Safe data extraction with fallbacks
  const r   = evaluationResult || {};
  const p   = evaluationPayload || {};
  const gaze = p.gaze || {};
  const comm = p.communication_metrics || {};
  const inter = p.interaction_summary || {};
  const transcript = p.transcript || [];

  const overall    = r.overall_score || 0;
  const technical  = r.technical_score || 0;
  const commScore  = r.communication_score || 0;
  const behavioral = r.behavioral_score || 0;
  const strengths  = r.strengths || [];
  const weaknesses = r.weaknesses || [];
  const suggestions = r.improvement_suggestions || [];
  const feedback   = r.detailed_feedback || "";

  const gazePercent  = gaze.eye_contact_score != null ? Math.round((gaze.eye_contact_score / 10) * 100) : null;
  const avgWords     = comm.avg_words != null ? Math.round(comm.avg_words) : null;
  const longSilences = comm.long_silence_count ?? null;
  const voiceRatio   = inter.voice_ratio != null ? Math.round(inter.voice_ratio * 100) : null;
  const totalAnswers = transcript.filter(m => m.role === "candidate").length;

  const candidateName = interviewData?.name || "Candidate";
  const role = interviewData?.role || interviewData?.position || "Software Engineer";

  const filteredTx = useMemo(() =>
    transcript.filter(m => !txSearch || m.text?.toLowerCase().includes(txSearch.toLowerCase())),
    [transcript, txSearch]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">M</span>
          </div>
          <span className="text-[13px] font-semibold text-black tracking-tight">Mockiew</span>
          <span className="text-slate-300 mx-1">·</span>
          <span className="text-[12px] text-slate-400">Evaluation Report</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-[12px] font-medium text-slate-600 hover:!bg-slate-50 !bg-white !shadow-none transition-colors">
            <Download size={13} /> Download PDF
          </button>
          <button onClick={onRestart}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl !bg-black text-white text-[12px] font-medium !border-0 hover:!bg-zinc-800 transition-colors">
            <RefreshCw size={13} /> New Interview
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">

        {/* ── Executive Summary header ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="border border-slate-200 rounded-2xl p-8 bg-white flex items-center gap-10">

          {/* Score ring */}
          {isLoading ? <Skeleton className="w-[152px] h-[152px] rounded-full" /> : <ScoreRing score={overall} />}

          {/* Name, role, sub-scores */}
          <div className="flex-1">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-400 mb-2">
              Interview Assessment
            </p>
            {isLoading
              ? <>
                  <Skeleton className="h-7 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              : <>
                  <h1 className="text-2xl font-bold tracking-tight text-black">{candidateName}</h1>
                  <p className="text-[13px] text-slate-500 mt-1">{role}</p>
                </>
            }
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {[
                { label: "Technical",    val: technical  },
                { label: "Communication", val: commScore },
                { label: "Behavioral",   val: behavioral },
              ].map(({ label, val }) => (
                <span key={label} className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-medium">
                  {label} · {isLoading ? "—" : val}
                </span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">Match Score</p>
            {isLoading
              ? <Skeleton className="h-10 w-20 ml-auto" />                                  /** Math.round(overall) */
              : <p className="text-[40px] font-bold text-black tracking-tight leading-none">{overall * 10}%</p>
            }
          </div>
        </motion.div>

        {/* ── 4-column Metric grid ─────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <MetricCard icon={<Eye size={14} />} label="Gaze Stability">
            {isLoading
              ? <Skeleton className="h-8 w-20" />
              : <>
                  <p className="text-2xl font-bold tracking-tight text-black">
                    {gazePercent != null ? `${gazePercent}%` : "—"}
                  </p>
                  <p className="text-[11px] text-slate-400">Eye contact maintained</p>
                </>
            }
          </MetricCard>

          <MetricCard icon={<Mic size={14} />} label="Comm. Fluidity">
            {isLoading
              ? <Skeleton className="h-8 w-20" />
              : <>
                  <p className="text-2xl font-bold tracking-tight text-black">{commScore}<span className="text-sm text-slate-400 font-normal">/10</span></p>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    {longSilences != null && <p>{longSilences} long pause{longSilences !== 1 ? "s" : ""}</p>}
                    {voiceRatio != null && <p>{voiceRatio}% voice answers</p>}
                  </div>
                </>
            }
          </MetricCard>

          <MetricCard icon={<MessageSquare size={14} />} label="Response Quality">
            {isLoading
              ? <Skeleton className="h-8 w-20" />
              : <>
                  <p className="text-2xl font-bold tracking-tight text-black">
                    {avgWords != null ? avgWords : "—"}
                    <span className="text-sm text-slate-400 font-normal"> w/ans</span>
                  </p>
                  <p className="text-[11px] text-slate-400">{totalAnswers} total answers</p>
                </>
            }
          </MetricCard>

          <MetricCard icon={<TrendingUp size={14} />} label="Technical Accuracy">
            {isLoading
              ? <Skeleton className="h-8 w-20" />
              : <>
                  <Stars value={technical} outOf={10} />
                  <p className="text-[11px] text-slate-400 mt-1">{technical}/10 accuracy</p>
                </>
            }
          </MetricCard>
        </motion.div>

        {/* ── Behavioral Insights ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Strengths */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={14} className="text-green-500" />
              <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">Strengths</h2>
            </div>
            {isLoading
              ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
              : strengths.length > 0
                ? <motion.ul variants={staggerSlow} initial="hidden" animate="show" className="space-y-1">
                    {strengths.map((s, i) => <InsightItem key={i} text={s} type="strength" />)}
                  </motion.ul>
                : <p className="text-[13px] text-slate-400">No strengths data available.</p>
            }
          </motion.div>

          {/* Areas for Growth */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={14} className="text-amber-500" />
              <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">Areas for Growth</h2>
            </div>
            {isLoading
              ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
              : [...weaknesses, ...suggestions].length > 0
                ? <motion.ul variants={staggerSlow} initial="hidden" animate="show" className="space-y-1">
                    {[...weaknesses, ...suggestions].map((w, i) => <InsightItem key={i} text={w} type="growth" />)}
                  </motion.ul>
                : <p className="text-[13px] text-slate-400">No improvement data available.</p>
            }
          </motion.div>
        </div>

        {/* ── Detailed feedback ─────────────────────────────────────────── */}
        {(feedback || isLoading) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="border border-slate-200 rounded-2xl px-6 py-5">
            <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 mb-3">AI Analysis</h2>
            {isLoading
              ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-3.5 w-full" />)}</div>
              : <p className="text-[13px] text-slate-700 leading-relaxed">{feedback}</p>
            }
          </motion.div>
        )}

        {/* ── Interactive Transcript ────────────────────────────────────── */}
        {transcript.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            className="border border-slate-200 rounded-2xl overflow-hidden">

            {/* Transcript header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">
                  Full Transcript
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{transcript.length} turns</p>
              </div>
              <div className="relative no-print">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={txSearch} onChange={e => setTxSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg bg-white focus:border-black focus:bg-white outline-none w-44 placeholder:text-slate-400" />
              </div>
            </div>

            <motion.div variants={staggerSlow} initial="hidden" animate="show"
              className="px-5 py-2 max-h-[420px] overflow-y-auto divide-y-0">
              {filteredTx.length === 0
                ? <p className="text-[12px] text-slate-400 py-8 text-center">No messages match your search.</p>
                : filteredTx.map((msg, i) => <TranscriptItem key={i} msg={msg} index={i} query={txSearch} />)
              }
            </motion.div>
          </motion.div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}