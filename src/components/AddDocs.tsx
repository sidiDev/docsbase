import { ArrowUp } from "lucide-react";
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
export default function AddDocs({
  setStartCrawling,
  setIsOpen,
}: {
  setIsOpen?: (isOpen: boolean) => void;
  setStartCrawling: (startCrawling: boolean) => void;
}) {
  const { user } = useUser();
  const convex = useConvex();

  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [docId, setDocId] = useState<string>("");
  const [isCrawlDone, setIsCrawlDone] = useState(false);
  const mutateDoc = useMutation(api.docs.createDoc);
  const [documents, setDocuments] = useState<
    Array<{
      url: string;
      title: string;
      content: string;
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
        const response = await fetch("/api/crawl-docs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

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
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                setStep(3);
                setIsCrawlDone(true);
                break;
              }

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const event = JSON.parse(line.slice(6));

                  if (event.type === "started" && user?.id) {
                    // Create doc in Convex
                    const docId = await mutateDoc({
                      doc: {
                        crawlJobId: event.data.id,
                        completed: false,
                        url: event.data.url,
                        name: event.data.name,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        externalId: user.id,
                        pages: [],
                      },
                    });
                    setDocId(docId);
                  } else if (event.type === "document") {
                    console.log(event.data);

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

  useEffect(() => {
    if (!docId) return;

    let intervalId: NodeJS.Timeout;

    const fetchDoc = async () => {
      const doc = await convex.query(api.docs.getDoc, {
        docId,
      });

      if (doc?.pages && doc.pages.length > 0) {
        setDocuments(doc.pages);

        if (doc.completed) {
          if (intervalId) {
            clearInterval(intervalId);
            console.log("Stopped polling - crawl completed");
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
      }
    };

    fetchDoc();

    intervalId = setInterval(fetchDoc, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [docId, convex]);

  return (
    <div className="h-full w-full max-w-2xl mx-auto flex flex-col">
      <div className="flex-1 pt-6 pb-20">
        <DocProgress step={step} isLoading={isLoading} documents={documents} />
      </div>
      <div className="w-full max-w-2xl mx-auto fixed bottom-4 left-0 right-0 px-4 md:px-0">
        <form
          onSubmit={handleSubmit}
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
  );
}
