"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Mic, MicOff, MessageSquare, X, Minimize2, AlignLeft, PhoneOff, Send, Camera } from "lucide-react";
import { SessionState } from "@heygen/liveavatar-web-sdk";

import { LiveAvatarContextProvider, useSession, useTextChat, useVoiceChat, useLiveAvatarContext } from "../liveavatar";
import EyeTracker from "../components/EyeTracker";
import { useConversationTracker } from "../hooks/useConversationTracker";
import { useSilenceDetector } from "../hooks/useSilenceDetector";
import { useInterviewLifecycle } from "../hooks/useInterviewLifecycle";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ─── Studio Intro ─────────────────────────────────────────────────────────────
function StudioIntro({ name, onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2400);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div key="intro" initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center gap-7">

      {/* Live badge */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
        <motion.div className="w-2 h-2 rounded-full bg-red-500"
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-white/50">Live Interview</span>
      </motion.div>

      {/* Heading */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }} className="text-center space-y-2">
        <h1 className="text-[28px] font-semibold tracking-tight text-white">Interview Session</h1>
        <p className="text-[13px] text-white/35 tracking-tight">
          {name ? `Candidate · ${name}` : "Connecting to your AI interviewer…"}
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="w-48 h-px bg-white/[0.08] relative rounded-full overflow-hidden">
        <motion.div className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          transition={{ duration: 1.8, ease: "easeIn", delay: 0.5 }} />
      </motion.div>
    </motion.div>
  );
}

// ─── Studio Outro ─────────────────────────────────────────────────────────────
function StudioOutro() {
  return (
    <motion.div key="outro" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p className="text-[11px] tracking-[0.15em] uppercase text-white/30 text-center mb-3">Session Ended</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white text-center">Processing results…</h1>
      </motion.div>
    </motion.div>
  );
}

