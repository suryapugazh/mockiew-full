import { useState, useRef, useEffect, useCallback } from "react";
import { AgentEventsEnum } from "@heygen/liveavatar-web-sdk";

/**
 * useConversationTracker
 *
 * Owns the full interview transcript (both interviewer and candidate turns).
 * Tracks per-message metadata: word count, response delay, and input mode.
 * Wires HeyGen SDK event listeners for AVATAR_TRANSCRIPTION and USER_TRANSCRIPTION.
 *
 * @param {object} params
 * @param {React.MutableRefObject} params.sessionRef    - HeyGen LiveAvatarSession ref
 * @param {boolean}               params.isActive       - Whether voice chat is currently active
 * @param {string}                params.inputMode      - "voice" | "text"
 * @param {function}              params.sendMessage    - SDK sendMessage (text path)
 * @param {function}              params.onAvatarClose  - Called when avatar utters a closing phrase
 */
export function useConversationTracker({
  sessionRef,
  isActive,
  inputMode,
  sendMessage,
  onAvatarClose,
}) {
  const [conversation, setConversation] = useState([]);
  const [message, setMessage] = useState("");

  // Stable ref so lifecycle/summary hooks always read current transcript
  const conversationRef = useRef([]);

  // Timestamp of last avatar audio stop — used to measure candidate response delay
  const avatarStoppedTimestampRef = useRef(null);

  // Keep conversationRef in sync with state
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // ─── SDK Event Listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionRef.current) return;

    const handleAvatarSpeech = (event) => {
      if (!event?.text) return;

      const now = Date.now();

      setConversation((prev) => [
        ...prev,
        {
          role: "interviewer",
          text: event.text,
          timestamp: now,
        },
      ]);

      // Detect final closing phrase → hand off to lifecycle hook
      const lower = event.text.toLowerCase();
      const isFinalClosing =
        lower.includes("this concludes our mock interview") ||
        lower.includes("this concludes our interview") ||
        lower.includes("this concludes the interview") ||
        lower.includes("thank you for your responses") ||
        lower.includes("have a great day");

      if (isFinalClosing) {
        onAvatarClose?.();
      }
    };

    const handleUserSpeech = (event) => {
      if (!isActive) return;
      if (inputMode !== "voice") return;
      if (!event?.text) return;

      const now = Date.now();
      const wordCount = event.text.trim().split(/\s+/).length;
      const responseDelay = avatarStoppedTimestampRef.current
        ? now - avatarStoppedTimestampRef.current
        : null;

      setConversation((prev) => [
        ...prev,
        {
          role: "candidate",
          text: event.text,
          timestamp: now,
          wordCount,
          responseDelayMs: responseDelay,
          mode: "voice",
        },
      ]);
    };

    sessionRef.current.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, handleAvatarSpeech);
    sessionRef.current.on(AgentEventsEnum.USER_TRANSCRIPTION, handleUserSpeech);

    return () => {
      sessionRef.current.off(AgentEventsEnum.AVATAR_TRANSCRIPTION, handleAvatarSpeech);
      sessionRef.current.off(AgentEventsEnum.USER_TRANSCRIPTION, handleUserSpeech);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRef, isActive, inputMode]);

  // ─── Text Message Send ────────────────────────────────────────────────────
  const handleTextSend = useCallback(() => {
    if (!message.trim()) return;

    const wordCount = message.trim().split(/\s+/).length;

    setConversation((prev) => [
      ...prev,
      {
        role: "candidate",
        text: message,
        timestamp: Date.now(),
        wordCount,
        responseDelayMs: 0,
        mode: "text",
      },
    ]);

    sendMessage(message);
    setMessage("");
  }, [message, sendMessage]);

  return {
    conversation,
    conversationRef,
    avatarStoppedTimestampRef,
    message,
    setMessage,
    handleTextSend,
  };
}
