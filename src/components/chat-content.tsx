import { useState, useRef, useEffect } from "react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-input";
import { ArrowUp, Globe, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UIMessage } from "@ai-sdk/react";
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/chat-container";
import { ScrollButton } from "@/components/scroll-button";

export default function ChatContent({
  messagesContent,
  isLoading,
  setPrompt,
  handleSubmit,
  prompt,
  stop,
  isSearchEnabled,
  setSearchEnabled,
  setStreamingInit,
}: {
  messagesContent: React.ReactNode;
  isLoading: boolean;
  setPrompt: (prompt: string) => void;
  handleSubmit: () => void;
  prompt: string;
  stop: () => void;
  isSearchEnabled: boolean;
  setSearchEnabled: (isSearchEnabled: boolean) => void;
  setStreamingInit: (isStreamingInit: boolean) => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldStopRef = useRef(false);
  const currentPromptRef = useRef(prompt);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Update the ref whenever prompt changes
  useEffect(() => {
    currentPromptRef.current = prompt;
  }, [prompt]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            }
          }
          if (finalTranscript) {
            setPrompt(currentPromptRef.current + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error !== "no-speech") {
            shouldStopRef.current = true;
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          // Only restart if user hasn't manually stopped it
          if (!shouldStopRef.current && isListening) {
            try {
              recognition.start();
            } catch (e) {
              console.error("Could not restart recognition", e);
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        shouldStopRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in your browser.");
      return;
    }

    if (isListening) {
      shouldStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      shouldStopRef.current = false;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start recognition", e);
      }
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-0 px-5 py-12">
            {messagesContent}
          </ChatContainerContent>
          <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
            <ScrollButton className="shadow-sm" />
          </div>
        </ChatContainerRoot>
      </div>
      <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
          >
            <div className="flex flex-col">
              <PromptInputTextarea
                placeholder="Ask anything"
                className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base bg-transparent dark:bg-transparent"
              />

              <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
                <div className="flex items-center gap-2">
                  <PromptInputAction tooltip="Search">
                    <Button
                      onClick={() => setSearchEnabled(!isSearchEnabled)}
                      variant="outline"
                      data-state={isSearchEnabled ? "active" : "inactive"}
                      className="rounded-full text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
                    >
                      <Globe size={18} />
                      Search
                    </Button>
                  </PromptInputAction>
                </div>
                <div className="flex items-center gap-2">
                  {/* Voice input button */}
                  <PromptInputAction
                    tooltip={isListening ? "Stop listening" : "Voice input"}
                  >
                    <Button
                      onClick={toggleVoiceInput}
                      variant="outline"
                      size="icon"
                      className={`size-9 rounded-full ${
                        isListening
                          ? "bg-red-500 text-white hover:bg-red-600 hover:text-white border-red-500 animate-pulse"
                          : ""
                      }`}
                    >
                      <Mic size={18} />
                    </Button>
                  </PromptInputAction>
                  {isLoading ? (
                    <Button
                      size="icon"
                      onClick={() => {
                        stop();
                        setStreamingInit(false);
                      }}
                      className="size-9 rounded-full"
                    >
                      <span className="size-3 rounded-xs bg-white" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      disabled={!prompt.trim()}
                      onClick={handleSubmit}
                      className="size-9 rounded-full"
                    >
                      <ArrowUp size={18} />
                    </Button>
                  )}
                </div>
              </PromptInputActions>
            </div>
          </PromptInput>
        </div>
      </div>
    </main>
  );
}
