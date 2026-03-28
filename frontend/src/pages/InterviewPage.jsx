"use client";

import { useRef, useState } from "react";

import {
  LiveAvatarContextProvider,
  useSession,
  useTextChat,
  useVoiceChat,
  useLiveAvatarContext,
} from "../liveavatar";

import EyeTracker from "../components/EyeTracker";

import { useConversationTracker } from "../hooks/useConversationTracker";
import { useSilenceDetector } from "../hooks/useSilenceDetector";
import { useInterviewLifecycle } from "../hooks/useInterviewLifecycle";

// ─── AvatarUI ──────────────────────────────────────────────────────────────
// Thin UI component — no business logic. All state comes from hooks.

function AvatarUI({ interviewData, onExit, onEvaluationStart }) {
  const videoRef = useRef(null);
  const [inputMode, setInputMode] = useState("voice");
  const [gazeMetrics, setGazeMetrics] = useState({ totalFrames: 0, centerFrames: 0 });

  // ── HeyGen SDK ─────────────────────────────────────────────────────────
  const { sessionState, isStreamReady, startSession, stopSession, attachElement } =
    useSession();

  const { sendMessage } = useTextChat("FULL");
  const { sessionRef } = useLiveAvatarContext();

  const {
    start: startVoice,
    stop: stopVoice,
    isActive,
    isUserTalking,
    isAvatarTalking,
  } = useVoiceChat();

  // ── Silence Detection ──────────────────────────────────────────────────
  const { totalSilenceDurationRef, longSilenceCountRef } = useSilenceDetector({
    isActive,
    inputMode,
  });

  // ── Conversation Tracking ──────────────────────────────────────────────
  // onAvatarClose is wired in after lifecycle hook is initialised (see below)
  const onAvatarCloseRef = useRef(null);

  const {
    conversation,
    conversationRef,
    avatarStoppedTimestampRef,
    message,
    setMessage,
    handleTextSend,
  } = useConversationTracker({
    sessionRef,
    isActive,
    inputMode,
    sendMessage,
    // Delegate to lifecycle hook via stable ref so we avoid a circular dep
    onAvatarClose: () => onAvatarCloseRef.current?.(),
  });

  // ── Interview Lifecycle ────────────────────────────────────────────────
  const { onAvatarClose } = useInterviewLifecycle({
    sessionState,
    isStreamReady,
    startSession,
    stopSession,
    startVoice,
    stopVoice,
    attachElement,
    videoRef,
    gazeMetrics,
    conversationRef,
    totalSilenceDurationRef,
    longSilenceCountRef,
    avatarStoppedTimestampRef,
    isAvatarTalking,
    interviewData,
    onEvaluationStart,
  });

  // Wire lifecycle's onAvatarClose into the stable ref after it is created
  onAvatarCloseRef.current = onAvatarClose;

  // ── Voice toggle handlers ──────────────────────────────────────────────
  function handleStartVoice() {
    startVoice();
    setInputMode("voice");
  }

  function handleStopVoice() {
    stopVoice();
    setInputMode("text");
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ textAlign: "center" }}>

      {/* Avatar video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={854}
        height={480}
        style={{
          backgroundImage: 'url("/avatar.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Eye tracker — renders a hidden <video> for MediaPipe FaceMesh */}
      <EyeTracker onMetricsUpdate={setGazeMetrics} />

      {/* Controls */}
      <div style={{ marginTop: 20 }}>

        {/* Text input (only visible in text mode) */}
        {inputMode === "text" && (
          <>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextSend();
              }}
            />
            <button onClick={handleTextSend}>Send</button>
          </>
        )}

        {/* Voice toggle */}
        {inputMode === "text" ? (
          <button onClick={handleStartVoice}>Start Voice</button>
        ) : (
          <button onClick={handleStopVoice}>Stop Voice</button>
        )}

        {/* Talking indicators */}
        {isUserTalking && <p>User Speaking...</p>}
        {isAvatarTalking && <p>Avatar Speaking...</p>}

        {/* Exit */}
        <button
          onClick={() => {
            stopSession();
            onExit();
          }}
        >
          Exit
        </button>
      </div>
    </div>
  );
}


// ─── InterviewPage ─────────────────────────────────────────────────────────
// Thin wrapper that provides the HeyGen context to AvatarUI.
// LiveAvatarContextProvider must be the outermost boundary so all hooks
// (useSession, useVoiceChat, useLiveAvatarContext) resolve correctly.

export default function InterviewPage({
  sessionToken,
  interviewData,
  onEvaluationStart,
  onExit,
}) {
  return (
    <LiveAvatarContextProvider
      sessionAccessToken={sessionToken}
      voiceChatConfig={true}
    >
      <AvatarUI
        interviewData={interviewData}
        onExit={onExit}
        onEvaluationStart={onEvaluationStart}
      />
    </LiveAvatarContextProvider>
  );
}