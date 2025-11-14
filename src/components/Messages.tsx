import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/message";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { chatMessagesAtom } from "@/lib/atoms";

export default function Messages() {
  const [messages, setMessages] = useAtom(chatMessagesAtom);

  return (
    <>
      {messages.map((message, index) => {
        const isAssistant = message.role === "assistant";
        const isLastMessage = index === messages.length - 1;

        return (
          <Message
            key={index}
            className={cn(
              "mx-auto flex w-full max-w-3xl flex-col gap-2 px-6",
              isAssistant ? "items-start" : "items-end"
            )}
          >
            {isAssistant ? (
              <div className="group flex w-full flex-col gap-0">
                <MessageContent
                  className="text-foreground prose space-y-2 flex-1 rounded-lg bg-transparent p-0"
                  markdown
                >
                  {(message.parts[message.parts.length - 1] as any)?.text ?? ""}
                </MessageContent>
                <MessageActions
                  className={cn(
                    "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                    isLastMessage && "opacity-100"
                  )}
                >
                  <MessageAction tooltip="Copy" delayDuration={100}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <Copy />
                    </Button>
                  </MessageAction>
                </MessageActions>
              </div>
            ) : (
              <div className="group flex flex-col items-end gap-1">
                <MessageContent className="bg-muted text-primary rounded-3xl px-5 py-2.5">
                  {(message.parts[message.parts.length - 1] as any)?.text ?? ""}
                </MessageContent>
                <MessageActions
                  className={cn(
                    "flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  )}
                >
                  <MessageAction tooltip="Copy" delayDuration={100}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <Copy />
                    </Button>
                  </MessageAction>
                </MessageActions>
              </div>
            )}
          </Message>
        );
      })}
    </>
  );
}