// ─── ConnectionBadge ─────────────────────────────────────────────────────────
function ConnectionBadge({ sessionState }) {
  const ok = sessionState === SessionState.CONNECTED;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${ok ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
      <motion.div className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-400" : "bg-amber-400"}`}
        animate={ok ? {} : { opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      {ok ? "Connected" : "Connecting…"}
    </div>
  );
}

// ─── CtrlBtn ──────────────────────────────────────────────────────────────────
function CtrlBtn({ icon, label, active, locked, onClick }) {
  return (
    <button onClick={locked ? undefined : onClick}
      title={locked ? "Active mode — currently in use" : label}
      className={[
        "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl",
        "!bg-transparent !border-0 !shadow-none transition-colors min-w-[56px]",
        active ? "!bg-white/10 text-white hover:!bg-white/15 hover:!text-white"
               : "text-white/50 hover:!text-white/80 hover:!bg-white/[0.06]",
        locked ? "!cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}>
      {icon}
      <span className="text-[10px] leading-none tracking-tight">{label}</span>
    </button>
  );
}

// ─── AvatarUI ─────────────────────────────────────────────────────────────────
function AvatarUI({ interviewData, onEvaluationStart, onOutro }) {
  const videoRef       = useRef(null);
  const selfViewRef    = useRef(null);
  const chatInputRef   = useRef(null);
  const onAvatarCloseRef = useRef(null);
  const prevStateRef   = useRef(null);

  const [inputMode, setInputMode]       = useState("voice");
  const [gazeMetrics, setGazeMetrics]   = useState({ totalFrames: 0, centerFrames: 0 });
  const [chatOpen, setChatOpen]         = useState(false);
  const [showTranscript, setShowTx]     = useState(false);
  const [timeLeft, setTimeLeft]         = useState(60);
  const [timerStarted, setTimerStarted] = useState(false); // useState so JSX re-renders on start
  const [selfViewOpen, setSelfViewOpen] = useState(false);

  // ── SDK ──────────────────────────────────────────────────────────────────
  const { sessionState, isStreamReady, startSession, stopSession, attachElement } = useSession();
  const { sendMessage } = useTextChat("FULL");
  const { sessionRef }  = useLiveAvatarContext();
  const { start: startVoice, stop: stopVoice, isActive, isAvatarTalking } = useVoiceChat();

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { totalSilenceDurationRef, longSilenceCountRef } = useSilenceDetector({ isActive, inputMode });

  const { conversation, conversationRef, avatarStoppedTimestampRef, message, setMessage, handleTextSend } =
    useConversationTracker({
      sessionRef, isActive, inputMode, sendMessage,
      onAvatarClose: () => onAvatarCloseRef.current?.(),
    });

  const { onAvatarClose, handleInterviewCompletion } = useInterviewLifecycle({
    sessionState, isStreamReady, startSession, stopSession,
    startVoice, stopVoice, attachElement, videoRef, gazeMetrics,
    conversationRef, totalSilenceDurationRef, longSilenceCountRef,
    avatarStoppedTimestampRef, isAvatarTalking, interviewData, onEvaluationStart,
  });

  onAvatarCloseRef.current = onAvatarClose;

  // ── Self-view camera stream ───────────────────────────────────────────────
  useEffect(() => {
    if (!selfViewOpen) return;
    let stream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => { stream = s; if (selfViewRef.current) selfViewRef.current.srcObject = s; })
      .catch(() => {});
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [selfViewOpen]);

  // ── Timer — starts on first avatar speech ─────────────────────────────────
  const timerStartedRef = useRef(false);
  useEffect(() => {
    if (!isAvatarTalking || timerStartedRef.current) return;
    timerStartedRef.current = true;
    setTimerStarted(true);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvatarTalking]);

  // ── Network status toast ──────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = sessionState;
    if (prev === SessionState.CONNECTED &&
        sessionState !== SessionState.CONNECTED &&
        sessionState !== SessionState.DISCONNECTED) {
      toast("Connection quality degraded — reconnecting…", {
        id: "net-warn", icon: "⚠️",
        style: { background: "#18181B", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)", fontSize: "13px" },
      });
    }
  }, [sessionState]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const lastAvatarText = conversation.filter(m => m.role === "interviewer").pop()?.text;

  // ── Actions ───────────────────────────────────────────────────────────────
  const openChat = useCallback(() => {
    setChatOpen(true); setInputMode("text"); stopVoice();
    setTimeout(() => chatInputRef.current?.focus(), 320);
  }, [stopVoice]);

  const closeChat = useCallback(() => {
    setChatOpen(false); setInputMode("voice"); startVoice();
  }, [startVoice]);

  const handleManualEnd = useCallback(() => {
    onOutro();
    setTimeout(() => {
      stopVoice(); stopSession(); handleInterviewCompletion("manual_exit");
    }, 700);
  }, [onOutro, stopVoice, stopSession, handleInterviewCompletion]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col overflow-hidden">

      <Toaster position="top-right" toastOptions={{ style: {
        background: "#18181B", color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px", padding: "12px 16px",
        fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif",
      }}} />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex-none h-14 px-6 flex items-center justify-between border-b border-white/[0.06] z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white/80">M</span>
          </div>
          <div>
            <p className="text-[12px] font-medium text-white/80 leading-none">Mockiew</p>
            <p className="text-[10px] text-white/30 mt-0.5">Live Session</p>
          </div>
        </div>

        <ConnectionBadge sessionState={sessionState} />

        {/* Timer — renders blank space until started so layout doesn't shift */}
        <div className="w-16 flex items-center justify-end">
          {timerStarted && (
            <span className={`text-[13px] font-mono tracking-widest tabular-nums ${timeLeft <= 10 ? "text-red-400" : "text-white/50"}`}>
              {fmt(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* ── Main stage ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Avatar stage */}
        <motion.div className="relative bg-zinc-950 flex items-center justify-center overflow-hidden"
          animate={{ width: chatOpen ? "58%" : "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}>

          {/* Video — 16:9 default, fills stage when chat open */}
          <video ref={videoRef} autoPlay playsInline
            className={`object-cover border border-white/[0.05] shadow-2xl transition-all duration-500 ${
              chatOpen
                ? "w-full h-full rounded-xl"               // fills narrowed stage, slight round
                : "rounded-lg"                              // 16:9, minimal rounding
            }`}
            style={chatOpen
              ? { backgroundImage: 'url("/avatar.png")', backgroundSize: "cover" }
              : {
                  aspectRatio: "16/9",
                  width: "100%",
                  maxHeight: "calc(100vh - 140px)",
                  backgroundImage: 'url("/avatar.png")',
                  backgroundSize: "cover",
                }
            }
          />

          {/* Transcript overlay — centers under avatar, above controls */}
          <AnimatePresence>
            {showTranscript && lastAvatarText && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.22 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
                style={{ width: chatOpen ? "90%" : "min(680px, 88%)" }}>
                <div className="px-5 py-4 bg-black/75 backdrop-blur-md rounded-2xl border border-white/[0.08]">
                  <p className="text-[10px] font-medium tracking-widest uppercase text-white/30 mb-2">Interviewer said</p>
                  <p className="text-[14px] text-white/90 leading-relaxed tracking-tight">{lastAvatarText}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Chat panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="flex-none bg-white border-l border-slate-200 flex flex-col" style={{ width: "42%" }}>

              <div className="flex-none px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold tracking-tight text-black">Text Mode</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Close to re-enable voice</p>
                </div>
                <button onClick={closeChat}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-black hover:!bg-slate-100 !border-0 !bg-transparent !shadow-none p-0">
                  <X size={16} />
                </button>
              </div>

              {lastAvatarText && (
                <div className="flex-none px-5 py-4 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-medium tracking-widest uppercase text-slate-400 mb-1.5">Current Question</p>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{lastAvatarText}</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {conversation.length === 0
                  ? <p className="text-[12px] text-slate-400 text-center mt-8">Your conversation will appear here.</p>
                  : conversation.slice(-20).map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === "candidate" ? "bg-black text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                }
              </div>

              <div className="flex-none px-4 py-4 border-t border-slate-100">
                <div className="flex items-end gap-2">
                  <textarea ref={chatInputRef} value={message} onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSend(); } }}
                    placeholder="Type your answer… (Enter to send)" rows={2}
                    className="flex-1 resize-none text-[13px] placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:border-black focus:bg-white outline-none leading-relaxed" />
                  {/* Send button — larger icon */}
                  <button onClick={handleTextSend} disabled={!message.trim()}
                    className="w-11 h-11 flex items-center justify-center rounded-xl !bg-black text-white !border-0 disabled:opacity-40 hover:!bg-zinc-800 hover:!text-white flex-shrink-0">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Self-view PiP — appears ABOVE the controls bar, anchored to the right */}
        <AnimatePresence>
          {selfViewOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.88 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="absolute bottom-24 right-6 z-30 w-[200px] h-[150px] rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
              <video ref={selfViewRef} autoPlay playsInline muted
                className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
              <div className="absolute top-2 right-2">
                <button onClick={() => setSelfViewOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-md !bg-black/60 !border-0 !shadow-none text-white/70 hover:!bg-black/80 hover:!text-white p-0">
                  <Minimize2 size={12} />
                </button>
              </div>
              <span className="absolute bottom-2 left-3 text-[9px] text-white/40 select-none">You</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div className="flex-none h-20 flex items-center justify-center border-t border-white/[0.06] z-20">
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-2">

          {/* Voice — locked when active */}
          <CtrlBtn icon={isActive ? <Mic size={20} /> : <MicOff size={20} />}
            label="Voice" active={inputMode === "voice"} locked={inputMode === "voice"}
            onClick={closeChat} />

          {/* Text */}
          <CtrlBtn icon={<MessageSquare size={20} />} label="Text"
            active={inputMode === "text"} onClick={chatOpen ? closeChat : openChat} />

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Transcribe */}
          <CtrlBtn icon={<AlignLeft size={20} />} label="Transcribe"
            active={showTranscript} onClick={() => setShowTx(v => !v)} />

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Camera — static, toggles PiP above bar */}
          <CtrlBtn icon={<Camera size={20} />} label="Camera"
            active={selfViewOpen} onClick={() => setSelfViewOpen(v => !v)} />

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* End — red */}
          <button onClick={handleManualEnd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl !bg-red-600 text-white text-[13px] font-medium tracking-tight !border-0 hover:!bg-red-700 hover:!text-white transition-colors">
            <PhoneOff size={15} />
            End
          </button>
        </div>
      </div>

      <EyeTracker onMetricsUpdate={setGazeMetrics} />
    </div>
  );
}

// ─── InterviewPage ────────────────────────────────────────────────────────────
export default function InterviewPage({ sessionToken, interviewData, onEvaluationStart, onExit }) {
  const [phase, setPhase] = useState("intro"); // "intro" | "live" | "outro"

  return (
    <LiveAvatarContextProvider sessionAccessToken={sessionToken} voiceChatConfig={true}>
      <div className="relative w-screen h-screen bg-zinc-950 overflow-hidden">

        {/* Cinematic intro */}
        <AnimatePresence>
          {phase === "intro" && (
            <StudioIntro key="intro"
              name={interviewData?.name}
              onComplete={() => setPhase("live")} />
          )}
        </AnimatePresence>

        {/* Outro fade */}
        <AnimatePresence>
          {phase === "outro" && <StudioOutro key="outro" />}
        </AnimatePresence>

        {/* Live UI — mounts immediately so session starts in background during intro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "live" ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
          style={{ pointerEvents: phase === "live" ? "auto" : "none" }}>
          <AvatarUI
            interviewData={interviewData}
            onEvaluationStart={onEvaluationStart}
            onOutro={() => setPhase("outro")}
          />
        </motion.div>
      </div>
    </LiveAvatarContextProvider>
  );
}