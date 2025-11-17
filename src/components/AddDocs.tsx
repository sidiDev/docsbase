import { ArrowUp, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import DocProgress from "./DocProgress";
import { validateUrl } from "@/lib/functions";
import { isValidUrl } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useMutation, useConvex } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import starterDocs from "@/lib/starter";

export default function AddDocs({
  setStartCrawling,
  setIsOpen,
}: {
  setIsOpen?: (isOpen: boolean) => void;
  setStartCrawling: (startCrawling: boolean) => void;
}) {
  const { user } = useUser();
  const convex = useConvex();
  const mutateDoc = useMutation(api.docs.createDoc);

  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [docId, setDocId] = useState<string>("");
  const [isCrawlDone, setIsCrawlDone] = useState(false);
  const [docsName, setDocsName] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showStarterDialog, setShowStarterDialog] = useState(false);
  const [isLoadingStarter, setIsLoadingStarter] = useState(false);

  const [documents, setDocuments] = useState<
    Array<{
      url: string;
      title: string;
      content?: string;
      createdAt: number;
      updatedAt: number;
    }>
  >([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL");
      return;
    }
    setShowNameDialog(false);
    setStep(1);
    setStartCrawling(true);
    setIsLoading(true);
    setDocuments([]); // Reset documents for new crawl
    const { message, success } = await validateUrl({ data: { url } } as any);
    if (message == "Invalid URL") {
      toast.error("Invalid URL");
      setIsLoading(false);
      return;
    }
    if (success) {
      setUrl("");
      setTimeout(() => {
        setStep(2);
      }, 1000);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_CLOUDFLARE_API_URL}/crawl-docs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to start crawl");
        }

        // Read SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        const processStream = async () => {
          let buffer = ""; // Buffer for incomplete messages

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                setIsCrawlDone(true);
                console.log("Crawl stream closed, polling for completion...");
                break;
              }

              // Decode chunk and add to buffer
              buffer += decoder.decode(value, { stream: true });

              // Split by double newline (SSE message separator)
              const messages = buffer.split("\n\n");

              // Keep the last incomplete message in buffer
              buffer = messages.pop() || "";

              for (const message of messages) {
                const lines = message.split("\n");

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    try {
                      const event = JSON.parse(line.slice(6));

                      if (event.type === "started" && user?.id) {
                        // Create doc in Convex
                        const docId = await mutateDoc({
                          doc: {
                            crawlJobId: event.data.id,
                            completed: false,
                            url: event.data.url,
                            name: docsName || event.data.name,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            externalId: user.id,
                            pages: [],
                          },
                        });
                        setDocId(docId);
                      } else if (event.type === "document") {
                        setDocuments((prev) => {
                          const updated = [...prev, event.data];
                          return updated;
                        });
                      } else if (event.type === "done") {
                        console.log("Crawl done, fetching doc from Convex...");
                      } else if (event.type === "error") {
                        toast.error(`Error: ${event.data.message}`);
                        setIsLoading(false);
                      }
                    } catch (parseError) {
                      console.error(
                        "Failed to parse SSE message:",
                        line,
                        parseError
                      );
                      // Continue processing other messages
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error("Stream error:", error);
            toast.error("Stream error occurred");
            setIsLoading(false);
          }
        };

        processStream();
      } catch (error) {
        console.error("Error starting crawl:", error);
        toast.error("Failed to start crawl");
        setIsLoading(false);
      }
    }
  }

  async function handleUseStarter(starter: (typeof starterDocs)[0]) {
    if (isLoadingStarter || !user?.id) return;

    setIsLoading(true);
    setIsLoadingStarter(true);
    setShowStarterDialog(false);
    setStep(1);
    setStartCrawling(true);

    try {
      // Create doc in Convex with pre-filled data
      const docId = await mutateDoc({
        doc: {
          crawlJobId: starter.crawlJobId,
          completed: true, // Pre-filled docs are already complete
          url: starter.url,
          name: starter.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          externalId: user.id,
          pages: starter.pages.map((page) => ({
            ...page,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })),
        },
      });

      setDocId(docId);
      setDocuments(starter.pages);
      setStep(2);
      setTimeout(() => {
        if (location.pathname.includes("onboarding")) {
          navigate({ to: "/dashboard" });
        } else {
          toast.success("Pre-filled documentation added successfully");
          if (setIsOpen) {
            setIsOpen(false);
          }
        }

        setIsLoadingStarter(false);
        setStartCrawling(false);
        setIsLoading(false);
      }, 5000);
    } catch (error) {
      console.error("Error adding starter docs:", error);
      toast.error("Failed to add starter documentation");
      setIsLoadingStarter(false);
      setStartCrawling(false);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Only start polling after crawl stream is done
    if (!docId || !isCrawlDone) return;

    let intervalId: NodeJS.Timeout;

    const fetchDoc = async () => {
      const doc = await convex.query(api.docs.getDoc, {
        docId,
      });

      console.log(`Polling doc ${docId}: completed=${doc?.completed}`);

      if (doc?.completed) {
        if (intervalId) {
          clearInterval(intervalId);
          console.log("✅ Stopped polling - document processing completed");
        }

        if (location.pathname.includes("onboarding")) {
          navigate({ to: "/dashboard" });
        } else {
          toast.success("Documentation added successfully");
          if (setIsOpen) {
            setIsOpen(false);
          }
        }
        setIsLoading(false);
        setStep(3);
        setStartCrawling(false);
      }
    };

    fetchDoc();

    intervalId = setInterval(fetchDoc, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [docId, isCrawlDone, convex, navigate, setIsOpen, setStartCrawling]);

  return (
    <>
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Documentation</DialogTitle>
            <DialogDescription>
              Give your documentation a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="e.g., React Documentation"
              value={docsName}
              onChange={(e) => setDocsName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNameDialog(false);
                  setDocsName("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!docsName.trim()}>
                Start Crawling
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="h-full w-full max-w-2xl mx-auto flex flex-col">
        <div className="flex-1 pt-6 pb-20">
          <DocProgress
            step={step}
            isLoading={isLoading}
            documents={documents}
          />
          <div className="flex flex-col items-center justify-center gap-2 text-center max-w-sm mx-auto">
            <Dialog
              open={showStarterDialog}
              onOpenChange={setShowStarterDialog}
            >
              <DialogTrigger asChild>
                {isLoading ? (
                  <div></div>
                ) : (
                  <Button className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Use pre-filled docs to start quickly
                  </Button>
                )}
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Start quickly</DialogTitle>
                  <DialogDescription>
                    If you just want to try Docsbase out and don't have the time
                    to wait, you can use the following pre-filled docs
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {starterDocs.map((starter, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:border-primary transition-colors p-2"
                      onClick={() => handleUseStarter(starter)}
                    >
                      <CardHeader className="px-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-sm">
                              {starter.name}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs">
                              {starter.pages.length} pages • {starter.url}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="w-full max-w-2xl mx-auto fixed bottom-4 left-0 right-0 px-4 md:px-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isLoading) return;
              if (!isValidUrl(url)) {
                toast.error("Please enter a valid URL");
                return;
              }
              setShowNameDialog(true);
            }}
            className="flex items-center border rounded-md bg-white dark:bg-accent dark:border-ring/50 has-[input:focus]:border-ring dark:has-[input:focus]:border-ring duration-150"
          >
            <input
              type="text"
              placeholder="https://example.com/docs"
              className="w-full pl-2 py-2.5 outline-none border-none focus:ring-0 bg-transparent"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              disabled={isLoading || !url.trim()}
              size="icon"
              className="mr-1 dark:bg-white"
            >
              <ArrowUp size={18} />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
