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
import { toast } from "sonner";
import { isStreamingInit } from "@/lib/atoms";

function Loader() {
  return (
    <div className="bg-primary animate-[pulse-dot_1.2s_ease-in-out_infinite] rounded-full size-3">
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function Messages() {
  const [messages] = useAtom(chatMessagesAtom);
  const [isStreamingInitState] = useAtom(isStreamingInit);

  const handleCopy = async (message: any) => {
    try {
      const text = (message.parts[message.parts.length - 1] as any)?.text ?? "";
      if (!text) {
        toast.error("No text to copy");
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  console.log(messages);

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
                {((message.parts[message.parts.length - 1] as any)?.text ?? "")
                  .length == 0 ? (
                  <Loader />
                ) : (
                  <>
                    <MessageContent
                      className="text-foreground prose space-y-2 flex-1 rounded-lg bg-transparent p-0"
                      markdown
                    >
                      {(message.parts[message.parts.length - 1] as any)?.text ??
                        ""}
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
                          onClick={() => handleCopy(message)}
                        >
                          <Copy />
                        </Button>
                      </MessageAction>
                    </MessageActions>
                  </>
                )}
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
                      onClick={() => handleCopy(message)}
                    >
                      <Copy />
                    </Button>
                  </MessageAction>
                </MessageActions>
              </div>
            )}
            {isLastMessage && isStreamingInitState ? (
              <div className="group flex w-full flex-col gap-0">
                <Loader />
              </div>
            ) : (
              <></>
            )}
          </Message>
        );
      })}
    </>
  );
}
