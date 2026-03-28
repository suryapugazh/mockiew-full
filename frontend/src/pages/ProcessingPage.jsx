import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { FASTAPI_URL } from "../config/apiUrls";

// ─── Enterprise color palette (Lottie RGBA arrays) ───────────────────────────
// Lottie uses [R,G,B,A] in 0-1 range. These map to our design tokens.
const EC = {
  indigo:    [0.388, 0.400, 0.945, 1],   // #6366F1 — accent
  indigoSoft:[0.933, 0.945, 1.000, 1],   // #EEF2FF — accent-light
  slate200:  [0.898, 0.906, 0.922, 1],   // #E5E7EB — border
  white:     [1.000, 1.000, 1.000, 1],   // #FFFFFF
  black:     [0.000, 0.000, 0.000, 1],   // #000000
};

// Classifies and remaps a Lottie RGBA array to enterprise palette
function remapColor(c) {
  if (!Array.isArray(c) || c.length < 3) return c;
  const [r, g, b] = c;
  const isBlue      = b > 0.6 && r < 0.3;
  const isLightBlue = b > 0.8 && r > 0.8 && g > 0.8;
  const isMidBlue   = b > 0.7 && r > 0.6 && g > 0.7;
  if (isBlue)      return [...EC.indigo];
  if (isLightBlue) return [...EC.indigoSoft];
  if (isMidBlue)   return [...EC.slate200];
  return c;
}

// Deep-walks a Lottie JSON object and remaps all fill/stroke colors
function recolorLottie(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(recolorLottie);
  const result = {};
  for (const key of Object.keys(obj)) {
    // Fill type "fl", stroke type "st", gradient fill "gf"
    if ((obj.ty === "fl" || obj.ty === "st") && key === "c") {
      const raw = obj[key];
      if (raw?.a === 0 && Array.isArray(raw.k)) {
        result[key] = { ...raw, k: remapColor(raw.k) };
      } else {
        result[key] = recolorLottie(raw);
      }
    } else {
      result[key] = recolorLottie(obj[key]);
    }
  }
  return result;
}

// ─── Lottie local paths ───────────────────────────────────────────────────────
const LOTTIE = {
  parse:    "/lottie/doc-scan.json",
  generate: "/lottie/questions-list.json",
  avatar:   "/lottie/interviewer.json",
};

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = {
  pre: [
    { key: "parse",    src: LOTTIE.parse,    label: "Analyzing Resume"          },
    { key: "generate", src: LOTTIE.generate, label: "Personalizing Questions"   },
    { key: "avatar",   src: LOTTIE.avatar,   label: "Preparing AI Interviewer"  },
  ],
  post: [
    { key: "parse",    src: LOTTIE.parse,    label: "Analyzing Communication"   },
    { key: "generate", src: LOTTIE.generate, label: "Computing Behavioral Score" },
    { key: "avatar",   src: LOTTIE.avatar,   label: "Finalizing Assessment"     },
  ],
};

// ─── Interview tips ───────────────────────────────────────────────────────────
const TIPS = [
  "Sit straight and keep your posture relaxed.",
  "Look at the camera — not the screen.",
  "Take a slow breath. You're well prepared.",
  "Speak clearly and at a measured pace.",
  "It's fine to pause briefly before answering.",
  "Be concise — quality answers beat long ones.",
  "A calm, confident tone goes a long way.",
  "Close unnecessary tabs to stay focused.",
];

// ─── Animation variants ───────────────────────────────────────────────────────
// Lottie icon: slides left on exit, enters from right
const iconVariants = {
  enter:  { x: 80, opacity: 0 },
  center: { x: 0,  opacity: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:   { x: -80, opacity: 0, transition: { duration: 0.28, ease: [0.55, 0, 1, 0.45] } },
};

// Text label: fades up on enter, fades down on exit (independent of icon)
const textVariants = {
  enter:  { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0,  transition: { duration: 0.32, ease: "easeOut", delay: 0.08 } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.22, ease: "easeIn" } },
};

// Tips: simple cross-fade
const tipVariants = {
  enter:  { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.5 } },
  exit:   { opacity: 0, transition: { duration: 0.35 } },
};

// ─── useLottieData — fetches + recolors a Lottie JSON ────────────────────────
function useLottieData(src) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    fetch(src)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((json) => setData(recolorLottie(json)))
      .catch(() => setError(true));
  }, [src]);

  return { data, error };
}

