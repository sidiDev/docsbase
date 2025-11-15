import { createFileRoute } from "@tanstack/react-router";
import Firecrawl from "@mendable/firecrawl-js";
import { extractNameFromUrl, isValidUrl } from "@/lib/utils";

export const Route = createFileRoute("/api/crawl-docs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { url } = body as { url: string };

          if (!url || !isValidUrl(url)) {
            return new Response(
              JSON.stringify({ success: false, message: "Invalid URL" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const firecrawl = new Firecrawl({
            apiKey: process.env.FIRECRAWL_API_KEY,
          });

          //   const FIRECRAWL_WEBHOOK_URL = process.env.FIRECRAWL_WEBHOOK_URL;

          const FIRECRAWL_WEBHOOK_URL =
            process.env.NODE_ENV == "development"
              ? "https://e3b629c3f0c2.ngrok-free.app/api/webhook/firecrawl"
              : process.env.FIRECRAWL_WEBHOOK_URL;

          // Start the crawl
          const { id } = await firecrawl.startCrawl(url, {
            limit: 100,
            scrapeOptions: {
              formats: ["markdown"],
            },
            sitemap: "skip",
            webhook: {
              url: FIRECRAWL_WEBHOOK_URL as string,
              events: ["completed", "started", "page", "failed"],
              metadata: { url },
            },
          });

          const name = extractNameFromUrl(url);

          // Create SSE stream to send real-time updates
          const stream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              let isClosed = false;

              const safeEnqueue = (data: string) => {
                if (!isClosed) {
                  try {
                    controller.enqueue(encoder.encode(data));
                  } catch (error) {
                    console.error("Error enqueueing data:", error);
                    isClosed = true;
                  }
                }
              };

              const safeClose = () => {
                if (!isClosed) {
                  isClosed = true;
                  controller.close();
                }
              };

              // Send initial data
              safeEnqueue(
                `data: ${JSON.stringify({
                  type: "started",
                  data: { id, url, name },
                })}\n\n`
              );

              // Set up watcher to stream documents
              console.log("Setting up watcher for crawl ID:", id);
              const watcher = firecrawl.watcher(id, {
                kind: "crawl",
                pollInterval: 2,
                timeout: 300,
              });

              watcher.on("document", (doc: any) => {
                console.log(
                  "Watcher received document:",
                  doc.metadata?.sourceURL
                );
                const now = Date.now();
                const event = {
                  type: "document",
                  data: {
                    url: doc.metadata?.sourceURL || "",
                    title: doc.metadata?.title || "Untitled",
                    content: doc.markdown || "",
                    createdAt: now,
                    updatedAt: now,
                  },
                };
                console.log("Sending document event to client");
                safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
              });

              watcher.on("done", (data: any) => {
                const event = {
                  type: "done",
                  data: {
                    total: data.total,
                    completed: data.completed,
                    creditsUsed: data.creditsUsed,
                  },
                };
                safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
                safeClose();
              });

              watcher.on("error", (error: any) => {
                const event = {
                  type: "error",
                  data: { message: error.message || "Unknown error" },
                };
                safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
                safeClose();
              });

              await watcher.start();
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (error) {
          console.error("Crawl error:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
