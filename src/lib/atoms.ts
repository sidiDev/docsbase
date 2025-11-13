import { atom } from "jotai";
import { UIMessage } from "ai";

export const chatMessagesAtom = atom<UIMessage[]>([]);