// ─── LottieFrame — renders one Lottie with slide transition ──────────────────
function LottieFrame({ step }) {
  const { data, error } = useLottieData(step.src);

  return (
    <motion.div
      key={step.key}
      variants={iconVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="flex items-center justify-center"
      style={{ width: 220, height: 220 }}
    >
      {data ? (
        <Lottie animationData={data} loop autoplay style={{ width: 220, height: 220 }} />
      ) : error ? (
        <motion.div
          className="w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <motion.div
          className="w-24 h-24 rounded-2xl bg-slate-100"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

// ─── StepTracker — enterprise numbered step indicator ────────────────────────
// Nodes are always 28×28px in the DOM. Active node uses scale:1, inactive uses
// scale:0.75 — scale is GPU-composited and causes ZERO layout reflow.
function StepTracker({ steps, activeIndex }) {
  return (
    // Fixed height = 28px (max node size). Nothing below this ever shifts.
    <div className="flex items-center gap-0" style={{ height: 28 }}>
      {steps.map((step, i) => {
        const isActive   = i === activeIndex;
        const isComplete = i < activeIndex;
        const isLast     = i === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center" style={{ height: 28 }}>
            {/* Node — fixed 28×28, scale animates visually without affecting layout */}
            <motion.div
              animate={{
                scale:           isActive ? 1 : 0.75,
                backgroundColor: isActive ? "#000000" : isComplete ? "#000000" : "#F1F5F9",
                borderColor:     isActive ? "#000000" : isComplete ? "#000000" : "#E2E8F0",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="rounded-full border flex items-center justify-center"
              style={{ width: 28, height: 28, flexShrink: 0 }}
            >
              <motion.span
                animate={{
                  color:    isActive || isComplete ? "#ffffff" : "#94A3B8",
                }}
                transition={{ duration: 0.3 }}
                className="text-[10px] font-semibold tracking-tight leading-none select-none"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {isComplete ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  `0${i + 1}`
                )}
              </motion.span>
            </motion.div>

            {/* Connector line — fixed 2px height, won't shift */}
            {!isLast && (
              <div className="relative mx-1.5" style={{ width: 40, height: 2, flexShrink: 0 }}>
                <div className="absolute inset-0 rounded-full bg-slate-200" />
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-black"
                  animate={{ width: isComplete ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TipBadge ─────────────────────────────────────────────────────────────────
function TipBadge({ tip }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tip}
        variants={tipVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50"
      >
        <span className="text-[10px] font-medium tracking-widest uppercase text-slate-400 select-none">
          Tip
        </span>
        <span className="text-[12px] text-slate-500 tracking-tight">
          {tip}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── ProcessingPage ────────────────────────────────────────────────────────────
export default function ProcessingPage({
  mode,
  resumeData,
  onSessionReady,
  onEvaluationReady,
  evaluationPayload,
}) {
  const steps = STEPS[mode] ?? STEPS.pre;

  const [stepIndex, setStepIndex] = useState(0);
  const [tipIndex,  setTipIndex]  = useState(() =>
    Math.floor(Math.random() * TIPS.length)
  );

  const lastProcessedMode = useRef(null);

  // ── Cycle steps every 3s ──────────────────────────────────────────────────
  useEffect(() => {
    setStepIndex(0);
    const id = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(id);
  }, [mode, steps.length]);

  // ── Cycle tips every 4s (offset from steps) ───────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // ── API orchestration (unchanged) ─────────────────────────────────────────
  useEffect(() => {
    if (lastProcessedMode.current === mode) return;
    lastProcessedMode.current = mode;

    async function run() {
      if (mode === "pre") {
        const formData = new FormData();
        formData.append("resume", resumeData);

        const parseRes = await fetch(`${FASTAPI_URL}/parse`, {
          method: "POST",
          body: formData,
        });
        const data = await parseRes.json();

        const sessionRes = await fetch(`${FASTAPI_URL}/create-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, questions: data.questions }),
        });
        const { session_token } = await sessionRes.json();
        onSessionReady({ sessionToken: session_token, interviewData: data });
      }

      if (mode === "post") {
        const res = await fetch(`${FASTAPI_URL}/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evaluationPayload),
        });
        const result = await res.json();
        onEvaluationReady(result);
      }
    }

    run();
  }, [mode, resumeData, onSessionReady, onEvaluationReady, evaluationPayload]);

  const currentStep = steps[stepIndex];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-sm">

        {/* ── Lottie icon — slides left/right on step change ───────────── */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ width: 220, height: 220 }}
        >
          <AnimatePresence mode="wait">
            <LottieFrame key={`${mode}-${stepIndex}`} step={currentStep} />
          </AnimatePresence>
        </div>

        {/* ── Text label — fades up/down independently ─────────────────── */}
        <div className="h-8 flex items-center justify-center overflow-hidden -mt-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={`label-${mode}-${stepIndex}`}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-[15px] font-semibold tracking-tight text-black whitespace-nowrap"
            >
              {currentStep.label}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── Step tracker — numbered nodes with fill connector ────────── */}
        <StepTracker steps={steps} activeIndex={stepIndex} />

        {/* ── Tip badge — fixed height so cross-fade never shifts layout ─── */}
        <div className="flex items-center justify-center mt-2" style={{ height: 36 }}>
          <TipBadge tip={TIPS[tipIndex]} />
        </div>

      </div>
    </div>
  );
}