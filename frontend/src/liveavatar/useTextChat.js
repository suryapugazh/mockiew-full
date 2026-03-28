import { useCallback } from "react";
import { useLiveAvatarContext } from "./context.jsx";

export const useTextChat = (mode) => {
  const { sessionRef } = useLiveAvatarContext();

  const sendMessage = useCallback(
    async (message) => {
      if (mode === "FULL") {
        return sessionRef.current.message(message);
      }
    },
    [sessionRef, mode]
  );

  return { sendMessage };
};
