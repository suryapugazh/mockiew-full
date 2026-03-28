import { useCallback, useMemo } from "react";
import { useLiveAvatarContext } from "./context.jsx";
import { VoiceChatState } from "@heygen/liveavatar-web-sdk";

export const useVoiceChat = () => {
  const {
    sessionRef,
    isMuted,
    voiceChatState,
    isUserTalking,
    isAvatarTalking,
  } = useLiveAvatarContext();

  const mute = useCallback(
    () => sessionRef.current.voiceChat.mute(),
    [sessionRef]
  );

  const unmute = useCallback(
    () => sessionRef.current.voiceChat.unmute(),
    [sessionRef]
  );

  const start = useCallback(
    () => sessionRef.current.voiceChat.start(),
    [sessionRef]
  );

  const stop = useCallback(
    () => sessionRef.current.voiceChat.stop(),
    [sessionRef]
  );

  const isLoading = useMemo(
    () => voiceChatState === VoiceChatState.STARTING,
    [voiceChatState]
  );

  const isActive = useMemo(
    () => voiceChatState === VoiceChatState.ACTIVE,
    [voiceChatState]
  );

  return {
    mute,
    unmute,
    start,
    stop,
    isLoading,
    isActive,
    isMuted,
    isUserTalking,
    isAvatarTalking,
  };
};
