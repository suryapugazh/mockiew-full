import { useEffect, useRef, useCallback } from "react";
import { SessionState } from "@heygen/liveavatar-web-sdk";

/**
 * useInterviewLifecycle
 *
 * Orchestrates the full interview session lifecycle:
 *  1. Auto-starts session when inactive
 *  2. Attaches avatar video stream when ready
 *  3. Handles all three completion triggers:
 *       a) Avatar utters a closing phrase (via onAvatarClose callback)
 *       b) Session disconnects unexpectedly
 *       c) 60-second hard timeout
 *  4. Assembles the EvaluationPayload from gaze, conversation, and silence metrics
 *  5. Fires onEvaluationStart(payload) when interview ends
 *
 * @param {object} params
 * @param {string}              params.sessionState            - Current HeyGen session state
 * @param {boolean}             params.isStreamReady           - Whether the avatar stream is live
 * @param {function}            params.startSession            - SDK startSession()
 * @param {function}            params.stopSession             - SDK stopSession()
 * @param {function}            params.startVoice              - SDK voice chat start
 * @param {function}            params.stopVoice               - SDK voice chat stop
 * @param {function}            params.attachElement           - SDK attachElement(videoEl)
 * @param {React.RefObject}     params.videoRef                - Ref to the avatar <video> element
 * @param {object}              params.gazeMetrics             - Current { totalFrames, centerFrames }
 * @param {React.MutableRefObject} params.conversationRef      - Stable ref to transcript array
 * @param {React.MutableRefObject} params.totalSilenceDurationRef
 * @param {React.MutableRefObject} params.longSilenceCountRef
 * @param {React.MutableRefObject} params.avatarStoppedTimestampRef - Updated when avatar stops talking
 * @param {boolean}             params.isAvatarTalking          - SDK talking indicator
 * @param {object}              params.interviewData            - Parsed resume data with skills/projects
 * @param {function}            params.onEvaluationStart        - Callback: fires with assembled payload
 */
