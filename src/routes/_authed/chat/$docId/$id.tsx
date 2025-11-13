import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/message";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useAtom } from "jotai";
import { chatMessagesAtom } from "@/lib/atoms";
// Initial chat messages
const initialMessages = [
  {
    id: 1,
    role: "user",
    content: "Hello! Can you help me with a coding question?",
  },
  {
    id: 2,
    role: "assistant",
    content:
      "Of course! I'd be happy to help with your coding question. What would you like to know?",
  },
  {
    id: 3,
    role: "user",
    content: "How do I create a responsive layout with CSS Grid?",
  },
  {
    id: 4,
    role: "assistant",
    content:
      "Creating a responsive layout with CSS Grid is straightforward. Here's a basic example:\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1rem;\n}\n```\n\nThis creates a grid where:\n- Columns automatically fit as many as possible\n- Each column is at least 250px wide\n- Columns expand to fill available space\n- There's a 1rem gap between items\n\nWould you like me to explain more about how this works?",
  },
];
export const Route = createFileRoute("/_authed/chat/$docId/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const [messages, setMessages] = useAtom(chatMessagesAtom);

  console.log("messages", messages);

  return (
    <>
      {initialMessages.map((message, index) => {
        const isAssistant = message.role === "assistant";
        const isLastMessage = index === initialMessages.length - 1;

        return (
          <Message
            key={message.id}
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
                  {message.content}
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
                <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%]">
                  {message.content}
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
