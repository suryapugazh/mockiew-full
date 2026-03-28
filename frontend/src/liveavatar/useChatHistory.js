import { useLiveAvatarContext } from "./context.jsx";

export const useChatHistory = () => {
  const { messages } = useLiveAvatarContext();
  return messages;
};