export function useInterviewLifecycle({
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
}) {
  // Deduplication guard — prevents multiple evaluations firing at once
  const interviewCompletedRef = useRef(false);

  // Stores the last-computed summary (pre-computed before session ends)
  const summaryRef = useRef(null);

  // Stable ref for gazeMetrics so async callbacks always read current value
  const gazeRef = useRef(gazeMetrics);
  useEffect(() => {
    gazeRef.current = gazeMetrics;
  }, [gazeMetrics]);

  // ─── Session Startup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState === SessionState.INACTIVE) {
      startSession();
    }
  }, [sessionState, startSession]);

  // ─── Attach Video Stream ──────────────────────────────────────────────────
  useEffect(() => {
    if (isStreamReady && videoRef.current) {
      attachElement(videoRef.current);
    }
  }, [isStreamReady, attachElement, videoRef]);

  // ─── Auto-start Voice when Connected ─────────────────────────────────────
  useEffect(() => {
    if (sessionState === SessionState.CONNECTED) {
      startVoice();
    }
  }, [sessionState, startVoice]);

  // ─── Track When Avatar Stops Talking ─────────────────────────────────────
  useEffect(() => {
    if (!isAvatarTalking) {
      avatarStoppedTimestampRef.current = Date.now();
    }
  }, [isAvatarTalking, avatarStoppedTimestampRef]);

  // ─── Metric Assembly ──────────────────────────────────────────────────────
  /**
   * Reads all accumulated refs and computes the full interview summary.
   * Called just before session teardown so refs are still populated.
   */
  const computeInterviewSummary = useCallback(() => {
    const transcript = conversationRef.current;

    const total = gazeRef.current.totalFrames;
    const center = gazeRef.current.centerFrames;
    const attentionPercentage = total > 0 ? (center / total) * 100 : 0;
    const eyeContactScore = (attentionPercentage / 100) * 10;

    const candidateResponses = transcript.filter((msg) => msg.role === "candidate");
    const voiceResponses = candidateResponses.filter((msg) => msg.mode === "voice");
    const textResponses = candidateResponses.filter((msg) => msg.mode === "text");

    const totalAnswers = candidateResponses.length;
    const totalWords = candidateResponses.reduce((sum, msg) => sum + (msg.wordCount || 0), 0);
    const totalDelay = candidateResponses.reduce((sum, msg) => sum + (msg.responseDelayMs || 0), 0);

    const avgWords = totalAnswers > 0 ? totalWords / totalAnswers : 0;
    const avgDelayMs = totalAnswers > 0 ? totalDelay / totalAnswers : 0;

    const shortAnswers = candidateResponses.filter((msg) => msg.wordCount <= 2).length;
    const longDelays = candidateResponses.filter((msg) => msg.responseDelayMs > 3000).length;

    // Only include silence metrics if the interview was voice-dominant
    const silenceMs = voiceResponses.length > 0 ? totalSilenceDurationRef.current : 0;
    const longSilence = voiceResponses.length > 0 ? longSilenceCountRef.current : 0;

    const summary = {
      gaze: {
        totalFrames: total,
        centerFrames: center,
        attention_percentage: attentionPercentage,
        eye_contact_score: eyeContactScore,
      },
      communication_metrics: {
        avg_words: avgWords,
        avg_delay_ms: avgDelayMs,
        short_answers: shortAnswers,
        long_hesitations: longDelays,
        total_silence_ms: silenceMs,
        long_silence_count: longSilence,
      },
      interaction_summary: {
        voice_answers: voiceResponses.length,
        text_answers: textResponses.length,
        voice_ratio:
          candidateResponses.length > 0
            ? voiceResponses.length / candidateResponses.length
            : 0,
      },
    };

    summaryRef.current = summary;
    return summary;
  }, [conversationRef, totalSilenceDurationRef, longSilenceCountRef]);

  // ─── Completion Handler ───────────────────────────────────────────────────
  /**
   * Single point of exit for all completion triggers.
   * Guarded by interviewCompletedRef to prevent duplicate evaluations.
   */
  const handleInterviewCompletion = useCallback(
    (reason) => {
      if (interviewCompletedRef.current) return;
      interviewCompletedRef.current = true;

      console.log("[useInterviewLifecycle] Interview completed, reason:", reason);

      const summary = summaryRef.current || computeInterviewSummary();

      const minimalResume = {
        skills: interviewData?.skills || [],
        projects: (interviewData?.projects || []).map((p) => ({
          name: p.name,
          technologies: p.technologies || [],
        })),
      };

      const payload = {
        resume: minimalResume,
        transcript: conversationRef.current,
        ...summary,
      };

      console.log("[useInterviewLifecycle] Sending evaluation payload:", payload);
      onEvaluationStart(payload);
    },
    [computeInterviewSummary, conversationRef, interviewData, onEvaluationStart]
  );

  // ─── Completion Trigger 1: Avatar closing phrase ──────────────────────────
  // Exposed as a callback — called by useConversationTracker when detected.
  const onAvatarClose = useCallback(() => {
    stopVoice();
    stopSession();
    handleInterviewCompletion("avatar_completed");
  }, [stopVoice, stopSession, handleInterviewCompletion]);

  // ─── Completion Trigger 2: Session disconnected ───────────────────────────
  useEffect(() => {
    if (sessionState === SessionState.DISCONNECTED) {
      stopVoice();
      stopSession();
      handleInterviewCompletion("disconnected");
    }
  }, [sessionState, stopVoice, stopSession, handleInterviewCompletion]);

  // ─── Completion Trigger 3: 60-second timeout from FIRST avatar speech ────────
  // Timer starts when the avatar first begins speaking — not on mount —
  // so the countdown accurately reflects the actual interview duration.
  const timerStartedRef = useRef(false);
  const timeoutIdRef    = useRef(null);

  useEffect(() => {
    if (!isAvatarTalking || timerStartedRef.current) return;
    timerStartedRef.current = true;

    timeoutIdRef.current = setTimeout(() => {
      stopVoice();
      stopSession();
      handleInterviewCompletion("timeout");
    }, 60_000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvatarTalking]);

  // Cleanup the timeout if component unmounts before it fires
  useEffect(() => () => clearTimeout(timeoutIdRef.current), []);

  return {
    onAvatarClose,
    summaryRef,
    handleInterviewCompletion, // exposed for manual End button in UI
  };
}
