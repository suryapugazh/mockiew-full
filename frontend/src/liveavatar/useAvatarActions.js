import { useCallback } from "react";
import { useLiveAvatarContext } from "./context.jsx";

export const useAvatarActions = (mode) => {
  const { sessionRef } = useLiveAvatarContext();

  const interrupt = useCallback(
    () => sessionRef.current.interrupt(),
    [sessionRef]
  );

  const repeat = useCallback(
    (message) => sessionRef.current.repeat(message),
    [sessionRef]
  );

  const startListening = useCallback(
    () => sessionRef.current.startListening(),
    [sessionRef]
  );

  const stopListening = useCallback(
    () => sessionRef.current.stopListening(),
    [sessionRef]
  );

  return { interrupt, repeat, startListening, stopListening };
};
