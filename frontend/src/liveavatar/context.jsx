import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ConnectionQuality,
  LiveAvatarSession,
  SessionState,
  SessionEvent,
  VoiceChatEvent,
  VoiceChatState,
  AgentEventsEnum,
} from "@heygen/liveavatar-web-sdk";
const API_URL = "https://api.liveavatar.com";

export const LiveAvatarContext = createContext({
  sessionRef: { current: null },
  connectionQuality: ConnectionQuality.UNKNOWN,
  isMuted: true,
  voiceChatState: VoiceChatState.INACTIVE,
  sessionState: SessionState.DISCONNECTED,
  isStreamReady: false,
  isUserTalking: false,
  isAvatarTalking: false,
  messages: [],
});

const useSessionState = (sessionRef) => {
  const [sessionState, setSessionState] = useState(
    sessionRef.current?.state || SessionState.INACTIVE
  );

  const [connectionQuality, setConnectionQuality] = useState(
    sessionRef.current?.connectionQuality || ConnectionQuality.UNKNOWN
  );

  const [isStreamReady, setIsStreamReady] = useState(false);

  useEffect(() => {
    if (!sessionRef.current) return;

    sessionRef.current.on(
      SessionEvent.SESSION_STATE_CHANGED,
      (state) => {
        setSessionState(state);

        if (state === SessionState.DISCONNECTED) {
          sessionRef.current.removeAllListeners();
          sessionRef.current.voiceChat.removeAllListeners();
          setIsStreamReady(false);
        }
      }
    );

    sessionRef.current.on(
      SessionEvent.SESSION_STREAM_READY,
      () => setIsStreamReady(true)
    );

    sessionRef.current.on(
      SessionEvent.SESSION_CONNECTION_QUALITY_CHANGED,
      setConnectionQuality
    );
  }, [sessionRef]);

  return { sessionState, isStreamReady, connectionQuality };
};

const useVoiceChatState = (sessionRef) => {
  const [isMuted, setIsMuted] = useState(true);
  const [voiceChatState, setVoiceChatState] = useState(
    sessionRef.current?.voiceChat.state || VoiceChatState.INACTIVE
  );

  useEffect(() => {
    if (!sessionRef.current) return;

    sessionRef.current.voiceChat.on(VoiceChatEvent.MUTED, () =>
      setIsMuted(true)
    );

    sessionRef.current.voiceChat.on(VoiceChatEvent.UNMUTED, () =>
      setIsMuted(false)
    );

    sessionRef.current.voiceChat.on(
      VoiceChatEvent.STATE_CHANGED,
      setVoiceChatState
    );
  }, [sessionRef]);

  return { isMuted, voiceChatState };
};

const useTalkingState = (sessionRef) => {
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);

  useEffect(() => {
    if (!sessionRef.current) return;

    sessionRef.current.on(AgentEventsEnum.USER_SPEAK_STARTED, () =>
      setIsUserTalking(true)
    );

    sessionRef.current.on(AgentEventsEnum.USER_SPEAK_ENDED, () =>
      setIsUserTalking(false)
    );

    sessionRef.current.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () =>
      setIsAvatarTalking(true)
    );

    sessionRef.current.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () =>
      setIsAvatarTalking(false)
    );
  }, [sessionRef]);

  return { isUserTalking, isAvatarTalking };
};

export const LiveAvatarContextProvider = ({
  children,
  sessionAccessToken,
  voiceChatConfig = true,
}) => {
  const config = {
    voiceChat: voiceChatConfig,
    apiUrl: API_URL,
  };

  const sessionRef = useRef(
    new LiveAvatarSession(sessionAccessToken, config)
  );

  const { sessionState, isStreamReady, connectionQuality } =
    useSessionState(sessionRef);

  const { isMuted, voiceChatState } = useVoiceChatState(sessionRef);
  const { isUserTalking, isAvatarTalking } =
    useTalkingState(sessionRef);

  return (
    <LiveAvatarContext.Provider
      value={{
        sessionRef,
        sessionState,
        isStreamReady,
        connectionQuality,
        isMuted,
        voiceChatState,
        isUserTalking,
        isAvatarTalking,
        messages: [],
      }}
    >
      {children}
    </LiveAvatarContext.Provider>
  );
};

export const useLiveAvatarContext = () =>
  useContext(LiveAvatarContext);
